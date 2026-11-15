// Page de chargement (V8) : une capture à quatre étapes réelles (modèles, monde, lumière
// précalculée, première image), au bureau et sur téléphone, processeur ralenti (×4). Le rendu logiciel rend ces étapes assez
// longues pour être saisies au vol ; sur un vrai poste elles passent plus vite.
//   npm run capture:chargement -- [dossier]
// Variable : URL (défaut http://127.0.0.1:4173/book3D-carreer/).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [out = 'docs/screenshots/v8/chargement'] = process.argv.slice(2);
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
// Étape et pourcentage à partir duquel on capture (le chargement est rapide : voir le
// ralentissement du processeur plus bas).
const STEPS = [
  ['1-modeles', 15],
  ['2-monde', 31],
  ['3-lumiere', 56],
  ['4-image', 90],
];
const seen = [];
const shots = [];
for (const [name, options] of [
  ['bureau', { viewport: { width: 1440, height: 900 } }],
  ['telephone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }],
]) {
  const page = await browser.newPage(options);
  // Processeur ralenti (×4) : chaque étape reste visible assez longtemps pour être capturée.
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(base, { waitUntil: 'commit' });
  for (const [file, ...labels] of STEPS) {
    const label = await page
      .waitForFunction(
        (threshold) => {
          const value = Number(document.getElementById('loader-percent')?.textContent ?? 0);
          const step = document.querySelector('#loader-steps li.active')?.dataset.step ?? 'image';
          return value >= threshold && `${step} ${value} %`;
        },
        labels[0],
        { timeout: 180000, polling: 'raf' },
      )
      .then((h) => h.jsonValue())
      .catch(() => null);
    if (!label) continue;
    // Capture immédiate : l'étape en cours, pas la suivante. Encodage WebP à la fin.
    shots.push([`${out}/${name}-${file}.webp`, await page.screenshot({ timeout: 180000 })]);
    seen.push(`${name} ${file} : ${label}`);
  }
  await page.close();
}
// Encodage WebP par le navigateur (comme scripts/shot.mjs), sur une page vide.
const encoder = await browser.newPage();
for (const [file, png] of shots) {
  const data = await encoder.evaluate(async (b64) => {
    const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/webp', 0.86).split(',')[1];
  }, png.toString('base64'));
  await writeFile(file, Buffer.from(data, 'base64'));
}
console.log(JSON.stringify({ etapes: seen }, null, 2));
await browser.close();
