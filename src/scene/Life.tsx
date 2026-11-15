/**
 * Un monde vivant : jets d'eau de la fontaine, oiseaux et petits robots promeneurs.
 * Tout est instancié (quelques draw calls) et ne touche ni aux collisions ni à la caméra.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { color as C, scenePlaceColor } from '../design/tokens';
import { streets } from '../world/urban';
import { heightAt } from '../world/terrain';
import { cumulative, pointAlong } from '../world/timing';
import { player, getState } from '../state';
import { material } from './Primitives';
import type { Point } from '../world/config';

const temp = new THREE.Object3D();

/** Gouttes en arc de la fontaine de la place, autour de la sculpture. */
function Fountain() {
  const JETS = 8;
  const DROPS = 5;
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const ripple = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let j = 0; j < JETS; j++) {
      const a = (j / JETS) * Math.PI * 2;
      for (let d = 0; d < DROPS; d++) {
        const u = (t * 0.7 + d / DROPS + j * 0.13) % 1;
        const r = 0.9 + u * 1.1;
        temp.position.set(Math.cos(a) * r, 1.45 + Math.sin(u * Math.PI) * 0.9 - u * 0.55, Math.sin(a) * r);
        temp.scale.setScalar(0.07 + 0.03 * Math.sin(u * Math.PI));
        temp.updateMatrix();
        mesh.current.setMatrixAt(j * DROPS + d, temp.matrix);
      }
    }
    mesh.current.instanceMatrix.needsUpdate = true;
    ripple.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04);
  });
  return (
    <group position={[0, 0.8, 0]}>
      <instancedMesh
        ref={mesh}
        args={[
          undefined,
          material('#bfeaff', { rough: 0.2, glow: '#bfeaff', glowIntensity: 0.4 }),
          JETS * DROPS,
        ]}
        frustumCulled={false}
      >
        <icosahedronGeometry args={[1, 0]} />
      </instancedMesh>
      <mesh
        ref={ripple}
        position={[0, 0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={material('#a8e2f2', { rough: 0.15, metal: 0.1 })}
      >
        <ringGeometry args={[1.25, 1.55, 40]} />
      </mesh>
    </group>
  );
}

/** Quelques oiseaux qui tournent au-dessus de l'île en battant des ailes. */
function Birds() {
  const COUNT = 6;
  const left = useRef<THREE.InstancedMesh>(null!);
  const right = useRef<THREE.InstancedMesh>(null!);
  const wing = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, 0, 0, -0.25, 1, 0, -0.05], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  const birds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        radius: 26 + (i % 3) * 9,
        height: 20 + (i % 4) * 3,
        speed: 0.12 + (i % 3) * 0.03,
        phase: i * 1.7,
        flap: 6 + (i % 2) * 2,
      })),
    [],
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    birds.forEach((b, i) => {
      const a = t * b.speed + b.phase;
      const x = Math.cos(a) * b.radius;
      const z = Math.sin(a) * b.radius;
      const y = b.height + Math.sin(t * 0.5 + b.phase) * 1.5;
      const heading = -a; // tangente du cercle
      const beat = Math.sin(t * b.flap + b.phase) * 0.6;
      for (const [mesh, side] of [
        [left.current, -1],
        [right.current, 1],
      ] as const) {
        temp.position.set(x, y, z);
        temp.rotation.set(0, heading, side * beat);
        temp.scale.set(side * 0.9, 1, 0.9);
        temp.updateMatrix();
        mesh.setMatrixAt(i, temp.matrix);
      }
    });
    left.current.instanceMatrix.needsUpdate = true;
    right.current.instanceMatrix.needsUpdate = true;
  });
  const m = material(C.ink, { side: THREE.DoubleSide });
  return (
    <>
      <instancedMesh ref={left} args={[wing, m, COUNT]} frustumCulled={false} />
      <instancedMesh ref={right} args={[wing, m, COUNT]} frustumCulled={false} />
    </>
  );
}

/**
 * Petits robots promeneurs : ils font des allers-retours sur les rues. Quand le joueur approche,
 * ils s'arrêtent, s'écartent et le regardent ; ils n'ont pas de collision et ne le bloquent jamais.
 */
const WALKERS: { route: Point[]; color: string; speed: number; offset: number }[] = [
  { route: streets[0].slice(0, 6), color: scenePlaceColor['project-1'], speed: 1.5, offset: 0 },
  { route: streets[1].slice(2, 7), color: scenePlaceColor['project-3'], speed: 1.3, offset: 0.4 },
  { route: streets[3], color: scenePlaceColor.missions, speed: 1.6, offset: 0.7 },
];
function Walkers() {
  const body = useRef<THREE.InstancedMesh>(null!);
  const head = useRef<THREE.InstancedMesh>(null!);
  const visor = useRef<THREE.InstancedMesh>(null!);
  const routes = useMemo(() => WALKERS.map((w) => ({ ...w, lengths: cumulative(w.route) })), []);
  const state = useRef(
    routes.map((r) => ({ s: (r.lengths.at(-1) ?? 0) * r.offset, dir: 1, aside: 0, angle: 0 })),
  );
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const s = getState();
    routes.forEach((r, i) => {
      const w = state.current[i];
      const total = r.lengths.at(-1) ?? 0;
      const here = pointAlong(r.route, r.lengths, w.s);
      const near = !s.interior && Math.hypot(player.x - here.p[0], player.z - here.p[1]) < 3;
      if (!near) {
        w.s += w.dir * r.speed * dt;
        if (w.s > total || w.s < 0) {
          w.dir *= -1;
          w.s = Math.max(0, Math.min(total, w.s));
        }
      }
      w.aside = THREE.MathUtils.damp(w.aside, near ? 1.1 : 0, 4, dt);
      const { p, heading } = pointAlong(r.route, r.lengths, w.s);
      const facing = near
        ? Math.atan2(player.x - p[0], player.z - p[1])
        : heading + (w.dir < 0 ? Math.PI : 0);
      w.angle += Math.atan2(Math.sin(facing - w.angle), Math.cos(facing - w.angle)) * (1 - Math.exp(-6 * dt));
      // Pas de côté perpendiculaire à la rue quand le joueur passe.
      const x = p[0] + Math.cos(heading) * w.aside;
      const z = p[1] - Math.sin(heading) * w.aside;
      const bob = near ? 0 : Math.abs(Math.sin(t * 9 + i)) * 0.06;
      const y = heightAt(x, z) + bob;
      for (const [mesh, oy, sx, sy, sz, dz] of [
        [body.current, 0.42, 0.5, 0.5, 0.42, 0],
        [head.current, 0.92, 0.62, 0.42, 0.48, 0],
        [visor.current, 0.94, 0.48, 0.22, 0.04, 0.25],
      ] as const) {
        temp.position.set(x + Math.sin(w.angle) * dz, y + oy, z + Math.cos(w.angle) * dz);
        temp.rotation.set(0, w.angle, 0);
        temp.scale.set(sx, sy, sz);
        temp.updateMatrix();
        mesh.setMatrixAt(i, temp.matrix);
      }
      body.current.setColorAt(i, new THREE.Color(r.color));
    });
    for (const m of [body.current, head.current, visor.current]) m.instanceMatrix.needsUpdate = true;
    if (body.current.instanceColor) body.current.instanceColor.needsUpdate = true;
  });
  const cube = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  return (
    <>
      <instancedMesh
        ref={body}
        args={[cube, material('#ffffff'), routes.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={head}
        args={[cube, material(C.cream), routes.length]}
        castShadow
        frustumCulled={false}
      />
      <instancedMesh
        ref={visor}
        args={[cube, material(C.ink, { glow: '#7fd6ff', glowIntensity: 0.25 }), routes.length]}
        frustumCulled={false}
      />
    </>
  );
}

export default function Life() {
  return (
    <>
      <Fountain />
      <Birds />
      <Walkers />
    </>
  );
}
