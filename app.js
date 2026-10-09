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
