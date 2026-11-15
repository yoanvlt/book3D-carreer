import { RoundedBox } from '@react-three/drei';
import { Ball, Box, Cylinder, FINISH, GLASS, material, type Finish, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';
import { color as C } from '../../design/tokens';
import { ROOM } from '../../world/narrative';

/** Dimensions de la salle (narrative.ts) et mobilier commun aux intérieurs. */
export const W = ROOM.halfWidth;
export const D = ROOM.halfDepth;
export const WALL_H = 7.6;

export function Plant({ p, scale = 1, pot }: { p: [number, number]; scale?: number; pot: string }) {
  return (
    <group position={[p[0], 0, p[1]]} scale={scale}>
      <Cylinder p={[0, 0.45, 0]} s={[0.6, 0.9, 0.6]} color={pot} />
      <Cylinder p={[0, 0.92, 0]} s={[0.66, 0.08, 0.66]} color={C.woodDark} />
      <Ball p={[0, 1.6, 0]} s={[0.75, 0.85, 0.75]} color={C.leaf} />
      <Ball p={[0.35, 1.3, 0.2]} s={[0.5, 0.55, 0.5]} color={C.leafDark} />
      <Ball p={[-0.3, 1.35, -0.2]} s={[0.5, 0.6, 0.5]} color={C.leaf} />
      <Ball p={[0.05, 2.2, 0.05]} s={[0.4, 0.45, 0.4]} color={C.leafDark} />
    </group>
  );
}

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

const litFinish = (on: boolean): Finish =>
  on ? { rough: 0.4, glow: C.glassLit, glowIntensity: 0.55 } : GLASS;

/**
 * Mur-rideau en grille sur un plan vertical : vitrages, meneaux, traverses et appui.
 * Dessiné dans le plan XY, face à +Z ; la position et la rotation placent la façade.
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
          finish={litFinish(on)}
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

/** Jardinière plantée : bac à rebord, terre, touffes et fleurs. */
export function Planter({ p, w = 1.6, color = C.stoneDark }: { p: V3; w?: number; color?: string }) {
  const count = Math.max(2, Math.round(w / 0.45));
  return (
    <group position={p}>
      <Box p={[0, 0.3, 0]} s={[w, 0.6, 0.7]} color={color} finish={FINISH.concrete} />
      <Box p={[0, 0.62, 0]} s={[w + 0.08, 0.06, 0.78]} color={color} finish={FINISH.paint} />
      <Box
        p={[0, 0.6, 0]}
        s={[w - 0.14, 0.04, 0.56]}
        color={C.woodDark}
        finish={FINISH.gravel}
        shadow={false}
      />
      {Array.from({ length: count }, (_, i) => (
        <Ball
          key={i}
          p={[-w / 2 + (w / count) * (i + 0.5), 0.8 + (i % 2) * 0.06, i % 2 ? 0.08 : -0.06]}
          s={[0.26, 0.24 + (i % 2) * 0.08, 0.24]}
          color={i % 3 === 1 ? C.leaf : C.leafDark}
        />
      ))}
      <Fine>
        {Array.from({ length: count * 2 }, (_, i) => (
          <Ball
            key={i}
            p={[
              -w / 2 + 0.15 + ((w - 0.3) * i) / (count * 2 - 1),
              0.98 + (i % 3) * 0.05,
              i % 2 ? -0.16 : 0.18,
            ]}
            s={[0.07, 0.07, 0.07]}
            color={i % 3 ? C.flower : C.yellowSoft}
            shadow={false}
          />
        ))}
      </Fine>
    </group>
  );
}
