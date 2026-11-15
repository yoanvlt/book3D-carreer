// Visite guidée de bout en bout : bouton de l'accueil, six présentations, retour à l'accueil.
//   node scripts/capture-visite.mjs <dossier>      (URL=… pour un autre serveur)
// Le rendu logiciel ralentit le temps simulé : la durée réelle mesurée ici n'est pas celle d'un
// vrai écran ; la durée nominale (6 × 8,8 s) est vérifiée par tests/v5.test.mjs.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [out = 'docs/screenshots/v5/visite'] = process.argv.slice(2);
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
await page.evaluate(() => window.__careerverse.setState({ qualityAuto: false, quality: 'low' }));
const game = () => page.evaluate(() => window.__careerverse.state());
const start = Date.now();
await page.getByRole('button', { name: /Visite guidée/ }).click();
const etapes = [];
let last = null;
for (;;) {
  const s = await game();
  if (s.tour === null && s.phase === 'home' && etapes.length) break;
  if (s.tour !== null && s.tour !== last && s.phase === 'showcase') {
    last = s.tour;
    etapes.push({ lieu: s.showcase, debut_s: +((Date.now() - start) / 1000).toFixed(1) });
    console.log(JSON.stringify(etapes.at(-1)));
    if (s.tour === 0 || s.tour === 5) {
      await page.waitForTimeout(4000);
      await saveShot(page, `${out}/visite-${s.tour + 1}-${s.showcase}`);
    }
  }
  if (Date.now() - start > 20 * 60000) throw new Error('Visite guidée non terminée');
  await page.waitForTimeout(250);
}
const rapport = { etapes, fin_s: +((Date.now() - start) / 1000).toFixed(1), erreurs: errors };
await writeFile(`${out}/rapport.json`, JSON.stringify(rapport, null, 2));
console.log(JSON.stringify(rapport));
await browser.close();
