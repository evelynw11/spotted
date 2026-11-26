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
      <p>Upload a photo of a garment. Spotted names what it sees, finds visually similar pieces, and suggests ways to style it.</p>
    </header>
    <section class="capabilities" aria-label="What Spotted can and cannot do">
      <div>
        <h2>What Spotted can do</h2>
        <ul>
          <li>Identify the main garment in your photo (for example, a dress or hoodie)</li>
          <li>Find similar second-hand pieces in its dataset, with the brand, size, material, and a suggested price band for each</li>
          <li>Suggest outfit ideas based on what is visible</li>
        </ul>
      </div>
      <div>
        <h2>What it cannot do yet</h2>
        <ul>
          <li>Find the exact item, or show live prices. Prices are suggestions recorded by second-hand sorters</li>
          <li>Search the live web or link to a store. Results come from the dataset only</li>
          <li>Always get the category right. You can correct it</li>
        </ul>
      </div>
    </section>
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
      <p class="privacy">Before your photo leaves this Mac, Spotted blurs any faces and removes hidden details such as location. It then sends the photo once to Amazon Bedrock, in your own AWS account, to identify the garment. The AI is told to describe only the clothes, never the person. Spotted does not save your photo, and Bedrock does not use it to train models. Matching against the clothing dataset happens on this Mac.</p>
      <p class="setup-notice" id="setupNotice" ${window.__REFERENCE_SEARCH ? 'hidden' : ''}>
        Visual search is not configured. Follow the setup instructions in the README to enable Bedrock and build the local dataset index.
      </p>
      <button class="search-button" id="searchButton" type="button" disabled>Find similar items</button>
      <p class="status" id="status" role="status" aria-live="polite"></p>
    </section>
    <section class="results" id="results" aria-live="polite"></section>
    <footer>Results come from the <a href="https://zenodo.org/records/8386668">Clothing Dataset for Second-Hand Fashion</a> (Wargön Innovation and RISE, CC BY 4.0). They are not live listings. Brand, size, material, and price come from the dataset's annotators, not from the AI. Prices are suggested price bands, not what any store charges.</footer>
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
let currentJpeg = null;
let searching = false;

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function clearImage() {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = null;
  currentImage = null;
  currentJpeg = null;
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

async function prepareJpeg() {
  const { naturalWidth, naturalHeight } = currentImage;
  const scale = Math.min(1, 1024 / Math.max(naturalWidth, naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(naturalHeight * scale));
  canvas.getContext('2d').drawImage(currentImage, 0, 0, canvas.width, canvas.height);
  const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!jpeg) throw new Error('Could not prepare the image for search.');
  return jpeg;
}


async function searchImage(category = null) {
  if (!currentImage || searching) return;
  if (!window.__REFERENCE_SEARCH) {
    setStatus('Visual search is not configured. Follow the setup instructions in the README.', true);
    return;
  }

  searching = true;
  searchButton.disabled = true;
  setStatus(category
    ? `Searching for ${category === 'unknown' ? 'any category' : category} references…`
    : 'Identifying the garment and searching the dataset…');
  if (!category) results.replaceChildren();
  results.setAttribute('aria-busy', 'true');
  try {
    currentJpeg ||= await prepareJpeg();
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`/api/scan${query}`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/jpeg' },
      body: currentJpeg,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Visual search failed.');
    renderResults(payload);
  } catch (error) {
    setStatus(error.message || 'Visual search failed. Try another image.', true);
  } finally {
    searching = false;
    results.removeAttribute('aria-busy');
    searchButton.disabled = !currentImage || !window.__REFERENCE_SEARCH;
  }
}

const confidenceText = {
  high: 'The AI is fairly sure about this.',
  medium: 'The AI is somewhat sure. Check that this is right.',
  low: 'The AI is unsure. Please confirm or change the category.',
};

const strengthHelp = {
  same: 'Nearly identical garment. This may be the same item.',
  close: 'Very similar shape, color, and pattern.',
  similar: 'Similar overall look, with some visible differences.',
  loose: 'Only loosely similar. Shares some visual traits.',
  nearest: 'Below the similarity cutoff. Shown because nothing closer was found.',
};

function categoryLabel(category) {
  if (category === 'no garment') return 'No garment detected';
  if (category === 'unknown') return 'Category unclear';
  return category;
}

let seenDetails = [];

function sharedColors(match) {
  const seenText = seenDetails.join(' ').toLowerCase();
  return match.colors.filter(color => {
    const word = color.toLowerCase().replace(/[^a-z ]/g, '').trim();
    return word && new RegExp(`\\b${word}\\b`).test(seenText);
  });
}

function facts(match) {
  const rows = [
    ['Price', match.price && `${match.price} (suggested)`],
    ['Size', match.size],
    ['Material', match.material],
    ['Color', match.colors.join(', ')],
  ].filter(([, value]) => value);
  return rows.length
    ? `<dl class="facts">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`
    : '';
}

function whyText(match, category) {
  const reasons = [];
  if (match.uncategorized) reasons.push('No category label in the dataset. Included on visual similarity alone.');
  else if (category !== 'unknown') reasons.push(`Same category as your item (${match.category}).`);
  else reasons.push(`Dataset category: ${match.category}.`);
  const shared = sharedColors(match);
  if (shared.length) reasons.push(`Shares the color${shared.length > 1 ? 's' : ''} the AI saw: ${shared.join(', ').toLowerCase()}.`);
  reasons.push(strengthHelp[match.strength]);
  return reasons.map(reason => `<li>${esc(reason)}</li>`).join('');
}

function renderResults(payload) {
  const { category, detectedCategory, confidence, details, matches, styling, categories, corrected } = payload;
  seenDetails = details;
  const options = ['unknown', ...categories]
    .map(value => `<option value="${esc(value)}" ${value === category ? 'selected' : ''}>${esc(value === 'unknown' ? 'Any category' : value)}</option>`)
    .join('');

  // G11 (make clear why) + G9 (support efficient correction): show what the AI saw, how sure it
  // was, and let the user fix the category and search again without re-uploading.
  const seen = `
    <section class="seen ${!corrected && confidence === 'low' ? 'needs-check' : ''}" aria-labelledby="seenTitle">
      <div class="seen-text">
        <p class="eyebrow">${corrected ? 'You chose' : 'What the AI sees'}</p>
        <h2 id="seenTitle">${esc(categoryLabel(category))}</h2>
        ${corrected
          ? `<p class="hint">You changed this from “${esc(categoryLabel(detectedCategory))}”. Results use your choice.</p>`
          : `<p class="hint">${esc(confidenceText[confidence] || confidenceText.low)}</p>`}
        ${details.length ? `<ul class="details" aria-label="Visible details">${details.map(detail => `<li>${esc(detail)}</li>`).join('')}</ul>` : ''}
      </div>
      <form class="correct" id="correctForm">
        <label for="categorySelect">${category === 'no garment' ? 'See a garment? Pick its category' : 'Not right? Change the category'}</label>
        <div class="correct-row">
          <select id="categorySelect">${category === 'no garment' ? '<option value="" selected disabled>Choose…</option>' : ''}${options}</select>
          <button type="submit">Search again</button>
        </div>
        ${corrected ? `<button type="button" class="text-button" id="undoCorrection">Use the AI’s category</button>` : ''}
      </form>
    </section>`;

  let matchesHtml;
  if (category === 'no garment') {
    matchesHtml = '<p class="empty-results">The AI did not find a garment in this photo. If there is one, pick its category above, or try a photo where the garment fills more of the frame.</p>';
  } else if (!matches.length) {
    matchesHtml = `<p class="empty-results">No close visual matches in the dataset${category !== 'unknown' ? ` for ${esc(category)}` : ''}. Try “Any category” above, or a clearer photo of the garment.</p>`;
  } else {
    matchesHtml = `
      <div class="results-head">
        <h2>${payload.fallback ? 'Nearest items' : 'Similar pieces'}</h2>
        <p class="result-count">${matches.length} ${matches.length === 1 ? 'item' : 'items'}, most similar first</p>
      </div>
      <div class="result-grid">${matches.map(match => `
        <article class="result-card">
          <img src="${esc(match.image)}" alt="${esc(match.uncategorized ? 'Uncategorized' : match.category)} reference photo" loading="lazy">
          <div class="card-body">
            <h3>${esc(match.brand || 'Brand not recorded')}</h3>
            <p class="item-type">${esc([match.department, match.uncategorized ? 'Uncategorized' : match.category].filter(Boolean).join(' · '))}</p>
            ${facts(match)}
            <details>
              <summary>Why this match?</summary>
              <ul>${whyText(match, category)}</ul>
            </details>
          </div>
        </article>`).join('')}
      </div>`;
  }

  // Styling ideas came from the AI's original read, so they are hidden once the user overrides it.
  const stylingHtml = styling?.length && !corrected ? `
    <section class="styling" aria-labelledby="stylingTitle">
      <h2 id="stylingTitle">Ways to style it</h2>
      <p class="hint">AI-generated ideas based only on the visible details above. They are suggestions, not product picks.</p>
      <ul>${styling.map(item => `
        <li>
          <p>${esc(item.idea)}</p>
          ${item.pairWith ? `<span class="chip">Pairs with: ${esc(item.pairWith)}</span>` : ''}
        </li>`).join('')}
      </ul>
    </section>` : '';

  results.innerHTML = seen + matchesHtml + stylingHtml;

  $('#correctForm').addEventListener('submit', event => {
    event.preventDefault();
    const value = $('#categorySelect').value;
    if (value && value !== category) searchImage(value);
  });
  $('#undoCorrection')?.addEventListener('click', () => searchImage(detectedCategory));
  const faces = payload.facesBlurred;
  const blurNote = faces ? ` Blurred ${faces === 1 ? '1 face' : `${faces} faces`} on this Mac before sending.` : '';
  setStatus((payload.cached ? 'Search complete. Reused the earlier analysis of this photo.' : 'Search complete.') + blurNote);
}

imageFile.addEventListener('change', () => selectImage(imageFile.files[0]));
$('#clearImage').addEventListener('click', clearImage);
searchButton.addEventListener('click', () => searchImage());
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
