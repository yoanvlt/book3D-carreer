// Vues de détail pour comparer deux versions : pour chaque bâtiment, la silhouette vue depuis
// l'accueil, la façade depuis l'allée et un gros plan devant la porte ; les six intérieurs ; le
// dessous de l'île. Caméra fixe (mode photo de ?debug=1), interface masquée.
//   npm run capture:details -- <dossier> [webp|png] [kit]
// Avec « kit » : planche du kit de construction (?debug=1&kit) au lieu des bâtiments.
// Variables : URL (défaut http://127.0.0.1:4173/book3D-carreer/), QUALITE (high|low),
// LIEUX (ex. profile,veolia : seulement ces bâtiments), VUES (exterieur|interieur|ile, séparées par des virgules).
import { mkdir, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
import { chromium } from 'playwright';

const [out = 'docs/screenshots/v6/details', format = 'webp', mode = 'batiments'] = process.argv.slice(2);
const base = process.env.URL ?? 'http://127.0.0.1:4173/book3D-carreer/';
const quality = process.env.QUALITE ?? 'high';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + (mode === 'kit' ? '?debug=1&kit' : '?debug=1'));
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate((q) => window.__careerverse.setState({ quality: q, qualityAuto: false }), quality);
// Seule la scène reste visible : chaque voisin du canvas, à chaque niveau, est masqué (à chaque
// vue, car l'interface d'un intérieur apparaît après coup).
const hideInterface = () =>
  page.evaluate(() => {
    let node = document.querySelector('canvas');
    while (node && node !== document.body) {
      for (const sibling of node.parentElement.children)
        if (sibling !== node) sibling.style.setProperty('visibility', 'hidden', 'important');
      node = node.parentElement;
    }
  });
const diag = () =>
  page.evaluate(() => {
    try {
      return JSON.parse(document.getElementById('diagnostics')?.textContent || '{}');
    } catch {
      return {};
    }
  });
const report = { qualite: quality, vues: {}, erreurs: errors };
async function shoot(name, shot) {
  await page.evaluate((s) => window.__careerverse.photo(s), shot);
  await hideInterface();
  await page.waitForTimeout(2500);
  await saveShot(page, `${out}/${name}`, { format });
  const d = await diag();
  report.vues[name] = { drawCalls: d.drawCalls, triangles: d.triangles };
}

if (mode === 'kit') {
  await shoot('kit-ensemble', { position: [4, 34, 52], target: [4, 0, 0], fov: 50 });
  await shoot('kit-matieres', { position: [0, 3.2, 27], target: [0, 1.6, 18], fov: 62 });
  await shoot('kit-facades', { position: [-14, 4, 13], target: [-14, 2.6, 0], fov: 55 });
  await shoot('kit-fenetres', { position: [-22, 2.6, 7.5], target: [-22, 2.4, 2.5], fov: 50 });
  await shoot('kit-toitures', { position: [8, 16, 14], target: [10, 2, -7], fov: 58 });
  await shoot('kit-structures', { position: [40, 9, -2], target: [27, 3, -16], fov: 55 });
  await writeFile(`${out}/rapport-kit.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ vues: Object.keys(report.vues).length, erreurs: errors }));
  await browser.close();
  process.exit(0);
}
const only = process.env.LIEUX?.split(',');
const views = (process.env.VUES ?? 'exterieur,ile,interieur').split(',');
const layout = (await page.evaluate(() => window.__careerverse.layout())).filter(
  (b) => !only || only.includes(b.id),
);
const local = (b, x, z) => [
  b.position[0] + x * Math.cos(b.rotation) + z * Math.sin(b.rotation),
  b.position[1] - x * Math.sin(b.rotation) + z * Math.cos(b.rotation),
];
const AERIAL = [92, 98, 122];
for (const b of views.includes('exterieur') ? layout : []) {
  const center = [b.position[0], b.elevation + b.height * 0.45, b.position[1]];
  const d = AERIAL.map((v, i) => v - center[i]);
  const n = Math.hypot(...d);
  await shoot(`accueil-${b.id}`, {
    position: center.map((v, i) => v + (d[i] / n) * 62),
    target: center,
    fov: 30,
  });
  const front = local(b, 0, b.size[1] / 2 + 17);
  await shoot(`allee-${b.id}`, {
    position: [front[0], b.elevation + 2.4, front[1]],
    target: [b.position[0], b.elevation + Math.min(b.height * 0.4, 6), b.position[1]],
    fov: 52,
  });
  const eye = local(b, 2.4, b.size[1] / 2 + 6.2);
  const door = local(b, 0, b.size[1] / 2 + 0.5);
  await shoot(`porte-${b.id}`, {
    position: [eye[0], b.elevation + 2.1, eye[1]],
    target: [door[0], b.elevation + 2, door[1]],
    fov: 50,
  });
}
if (views.includes('ile'))
  await shoot('ile-dessous', { position: [104, -4, 132], target: [0, -6, 0], fov: 38 });
await page.evaluate(() => window.__careerverse.photo(null));
await page.evaluate(() => window.__careerverse.setState({ phase: 'home' }));
if (views.includes('ile')) {
  await hideInterface();
  await page.waitForTimeout(2500);
  await saveShot(page, `${out}/ile-accueil`, { format });
}

for (const b of views.includes('interieur') ? layout : []) {
  await page.evaluate((id) => window.__careerverse.visit(id), b.id);
  await page.waitForTimeout(2000);
  await shoot(`interieur-${b.id}`, { position: [0, 5.4, 12.2], target: [0, 1.4, -5], fov: 62 });
  await shoot(`interieur-fond-${b.id}`, { position: [-8.5, 4.6, -10.5], target: [5, 1.6, 4], fov: 62 });
}
await writeFile(`${out}/rapport-details.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ vues: Object.keys(report.vues).length, erreurs: errors }));
await browser.close();
