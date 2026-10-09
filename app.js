'use strict';
/* Spotted: clickable prototype. Every "AI" output here is scripted demo data.
   Swap points for real models are marked with  // LIVE:  comments. */

const IMG = k => (window.__IMAGES && window.__IMAGES[k]) || `img/${k}.jpg`;
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

// LIVE: replace ITEMS with the output of a vision model (Gemini) that returns boxes + attributes + confidence.
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
const freshPrefs = () => ({ budget: null, style: null, fast: null, size: null, length: null, lessBrands: [], shapeBoost: false, colorFlex: false });
function freshState() {
  const attrValues = {};
  for (const [k, it] of Object.entries(ITEMS)) { attrValues[k] = {}; for (const a of it.attrs) attrValues[k][a.key] = a.value; }
  return {
    view: 'home', step: 0, item: 'cardigan', tab: 'same', sort: 'best',
    attrValues, corrected: {}, locks: {}, prefs: freshPrefs(), meta: {},
    hidden: [], liked: [], saved: [], expanded: [], popover: null, editing: null, showHidden: false,
    chat: [], log: [], moves: {}, rerank: null, modal: null, visited: { cardigan: true },
  };
}
let state = freshState();
let notesOn = false;
let logSeq = 0;
let timer = null;

/* ---------- matching + ranking ---------- */
function weightFor(a) {
  let w = a.w; const P = state.prefs;
  if (P.shapeBoost && ['neck', 'length', 'pleats', 'slen', 'lstyle'].includes(a.key)) w *= 1.6;
  if (P.colorFlex && ['color', 'pattern'].includes(a.key)) w *= 0.4;
  return w;
}
function matchInfo(p) {
  const it = ITEMS[p.item], vals = state.attrValues[p.item];
  let tot = 0, got = 0; const rows = [];
  for (const a of it.attrs) {
    if (!a.w) continue;
    const target = vals[a.key], pv = p.attrs[a.key], s = sim(target, pv), w = weightFor(a);
    tot += w; got += w * s;
    rows.push({ a, target, pv, s, status: s >= .85 ? 'match' : s >= .45 ? 'partial' : 'diff' });
  }
  const pct = Math.round(p.visual * (got / tot) * 100);
  return { pct, rows, nMatch: rows.filter(r => r.status === 'match').length, n: rows.length };
}
const matchLabel = pct => pct >= 85 ? 'Likely the same item' : pct >= 70 ? 'Very close' : pct >= 50 ? 'Similar' : 'Same vibe';
const dotsHtml = rows => `<span class="dots">${rows.map(r => `<i class="d d-${r.status}" title="${esc(r.a.label)}: ${r.status === 'match' ? 'matches' : r.status === 'partial' ? 'close' : 'different'}"></i>`).join('')}</span>`;
const isClothing = p => ['cardigan', 'skirt'].includes(p.item);

function prefEffects(p) {
  const P = state.prefs; let adj = 0; const chips = []; let hidden = null;
  if (state.hidden.includes(p.id)) hidden = 'you passed on it';
  if (p.kind === 'fast' && P.fast === 'hide') hidden = hidden || 'ultra-fast fashion';
  if (P.budget != null) {
    if (p.price > P.budget) { const over = p.price - P.budget; adj -= 30 + over; chips.push(['warn', `${money(Math.round(over))} over budget`]); }
    else chips.push(['good', 'Within budget']);
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
function ranked(item) {
  const all = PRODUCTS.filter(p => p.item === item).map(p => {
    const m = matchInfo(p), e = prefEffects(p);
    const lockFails = m.rows.filter(r => state.locks[`${item}.${r.a.key}`] && r.status === 'diff');
    return { p, m, e, lockFails, score: m.pct + e.adj };
  });
  const canExact = !ITEMS[item].noExact;
  const sameAll = all.filter(x => canExact && x.m.pct >= 85);
  const same = sameAll.filter(x => !x.e.hidden);
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
  if (P.budget != null) out.push(`under $${P.budget}`);
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
  const R = ranked(state.item), it = ITEMS[state.item], P = state.prefs, parts = [];
  const top = R.visible[0];
  if (top) parts.push(`Top similar pick is now <b>${esc(top.p.title)}</b> (${money(top.p.price)}${top.p.kind === 'secondhand' ? ', secondhand' : top.p.sustain.level === 'good' ? ', sustainable' : ''}).`);
  if (P.style === 'secondhand' && top && top.p.kind !== 'secondhand') {
    const i = R.visible.findIndex(x => x.p.kind === 'secondhand');
    if (i > 0) { const x = R.visible[i]; parts.push(`The best secondhand option, <b>${esc(x.p.title)}</b> (${money(x.p.price)}), is #${i + 1} because it looks less like your photo (${x.m.nMatch} of ${x.m.n} details). I boosted it, but not above much closer matches.`); }
    else if (i === -1) parts.push(`I couldn't find a secondhand ${ITEMS[state.item].label.toLowerCase()} that looks like yours yet.`);
  }
  if (P.length === 'longer' && top && ['cardigan', 'skirt'].includes(state.item)) {
    const isLong = x => x.p.attrs.length === 'hip' || x.p.attrs.slen === 'knee';
    const i = R.visible.findIndex(isLong);
    if (i > 0) { const x = R.visible[i]; parts.push(`The longest option, <b>${esc(x.p.title)}</b>, is #${i + 1}: I boosted it, but it looks less like your photo (${x.m.nMatch} of ${x.m.n} details).`); }
  }
  if (P.budget != null) {
    const all = PRODUCTS.filter(p => p.item === state.item), ok = all.filter(p => p.price <= P.budget).length;
    parts.push(`${ok} of ${all.length} ${it.label.toLowerCase()} options fit a $${P.budget} budget.`);
    const ex = R.same.find(x => x.p.price > P.budget);
    if (ex) parts.push(`Heads up: the likely-exact one is ${money(ex.p.price)}, over your budget. I kept it under Same item (marked) instead of hiding it, in case it's worth the splurge.`);
  }
  const hid = R.hiddenAll.length;
  if (hid) parts.push(`${hid} ${hid > 1 ? 'are' : 'is'} hidden, but you can still show ${hid > 1 ? 'them' : 'it'} at the bottom of Similar.`);
  return parts.join(' ') || 'Done. Nothing moved for this piece.';
}
function explainTop() {
  const R = ranked(state.item);
  const x = (state.tab === 'same' && R.same[0]) || R.visible[0];
  if (!x) return "There's nothing to rank for this piece right now.";
  const m = x.m.rows.filter(r => r.status === 'match').map(r => r.a.label.toLowerCase());
  const d = x.m.rows.filter(r => r.status !== 'match').map(r => `${r.a.label.toLowerCase()} (${LABELS[r.pv].toLowerCase()} vs. ${LABELS[r.target].toLowerCase()} in your photo)`);
  const good = x.e.chips.filter(c => c[0] === 'good').map(c => c[1].toLowerCase());
  return `<b>${esc(x.p.title)}</b> is first because ${x.m.nMatch} of ${x.m.n} visible details match (${m.join(', ') || 'none'})${good.length ? `, and it fits what you told me (${good.join(', ')})` : ''}.${d.length ? ` It differs on ${d.join(', ')}.` : ''}<br><br>How I rank: how closely it looks like your photo counts most. Your preferences then move things up or down.`;
}
function explainItem(k) {
  if (k === 'loafers') return "The loafers are small in your photo (about 5% of it) and seen at an angle. I can tell they're black penny loafers, but not the sole or the brand. So my best result is labeled <b>Very close</b>, not <b>Same item</b>. A closer photo of the shoes would help.";
  if (k === 'tote') return "It's a plain canvas tote with no visible logo. Hundreds of brands sell nearly identical ones, so calling anything an exact match would be a guess. I'd rather say so than make one up.";
  return explainTop();
}
const TRUST = "Trust me most on what's clearly visible: color, pattern, shape, and details like buttons. Double-check what a photo can't show: fabric, the true shade, sizing, and whether a plain item is really the same brand. Each result has a <b>Before you buy</b> note with what to verify.";

