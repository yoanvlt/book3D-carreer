// Capture commune aux scripts de contrôle visuel : masque le relevé ?debug=1, attend une image
// rendue sans lui (le rendu logiciel tourne à 1-5 images par seconde), puis enregistre en WebP.
// L'encodage WebP est fait par le navigateur lui-même (canvas.toDataURL) : aucune dépendance.
import { writeFile } from 'node:fs/promises';

export async function saveShot(page, path, { quality = 0.86, format = 'webp' } = {}) {
  await page.evaluate(() => document.getElementById('diagnostics')?.setAttribute('hidden', ''));
  await page.waitForTimeout(1500);
  const png = await page.screenshot({ timeout: 180000 });
  await page.evaluate(() => document.getElementById('diagnostics')?.removeAttribute('hidden'));
  if (format === 'png') {
    await writeFile(`${path}.png`, png);
    return `${path}.png`;
  }
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/webp';
  const data = await page.evaluate(
    async ([b64, type, q]) => {
      const blob = await (await fetch(`data:image/png;base64,${b64}`)).blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
      return canvas.toDataURL(type, q).split(',')[1];
    },
    [png.toString('base64'), mime, quality],
  );
  const file = `${path}.${format === 'jpeg' ? 'jpg' : 'webp'}`;
  await writeFile(file, Buffer.from(data, 'base64'));
  return file;
}
