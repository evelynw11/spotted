#import <Foundation/Foundation.h>
#import <Vision/Vision.h>

// Dataset photos are flat-lays, often with the garment lying sideways, so each one is indexed
// upright and turned a quarter turn each way. A search keeps the best of the three.
static const CGImagePropertyOrientation orientations[] = {
    kCGImagePropertyOrientationUp, kCGImagePropertyOrientationRight, kCGImagePropertyOrientationLeft,
};
static NSString *const orientationSuffixes[] = {@"", @"@right", @"@left"};
static const NSUInteger orientationCount = 3;

static VNFeaturePrintObservation *featurePrint(NSURL *url, CGImagePropertyOrientation orientation, NSError **error) {
    VNGenerateImageFeaturePrintRequest *request = [VNGenerateImageFeaturePrintRequest new];
    request.revision = VNGenerateImageFeaturePrintRequestRevision2;
    request.imageCropAndScaleOption = VNImageCropAndScaleOptionScaleFit;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithURL:url orientation:orientation options:@{}];
    if (![handler performRequests:@[request] error:error]) return nil;
    return request.results.firstObject;
}

static int fail(NSError *error) {
    fprintf(stderr, "Reference search failed: %s\n", (error.localizedDescription ?: @"invalid input").UTF8String);
    return 1;
}

static int buildIndex(NSArray<NSDictionary *> *catalog, NSURL *root, NSURL *indexURL) {
    NSMutableDictionary *index = [NSMutableDictionary dictionaryWithCapacity:catalog.count];
    NSUInteger processed = 0;
    for (NSDictionary *entry in catalog) {
        @autoreleasepool {
            NSString *identifier = entry[@"id"];
            NSURL *image = [root URLByAppendingPathComponent:[NSString stringWithFormat:@"images/%@.jpg", identifier]];
            for (NSUInteger turn = 0; turn < orientationCount; turn++) {
                NSError *error = nil;
                VNFeaturePrintObservation *print = featurePrint(image, orientations[turn], &error);
                if (print) index[[identifier stringByAppendingString:orientationSuffixes[turn]]] = print;
                else fprintf(stderr, "Could not index %s: %s\n", identifier.UTF8String,
                             (error.localizedDescription ?: @"unreadable image").UTF8String);
            }
        }
        if (++processed % 500 == 0) fprintf(stderr, "Processed %lu of %lu images\n", processed, catalog.count);
    }
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
    VNFeaturePrintObservation *query = featurePrint(queryURL, kCGImagePropertyOrientationUp, &error);
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
        NSURL *root = [NSURL fileURLWithPath:@(argv[2]) isDirectory:YES];
        NSError *error = nil;
        NSData *manifest = [NSData dataWithContentsOfURL:[root URLByAppendingPathComponent:@"catalog.json"]
                                                  options:0 error:&error];
        if (!manifest) return fail(error);
        NSArray *catalog = [NSJSONSerialization JSONObjectWithData:manifest options:0 error:&error];
        if (![catalog isKindOfClass:NSArray.class]) return fail(error);
        NSURL *indexURL = [root URLByAppendingPathComponent:@"features-v3.archive"];
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
