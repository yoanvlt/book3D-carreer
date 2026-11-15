// Parcours tactile (écran 390×844, hasTouch) : explorer, joystick, saut, toucher pour aller.
//   node scripts/capture-tactile.mjs <dossier>      (URL=… pour un autre serveur)
// Les gestes passent par de vrais événements tactiles (CDP Input.dispatchTouchEvent), donc par les
// mêmes gestionnaires que sur un téléphone ; seul le rendu est logiciel.
import { mkdir, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
import { chromium } from 'playwright';

const [out = 'docs/screenshots/v5/tactile'] = process.argv.slice(2);
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
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
const cdp = await context.newCDPSession(page);
const touch = (type, points) =>
  cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y]) => ({ x, y, id: 1 })) });
const game = () => page.evaluate(() => window.__careerverse.state());
const player = () => page.evaluate(() => window.__careerverse.player());
const until = async (test, label, timeout = 240000) => {
  const start = Date.now();
  for (;;) {
    if (await test()) return;
    if (Date.now() - start > timeout) throw new Error('Délai dépassé : ' + label);
    await page.waitForTimeout(200);
  }
};
const report = { etapes: [] };
const step = (name, data) => {
  report.etapes.push({ name, ...data });
  console.log(name, JSON.stringify(data));
};

await page.goto(base + '?debug=1');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate(() => window.__careerverse.setState({ qualityAuto: false, quality: 'low' }));
await saveShot(page, `${out}/1-accueil`);

// Explorer la ville : vrai toucher sur le bouton.
const button = await page.locator('.hero .button-primary').boundingBox();
await page.touchscreen.tap(button.x + button.width / 2, button.y + button.height / 2);
await until(async () => (await game()).phase === 'explore', 'exploration');
await page.waitForSelector('.joystick');
step('explorer', { phase: (await game()).phase });

// Joystick : pouce poussé vers l'avant pendant 2 s de temps réel.
const stick = await page.locator('.joystick').boundingBox();
const cx = stick.x + stick.width / 2,
  cy = stick.y + stick.height / 2;
const before = await player();
await touch('touchStart', [[cx, cy]]);
for (let i = 1; i <= 6; i++) {
  await touch('touchMove', [[cx, cy - i * 9]]);
  await page.waitForTimeout(40);
}
await page.waitForTimeout(500);
await saveShot(page, `${out}/2-joystick`);
await page.waitForTimeout(1500);
await touch('touchEnd', []);
const after = await player();
const moved = Math.hypot(after.x - before.x, after.z - before.z);
step('joystick', { deplacement: +moved.toFixed(2) });
if (moved < 0.5) throw new Error('Le joystick n’a pas déplacé le robot');

// Saut : bouton tactile, hauteur relevée pendant le vol.
const jump = await page.locator('.jump-button').boundingBox();
await page.touchscreen.tap(jump.x + jump.width / 2, jump.y + jump.height / 2);
let top = 0;
for (let i = 0; i < 20; i++) {
  top = Math.max(top, (await player()).jump.height);
  if (top > 0.2) break;
  await page.waitForTimeout(30);
}
step('saut', { hauteur: +top.toFixed(2) });
if (top <= 0) throw new Error('Le saut n’a pas eu lieu');
await until(async () => (await player()).jump.height === 0, 'retombée');

// Toucher pour aller : un point du sol en haut de l'écran.
const start = await player();
await page.touchscreen.tap(195, 330);
await until(async () => (await game()).phase === 'travel', 'départ de la marche', 20000);
await saveShot(page, `${out}/3-toucher-pour-aller`);
await until(async () => (await game()).phase === 'explore', 'arrivée');
const end = await player();
step('toucher pour aller', { deplacement: +Math.hypot(end.x - start.x, end.z - start.z).toFixed(2) });

report.erreurs = errors;
await writeFile(`${out}/rapport.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ erreurs: errors }));
await browser.close();
