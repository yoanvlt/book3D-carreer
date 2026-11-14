import { useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { color as C, typography } from '../design/tokens';

export type V3 = [number, number, number];

/** Réglages de matière. Les matériaux identiques sont partagés par toute la scène. */
export interface Finish {
  rough?: number;
  metal?: number;
  /** Couleur émise (fenêtres éclairées, lampes). */
  glow?: string;
  glowIntensity?: number;
  side?: THREE.Side;
}
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, finish: Finish = {}) {
  const { rough = 0.78, metal = 0, glow, glowIntensity = 1, side = THREE.FrontSide } = finish;
  const key = [color, rough, metal, glow, glowIntensity, side].join('|');
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, side });
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
export const MATTE: Finish = { rough: 0.92 };

const cube = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 18);
const ball = new THREE.IcosahedronGeometry(1, 1);
const cone = new THREE.ConeGeometry(1, 1, 18);

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

/** Demi-cylindre ouvert aux deux extrémités (voûte). */
const vaults = new Map<string, THREE.BufferGeometry>();
export function Vault({ p, s, color = C.orange }: { p: V3; s: V3; color?: string }) {
  const key = s.join(',');
  let geometry = vaults.get(key);
  if (!geometry) {
    geometry = new THREE.CylinderGeometry(s[0], s[0], s[2], 28, 1, true, Math.PI / 2, Math.PI);
    vaults.set(key, geometry);
  }
  return (
    <mesh
      position={p}
      rotation={[Math.PI / 2, 0, 0]}
      geometry={geometry}
      material={material(color, { side: THREE.DoubleSide })}
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
