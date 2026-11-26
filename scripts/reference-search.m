#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#import <CoreImage/CoreImage.h>

// Dataset photos are flat-lays, often with the garment lying sideways, so each one is indexed
// upright and turned a quarter turn each way. A search keeps the best of the three.
static const CGImagePropertyOrientation orientations[] = {
    kCGImagePropertyOrientationUp, kCGImagePropertyOrientationRight, kCGImagePropertyOrientationLeft,
};
static NSString *const orientationSuffixes[] = {@"", @"@right", @"@left"};
static const NSUInteger orientationCount = 3;

// Cut the subject (the garment, or a person wearing it) out of its background, crop to it, and
// place it on white. Dataset photos are shot on a studio floor and user photos anywhere, so
// comparing only the subject keeps the background from dominating the similarity score.
// Falls back to the whole photo when no subject is found.
static CIImage *liftedSubject(NSURL *url, NSError **error) {
    CIImage *original = [CIImage imageWithContentsOfURL:url options:@{kCIImageApplyOrientationProperty: @YES}];
    if (!original) return nil;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:original options:@{}];
    VNGenerateForegroundInstanceMaskRequest *request = [VNGenerateForegroundInstanceMaskRequest new];
    if (![handler performRequests:@[request] error:error]) return original;
    VNInstanceMaskObservation *subject = request.results.firstObject;
    if (!subject) return original;
    CVPixelBufferRef buffer = [subject generateMaskedImageOfInstances:subject.allInstances fromRequestHandler:handler
                                             croppedToInstancesExtent:YES error:error];
    if (!buffer) return original;
    CIImage *cutout = [CIImage imageWithCVPixelBuffer:buffer];
    CVPixelBufferRelease(buffer);
    CIImage *white = [[CIImage imageWithColor:CIColor.whiteColor] imageByCroppingToRect:cutout.extent];
    return [cutout imageByCompositingOverImage:white];
}

static VNFeaturePrintObservation *featurePrint(CIImage *image, CGImagePropertyOrientation orientation, NSError **error) {
    VNGenerateImageFeaturePrintRequest *request = [VNGenerateImageFeaturePrintRequest new];
    request.revision = VNGenerateImageFeaturePrintRequestRevision2;
    request.imageCropAndScaleOption = VNImageCropAndScaleOptionScaleFit;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:image orientation:orientation options:@{}];
    if (![handler performRequests:@[request] error:error]) return nil;
    return request.results.firstObject;
}

static int fail(NSError *error) {
    fprintf(stderr, "Reference search failed: %s\n", (error.localizedDescription ?: @"invalid input").UTF8String);
    return 1;
}

// Blur every face in the photo on this Mac, so faces never reach the cloud model. Each face box is
// widened to cover hair and ears, then replaced with a heavy blur of itself. Writes a JPEG and prints
// {"faces": n}.
static int blurFaces(NSURL *inputURL, NSURL *outputURL) {
    NSError *error = nil;
    CIImage *image = [CIImage imageWithContentsOfURL:inputURL options:@{kCIImageApplyOrientationProperty: @YES}];
    if (!image) return fail(nil);
    image = [image imageByApplyingTransform:CGAffineTransformMakeTranslation(-image.extent.origin.x, -image.extent.origin.y)];
    CGRect extent = image.extent;
    VNDetectFaceRectanglesRequest *request = [VNDetectFaceRectanglesRequest new];
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:image options:@{}];
    if (![handler performRequests:@[request] error:&error]) return fail(error);
    CIImage *result = image;
    for (VNFaceObservation *face in request.results) {
        CGRect box = VNImageRectForNormalizedRect(face.boundingBox, (size_t)extent.size.width, (size_t)extent.size.height);
        box = CGRectIntersection(CGRectInset(box, -box.size.width * 0.35, -box.size.height * 0.45), extent);
        if (CGRectIsEmpty(box)) continue;
        CGFloat radius = MAX(8, MAX(box.size.width, box.size.height) / 6);
        CIImage *blurred = [[[image imageByClampingToExtent] imageByApplyingGaussianBlurWithSigma:radius] imageByCroppingToRect:box];
        result = [blurred imageByCompositingOverImage:result];
    }
    CGColorSpaceRef space = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    BOOL written = [[CIContext context] writeJPEGRepresentationOfImage:[result imageByCroppingToRect:extent] toURL:outputURL
        colorSpace:space options:@{(id)kCGImageDestinationLossyCompressionQuality: @0.9} error:&error];
    CGColorSpaceRelease(space);
    if (!written) return fail(error);
    printf("{\"faces\":%lu}", (unsigned long)request.results.count);
    return 0;
}

static int buildIndex(NSArray<NSDictionary *> *catalog, NSURL *root, NSURL *indexURL) {
    NSMutableDictionary *index = [NSMutableDictionary dictionaryWithCapacity:catalog.count * orientationCount];
    __block NSUInteger processed = 0;
    NSObject *lock = [NSObject new];
    dispatch_apply(catalog.count, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^(size_t position) {
        @autoreleasepool {
            NSString *identifier = catalog[position][@"id"];
            NSURL *url = [root URLByAppendingPathComponent:[NSString stringWithFormat:@"images/%@.jpg", identifier]];
            NSError *error = nil;
            CIImage *subject = liftedSubject(url, &error);
            NSMutableDictionary *prints = [NSMutableDictionary dictionaryWithCapacity:orientationCount];
            for (NSUInteger turn = 0; subject && turn < orientationCount; turn++) {
                VNFeaturePrintObservation *print = featurePrint(subject, orientations[turn], &error);
                if (print) prints[[identifier stringByAppendingString:orientationSuffixes[turn]]] = print;
            }
            @synchronized (lock) {
                [index addEntriesFromDictionary:prints];
                if (prints.count < orientationCount) {
                    fprintf(stderr, "Could not index %s: %s\n", identifier.UTF8String,
                            (error.localizedDescription ?: @"unreadable image").UTF8String);
                }
                if (++processed % 250 == 0) fprintf(stderr, "Processed %lu of %lu images\n", processed, catalog.count);
            }
        }
    });
    if (index.count == 0) return fail(nil);
    NSError *error = nil;
    NSData *data = [NSKeyedArchiver archivedDataWithRootObject:index requiringSecureCoding:YES error:&error];
    if (!data || ![data writeToURL:indexURL options:NSDataWritingAtomic error:&error]) return fail(error);
    printf("Indexed %lu of %lu reference photos in %lu orientations.\n",
           index.count / orientationCount, catalog.count, orientationCount);
    return index.count == catalog.count * orientationCount ? 0 : 2;
}

static int search(NSArray<NSDictionary *> *catalog, NSURL *indexURL, NSURL *queryURL, NSString *category, float cutoff) {
    NSError *error = nil;
    CIImage *subject = liftedSubject(queryURL, &error);
    if (!subject) return fail(error);
    VNFeaturePrintObservation *query = featurePrint(subject, kCGImagePropertyOrientationUp, &error);
    if (!query) return fail(error);
    NSData *bytes = [NSData dataWithContentsOfURL:indexURL options:NSDataReadingMappedIfSafe error:&error];
    if (!bytes) return fail(error);
    NSSet *classes = [NSSet setWithArray:@[NSDictionary.class, NSString.class, VNFeaturePrintObservation.class]];
    NSDictionary<NSString *, VNFeaturePrintObservation *> *index =
        [NSKeyedUnarchiver unarchivedObjectOfClasses:classes fromData:bytes error:&error];
    if (!index) return fail(error);
    NSSet *uncategorized = [NSSet setWithArray:@[@"Not sure", @"Other", @"Skip"]];
    NSMutableArray<NSDictionary *> *matches = [NSMutableArray array];
    for (NSDictionary *entry in catalog) {
        NSString *label = entry[@"category"];
        if (![category isEqual:@"unknown"] && ![label isEqual:category] && ![uncategorized containsObject:label]) continue;
        NSString *identifier = entry[@"id"];
        float distance = INFINITY;
        for (NSUInteger turn = 0; turn < orientationCount; turn++) {
            VNFeaturePrintObservation *candidate = index[[identifier stringByAppendingString:orientationSuffixes[turn]]];
            float turned = 0;
            if (!candidate) continue;
            if (![query computeDistance:&turned toFeaturePrintObservation:candidate error:&error]) return fail(error);
            if (isfinite(turned) && turned < distance) distance = turned;
        }
        if (isfinite(distance) && distance <= cutoff) {
            [matches addObject:@{@"id": identifier, @"distance": @(distance)}];
        }
    }
    [matches sortUsingDescriptors:@[[NSSortDescriptor sortDescriptorWithKey:@"distance" ascending:YES],
                                   [NSSortDescriptor sortDescriptorWithKey:@"id" ascending:YES]]];
    NSArray *results = [matches subarrayWithRange:NSMakeRange(0, MIN(matches.count, 12))];
    NSData *json = [NSJSONSerialization dataWithJSONObject:results options:0 error:&error];
    if (!json) return fail(error);
    [NSFileHandle.fileHandleWithStandardOutput writeData:json];
    return 0;
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc < 3) return fail(nil);
        NSString *action = @(argv[1]);
        if ([action isEqual:@"blur-faces"] && argc == 4) {
            return blurFaces([NSURL fileURLWithPath:@(argv[2])], [NSURL fileURLWithPath:@(argv[3])]);
        }
        NSURL *root = [NSURL fileURLWithPath:@(argv[2]) isDirectory:YES];
        NSError *error = nil;
        NSData *manifest = [NSData dataWithContentsOfURL:[root URLByAppendingPathComponent:@"catalog.json"]
                                                  options:0 error:&error];
        if (!manifest) return fail(error);
        NSArray *catalog = [NSJSONSerialization JSONObjectWithData:manifest options:0 error:&error];
        if (![catalog isKindOfClass:NSArray.class]) return fail(error);
        NSURL *indexURL = [root URLByAppendingPathComponent:@"features-v4.archive"];
        if ([action isEqual:@"index"] && argc == 3) return buildIndex(catalog, root, indexURL);
        if ([action isEqual:@"search"] && argc == 6) {
            char *end;
            float cutoff = strtof(argv[5], &end);
            if (end == argv[5] || *end || !isfinite(cutoff) || cutoff <= 0) return fail(nil);
            return search(catalog, indexURL, [NSURL fileURLWithPath:@(argv[3])], @(argv[4]), cutoff);
        }
        return fail(nil);
    }
}
