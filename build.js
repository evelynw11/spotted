// Bundles index.html + styles.css + app.js + img/*.jpg into one self-contained file.
// Usage: node build.js   ->  writes spotted-demo.html
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const read = f => fs.readFileSync(path.join(dir, f), 'utf8');

const images = {};
for (const f of fs.readdirSync(path.join(dir, 'img'))) {
  if (!f.endsWith('.jpg')) continue;
  images[f.replace('.jpg', '')] = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(dir, 'img', f)).toString('base64');
}

let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="styles.css">', () => `<style>\n${read('styles.css')}\n</style>`);
html = html.replace('<script src="app.js"></script>', () =>
  `<script>window.__IMAGES=${JSON.stringify(images)};</script>\n<script>\n${read('app.js')}\n</script>`);

fs.writeFileSync(path.join(dir, 'spotted-demo.html'), html);
console.log(`spotted-demo.html written (${(html.length / 1024 / 1024).toFixed(2)} MB, ${Object.keys(images).length} images)`);
