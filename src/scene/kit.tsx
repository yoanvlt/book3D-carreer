/**
 * Éléments d'architecture réutilisables : menuiseries, acrotères, auvents, appliques, garde-corps.
 * Toutes les pièces partagent les matériaux de Primitives ; la phase de regroupement
 * (StaticBatch) les fusionne ensuite par matériau pour limiter les draw calls.
 */
import { RoundedBox } from '@react-three/drei';
import { color as C } from '../design/tokens';
import { Ball, Box, Cylinder, GLASS, material, type Finish, type V3 } from './Primitives';

/** Volume aux arêtes adoucies. */
export function Bevel({
  p,
  s,
  color,
  radius = 0.18,
  r = [0, 0, 0],
  finish,
}: {
  p: V3;
  s: V3;
  color: string;
  radius?: number;
  r?: V3;
  finish?: Finish;
}) {
  return (
    <RoundedBox
      position={p}
      rotation={r}
      args={s}
      radius={Math.min(radius, ...s.map((v) => v / 2 - 0.001))}
      smoothness={2}
      material={material(color, finish)}
      castShadow
      receiveShadow
    />
  );
}

/**
 * Fenêtres en grille sur un plan vertical : vitrages, meneaux, traverses et appui.
 * Dessinées dans le plan XY, face à +Z ; la position et la rotation placent la façade.
 */
export function Windows({
  p,
  r = [0, 0, 0],
  w,
  h,
  cols = 1,
  rows = 1,
  frame = C.white,
  glass = C.glass,
  bar = 0.12,
  sill = true,
  lit = [],
}: {
  p: V3;
  r?: V3;
  w: number;
  h: number;
  cols?: number;
  rows?: number;
  frame?: string;
  glass?: string;
  bar?: number;
  sill?: boolean;
  /** Indices (ligne * cols + colonne) des carreaux éclairés. */
  lit?: number[];
}) {
  const cw = w / cols;
  const rh = h / rows;
  const panes = [];
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const on = lit.includes(i);
      panes.push(
        <Box
          key={i}
          p={[-w / 2 + cw * (col + 0.5), -h / 2 + rh * (row + 0.5), -0.02]}
          s={[cw - bar, rh - bar, 0.06]}
          color={on ? C.glassLit : glass}
          finish={on ? { rough: 0.4, glow: C.glassLit, glowIntensity: 0.55 } : GLASS}
          shadow={false}
        />,
      );
    }
  return (
    <group position={p} rotation={r}>
      {panes}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <Box
          key={'v' + i}
          p={[-w / 2 + cw * i, 0, 0.03]}
          s={[bar, h + bar, 0.14]}
          color={frame}
          shadow={false}
        />
      ))}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Box
          key={'h' + i}
          p={[0, -h / 2 + rh * i, 0.03]}
          s={[w + bar, bar, 0.14]}
          color={frame}
          shadow={false}
        />
      ))}
      {sill && <Box p={[0, -h / 2 - bar, 0.12]} s={[w + 0.3, 0.1, 0.3]} color={frame} />}
    </group>
  );
}

/** Auvent incliné avec lambrequin rayé, au-dessus d'une ouverture. */
export function Awning({
  p,
  w,
  d = 1.4,
  color,
  stripe = C.white,
}: {
  p: V3;
  w: number;
  d?: number;
  color: string;
  stripe?: string;
}) {
  const stripes = Math.max(3, Math.round(w / 0.5));
  return (
    <group position={p}>
      <Box p={[0, 0, d / 2]} s={[w, 0.12, d]} r={[0.32, 0, 0]} color={color} />
      {Array.from({ length: stripes }, (_, i) => (
        <Box
          key={i}
          p={[-w / 2 + (w / stripes) * (i + 0.5), -0.48, d - 0.02]}
          s={[w / stripes, 0.36, 0.06]}
          color={i % 2 ? stripe : color}
          shadow={false}
        />
      ))}
    </group>
  );
}

/** Applique murale allumée. */
export function WallLamp({ p, r = [0, 0, 0] }: { p: V3; r?: V3 }) {
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, 0.08]} s={[0.22, 0.42, 0.16]} color={C.ink} shadow={false} />
      <Box
        p={[0, -0.02, 0.2]}
        s={[0.16, 0.3, 0.1]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.4 }}
        shadow={false}
      />
    </group>
  );
}

/** Garde-corps : lisse et montants. */
export function Railing({
  a,
  b,
  h = 0.9,
  posts = 6,
  color = C.white,
}: {
  a: V3;
  b: V3;
  h?: number;
  posts?: number;
  color?: string;
}) {
  const dx = b[0] - a[0];
  const dz = b[2] - a[2];
  const length = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, dz);
  return (
    <group position={a} rotation={[0, angle, 0]}>
      <Box p={[0, h, length / 2]} s={[0.07, 0.07, length]} color={color} shadow={false} />
      {Array.from({ length: posts }, (_, i) => (
        <Box
          key={i}
          p={[0, h / 2, (length * i) / (posts - 1)]}
          s={[0.05, h, 0.05]}
          color={color}
          shadow={false}
        />
      ))}
    </group>
  );
}

/** Climatiseur de toiture. */
export function RoofUnit({ p, s = [1.6, 0.8, 1.1] }: { p: V3; s?: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, s[1] / 2, 0]} s={s} color={C.concrete} />
      <Cylinder p={[0, s[1] + 0.03, 0]} s={[s[2] * 0.32, 0.06, s[2] * 0.32]} color={C.slate} shadow={false} />
    </group>
  );
}

/** Panneau solaire incliné. */
export function SolarPanel({ p, w = 2.2, d = 1.3, r = 0 }: { p: V3; w?: number; d?: number; r?: number }) {
  return (
    <group position={p} rotation={[0, r, 0]}>
      <Box p={[0, 0.35, 0]} s={[w, 0.08, d]} r={[-0.42, 0, 0]} color={C.blueDeep} finish={GLASS} />
      <Box p={[0, 0.15, -0.3]} s={[0.1, 0.4, 0.1]} color={C.metal} shadow={false} />
    </group>
  );
}

/** Jardinière plantée : bac et touffes arrondies. */
export function Planter({ p, w = 1.6, color = C.stoneDark }: { p: V3; w?: number; color?: string }) {
  const count = Math.max(2, Math.round(w / 0.55));
  return (
    <group position={p}>
      <Box p={[0, 0.3, 0]} s={[w, 0.6, 0.7]} color={color} />
      <Box p={[0, 0.61, 0]} s={[w - 0.12, 0.04, 0.58]} color={C.woodDark} shadow={false} />
      {Array.from({ length: count }, (_, i) => (
        <Ball
          key={i}
          p={[-w / 2 + (w / count) * (i + 0.5), 0.78 + (i % 2) * 0.06, i % 2 ? 0.08 : -0.06]}
          s={[0.3, 0.28 + (i % 2) * 0.08, 0.28]}
          color={i % 3 === 1 ? C.flower : i % 3 === 2 ? C.leafDark : C.leaf}
        />
      ))}
    </group>
  );
}
