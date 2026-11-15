import { useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { color as C, typography } from '../design/tokens';
import type { Pattern } from './surface';

export type V3 = [number, number, number];

/** Réglages de matière. Les matériaux identiques sont partagés par toute la scène. */
export interface Finish {
  rough?: number;
  metal?: number;
  /** Couleur émise (fenêtres éclairées, lampes). */
  glow?: string;
  glowIntensity?: number;
  side?: THREE.Side;
  /** Matière procédurale (surface.ts), visible une fois les pièces regroupées par StaticBatch. */
  pattern?: Pattern;
  /** Échelle du motif : 2 = motif deux fois plus fin. */
  scale?: number;
  /** Verre clair : opacité (0 à 1). Matériau transparent, jamais regroupé (une vitrine par draw call). */
  clear?: number;
}
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, finish: Finish = {}) {
  const {
    rough = 0.78,
    metal = 0,
    glow,
    glowIntensity = 1,
    side = THREE.FrontSide,
    pattern = 'none',
    scale = 1,
    clear,
  } = finish;
  const key = [color, rough, metal, glow, glowIntensity, side, pattern, scale, clear].join('|');
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side });
    m.userData.pattern = pattern;
    m.userData.scale = scale;
    if (clear !== undefined) {
      m.transparent = true;
      m.opacity = clear;
      m.depthWrite = false;
      m.userData.baseOpacity = clear;
    }
    if (glow) {
      m.emissive.set(glow);
      m.emissiveIntensity = glowIntensity;
    }
    materials.set(key, m);
  }
  return m;
}
/** Verre : légèrement réfléchissant, jamais transparent (pas de tri coûteux). */
export const GLASS: Finish = { rough: 0.18, metal: 0.25 };
export const METAL: Finish = { rough: 0.35, metal: 0.55 };
/**
 * Finitions par matière : rugosité propre à chaque matière et motif procédural (surface.ts).
 * Une fois regroupées, toutes partagent un seul matériau : varier les matières ne coûte aucun draw call.
 */
export const FINISH = {
  glass: GLASS,
  /** Vitrage transparent (vitrines) : on voit ce qui est derrière. */
  clearGlass: { rough: 0.1, metal: 0.1, clear: 0.28 },
  metal: METAL,
  steel: { rough: 0.45, metal: 0.4 },
  paint: { rough: 0.6 },
  plastic: { rough: 0.45 },
  brick: { rough: 0.92, pattern: 'brick' },
  wood: { rough: 0.72, pattern: 'planks' },
  cladding: { rough: 0.42, metal: 0.2, pattern: 'cladding' },
  concrete: { rough: 0.88, pattern: 'panels' },
  render: { rough: 0.94, pattern: 'render' },
  tiles: { rough: 0.78, pattern: 'tiles' },
  paving: { rough: 0.9, pattern: 'paving' },
  gravel: { rough: 1, pattern: 'gravel' },
  cobbles: { rough: 0.9, pattern: 'cobbles' },
  parquet: { rough: 0.55, pattern: 'parquet' },
  slats: { rough: 0.6, pattern: 'slats' },
  stone: { rough: 0.95, pattern: 'stone' },
  fabric: { rough: 1 },
} satisfies Record<string, Finish>;

const cube = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 18);
const ball = new THREE.IcosahedronGeometry(1, 1);
const cone = new THREE.ConeGeometry(1, 1, 18);
const tube = new THREE.CylinderGeometry(1, 1, 1, 10);
const halfBall = new THREE.SphereGeometry(1, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2);
/** Prisme triangulaire : pignon (triangle isocèle, base 1 en x, sommet à y = 1), profondeur 1 en z. */
function prism(shape: [number, number][]) {
  const s = new THREE.Shape(shape.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}
const gable = prism([
  [-0.5, 0],
  [0.5, 0],
  [0, 1],
]);
/** Rampe : triangle rectangle, hauteur nulle en x = -0,5 et 1 en x = 0,5. */
const ramp = prism([
  [-0.5, 0],
  [0.5, 0],
  [0.5, 1],
]);

interface PrimitiveProps {
  p?: V3;
  s?: V3;
  r?: V3;
  color?: string;
  finish?: Finish;
  shadow?: boolean;
  children?: ReactNode;
}
function primitive(geometry: THREE.BufferGeometry) {
  return function Primitive({
    p = [0, 0, 0],
    s = [1, 1, 1],
    r = [0, 0, 0],
    color = C.cream,
    finish,
    shadow = true,
    children,
  }: PrimitiveProps) {
    return (
      <mesh
        position={p}
        scale={s}
        rotation={r}
        geometry={geometry}
        material={material(color, finish)}
        castShadow={shadow}
        receiveShadow
        dispose={null}
      >
        {children}
      </mesh>
    );
  };
}
export const Box = primitive(cube);
export const Cylinder = primitive(cylinder);
export const Ball = primitive(ball);
export const Cone = primitive(cone);
/** Cylindre à 10 pans pour les petites pièces (tuyaux, montants). */
export const Rod = primitive(tube);
export const Dome = primitive(halfBall);
export const Gable = primitive(gable);
export const Ramp = primitive(ramp);

/** Tore (ou arc de tore) partagé par rayon, section et angle. */
const tori = new Map<string, THREE.BufferGeometry>();
export function Torus({
  p = [0, 0, 0],
  r = [0, 0, 0],
  radius,
  tube: t,
  arc = Math.PI * 2,
  segments = 32,
  color = C.cream,
  finish,
}: {
  p?: V3;
  r?: V3;
  radius: number;
  tube: number;
  arc?: number;
  segments?: number;
  color?: string;
  finish?: Finish;
}) {
  const key = [radius, t, arc, segments].join(',');
  let geometry = tori.get(key);
  if (!geometry) {
    geometry = new THREE.TorusGeometry(radius, t, 6, segments, arc);
    tori.set(key, geometry);
  }
  return (
    <mesh
      position={p}
      rotation={r}
      geometry={geometry}
      material={material(color, finish)}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

/** Tuyau (cylindre) entre deux points. */
export function Pipe({
  a,
  b,
  radius = 0.12,
  color = C.metal,
  finish,
  shadow = true,
}: {
  a: V3;
  b: V3;
  radius?: number;
  color?: string;
  finish?: Finish;
  shadow?: boolean;
}) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize(),
  );
  return (
    <mesh
      position={start.clone().add(end).multiplyScalar(0.5)}
      quaternion={q}
      geometry={tube}
      scale={[radius, start.distanceTo(end), radius]}
      material={material(color, finish)}
      castShadow={shadow}
      receiveShadow
      dispose={null}
    />
  );
}

/** Poutre entre deux points. */
export function Beam({
  a,
  b,
  width = 0.13,
  color = C.cream,
  finish,
}: {
  a: V3;
  b: V3;
  width?: number;
  color?: string;
  finish?: Finish;
}) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    end.clone().sub(start).normalize(),
  );
  return (
    <mesh
      position={mid}
      quaternion={q}
      geometry={cube}
      scale={[width, start.distanceTo(end), width]}
      material={material(color, finish)}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

/**
 * Panneau texte dessiné sur canvas dans la police de l'interface.
 * Le texte est ajusté à la largeur du panneau ; la texture est filtrée (mipmaps, anisotropie)
 * pour rester nette de loin. Le panneau émet un peu de lumière pour rester lisible à l'ombre.
 */
export function Sign({
  text,
  p,
  s = [4, 1],
  color = C.ink,
  bg = C.cream,
  rotation = [0, 0, 0],
  weight = typography.weight.bold,
  rounded = true,
  align = 'center',
}: {
  text: string;
  p: V3;
  s?: [number, number];
  color?: string;
  /** 'transparent' pour un texte sans fond. */
  bg?: string;
  rotation?: V3;
  weight?: number;
  rounded?: boolean;
  align?: 'center' | 'left';
}) {
  const [width, height] = s;
  const texture = useMemo(() => {
    const scale = Math.min(2048 / width, 512 / height, 320);
    const c = document.createElement('canvas');
    c.width = Math.round(width * scale);
    c.height = Math.round(height * scale);
    const ctx = c.getContext('2d')!;
    if (bg !== 'transparent') {
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(0, 0, c.width, c.height, rounded ? Math.min(c.height * 0.22, 48) : 0);
      ctx.fill();
    }
    const padding = c.height * 0.28;
    let size = c.height * 0.56;
    const font = () => `${weight} ${size}px ${typography.family}`;
    ctx.font = font();
    while (ctx.measureText(text).width > c.width - padding * 2 && size > 8) {
      size *= 0.94;
      ctx.font = font();
    }
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, align === 'center' ? c.width / 2 : padding, c.height * 0.54);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.generateMipmaps = true;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, [text, color, bg, width, height, weight, rounded, align]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={p} rotation={rotation}>
      <planeGeometry args={s} />
      <meshStandardMaterial
        map={texture}
        emissiveMap={texture}
        emissive='#ffffff'
        emissiveIntensity={0.42}
        roughness={0.85}
        alphaTest={0.5}
        transparent={bg === 'transparent'}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/** n éléments produits par fn(i, n) : pour répartir des pièces régulièrement. */
export function times<T>(n: number, fn: (i: number, n: number) => T): T[] {
  return Array.from({ length: n }, (_, i) => fn(i, n));
}
