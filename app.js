'use strict';
/* Spotted: clickable prototype. Every "AI" output here is scripted demo data.
   Swap points for real models are marked with  // LIVE:  comments. */

const IMG = k => (window.__IMAGES && window.__IMAGES[k]) || `img/${k}.jpg`;
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
const clone = o => JSON.parse(JSON.stringify(o));
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);

