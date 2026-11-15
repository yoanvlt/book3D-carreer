// V8 : modèles des kits. Seuls les modèles utilisés sont gardés, sous 1,5 Mo compressés en tout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';

const catalogue = JSON.parse(readFileSync(new URL('../src/world/catalogue.json', import.meta.url)));
const sources = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => readFileSync(`${dir}/${f}`, 'utf8'))
    .join('\n');

test('Kits : chaque modèle gardé est utilisé par le site', () => {
  const code = sources('src');
  for (const name of [...Object.keys(catalogue.ville), ...Object.keys(catalogue.meubles)])
    assert.ok(code.includes(`'${name}'`), `${name} inutilisé`);
});

test('Kits : au plus 1,5 Mo de modèles compressés, sans texture', () => {
  const total = readdirSync('public/modeles').reduce((s, f) => s + statSync(`public/modeles/${f}`).size, 0);
  assert.ok(total <= 1.5 * 1024 * 1024, `${(total / 1024).toFixed(0)} Ko`);
  assert.ok(readdirSync('public/modeles').every((f) => f.endsWith('.glb')));
});

test('Licences : chaque pack des kits est crédité en CC0', () => {
  const licences = readFileSync('public/LICENCES.md', 'utf8');
  for (const pack of ['City Builder Bits', 'Medieval Hexagon Pack', 'Furniture Bits'])
    assert.ok(licences.includes(pack));
  assert.ok(licences.includes('CC0'));
});
