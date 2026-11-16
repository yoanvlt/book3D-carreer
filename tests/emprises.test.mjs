// Emprise des lieux (V8) : tout ce qui est construit pour un lieu (bâtiment, cour, quai, socle des
// cuves, parvis…) reste dans sa parcelle. L'emprise réelle est mesurée sur la géométrie rendue par
// le tour d'inspection (npm run capture:inspection, ou EMPRISES=1 pour ce seul relevé), dans le
// repère du bâtiment ; la parcelle (world/plan.ts) est ramenée dans ce même repère.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadSource } from './load-source.mjs';

const source = await loadSource('emprises');
const { buildings } = await source.import('world/config');
const { parcelOf } = await source.import('world/plan');
test.after(() => source.cleanup());

test('Lieux : bâtiment et abords dans leur parcelle (relevé du tour d’inspection)', async () => {
  const report = JSON.parse(
    await readFile(new URL('../docs/screenshots/v8/inspection/emprises.json', import.meta.url)),
  );
  assert.equal(report.length, 6);
  for (const m of report) {
    const b = buildings.find((x) => x.id === m.id);
    const p = parcelOf(m.id).bounds;
    // Coins de la boîte mesurée, ramenés dans le monde.
    const c = Math.cos(b.rotation);
    const s = Math.sin(b.rotation);
    for (const lx of [m.min[0], m.max[0]])
      for (const lz of [m.min[2], m.max[2]]) {
        const x = b.position[0] + lx * c + lz * s;
        const z = b.position[1] - lx * s + lz * c;
        const inside = x >= p.x0 - 0.05 && x <= p.x1 + 0.05 && z >= p.z0 - 0.05 && z <= p.z1 + 0.05;
        assert.ok(inside, `${m.id} déborde de sa parcelle en ${x.toFixed(1)}, ${z.toFixed(1)}`);
      }
  }
});
