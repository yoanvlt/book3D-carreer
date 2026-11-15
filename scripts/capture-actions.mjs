// Actions et vie (V8) : robot assis sur un banc, robot qui salue, et chaque personnage au travail.
//   npm run capture:actions -- [dossier]
// Variable : URL (défaut http://127.0.0.1:4173/book3D-carreer/).
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { saveShot } from './shot.mjs';

const [out = 'docs/screenshots/v8/actions'] = process.argv.slice(2);
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
await page.goto(base + '?debug=1');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate(() => {
  window.__careerverse.holdFlight(1);
  window.__careerverse.enter();
});
await page.waitForFunction(() => window.__careerverse.state().phase === 'explore', null, { timeout: 60000 });
await page.evaluate(() => window.__careerverse.holdFlight(null));
const cv = (fn, arg) => page.evaluate(fn, arg);
// Assis sur le banc sud-est de la place, puis debout et qui salue.
await cv(() => window.__careerverse.place(6.4, 1.9, 0));
await cv(() => window.__careerverse.sit());
await cv(() => window.__careerverse.photo({ position: [11, 3.2, 8], target: [5.7, 1, 1.3], fov: 45 }));
await saveShot(page, `${out}/robot-assis`);
await cv(() => {
  window.__careerverse.photo(null);
  window.__careerverse.place(2, 6, Math.PI);
});
await cv(() => window.__careerverse.wave());
await cv(() => window.__careerverse.photo({ position: [2.5, 2.6, 0.5], target: [2, 1.5, 6], fov: 45 }));
await page.waitForTimeout(300);
await saveShot(page, `${out}/robot-salue`);
// Personnages au travail (vues fixes).
const SHOTS = {
  jardinier: { position: [-27, 4.5, -30], target: [-34.3, 1, -39], fov: 45 },
  livreur: { position: [2, 4, 17.5], target: [-5.4, 1, 24], fov: 45 },
  chariot: { position: [-35.5, 6.5, -13], target: [-50, 1, -17], fov: 48 },
  astronome: { position: [12, 9, -26], target: [19.8, 5, -35.6], fov: 45 },
  agent: { position: [45, 6, 27], target: [55, 1, 16], fov: 45 },
  visiteur: { position: [-0.5, 3, -21], target: [-4.8, 1.6, -28.6], fov: 50 },
};
for (const [name, shot] of Object.entries(SHOTS)) {
  await cv((s) => window.__careerverse.photo(s), shot);
  await saveShot(page, `${out}/${name}`);
}
console.log(JSON.stringify({ erreurs: errors }));
await browser.close();
