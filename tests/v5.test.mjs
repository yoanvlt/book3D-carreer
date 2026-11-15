import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { loadSource } from './load-source.mjs';
import { PerspectiveCamera, Vector3 } from 'three';

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

const collision = await source.import('world/collision');
const controls = await source.import('world/controls');
const camera = await source.import('world/camera');
const { CAMERA } = await source.import('world/config');

test('Vecteur d’entrée : joystick analogique et clavier partagent le même calcul', () => {
  const half = controls.combineInput({ forward: 0, right: 0, run: false }, { x: 0, y: 0.5, run: false });
  assert.equal(half.magnitude, 0.5);
  const [vx, vz] = controls.desiredVelocity(half, 0, 6);
  // Caméra au sud (yaw 0) : avancer va vers le nord (z décroissant), à mi-vitesse.
  assert.ok(Math.abs(vx) < 1e-9 && Math.abs(vz + 3) < 1e-9);
  const both = controls.combineInput({ forward: 1, right: 1, run: false }, { x: 1, y: 1, run: true });
  assert.ok(Math.abs(Math.hypot(both.forward, both.right) - 1) < 1e-9, 'limité au disque unité');
  assert.equal(both.run, true);
  const keys = controls.combineInput({ forward: 0, right: -1, run: false }, { x: 0, y: 0, run: false });
  const [kx] = controls.desiredVelocity(keys, Math.PI / 2, 1);
  assert.ok(Math.abs(kx) < 1e-9, 'gauche relative à la caméra');
  const jump = { height: 0, velocity: controls.JUMP.velocity };
  let top = 0;
  for (let i = 0; i < 120; i++) {
    controls.stepJump(jump, 1 / 60);
    top = Math.max(top, jump.height);
  }
  assert.ok(top > 0.5 && top < 1.2 && jump.height === 0, 'petit saut qui retombe');
});

test('Toucher pour aller : point du sol visé, bâtiment reconnu, itinéraire calculé', () => {
  const hit = controls.groundHit({ x: -10, y: 30, z: 20 }, normalize({ x: 0, y: -1, z: -0.2 }), false);
  assert.ok(hit && !hit.building);
  const b = buildings.find((b) => b.id === 'veolia');
  const toward = normalize({ x: b.position[0] - 32, y: b.elevation + 5 - 40, z: b.position[1] - 60 });
  assert.equal(controls.groundHit({ x: 32, y: 40, z: 60 }, toward, false)?.building, 'veolia');
  place(...WORLD.spawn);
  assert.equal(game.walkTo([-10, 6]), true);
  assert.equal(game.getState().phase, 'travel');
  run(idle);
  assert.ok(Math.hypot(game.player.x + 10, game.player.z - 6) < 0.05);
  assert.equal(game.walkTo([b.position[0], b.position[1]]), false, 'pas d’itinéraire dans un bâtiment');
});
function normalize(v) {
  const l = Math.hypot(v.x, v.y, v.z);
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

test('Caméra portrait : plus haute et plus loin, réglée par le format d’écran', () => {
  const land = camera.framing(16 / 9, CAMERA.distance, CAMERA.elevation);
  assert.deepEqual(land, { distance: CAMERA.distance, pitch: CAMERA.elevation });
  const portrait = camera.framing(390 / 844, CAMERA.distance, CAMERA.elevation);
  assert.equal(portrait.distance, CAMERA.portrait.distance);
  assert.ok(Math.abs(portrait.pitch - CAMERA.portrait.elevation) < 1e-9);
});

test('Départ : le robot regarde le poteau indicateur et la place, pas le mur d’Autres missions', () => {
  const [x, z] = WORLD.spawn;
  assert.equal(collision.blocked(x, z), false);
  const toPost = Math.atan2(-8 - x, 5 - z);
  const toPlaza = Math.atan2(-x, -z);
  const diff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  assert.ok(diff(WORLD.spawnAngle, toPost) < 0.15, 'face au poteau');
  assert.ok(diff(WORLD.spawnAngle, toPlaza) < 0.6, 'vers la place');
  // Part de l'écran 1440×900 couverte par Autres missions depuis la caméra de départ (V4 : 29 %).
  const m = buildings.find((b) => b.id === 'missions');
  const yaw = WORLD.spawnAngle - Math.PI;
  const target = { x, y: heightAt(x, z) + CAMERA.targetHeight, z };
  const c = camera.chooseCamera(target, yaw, CAMERA.elevation, CAMERA.distance, yaw).point;
  const view = new PerspectiveCamera(48, 1440 / 900, 0.1, 400);
  view.position.set(c.x, c.y, c.z);
  view.lookAt(target.x, target.y, target.z);
  view.updateMatrixWorld();
  const xs = [],
    ys = [];
  for (const lx of [-m.size[0] / 2, m.size[0] / 2])
    for (const lz of [-m.size[1] / 2, m.size[1] / 2])
      for (const ly of [0, m.height]) {
        const wx = m.position[0] + lx * Math.cos(m.rotation) + lz * Math.sin(m.rotation);
        const wz = m.position[1] - lx * Math.sin(m.rotation) + lz * Math.cos(m.rotation);
        const v = new Vector3(wx, m.elevation + ly, wz).project(view);
        assert.ok(v.z < 1);
        xs.push(Math.max(-1, Math.min(1, v.x)));
        ys.push(Math.max(-1, Math.min(1, v.y)));
      }
  const area = ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / 4;
  assert.ok(area < 0.12, `Autres missions couvre ${(area * 100).toFixed(0)} % de l’écran`);
  const post = new Vector3(-8, 2.5, 5).project(view);
  assert.ok(Math.abs(post.x) < 0.2, 'poteau au centre de l’écran');
});

test('Collisions : glisser le long d’un mur tourné et d’un banc au lieu de bloquer', () => {
  for (const o of [collision.obstacles[5], ...collision.allObstacles.filter((o) => o.halfX === 1.5)]) {
    // Départ devant la face +Z locale de l'obstacle, poussée à 45° vers le mur.
    const c = Math.cos(o.angle),
      s = Math.sin(o.angle);
    const toWorld = (lx, lz) => [o.x + lx * c + lz * s, o.z - lx * s + lz * c];
    const start = toWorld(0, o.halfZ + 0.6);
    const into = toWorld(1, -1);
    const dir = [into[0] - o.x, into[1] - o.z];
    const len = Math.hypot(...dir);
    let p = start;
    for (let i = 0; i < 20; i++)
      p = collision.moveWithCollisions(p, [(dir[0] / len) * 0.1, (dir[1] / len) * 0.1]);
    assert.ok(!collision.blocked(...p));
    const along = (p[0] - start[0]) * c - (p[1] - start[1]) * s; // déplacement selon l'axe local x
    assert.ok(
      along > 0.9,
      `glissement insuffisant (${along.toFixed(2)}) le long de l’obstacle à ${o.x},${o.z}`,
    );
  }
});

test('Nuages : aucun ne masque le pied de l’île ni le titre, sur les quatre écrans', async () => {
  const clouds = await source.import('world/clouds');
  const list = clouds.makeClouds();
  assert.ok(list.length >= 25, `${list.length} nuages gardés`);
  assert.ok(list.some((c) => c.y < 0) && list.some((c) => c.y > 20), 'mer de nuages et nuages hauts');
  for (const [w, h] of clouds.CHECKED_SCREENS)
    for (const c of list) assert.equal(clouds.cloudConflicts(c, w, h), false);
});

const passport = await source.import('world/passport');

test('Passeport : tampons gardés dans le navigateur, sans erreur si le stockage manque', () => {
  const memory = new Map();
  const store = { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  assert.deepEqual(passport.loadStamps(store), []);
  assert.equal(passport.saveStamps(['veolia', 'profile', 'inconnu'], store), true);
  assert.deepEqual(
    passport.loadStamps(store),
    ['profile', 'veolia'],
    'ordre des lieux, ids inconnus ignorés',
  );
  const broken = {
    getItem: () => {
      throw new Error('bloqué');
    },
    setItem: () => {
      throw new Error('bloqué');
    },
  };
  assert.deepEqual(passport.loadStamps(broken), []);
  assert.equal(passport.saveStamps(['profile'], broken), false);
  memory.set(passport.PASSPORT_KEY, '{pas du json');
  assert.deepEqual(passport.loadStamps(store), []);
  assert.equal(passport.visitComplete(buildings.map((b) => b.id)), true);
  assert.equal(passport.visitComplete(['profile']), false);
});

test('Fin de visite : carte masquée tant que site.md n’a ni CV ni contact', () => {
  const none = { cv: null, contact: { email: null, linkedin: null, github: null } };
  assert.equal(passport.endCard(none), null);
  assert.deepEqual(passport.endCard({ ...none, cv: 'medias/cv.pdf' }), { cv: 'medias/cv.pdf', links: [] });
  const card = passport.endCard({ ...none, contact: { ...none.contact, email: 'a@b.fr' } });
  assert.deepEqual(card.links, [{ label: 'a@b.fr', href: 'mailto:a@b.fr' }]);
});

test('Visite guidée : six lieux enchaînés en moins de 60 s, quittable à tout moment', () => {
  assert.ok(
    game.TOUR.order.length * (game.TOUR.perPlace + TIMING.showcaseReturn) <= 60,
    'durée totale de la visite',
  );
  game.setState({ phase: 'home', tour: null, showcase: null, interior: null });
  game.startTour();
  const seen = [];
  for (let i = 0; i < 6; i++) {
    assert.equal(game.getState().phase, 'showcase');
    assert.equal(game.presentation.full, true);
    assert.equal(game.presentation.duration, game.TOUR.perPlace);
    seen.push(game.getState().showcase);
    assert.equal(skipCurrent(), true, 'un clic passe au lieu suivant');
    game.finishPresentation();
  }
  assert.deepEqual(
    seen,
    buildings.map((b) => b.id),
  );
  assert.equal(game.getState().tour, null);
  assert.equal(game.getState().phase, 'home');
  game.startTour();
  game.stopTour();
  game.finishPresentation();
  assert.equal(game.getState().tour, null);
  assert.equal(game.getState().phase, 'home');
});
