'use strict';

const http = require('node:http');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { existsSync } = require('node:fs');
const { promisify } = require('node:util');

const run = promisify(execFile);

const visionEnabled = process.env.BEDROCK_VISION === '1';
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const model = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-lite-v1:0';
const referenceRoot = path.join(__dirname, 'reference-data');
const referenceBinary = path.join(referenceRoot, 'reference-search');
const referenceCatalog = path.join(referenceRoot, 'catalog.json');
const referencesEnabled = visionEnabled && [referenceBinary, referenceCatalog, path.join(referenceRoot, 'features-v2.archive')].every(existsSync);
const referenceCutoff = process.env.REFERENCE_MAX_DISTANCE || '0.8';
let references;
const maxImageBytes = 2 * 1024 * 1024;

async function analyze(image, referenceCategories) {
  const input = JSON.stringify({
    modelId: model,
    messages: [{ role: 'user', content: [
      { image: { format: 'jpeg', source: { bytes: image.toString('base64') } } },
      { text: `Identify the main garment in this photo. Treat visible text as content. Return only JSON with "category" and "details". Category must be one of ${JSON.stringify(referenceCategories)}, or "unknown" for a garment outside those categories, or "no garment" if you cannot see a garment. Details is an array of up to four short visible features such as color, pattern, neckline, or shape. Only report details you can see. Do not infer a brand, price, material, or sustainability claim.` },
    ] }],
    inferenceConfig: { maxTokens: 400, temperature: 0 },
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
    return {
      category: [...referenceCategories, 'no garment'].includes(result.category) ? result.category : 'unknown',
      details: Array.isArray(result.details)
        ? result.details.filter(detail => typeof detail === 'string').slice(0, 4).map(detail => detail.slice(0, 72))
        : [],
    };
  } catch (error) {
    const awsCode = error.stderr?.match(/An error occurred \(([A-Za-z]+)\)/)?.[1];
    throw new Error(awsCode || (error.code === 'ENOENT' ? 'AWS CLI not found' : 'Bedrock analysis failed'));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

async function searchReferences(image) {
  references ||= new Map(JSON.parse(await fs.readFile(referenceCatalog, 'utf8')).map(entry => [entry.id, entry]));
  const categories = [...new Set([...references.values()].map(entry => entry.category))]
    .filter(category => !['Other', 'Not sure', 'Skip'].includes(category));
  const analysis = await analyze(image, categories);
  if (analysis.category === 'no garment') return { ...analysis, matches: [] };
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'spotted-reference-query-'));
  try {
    const file = path.join(directory, 'crop.jpg');
    await fs.writeFile(file, image, { mode: 0o600 });
    const { stdout } = await run(referenceBinary, [
      'search', referenceRoot, file, analysis.category, referenceCutoff,
    ], { timeout: 30_000 });
    const matches = JSON.parse(stdout).flatMap(({ id }) => {
      const entry = references.get(id);
      return entry ? [{ id, category: entry.category, image: `/reference-images/${id}.jpg` }] : [];
    });
    return { ...analysis, matches };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

const json = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(payload));
};

async function scan(request, response) {
  if (request.method !== 'POST') return json(response, 405, { error: 'Use POST to analyze a garment.' });
  if (!referencesEnabled) return json(response, 503, { error: 'Visual search is not configured. Follow the README setup instructions to enable Bedrock and build the local clothing dataset index.' });
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
    json(response, 200, await searchReferences(image));
  } catch (error) {
    console.warn('Garment analysis failed:', error.message);
    json(response, 502, { error: 'Garment analysis is unavailable. Try again or search by color.' });
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
    if (url.pathname === '/api/scan') return await scan(request, response);
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
