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
import { buildings, localToWorld, type BuildingId, type Point } from '../world/config';

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

/** Horloge des animations discrètes (drapeau, eau) ; figée en mouvement réduit. */
const lifeTime = { value: 0 };

/** Place un objet en coordonnées locales d'un bâtiment (x, y au-dessus du socle, z). */
function onBuilding(id: BuildingId, x: number, y: number, z: number) {
  const b = buildings.find((b) => b.id === id)!;
  const [wx, wz] = localToWorld(b, x, z);
  return {
    position: [wx, b.elevation + y, wz] as [number, number, number],
    rotation: [0, b.rotation, 0] as [number, number, number],
  };
}

/** Drapeau qui ondule au mât de la galerie : toile subdivisée, onde dans le shader, bande blanche. */
function Flag() {
  const cloth = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.lifeTime = lifeTime;
      shader.vertexShader =
        'uniform float lifeTime;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
        float pin = (position.x + 0.8) / 1.6;
        transformed.z += sin(position.x * 4.0 - lifeTime * 5.0) * 0.14 * pin;
        transformed.y += sin(position.x * 3.0 - lifeTime * 4.0) * 0.03 * pin;`,
        );
    };
    m.customProgramCacheKey = () => 'flag';
    return m;
  }, []);
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.6, 1, 16, 6);
    const colors: number[] = [];
    const teal = new THREE.Color(C.teal);
    const white = new THREE.Color(C.white);
    const position = g.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const c = Math.abs(position.getY(i)) < 0.12 ? white : teal;
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);
  const at = onBuilding('missions', -6.3, 0, 3.9);
  return (
    <group {...at}>
      <mesh position={[0, 3.5, 0]} material={material(C.ink, { rough: 0.4, metal: 0.4 })} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 7, 8]} />
      </mesh>
      <mesh position={[0, 7.05, 0]} material={material(C.yellow, { rough: 0.3, metal: 0.5 })}>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      <mesh position={[0.82, 6.35, 0]} geometry={geometry} material={cloth} castShadow />
    </group>
  );
}

/** Girouette au sommet de la tour du Profil : flèche, empennage, croix des points cardinaux. */
function Weathervane() {
  const vane = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    if (getState().reducedMotion) return;
    const t = clock.elapsedTime;
    vane.current.rotation.y = 0.8 + Math.sin(t * 0.21) * 0.5 + Math.sin(t * 0.67) * 0.12;
  });
  const at = onBuilding('profile', -5.6, 22.0, -3.2);
  const iron = material(C.ink, { rough: 0.4, metal: 0.5 });
  return (
    <group {...at}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} position={[0, -0.25, 0]} rotation={[0, r, 0]} material={iron}>
          <boxGeometry args={[0.9, 0.03, 0.03]} />
        </mesh>
      ))}
      <group ref={vane}>
        <mesh material={iron} castShadow>
          <boxGeometry args={[1.3, 0.04, 0.04]} />
        </mesh>
        <mesh position={[0.68, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={iron}>
          <coneGeometry args={[0.08, 0.2, 6]} />
        </mesh>
        <mesh position={[-0.58, 0.08, 0]} material={material(C.orange, { rough: 0.4, metal: 0.4 })}>
          <boxGeometry args={[0.3, 0.26, 0.02]} />
        </mesh>
      </group>
    </group>
  );
}

/** Eau des bassins de Veolia : rides qui avancent lentement, reflets. */
function BasinWater() {
  const water = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#5fa7bd', roughness: 0.18, metalness: 0.15 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.lifeTime = lifeTime;
      shader.vertexShader =
        'varying vec3 vWaterPos;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvWaterPos = position;',
        );
      shader.fragmentShader =
        'uniform float lifeTime;\nvarying vec3 vWaterPos;\n' +
        shader.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
        float w = sin(vWaterPos.x * 3.1 + lifeTime * 1.3) * sin(vWaterPos.y * 2.7 - lifeTime * 0.9);
        float r = sin(length(vWaterPos.xy) * 6.0 - lifeTime * 1.6);
        diffuseColor.rgb *= 0.9 + 0.12 * w + 0.06 * r;`,
        );
    };
    m.customProgramCacheKey = () => 'basin-water';
    return m;
  }, []);
  const basin = onBuilding('veolia', -5.75, 1.03, 2.6);
  const clarifier = onBuilding('veolia', 5.8, 1.41, 2.7);
  return (
    <>
      <group {...basin}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={water} receiveShadow>
          <planeGeometry args={[4.8, 5.4]} />
        </mesh>
      </group>
      <group {...clarifier}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={water} receiveShadow>
          <circleGeometry args={[2.45, 40]} />
        </mesh>
      </group>
    </>
  );
}

function Clock() {
  useFrame(({ clock }) => {
    if (!getState().reducedMotion) lifeTime.value = clock.elapsedTime;
  });
  return null;
}

export default function Life() {
  return (
    <>
      <Clock />
      <Fountain />
      <Birds />
      <Walkers />
      <Flag />
      <Weathervane />
      <BasinWater />
    </>
  );
}
