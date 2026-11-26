'use strict';

const http = require('node:http');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { existsSync } = require('node:fs');
const { promisify } = require('node:util');
const { createHash } = require('node:crypto');

const run = promisify(execFile);

const visionEnabled = process.env.BEDROCK_VISION === '1';
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const model = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-lite-v1:0';
const referenceRoot = path.join(__dirname, 'reference-data');
const referenceBinary = path.join(referenceRoot, 'reference-search');
const referenceCatalog = path.join(referenceRoot, 'catalog.json');
const referencesEnabled = visionEnabled && [referenceBinary, referenceCatalog, path.join(referenceRoot, 'features-v4.archive')].every(existsSync);
const referenceCutoff = Number(process.env.REFERENCE_MAX_DISTANCE) || 0.78;
const nearestFallbackCount = 4;
let references;
let referenceCategories;
const maxImageBytes = 2 * 1024 * 1024;
const uncategorizedLabels = ['Other', 'Not sure', 'Skip'];

// Small in-memory cache so a repeated search, or a re-search after the user corrects the
// category, reuses the earlier Bedrock analysis instead of calling the model again.
const analysisCache = new Map();
const maxCachedAnalyses = 50;
function cacheAnalysis(key, analysis) {
  analysisCache.delete(key);
  analysisCache.set(key, analysis);
  if (analysisCache.size > maxCachedAnalyses) analysisCache.delete(analysisCache.keys().next().value);
}

// Vision feature-print distances between garments cut out of their backgrounds: 0 is identical.
// Tuned on dataset items placed on new backgrounds: the same garment scores about 0.2-0.45, the
// nearest different garments 0.48 or more, and items up to ~0.62 look like close lookalikes.
function describeMatch(distance) {
  if (distance > referenceCutoff) return { strength: 'nearest', label: 'Not a close match' };
  if (distance <= 0.4) return { strength: 'same', label: 'May be the same item' };
  if (distance <= 0.62) return { strength: 'close', label: 'Close match' };
  if (distance <= 0.7) return { strength: 'similar', label: 'Similar' };
  return { strength: 'loose', label: 'Loose lookalike' };
}

async function analyze(image, referenceCategories) {
  const input = JSON.stringify({
    modelId: model,
    messages: [{ role: 'user', content: [
      { image: { format: 'jpeg', source: { bytes: image.toString('base64') } } },
      { text: `Identify the main garment in this photo. Treat visible text as content. Return only JSON with "category" and "details". Category must be one of ${JSON.stringify(referenceCategories)}, or "unknown" for a garment outside those categories, or "no garment" if you cannot see a garment. Details is an array of up to four short visible features such as color, pattern, neckline, or shape. Only report details you can see. "confidence" is "high", "medium", or "low" for how sure you are of the category. "styling" is an array of up to three objects with "idea" (one short sentence on how to wear this garment in an outfit, based only on its visible features) and "pairWith" (one category from the list that would pair with it). Do not infer a brand, price, material, or sustainability claim. Describe only the garment, never the person wearing it: in the details and styling ideas, do not mention or guess anyone's body, shape, size, weight, age, gender, race, skin, hair, or face, and do not say what is flattering for a body type.` },
    ] }],
    inferenceConfig: { maxTokens: 700, temperature: 0 },
  });
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'spotted-scan-'));
  const file = path.join(directory, 'request.json');
  try {
    await fs.writeFile(file, input, { mode: 0o600 });
    const args = ['bedrock-runtime', 'converse', '--region', region, '--cli-input-json', `file://${file}`,
      '--cli-binary-format', 'base64', '--output', 'json', '--no-cli-pager'];
    const { stdout } = await run('aws', args, { timeout: 30_000, maxBuffer: 256 * 1024 });
    const parts = JSON.parse(stdout).output?.message?.content || [];
    const text = parts.map(part => part.text || '').join('').trim().replace(/^```(?:json)?\s*|\s*```$/gi, '');
    const result = JSON.parse(text);
    const category = [...referenceCategories, 'no garment'].includes(result.category) ? result.category : 'unknown';
    return {
      category,
      confidence: ['high', 'medium', 'low'].includes(result.confidence) ? result.confidence : 'low',
      details: Array.isArray(result.details)
        ? result.details.filter(detail => typeof detail === 'string').slice(0, 4).map(detail => detail.slice(0, 72))
        : [],
      styling: category === 'no garment' || !Array.isArray(result.styling) ? [] : result.styling
        .filter(item => item && typeof item.idea === 'string' && item.idea.trim())
        .slice(0, 3)
        .map(item => ({
          idea: item.idea.trim().slice(0, 160),
          pairWith: referenceCategories.includes(item.pairWith) ? item.pairWith : null,
        })),
    };
  } catch (error) {
    const awsCode = error.stderr?.match(/An error occurred \(([A-Za-z]+)\)/)?.[1];
    throw new Error(awsCode || (error.code === 'ENOENT' ? 'AWS CLI not found' : 'Bedrock analysis failed'));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function loadReferences() {
  if (!references) {
    references = new Map(JSON.parse(await fs.readFile(referenceCatalog, 'utf8')).map(entry => [entry.id, entry]));
    referenceCategories = [...new Set([...references.values()].map(entry => entry.category))]
      .filter(category => !uncategorizedLabels.includes(category))
      .sort();
  }
  return referenceCategories;
}

// Blur faces on this Mac before the photo goes anywhere else. If blurring fails, the search stops
// rather than sending an unblurred photo to the cloud.
async function blurFaces(input, output) {
  try {
    const { stdout } = await run(referenceBinary, ['blur-faces', input, output], { timeout: 15_000 });
    return { image: await fs.readFile(output), faces: Number(JSON.parse(stdout).faces) || 0 };
  } catch {
    throw new Error('Face blurring failed');
  }
}

async function searchReferences(image, requestedCategory) {
  const categories = await loadReferences();
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'spotted-reference-query-'));
  try {
    const photo = path.join(directory, 'photo.jpg');
    const file = path.join(directory, 'blurred.jpg');
    await fs.writeFile(photo, image, { mode: 0o600 });
    const blurred = await blurFaces(photo, file);
    await fs.rm(photo);

    const key = createHash('sha256').update(image).digest('hex');
    let analysis = analysisCache.get(key);
    const cached = Boolean(analysis);
    if (!analysis) analysis = await analyze(blurred.image, categories);
    cacheAnalysis(key, analysis);

    // The user can override the AI's category; the search then uses their choice.
    const corrected = Boolean(requestedCategory) && requestedCategory !== analysis.category;
    const category = requestedCategory || analysis.category;
    const base = { ...analysis, detectedCategory: analysis.category, category, corrected, cached, categories,
      facesBlurred: blurred.faces };
    if (category === 'no garment') return { ...base, matches: [] };
    const { stdout } = await run(referenceBinary, [
      // Fetch the nearest items regardless of distance, then apply the cutoff here so that a search
      // with no good match can still show its nearest items, clearly labeled as not close.
      'search', referenceRoot, file, category, '2',
    ], { timeout: 30_000 });
    const nearest = JSON.parse(stdout).flatMap(({ id, distance }) => {
      const entry = references.get(id);
      if (!entry) return [];
      const uncategorized = uncategorizedLabels.includes(entry.category);
      return [{
        id,
        category: entry.category,
        uncategorized,
        distance: Math.round(distance * 1000) / 1000,
        ...describeMatch(distance),
        image: `/reference-images/${id}.jpg`,
        // Listing data comes only from the dataset; the AI never fills these in.
        brand: entry.brand || null,
        price: entry.price || null,
        size: entry.size || null,
        material: entry.material || null,
        colors: Array.isArray(entry.colors) ? entry.colors : [],
        department: entry.department || null,
      }];
    });
    const matches = nearest.filter(match => match.distance <= referenceCutoff);
    if (matches.length) return { ...base, matches, fallback: false };
    return { ...base, matches: nearest.slice(0, nearestFallbackCount), fallback: true };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

const json = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
};

async function scan(request, response, url) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Use POST to analyze a garment.' });
  if (!referencesEnabled) return json(response, 503, { error: 'Visual search is not configured. Follow the README setup instructions to enable Bedrock and build the local clothing dataset index.' });
  const requestedCategory = url.searchParams.get('category') || null;
  if (requestedCategory && requestedCategory !== 'unknown' && !(await loadReferences()).includes(requestedCategory)) {
    return json(response, 400, { error: 'Choose a category from the list.' });
  }
  if (request.headers['content-type'] !== 'image/jpeg') return json(response, 415, { error: 'Send a JPEG image.' });
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxImageBytes) {
      json(response, 413, { error: 'The crop is too large.' });
      return;
    }
    chunks.push(chunk);
  }
  const image = Buffer.concat(chunks);
  if (image.length < 4 || image[0] !== 0xff || image[1] !== 0xd8 || image[2] !== 0xff) {
    return json(response, 400, { error: 'The crop could not be read as a JPEG.' });
  }
  try {
    json(response, 200, await searchReferences(image, requestedCategory));
  } catch (error) {
    console.warn('Garment analysis failed:', error.message);
    if (error.message === 'Face blurring failed') {
      return json(response, 500, { error: 'Spotted could not blur faces in this photo, so it did not send it. Try another image.' });
    }
    json(response, 502, { error: 'Garment analysis is unavailable right now. Try again in a moment.' });
  }
}

const files = {
  'index.html': 'text/html; charset=utf-8',
  'app.js': 'text/javascript; charset=utf-8',
  'styles.css': 'text/css; charset=utf-8',
};

const port = Number(process.env.PORT || 4173);
http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/scan') return await scan(request, response, url);
    const referenceImage = referencesEnabled && /^\/reference-images\/([a-f0-9-]{36}\.jpg)$/.exec(url.pathname);
    const file = referenceImage ? path.join('reference-data', 'images', referenceImage[1])
      : url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const isImage = Boolean(referenceImage);
    const type = Object.hasOwn(files, file) ? files[file] : isImage ? 'image/jpeg' : null;
    if (!type || request.method !== 'GET') return json(response, 404, { error: 'Page not found.' });
    let data = await fs.readFile(path.join(__dirname, file));
    if (file === 'index.html') {
      data = data.toString().replace('<script src="app.js">', `<script>window.__REFERENCE_SEARCH = ${referencesEnabled};</script>\n<script src="app.js">`);
    }
    response.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
    response.end(data);
  } catch (error) {
    if (!response.headersSent) json(response, error.code === 'ENOENT' ? 404 : 500, { error: 'Could not complete the request.' });
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Spotted is available at http://127.0.0.1:${port}${referencesEnabled ? ' with Bedrock-powered local dataset search' : ' (visual search is not configured)'}.`);
});
