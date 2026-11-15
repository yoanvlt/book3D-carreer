/**
 * Vie autour des lieux (V8) : un personnage ou une machine au travail devant chacun, sans gêner
 * le joueur (ils s'arrêtent quand le robot approche, ne bloquent aucun passage). Oiseaux qui
 * s'envolent à l'approche, deux voitures qui roulent lentement sur la boucle et s'arrêtent devant
 * le robot. Personnages sans visage, en figurines de maquette.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildings, localToWorld, type BuildingId } from '../world/config';
import { laneLoop } from '../world/plan';
import { getState, player } from '../state';
import { Builder } from '../geometry/mesh';
import { box, cylinder, dome } from '../geometry/shapes';
import type { Swatch } from '../world/palette';
import { dioramaMaterial } from './diorama/material';
import { toGeometry } from './diorama/geometry';
import { kitGeometry } from './diorama/kits';

const mat = () => dioramaMaterial('dynamic');
function part(build: (b: Builder) => void) {
  const b = new Builder();
  build(b);
  return new THREE.Mesh(toGeometry(b.finish()), mat());
}

/** Figurine : jambes et torse (vêtement), tête, deux bras articulés à l'épaule. */
function figure(clothes: Swatch, legs: Swatch = 'encre') {
  const root = new THREE.Group();
  const body = part((b) => {
    box(b, -0.13, 0, 0, 0.18, 0.85, 0.22, legs, { bevel: 0.05 });
    box(b, 0.13, 0, 0, 0.18, 0.85, 0.22, legs, { bevel: 0.05 });
    box(b, 0, 0.82, 0, 0.56, 0.72, 0.34, clothes, { bevel: 0.12 });
  });
  const head = part((b) => {
    cylinder(b, 0, 1.52, 0, 0.08, 0.1, 'enduit-chaud', { segments: 8 });
    dome(b, 0, 1.62, 0, 0.21, 'enduit-chaud', { segments: 12 });
    cylinder(b, 0, 1.5, 0, 0.17, 0.12, 'enduit-chaud', { r1: 0.21, segments: 12, cap: false });
  });
  const arms = [-1, 1].map((side) => {
    const g = new THREE.Group();
    g.position.set(side * 0.33, 1.46, 0);
    g.add(part((b) => box(b, 0, -0.62, 0, 0.14, 0.62, 0.16, clothes, { bevel: 0.05 })));
    root.add(g);
    return g;
  });
  root.add(body, head);
  return { root, body, head, armL: arms[0], armR: arms[1] };
}

type Fig = ReturnType<typeof figure>;
const at = (id: BuildingId, x: number, z: number) =>
  localToWorld(
    buildings.find((b) => b.id === id)!,
    x,
    z,
  );
const near = (x: number, z: number, r = 2.6) =>
  Math.hypot(player.x - x, player.z - z) < r && getState().interior === null;

/** Va-et-vient entre deux points, avec pauses ; renvoie la position et l'état (marche, pause). */
function shuttle(t: number, a: [number, number], b: [number, number], speed: number, pause: number) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const leg = length / speed;
  const cycle = 2 * (leg + pause);
  const u = ((t % cycle) + cycle) % cycle;
  if (u < pause) return { p: a, walking: false, heading: Math.atan2(b[0] - a[0], b[1] - a[1]) };
  if (u < pause + leg) {
    const k = (u - pause) / leg;
    return {
      p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k] as [number, number],
      walking: true,
      heading: Math.atan2(b[0] - a[0], b[1] - a[1]),
    };
  }
  if (u < 2 * pause + leg) return { p: b, walking: false, heading: Math.atan2(a[0] - b[0], a[1] - b[1]) };
  const k = (u - 2 * pause - leg) / leg;
  return {
    p: [b[0] + (a[0] - b[0]) * k, b[1] + (a[1] - b[1]) * k] as [number, number],
    walking: true,
    heading: Math.atan2(a[0] - b[0], a[1] - b[1]),
  };
}

function walkPose(f: Fig, walking: boolean, t: number) {
  const s = walking ? Math.sin(t * 7) : 0;
  f.armL.rotation.x = s * 0.5;
  f.armR.rotation.x = -s * 0.5;
  f.body.position.y = walking ? Math.abs(Math.cos(t * 7)) * 0.04 : 0;
}

/** Personnages et machines devant les six lieux. */
function Workers() {
  const cast = useMemo(() => {
    const gardener = figure('tissu-ocre', 'bois-profond');
    const can = part((b) => {
      box(b, 0, -0.95, 0.15, 0.28, 0.26, 0.2, 'carrosserie-verte', { bevel: 0.05 });
      box(b, 0, -0.85, 0.36, 0.06, 0.06, 0.3, 'carrosserie-verte', { bevel: 0.02 });
    });
    gardener.armR.add(can);
    const courier = figure('carrosserie-bleue');
    const parcel = part((b) => box(b, 0, 0.95, 0.42, 0.55, 0.42, 0.45, 'bois-clair', { bevel: 0.05 }));
    courier.root.add(parcel);
    const astronomer = figure('accent-project-3');
    const scope = part((b) => {
      for (const a of [0, 2.1, 4.2])
        box(b, Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3, 0.05, 1.3, 0.05, 'metal-sombre', { bevel: 0.01 });
      box(b, 0, 1.3, 0.1, 0.18, 0.18, 1.1, 'blanc', { bevel: 0.06 });
    });
    const agent = figure('accent-veolia');
    const board = part((b) => box(b, 0, -0.55, 0.12, 0.26, 0.34, 0.04, 'blanc', { bevel: 0.02 }));
    agent.armR.add(board);
    const visitor = figure('tissu-rouge', 'tissu-bleu');
    // Chariot élévateur : caisse ocre, mât, fourches, roues, conducteur assis.
    const forklift = new THREE.Group();
    forklift.add(
      part((b) => {
        box(b, 0, 0.3, 0, 1.3, 0.9, 2.0, 'accent-project-2', { bevel: 0.12 });
        box(b, 0, 1.2, -0.3, 1.2, 0.12, 1.2, 'metal-sombre', { bevel: 0.04 });
        for (const x of [-0.55, 0.55]) box(b, x, 1.2, 0.2, 0.08, 1.1, 0.08, 'metal-sombre', { bevel: 0.02 });
        for (const x of [-0.6, 0.6])
          for (const z of [-0.65, 0.65]) cylinder(b, x * 1.05, 0, z, 0.3, 0.3, 'encre', { segments: 10 });
        for (const x of [-0.45, 0.45]) box(b, x, 0, 1.15, 0.12, 2.4, 0.12, 'metal-sombre', { bevel: 0.03 });
      }),
    );
    const forks = part((b) => {
      for (const x of [-0.3, 0.3]) box(b, x, 0, 1.6, 0.12, 0.06, 0.9, 'metal-sombre', { bevel: 0.02 });
      box(b, 0, 0.06, 1.6, 0.9, 0.6, 0.8, 'bois-clair', { bevel: 0.05 });
    });
    forklift.add(forks);
    const driver = figure('carrosserie-bleue');
    driver.root.position.set(0, 0.55, -0.3);
    driver.root.scale.setScalar(0.85);
    forklift.add(driver.root);
    return { gardener, courier, astronomer, scope, agent, visitor, forklift, forks, driver };
  }, []);
  const group = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = getState().reducedMotion ? 0 : clock.elapsedTime;
    const { gardener, courier, astronomer, agent, visitor, forklift, forks } = cast;
    // Jardinier : massifs à l'ouest de la maison ; arrose aux pauses.
    const g = shuttle(t, at('profile', -10, 2.5), at('profile', -10.5, -5), 0.6, 4);
    const gStop = near(...g.p);
    gardener.root.position.set(g.p[0], 0, g.p[1]);
    gardener.root.rotation.y = g.walking ? g.heading : g.heading + 1.4;
    walkPose(gardener, g.walking && !gStop, t);
    gardener.armR.rotation.x = g.walking ? gardener.armR.rotation.x : -0.9 + Math.sin(t * 2) * 0.1;
    // Livreur : de la camionnette à la porte du pavillon, colis dans les bras.
    const c = shuttle(t + 3, at('project-1', 8.6, 3.6), at('project-1', 2.2, 6.6), 1.1, 3);
    courier.root.position.set(c.p[0], 0, c.p[1]);
    courier.root.rotation.y = c.heading;
    walkPose(courier, c.walking && !near(...c.p), t);
    courier.armL.rotation.x = courier.armR.rotation.x = -1.2;
    // Astronome : sur la terrasse de l'observatoire, penchée par moments sur le télescope.
    const [ax, az] = at('project-3', -4.2, 4.4);
    astronomer.root.position.set(ax, 4.28, az);
    astronomer.root.rotation.y = buildings.find((b) => b.id === 'project-3')!.rotation + Math.PI * 0.75;
    const lean = Math.max(0, Math.sin(t * 0.5)) * 0.35;
    astronomer.body.rotation.x = lean * 0.4;
    astronomer.head.rotation.x = lean;
    astronomer.armR.rotation.x = -0.6 - lean;
    const [sx, sz] = at('project-3', -3.6, 3.7);
    cast.scope.position.set(sx, 4.28, sz);
    cast.scope.rotation.set(-0.5, astronomer.root.rotation.y, 0);
    // Agent : fait le tour du bassin de Veolia, s'arrête pour noter.
    const turn = (t * 0.12) % (Math.PI * 2);
    const stop = Math.sin(t * 0.4) > 0.6 || near(agent.root.position.x, agent.root.position.z);
    const [bx, bz] = at('veolia', 16 + Math.cos(turn) * 4.2, -9 + Math.sin(turn) * 4.2);
    if (!stop) agent.root.position.set(bx, 0, bz);
    agent.root.rotation.y =
      Math.atan2(bx - agent.root.position.x, bz - agent.root.position.z) || agent.root.rotation.y;
    walkPose(agent, !stop, t);
    agent.armR.rotation.x = stop ? -1.0 : agent.armR.rotation.x;
    // Visiteur : devant le portique de la galerie, lève les yeux vers le fronton.
    const v = shuttle(t + 1, at('missions', -6.5, 9.2), at('missions', -3, 9.6), 0.5, 5);
    visitor.root.position.set(v.p[0], 0, v.p[1]);
    visitor.root.rotation.y = v.walking ? v.heading : Math.PI;
    walkPose(visitor, v.walking && !near(...v.p), t);
    visitor.head.rotation.x = v.walking ? 0 : -0.35;
    // Chariot : va-et-vient dans la cour de l'atelier, fourches qui montent et descendent.
    const f = shuttle(t, at('project-2', 13, -6), at('project-2', 20.5, -1.5), 1.6, 2.5);
    if (!near(...f.p, 3.5)) forklift.position.set(f.p[0], 0, f.p[1]);
    forklift.rotation.y = f.heading;
    forks.position.y = f.walking ? 0.15 : 0.15 + Math.abs(Math.sin(t * 0.8)) * 0.9;
    group.current.visible = getState().interior === null;
  });
  return (
    <group ref={group}>
      {[
        cast.gardener.root,
        cast.courier.root,
        cast.astronomer.root,
        cast.scope,
        cast.agent.root,
        cast.visitor.root,
        cast.forklift,
      ].map((o, i) => (
        <primitive key={i} object={o} />
      ))}
    </group>
  );
}

/** Oiseaux posés sur la place : s'envolent quand le robot approche, reviennent plus tard. */
function Birds() {
  const birds = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const m = part((b) => {
          box(b, 0, 0, 0, 0.16, 0.14, 0.28, 'gris-fonce', { bevel: 0.05 });
          box(b, 0, 0.1, 0.16, 0.12, 0.12, 0.12, 'gris-fonce', { bevel: 0.04 });
        });
        const home: [number, number] = [-6 + (i % 3) * 1.4 + (i > 2 ? 9 : 0), -1 + (i % 2) * 1.2];
        return { m, home, flight: -1, phase: i * 1.3 };
      }),
    [],
  );
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (const bird of birds) {
      if (
        bird.flight < 0 &&
        Math.hypot(player.x - bird.home[0], player.z - bird.home[1]) < 7 &&
        getState().phase === 'explore'
      )
        bird.flight = 0;
      if (bird.flight >= 0) {
        bird.flight += dt;
        const k = Math.min(1, bird.flight / 2);
        const a = bird.phase + bird.flight * 0.8;
        bird.m.position.set(
          bird.home[0] + Math.cos(a) * 14 * k,
          0.1 + 12 * k * (bird.flight < 12 ? 1 : Math.max(0, 1 - (bird.flight - 12) / 2)),
          bird.home[1] + Math.sin(a) * 14 * k,
        );
        bird.m.rotation.y = -a;
        bird.m.scale.y = 0.6 + Math.abs(Math.sin(bird.flight * 18)) * 0.6;
        if (bird.flight > 14) bird.flight = -1;
      } else {
        bird.m.position.set(bird.home[0], 0.1, bird.home[1]);
        bird.m.rotation.y = bird.phase + Math.floor(bird.phase + performance.now() / 2400) * 0.7;
        bird.m.scale.y = 1;
      }
    }
  });
  return (
    <>
      {birds.map((b, i) => (
        <primitive key={i} object={b.m} />
      ))}
    </>
  );
}

/** Deux voitures sur la boucle, file de droite, à 4,5 m/s ; elles s'arrêtent devant le robot. */
function Cars() {
  const lane = useMemo(() => {
    const pts = laneLoop();
    const lengths = [0];
    for (let i = 1; i <= pts.length; i++)
      lengths.push(
        lengths[i - 1] +
          Math.hypot(pts[i % pts.length][0] - pts[i - 1][0], pts[i % pts.length][1] - pts[i - 1][1]),
      );
    return { pts, lengths, total: lengths.at(-1)! };
  }, []);
  const cars = useMemo(
    () =>
      (['voiture', 'citadine'] as const).map((name, i) => ({
        mesh: new THREE.Mesh(kitGeometry(name), mat()),
        d: i * lane.total * 0.5,
      })),
    [lane],
  );
  const pointAt = (d: number) => {
    const u = ((d % lane.total) + lane.total) % lane.total;
    let i = 1;
    while (lane.lengths[i] < u) i++;
    const a = lane.pts[i - 1];
    const b = lane.pts[i % lane.pts.length];
    const k = (u - lane.lengths[i - 1]) / (lane.lengths[i] - lane.lengths[i - 1] || 1);
    return {
      x: a[0] + (b[0] - a[0]) * k,
      z: a[1] + (b[1] - a[1]) * k,
      heading: Math.atan2(b[0] - a[0], b[1] - a[1]),
    };
  };
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (const car of cars) {
      const here = pointAt(car.d);
      const ahead = pointAt(car.d + 5);
      const blocked =
        Math.hypot(player.x - ahead.x, player.z - ahead.z) < 3.2 ||
        Math.hypot(player.x - here.x, player.z - here.z) < 3;
      if (!blocked && !getState().reducedMotion) car.d += 4.5 * dt;
      car.mesh.position.set(here.x, 0.04, here.z);
      car.mesh.rotation.y = here.heading;
    }
  });
  return (
    <>
      {cars.map((c, i) => (
        <primitive key={i} object={c.mesh} />
      ))}
    </>
  );
}

export default function Vie() {
  return (
    <>
      <Workers />
      <Birds />
      <Cars />
    </>
  );
}
