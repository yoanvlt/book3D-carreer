// Page de chargement (V8) : une capture à quatre étapes réelles (modèles, monde, lumière
// précalculée, première image), au bureau et sur téléphone. Chaque étape est figée par
// `?debug=1&chargement=<étape>` (même affichage qu'en vrai), sans quoi le chargement est trop
// rapide pour être saisi. Le rendu logiciel rend ces étapes assez
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
// Étapes capturées : la page est figée à chacune par `?debug=1&chargement=<étape>`.
const STEPS = ['modeles', 'monde', 'lumiere', 'image'];
const seen = [];
const shots = [];
for (const [name, options] of [
  ['bureau', { viewport: { width: 1440, height: 900 } }],
  ['telephone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true }],
]) {
  const page = await browser.newPage(options);
  for (const [i, step] of STEPS.entries()) {
    await page.goto(`${base}?debug=1&chargement=${step}`);
    await page.waitForFunction(() => document.querySelectorAll('#loader .trait.on').length > 0, null, {
      timeout: 60000,
    });
    await page.waitForTimeout(900);
    const label = await page.evaluate(
      () =>
        `${document.querySelector('#loader-steps li.active')?.dataset.step ?? 'image'} ${document.getElementById('loader-percent')?.textContent} %`,
    );
    shots.push([`${out}/${name}-${i + 1}-${step}.webp`, await page.screenshot({ timeout: 180000 })]);
    seen.push(`${name} ${step} : ${label}`);
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
