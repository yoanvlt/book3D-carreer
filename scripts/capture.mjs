// Contrôle visuel automatisé (Playwright + Chromium préinstallé).
//
//   npm run build && npm run preview          (dans un autre terminal)
//   node scripts/capture.mjs scenes <dossier> [tailles]   accueil, exploration, porte, intérieur, lecture
//   node scripts/capture.mjs portes <dossier>             entrée, lecture d'une station et sortie des six portes
//
// Variables : URL (défaut http://127.0.0.1:4173/book3D-carreer/), QUALITE (high|low).
// Le rendu passe par SwiftShader (processeur) : les FPS relevés ne valent pas pour un vrai GPU.
import { mkdir, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
import { chromium } from 'playwright';

const [mode = 'scenes', out = 'docs/screenshots/v8', only = ''] = process.argv.slice(2);
const base = process.env.URL ?? 'http://127.0.0.1:4173/book3D-carreer/';
const url = base + (base.includes('?') ? '&' : '?') + 'debug=1';
const quality = process.env.QUALITE ?? 'high';
const ALL = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [390, 844],
];
const sizes =
  mode === 'portes' ? [[1440, 900]] : ALL.filter(([w, h]) => !only || only.split(',').includes(`${w}x${h}`));
const IDS = ['profile', 'project-1', 'project-2', 'project-3', 'missions', 'veolia'];

const diag = (page) =>
  page.evaluate(() => {
    try {
      return JSON.parse(document.getElementById('diagnostics')?.textContent || '{}');
    } catch {
      return {};
    }
  });
const game = (page) => page.evaluate(() => window.__careerverse.state());
async function until(page, test, label, timeout = 300000) {
  const start = Date.now();
  for (;;) {
    const s = await game(page);
    if (test(s)) return s;
    if (Date.now() - start > timeout) throw new Error(`Délai dépassé : ${label} ${JSON.stringify(s)}`);
    await page.waitForTimeout(400);
  }
}
const call = (page, name, ...args) => page.evaluate(([n, a]) => window.__careerverse[n](...a), [name, args]);
/** Attend un relevé de diagnostic postérieur à l'état demandé (il est rafraîchi toutes les ~2 s). */
async function settle(page, ms = 4500) {
  await page.waitForTimeout(ms);
  return diag(page);
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
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
  // Le relevé de diagnostic est lu par le script, mais masqué sur les captures.
  // Captures en WebP, relevé de diagnostic masqué (voir shot.mjs).
  const shot = (scene) => saveShot(page, `${out}/${scene}-${width}x${height}`);
  const entry = { taille: `${width}x${height}`, qualite: quality, scenes: {} };
  await page.goto(url);
  await page.waitForSelector('.loading', { state: 'detached', timeout: 180000 });
  await page.waitForFunction(() => !!window.__careerverse);
  await call(page, 'setState', { quality, qualityAuto: false });
  await until(page, (s) => s.phase === 'home', 'accueil');

  if (mode === 'scenes') {
    entry.scenes.accueil = await settle(page);
    await shot('accueil');
    await call(page, 'enter');
    await until(page, (s) => s.phase === 'explore', 'exploration');
    entry.scenes.exploration = await settle(page);
    await shot('exploration');
    await call(page, 'travel', 'profile');
    await until(page, (s) => s.phase === 'explore' && s.nearby === 'profile', 'arrivée Profil');
    entry.scenes.porte = await settle(page);
    await shot('porte');
    await call(page, 'openBuilding', 'profile');
    await until(page, (s) => s.phase === 'explore' && s.interior === 'profile', 'intérieur');
    await call(page, 'guideToStation', 0);
    await until(page, (s) => s.phase === 'explore', 'station');
    entry.scenes.interieur = await settle(page);
    await shot('interieur');
    if ((await game(page)).station) {
      await call(page, 'interact');
      await until(page, (s) => !!s.reading, 'lecture');
      await page.waitForTimeout(800);
      await shot('lecture');
      entry.scenes.lecture = { reading: (await game(page)).reading };
    }
  } else {
    await call(page, 'enter');
    await until(page, (s) => s.phase === 'explore', 'exploration');
    entry.portes = [];
    for (const id of IDS) {
      const door = { id };
      await call(page, 'travel', id);
      await until(page, (s) => s.phase === 'explore' && !s.interior && s.nearby === id, `arrivée ${id}`);
      await call(page, 'openBuilding', id);
      await until(page, (s) => s.phase === 'explore' && s.interior === id, `entrée ${id}`);
      door.entree = true;
      await call(page, 'guideToStation', 0);
      await until(page, (s) => s.phase === 'explore', `station ${id}`);
      const station = (await game(page)).station;
      if (station) {
        await call(page, 'interact');
        await until(page, (s) => !!s.reading, `lecture ${id}`);
        door.lecture = station;
        await page.waitForTimeout(600);
        await shot(`lecture-${id}`);
        await call(page, 'setState', { reading: null });
      } else door.lecture = null;
      door.interieur = await diag(page);
      await shot(`interieur-${id}`);
      await call(page, 'leave');
      await until(page, (s) => s.phase === 'explore' && !s.interior, `sortie ${id}`);
      door.sortie = true;
      door.exterieur = await settle(page, 2500);
      entry.portes.push(door);
      console.log(JSON.stringify(door));
    }
    // Six tampons : passeport complet et, si site.md a un CV ou un contact, carte de fin.
    await page.waitForTimeout(1500);
    const end = await game(page);
    entry.passeport = end.visited;
    entry.carteDeFin = end.ending;
    if (end.ending) await shot('fin-de-visite');
  }
  entry.erreurs = errors;
  report.push(entry);
  console.log(JSON.stringify({ taille: entry.taille, erreurs: errors }));
  await context.close();
}
await writeFile(`${out}/rapport-${mode}.json`, JSON.stringify(report, null, 2));
await browser.close();
