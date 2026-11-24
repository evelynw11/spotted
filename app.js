'use strict';

const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const app = $('#app');
app.innerHTML = `
  <section class="search-page">
    <header class="page-header">
      <a class="wordmark" href="/" aria-label="Spotted home">Spotted</a>
      <h1>Find clothes from a photo</h1>
      <p>Upload an image to identify the garment and find visually similar items in the local clothing dataset.</p>
    </header>
    <section class="search-panel" aria-label="Image search">
      <label class="upload" id="upload">
        <input id="imageFile" type="file" accept="image/*" aria-label="Choose an image">
        <span class="upload-icon" aria-hidden="true">↑</span>
        <strong>Choose or drop an image</strong>
        <span>JPG, PNG, or another browser-supported image format</span>
      </label>
      <figure class="preview" id="preview" hidden>
        <img id="photoPreview" alt="Selected image">
        <button class="text-button" type="button" id="clearImage">Choose another image</button>
      </figure>
      <p class="privacy">The image is sent to Amazon Bedrock for garment identification. Visual matching runs against the locally stored clothing dataset.</p>
      <p class="setup-notice" id="setupNotice" ${window.__REFERENCE_SEARCH ? 'hidden' : ''}>
        Visual search is not configured. Follow the setup instructions in the README to enable Bedrock and build the local dataset index.
      </p>
      <button class="search-button" id="searchButton" type="button" disabled>Find similar items</button>
      <p class="status" id="status" role="status" aria-live="polite"></p>
    </section>
    <section class="results" id="results" aria-live="polite"></section>
    <footer>Results are visual references from the clothing dataset, not verified product listings. The dataset does not provide brands, prices, materials, or sustainability claims.</footer>
  </section>`;

const upload = $('#upload');
const imageFile = $('#imageFile');
const preview = $('#preview');
const photoPreview = $('#photoPreview');
const searchButton = $('#searchButton');
const status = $('#status');
const results = $('#results');
let imageUrl = null;
let currentImage = null;
let searching = false;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function clearImage() {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = null;
  currentImage = null;
  imageFile.value = '';
  photoPreview.removeAttribute('src');
  preview.hidden = true;
  upload.hidden = false;
  results.replaceChildren();
  setStatus('');
  searchButton.disabled = true;
}

async function selectImage(file) {
  if (!file || !file.type.startsWith('image/')) {
    imageFile.value = '';
    setStatus('Choose a supported image file.', true);
    return;
  }
  if (file.size > 15 * 1024 * 1024) {
    imageFile.value = '';
    setStatus('Choose an image smaller than 15 MB.', true);
    return;
  }

  clearImage();
  imageUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    currentImage = image;
    photoPreview.src = imageUrl;
    preview.hidden = false;
    upload.hidden = true;
    searchButton.disabled = !window.__REFERENCE_SEARCH;
    setStatus(window.__REFERENCE_SEARCH ? 'Image ready to search.' : 'Image selected. Configure visual search to find matches.');
  } catch {
    clearImage();
    setStatus('Could not read that image. Choose a JPG, PNG, or another supported image.', true);
  }
}

async function searchImage() {
  if (!currentImage || searching) return;
  if (!window.__REFERENCE_SEARCH) {
    setStatus('Visual search is not configured. Follow the setup instructions in the README.', true);
    return;
  }

  searching = true;
  searchButton.disabled = true;
  setStatus('Analyzing the garment and searching local references…');
  results.replaceChildren();
  try {
    const { naturalWidth, naturalHeight } = currentImage;
    const scale = Math.min(1, 1024 / Math.max(naturalWidth, naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));
    canvas.getContext('2d').drawImage(currentImage, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!jpeg) throw new Error('Could not prepare the image for search.');

    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: jpeg,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Visual search failed.');
    renderResults(payload);
  } catch (error) {
    setStatus(error.message || 'Visual search failed. Try another image.', true);
  } finally {
    searching = false;
    searchButton.disabled = !currentImage || !window.__REFERENCE_SEARCH;
  }
}

function renderResults({ category, details, matches }) {
  const description = details.length
    ? `<p class="details">${details.map(esc).join(' · ')}</p>`
    : '';
  const title = category === 'no garment'
    ? 'No garment detected'
    : category === 'unknown' ? 'Garment category unclear' : `Detected: ${esc(category)}`;

  if (!matches.length) {
    results.innerHTML = `<h2>${title}</h2>${description}<p class="empty-results">No close visual matches found in the local dataset.</p>`;
    setStatus('Search complete.');
    return;
  }

  results.innerHTML = `
    <h2>${title}</h2>
    ${description}
    <p class="result-count">${matches.length} visually similar reference ${matches.length === 1 ? 'image' : 'images'}</p>
    <div class="result-grid">${matches.map(match => `
      <article class="result-card">
        <img src="${esc(match.image)}" alt="${esc(match.category)} reference garment" loading="lazy">
        <h3>${esc(match.category)}</h3>
      </article>`).join('')}
    </div>`;
  setStatus('Search complete.');
}

imageFile.addEventListener('change', () => selectImage(imageFile.files[0]));
$('#clearImage').addEventListener('click', clearImage);
searchButton.addEventListener('click', searchImage);
upload.addEventListener('dragover', event => {
  event.preventDefault();
  upload.classList.add('dragging');
});
upload.addEventListener('dragleave', () => upload.classList.remove('dragging'));
upload.addEventListener('drop', event => {
  event.preventDefault();
  upload.classList.remove('dragging');
  selectImage(event.dataTransfer.files[0]);
});
