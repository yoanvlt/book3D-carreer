import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

// Compile the actual pure world modules, without a browser or a second implementation.
const source = await loadSource('world');
const { buildings, entrance, localToWorld, WORLD } = await source.import('world/config');
const { heightAt, terrainSlope } = await source.import('world/terrain');
const { blocked, moveWithCollisions, cameraFraction, obstacles } = await source.import('world/collision');
const { findRoute, clearSegment } = await source.import('world/navigation');
const { chooseCamera, moveCamera, chooseInteriorCamera } = await source.import('world/camera');
const { stationsFor, moveIndoors, indoorBlocked } = await source.import('world/narrative');

after(() => source.cleanup());

test('Six unique destinations, safe arrival points and future narrative stations', () => {
  assert.equal(new Set(buildings.map((b) => b.id)).size, 6);
  for (const b of buildings) {
    assert.equal(blocked(...entrance(b)), false, `${b.id} spawn blocked`);
    assert.equal(stationsFor(b.id).length, b.id === 'profile' ? 4 : 8);
  }
  assert.equal(blocked(...WORLD.spawn), false);
});
test('Every building has an exactly level platform', () => {
  for (const b of buildings) {
    for (const [x, z] of [
      [0, 0],
      [b.size[0] / 2, 0],
      [0, b.size[1] / 2],
    ]) {
      const p = localToWorld(b, x, z);
      assert.ok(Math.abs(heightAt(...p) - b.elevation) < 0.001);
    }
  }
});
test('Relief is substantial, finite and continuous along the main paths', () => {
  const heights = [];
  for (let x = -45; x <= 45; x += 3)
    for (let z = -45; z <= 45; z += 3) {
      const h = heightAt(x, z);
      assert.ok(Number.isFinite(h));
      heights.push(h);
    }
  assert.ok(Math.max(...heights) - Math.min(...heights) > 4);
  for (const b of buildings) {
    const end = entrance(b);
    let previous = heightAt(0, 0);
    for (let i = 1; i <= 150; i++) {
      const x = (end[0] * i) / 150,
        z = (end[1] * i) / 150,
        y = heightAt(x, z);
      assert.ok(Math.abs(y - previous) < 0.3);
      assert.ok(terrainSlope(x, z) < 1.2);
      previous = y;
    }
  }
});
test('Fast movement cannot tunnel through rotated building walls', () => {
  for (const b of buildings) {
    const start = entrance(b),
      target = b.position;
    const result = moveWithCollisions(start, [target[0] - start[0], target[1] - start[1]]);
    assert.equal(blocked(...result), false);
    assert.ok(Math.hypot(result[0] - target[0], result[1] - target[1]) > 3);
  }
});
test('World perimeter blocks escape, including a very long frame', () => {
  const result = moveWithCollisions([0, 45], [0, 100]);
  assert.ok(Math.hypot(...result) <= WORLD.radius);
  assert.equal(blocked(...result), false);
});
test('Diagonal movement slides along a wall without becoming embedded', () => {
  const b = buildings[0],
    start = entrance(b);
  let result = start;
  for (let i = 0; i < 100; i++) result = moveWithCollisions(result, [0.06, -0.1]);
  assert.equal(blocked(...result), false);
  assert.ok(Math.hypot(result[0] - start[0], result[1] - start[1]) > 1);
});
test('Camera rays retract before all six building volumes', () => {
  for (let i = 0; i < buildings.length; i++) {
    const b = buildings[i],
      p = entrance(b),
      o = obstacles[i];
    const from = { x: p[0], y: b.elevation + 1.65, z: p[1] },
      to = { x: b.position[0], y: b.elevation + 4, z: b.position[1] };
    const fraction = cameraFraction(from, to);
    assert.ok(fraction > 0 && fraction < 1, `${b.id}: ${fraction}`);
    const end = { x: from.x + (to.x - from.x) * fraction, z: from.z + (to.z - from.z) * fraction };
    const dx = end.x - o.x,
      dz = end.z - o.z;
    const lx = dx * Math.cos(o.angle) - dz * Math.sin(o.angle),
      lz = dx * Math.sin(o.angle) + dz * Math.cos(o.angle);
    assert.ok(Math.abs(lx) > o.halfX || Math.abs(lz) > o.halfZ);
  }
});
test('Camera terrain sampling rejects rays below the ground', () => {
  const from = { x: 0, y: 5, z: 12 },
    to = { x: 0, y: -3, z: 20 };
  assert.ok(cameraFraction(from, to) < 1);
});
test('Camera still retracts when the player is pressed against a wall', () => {
  for (const b of buildings) {
    const p = localToWorld(b, 0, b.size[1] / 2 + 0.8);
    const from = { x: p[0], y: b.elevation + 1.65, z: p[1] };
    const to = { x: b.position[0], y: b.elevation + 3, z: b.position[1] };
    assert.ok(cameraFraction(from, to) < 0.3, b.id);
  }
});
test('Terrain and collision functions remain deterministic', () => {
  assert.deepEqual(moveWithCollisions([10, 12], [2, 3]), moveWithCollisions([10, 12], [2, 3]));
  assert.equal(heightAt(17, -22), heightAt(17, -22));
});

test('All 30 inter-building journeys avoid obstacles along every segment', () => {
  for (const a of buildings)
    for (const b of buildings) {
      if (a === b) continue;
      const route = findRoute(entrance(a), entrance(b));
      assert.ok(route.length > 1, `${a.id} -> ${b.id}`);
      for (let i = 1; i < route.length; i++)
        assert.ok(clearSegment(route[i - 1], route[i], 0.53), `${a.id} -> ${b.id} segment ${i}`);
    }
});
test('Spawn can reach all six doors', () => {
  for (const b of buildings) {
    const route = findRoute(WORLD.spawn, entrance(b));
    assert.ok(route.length > 1, b.id);
  }
});
test('Camera finds a comfortable clear view at every facade, including opposing user yaw', () => {
  for (const b of buildings)
    for (const side of [-1, 1])
      for (const axis of [0, 1]) {
        const local = axis === 0 ? [side * (b.size[0] / 2 + 0.9), 0] : [0, side * (b.size[1] / 2 + 0.9)];
        const p = localToWorld(b, ...local);
        const target = { x: p[0], y: heightAt(...p) + 1.65, z: p[1] };
        for (let yaw = 0; yaw < 6.2; yaw += 0.6) {
          const solution = chooseCamera(target, yaw, 0.47, 16.5, 0);
          assert.ok(Number.isFinite(solution.score), b.id);
          assert.ok(
            Math.hypot(
              solution.point.x - target.x,
              solution.point.y - target.y,
              solution.point.z - target.z,
            ) >= 9,
          );
          assert.ok(cameraFraction(target, solution.point, 0.65) > 0.99);
        }
      }
});
test('Camera body cannot sweep through a facade', () => {
  for (const b of buildings) {
    const p = entrance(b),
      from = { x: p[0], y: b.elevation + 3, z: p[1] },
      to = { x: b.position[0], y: b.elevation + 3, z: b.position[1] };
    let pos = from;
    for (let i = 0; i < 100; i++)
      pos = moveCamera(pos, { x: pos.x + (to.x - pos.x) * 0.1, y: pos.y, z: pos.z + (to.z - pos.z) * 0.1 });
    assert.ok(Math.hypot(pos.x - to.x, pos.z - to.z) > 2);
  }
});
test('Interior walking cannot escape or tunnel through exhibition plinths', () => {
  for (const b of buildings) {
    assert.ok(stationsFor(b.id).length >= 4);
    for (const s of stationsFor(b.id)) {
      const end = moveIndoors([s.position[0], s.position[1] + 3], [0, -7], b.id);
      assert.equal(indoorBlocked(...end, b.id), false);
      assert.ok(end[1] > s.position[1] - 1.3);
    }
    const edge = moveIndoors([0, 14], [100, 100], b.id);
    assert.equal(indoorBlocked(...edge, b.id), false);
  }
});

test('Interior camera preserves a nine-unit horizontal boom at doors, walls and corners', () => {
  for (const [x, z] of [
    [0, 17],
    [0, -17],
    [10, 0],
    [-10, 0],
    [10, 17],
    [-10, -17],
  ])
    for (let yaw = 0; yaw < 6.2; yaw += 0.3) {
      const p = chooseInteriorCamera(x, z, yaw, 0);
      assert.ok(Number.isFinite(p.score));
      assert.ok(Math.abs(p.x) < 10 && Math.abs(p.z) < 17);
      assert.ok(Math.hypot(p.x - x, p.z - z) > 8.99);
    }
});
