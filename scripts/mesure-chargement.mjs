// Mesure du chargement : temps jusqu'à la première image complète de la ville, plus longue tâche
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
  await page.addInitScript(() => {
    window.__tasks = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__tasks.push([e.startTime, e.duration]);
    }).observe({ type: 'longtask', buffered: true });
  });
  const start = Date.now();
  await page.goto(base + '?debug=1');
  await page.waitForFunction(() => window.__careerverse?.state().ready, null, {
    timeout: 180000,
    polling: 50,
  });
  // Première image complète : deux images rendues après « prête » (comparable entre versions).
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const ready = Date.now() - start;
  await page.waitForTimeout(1500);
  const tasks = await page.evaluate(() => window.__tasks);
  // Tâches pendant que la page de chargement est visible (avant la marque « prêt »).
  const pret = await page.evaluate(
    () => performance.getEntriesByName('careerverse:pret')[0]?.startTime ?? Infinity,
  );
  const during = tasks.filter(([start]) => start < pret).map(([, d]) => d);
  const all = tasks.map(([, d]) => d);
  // Poids transféré : document, scripts, styles, polices, sons (Resource Timing).
  const bytes = await page.evaluate(() =>
    [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].reduce(
      (sum, e) => sum + (e.transferSize || e.encodedBodySize || 0),
      0,
    ),
  );
  results.push({
    pret_ms: ready,
    plus_longue_tache_ms: Math.round(Math.max(0, ...all)),
    plus_longue_tache_chargement_ms: Math.round(Math.max(0, ...during)),
    taches_chargement_de_plus_de_200_ms: during.filter((d) => d > 200).length,
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
