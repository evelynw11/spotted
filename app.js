'use strict';
/* Spotted: clickable prototype. Every "AI" output here is scripted demo data.
   Swap points for real models are marked with  // LIVE:  comments. */

const IMG = k => `img/${k}.jpg`;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const clone = o => JSON.parse(JSON.stringify(o));
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- icons ---------- */
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  minus: '<path d="M5 12h14"/>',
  question: '<path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  up: '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  down: '<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.8-1.2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  compare: '<rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="16" rx="1.5"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  hanger: '<path d="M12 7.5a2 2 0 1 1 2-2c0 .9-.6 1.4-1.3 1.9-.5.3-.7.7-.7 1.1V9"/><path d="M12 9 3.4 15.2A1.5 1.5 0 0 0 4.3 18h15.4a1.5 1.5 0 0 0 .9-2.8Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const ic = (n, s = 16) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;

/* ---------- demo data ---------- */
const LABELS = {
  cream: 'Cream', ivory: 'Ivory', white: 'Bright white', beige: 'Oatmeal / beige',
  cable: 'Cable knit', chunky: 'Chunky cable', ribbed: 'Fine rib',
  v: 'V-neck', crew: 'Crew neck',
  pearl: 'Pearl-style', mop: 'Mother-of-pearl', gold: 'Gold metal', tortoise: 'Tortoiseshell', plastic: 'Plain plastic',
  cropped: 'Cropped', hip: 'Hip length',
  brownplaid: 'Brown & cream plaid', beigeplaid: 'Light beige plaid',
  knife: 'Knife pleats', kilt: 'Kilt pleats (wrap)', none: 'No pleats',
  mini: 'Mini', knee: 'Knee length',
  plainwb: 'Plain waistband', buckle: 'Side buckle', zip: 'Side zip',
  natural: 'Natural / undyed', canvas: 'Heavy canvas', nologo: 'No visible logo',
  black: 'Black', penny: 'Penny loafer', lug: 'Chunky lug sole', flat: 'Flat sole',
  unknown: "Can't tell from photo",
};
const SIM = {
  'cream|ivory': .9, 'cream|white': .5, 'cream|beige': .5, 'ivory|white': .7, 'ivory|beige': .5, 'white|beige': .2,
  'cable|chunky': .6, 'pearl|mop': .75, 'pearl|plastic': .25, 'mop|plastic': .4,
  'brownplaid|beigeplaid': .6, 'knife|kilt': .8, 'plainwb|buckle': .5, 'plainwb|zip': .7, 'lug|flat': .4,
};
const sim = (a, b) => a === b ? 1 : (SIM[a + '|' + b] ?? SIM[b + '|' + a] ?? 0);

const HERO_RATIO = 733 / 1100; // width / height of hero.jpg
const BLURS = [{ l: 45.2, t: 7.2, w: 13.6, h: 10.4 }, { l: 81, t: 28.2, w: 6.6, h: 4.8 }];

// LIVE: replace ITEMS with the output of a vision model that returns boxes + attributes + confidence.
const ITEMS = {
  cardigan: {
    label: 'Cardigan', name: 'Cropped cream cable-knit cardigan', conf: 94, box: { l: 28.5, t: 20.5, w: 43, h: 30 },
    confNote: 'Front-facing, well lit, and a big part of the photo, so I can see most details.',
    attrs: [
      { key: 'color', label: 'Color', value: 'cream', conf: 'high', w: 2, note: 'Warm afternoon light can make white look creamier.', options: ['cream', 'ivory', 'white', 'beige'] },
      { key: 'knit', label: 'Knit', value: 'cable', conf: 'high', w: 2, options: ['cable', 'chunky', 'ribbed'] },
      { key: 'neck', label: 'Neckline', value: 'v', conf: 'high', w: 1, options: ['v', 'crew'] },
      { key: 'buttons', label: 'Buttons', value: 'pearl', conf: 'med', w: 1.5, note: 'Partly hidden by hair. I count 5.', options: ['pearl', 'mop', 'gold', 'tortoise', 'plastic'] },
      { key: 'length', label: 'Length', value: 'cropped', conf: 'high', w: 1.5, options: ['cropped', 'hip'] },
      { key: 'material', label: 'Material', value: 'unknown', conf: 'low', w: 0, note: "Fabric content isn't visible in a photo. Check each listing's label.", options: [] },
    ],
  },
  skirt: {
    label: 'Skirt', name: 'Brown plaid pleated mini skirt', conf: 88, box: { l: 34.2, t: 38.3, w: 30.8, h: 17 }, lbl: 'r',
    confNote: 'Clearly visible, but the waistband is partly covered by the cardigan.',
    attrs: [
      { key: 'pattern', label: 'Pattern', value: 'brownplaid', conf: 'high', w: 2, note: 'Colors are clear. The exact plaid repeat is hard to confirm.', options: ['brownplaid', 'beigeplaid'] },
      { key: 'pleats', label: 'Pleats', value: 'knife', conf: 'high', w: 1.5, options: ['knife', 'kilt', 'none'] },
      { key: 'slen', label: 'Length', value: 'mini', conf: 'high', w: 1.5, options: ['mini', 'knee'] },
      { key: 'waist', label: 'Waist', value: 'plainwb', conf: 'med', w: .5, note: 'Partly covered by the cardigan.', options: ['plainwb', 'buckle', 'zip'] },
      { key: 'material', label: 'Material', value: 'unknown', conf: 'low', w: 0, note: "Looks brushed and woven, but I can't tell wool from polyester.", options: [] },
    ],
  },
  tote: {
    label: 'Tote bag', name: 'Natural canvas tote', conf: 71, box: { l: 23.5, t: 33, w: 17, h: 22 }, lbl: 'b', noExact: true,
    confNote: 'Easy to see, but plain totes with no logo look almost identical across hundreds of brands.',
    attrs: [
      { key: 'tcolor', label: 'Color', value: 'natural', conf: 'high', w: 1, options: [] },
      { key: 'tmat', label: 'Material', value: 'canvas', conf: 'med', w: 1, options: [] },
      { key: 'logo', label: 'Branding', value: 'nologo', conf: 'med', w: 0, note: 'The side facing the camera has no logo. The other side might.', options: [] },
    ],
  },
  loafers: {
    label: 'Loafers', name: 'Black penny loafers', conf: 58, box: { l: 36, t: 73.5, w: 25.5, h: 20.5 },
    confNote: 'Small in the photo (about 5% of it) and seen at an angle, so details like the sole are a guess.',
    attrs: [
      { key: 'lcolor', label: 'Color', value: 'black', conf: 'high', w: 1, options: [] },
      { key: 'lstyle', label: 'Style', value: 'penny', conf: 'med', w: 1.5, options: [] },
      { key: 'sole', label: 'Sole', value: 'lug', conf: 'low', w: 1, note: 'Hard to see at this angle.', options: ['lug', 'flat'] },
    ],
  },
};

// LIVE: replace PRODUCTS with Google Lens (SerpAPI) visual matches + shopping results.
const PRODUCTS = [
  { id: 'c_exact', item: 'cardigan', brand: 'Mabel & Co.', title: 'Pearl Button Cropped Cable Cardigan', price: 78, store: 'mabelandco.com', kind: 'new', sizes: ['XS', 'S', 'M', 'L'], visual: .95,
    material: '60% cotton, 40% acrylic', sustain: { level: 'ok', note: '60% cotton, 40% acrylic. No certifications listed.' },
    attrs: { color: 'cream', knit: 'cable', neck: 'v', buttons: 'pearl', length: 'cropped' }, checked: '2 hours ago',
    verify: 'Listing photos show 5 buttons and the same center braid. The shade may look slightly different in person.',
    exactNote: 'Same cable layout (a center braid with twists on each side), same pearl-style buttons, same ribbed cropped hem.' },
  { id: 'c_organic', item: 'cardigan', brand: 'Kinfolk Knits', title: 'Organic Cotton Cable Cardigan', price: 64, store: 'kinfolkknits.com', kind: 'sustainable', sizes: ['S', 'M', 'L'], visual: .88,
    material: '100% organic cotton', sustain: { level: 'good', note: 'GOTS-certified organic cotton, made in a Fair Trade factory.' },
    attrs: { color: 'cream', knit: 'cable', neck: 'v', buttons: 'mop', length: 'cropped' }, checked: '5 hours ago',
    verify: 'Cables are thinner and the fit is boxier than in your photo.' },
  { id: 'c_ivory_long', item: 'cardigan', brand: 'Loop Resale', title: 'Vintage Chunky Cable Cardigan', price: 32, store: 'Loop (secondhand)', kind: 'secondhand', sizes: ['M'], visual: .92,
    material: 'Wool blend (seller says)', sustain: { level: 'good', note: 'Secondhand. Buying used avoids making a new garment.' },
    attrs: { color: 'ivory', knit: 'chunky', neck: 'v', buttons: 'tortoise', length: 'hip' }, checked: '1 hour ago',
    verify: 'One-of-a-kind listing in size M only. Seller mentions light pilling on the sleeves.' },
  { id: 'c_oat_ribbed', item: 'cardigan', brand: 'Northfield', title: 'Cropped Ribbed V-Neck Cardigan', price: 45, store: 'northfield.com', kind: 'new', sizes: ['XS', 'S', 'M', 'L', 'XL'], visual: .92,
    material: '70% wool, 30% recycled wool', sustain: { level: 'ok', note: '30% recycled wool.' },
    attrs: { color: 'beige', knit: 'ribbed', neck: 'v', buttons: 'gold', length: 'cropped' }, checked: '3 hours ago',
    verify: 'Different texture (fine rib, no cables) and a darker oatmeal color. Same cropped shape.' },
  { id: 'c_fast', item: 'cardigan', brand: 'TrendMart', title: 'Cable Knit Crop Cardigan', price: 14.99, store: 'trendmart.com', kind: 'fast', sizes: ['XS', 'S', 'M', 'L'], visual: .9,
    material: '100% acrylic', sustain: { level: 'poor', note: '100% acrylic from an ultra-fast-fashion brand. Reviews mention pilling after a few washes.' },
    attrs: { color: 'white', knit: 'cable', neck: 'crew', buttons: 'plastic', length: 'cropped' }, checked: '30 min ago',
    verify: 'Crew neck and bright white, not a cream V-neck. 31% of reviews say it runs small.' },
  { id: 's_exact', item: 'skirt', brand: 'Wren Studio', title: 'Plaid Pleated Mini Skirt', price: 56, store: 'wrenstudio.com', kind: 'new', sizes: ['XS', 'S', 'M', 'L'], visual: .93,
    material: '65% polyester, 35% viscose', sustain: { level: 'ok', note: 'Polyester and viscose blend.' },
    attrs: { pattern: 'brownplaid', pleats: 'knife', slen: 'mini', waist: 'plainwb' }, checked: '4 hours ago',
    verify: "Plaid colors and pleats match. I couldn't see the waistband well, so check the listing's close-ups.",
    exactNote: 'Same brown, tan and cream plaid, same knife pleats and mini length.' },
  { id: 's_vintage', item: 'skirt', brand: 'Loop Resale', title: 'Vintage Wool Plaid Kilt Mini', price: 24, store: 'Loop (secondhand)', kind: 'secondhand', sizes: ['S'], visual: .9,
    material: '100% wool', sustain: { level: 'good', note: 'Secondhand, 100% wool.' },
    attrs: { pattern: 'brownplaid', pleats: 'kilt', slen: 'mini', waist: 'buckle' }, checked: '40 min ago',
    verify: 'Wrap style with a side buckle, so the front looks a bit different from your photo.' },
  { id: 's_aline', item: 'skirt', brand: 'Northfield', title: 'Plaid A-Line Skirt', price: 39, store: 'northfield.com', kind: 'new', sizes: ['XS', 'S', 'M', 'L', 'XL'], visual: .9,
    material: 'Wool blend', sustain: { level: 'ok', note: 'Wool blend.' },
    attrs: { pattern: 'beigeplaid', pleats: 'none', slen: 'knee', waist: 'zip' }, checked: '3 hours ago',
    verify: 'Longer and not pleated. Similar colors but lighter overall.' },
  { id: 't_tote', item: 'tote', brand: 'Common Goods', title: 'Everyday Canvas Tote', price: 18, store: 'commongoods.co', kind: 'sustainable', sizes: ['One size'], visual: .9,
    material: 'Organic cotton canvas', sustain: { level: 'good', note: 'Organic cotton canvas.' },
    attrs: { tcolor: 'natural', tmat: 'canvas' }, checked: '6 hours ago',
    verify: 'Plain totes look alike. This is a lookalike, not a confirmed match.' },
  { id: 'l_exact', item: 'loafers', brand: 'Harbor & Main', title: 'Classic Lug Penny Loafer', price: 98, store: 'harborandmain.com', kind: 'new', sizes: ['6', '7', '8', '9', '10'], visual: .82,
    material: 'Leather upper, rubber sole', sustain: { level: 'ok', note: 'Leather, can be resoled.' },
    attrs: { lcolor: 'black', lstyle: 'penny', sole: 'lug' }, checked: '2 hours ago',
    verify: 'The shoes are small in your photo. Treat this as a lookalike and check the sole height.' },
];
const byId = id => PRODUCTS.find(p => p.id === id);

// LIVE: generate with an LLM from the detected attributes + user preferences.
const OUTFITS = [
  { img: 'o1', vibe: 'Casual', title: 'Weekend coffee run',
    why: 'Cool blue denim balances the warm cream, and sneakers make the preppy cardigan feel relaxed.',
    pieces: [['The cardigan', 'found'], ['Light-wash straight jeans', 'own'], ['White sneakers', 'own'], ['Small gold hoops', 'shop']] },
  { img: 'o2', vibe: 'Dressy', title: 'Dinner downtown',
    why: 'Satin next to chunky knit is a classic texture contrast. Black keeps the cream from looking too sweet.',
    pieces: [['The cardigan', 'found'], ['Black satin slip skirt', 'shop'], ['Black ballet flats', 'own'], ['Mini shoulder bag', 'own']] },
  { img: 'o3', vibe: 'Polished', title: 'Presentation day',
    why: 'Wide-leg trousers balance the cropped length. Brown leather picks up the browns from the original plaid.',
    pieces: [['The cardigan', 'found'], ['Charcoal wide-leg trousers', 'shop'], ['Brown loafers', 'own'], ['Thin leather belt', 'own']] },
];

const NOTES = {
  privacy: ['Privacy', 'Faces and bystanders are blurred on-device before analysis. The product searches for clothes, never for people.'],
  detect: ['Trust calibration', 'Each detected piece shows a confidence level, so a weak detection (the loafers) is flagged before the user sees any results.'],
  perceive: ['Explainability + error recovery', 'Users see what the AI perceived and can fix it or lock must-haves. "The AI saw it wrong" is kept separate from "I want something different".'],
  match: ['Explainability', 'Match strength is shown as which visible details match (dots), not one opaque score. "Why this match" lists each detail.'],
  verify: ['Appropriate reliance', 'Every result says what the AI could not verify, so users know when to check for themselves instead of trusting blindly.'],
  prefs: ['Dynamic alignment', 'Preferences the user stated are labeled separately from ones the AI inferred from feedback. Inferred ones need a Keep or Remove.'],
  rerank: ['Transparency', 'After every preference change, results show what moved and why, and the change can be undone.'],
  chat: ['Dynamic alignment', 'The assistant asks before turning feedback into a preference (for example "Should I cap your budget?").'],
  outfits: ['Minimum goal', 'LLM outfit ideas built around the found piece, clearly labeled as suggestions, not verified products.'],
  empty: ['Appropriate reliance', 'When the AI cannot confirm an exact match, it says so instead of guessing, and tells the user what they can do.'],
};
const note = k => `<div class="dnote">${ic('sparkle', 13)}<div><b>${NOTES[k][0]}</b>${NOTES[k][1]}</div></div>`;

/* ---------- state ---------- */
const freshPrefs = () => ({ minPrice: null, budget: null, preferredBrands: [], excludedBrands: [], secondhand: null, style: null, fast: null, size: null, length: null, lessBrands: [], shapeBoost: false, colorFlex: false });
function freshState() {
  const attrValues = {};
  for (const [k, it] of Object.entries(ITEMS)) { attrValues[k] = {}; for (const a of it.attrs) attrValues[k][a.key] = a.value; }
  return {
    photo: null,
    view: 'home', step: 0, item: 'cardigan', tab: 'same', sort: 'best',
    attrValues, corrected: {}, locks: {}, prefs: freshPrefs(), meta: {},
    hidden: [], liked: [], saved: [], expanded: [], popover: null, editing: null, showHidden: false,
    chat: [], log: [], moves: {}, rerank: null, modal: null, visited: {},
  };
}
let state = freshState();
let notesOn = false;
let logSeq = 0;
let timer = null;

/* ---------- uploaded photo scan ---------- */
const SCAN_COLORS = {
  white: [248, 247, 244], ivory: [231, 225, 209], cream: [223, 205, 176],
  beige: [182, 161, 135], brownplaid: [107, 82, 66], beigeplaid: [171, 146, 119],
  natural: [192, 175, 145], black: [39, 38, 38],
};
const SCAN_CROP = { l: 30, t: 30, w: 40, h: 40 };
const MIN_SCAN_SIZE = 8;
const colorDistance = (a, b) => Math.hypot(...a.map((channel, index) => channel - b[index]));

function scanColor(image, region) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const { naturalWidth: width, naturalHeight: height } = image;
  const { l, t, w, h } = region;
  ctx.drawImage(image, width * l / 100, height * t / 100, width * w / 100, height * h / 100, 0, 0, 32, 32);
  const pixels = ctx.getImageData(0, 0, 32, 32).data;
  const channels = [[], [], []];
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    channels.forEach((values, channel) => values.push(pixels[i + channel]));
  }
  if (!channels[0].length) return null;
  return channels.map(values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]);
}

function scanMatch(product) {
  const key = ['color', 'pattern', 'tcolor', 'lcolor'].find(key => product.attrs[key]);
  const color = product.attrs[key];
  const pct = Math.round(100 * (1 - colorDistance(state.photo.rgb, SCAN_COLORS[color]) / Math.hypot(255, 255, 255)));
  return { pct, rows: [], nMatch: 0, n: 0, color };
}

function photoSwatch() {
  if (!state.photo.rgb) return '';
  return `<span class="scan-swatch" style="background:rgb(${state.photo.rgb.join(',')})"></span>`;
}

/* ---------- matching + ranking ---------- */
function weightFor(a) {
  let w = a.w; const P = state.prefs;
  if (P.shapeBoost && ['neck', 'length', 'pleats', 'slen', 'lstyle'].includes(a.key)) w *= 1.6;
  if (P.colorFlex && ['color', 'pattern'].includes(a.key)) w *= 0.4;
  return w;
}
function matchInfo(p) {
  const confirmed = state.photo?.confirmed;
  if (state.photo && confirmed?.category !== p.item) return scanMatch(p);
  const it = ITEMS[p.item], vals = confirmed?.attributes || state.attrValues[p.item];
  let tot = 0, got = 0; const rows = [];
  for (const a of it.attrs) {
    if (!a.w) continue;
    const target = vals[a.key], pv = p.attrs[a.key];
    if (confirmed && (!target || target === 'unknown' || !pv)) continue;
    const s = sim(target, pv), w = weightFor(a);
    tot += w; got += w * s;
    rows.push({ a, target, pv, s, status: s >= .85 ? 'match' : s >= .45 ? 'partial' : 'diff' });
  }
  if (state.photo && !tot) return scanMatch(p);
  const pct = Math.round((state.photo ? 1 : p.visual) * (got / tot) * 100);
  return { pct, rows, nMatch: rows.filter(r => r.status === 'match').length, n: rows.length };
}
const matchLabel = pct => pct >= 85 ? 'Likely the same item' : pct >= 70 ? 'Very close' : pct >= 50 ? 'Similar' : 'Same vibe';
const dotsHtml = rows => `<span class="dots">${rows.map(r => `<i class="d d-${r.status}" title="${esc(r.a.label)}: ${r.status === 'match' ? 'matches' : r.status === 'partial' ? 'close' : 'different'}"></i>`).join('')}</span>`;
const isClothing = p => ['cardigan', 'skirt'].includes(p.item);

function prefEffects(p) {
  const P = state.prefs; let adj = 0; const chips = []; let hidden = null;
  if (state.hidden.includes(p.id)) hidden = 'you passed on it';
  if (P.budget != null || P.minPrice != null) chips.push(['good', 'Within price range']);
  if (P.preferredBrands.some(brand => brand.toLowerCase() === p.brand.toLowerCase())) {
    adj += 15; chips.push(['good', 'Preferred brand']);
  }
  if (P.style === 'secondhand' && p.kind === 'secondhand') { adj += 15; chips.push(['good', 'Secondhand']); }
  if (P.style === 'sustainable' && p.sustain.level === 'good') { adj += 12; chips.push(['good', 'Sustainable pick']); }
  if (p.kind === 'fast' && P.fast === 'lower') { adj -= 25; chips.push(['warn', 'Fast fashion, ranked lower']); }
  if (P.size && isClothing(p)) {
    if (!p.sizes.includes(P.size)) { adj -= 15; chips.push(['warn', `Not in size ${P.size}`]); }
    else chips.push(['good', `Has size ${P.size}`]);
  }
  if (P.length === 'longer' && isClothing(p)) {
    if (p.attrs.length === 'hip' || p.attrs.slen === 'knee') { adj += 18; chips.push(['good', 'Longer, like you asked']); } else adj -= 4;
  }
  if (P.lessBrands.includes(p.brand)) { adj -= 20; chips.push(['muted', `Less ${p.brand}`]); }
  return { adj, chips, hidden };
}
const SUS = { good: 0, ok: 1, poor: 2 };
const SORTERS = {
  best: (a, b) => b.score - a.score,
  look: (a, b) => b.m.pct - a.m.pct,
  price: (a, b) => a.p.price - b.p.price,
  sustain: (a, b) => SUS[a.p.sustain.level] - SUS[b.p.sustain.level] || b.m.pct - a.m.pct,
};
function catalogFor(item) {
  const P = state.prefs;
  return PRODUCTS.filter(p => p.item === item &&
    (P.minPrice == null || p.price >= P.minPrice) &&
    (P.budget == null || p.price <= P.budget) &&
    !P.excludedBrands.some(brand => brand.toLowerCase() === p.brand.toLowerCase()) &&
    (P.secondhand !== 'exclude' || p.kind !== 'secondhand') &&
    (P.fast !== 'hide' || p.kind !== 'fast'));
}
function ranked(item) {
  const all = catalogFor(item).map(p => {
    const m = matchInfo(p), e = prefEffects(p);
    const lockFails = m.rows.filter(r => state.locks[`${item}.${r.a.key}`] && r.status === 'diff');
    return { p, m, e, lockFails, score: m.pct + e.adj };
  });
  const canExact = !state.photo && !ITEMS[item].noExact;
  const sameAll = all.filter(x => canExact && x.m.pct >= 85);
  const same = sameAll.filter(x => !x.e.hidden).sort(SORTERS.best);
  const sameHidden = sameAll.filter(x => x.e.hidden);
  const rest = all.filter(x => !sameAll.includes(x));
  const hiddenPrefs = rest.filter(x => x.e.hidden);
  const hiddenLocks = rest.filter(x => !x.e.hidden && x.lockFails.length);
  const visible = rest.filter(x => !x.e.hidden && !x.lockFails.length).sort(SORTERS[state.sort]);
  const hiddenAll = [...hiddenPrefs, ...hiddenLocks];
  const similar = state.showHidden ? [...visible, ...hiddenAll] : visible;
  return { all, same, sameHidden, similar, visible, hiddenPrefs, hiddenLocks, hiddenAll };
}
const orderOf = item => { const R = ranked(item); return [...R.same, ...R.visible].map(x => x.p.id); };
const hideReason = x => x.e.hidden || `doesn't have ${x.lockFails.map(r => `${LABELS[r.target].toLowerCase()} ${r.a.label.toLowerCase()}`).join(', ')}`;

/* ---------- preference changes (with undo + re-rank diff) ---------- */
function snap() { return clone({ prefs: state.prefs, meta: state.meta, attrValues: state.attrValues, corrected: state.corrected, locks: state.locks, hidden: state.hidden }); }
function applyChange(mut, text, source = 'said') {
  const before = snap(); const prev = orderOf(state.item);
  mut();
  const entry = { id: ++logSeq, text, source, before };
  state.log.push(entry);
  const now = orderOf(state.item); const moves = {}; let moved = 0;
  now.forEach((id, i) => { const j = prev.indexOf(id); if (j === -1) { moves[id] = 'new'; moved++; } else if (j !== i) { moves[id] = j - i; moved++; } });
  const removed = prev.filter(id => !now.includes(id)).length;
  state.moves = moves; state.rerank = { text, moved, removed };
  state.chat.push({ role: 'sys', html: `${source === 'inferred' ? 'Inferred from your feedback' : 'Updated'}: ${esc(text)}`, undo: entry.id, inf: source === 'inferred' });
  renderAll();
}
function undoLast() {
  const e = state.log.pop(); if (!e) return;
  Object.assign(state, clone(e.before));
  state.moves = {}; state.rerank = { text: `undid "${e.text}"`, moved: 0, removed: 0 };
  state.chat.push({ role: 'sys', html: `Undid: ${esc(e.text)}` });
  renderAll();
  aiSay(`Undone. Everything is back to how it was before "${esc(e.text)}".`, null, 450);
}
function prefSummary() {
  const P = state.prefs, out = [];
  if (P.minPrice != null) out.push(`from ${money(P.minPrice)}`);
  if (P.budget != null) out.push(`up to ${money(P.budget)}`);
  if (P.preferredBrands.length) out.push(`prefer ${P.preferredBrands.join(', ')}`);
  if (P.excludedBrands.length) out.push(`exclude ${P.excludedBrands.join(', ')}`);
  if (P.secondhand === 'exclude') out.push('new items only');
  if (P.style === 'secondhand') out.push('secondhand first');
  if (P.style === 'sustainable') out.push('sustainable first');
  if (P.fast === 'lower') out.push('fast fashion lower');
  if (P.fast === 'hide') out.push('no ultra-fast fashion');
  if (P.size) out.push(`size ${P.size}`);
  if (P.length === 'longer') out.push('longer length');
  P.lessBrands.forEach(b => out.push(`less ${b}`));
  if (P.shapeBoost) out.push('shape matters more');
  if (P.colorFlex) out.push('open to other colors');
  for (const [k, on] of Object.entries(state.locks)) if (on) { const [it, key] = k.split('.'); if (it === state.item) out.push(`must have ${LABELS[state.attrValues[it][key]].toLowerCase()}`); }
  return out;
}

/* ---------- AI copy (scripted) ---------- */
// LIVE: these would come from an LLM given the ranked list + preference state.
function effectSummary() {
  const R = ranked(state.item), P = state.prefs, parts = [];
  const top = R.visible[0];
  if (top) parts.push(`Top similar pick is now <b>${esc(top.p.title)}</b> (${money(top.p.price)}${top.p.kind === 'secondhand' ? ', secondhand' : top.p.sustain.level === 'good' ? ', sustainable' : ''}).`);
  if (P.style === 'secondhand' && top && top.p.kind !== 'secondhand') {
    const i = R.visible.findIndex(x => x.p.kind === 'secondhand');
    if (i > 0) { const x = R.visible[i]; parts.push(`The best secondhand option, <b>${esc(x.p.title)}</b> (${money(x.p.price)}), is #${i + 1} because it looks less like your photo (${x.m.color ? `${x.m.pct}% color similarity` : `${x.m.nMatch} of ${x.m.n} details`}). I boosted it, but not above much closer matches.`); }
    else if (i === -1) parts.push(`I couldn't find a secondhand ${ITEMS[state.item].label.toLowerCase()} that looks like yours yet.`);
  }
  if (P.length === 'longer' && top && ['cardigan', 'skirt'].includes(state.item)) {
    const isLong = x => x.p.attrs.length === 'hip' || x.p.attrs.slen === 'knee';
    const i = R.visible.findIndex(isLong);
    if (i > 0) { const x = R.visible[i]; parts.push(`The longest option, <b>${esc(x.p.title)}</b>, is #${i + 1}: I boosted it, but it looks less like your photo (${x.m.color ? `${x.m.pct}% color similarity` : `${x.m.nMatch} of ${x.m.n} details`}).`); }
  }
  if (!R.all.length) parts.push('No catalog items fit your filters for this piece. You can adjust them in Filters.');
  else if (!R.same.length && !top) parts.push('No results are visible for this piece.');
  const hid = R.hiddenAll.length;
  if (hid) parts.push(`${hid} ${hid > 1 ? 'are' : 'is'} hidden, but you can still show ${hid > 1 ? 'them' : 'it'} at the bottom of Similar.`);
  return parts.join(' ') || 'Done. Nothing moved for this piece.';
}
function explainTop() {
  const R = ranked(state.item);
  const x = (state.tab === 'same' && R.same[0]) || R.visible[0];
  if (!x) return "There's nothing to rank for this piece right now.";
  if (x.m.color) return `<b>${esc(x.p.title)}</b> leads the sample results based on the scanned color and your preferences.`;
  const m = x.m.rows.filter(r => r.status === 'match').map(r => r.a.label.toLowerCase());
  const d = x.m.rows.filter(r => r.status !== 'match').map(r => `${r.a.label.toLowerCase()} (${LABELS[r.pv].toLowerCase()} vs. ${LABELS[r.target].toLowerCase()} in your photo)`);
  const good = x.e.chips.filter(c => c[0] === 'good').map(c => c[1].toLowerCase());
  return `<b>${esc(x.p.title)}</b> is first because ${x.m.nMatch} of ${x.m.n} visible details match (${m.join(', ') || 'none'})${good.length ? `, and it fits what you told me (${good.join(', ')})` : ''}.${d.length ? ` It differs on ${d.join(', ')}.` : ''}<br><br>I filter the catalog first, then rank eligible items by appearance and shopping preferences.`;
}
function explainItem(k) {
  if (state.photo) return explainTop();
  if (k === 'loafers') return "The loafers are small in your photo (about 5% of it) and seen at an angle. I can tell they're black penny loafers, but not the sole or the brand. So my best result is labeled <b>Very close</b>, not <b>Same item</b>. A closer photo of the shoes would help.";
  if (k === 'tote') return "It's a plain canvas tote with no visible logo. Hundreds of brands sell nearly identical ones, so calling anything an exact match would be a guess. I'd rather say so than make one up.";
  return explainTop();
}
const TRUST = "Trust me most on what's clearly visible: color, pattern, shape, and details like buttons. Double-check what a photo can't show: fabric, the true shade, sizing, and whether a plain item is really the same brand. Each result has a <b>Before you buy</b> note with what to verify.";

function onItemVisit(k) {
  if (state.visited[k]) return;
  state.visited[k] = true;
  const exact = ranked(k).same[0];
  aiSay(exact
    ? `<b>${esc(exact.p.title)}</b> (${money(exact.p.price)}) looks like the same item. ${exact.m.nMatch} visible details match.`
    : effectSummary(), null, 500);
}

/* ---------- chat ---------- */
function aiSay(html, actions = null, delay = 700) {
  if (actions) {
    const assistant = $('#assistant');
    if (assistant && !assistant.open) {
      assistant.open = true;
      assistant.querySelector('summary').focus();
    }
  }
  const msg = { role: 'ai', typing: true };
  state.chat.push(msg); renderChat();
  setTimeout(() => { msg.typing = false; msg.html = html; msg.actions = actions; renderChat(); }, delay);
}
function normSize(s) { return ({ small: 'S', medium: 'M', large: 'L' })[s] || s.toUpperCase(); }

// LIVE: replace this keyword parser with an LLM call that returns structured preference updates.
function handleUserText(raw) {
  const t = raw.toLowerCase();
  state.chat.push({ role: 'user', html: esc(raw) });
  const muts = [], changes = [], replies = [];
  let m = t.match(/(?:under|below|less than|max(?:imum)?|budget(?: is| of)?|up to|no more than|cheaper than|<)\s*\$?\s*(\d{2,4})/) || t.match(/\$\s*(\d{2,4})/);
  if (m) {
    const budget = +m[1];
    if (state.prefs.minPrice != null && budget < state.prefs.minPrice) {
      aiSay(`That maximum is below your ${money(state.prefs.minPrice)} minimum. Change the price range in Filters.`);
      return;
    }
    muts.push(() => { state.prefs.budget = budget; state.meta.budget = 'said'; });
    changes.push(`budget up to ${money(budget)}`);
  }
  if (/second ?hand|thrift|\bused\b|vintage|resale|pre-?loved|depop|poshmark/.test(t)) { muts.push(() => { state.prefs.style = 'secondhand'; state.meta.style = 'said'; }); changes.push('secondhand first'); }
  else if (/sustainab|\beco\b|organic|ethical|environment/.test(t)) { muts.push(() => { state.prefs.style = 'sustainable'; state.meta.style = 'said'; }); changes.push('sustainable brands first'); }
  if (/fast.?fashion|shein|temu|trendmart/.test(t)) {
    const hide = /\b(no|hide|never|avoid|don'?t|remove|without|exclude)\b/.test(t);
    muts.push(() => { state.prefs.fast = hide ? 'hide' : 'lower'; state.meta.fast = 'said'; }); changes.push(hide ? 'hide ultra-fast fashion' : 'rank fast fashion lower');
  }
  m = t.match(/\bsize\s*(xs|s|m|l|xl|small|medium|large)\b/) || t.match(/\bi'?m (?:an? |a size )?(xs|s|m|l|xl|small|medium|large)\b/);
  if (m) { const s = normSize(m[1]); muts.push(() => { state.prefs.size = s; state.meta.size = 'said'; }); changes.push(`size ${s}`); }
  if (/longer|hip.?length|not cropped|less cropped|cover/.test(t)) { muts.push(() => { state.prefs.length = 'longer'; state.meta.length = 'said'; }); changes.push('longer length'); }
  if (/\b(reset|clear|start over|forget)\b/.test(t)) { muts.push(resetPrefsMut); changes.push('cleared all preferences'); }

  if (muts.length) {
    applyChange(() => muts.forEach(f => f()), changes.join(', '), 'said');
    replies.push(`Got it: ${changes.join(', ')}. ${effectSummary()}`);
  }
  const itemWord = t.match(/\b(skirt|tote|bag|loafers?|shoes?|cardigan|sweater)\b/);
  if (/\bwhy\b|how come|explain/.test(t)) {
    const k = itemWord ? ({ bag: 'tote', tote: 'tote', loafer: 'loafers', loafers: 'loafers', shoe: 'loafers', shoes: 'loafers', skirt: 'skirt' })[itemWord[1]] : null;
    replies.push(k ? explainItem(k) : (/(exact|no exact|same item)/.test(t) ? explainItem(state.item) : explainTop()));
  } else if (/trust|\bsure\b|confident|accurate|reliable|believe/.test(t)) {
    replies.push(state.photo ? "Spotted compares the visible details you confirmed, or uses the scanned color when no details are available. Lighting and background can affect the result." : TRUST);
  }
  if (state.photo && /outfit|style (it|this|me)|wear (it|this)|pair|go with|styling/.test(t)) {
    replies.push('Outfit ideas are available with the demo photo.');
  } else if (!state.photo && /outfit|style (it|this|me)|wear (it|this)|pair|go with|styling/.test(t)) {
    state.item = 'cardigan'; state.tab = 'outfits'; state.moves = {}; state.rerank = null;
    replies.push("Here are three ways to wear the cardigan, plus what the whole look would cost with your current preferences. These are styling ideas I generated, not products I checked.");
  } else if (itemWord && !muts.length && !replies.length) {
    const k = ({ bag: 'tote', tote: 'tote', loafer: 'loafers', loafers: 'loafers', shoe: 'loafers', shoes: 'loafers', skirt: 'skirt', cardigan: 'cardigan', sweater: 'cardigan' })[itemWord[1]];
    pickItem(k, true);
    if (state.photo) replies.push(`Searching the ${ITEMS[k].label.toLowerCase()} sample listings.`);
    else replies.push(`Switched to the ${ITEMS[k].label.toLowerCase()}. ${ITEMS[k].confNote}`);
  }
  if (/^(thanks|thank you|ty|cool|nice|great)/.test(t) && !replies.length) replies.push('Anytime! Save anything you like with the heart and it will stay in your Saved list.');
  if (!replies.length) replies.push(`I'm a prototype, so I only understand a few things right now: a budget ("under $50"), secondhand or sustainable, your size, avoiding fast fashion, "something longer", and "why" questions.`);
  renderAll();
  aiSay(replies.join('<br><br>'));
}

function resetPrefsMut() { state.prefs = freshPrefs(); state.meta = {}; }

/* ---------- feedback (thumbs) ---------- */
function passReason(id, reason) {
  const p = byId(id); state.popover = null;
  applyChange(() => { state.hidden.push(id); }, `hid "${p.title}"`, 'said');
  const P = state.prefs;
  if (reason === 'price') {
    if (P.budget == null) {
      const capV = Math.max(P.minPrice ?? 0, 20, Math.floor((p.price * 0.75) / 10) * 10);
      aiSay(`Got it, ${money(p.price)} is more than you want to spend. Should I set a budget so I stop showing pricier things?`, [
        { label: `Yes, cap at $${capV}`, fn: () => { applyChange(() => { state.prefs.budget = capV; state.meta.budget = 'inferred'; }, `budget up to $${capV}`, 'inferred'); aiSay(`Done. I marked the budget as <b>inferred</b> in your preferences, so you can keep or remove it. ${effectSummary()}`); } },
        { label: 'No, just this one', fn: () => aiSay("Okay. I only hid that one and didn't change your budget.") },
      ]);
    } else aiSay('I hid that listing. You can lower your maximum price in Filters.');
  } else if (reason === 'color' && state.photo) {
    aiSay('I hid that listing. To scan a different color, choose New photo and use a close-up of the garment.');
  } else if (reason === 'color') {
    const key = ITEMS[p.item].attrs[0].key;
    aiSay('Quick check so I learn the right thing: did I read the color wrong in your photo, or do you just want a different color than the one in the photo?', [
      { label: 'You read it wrong', fn: () => { state.editing = `${p.item}.${key}`; renderPhoto(); const details = $('#photoDetails'); details.open = true; details.querySelector('.attr-edit button')?.focus(); aiSay('Pick the right color in <b>Photo details</b> to update the matches.'); } },
      { label: 'I want other colors', fn: () => { applyChange(() => { state.prefs.colorFlex = true; state.meta.colorFlex = 'inferred'; }, 'open to other colors', 'inferred'); aiSay("Got it. I'll care less about color and more about knit and shape. It's marked as inferred above, so you can remove it anytime."); } },
    ]);
  } else if (reason === 'shape' && state.photo) {
    aiSay('I hid that listing. Try asking for something longer if length is what you want to change.');
  } else if (reason === 'shape') {
    aiSay('Should I weigh fit and shape (length, neckline, pleats) more heavily from now on?', [
      { label: 'Yes', fn: () => { applyChange(() => { state.prefs.shapeBoost = true; state.meta.shapeBoost = 'inferred'; }, 'fit & shape matter more', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
      { label: 'No, just this one', fn: () => aiSay('Okay, I only hid that one.') },
    ]);
  } else if (reason === 'brand') {
    applyChange(() => { state.prefs.lessBrands.push(p.brand); state.meta[`brand:${p.brand}`] = 'inferred'; }, `less ${p.brand}`, 'inferred');
    aiSay(`I'll rank <b>${esc(p.brand)}</b> lower from now on. You can undo that in your preferences.`);
  } else if (reason === 'sustain') {
    if (p.kind === 'fast') {
      aiSay('Want me to hide ultra-fast-fashion brands entirely, or just rank them lower?', [
        { label: 'Hide them', fn: () => { applyChange(() => { state.prefs.fast = 'hide'; state.meta.fast = 'inferred'; }, 'hide ultra-fast fashion', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
        { label: 'Rank lower', fn: () => { applyChange(() => { state.prefs.fast = 'lower'; state.meta.fast = 'inferred'; }, 'rank fast fashion lower', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
      ]);
    } else {
      aiSay('Should I put secondhand or certified-sustainable options first?', [
        { label: 'Secondhand first', fn: () => { applyChange(() => { state.prefs.style = 'secondhand'; state.meta.style = 'inferred'; }, 'secondhand first', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
        { label: 'Sustainable brands first', fn: () => { applyChange(() => { state.prefs.style = 'sustainable'; state.meta.style = 'inferred'; }, 'sustainable brands first', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
      ]);
    }
  } else {
    aiSay("Okay, hidden. If you tell me what's off, I can learn from it, but no pressure.");
  }
}
function likeItem(id) {
  const p = byId(id);
  if (state.liked.includes(id)) { state.liked = state.liked.filter(x => x !== id); renderAll(); return; }
  state.liked.push(id); if (!state.saved.includes(id)) state.saved.push(id);
  renderAll();
  if (p.kind === 'secondhand' && !state.prefs.style) {
    aiSay('Nice pick, and it\'s secondhand. Want me to show secondhand options first?', [
      { label: 'Yes, secondhand first', fn: () => { applyChange(() => { state.prefs.style = 'secondhand'; state.meta.style = 'inferred'; }, 'secondhand first', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
      { label: 'No thanks', fn: () => aiSay("Okay, I won't change anything.") },
    ]);
  } else if (p.sustain.level === 'good' && !state.prefs.style) {
    aiSay('Saved. That one is from a certified-sustainable brand. Want me to put sustainable options first?', [
      { label: 'Yes', fn: () => { applyChange(() => { state.prefs.style = 'sustainable'; state.meta.style = 'inferred'; }, 'sustainable brands first', 'inferred'); aiSay(`Done. ${effectSummary()}`); } },
      { label: 'No thanks', fn: () => aiSay("Okay, I won't change anything.") },
    ]);
  } else aiSay(`Saved <b>${esc(p.title)}</b> to your list.`, null, 500);
}

/* ---------- small helpers ---------- */
const confLevel = c => c >= 85 ? 'high' : c >= 65 ? 'med' : 'low';
const confWord = c => ({ high: 'Sure', med: 'Fairly sure', low: 'Not sure' })[c];
const pos = b => `left:${b.l}%;top:${b.t}%;width:${b.w}%;height:${b.h}%`;
const cropStyle = b => `background-size:${(10000 / b.w).toFixed(2)}% ${(10000 / b.h).toFixed(2)}%;background-position:${(b.l / (100 - b.w) * 100).toFixed(2)}% ${(b.t / (100 - b.h) * 100).toFixed(2)}%;aspect-ratio:${(b.w * HERO_RATIO / b.h).toFixed(4)}`;
const crop = (b, cls = '') => `<div class="crop hero-bg ${cls}" style="${cropStyle(b)}"></div>`;
const statusIcon = s => `<span class="si">${ic(s === 'match' ? 'check' : s === 'partial' ? 'minus' : s === 'diff' ? 'x' : 'question', 11)}</span>`;
const kindTag = p => p.kind === 'secondhand' ? `<span class="kind kind-secondhand">${ic('refresh', 12)} Secondhand</span>` : p.kind === 'sustainable' ? `<span class="kind kind-sustainable">${ic('leaf', 12)} Sustainable</span>` : p.kind === 'fast' ? `<span class="kind kind-fast">${ic('alert', 12)} Ultra-fast fashion</span>` : '';
function toast(msg) { const t = $('#toast'); t.innerHTML = msg; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2800); }
const toggleIn = (arr, x) => arr.includes(x) ? arr.filter(y => y !== x) : [...arr, x];

/* ---------- views ---------- */
function renderTop() {
  $('#topbar').innerHTML = `
    <button class="logo" data-act="newPhoto"><span class="logo-mark">${ic('hanger', 18)}</span>Spotted</button>
    <div class="top-actions">
      <button class="toggle ${notesOn ? 'on' : ''}" data-act="toggleNotes" title="Show how each feature maps to course concepts"><span class="sw"></span>Design notes</button>
      <button class="btn btn-ghost" data-act="openSaved">${ic('heart', 15)} Saved <span class="count">${state.saved.length}</span></button>
      ${state.view !== 'home' ? `<button class="btn" data-act="newPhoto">New photo</button>` : ''}
    </div>`;
}

const DATASET_PHOTOS = ['dataset_skirt_1', 'dataset_skirt_2', 'dataset_skirt_3'];

function viewHome() {
  return `<section class="home">
    <div>
      <div class="eyebrow">${ic('sparkle', 13)} AI clothing finder</div>
      <h1>Saw a cute outfit?<br><em>Find where it's from.</em></h1>
      <p class="lede">Find the clothes in a photo and explore similar pieces that fit your budget.</p>
    </div>
    <div class="upload-card">
      <label class="drop" id="drop">
        <input type="file" accept="image/*" id="file" aria-label="Upload a photo">
        <div class="drop-ic">${ic('upload', 26)}</div>
        <b>Drop a photo or screenshot</b><span>Choose an area for the color scan</span>
      </label>
      <p class="hint" id="uploadStatus" role="status"></p>
      <div class="or"><span>or</span></div>
      <button class="sample" data-act="useSample">
        <img src="${IMG('hero')}" alt="Demo street photo">
        <div><b>Try the demo photo</b></div>${ic('arrow', 16)}
      </button>
      <div class="dataset-samples">
        <h2>Try a real photo</h2>
        <div class="dataset-photos">${DATASET_PHOTOS.map((key, i) => `<button type="button" data-act="useDatasetPhoto" data-arg="${key}" aria-label="Scan skirt photo ${i + 1}">
          <img src="${IMG(key)}" alt=""><span>Skirt ${i + 1}</span>
        </button>`).join('')}</div>
      </div>
      <div class="privacy">${ic('shield', 18)}<span>${window.__VISION ? 'Color scanning stays on this device. Garment analysis sends the selected crop to Amazon Bedrock.' : 'Prototype with sample matches. Your photo stays on this device.'}</span></div>
    </div>
  </section>`;
}

const STEPS = [
  ['Blurring faces and bystanders', '2 blurred'],
  ['Finding clothing items', '4 found'],
];
function photoStage({ interactive = false, blur = true, boxes = true, scan = false } = {}) {
  if (state.photo) {
    const editable = state.view === 'setup';
    return `<div class="stage scan-photo"><img src="${state.photo.url}" alt="Your uploaded garment photo">
      <div class="scan-region ${editable ? 'scan-editable' : ''}" style="${pos(state.photo.region)}">
        ${editable ? '<button type="button" class="scan-move" aria-label="Move scan box" aria-describedby="scanHelp"></button><button type="button" class="scan-resize" aria-label="Resize scan box" aria-describedby="scanHelp"></button>' : ''}
      </div></div>`;
  }
  return `<div class="stage">
    <img src="${IMG('hero')}" alt="Street photo of an outfit">
    ${BLURS.map(b => `<div class="blur ${blur ? 'on' : ''}" style="${pos(b)}"></div>`).join('')}
    ${Object.entries(ITEMS).map(([k, v]) => `<button class="box ${boxes ? 'on' : ''} ${interactive && k === state.item ? 'sel' : ''} conf-${confLevel(v.conf)} ${v.lbl ? 'lbl-' + v.lbl : ''}" style="${pos(v.box)}" ${interactive ? `data-act="pickItem" data-arg="${k}" title="Search for the ${v.label.toLowerCase()}"` : 'tabindex="-1"'}><span class="box-label">${v.label} · ${v.conf}%</span></button>`).join('')}
    ${scan ? '<div class="scan"></div>' : ''}
  </div>`;
}
function viewAnalyzing() {
  return `<section class="analyze">
    <div id="anStage">${photoStage({ blur: false, boxes: false, scan: true })}</div>
    <div>
      <h2>Reading your photo</h2>
      <ul class="steps-list">${STEPS.map(([s, r]) => `<li><span class="st"></span><span>${s}</span><span class="res">${r}</span></li>`).join('')}</ul>
      <button class="link" data-act="skip">Skip animation</button>
    </div>
  </section>`;
}
function updateAnalyzing() {
  const lis = document.querySelectorAll('.steps-list li');
  lis.forEach((li, i) => { li.className = i < state.step ? 'done' : i === state.step ? 'active' : ''; li.querySelector('.st').innerHTML = i < state.step ? ic('check', 13) : ''; });
  document.querySelectorAll('#anStage .blur').forEach(b => b.classList.toggle('on', state.step >= 1));
  document.querySelectorAll('#anStage .box').forEach(b => b.classList.toggle('on', state.step >= 2));
}

const options = (choices, value) => choices.map(([key, label]) =>
  `<option value="${key}" ${(value ?? '') === key ? 'selected' : ''}>${label}</option>`).join('');

function shoppingFields(tag = () => '') {
  const P = state.prefs;
  return `<div class="pref-grid">
    <div class="pref"><label class="pref-l" for="minPrice">Min price ($)</label><input id="minPrice" name="minPrice" type="number" min="0" step="0.01" placeholder="Any" value="${P.minPrice ?? ''}"></div>
    <div class="pref"><label class="pref-l" for="budget">Max price ($)</label>${tag('budget')}<input id="budget" name="budget" type="number" min="0" step="0.01" placeholder="Any" value="${P.budget ?? ''}"></div>
    <label class="pref"><span class="pref-l">Preferred brands</span><input name="preferredBrands" placeholder="e.g. Northfield" value="${esc(P.preferredBrands.join(', '))}"></label>
    <label class="pref"><span class="pref-l">Excluded brands</span><input name="excludedBrands" placeholder="e.g. TrendMart" value="${esc(P.excludedBrands.join(', '))}"></label>
    <label class="pref"><span class="pref-l">Secondhand</span><select name="secondhand">${options([['', 'Include'], ['exclude', 'New items only']], P.secondhand)}</select></label>
    <div class="pref"><label class="pref-l" for="style">Rank higher</label>${tag('style')}<select id="style" name="style">${options([['', 'Closest match'], ['secondhand', 'Secondhand'], ['sustainable', 'Sustainable']], P.style)}</select></div>
  </div>
  <p class="hint">Separate brands with commas. Preferred brands rank higher. Excluded brands stay out of results.</p>`;
}

function detectedDetails(key) {
  if (state.photo) return `Search the sample ${ITEMS[key].label.toLowerCase()} listings by confirmed details or scanned color.`;
  const item = ITEMS[key];
  return `${esc(item.name)}. ${esc(item.confNote)}`;
}

function viewSetup() {
  if (state.photo && window.__REFERENCE_SEARCH) {
    return `<section class="ws reference-workspace">
      <div class="panel"><h2>Find visually similar clothes</h2>
        <p class="hint" id="scanHelp">Move the box over the whole garment. Drag the lower-right corner to resize, or focus either control and use the arrow keys.</p>
        ${photoStage()}
        <p class="scan-color" id="scanColor">${scanPreview()}</p>
        <button class="btn btn-primary" type="button" data-act="analyzeGarment">Analyze garment</button>
        <p class="hint">Sends the selected crop to Amazon Bedrock.</p>
        <p class="hint" id="visionStatus" role="status"></p>
      </div>
      <section class="panel" id="visionReview" aria-label="Reference matches">
        <h2>Reference matches</h2><p class="muted">Analyze a garment to search the Clothing Dataset.</p>
      </section>
    </section>`;
  }
  return `<section class="ws">
    <div class="panel">
      <h2>Confirm the piece and set your preferences</h2>
      <p class="muted">Spotted searches a curated demo catalog using your preferences.</p>
      <form class="shopping-form" data-shopping>
        <label class="pref"><span class="pref-l">Which piece are you looking for?</span>
          <select name="item">${Object.entries(ITEMS).map(([key, item]) => `<option value="${key}" ${key === state.item ? 'selected' : ''}>${item.label}${state.photo ? '' : ` · ${item.conf}% detected`}</option>`).join('')}</select>
        </label>
        <p class="hint" id="detectedDetails" aria-live="polite">${detectedDetails(state.item)}</p>
        ${state.photo ? '<div id="visionReview"></div>' : ''}
        ${shoppingFields()}
        <button class="btn btn-primary" type="submit" ${state.photo && !state.photo.rgb ? 'disabled' : ''}>Confirm and search</button>
      </form>
    </div>
    <aside class="panel"><div class="panel-head"><h3>${state.photo ? 'Scanned area' : 'Detected pieces'}</h3></div>${photoStage()}${state.photo ? `<p class="scan-color" id="scanColor">${scanPreview()}</p><p class="hint" id="scanHelp">Drag the box to move it or drag its lower-right corner to resize. You can also focus either control and use the arrow keys.</p>
      ${window.__VISION ? '<button class="btn" type="button" data-act="analyzeGarment">Analyze garment</button><p class="hint">Sends the selected crop to Amazon Bedrock.</p><p id="visionStatus" class="hint" role="status"></p>' : ''}` : ''}</aside>
  </section>`;
}

function wsSkeleton() {
  return `<section class="ws">
    <section class="col col-center">
      <div id="itemPicker"></div>
      <div class="result-tools">
        <details class="disclosure" id="filters"><summary>Filters</summary><div id="prefPanel"></div></details>
        <details class="disclosure" id="assistant"><summary>Ask Spotted</summary>
          <div class="chat">
            <div class="chat-head"><span class="avatar">${ic('sparkle', 14)}</span>Demo assistant</div>
            <div class="chat-notes">${note('chat')}</div>
            <div class="chat-log" id="chatLog"></div>
            <div class="quick" id="quick"></div>
            <form class="chat-input" id="chatForm"><input id="chatInput" aria-label="Message Spotted" placeholder='Try "under $50, secondhand please"' autocomplete="off"><button type="submit" title="Send">${ic('send', 16)}</button></form>
          </div>
        </details>
      </div>
      <div id="colCenter"></div>
    </section>
    <aside class="col photo-panel" id="photoPanel"></aside>
  </section>`;
}

function renderPhoto() {
  const el = $('#photoPanel'); if (!el) return;
  const it = ITEMS[state.item];
  const detailsOpen = $('#photoDetails')?.open;
  $('#itemPicker').innerHTML = `<h2>Find a piece</h2><div class="item-list" aria-label="Clothing pieces">${Object.entries(ITEMS).map(([k, v]) => `<button class="item-chip ${k === state.item ? 'on' : ''}" aria-pressed="${k === state.item}" data-act="pickItem" data-arg="${k}">${v.label}</button>`).join('')}</div>`;
  if (state.photo) {
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3>Your photo</h3></div>
      ${photoStage()}<p class="scan-color">${photoSwatch()} Scanned color</p></div>`;
    return;
  }
  el.innerHTML = `
    <div class="panel">
      <div class="panel-head"><h3>Your photo</h3><span class="pill pill-good">${ic('shield', 12)} 2 faces blurred</span></div>
      ${note('privacy')}
      ${photoStage({ interactive: true })}
      ${note('detect')}
    </div>
    <details class="disclosure" id="photoDetails" ${detailsOpen ? 'open' : ''}>
      <summary>Photo details · ${esc(it.label)}</summary>
      <p class="conf-note">${esc(it.confNote)}</p>
      ${note('perceive')}
      <ul class="attrs">${it.attrs.map(attrRow).join('')}</ul>
      <p class="hint">${ic('edit', 12)} Fix anything I got wrong. ${ic('lock', 12)} Lock a detail to only see results that have it.</p>
    </details>`;
}
function attrRow(a) {
  const item = state.item, v = state.attrValues[item][a.key], id = `${item}.${a.key}`;
  const corrected = state.corrected[id], locked = state.locks[id], editing = state.editing === id;
  const canEdit = a.options.length > 1, canLock = a.w > 0;
  return `<li class="attr">
    <div class="attr-main">
      <span class="attr-label">${a.label}</span>
      <span class="attr-val">${esc(LABELS[v])}${locked ? '<span class="tag tag-lock">must have</span>' : ''}</span>
      ${corrected ? '<span class="conf conf-you" title="You corrected this">Fixed by you</span>' : `<span class="conf conf-${a.conf}" title="How sure I am">${confWord(a.conf)}</span>`}
      <span class="attr-actions">
        ${canEdit ? `<button class="icon-btn ${editing ? 'on' : ''}" data-act="editAttr" data-arg="${a.key}" title="This is wrong, fix it">${ic('edit', 13)}</button>` : ''}
        ${canLock ? `<button class="icon-btn ${locked ? 'on' : ''}" data-act="lockAttr" data-arg="${a.key}" title="${locked ? 'Unlock' : 'Must have this'}">${ic(locked ? 'lock' : 'unlock', 13)}</button>` : ''}
      </span>
    </div>
    ${a.note && !corrected ? `<div class="attr-note">${esc(a.note)}</div>` : ''}
    ${editing ? `<div class="attr-edit"><span>What is it actually?</span>${a.options.map(o => `<button class="opt ${o === v ? 'on' : ''}" data-act="setAttr" data-arg="${a.key}|${o}">${esc(LABELS[o])}</button>`).join('')}</div>` : ''}
  </li>`;
}

function renderCenter() {
  const el = $('#colCenter'); if (!el) return;
  const it = ITEMS[state.item], R = ranked(state.item);
  const activePrefs = prefSummary();
  const tabs = state.photo ? [['similar', 'Sample matches']] : [['same', 'Same item'], ['similar', 'Similar'], ['outfits', 'Outfit ideas']];
  el.innerHTML = `
    <div class="center-head">
      <h2>${state.tab === 'outfits' ? 'Style the cardigan' : esc(state.photo ? it.label : it.name)}</h2>
    </div>
    ${state.tab !== 'outfits' ? `<p class="muted small">${R.all.length} catalog ${R.all.length === 1 ? 'item fits' : 'items fit'} your filters${activePrefs.length ? ` · ${esc(activePrefs.join(' · '))}` : ''}</p>` : ''}
    ${state.rerank && state.tab !== 'outfits' ? `
      ${note('rerank')}
      <div class="rerank">${ic('refresh', 15)}<span>Re-ranked after <b>${esc(state.rerank.text)}</b>.${state.rerank.moved ? ` ${state.rerank.moved} moved.` : ''}${state.rerank.removed ? ` ${state.rerank.removed} hidden.` : ''}</span><span class="spacer"></span><button class="link" data-act="whyRerank">Explain</button><button class="icon-btn" data-act="dismissRerank" title="Dismiss">${ic('x', 14)}</button></div>` : ''}
    <div class="tabs-row">
      <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${state.tab === k ? 'on' : ''}" aria-pressed="${state.tab === k}" data-act="tab" data-arg="${k}">${l}</button>`).join('')}</div>
      ${state.tab === 'similar' ? `<label class="sort">Sort by <select data-sort>${[['best', 'Best for you'], ['look', 'Closest look'], ['price', 'Lowest price'], ['sustain', 'Most sustainable']].map(([v, l]) => `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>` : ''}
    </div>
    <div id="tabBody">${state.tab !== 'outfits' && !R.all.length
      ? '<div class="panel"><h3>No items fit your filters</h3><p>Adjust your preferences to search a wider selection for this piece.</p><button class="link" data-act="openFilters">Edit filters</button></div>'
      : state.tab === 'same' ? viewSame(R) : state.tab === 'similar' ? viewSimilar(R) : viewOutfits()}</div>`;
}

function viewSame(R) {
  const it = ITEMS[state.item];
  let html = note('match') + note('verify');
  if (!R.same.length) {
    const why = it.noExact
      ? `It's a plain ${it.label.toLowerCase()} with no visible logo. Hundreds of brands sell nearly identical ones, so any "exact match" would be a guess.`
      : state.item === 'loafers'
        ? `The shoes are small in your photo and seen at an angle. My best guess only matches at ${R.visible[0] ? R.visible[0].m.pct : 0}%, which isn't enough to call it the same pair.`
        : `No item within your filters matches closely enough to call it the same item.`;
    html += `${note('empty')}<div class="empty">
      ${crop(it.box)}
      <div>
        <h3>No confirmed exact match</h3>
        <p>${why}</p>
        <ul>
          ${it.noExact ? '<li>If the brand matters, look for a logo on the other side or a tag.</li>' : '<li>A closer or clearer photo of this piece would help most.</li>'}
        </ul>
        <div class="card-actions"><button class="btn btn-primary" data-act="tab" data-arg="similar">See similar ${ic('arrow', 14)}</button></div>
      </div>
    </div>`;
  } else {
    html += R.same.map(exactCard).join('');
    const sims = R.visible.slice(0, 4);
    if (sims.length) {
      const prices = R.visible.map(x => x.p.price);
      html += `<div class="more-teaser"><div class="thumbs">${sims.map(x => `<img src="${IMG(x.p.id)}" alt="">`).join('')}</div><div><b>${R.visible.length} similar options</b><div class="muted small">from ${money(Math.min(...prices))} to ${money(Math.max(...prices))}, including secondhand and sustainable picks</div></div><span class="spacer"></span><button class="btn" data-act="tab" data-arg="similar">See similar ${ic('arrow', 14)}</button></div>`;
    }
  }
  if (R.sameHidden.length) html += `<div class="hidden-note">${R.sameHidden.length} likely-exact match hidden (you passed on it). <button class="link" data-act="unhide" data-arg="${R.sameHidden[0].p.id}">Bring it back</button></div>`;
  return html;
}

function exactCard(x) {
  const { p, m, e } = x;
  const matched = m.rows.filter(r => r.status !== 'diff');
  const diffs = m.rows.filter(r => r.status === 'diff');
  return `<article class="exact">
    <div class="exact-img"><img src="${IMG(p.id)}" alt="${esc(p.title)}"><span class="badge-exact">${ic('check', 12)} Likely the same item</span>
      <button class="heart ${state.saved.includes(p.id) ? 'on' : ''}" data-act="save" data-arg="${p.id}" title="Save">${ic('heart', 16)}</button></div>
    <div>
      <div class="row-between"><span class="brand">${esc(p.brand)}</span><span class="price big">${money(p.price)}</span></div>
      <h3>${esc(p.title)}</h3>
      <div class="store">${esc(p.store)} · sizes ${p.sizes.join(', ')} in stock · price checked ${p.checked}</div>
      ${e.chips.length || p.kind !== 'new' ? `<div class="pchips">${e.chips.map(([t, l]) => `<span class="pc pc-${t}">${esc(l)}</span>`).join('')}</div>` : ''}
      <div class="howsure">
        <div class="howsure-head">${dotsHtml(m.rows)}<b>${m.nMatch} of ${m.n} visible details match</b><span class="muted">(${m.pct}% visual match)</span></div>
        <p>${esc(p.exactNote || '')}</p>
      </div>
      <details class="disclosure match-details"><summary>Match details</summary><div class="two">
        <div><h5>${ic('check', 13)} What matches</h5><ul>${matched.map(r => `<li class="st-${r.status}">${statusIcon(r.status)}<span>${r.a.label}: ${esc(LABELS[r.pv])}</span></li>`).join('')}${diffs.map(r => `<li class="st-diff">${statusIcon('diff')}<span>${r.a.label}: ${esc(LABELS[r.pv])} (yours: ${esc(LABELS[r.target])})</span></li>`).join('')}</ul></div>
        <div><h5>${ic('alert', 13)} What I couldn't check</h5><ul>
          <li class="st-unknown">${statusIcon('unknown')}<span>Material. The listing says ${esc(p.material)}.</span></li>
          <li class="st-unknown">${statusIcon('unknown')}<span>${esc(p.verify)}</span></li>
          <li class="st-unknown">${statusIcon('unknown')}<span>Fit on you. Check the size chart and return policy.</span></li>
        </ul></div>
      </div>
      </details>
      <div class="card-actions">
        <button class="btn btn-sm" data-act="compare" data-arg="${p.id}">${ic('compare', 14)} Compare side by side</button>
        <button class="btn btn-sm btn-primary" data-act="store" data-arg="${p.id}">View at store ${ic('external', 13)}</button>
        <span class="spacer"></span>
        <button class="icon-btn ${state.liked.includes(p.id) ? 'on-good' : ''}" data-act="up" data-arg="${p.id}" title="Love it">${ic('up', 15)}</button>
        <button class="icon-btn" data-act="down" data-arg="${p.id}" title="Not for me">${ic('down', 15)}</button>
      </div>
    </div>
    ${state.popover === p.id ? passPopover(p) : ''}
  </article>`;
}

function viewSimilar(R) {
  if (!R.similar.length && !R.hiddenAll.length) return `<div class="hidden-note">No similar items for this piece yet.</div>`;
  let html = state.photo ? '<p class="hint">Ranked by confirmed garment details or scanned color, plus your shopping preferences. Listings are fictional.</p>' : note('match') + note('verify');
  html += `<div class="grid">${R.similar.map(card).join('')}</div>`;
  if (R.hiddenAll.length) {
    const reasons = [...new Set(R.hiddenAll.map(hideReason))];
    html += `<div class="hidden-note">${ic('eye', 13)} ${R.hiddenAll.length} hidden (${esc(reasons.join('; '))}). <button class="link" data-act="showHidden">${state.showHidden ? 'Hide them again' : 'Show anyway'}</button></div>`;
  }
  return html;
}

function card(x) {
  const { p, m, e } = x; const mv = state.moves[p.id]; const exp = state.expanded.includes(p.id);
  const hidden = e.hidden || x.lockFails.length;
  return `<article class="card ${hidden ? 'is-hidden' : ''}">
    <div class="card-img"><img src="${IMG(p.id)}" alt="${esc(p.title)}">
      ${kindTag(p)}
      ${mv ? `<span class="move ${mv === 'new' ? 'new' : mv > 0 ? 'up' : 'down'}">${mv === 'new' ? 'new' : (mv > 0 ? '▲ ' : '▼ ') + Math.abs(mv)}</span>` : ''}
      <button class="heart ${state.saved.includes(p.id) ? 'on' : ''}" data-act="save" data-arg="${p.id}" title="Save">${ic('heart', 16)}</button>
    </div>
    <div class="card-body">
      <div class="row-between"><span class="brand">${esc(p.brand)}</span><span class="price">${money(p.price)}</span></div>
      <h4>${esc(p.title)}</h4>
      <div class="store">${state.photo ? 'Sample listing' : `${esc(p.store)} · checked ${p.checked}`}</div>
      <div class="match">${m.color ? `<b>${m.pct}% color similarity</b>` : `${dotsHtml(m.rows)}<b>${state.photo ? 'Detail match' : matchLabel(m.pct)}</b><span class="muted">${m.nMatch}/${m.n} details</span>`}</div>
      ${e.chips.length ? `<div class="pchips">${e.chips.map(([t, l]) => `<span class="pc pc-${t}">${esc(l)}</span>`).join('')}</div>` : ''}
      ${hidden ? `<div class="hidden-why">Hidden: ${esc(hideReason(x))}${state.hidden.includes(p.id) ? ` · <button class="link" data-act="unhide" data-arg="${p.id}">bring back</button>` : ''}</div>` : ''}
      <div class="verify"><b>Before you buy:</b> ${state.photo ? 'Check the garment details and color in the actual listing.' : esc(p.verify)}</div>
      <button class="why-toggle" data-act="toggleWhy" data-arg="${p.id}">${exp ? 'Hide details' : 'Why this match?'}</button>
      ${exp ? `<div class="why">
        <ul class="why-rows">${m.color ? `<li>Catalog color: ${esc(LABELS[m.color])}</li>` : ''}${m.rows.map(r => `<li class="st-${r.status}">${statusIcon(r.status)}<span><b>${r.a.label}:</b> ${esc(LABELS[r.pv])}${r.status !== 'match' ? ` <span class="muted">(yours: ${esc(LABELS[r.target])})</span>` : ''}</span></li>`).join('')}
          <li class="st-unknown">${statusIcon('unknown')}<span><b>Material:</b> ${esc(p.material)} <span class="muted">(can't compare from a photo)</span></span></li></ul>
        <div class="sus sus-${p.sustain.level}">${ic('leaf', 13)}<span>${esc(p.sustain.note)}</span></div>
        <div class="muted small" style="margin-top:6px">${m.pct}% ${m.color ? 'color similarity' : state.photo ? 'detail similarity' : 'visual match'}${x.e.adj ? `, ${x.e.adj > 0 ? '+' : ''}${Math.round(x.e.adj)} from your preferences` : ''}.</div>
      </div>` : ''}
      <div class="card-actions">
        <button class="btn btn-sm" data-act="compare" data-arg="${p.id}">${ic('compare', 14)} Compare</button>
        <button class="icon-btn" data-act="store" data-arg="${p.id}" title="View at store">${ic('external', 15)}</button>
        <span class="spacer"></span>
        <button class="icon-btn ${state.liked.includes(p.id) ? 'on-good' : ''}" data-act="up" data-arg="${p.id}" title="More like this">${ic('up', 15)}</button>
        <button class="icon-btn" data-act="down" data-arg="${p.id}" title="Not for me">${ic('down', 15)}</button>
      </div>
    </div>
    ${state.popover === p.id ? passPopover(p) : ''}
  </article>`;
}
function passPopover(p) {
  const r = [['price', 'Too expensive'], ['color', 'Wrong color'], ['shape', 'Wrong shape or fit'], ['brand', 'Not into this brand'], ['sustain', 'Not sustainable enough'], ['other', 'Just not for me']];
  return `<div class="pop"><div class="pop-head">What's off? <button class="icon-btn" data-act="closePop">${ic('x', 14)}</button></div>${r.map(([k, l]) => `<button data-act="passReason" data-arg="${p.id}|${k}">${l}</button>`).join('')}</div>`;
}

function viewOutfits() {
  const keys = Object.keys(ITEMS);
  const picks = keys.map(k => {
    const R = ranked(k);
    const exact = R.same[0] ? R.same[0].p : null;
    const pick = [...R.same, ...R.visible].sort((a, b) => b.score - a.score)[0];
    return { k, exact, pick: pick ? pick.p : null };
  });
  const exN = picks.filter(x => x.exact).length;
  const exTotal = picks.reduce((s, x) => s + (x.exact ? x.exact.price : 0), 0);
  const pkTotal = picks.reduce((s, x) => s + (x.pick ? x.pick.price : 0), 0);
  const prefs = prefSummary();
  return `${note('outfits')}
    <div class="panel">
      <div class="panel-head"><h3>Recreate the whole look</h3><span class="muted small">${prefs.length ? `Your picks use: ${esc(prefs.join(', '))}` : 'Set a budget or preferences to change your picks'}</span></div>
      <table class="look-table">
        <thead><tr><th>Piece</th><th>Likely exact</th><th>Top pick for you</th></tr></thead>
        <tbody>${picks.map(x => `<tr>
          <td><div class="look-piece">${crop(ITEMS[x.k].box, 'crop-sm')}<span>${ITEMS[x.k].label}</span></div></td>
          <td>${x.exact ? `${esc(x.exact.brand)} · <b>${money(x.exact.price)}</b>` : '<span class="muted">No confident match</span>'}</td>
          <td>${x.pick ? `<div class="look-pick"><img src="${IMG(x.pick.id)}" alt=""><span>${esc(x.pick.brand)} · <b>${money(x.pick.price)}</b>${x.pick.kind === 'secondhand' ? ' <span class="pc pc-good">Secondhand</span>' : ''}</span></div>` : '<span class="muted">None</span>'}</td>
        </tr>`).join('')}</tbody>
        <tfoot><tr><td>Total</td><td>${money(Math.round(exTotal * 100) / 100)} <span class="muted small">(${exN} of ${keys.length} pieces)</span></td><td>${money(Math.round(pkTotal * 100) / 100)}</td></tr></tfoot>
      </table>
    </div>
    <div class="outfit-head"><h3>Ways to wear the cardigan</h3><span class="ai-label">${ic('sparkle', 12)} AI styling ideas, not verified products</span></div>
    <div class="outfits">${OUTFITS.map(o => `<article class="outfit"><img src="${IMG(o.img)}" alt="${esc(o.title)}"><div class="outfit-body">
      <span class="vibe">${o.vibe}</span><h4>${esc(o.title)}</h4><p>${esc(o.why)}</p>
      <ul class="pieces">${o.pieces.map(([n, t]) => `<li><span class="pt pt-${t}">${t === 'found' ? 'Found' : t === 'own' ? 'You may own' : 'Shop'}</span>${esc(n)}</li>`).join('')}</ul>
      <button class="btn btn-sm" data-act="shopLook">Find the missing pieces</button></div></article>`).join('')}</div>`;
}

function renderPrefs() {
  const el = $('#prefPanel'); if (!el) return;
  const P = state.prefs, M = state.meta;
  const tag = k => M[k] === 'inferred'
    ? `<span class="src src-inf" title="I inferred this from your feedback">inferred</span><button type="button" class="mini good" data-act="keepPref" data-arg="${k}">Keep</button><button type="button" class="mini" data-act="dropPref" data-arg="${k}">Remove</button>`
    : M[k] === 'said' ? '<span class="src">you set</span>' : '';
  const sel = (k, opts, val) => `<select data-pref="${k}">${opts.map(([v, l]) => `<option value="${v}" ${String(val ?? '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const cls = k => M[k] === 'inferred' ? 'inf' : M[k] ? 'set' : '';
  const extras = [];
  if (P.length === 'longer') extras.push(['length', 'Longer length']);
  P.lessBrands.forEach(b => extras.push([`brand:${b}`, `Less ${b}`]));
  if (P.shapeBoost) extras.push(['shapeBoost', 'Fit & shape matter more']);
  if (P.colorFlex) extras.push(['colorFlex', 'Open to other colors']);
  const last = state.log[state.log.length - 1];
  el.innerHTML = `<div class="panel">
    <div class="panel-head"><h3>What I'm optimizing for</h3>${Object.keys(M).length ? '<button class="link small" data-act="resetPrefs">Reset</button>' : '<span class="muted small">Nothing set yet</span>'}</div>
    ${note('prefs')}
    <form class="shopping-form" data-shopping>
      ${shoppingFields(tag)}
      <button class="btn btn-sm btn-primary" type="submit">Apply filters</button>
    </form>
    <div class="pref-grid">
      <div class="pref ${cls('size')}"><span class="pref-l">Size ${tag('size')}</span>${sel('size', [['', 'Not set'], ['XS', 'XS'], ['S', 'S'], ['M', 'M'], ['L', 'L'], ['XL', 'XL']], P.size)}</div>
      <div class="pref ${cls('fast')}"><span class="pref-l">Fast fashion ${tag('fast')}</span>${sel('fast', [['', 'Show normally'], ['lower', 'Rank lower'], ['hide', 'Hide it']], P.fast)}</div>
    </div>
    ${extras.length ? `<div class="extras">${extras.map(([k, l]) => `<span class="chip ${M[k] === 'inferred' ? 'chip-inf' : ''}">${esc(l)}${M[k] === 'inferred' ? `<em>inferred</em><button data-act="keepPref" data-arg="${esc(k)}" title="Keep">${ic('check', 12)}</button>` : ''}<button data-act="dropPref" data-arg="${esc(k)}" title="Remove">${ic('x', 12)}</button></span>`).join('')}</div>` : ''}
    ${last ? `<div class="changes"><span class="muted">Last change:</span> <b>${esc(last.text)}</b> <span class="src ${last.source === 'inferred' ? 'src-inf' : ''}">${last.source === 'inferred' ? 'from feedback' : 'you said'}</span><span class="spacer"></span><button class="link small" data-act="undo">${ic('refresh', 12)} Undo</button></div>` : ''}
  </div>`;
}

function renderChat() {
  const log = $('#chatLog'); if (!log) return;
  const lastId = state.log.length ? state.log[state.log.length - 1].id : null;
  log.innerHTML = state.chat.map((m, i) => {
    if (m.role === 'sys') return `<div class="msg-sys ${m.inf ? 'inf' : ''}">${ic('refresh', 12)}<span>${m.html}</span>${m.undo != null && m.undo === lastId ? `<button class="link" data-act="undo">Undo</button>` : ''}</div>`;
    if (m.role === 'user') return `<div class="msg msg-user"><div class="bubble">${m.html}</div></div>`;
    return `<div class="msg msg-ai"><div class="avatar">${ic('sparkle', 13)}</div><div class="bubble">${m.typing ? '<span class="typing"><i></i><i></i><i></i></span>' : m.html}${m.actions && !m.used && !m.typing ? `<div class="msg-actions">${m.actions.map((a, j) => `<button class="qr" data-act="msgAction" data-arg="${i}|${j}">${esc(a.label)}</button>`).join('')}</div>` : ''}</div></div>`;
  }).join('');
  if ($('#assistant').open) log.scrollTop = log.scrollHeight;
  renderQuick();
}
function renderQuick() {
  const el = $('#quick'); if (!el) return;
  const P = state.prefs, q = [];
  if (P.budget == null && (P.minPrice ?? 0) <= 50) q.push('Under $50, please');
  if (!P.style) q.push('Secondhand first');
  if (!P.size) q.push("I'm a size S");
  if (P.length !== 'longer' && ['cardigan', 'skirt'].includes(state.item)) q.push('Something longer?');
  q.push(!state.photo && (state.item === 'loafers' || state.item === 'tote') ? 'Why no exact match?' : 'Why is #1 first?');
  q.push('How much should I trust this?');
  if (!state.photo && state.tab !== 'outfits') q.push('Style it for me');
  el.innerHTML = q.slice(0, 4).map(s => `<button class="qr" data-act="quick" data-arg="${esc(s)}">${esc(s)}</button>`).join('');
}

function renderModal() {
  const root = $('#modalRoot'); const md = state.modal;
  if (!md) { root.innerHTML = ''; return; }
  let inner = '';
  if (md.type === 'compare' && state.photo) {
    const p = byId(md.id), m = matchInfo(p);
    inner = `<div class="modal-head"><h3>Compare side by side</h3><button class="icon-btn" aria-label="Close" data-act="closeModal">${ic('x')}</button></div>
      <div class="cmp">
        <figure>${photoStage()}<figcaption>Your photo · highlighted scan area</figcaption></figure>
        <figure><div class="crop-wrap"><img src="${IMG(p.id)}" alt="${esc(p.title)}"></div><figcaption>${esc(p.title)} · sample listing</figcaption></figure>
      </div>
      ${m.color ? `<p class="scan-color">${photoSwatch()} Scanned color · ${m.pct}% similarity to ${esc(LABELS[m.color])}</p>`
        : `<ul class="why-rows">${m.rows.map(({a, target, pv, status}) => `<li>${statusIcon(status)} ${a.label}: ${esc(LABELS[target])} in your photo, ${esc(LABELS[pv])} in the listing</li>`).join('')}</ul>`}`;
  } else if (md.type === 'compare') {
    const p = byId(md.id), m = matchInfo(p), it = ITEMS[p.item];
    const unknownAttrs = it.attrs.filter(a => !a.w);
    inner = `<div class="modal-head"><h3>Compare side by side</h3><button class="icon-btn" data-act="closeModal">${ic('x')}</button></div>
      <div class="cmp">
        <figure><div class="crop-wrap">${crop(it.box)}</div><figcaption>Your photo <span class="muted">· cropped · ${it.conf}% sure this is a ${it.label.toLowerCase()}</span></figcaption></figure>
        <figure><div class="crop-wrap"><img src="${IMG(p.id)}" alt=""></div><figcaption>${esc(p.brand)} <span class="muted">· ${esc(p.title)} · ${money(p.price)}</span></figcaption></figure>
      </div>
      <table class="cmp-table"><thead><tr><th>Detail</th><th>Your photo</th><th>This listing</th><th>Match</th></tr></thead><tbody>
        ${m.rows.map(r => `<tr class="st-${r.status}"><td>${r.a.label}</td><td>${esc(LABELS[r.target])} <span class="conf conf-${state.corrected[`${p.item}.${r.a.key}`] ? 'you' : r.a.conf}"></span></td><td>${esc(LABELS[r.pv])}</td><td>${statusIcon(r.status)} ${r.status === 'match' ? 'Same' : r.status === 'partial' ? 'Close' : 'Different'}</td></tr>`).join('')}
        ${unknownAttrs.map(a => `<tr class="st-unknown"><td>${a.label}</td><td class="muted">${esc(LABELS[state.attrValues[p.item][a.key]])}</td><td>${a.key === 'material' ? esc(p.material) : '?'}</td><td>${statusIcon('unknown')} Can't tell</td></tr>`).join('')}
      </tbody></table>
      <div class="cant"><b>Things only you can check</b><ul><li>Fabric feel and quality</li><li>The true color in daylight (photos shift color)</li><li>Fit on your body: check the size chart and return policy</li><li>${esc(p.verify)}</li></ul></div>
      <div class="modal-actions"><button class="btn" data-act="closeModal">Back to results</button><button class="btn btn-primary" data-act="store" data-arg="${p.id}">View at ${esc(p.store)} ${ic('external', 14)}</button></div>`;
  } else if (md.type === 'saved') {
    const items = state.saved.map(byId);
    inner = `<div class="modal-head"><h3>Saved (${items.length})</h3><button class="icon-btn" data-act="closeModal">${ic('x')}</button></div>
      ${items.length ? `<div class="saved-list">${items.map(p => `<div class="saved-row"><img src="${IMG(p.id)}" alt=""><div><span class="brand">${esc(p.brand)}</span><div><b>${esc(p.title)}</b></div><div class="muted small">${money(p.price)} · ${esc(p.store)}</div></div><button class="btn btn-sm" data-act="store" data-arg="${p.id}">Store ${ic('external', 13)}</button><button class="icon-btn" data-act="save" data-arg="${p.id}" title="Remove">${ic('x', 14)}</button></div>`).join('')}</div>` : '<p class="muted">Nothing saved yet. Tap the heart on any result.</p>'}`;

  }
  root.innerHTML = `<div class="modal-bg" data-act="closeModal"><div class="modal" data-act="noop">${inner}</div></div>`;
}

/* ---------- render orchestration ---------- */
function render() {
  renderTop();
  const app = $('#app');
  if (state.view === 'home') { app.innerHTML = viewHome(); bindDrop(); }
  else if (state.view === 'analyzing') { app.innerHTML = viewAnalyzing(); updateAnalyzing(); }
  else if (state.view === 'setup') { app.innerHTML = viewSetup(); if (state.photo) bindScanRegion(); }
  else { app.innerHTML = wsSkeleton(); bindChat(); renderAll(); }
  renderModal();
}
function renderAll() {
  if (state.view !== 'workspace') return;
  renderTop(); renderPhoto(); renderCenter(); renderPrefs(); renderChat(); renderModal();
}
function bindDrop() {
  const d = $('#drop'), f = $('#file');
  f.addEventListener('change', () => { if (f.files[0]) onUpload(f.files[0]); f.value = ''; });
  ['dragover', 'dragenter'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => d.addEventListener(ev, e => { e.preventDefault(); d.classList.remove('over'); }));
  d.addEventListener('drop', e => { const file = e.dataTransfer.files[0]; if (file) onUpload(file); });
}
let uploadAttempt = 0;
function onUpload(file) {
  return loadPhoto(URL.createObjectURL(file));
}

function releasePhoto(url) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

async function loadPhoto(url, category) {
  const attempt = ++uploadAttempt;
  const status = $('#uploadStatus');
  status.textContent = 'Scanning your photo…';
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (attempt !== uploadAttempt || state.view !== 'home') return;
    const region = window.__REFERENCE_SEARCH ? { l: 10, t: 10, w: 80, h: 80 } : { ...SCAN_CROP };
    const rgb = scanColor(image, region);
    state = freshState();
    state.photo = { url, image, region, rgb };
    if (category) state.item = category;
    state.tab = 'similar';
    enterSetup();
  } catch {
    if (attempt === uploadAttempt && state.view === 'home') {
      status.textContent = 'Could not scan this image. Try a JPG or PNG.';
    }
  } finally {
    if (state.photo?.url !== url) releasePhoto(url);
  }
}
function scanPreview() {
  return state.photo.rgb ? `${photoSwatch()} Scanned color` : 'Move the box over a visible area to scan.';
}

function bindScanRegion() {
  const stage = $('.scan-photo');
  const box = $('.scan-region', stage);
  const photo = state.photo;
  const analyze = $('[data-act="analyzeGarment"]');
  if (analyze) analyze.disabled = !photo.rgb;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function adjust(start, dx, dy, resize) {
    const region = resize
      ? { ...start, w: clamp(start.w + dx, MIN_SCAN_SIZE, 100 - start.l), h: clamp(start.h + dy, MIN_SCAN_SIZE, 100 - start.t) }
      : { ...start, l: clamp(start.l + dx, 0, 100 - start.w), t: clamp(start.t + dy, 0, 100 - start.h) };
    photo.rgb = scanColor(photo.image, region);
    photo.region = region;
    if (photo.analysis || photo.analyzing) {
      photo.analysis = null;
      photo.analyzing = false;
      $('#visionReview').innerHTML = window.__REFERENCE_SEARCH
        ? '<h2>Reference matches</h2><p class="muted">Analyze the new crop to update your matches.</p>' : '';
      $('#visionStatus').textContent = 'The scan area changed. Analyze the new crop to update its details.';
    }
    if (analyze) analyze.disabled = !photo.rgb;
    box.style.cssText = pos(region);
    $('#scanColor').innerHTML = scanPreview();
    const confirm = $('[data-shopping] button[type="submit"]');
    if (confirm) confirm.disabled = !photo.rgb;
  }

  let drag;
  box.addEventListener('pointerdown', e => {
    if (e.button !== 0 || drag || !e.target.matches('button')) return;
    const { width, height } = stage.getBoundingClientRect();
    drag = {
      id: e.pointerId, x: e.clientX, y: e.clientY, width, height,
      start: photo.region, resize: e.target.classList.contains('scan-resize'),
    };
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', e => {
    if (drag?.id !== e.pointerId) return;
    adjust(drag.start, (e.clientX - drag.x) / drag.width * 100, (e.clientY - drag.y) / drag.height * 100, drag.resize);
  });
  box.addEventListener('lostpointercapture', () => { drag = null; });
  box.addEventListener('keydown', e => {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!delta || drag) return;
    e.preventDefault();
    adjust(photo.region, ...delta, e.target.classList.contains('scan-resize'));
  });
}

function visionFields(category) {
  return ITEMS[category].attrs.flatMap(attribute => {
    const values = [...new Set(PRODUCTS.filter(p => p.item === category).map(p => p.attrs[attribute.key]).filter(Boolean))];
    if (!attribute.w || attribute.key === 'tmat' || !values.length) return [];
    return [{ ...attribute, values: ['unknown', ...new Set([...values, ...attribute.options])] }];
  });
}

function renderVisionReview(category) {
  const analysis = state.photo?.analysis;
  if (!analysis) return;
  const values = analysis.category === category ? analysis.attributes : {};
  $('#visionReview').innerHTML = `<fieldset class="vision-fields">
    <legend>Review garment details</legend>
    ${visionFields(category).map(field => `<label class="pref"><span class="pref-l">${field.label}</span>
      <select name="vision-${field.key}">${options(field.values.map(value => [value, LABELS[value]]), values[field.key] || 'unknown')}</select></label>`).join('')}
  </fieldset>`;
}

function renderReferenceResults({ category, details, matches }) {
  $('#visionReview').innerHTML = `<h2>Reference matches</h2>
    ${!['unknown', 'no garment'].includes(category) ? `<p>Detected garment: <strong>${esc(category)}</strong></p>` : ''}
    ${details.length ? `<p class="muted">${details.map(esc).join(' · ')}</p>` : ''}
    ${matches.length ? `<p class="hint">Dataset photos with simulated prices and conditions.</p>
      <div class="reference-grid">${matches.map(match => `<article class="card">
        <img src="${esc(match.image)}" alt="${esc(match.category)} reference photo" loading="lazy">
        <div class="card-body"><h3>${esc(match.category)}</h3><strong>${money(match.price)} sample price</strong>
          <p class="muted small">${esc(match.audience)} · ${esc(match.condition)} (sample condition)</p>
        </div>
      </article>`).join('')}</div>` : '<p class="muted">No close matches found.</p>'}`;
}

async function analyzeGarment() {
  const photo = state.photo;
  if (!window.__VISION || !photo?.rgb || photo.analyzing) return;
  const region = photo.region;
  const button = $('[data-act="analyzeGarment"]');
  const status = $('#visionStatus');
  const item = $('[data-shopping] select[name="item"]');
  const isCurrent = () => state.view === 'setup' && state.photo === photo && photo.region === region;
  photo.analyzing = true;
  button.disabled = true;
  status.textContent = 'Analyzing the selected crop…';
  try {
    const { image } = photo;
    const x = region.l * image.naturalWidth / 100;
    const y = region.t * image.naturalHeight / 100;
    const width = region.w * image.naturalWidth / 100;
    const height = region.h * image.naturalHeight / 100;
    const scale = Math.min(1, 1024 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
    const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .85));
    if (!isCurrent()) return;
    if (!jpeg) throw new Error('Could not create a crop.');
    const response = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'image/jpeg' }, body: jpeg });
    if (!response.ok) throw new Error('Analysis request failed.');
    const result = await response.json();
    if (!isCurrent()) return;
    if (window.__REFERENCE_SEARCH) {
      photo.analysis = result;
      renderReferenceResults(result);
      status.textContent = result.matches.length ? `Found ${result.matches.length} close reference matches.` : 'No close matches found.';
      return;
    }
    const recognized = Object.hasOwn(ITEMS, result.category);
    photo.analysis = result;
    if (recognized) item.value = result.category;
    $('#detectedDetails').textContent = detectedDetails(item.value);
    renderVisionReview(item.value);
    status.textContent = recognized ? 'Review the detected garment and details before searching.' : 'Choose a category and fill in any details you can see.';
  } catch {
    if (isCurrent()) status.textContent = window.__REFERENCE_SEARCH
      ? 'Could not analyze this crop. Please try again.'
      : 'Could not analyze this crop. Try again or search by color.';
  } finally {
    if (isCurrent()) {
      photo.analyzing = false;
      button.disabled = !photo.rgb;
    }
  }
}

function bindChat() {
  $('#assistant').addEventListener('toggle', () => {
    const log = $('#chatLog');
    if (log) log.scrollTop = log.scrollHeight;
  });
  $('#chatForm').addEventListener('submit', e => {
    e.preventDefault(); const inp = $('#chatInput'); const v = inp.value.trim(); if (!v) return; inp.value = ''; handleUserText(v);
  });
}
function startAnalysis() {
  uploadAttempt++;
  clearTimeout(timer);
  state = freshState(); state.view = 'analyzing'; state.step = 0; render();
  const tick = () => {
    state.step++; updateAnalyzing();
    timer = setTimeout(state.step < STEPS.length ? tick : enterSetup, state.step < STEPS.length ? 720 : 650);
  };
  timer = setTimeout(tick, 650);
}
function enterSetup() { clearTimeout(timer); state.view = 'setup'; render(); }
function pickItem(k, silent) {
  if (!ITEMS[k]) return;
  const changed = state.item !== k;
  state.item = k; state.popover = null; state.editing = null; state.moves = {}; state.rerank = null; state.showHidden = false;
  if (!state.photo && (state.tab === 'outfits' || changed)) state.tab = 'same';
  renderAll();
  if (!silent) onItemVisit(k); else state.visited[k] = true;
}

/* ---------- events ---------- */
const ACTIONS = {
  analyzeGarment,
  useDatasetPhoto: key => { if (DATASET_PHOTOS.includes(key)) return loadPhoto(IMG(key), 'skirt'); },
  useSample: () => { ACTIONS.closeModal(); startAnalysis(); },
  skip: enterSetup,
  openFilters: () => {
    const filters = $('#filters');
    filters.open = true;
    filters.querySelector('summary').focus();
  },
  newPhoto: () => { clearTimeout(timer); releasePhoto(state.photo?.url); state = freshState(); render(); },
  toggleNotes: () => { notesOn = !notesOn; document.body.classList.toggle('notes-on', notesOn); renderTop(); },
  openSaved: () => { state.modal = { type: 'saved' }; renderModal(); },
  closeModal: () => { state.modal = null; renderModal(); },
  noop: () => {},
  pickItem: (k, el) => {
    pickItem(k);
    $(`.${el.classList.contains('box') ? 'box.sel' : 'item-chip.on'}`)?.focus({ preventScroll: true });
  },
  tab: t => { state.tab = t; state.popover = null; renderCenter(); renderQuick(); $('.tab.on')?.focus({ preventScroll: true }); },
  editAttr: key => { const id = `${state.item}.${key}`; state.editing = state.editing === id ? null : id; renderPhoto(); },
  setAttr: arg => {
    const [key, val] = arg.split('|'); const item = state.item; const a = ITEMS[item].attrs.find(x => x.key === key);
    if (state.attrValues[item][key] === val) { state.editing = null; renderPhoto(); return; }
    const exactBefore = ranked(item).same.map(x => x.p.id);
    applyChange(() => {
      state.attrValues[item][key] = val; state.editing = null;
      if (val === a.value) delete state.corrected[`${item}.${key}`]; else state.corrected[`${item}.${key}`] = true;
    }, `${a.label.toLowerCase()} is ${LABELS[val].toLowerCase()}`, 'said');
    const exactNow = ranked(item).same.map(x => x.p.id);
    const lost = exactBefore.filter(id => !exactNow.includes(id)).map(byId);
    const gained = exactNow.filter(id => !exactBefore.includes(id)).map(byId);
    let msg = `Thanks for the fix. I'm now searching for <b>${LABELS[val].toLowerCase()}</b> ${a.label.toLowerCase()} instead.`;
    const topNow = ranked(item).visible[0];
    if (lost.length) msg += ` So <b>${esc(lost[0].title)}</b> is no longer a confident exact match. ${topNow && topNow.p.id === lost[0].id ? "It's still the closest option overall, so it's now at the top of Similar." : 'I moved it to Similar.'}`;
    if (gained.length) msg += ` <b>${esc(gained[0].title)}</b> now looks like the same item.`;
    if (!lost.length && !gained.length && topNow) msg += ` Top similar pick is now <b>${esc(topNow.p.title)}</b>.`;
    const better = catalogFor(item).filter(p => p.attrs[key] === val && !exactNow.includes(p.id) && (!topNow || p.id !== topNow.p.id));
    if (better.length) msg += ` ${esc(better[0].brand)}'s ${esc(better[0].title.toLowerCase())} has that ${a.label.toLowerCase()}, but differs in other details.`;
    aiSay(msg);
  },
  lockAttr: key => {
    const item = state.item, id = `${item}.${key}`, a = ITEMS[item].attrs.find(x => x.key === key), v = LABELS[state.attrValues[item][key]].toLowerCase();
    const on = !state.locks[id];
    applyChange(() => { if (on) state.locks[id] = true; else delete state.locks[id]; }, on ? `must have ${v} ${a.label.toLowerCase()}` : `${a.label.toLowerCase()} no longer required`, 'said');
    const R = ranked(item);
    aiSay(on ? `Okay, I'll only show ${ITEMS[item].label.toLowerCase()} options with ${v} ${a.label.toLowerCase()}. ${R.hiddenLocks.length ? `${R.hiddenLocks.length} hidden because they don't have it.` : 'Nothing had to be hidden.'}` : `Unlocked. ${a.label} is a nice-to-have again.`, null, 500);
  },
  compare: id => { state.modal = { type: 'compare', id }; renderModal(); },
  store: id => { const p = byId(id); toast(`Demo: in the real app this opens ${esc(p.store)}. Store names and prices here are made up.`); },
  save: id => { state.saved = toggleIn(state.saved, id); renderTop(); if (state.view === 'workspace') { renderCenter(); } renderModal(); toast(state.saved.includes(id) ? 'Saved' : 'Removed from saved'); },
  up: id => likeItem(id),
  down: id => { state.popover = state.popover === id ? null : id; renderCenter(); },
  closePop: () => { state.popover = null; renderCenter(); },
  passReason: arg => { const [id, r] = arg.split('|'); passReason(id, r); },
  unhide: id => { const p = byId(id); applyChange(() => { state.hidden = state.hidden.filter(x => x !== id); }, `brought back "${p.title}"`, 'said'); },
  toggleWhy: id => { state.expanded = toggleIn(state.expanded, id); renderCenter(); },
  showHidden: () => { state.showHidden = !state.showHidden; renderCenter(); },
  whyRerank: () => {
    const assistant = $('#assistant'); assistant.open = true; assistant.querySelector('summary').focus();
    const R = ranked(state.item); const ups = Object.entries(state.moves).filter(([, v]) => v === 'new' || v > 0).map(([id]) => byId(id));
    const top = R.visible[0];
    let msg = state.rerank ? `After <b>${esc(state.rerank.text)}</b>: ` : '';
    msg += ups.length ? `${ups.map(p => `<b>${esc(p.title)}</b>`).join(' and ')} moved up. ` : 'The order of results did not change. ';
    if (top) msg += `<br><br>${explainTop()}`;
    aiSay(msg, null, 500);
  },
  dismissRerank: () => { state.rerank = null; state.moves = {}; renderCenter(); },
  undo: undoLast,
  msgAction: arg => {
    const [i, j] = arg.split('|').map(Number); const m = state.chat[i]; if (!m || m.used) return;
    m.used = true; const a = m.actions[j];
    state.chat.push({ role: 'user', html: esc(a.label) }); renderChat();
    a.fn();
  },
  quick: text => handleUserText(text),
  keepPref: k => { state.meta[k] = 'said'; state.chat.push({ role: 'sys', html: `Kept as your preference: ${esc(k.replace('brand:', 'less '))}` }); renderPrefs(); renderChat(); },
  dropPref: k => {
    const label = { budget: 'budget', style: 'shopping style', size: 'size', fast: 'fast fashion setting', length: 'longer length', shapeBoost: 'fit & shape boost', colorFlex: 'open to other colors' }[k] || k.replace('brand:', 'less ');
    applyChange(() => {
      if (k.startsWith('brand:')) state.prefs.lessBrands = state.prefs.lessBrands.filter(b => b !== k.slice(6));
      else if (k === 'shapeBoost' || k === 'colorFlex') state.prefs[k] = false;
      else state.prefs[k] = null;
      delete state.meta[k];
    }, `removed ${label}`, 'said');
    aiSay(`Removed. ${effectSummary()}`, null, 500);
  },
  resetPrefs: () => { applyChange(resetPrefsMut, 'cleared all preferences', 'said'); aiSay('Cleared. I\'m back to ranking only by how closely things look like your photo.', null, 500); },
  shopLook: () => toast('In the full version, this searches for each missing piece using your preferences.'),
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'BUTTON' || el.dataset.act !== 'noop') e.preventDefault();
  fn(el.dataset.arg, el, e);
});
document.addEventListener('submit', e => {
  const form = e.target;
  if (!form.matches('[data-shopping]')) return;
  e.preventDefault();
  const data = new FormData(form);
  const price = key => data.get(key) === '' ? null : Number(data.get(key));
  const brands = key => [...new Map(data.get(key).split(',').map(name => name.trim())
    .filter(Boolean).map(name => [name.toLowerCase(), name])).values()];
  const next = {
    minPrice: price('minPrice'), budget: price('budget'),
    preferredBrands: brands('preferredBrands'), excludedBrands: brands('excludedBrands'),
    secondhand: data.get('secondhand') || null, style: data.get('style') || null,
  };
  if (next.minPrice != null && next.budget != null && next.minPrice > next.budget) {
    const budget = form.elements.budget;
    budget.setCustomValidity('Enter a maximum price at least as high as the minimum.');
    budget.reportValidity();
    return;
  }
  const apply = () => {
    for (const [key, value] of Object.entries(next)) {
      if (JSON.stringify(state.prefs[key]) === JSON.stringify(value)) continue;
      state.prefs[key] = value;
      if (Array.isArray(value) ? value.length : value != null) state.meta[key] = 'said';
      else delete state.meta[key];
    }
  };
  if (state.view === 'setup') {
    if (state.photo && !state.photo.rgb) return;
    apply();
    state.item = data.get('item');
    if (state.photo?.analysis) {
      const attributes = Object.fromEntries(visionFields(state.item).map(field => {
        const value = data.get(`vision-${field.key}`);
        return [field.key, field.values.includes(value) ? value : 'unknown'];
      }));
      state.photo.confirmed = { category: state.item, attributes };
    }
    state.view = 'workspace';
    render();
    onItemVisit(state.item);
  } else if (Object.keys(next).some(key => JSON.stringify(next[key]) !== JSON.stringify(state.prefs[key]))) {
    applyChange(apply, 'updated shopping filters');
    ACTIONS.openFilters();
  }
});
document.addEventListener('input', e => {
  const form = e.target.form;
  if (form?.matches('[data-shopping]')) form.elements.budget.setCustomValidity('');
});
document.addEventListener('change', e => {
  const s = e.target;
  if (state.view === 'setup' && s.matches('[name="item"]')) {
    $('#detectedDetails').textContent = detectedDetails(s.value);
    renderVisionReview(s.value);
  }
  if (s.matches('[data-sort]')) { state.sort = s.value; state.moves = {}; state.rerank = null; renderCenter(); return; }
  if (s.matches('[data-pref]')) {
    const k = s.dataset.pref, v = s.value;
    const text = {
      fast: { lower: 'rank fast fashion lower', hide: 'hide ultra-fast fashion', '': 'show fast fashion normally' }[v],
      size: v ? `size ${v}` : 'size not set',
    }[k];
    applyChange(() => {
      state.prefs[k] = v || null;
      if (v === '') delete state.meta[k]; else state.meta[k] = 'said';
    }, text, 'said');
    aiSay(effectSummary(), null, 600);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.modal) ACTIONS.closeModal(); });

/* ---------- boot ---------- */
document.head.insertAdjacentHTML('beforeend', `<style>.hero-bg{background-image:url("${IMG('hero')}")}</style>`);
render();
