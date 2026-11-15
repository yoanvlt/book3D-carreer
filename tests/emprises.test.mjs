// Emprise des bâtiments (V7, relevé V8) : aucune pièce ne dépasse l'emprise prévue (config.ts) de plus de la
// tolérance d'un auvent. L'emprise réelle se mesure sur la géométrie rendue : le tour d'inspection la
// relève dans le navigateur (npm run capture:inspection, ou EMPRISES=1 pour ce seul relevé).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Bâtiments : aucune pièce au-delà de l’emprise, hors tolérance d’un auvent (relevé du tour d’inspection)', async () => {
  const report = JSON.parse(
    await readFile(new URL('../docs/screenshots/v8/inspection/emprises.json', import.meta.url)),
  );
  const TOLERANCE = { side: 1.2, back: 1.2, front: 3.0 };
  for (const b of report) {
    const [hx, hz] = [b.size[0] / 2, b.size[1] / 2];
    assert.ok(
      b.min[0] >= -hx - TOLERANCE.side && b.max[0] <= hx + TOLERANCE.side,
      `${b.id} déborde en x : ${b.min[0]} ${b.max[0]}`,
    );
    assert.ok(b.min[2] >= -hz - TOLERANCE.back, `${b.id} déborde à l’arrière : ${b.min[2]}`);
    assert.ok(b.max[2] <= hz + TOLERANCE.front, `${b.id} déborde à l’avant : ${b.max[2]}`);
  }
});
