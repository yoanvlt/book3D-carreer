// Captures des panneaux d'interface : plan, aide, présentation, lecture, fiche mobile, version texte.
//   node scripts/capture-interface.mjs <dossier>      (URL=… pour un autre serveur)
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [out = 'docs/screenshots/v4/interface'] = process.argv.slice(2);
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
async function open(width, height, query = '?debug=1') {
  const mobile = width < 760;
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
    isMobile: mobile,
    hasTouch: mobile,
  });
  const page = await context.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${width}x${height} ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${width}x${height} ${e.message}`));
  await page.goto(base + query);
  return { page, context };
}
const ready = (page) =>
  page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
const until = (page, test) => page.waitForFunction(test, null, { timeout: 300000, polling: 400 });
const shot = async (page, name) => {
  await page.evaluate(() => document.getElementById('diagnostics')?.setAttribute('hidden', ''));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}.png` });
};

// Bureau
{
  const { page, context } = await open(1440, 900);
  await ready(page);
  await page.evaluate(() => window.__careerverse.setState({ qualityAuto: false }));
  await page.click('.hero .button-secondary');
  await page.waitForSelector('.map-dialog');
  await shot(page, 'plan-1440x900');
  await page.keyboard.press('Escape');
  await page.click('.help-button');
  await page.waitForSelector('.help-dialog');
  await shot(page, 'aide-1440x900');
  await page.keyboard.press('Escape');
  await page.evaluate(() => window.__careerverse.enter());
  await until(page, () => window.__careerverse.state().phase === 'explore');
  await page.evaluate(() => window.__careerverse.travel('veolia'));
  await until(page, () => window.__careerverse.state().nearby === 'veolia');
  await page.evaluate(() => window.__careerverse.discover('veolia'));
  await until(page, () => window.__careerverse.state().phase === 'showcase');
  await page.waitForTimeout(2000);
  await shot(page, 'presentation-1440x900');
  await page.keyboard.press('Escape');
  await until(page, () => window.__careerverse.state().phase === 'explore');
  await page.evaluate(() => window.__careerverse.openBuilding('veolia'));
  await until(page, () => window.__careerverse.state().interior === 'veolia');
  await until(page, () => window.__careerverse.state().phase === 'explore');
  await page.evaluate(() => window.__careerverse.guideToStation(2));
  await until(page, () => window.__careerverse.state().phase === 'explore');
  await page.evaluate(() => window.__careerverse.interact());
  await page.waitForSelector('.reading-dialog');
  await shot(page, 'lecture-1440x900');
  await context.close();
}
// Téléphone : plan puis fiche d'un lieu
{
  const { page, context } = await open(390, 844);
  await ready(page);
  await page.click('.hero .button-primary.mobile-only');
  await page.waitForSelector('.map-dialog');
  await shot(page, 'plan-390x844');
  await page.click('.destination >> nth=1');
  await page.waitForSelector('.place-dialog');
  await shot(page, 'fiche-390x844');
  await context.close();
}
// Version texte
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  const { page, context } = await open(w, h, '?lecture');
  await page.waitForSelector('.readable');
  await page.screenshot({ path: `${out}/version-texte-${w}x${h}.png` });
  await context.close();
}
await writeFile(`${out}/erreurs.json`, JSON.stringify(errors, null, 2));
console.log(JSON.stringify({ erreurs: errors }));
await browser.close();
