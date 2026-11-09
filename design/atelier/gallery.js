const path = require('path');
const { chromium } = require('playwright');
const { gen, TEMPLATE, PRESETS } = require(path.join(__dirname, 'fighter.js'));
const fill = (tpl, f) => tpl.replace(/\{\{f\.(\w+)\}\}/g, (m, key) => (f[key] === undefined ? '' : String(f[key])));
const B0 = PRESETS[0].cfg;
const VARIANTS = [
  { name: 'Base', move: 'tel quel', cfg: B0 },
  { name: 'Peau + afro', move: 'Cacao, afro, moustache', cfg: Object.assign({}, B0, { skin: 'cacao', hairStyle: 'afro', hairColor: 'noir', beard: 'moustache' }) },
  { name: 'Version senior', move: 'Dégarni, barbe blanche', cfg: Object.assign({}, B0, { age: 'senior', hairStyle: 'receding', hairColor: 'blanc', beard: 'big' }) },
  { name: 'Version kimono', move: 'Rasé, ceinture noire', cfg: Object.assign({}, B0, { outfit: 'kimono', main: undefined, boot: undefined, trim: undefined, hairStyle: 'buzz', eyes: 'etires' }) },
  { name: 'Version catch', move: 'Masque lucha magenta', cfg: Object.assign({}, B0, { outfit: 'catch', mask: true, main: '#E8287C', trim: '#FFD23D', boot: undefined }) },
  { name: 'Version punk', move: 'Crête bleue, lunettes', cfg: Object.assign({}, B0, { hairStyle: 'mohawk', hairColor: 'bleu', acc: ['earrings', 'glassesSquare'], outfit: 'track', main: '#140A22', trim: '#2BB5FF', boot: undefined }) }
];
const cell = (p, i) => `<div class="c">${fill(TEMPLATE, gen(Object.assign({ id: 'g' + i + p.name.length, w: 170 }, p.cfg)))}<b>${p.name}</b><span>« ${p.move} »</span></div>`;
const html = `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Lilita+One&family=Rubik:wght@400;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;font-family:Rubik,sans-serif;background:#1C0E33">
<div style="width:1320px;background:#1C0E33;color:#FFF4E3;padding:28px 30px 36px;box-sizing:border-box">
 <div style="font-family:'Lilita One';font-size:40px;color:#FFD23D;text-shadow:3px 3px 0 #140A22">CHOISIS TON COMBATTANT</div>
 <div style="font-size:15px;color:#CDB8F0;margin:4px 0 14px">12 personnages prêts à l'emploi, à retoucher. La silhouette suit ensuite la corpulence réelle de chaque joueur.</div>
 <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px 6px">${PRESETS.map(cell).join('')}</div>
 <div style="font-family:'Lilita One';font-size:28px;color:#FFD23D;text-shadow:2px 2px 0 #140A22;margin:28px 0 4px">Exemple de retouches sur « Le Bulldozer »</div>
 <div style="font-size:15px;color:#CDB8F0;margin-bottom:14px">Peau, visage, coiffure, barbe, accessoires, tenue, âge : on garde la base et on se l'approprie.</div>
 <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:14px 6px">${VARIANTS.map(cell).join('')}</div>
</div>
<style>.c{display:flex;flex-direction:column;align-items:center;background:linear-gradient(180deg,#3A1A5E 0 14%,#6B1E6E 14% 28%,#B3206F 28% 42%,#E8287C 42% 56%,#F25C4A 56% 68%,#F7893B 68% 80%,#FFB23D 80% 100%);border:3px solid #140A22;border-radius:14px;padding:8px 4px 10px}.c b{font-family:'Lilita One';font-weight:400;font-size:19px;color:#FFF4E3;text-shadow:2px 2px 0 #140A22;margin-top:2px}.c span{font-size:12px;color:#FFF4E3;text-shadow:1px 1px 0 #140A22;text-align:center}</style>
</body></html>`;
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: Number(process.argv[3] || 1) }); await p.setContent(html, { waitUntil: 'networkidle' }).catch(() => {}); await p.waitForTimeout(600); await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close(); console.log('ok'); })();
