// Planche de contrôle générique : node board.js <module> <sortie.png> <json des cellules> [colonnes] [largeur] [échelle]
// Chaque cellule : { cfg: {...}, label: '...' }
const path = require('path');
const { chromium } = require('playwright');
const mod = require(path.resolve(process.argv[2]));
const out = process.argv[3];
const cells = JSON.parse(require('fs').readFileSync(process.argv[4], 'utf8'));
const cols = Number(process.argv[5] || 6);
const w = Number(process.argv[6] || 150);
const scale = Number(process.argv[7] || 1);
const fill = (tpl, f) => tpl.replace(/\{\{f\.(\w+)\}\}/g, (m, key) => (f[key] === undefined ? '' : String(f[key])));
const html = `<!doctype html><html><body style="margin:0;background:#1C0E33">
<div style="display:grid;grid-template-columns:repeat(${cols},${w + 30}px);gap:8px;padding:16px">
${cells.map((c, i) => `<div style="display:flex;flex-direction:column;align-items:center;font:12px sans-serif;color:#FFF4E3;background:linear-gradient(180deg,#B3206F,#F7893B);padding:6px 0">${fill(mod.TEMPLATE, mod.gen(Object.assign({ id: 'c' + i, w }, c.cfg)))}<span style="margin-top:4px">${c.label || ''}</span></div>`).join('')}
</div></body></html>`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: cols * (w + 38) + 40, height: 600 }, deviceScaleFactor: scale });
  await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  console.log('ok', out);
})();
