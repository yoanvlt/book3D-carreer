// Vues de détail pour comparer deux versions : pour chaque bâtiment, la silhouette vue depuis
// l'accueil, la façade depuis l'allée et un gros plan devant la porte ; les six intérieurs ; le
// dessous de l'île. Caméra fixe (mode photo de ?debug=1), interface masquée.
//   npm run capture:details -- <dossier> [png]
// Variables : URL (défaut http://127.0.0.1:4173/book3D-carreer/), QUALITE (high|low).
import { mkdir, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
import { chromium } from 'playwright';

const [out = 'docs/screenshots/v6/details', format = 'webp'] = process.argv.slice(2);
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
await page.goto(base + '?debug=1');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate((q) => window.__careerverse.setState({ quality: q, qualityAuto: false }), quality);
// Seule la scène reste visible : chaque voisin du canvas, à chaque niveau, est masqué.
await page.evaluate(() => {
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
  await page.waitForTimeout(2500);
  await saveShot(page, `${out}/${name}`, { format });
  const d = await diag();
  report.vues[name] = { drawCalls: d.drawCalls, triangles: d.triangles };
}

const layout = await page.evaluate(() => window.__careerverse.layout());
const local = (b, x, z) => [
  b.position[0] + x * Math.cos(b.rotation) + z * Math.sin(b.rotation),
  b.position[1] - x * Math.sin(b.rotation) + z * Math.cos(b.rotation),
];
const AERIAL = [92, 98, 122];
for (const b of layout) {
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
await shoot('ile-dessous', { position: [104, -4, 132], target: [0, -6, 0], fov: 38 });
await page.evaluate(() => window.__careerverse.photo(null));
await page.evaluate(() => window.__careerverse.setState({ phase: 'home' }));
await page.waitForTimeout(2500);
await saveShot(page, `${out}/ile-accueil`, { format });

for (const b of layout) {
  await page.evaluate((id) => window.__careerverse.visit(id), b.id);
  await page.waitForTimeout(2000);
  await shoot(`interieur-${b.id}`, { position: [0, 5.4, 12.2], target: [0, 1.4, -5], fov: 62 });
  await shoot(`interieur-fond-${b.id}`, { position: [-8.5, 4.6, -10.5], target: [5, 1.6, 4], fov: 62 });
}
await writeFile(`${out}/rapport-details.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ vues: Object.keys(report.vues).length, erreurs: errors }));
await browser.close();
