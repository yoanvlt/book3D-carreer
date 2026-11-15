// Image d'aperçu pour le partage (1200×630, public/apercu.jpg) et icône Apple (180×180).
//   npm run build && npm run preview, puis : node scripts/capture-apercu.mjs
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { saveShot } from './shot.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const base = process.env.URL ?? 'http://127.0.0.1:4173/book3D-carreer/';
const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(base + '?debug=1');
await page.waitForFunction(() => window.__careerverse?.state().ready, null, { timeout: 180000 });
await page.evaluate(() => window.__careerverse.setState({ qualityAuto: false, quality: 'high' }));
// Aperçu épuré : nom et rôle, sans boutons ni aide clavier.
await page.addStyleTag({ content: '.hero-actions,.hero-keys,.header-actions{visibility:hidden!important}' });
await page.waitForTimeout(5000);
const file = await saveShot(page, 'public/apercu', { format: 'jpeg', quality: 0.84 });
console.log(file, (await readFile(file)).length, 'octets');

// Icône Apple : le favicon SVG rendu en PNG 180×180.
const svg = await readFile('public/favicon.svg', 'utf8');
const icon = await browser.newPage({ viewport: { width: 180, height: 180 } });
await icon.setContent(
  `<body style="margin:0">${svg.replace('<svg ', '<svg width="180" height="180" ')}</body>`,
);
await writeFile('public/apple-touch-icon.png', await icon.screenshot({ omitBackground: true }));
await browser.close();
