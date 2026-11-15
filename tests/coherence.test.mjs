// Cohérence du décor (V7) : rien posé sur le dallage sans y être destiné, plaques d'égout sur la
// chaussée, rien hors du terrain ni flottant. L'emprise des bâtiments est dans emprises.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

const source = await loadSource('coherence');
const { decor, manholes } = await source.import('world/decor');
const { pavementClearance } = await source.import('world/roads');
const { heightAt } = await source.import('world/terrain');
const { WORLD } = await source.import('world/config');
test.after(() => source.cleanup());

test('Décor : aucun objet sur une chaussée, une allée ou la place sans y être destiné', () => {
  const wrong = decor
    .filter((d) => !d.paved && pavementClearance(...d.p) < d.radius)
    .map((d) => `${d.kind} (${d.p.map((v) => v.toFixed(1))})`);
  assert.deepEqual(wrong, []);
});

test('Plaques d’égout : sur la chaussée d’une rue, entières', () => {
  for (const [x, z] of manholes)
    assert.ok(pavementClearance(x, z, ['street']) < -0.45, `plaque en ${x.toFixed(1)},${z.toFixed(1)}`);
  assert.ok(manholes.length <= 6);
});

test('Décor : rien hors du terrain, aucune base à plus de 5 cm au-dessus du sol', () => {
  for (const d of decor) {
    assert.ok(Math.hypot(...d.p) + d.radius < WORLD.radius, `${d.kind} hors du terrain`);
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i === 8 ? 0 : d.radius;
      const ground = heightAt(d.p[0] + Math.cos(a) * r, d.p[1] + Math.sin(a) * r);
      assert.ok(
        d.y - ground <= 0.05,
        `${d.kind} (${d.p.map((v) => v.toFixed(1))}) flotte de ${(d.y - ground).toFixed(2)} m`,
      );
    }
  }
});
