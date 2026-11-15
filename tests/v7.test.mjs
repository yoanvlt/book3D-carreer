// V7 : le robot, fil conducteur. Vol stationnaire à l'accueil (à côté du titre, au-dessus de la
// carte sur téléphone), vol d'entrée vers la place et vol de retour, au-dessus des toits, sans
// jamais traverser l'île ni un bâtiment ; durées et phases (home, entering, homing).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
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
function screenBox(camera, [x, y, z]) {
  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const corners = [0, ROBOT.height].flatMap((h) =>
    [-1, 1].map((s) => new Vector3(x, y + h, z).addScaledVector(right, s * ROBOT.half).project(camera)),
  );
  return {
    x0: Math.min(...corners.map((c) => c.x)),
    x1: Math.max(...corners.map((c) => c.x)),
    y0: Math.min(...corners.map((c) => c.y)),
    y1: Math.max(...corners.map((c) => c.y)),
    front: corners.every((c) => c.z < 1 && c.z > -1),
  };
}
const overlaps = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

test('Accueil : le robot plane devant la caméra, en entier à l’écran, sans masquer le titre ni la carte', () => {
  for (const [w, h] of CHECKED_SCREENS) {
    const camera = homeCamera(w, h);
    const box = screenBox(camera, flight.homePosition(camera, w));
    assert.ok(box.front, `${w}×${h} : derrière la caméra`);
    assert.ok(box.x0 > -0.95 && box.x1 < 0.95 && box.y0 > -0.95 && box.y1 < 0.95, `${w}×${h} : coupé`);
    // Hauteur à l'écran : « en grand » (au moins un cinquième de la hauteur), sans tout couvrir.
    assert.ok(box.y1 - box.y0 > 0.4 && box.y1 - box.y0 < 0.9, `${w}×${h} : taille ${box.y1 - box.y0}`);
    const reserved =
      w < 760
        ? { x0: -1, x1: 1, y0: -1, y1: -0.05 } // carte d'accueil
        : { x0: -1, x1: -0.12, y0: -0.55, y1: 0.6 }; // titre et boutons
    assert.ok(!overlaps(box, reserved), `${w}×${h} : masque ${w < 760 ? 'la carte' : 'le titre'}`);
  }
});

test('Vols : au-dessus des toits, sans traverser l’île ni un bâtiment, aller et retour', () => {
  const homes = CHECKED_SCREENS.map(([w, h]) => flight.homePosition(homeCamera(w, h), w));
  // Départs du retour : la place et le seuil de chaque bâtiment.
  const city = [
    flight.landingPoint(),
    ...buildings.map((b) => {
      const d = b.size[1] / 2 + 3;
      const [x, z] = [b.position[0] + Math.sin(b.rotation) * d, b.position[1] + Math.cos(b.rotation) * d];
      return [x, heightAt(x, z), z];
    }),
  ];
  const check = (path, label) => {
    for (let i = 4; i <= 196; i++) {
      const { p } = flight.pointOnFlight(path, i / 200);
      assert.ok(!flight.collides(p), `${label} : collision en ${p.map((v) => v.toFixed(1))} (t=${i / 200})`);
    }
  };
  for (const home of homes) {
    check(flight.flightPath(home, flight.landingPoint(), true), 'aller');
    for (const start of city) check(flight.flightPath(start, home, false), 'retour');
  }
});

test('Vols : 2,5 s au plus, atterrissage compris', () => {
  assert.ok(flight.FLIGHT.total <= 2.5);
  assert.ok(flight.FLIGHT.duration + flight.FLIGHT.landing <= flight.FLIGHT.total + 1e-9);
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
