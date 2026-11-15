// Assemble les vues de détail avant et après côte à côte (une image par vue), avec un bandeau.
//   npm run capture:comparaisons -- [avant] [après] [sortie]
// Défauts : docs/screenshots/v6/avant, docs/screenshots/v6/apres, docs/screenshots/v6/comparaisons.
// L'assemblage est fait par le navigateur (canvas), comme l'encodage WebP de shot.mjs.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [
  before = 'docs/screenshots/v6/avant',
  after = 'docs/screenshots/v6/apres',
  out = 'docs/screenshots/v6/comparaisons',
] = process.argv.slice(2);
await mkdir(out, { recursive: true });
const names = (await readdir(after)).filter((f) => f.endsWith('.webp'));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas></canvas>');
let count = 0;
for (const name of names) {
  let a;
  try {
    a = await readFile(`${before}/${name}`);
  } catch {
    continue;
  }
  const b = await readFile(`${after}/${name}`);
  const data = await page.evaluate(
    async ([a64, b64, title]) => {
      const load = async (s) => createImageBitmap(await (await fetch(`data:image/webp;base64,${s}`)).blob());
      const [ia, ib] = [await load(a64), await load(b64)];
      const w = 960;
      const h = Math.round((ia.height / ia.width) * w);
      const band = 44;
      const canvas = document.querySelector('canvas');
      canvas.width = w * 2 + 8;
      canvas.height = h + band;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1f2b33';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(ia, 0, band, w, h);
      ctx.drawImage(ib, w + 8, band, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(`V5 — ${title}`, 16, band / 2);
      ctx.fillText(`V6 — ${title}`, w + 24, band / 2);
      return canvas.toDataURL('image/webp', 0.86).split(',')[1];
    },
    [a.toString('base64'), b.toString('base64'), name.replace('.webp', '')],
  );
  await writeFile(`${out}/${name}`, Buffer.from(data, 'base64'));
  count++;
}
console.log(JSON.stringify({ comparaisons: count }));
await browser.close();
