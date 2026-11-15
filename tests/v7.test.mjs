// V7 : le robot, fil conducteur. Vol stationnaire à l'accueil (à côté du titre, au-dessus de la
// carte sur téléphone), vol d'entrée vers la place et vol de retour, au-dessus des toits, sans
// jamais traverser l'île ni un bâtiment ; durées et phases (home, entering, homing).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { loadSource } from './load-source.mjs';

globalThis.window ??= { matchMedia: () => ({ matches: false }) };
const source = await loadSource('v7');
const flight = await source.import('world/flight');
const { homeCamera, CHECKED_SCREENS } = await source.import('world/clouds');
const { buildings, WORLD } = await source.import('world/config');
const { heightAt } = await source.import('world/terrain');
const game = await source.import('state');
const { skipCurrent } = await source.import('world/motion');
test.after(() => source.cleanup());

const ROBOT = { height: 2.5, half: 0.7 };

/** Cadre du robot à l'écran (NDC) : des pieds au sommet de l'antenne, épaules comprises. */
const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

test('Accueil : îlot et robot devant la caméra, entiers à l’écran, sans masquer le titre ni la carte', () => {
  for (const [w, h] of CHECKED_SCREENS) {
    const camera = homeCamera(w, h);
    const [x, y, z] = flight.homePosition(camera, w);
    // Robot (2,5 m) et îlot (4 m de large, 2,8 m sous les pieds).
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const pts = [];
    for (const [dy, half] of [
      [ROBOT.height, ROBOT.half],
      [0, 2.0],
      [-2.8, 0.3],
    ])
      for (const s of [-1, 1])
        pts.push(new Vector3(x, y + dy, z).addScaledVector(right, s * half).project(camera));
    const box = {
      x0: Math.min(...pts.map((p) => p.x)),
      x1: Math.max(...pts.map((p) => p.x)),
      y0: Math.min(...pts.map((p) => p.y)),
      y1: Math.max(...pts.map((p) => p.y)),
    };
    assert.ok(
      pts.every((p) => p.z < 1 && p.z > -1),
      `${w}×${h} : derrière la caméra`,
    );
    assert.ok(box.x0 > -0.98 && box.x1 < 0.98 && box.y0 > -0.98 && box.y1 < 0.98, `${w}×${h} : coupé`);
    const reserved =
      w < 760 ? { x0: -1, x1: 1, y0: -1, y1: -0.05 } : { x0: -1, x1: -0.12, y0: -0.55, y1: 0.6 };
    assert.ok(!overlaps(box, reserved), `${w}×${h} : masque ${w < 760 ? 'la carte' : 'le titre'}`);
  }
});

const timeline = (from, to) => {
  const path = flight.flightPath(from, to);
  return Array.from({ length: 61 }, (_, i) =>
    flight.flightPose(path, (i / 60) * flight.FLIGHT.total, 0, 0),
  ).map((pose) => ({ pose, path }));
};

test('Vols : au-dessus des toits, sans traverser l’île ni un bâtiment, aller et retour', () => {
  const homes = CHECKED_SCREENS.map(([w, h]) => flight.homePosition(homeCamera(w, h), w));
  const city = [
    flight.landingPoint(),
    ...buildings.map((b) => {
      const d = b.size[1] / 2 + 3.4;
      const [x, z] = [b.position[0] + Math.sin(b.rotation) * d, b.position[1] + Math.cos(b.rotation) * d];
      return [x, heightAt(x, z), z];
    }),
  ];
  const check = (from, to, label) => {
    for (const { pose } of timeline(from, to)) {
      if (pose.step !== 'cruise') continue;
      assert.ok(!flight.collides(pose.p), `${label} : collision en ${pose.p.map((v) => v.toFixed(1))}`);
    }
  };
  for (const home of homes) {
    check(home, flight.landingPoint(), 'aller');
    for (const start of city) check(start, home, 'retour');
  }
});

test('Vols : 3 à 3,5 s, accroupi, saut, croisière inclinée, freinage, atterrissage écrasé', () => {
  assert.ok(flight.FLIGHT.total >= 3 && flight.FLIGHT.total <= 3.5);
  const poses = timeline([80, 80, 100], flight.landingPoint()).map((x) => x.pose);
  assert.ok(poses.some((p) => p.step === 'crouch' && p.crouch > 0.9));
  assert.ok(poses.some((p) => p.step === 'cruise' && p.pitch > 0.2 && p.thrust === 1));
  assert.ok(poses.some((p) => p.step === 'land' && p.squash < 0.9));
  assert.deepEqual(poses.at(-1).p, flight.landingPoint());
});

test('Travelling : robot à taille constante (≈ 15 % de la hauteur), de profil ou de trois quarts, jamais de dos', () => {
  for (const [w, h] of CHECKED_SCREENS) {
    const fov = w < 760 ? 48 : 41;
    const home = flight.homePosition(homeCamera(w, h), w);
    for (const [from, to] of [
      [home, flight.landingPoint()],
      [flight.landingPoint(), home],
    ])
      for (const { pose, path } of timeline(from, to)) {
        if (pose.step !== 'cruise') continue;
        const view = flight.flightCamera(pose, path, fov);
        const cam = new PerspectiveCamera(fov, w / h, 0.1, 1400);
        cam.position.set(...view.position);
        cam.lookAt(...view.target);
        cam.updateMatrixWorld();
        const feet = new Vector3(...pose.p).project(cam);
        const top = new Vector3(pose.p[0], pose.p[1] + ROBOT.height, pose.p[2]).project(cam);
        const share = Math.abs(top.y - feet.y) / 2;
        assert.ok(share > 0.12 && share < 0.18, `${w}×${h} : robot à ${(share * 100).toFixed(1)} %`);
        const dir = new Vector3(path[3][0] - path[0][0], 0, path[3][2] - path[0][2]).normalize();
        const look = new Vector3(pose.p[0] - view.position[0], 0, pose.p[2] - view.position[2]).normalize();
        assert.ok(look.dot(dir) < 0.5, `${w}×${h} : caméra de dos`);
      }
  }
});

test('Phases : accueil → entrée (robot posé au départ) → ville → retour à l’accueil, passables', () => {
  game.setState({ phase: 'home', tour: null, showcase: null, interior: null, ready: true });
  Object.assign(game.player, { x: 20, z: 20 });
  game.enter();
  assert.equal(game.getState().phase, 'entering');
  assert.deepEqual([game.player.x, game.player.z], WORLD.spawn);
  const serial = game.skip.serial;
  assert.ok(skipCurrent());
  assert.equal(game.skip.serial, serial + 1);
  game.finishArrival();
  assert.equal(game.getState().phase, 'explore');
  game.goHome();
  assert.equal(game.getState().phase, 'homing');
  assert.ok(skipCurrent());
  assert.equal(game.skip.serial, serial + 2);
  game.setState({ phase: 'home' });
});
