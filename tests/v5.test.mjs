import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';

globalThis.window = { matchMedia: () => ({ matches: false }) };
const source = await loadSource('v5');
const game = await source.import('state');
const { buildings, entrance, WORLD } = await source.import('world/config');
const { heightAt } = await source.import('world/terrain');
const { tickMotion, skipCurrent } = await source.import('world/motion');
const { TIMING } = await source.import('world/timing');
const narrative = await source.import('world/narrative');
after(() => source.cleanup());

const DT = 1 / 60;
const idle = () => game.getState().phase === 'explore';
function run(until, limit = 60 * 30) {
  for (let i = 0; i < limit; i++) {
    if (until()) return i * DT;
    tickMotion(DT);
  }
  return Infinity;
}
function place(x, z, angle = Math.PI) {
  game.setState({
    phase: 'explore',
    interior: null,
    door: null,
    showcase: null,
    station: null,
    reading: null,
    nearby: null,
    map: false,
    help: false,
    detail: null,
    notice: '',
    reducedMotion: false,
  });
  Object.assign(game.player, { x, z, y: heightAt(x, z), angle, speed: 0 });
  game.journey.points = [];
  game.passage.pending = null;
}

test('Temps morts : trajet ≤ 6 s entre deux lieux quelconques et depuis le départ', () => {
  const starts = [WORLD.spawn, ...buildings.map(entrance)];
  for (const start of starts)
    for (const b of buildings) {
      if (Math.hypot(start[0] - entrance(b)[0], start[1] - entrance(b)[1]) < 1) continue;
      place(...start);
      game.travel(b.id);
      const t = run(idle);
      assert.ok(t <= 6, `${start} → ${b.id} : ${t.toFixed(2)} s`);
      assert.equal(game.getState().nearby, b.id);
    }
});

test('Temps morts : entrer ≤ 2,5 s, sortir ≤ 2 s depuis n’importe quelle station', () => {
  for (const b of buildings) {
    const [x, z] = entrance(b);
    place(x + 1.5, z - 1, 0); // à côté de l'entrée, de dos à la porte
    game.openBuilding(b.id);
    const enter = run(() => idle() && game.getState().interior === b.id);
    assert.ok(enter <= 2.5, `${b.id} entrer : ${enter.toFixed(2)} s`);
    for (const station of narrative.stationsFor(b.id)) {
      const p = narrative.stationApproach(station);
      Object.assign(game.player, { x: p[0], z: p[1], y: 0 });
      game.setState({ phase: 'explore', interior: b.id, door: null });
      game.guideExit();
      const exit = run(() => idle() && !game.getState().interior);
      assert.ok(exit <= 2, `${b.id} sortir depuis ${station.id} : ${exit.toFixed(2)} s`);
      assert.ok(Math.hypot(game.player.x - entrance(b)[0], game.player.z - entrance(b)[1]) < 0.05);
      game.openBuilding(b.id);
      run(() => idle() && game.getState().interior === b.id);
    }
  }
});

test('Temps morts : présentation de 4 s au total, passable', () => {
  assert.ok(Math.abs(TIMING.showcase + TIMING.showcaseReturn - 4) < 1e-9);
  const b = buildings[0];
  place(...entrance(b), b.rotation + Math.PI);
  game.discover(b.id);
  assert.equal(game.getState().phase, 'showcase');
  assert.equal(game.presentation.duration, TIMING.showcase);
  assert.equal(skipCurrent(), true);
  assert.equal(game.getState().phase, 'returning');
});

test('Chaque séquence automatique se passe : trajet, porte, descente de caméra', () => {
  const b = buildings.find((b) => b.id === 'veolia');
  place(...WORLD.spawn);
  game.travel(b.id);
  tickMotion(DT);
  assert.equal(game.getState().phase, 'travel');
  assert.equal(skipCurrent(), true);
  assert.equal(game.getState().phase, 'explore');
  assert.equal(game.getState().nearby, b.id);
  game.openBuilding(b.id);
  tickMotion(DT);
  assert.equal(game.getState().phase, 'doorway');
  assert.equal(skipCurrent(), true);
  assert.equal(game.getState().phase, 'explore');
  assert.equal(game.getState().interior, b.id);
  const serial = game.skip.serial;
  game.setState({ phase: 'entering', interior: null });
  assert.equal(skipCurrent(), true);
  assert.equal(game.skip.serial, serial + 1);
  game.setState({ phase: 'explore' });
  assert.equal(skipCurrent(), false);
});
