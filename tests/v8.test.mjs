// V8 : implantation sur grille et placeur du décor. Les règles du placeur (world/placer.ts) et du
// plan (world/plan.ts) rendent les incohérences impossibles ; ces tests les vérifient.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

globalThis.window ??= { matchMedia: () => ({ matches: false }) };
const source = await loadSource('v8');
const plan = await source.import('world/plan');
const placer = await source.import('world/placer');
const { heightAt } = await source.import('world/terrain');
const { edgeRadius } = await source.import('world/island');
const { buildings, localToWorld } = await source.import('world/config');
const palette = await source.import('world/palette');
test.after(() => source.cleanup());

const { decor, ZONES } = placer;
const solid = decor.filter((d) => d.radius > 0);
const label = (d) => `${d.model} (${d.x.toFixed(1)}, ${d.z.toFixed(1)})`;

test('Grille : rues, trottoirs, place et parcelles alignés sur 4 m, parcelles disjointes', () => {
  for (const t of plan.ROAD_TILES) {
    assert.ok(t.x % plan.GRID === 0 && t.z % plan.GRID === 0, `tuile ${t.x},${t.z}`);
  }
  const P = plan.PARCELS.map((p) => p.bounds);
  for (let i = 0; i < P.length; i++)
    for (let j = i + 1; j < P.length; j++) {
      const overlap = P[i].x0 < P[j].x1 && P[j].x0 < P[i].x1 && P[i].z0 < P[j].z1 && P[j].z0 < P[i].z1;
      assert.ok(!overlap, `${plan.PARCELS[i].id} / ${plan.PARCELS[j].id}`);
    }
});

test('Parcelles : chaque bâtiment tient dans la sienne, sur l’île', () => {
  for (const b of buildings) {
    const p = plan.parcelOf(b.id).bounds;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const [x, z] = localToWorld(b, (sx * b.size[0]) / 2, (sz * b.size[1]) / 2);
      assert.ok(
        plan.inside(p, x, z, 0.01),
        `${b.id} déborde de sa parcelle en ${x.toFixed(1)}, ${z.toFixed(1)}`,
      );
      assert.ok(Math.hypot(x, z) < edgeRadius(Math.atan2(z, x)) - 3, `${b.id} trop près du bord`);
    }
  }
});

test('Placeur : chaque objet est dans une zone qui l’accepte', () => {
  const wrong = decor.filter((d) => !ZONES[d.model].includes(plan.zoneAt(d.x, d.z))).map(label);
  assert.deepEqual(wrong, []);
  // Rien sur la chaussée hors des routes.
  const onRoad = decor
    .filter((d) => !d.model.startsWith('route') && plan.zoneAt(d.x, d.z) === 'route')
    .map(label);
  assert.deepEqual(onRoad, []);
});

test('Placeur : distances minimales entre objets, rien hors du terrain ni flottant', () => {
  for (let i = 0; i < solid.length; i++)
    for (let j = i + 1; j < solid.length; j++) {
      const [a, b] = [solid[i], solid[j]];
      assert.ok(Math.hypot(a.x - b.x, a.z - b.z) >= a.radius + b.radius + 0.3, `${label(a)} / ${label(b)}`);
    }
  for (const d of decor) {
    assert.ok(
      Math.hypot(d.x, d.z) + d.radius < edgeRadius(Math.atan2(d.z, d.x)) - 0.5,
      `${label(d)} hors du terrain`,
    );
    if (d.radius > 0) assert.ok(Math.abs(d.y - heightAt(d.x, d.z)) < 0.05, `${label(d)} flotte`);
  }
});

test('Placeur : aucun arbre contre une façade ni devant une porte, rien dans un bâtiment', () => {
  for (const d of solid) {
    for (const b of buildings) {
      const dx = d.x - b.position[0];
      const dz = d.z - b.position[1];
      const lx = dx * Math.cos(b.rotation) - dz * Math.sin(b.rotation);
      const lz = dx * Math.sin(b.rotation) + dz * Math.cos(b.rotation);
      const gap = /^(pin|sapin|feuillu)$/.test(d.model) ? 1.5 : 0.2;
      const inside =
        Math.abs(lx) < b.size[0] / 2 + d.radius + gap && Math.abs(lz) < b.size[1] / 2 + d.radius + gap;
      assert.ok(!inside, `${label(d)} contre ${b.id}`);
    }
    if (/^(pin|sapin|feuillu|buisson)$/.test(d.model))
      assert.ok(!placer.inFrontOfDoor(d.x, d.z), `${label(d)} devant une porte`);
  }
});

test('Placeur : lampadaires parallèles aux bordures, à 0,7 m de la chaussée', () => {
  for (const d of decor.filter((x) => x.model === 'lampadaire')) {
    assert.ok(Math.abs(Math.sin(2 * d.ry)) < 1e-9, `${label(d)} pas d’équerre`);
    const road = plan.CARRIAGEWAYS.map((r) => plan.rectDistance(r, d.x, d.z));
    assert.ok(Math.abs(Math.min(...road) - 0.7) < 0.01, `${label(d)} à ${Math.min(...road).toFixed(2)} m`);
  }
});

test('Relief : sol plat sur les rues, la place et les parcelles ; buttes douces ailleurs', () => {
  for (let x = -60; x <= 60; x += 2)
    for (let z = -60; z <= 60; z += 2) {
      const zone = plan.zoneAt(x, z);
      if (zone !== 'pelouse') assert.equal(heightAt(x, z), 0, `${zone} en ${x},${z}`);
      assert.ok(heightAt(x, z) < 1.6);
    }
});

test('Palette : 64 cases, atlas généré, case la plus proche hors accents', () => {
  assert.equal(palette.SWATCHES.length, 64);
  assert.equal(palette.atlasPixels().length, 128 * 128 * 4);
  const i = palette.nearestSwatch([0.8, 0.2, 0.2]);
  assert.ok(!palette.SWATCHES[i][0].startsWith('accent-'));
});
