// Tour d'inspection : chaque bâtiment vu de 8 angles en orbite (avant, côtés, arrière ; alternativement
// à hauteur d'œil et en plongée), assemblés en une planche par bâtiment, plus une vue de dessus de
// l'île. Relève aussi l'emprise réelle de chaque bâtiment (emprises.json, lu par
// tests/coherence.test.mjs).
//   npm run capture:inspection -- <dossier>
// Variables : URL (défaut http://127.0.0.1:4173/book3D-carreer/), LIEUX (ex. profile,veolia),
// EMPRISES=1 (relevé des emprises seulement, sans images).
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [out = 'docs/screenshots/v7/inspection/apres'] = process.argv.slice(2);
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
const page = await browser.newPage({ viewport: { width: 800, height: 500 }, reducedMotion: 'reduce' });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '?debug=1');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate(() => window.__careerverse.setState({ quality: 'high', qualityAuto: false }));
const hideInterface = () =>
  page.evaluate(() => {
    let node = document.querySelector('canvas');
    while (node && node !== document.body) {
      for (const sibling of node.parentElement.children)
        if (sibling !== node) sibling.style.setProperty('visibility', 'hidden', 'important');
      node = node.parentElement;
    }
  });
async function shoot(shot) {
  await page.evaluate((s) => window.__careerverse.photo(s), shot);
  await hideInterface();
  await page.waitForTimeout(2200);
  return (await page.screenshot({ timeout: 180000 })).toString('base64');
}
/** Assemble des images (base64 PNG) en grille, avec une légende par case, et enregistre en WebP. */
async function sheet(images, labels, cols, file) {
  const data = await page.evaluate(
    async ([list, names, columns]) => {
      const bitmaps = await Promise.all(
        list.map(async (b64) =>
          createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob()),
        ),
      );
      const [w, h] = [bitmaps[0].width, bitmaps[0].height];
      const rows = Math.ceil(bitmaps.length / columns);
      const canvas = document.createElement('canvas');
      canvas.width = w * columns;
      canvas.height = h * rows;
      const ctx = canvas.getContext('2d');
      bitmaps.forEach((bm, i) => {
        const [x, y] = [(i % columns) * w, Math.floor(i / columns) * h];
        ctx.drawImage(bm, x, y);
        ctx.fillStyle = 'rgba(31, 43, 51, 0.75)';
        ctx.fillRect(x, y, 150, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 16px system-ui, sans-serif';
        ctx.fillText(names[i], x + 10, y + 21);
      });
      return canvas.toDataURL('image/webp', 0.8).split(',')[1];
    },
    [images, labels, cols],
  );
  await writeFile(file, Buffer.from(data, 'base64'));
}

const only = process.env.LIEUX?.split(',');
const layout = (await page.evaluate(() => window.__careerverse.layout())).filter(
  (b) => !only || only.includes(b.id),
);
for (const b of process.env.EMPRISES ? [] : layout) {
  const radius = Math.max(...b.size) / 2 + 11;
  const images = [];
  const labels = [];
  for (let k = 0; k < 8; k++) {
    // Angle 0 : face à la porte ; puis tous les 45°, dans le repère du bâtiment.
    const a = b.rotation + (k * Math.PI) / 4;
    const high = k % 2 === 1;
    const position = [
      b.position[0] + Math.sin(a) * radius * (high ? 0.85 : 1),
      b.elevation + (high ? b.height + 12 : 1.8),
      b.position[1] + Math.cos(a) * radius * (high ? 0.85 : 1),
    ];
    const target = [
      b.position[0],
      b.elevation + (high ? b.height * 0.3 : Math.min(b.height * 0.35, 5)),
      b.position[1],
    ];
    images.push(await shoot({ position, target, fov: high ? 48 : 58 }));
    labels.push(`${k * 45}° ${high ? 'plongée' : 'œil'}`);
  }
  await sheet(images, labels, 4, `${out}/${b.id}.webp`);
}
if (!only && !process.env.EMPRISES) {
  const top = await shoot({ position: [0, 215, 0.01], target: [0, 0, 0], fov: 40 });
  await sheet([top], ['dessus'], 1, `${out}/ile-dessus.webp`);
}
const footprints = await page.evaluate(() => window.__careerverse.footprints?.() ?? []);
await writeFile(`${out}/emprises.json`, JSON.stringify(footprints, null, 2));
await writeFile(`${out}/erreurs.json`, JSON.stringify(errors, null, 2));
console.log(JSON.stringify({ batiments: layout.length, erreurs: errors }));
await browser.close();
