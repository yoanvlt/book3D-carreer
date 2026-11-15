// Planche de direction artistique (V8) : vue d'ensemble et gros plans de `?debug=1&da`.
//   npm run capture:da -- [dossier]
// Variable : URL (défaut http://127.0.0.1:4173/book3D-carreer/).
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { saveShot } from './shot.mjs';

const [out = 'docs/screenshots/v8/direction-artistique'] = process.argv.slice(2);
const base = process.env.URL ?? 'http://127.0.0.1:4173/book3D-carreer/';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '?debug=1&da');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
const SHOTS = {
  ensemble: { position: [46, 34, 40], target: [0, 2, -4], fov: 42 },
  maison: { position: [3, 7, 14], target: [0, 6, -14], fov: 50 },
  rue: { position: [-20, 4.5, 16], target: [-6, 1.2, 0], fov: 45 },
  palette: { position: [0, 16, 40], target: [0, 0, 19], fov: 50 },
  vegetation: { position: [-12, 4, 0], target: [-23, 3.2, -10], fov: 50 },
};
for (const [name, shot] of Object.entries(SHOTS)) {
  await page.evaluate((s) => window.__careerverse.photo(s), shot);
  await saveShot(page, `${out}/${name}`);
}
console.log(JSON.stringify({ erreurs: errors }));
await browser.close();
