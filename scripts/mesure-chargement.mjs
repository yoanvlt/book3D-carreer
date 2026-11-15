// Mesure du chargement : temps jusqu'à « prête » (première image de la scène), plus longue tâche
// bloquante du fil principal, nombre de tâches de plus de 200 ms, poids transféré.
//   npm run mesure:chargement -- [répétitions]
// Variable : URL (défaut http://127.0.0.1:4173/book3D-carreer/). Chromium sans écran, rendu WebGL
// logiciel : les durées sont plus longues que sur un vrai poste, mais comparables entre versions.
import { chromium } from 'playwright';

const runs = Number(process.argv[2] ?? 3);
const base = process.env.URL ?? 'http://127.0.0.1:4173/book3D-carreer/';
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const results = [];
for (let i = 0; i < runs; i++) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  let bytes = 0;
  page.on('response', async (r) => {
    try {
      bytes += (await r.body()).length;
    } catch {
      /* réponse sans corps */
    }
  });
  await page.addInitScript(() => {
    window.__tasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__tasks.push(e.duration);
    }).observe({ type: 'longtask', buffered: true });
  });
  const start = Date.now();
  await page.goto(base + '?debug=1');
  await page.waitForFunction(() => window.__careerverse?.state().ready, null, {
    timeout: 180000,
    polling: 50,
  });
  const ready = Date.now() - start;
  await page.waitForTimeout(1500);
  const tasks = await page.evaluate(() => window.__tasks);
  results.push({
    pret_ms: ready,
    plus_longue_tache_ms: Math.round(Math.max(0, ...tasks)),
    taches_de_plus_de_200_ms: tasks.filter((d) => d > 200).length,
    transfere_ko: Math.round(bytes / 1024),
  });
  await context.close();
}
const median = (key) => results.map((r) => r[key]).sort((a, b) => a - b)[Math.floor(results.length / 2)];
console.log(
  JSON.stringify(
    {
      mesures: results,
      mediane: Object.fromEntries(Object.keys(results[0]).map((k) => [k, median(k)])),
    },
    null,
    2,
  ),
);
await browser.close();
