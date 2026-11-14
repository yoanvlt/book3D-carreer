import { useMemo, useEffect, type ReactNode } from 'react';
import * as THREE from 'three';
import { COLORS } from '../world/config';
import { remapHex, theme } from '../theme';
type V3 = [number, number, number];
const materials = new Map<string, THREE.MeshStandardMaterial>();
export function material(color: string, metalness = 0) {
  const key = color + metalness;
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: metalness ? 0.32 : 0.78, metalness });
    materials.set(key, m);
  }
  return m;
}
const cube = new THREE.BoxGeometry(1, 1, 1),
  cylinder = new THREE.CylinderGeometry(1, 1, 1, 16),
  ball = new THREE.IcosahedronGeometry(1, 1);
export function Box({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = COLORS.cream,
  r = [0, 0, 0],
  metal = 0,
  children,
}: {
  p?: V3;
  s?: V3;
  color?: string;
  r?: V3;
  metal?: number;
  children?: ReactNode;
}) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={r}
      geometry={cube}
      material={material(color, metal)}
      castShadow
      receiveShadow
      dispose={null}
    >
      {children}
    </mesh>
  );
}
export function Cylinder({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = COLORS.cream,
  r = [0, 0, 0],
}: {
  p?: V3;
  s?: V3;
  color?: string;
  r?: V3;
}) {
  return (
    <mesh
      position={p}
      scale={s}
      rotation={r}
      geometry={cylinder}
      material={material(color)}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}
export function Ball({
  p = [0, 0, 0],
  s = [1, 1, 1],
  color = COLORS.coral,
}: {
  p?: V3;
  s?: V3;
  color?: string;
}) {
  return (
    <mesh
      position={p}
      scale={s}
      geometry={ball}
      material={material(color)}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}
export function Sign({
  text,
  p,
  s = [4, 1],
  color = COLORS.ink,
  bg = COLORS.cream,
  rotation = [0, 0, 0],
}: {
  text: string;
  p: V3;
  s?: [number, number];
  color?: string;
  bg?: string;
  rotation?: V3;
}) {
  const [width, height] = s;
  const texture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round((1024 * height) / width);
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = remapHex(bg);
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = remapHex(color);
    ctx.font = `${theme.id === 'current' ? '600' : '700'} ${Math.min(c.height * 0.58, c.width / (text.length * 0.65))}px ${({ current: 'Arial', a: '"Bricolage Grotesque Variable", Arial', b: '"Instrument Serif", Georgia', c: '"JetBrains Mono Variable", monospace' } as Record<string, string>)[theme.id]}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, c.width / 2, c.height * 0.53);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, color, bg, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={p} rotation={rotation}>
      <planeGeometry args={s} />
      <meshStandardMaterial map={texture} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}
export function Beam({
  a,
  b,
  width = 0.13,
  color = COLORS.cream,
}: {
  a: V3;
  b: V3;
  width?: number;
  color?: string;
}) {
  const start = new THREE.Vector3(...a),
    end = new THREE.Vector3(...b),
    mid = start.clone().add(end).multiplyScalar(0.5),
    q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize(),
    );
  return (
    <mesh
      position={mid}
      quaternion={q}
      geometry={cube}
      scale={[width, start.distanceTo(end), width]}
      material={material(color)}
      castShadow
      dispose={null}
    />
  );
}
/** Half cylinder barrel vault, open at both ends. */
export function Vault({ p, s, color = COLORS.coral }: { p: V3; s: V3; color?: string }) {
  return (
    <mesh position={p} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[s[0], s[0], s[2], 20, 1, true, Math.PI / 2, Math.PI]} />
      <meshStandardMaterial color={color} roughness={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}
