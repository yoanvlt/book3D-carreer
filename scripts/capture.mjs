// Captures de contrôle visuel : node scripts/capture.mjs <url> <dossier> [préfixe] [tailles]
// Nécessite un serveur (npm run preview). Utilise le Chromium préinstallé (Playwright).
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const [url = 'http://127.0.0.1:4173/book3D-carreer/?debug=1', out = 'docs/screenshots/v4', prefix = '', only = ''] = process.argv.slice(2);
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [390, 844],
].filter(([w, h]) => !only || only.split(',').includes(`${w}x${h}`));

const diag = (page) =>
  page.evaluate(() => {
    try {
      return JSON.parse(document.getElementById('diagnostics')?.textContent || '{}');
    } catch {
      return {};
    }
  });
async function until(page, test, label, timeout = 240000) {
  const start = Date.now();
  for (;;) {
    const d = await diag(page);
    if (test(d)) return d;
    if (Date.now() - start > timeout) throw new Error(`Délai dépassé : ${label} ${JSON.stringify(d)}`);
    await page.waitForTimeout(500);
  }
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const report = [];
for (const [width, height] of sizes) {
  const mobile = width < 760;
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
    hasTouch: mobile,
    isMobile: mobile,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  const name = (scene) => `${out}/${prefix}${scene}-${width}x${height}.png`;
  const entry = { size: `${width}x${height}`, scenes: {} };
  await page.goto(url);
  await page.waitForSelector('.loading', { state: 'detached', timeout: 120000 });
  await until(page, (d) => d.phase === 'home', 'accueil');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: name('accueil') });
  entry.scenes.accueil = await diag(page);

  const api = await page.evaluate(() => !!window.__careerverse);
  if (mobile && !api) {
    entry.note = 'mobile : pas de crochet de test, captures limitées à l’accueil';
  } else {
    if (api) await page.evaluate(() => window.__careerverse.enter());
    else await page.click('.desktop-only:is(.hero4-primary,.primary)');
    await until(page, (d) => d.phase === 'explore', 'exploration');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: name('exploration') });
    entry.scenes.exploration = await diag(page);

    if (api) await page.evaluate(() => window.__careerverse.travel('profile'));
    else await page.click('.quick-nav button >> nth=0');
    await page.waitForTimeout(3000);
    await until(page, (d) => d.phase === 'explore' && (d.nearby ?? 'profile') === 'profile', 'arrivée Profil');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: name('porte') });
    entry.scenes.porte = await diag(page);

    if (api) await page.evaluate(() => window.__careerverse.openBuilding('profile'));
    else await page.keyboard.press('e');
    await until(page, (d) => d.phase === 'explore' && d.interior === 'profile', 'intérieur');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: name('interieur') });
    entry.scenes.interieur = await diag(page);
  }
  entry.errors = errors;
  report.push(entry);
  console.log(JSON.stringify(entry));
  await context.close();
}
await writeFile(`${out}/${prefix}rapport.json`, JSON.stringify(report, null, 2));
await browser.close();
