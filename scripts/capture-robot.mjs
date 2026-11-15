// Le robot, fil conducteur (V7) : accueil (vol stationnaire, signe de la main au survol), puis vol
// d'entrée et vol de retour figés à 0, 33, 66 et 100 % de leur durée, au bureau et sur téléphone.
// Le vol est figé par le crochet holdFlight de ?debug=1 : le rendu logiciel est trop lent pour
// viser un instant précis d'une séquence de 2,4 s.
//   npm run capture:robot -- [dossier]
// Variable : URL (défaut http://127.0.0.1:4173/book3D-carreer/).
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { saveShot } from './shot.mjs';

const [out = 'docs/screenshots/v8/robot'] = process.argv.slice(2);
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
const errors = [];
const STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];
for (const [name, options] of [
  ['bureau', { viewport: { width: 1440, height: 900 } }],
  [
    'telephone',
    { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  ],
]) {
  const page = await browser.newPage(options);
  page.on('console', (m) => m.type() === 'error' && errors.push(`${name} : ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${name} : ${e.message}`));
  await page.goto(base + '?debug=1');
  await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
  await page.evaluate(() => window.__careerverse.setState({ quality: 'high', qualityAuto: false }));
  await saveShot(page, `${out}/${name}-accueil`);
  if (name === 'bureau') {
    await page.hover('.hero .button-primary');
    await page.waitForTimeout(1200);
    await saveShot(page, `${out}/${name}-accueil-signe`);
    await page.mouse.move(10, 10);
  }
  const phase = () => page.evaluate(() => window.__careerverse.state().phase);
  for (const [label, start, end] of [
    ['aller', () => page.evaluate(() => window.__careerverse.enter()), 'explore'],
    ['retour', () => page.evaluate(() => window.__careerverse.goHome()), 'home'],
  ]) {
    await page.evaluate(() => window.__careerverse.holdFlight(0));
    await start();
    for (const t of STEPS) {
      await page.evaluate((v) => window.__careerverse.holdFlight(v), t);
      await page.waitForTimeout(t === 1 ? 2500 : 1500);
      await saveShot(page, `${out}/${name}-${label}-${String(Math.round(t * 100)).padStart(3, '0')}`);
    }
    await page.evaluate(() => window.__careerverse.holdFlight(null));
    await page.waitForFunction((p) => window.__careerverse.state().phase === p, end, { timeout: 60000 });
    if ((await phase()) !== end) errors.push(`${name} : ${label} n'arrive pas en ${end}`);
  }
  await page.close();
}
console.log(JSON.stringify({ erreurs: errors }));
await browser.close();
