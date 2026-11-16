/**
 * Effets du robot (V8) : bouffées (poussière des pas et de l'atterrissage, fumée des
 * propulseurs, traînée de vol), repère du « toucher pour aller », ombre douce au sol et îlot
 * d'accueil (rocher, herbe, balise lumineuse) qui donne une échelle crédible face à l'île.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { color as C } from '../../design/tokens';
import { getState, journey, marker, player } from '../../state';
import { heightAt } from '../../world/terrain';
import { Builder } from '../../geometry/mesh';
import { box, cylinder, dome } from '../../geometry/shapes';
import { staticMesh } from '../diorama/geometry';
import { material } from '../Primitives';

const PUFFS = 48;
type Puff = { x: number; y: number; z: number; age: number; size: number; life: number; rise: number };
const queue: (Puff & { color: string })[] = [];
/** Ajoute une bouffée : position, taille, durée de vie, couleur, montée. */
export function puff(
  x: number,
  y: number,
  z: number,
  size: number,
  o: { life?: number; color?: string; rise?: number } = {},
) {
  queue.push({
    x,
    y,
    z,
    size,
    age: 0,
    life: o.life ?? 0.55,
    rise: o.rise ?? 0.35,
    color: o.color ?? C.stone,
  });
}
/** Anneau de poussière à l'atterrissage. */
export function dustRing(x: number, y: number, z: number) {
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    puff(x + Math.cos(a) * 0.7, y + 0.08, z + Math.sin(a) * 0.7, 0.34, { life: 0.7, rise: 0.15 });
  }
}

export function Puffs() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const puffs = useRef<Puff[]>(
    Array.from({ length: PUFFS }, () => ({ x: 0, y: -100, z: 0, age: 1, size: 0, life: 1, rise: 0 })),
  );
  const state = useRef({ next: 0, step: 0, airborne: false });
  const o = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = getState();
    const r = state.current;
    if (!s.reducedMotion && s.phase !== 'home') {
      // Poussière des pas rapides et de la réception d'un saut.
      const step = Math.floor(clock.elapsedTime * Math.max(1, player.speed) * 0.8);
      const back = (k: number) => [
        player.x - Math.sin(player.angle) * k,
        player.z - Math.cos(player.angle) * k,
      ];
      if (player.speed > 5 && player.jump.height === 0 && step !== r.step) {
        const [x, z] = back(0.35);
        puff(x + (Math.random() - 0.5) * 0.3, player.y + 0.12, z + (Math.random() - 0.5) * 0.3, 0.22);
      }
      r.step = step;
      const airborne = player.jump.height > 0;
      if (r.airborne && !airborne)
        for (let i = 0; i < 3; i++) puff(player.x + (i - 1) * 0.3, player.y + 0.1, player.z, 0.32);
      r.airborne = airborne;
    }
    while (queue.length) {
      const q = queue.shift()!;
      const i = r.next;
      r.next = (r.next + 1) % PUFFS;
      Object.assign(puffs.current[i], q);
      mesh.current.setColorAt(i, color.set(q.color));
      if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    }
    puffs.current.forEach((p, i) => {
      p.age = Math.min(1, p.age + dt / p.life);
      const k = p.age >= 1 ? 0 : Math.sin(p.age * Math.PI) * p.size * (1 + p.age);
      o.position.set(p.x, p.y + p.age * p.rise, p.z);
      o.scale.setScalar(Math.max(0.0001, k));
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, material('#ffffff', { rough: 1 }), PUFFS]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 1]} />
    </instancedMesh>
  );
}

/** Repère au sol du « toucher pour aller », visible pendant la marche. */
export function TapMarker() {
  const ring = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = getState();
    const p = marker.point;
    const show = !!p && s.phase === 'travel' && !journey.destination;
    ring.current.visible = show;
    if (!show) return;
    ring.current.position.set(p[0], (s.interior ? 0 : heightAt(p[0], p[1])) + 0.08, p[1]);
    ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 6) * 0.08);
  });
  return (
    <mesh
      ref={ring}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
      material={material(C.white, { glow: C.white, glowIntensity: 0.6 })}
    >
      <ringGeometry args={[0.45, 0.65, 32]} />
    </mesh>
  );
}

/** Texture d'ombre douce (disque flou), partagée. */
const shadowTexture = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  grad.addColorStop(0, 'rgba(30,40,40,0.55)');
  grad.addColorStop(1, 'rgba(30,40,40,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

/** Ombre douce sous le robot : posée au sol (ou sur l'îlot), plus pâle et plus large en l'air. */
export function SoftShadow({ target }: { target: React.RefObject<THREE.Group> }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const t = target.current;
    if (!t) return;
    const s = getState();
    const ground = s.interior
      ? 0
      : s.phase === 'explore' || s.phase === 'travel'
        ? heightAt(t.position.x, t.position.z)
        : t.position.y - (player.jump.height || 0);
    const lift = Math.max(0, t.position.y - ground);
    mesh.current.position.set(t.position.x, ground + 0.06, t.position.z);
    mesh.current.scale.setScalar(1.6 + lift * 0.12);
    (mesh.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - lift / 8);
    mesh.current.visible = lift < 8;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
    </mesh>
  );
}

/**
 * Îlot d'accueil : pointe rocheuse, strates, dessus d'herbe, buisson, balise lumineuse. Lumière
 * simple : plein soleil, plus sombre vers la pointe (même matière que le monde).
 */
export function useIslet() {
  return useMemo(() => {
    const b = new Builder();
    cylinder(b, 0, -2.8, 0, 0.3, 1.8, 'roche-profonde', { r1: 1.55, segments: 14, cap: false });
    cylinder(b, 0, -1.0, 0, 1.55, 0.68, 'strate', { r1: 1.95, segments: 14, cap: false });
    cylinder(b, 0, -0.32, 0, 1.95, 0.32, 'herbe', { r1: 2.0, segments: 14 });
    dome(b, 1.15, -0.02, -0.75, 0.38, 'roche-claire', { segments: 8, height: 0.8 });
    cylinder(b, -1.3, 0, -0.6, 0.08, 1.3, 'metal-sombre', { segments: 6 });
    box(b, -1.3, 1.3, -0.6, 0.32, 0.32, 0.32, 'lumiere', { bevel: 0.07 });
    dome(b, 1.2, 0, 0.75, 0.42, 'feuillage', { segments: 8, height: 0.9 });
    const data = b.finish();
    const light = new Float32Array((data.positions.length / 3) * 2);
    for (let i = 0; i < light.length / 2; i++) {
      const y = data.positions[i * 3 + 1];
      light[i * 2] = 1;
      light[i * 2 + 1] = 0.55 + 0.45 * Math.max(0, Math.min(1, (y + 2.8) / 2.8));
    }
    return staticMesh(data, 'baked', light);
  }, []);
}
