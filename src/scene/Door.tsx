/**
 * Portes d'entrée des bâtiments (V7) : une porte encastrée dans la façade, déclinée par lieu.
 * L'embrasure (piédroits, linteau) est du matériau du mur ; le seuil est en pierre ; les vantaux
 * s'ouvrent selon leur type (coulissants, battants, sectionnels, rideau métallique) en suivant
 * passage.openness, la même valeur côté rue et côté salle.
 *
 * Chaque vantail est un seul maillage (pièces fusionnées, couleurs par sommet) : deux draw calls
 * par porte au plus, sans ombre portée.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { color as C } from '../design/tokens';
import { getState, passage } from '../state';
import type { BuildingId } from '../world/config';
import { FINISH, type Finish } from './Primitives';

type DoorStyle = 'glass' | 'wood' | 'workshop' | 'porthole' | 'gallery' | 'shutter';

interface DoorSpec {
  style: DoorStyle;
  /** Mur autour de la porte : couleur et matière de l'embrasure et du linteau. */
  wall: string;
  finish?: Finish;
  /** Couleur des vantaux (ou de leur cadre). */
  leaf: string;
  /** Linteau d'une autre matière (pierre, acier) ; sinon celle du mur. */
  lintel?: string;
}

/** Ouverture commune : le robot passe sans frôler. */
const OPENING = { w: 2.7, h: 3.3 };

const DOORS: Record<BuildingId, DoorSpec> = {
  profile: { style: 'wood', wall: '#f6f1e8', finish: FINISH.render, leaf: '#7a4a2c', lintel: '#d9cdb8' },
  'project-1': { style: 'glass', wall: '#2f3b45', finish: FINISH.steel, leaf: '#2f3b45' },
  'project-2': {
    style: 'workshop',
    wall: '#b5603f',
    finish: FINISH.brick,
    leaf: '#e8ad45',
    lintel: '#2f3b45',
  },
  'project-3': {
    style: 'porthole',
    wall: '#5d4fa3',
    finish: FINISH.render,
    leaf: '#3a3170',
    lintel: '#f4f2fb',
  },
  missions: { style: 'gallery', wall: '#efe8da', finish: FINISH.stone, leaf: '#2a6f62' },
  veolia: { style: 'shutter', wall: '#f4f2ec', finish: FINISH.concrete, leaf: '#c9cfd3', lintel: '#d64a3f' },
};

type Part = { p: [number, number, number]; s: [number, number, number]; color: string };
/** Fusionne des pavés colorés en un seul maillage (un vantail). */
function leafGeometry(parts: Part[]) {
  const c = new THREE.Color();
  const geometry = mergeGeometries(
    parts.map(({ p, s, color }) => {
      const g = new THREE.BoxGeometry(...s).toNonIndexed();
      g.translate(...p);
      c.set(color).convertSRGBToLinear();
      const colors = new Float32Array(g.attributes.position.count * 3);
      for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i);
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return g;
    }),
  )!;
  geometry.computeBoundingSphere();
  return geometry;
}

/** Pièces d'un vantail gauche (x de 0 à -largeur), dessinées porte fermée. */
function leafParts(style: DoorStyle, spec: DoorSpec, w: number, h: number): Part[] {
  const frame = spec.leaf;
  const glass = C.glass;
  const metal = C.metal;
  switch (style) {
    case 'glass':
      return [
        { p: [-w / 2, h / 2, 0], s: [w - 0.04, h - 0.06, 0.04], color: '#9fd3e6' },
        { p: [-w / 2, 0.06, 0], s: [w, 0.12, 0.07], color: frame },
        { p: [-w / 2, h - 0.04, 0], s: [w, 0.08, 0.07], color: frame },
        { p: [-0.12, h * 0.48, 0.06], s: [0.04, 1.1, 0.04], color: metal },
      ];
    case 'wood':
      return [
        { p: [-w / 2, h / 2, 0], s: [w, h, 0.09], color: frame },
        // Panneaux moulurés et oculus vitré
        { p: [-w / 2, h * 0.28, 0.05], s: [w * 0.66, h * 0.32, 0.03], color: '#8c5a36' },
        { p: [-w / 2, h * 0.72, 0.05], s: [w * 0.66, h * 0.36, 0.02], color: glass },
        { p: [-0.16, h * 0.47, 0.07], s: [0.05, 0.3, 0.05], color: '#c9a35a' },
      ];
    case 'porthole':
      return [
        { p: [-w / 2, h / 2, 0], s: [w, h, 0.08], color: frame },
        { p: [-w / 2, h * 0.68, 0.045], s: [0.55, 0.55, 0.02], color: glass },
        { p: [-w / 2, h * 0.68, 0.05], s: [0.7, 0.07, 0.03], color: '#f4f2fb' },
        { p: [-w / 2, h * 0.68, 0.05], s: [0.07, 0.7, 0.03], color: '#f4f2fb' },
        { p: [-w / 2, 0.25, 0.05], s: [w * 0.9, 0.3, 0.02], color: metal },
        { p: [-0.14, h * 0.45, 0.07], s: [0.05, 0.4, 0.05], color: metal },
      ];
    case 'gallery':
      return [
        { p: [-w / 2, h / 2, 0], s: [w - 0.1, h - 0.1, 0.03], color: glass },
        { p: [-0.04, h / 2, 0], s: [0.08, h, 0.08], color: frame },
        { p: [-w + 0.04, h / 2, 0], s: [0.08, h, 0.08], color: frame },
        { p: [-w / 2, h - 0.04, 0], s: [w, 0.08, 0.08], color: frame },
        { p: [-w / 2, 0.3, 0], s: [w, 0.6, 0.08], color: frame },
        { p: [-w / 2, h * 0.62, 0.01], s: [w, 0.06, 0.06], color: frame },
        { p: [-0.18, h * 0.45, 0.07], s: [0.05, 0.5, 0.05], color: '#c9a35a' },
      ];
    case 'workshop':
      // Porte sectionnelle d'atelier : panneaux horizontaux et hublots (un seul tablier, w = ouverture).
      return [
        ...Array.from({ length: 5 }, (_, i): Part => ({
          p: [-w / 2, 0.33 + i * 0.66, 0],
          s: [w, 0.62, 0.07],
          color: spec.leaf,
        })),
        ...[-0.75, -0.25, 0.25, 0.75].map((x): Part => ({
          p: [-w / 2 + x * w * 0.5, 2.3, 0.04],
          s: [w * 0.18, 0.28, 0.02],
          color: glass,
        })),
        { p: [-w / 2, 0.85, 0.05], s: [0.3, 0.06, 0.04], color: C.ink },
      ];
    case 'shutter':
      // Rideau métallique à lames.
      return [
        ...Array.from({ length: 16 }, (_, i): Part => ({
          p: [-w / 2, 0.1 + i * 0.205, 0],
          s: [w, 0.19, 0.05],
          color: i % 2 ? spec.leaf : '#b8bfc4',
        })),
        { p: [-w / 2, 0.06, 0.04], s: [w, 0.12, 0.06], color: C.ink },
      ];
  }
}

const SINGLE: DoorStyle[] = ['workshop', 'shutter'];

/** Vantaux animés d'une porte (côté rue ou côté salle). */
export function DoorLeaves({ id }: { id: BuildingId }) {
  const spec = DOORS[id];
  const { w, h } = OPENING;
  const single = SINGLE.includes(spec.style);
  const geometry = useMemo(
    () => leafGeometry(leafParts(spec.style, spec, single ? w : w / 2, h)),
    [spec, single, w, h],
  );
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.1 }),
    [],
  );
  const left = useRef<THREE.Group>(null!);
  const right = useRef<THREE.Group>(null!);
  useFrame(() => {
    const open = getState().door === id ? passage.openness : 0;
    if (single) {
      // Tablier qui remonte dans l'épaisseur du linteau.
      left.current.position.y = open * (h - 0.25);
      return;
    }
    if (spec.style === 'glass') {
      left.current.position.x = -open * (w / 2 - 0.1);
      right.current.position.x = open * (w / 2 - 0.1);
    } else {
      // Battants : rotation autour des gonds, vers l'intérieur.
      left.current.rotation.y = open * 1.5;
      right.current.rotation.y = -open * 1.5;
    }
  });
  return (
    <group userData={{ dynamic: true }}>
      <group ref={left} position={[single ? w / 2 : spec.style === 'glass' ? 0 : -w / 2, 0, 0]}>
        <mesh
          geometry={geometry}
          material={material}
          position={[spec.style === 'glass' || single ? 0 : w / 2, 0, 0]}
        />
      </group>
      {!single && (
        <group ref={right} position={[spec.style === 'glass' ? 0 : w / 2, 0, 0]} scale={[-1, 1, 1]}>
          <mesh
            geometry={geometry}
            material={material}
            position={[spec.style === 'glass' ? 0 : w / 2, 0, 0]}
          />
        </group>
      )}
    </group>
  );
}
