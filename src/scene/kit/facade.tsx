/**
 * Façades : volume de mur avec soubassement, bandeaux, corniche, acrotère et couvertine, chaînes
 * d'angle ; gouttières et descentes d'eau, grilles de ventilation, climatiseurs, boîtiers
 * techniques, appliques. Origine au sol, au centre du volume ; façade principale vers +Z.
 */
import { RoundedBox } from '@react-three/drei';
import { color as C } from '../../design/tokens';
import { Box, Cylinder, FINISH, Rod, material, type Finish, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';

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

/** Acrotère : rebord en périphérie d'une toiture plate, avec couvertine métallique. */
export function Parapet({
  y,
  w,
  d,
  h = 0.6,
  t = 0.28,
  color,
  coping = C.concrete,
  finish,
}: {
  y: number;
  w: number;
  d: number;
  h?: number;
  t?: number;
  color: string;
  coping?: string;
  finish?: Finish;
}) {
  const ring = (hh: number, tt: number, out: number, c: string, f: Finish | undefined, yy: number) => (
    <group position={[0, yy, 0]}>
      <Box p={[0, 0, d / 2 - tt / 2 + out]} s={[w + 2 * out, hh, tt]} color={c} finish={f} />
      <Box p={[0, 0, -d / 2 + tt / 2 - out]} s={[w + 2 * out, hh, tt]} color={c} finish={f} />
      <Box p={[w / 2 - tt / 2 + out, 0, 0]} s={[tt, hh, d - 2 * tt + 2 * out]} color={c} finish={f} />
      <Box p={[-w / 2 + tt / 2 - out, 0, 0]} s={[tt, hh, d - 2 * tt + 2 * out]} color={c} finish={f} />
    </group>
  );
  return (
    <>
      {ring(h, t, 0, color, finish, y + h / 2)}
      {ring(0.07, t + 0.1, 0.05, coping, FINISH.steel, y + h + 0.035)}
    </>
  );
}

export interface VolumeProps {
  p?: V3;
  ry?: number;
  w: number;
  d: number;
  h: number;
  color: string;
  finish?: Finish;
  /** Soubassement : hauteur, couleur, matière. */
  plinth?: { h: number; color: string; finish?: Finish };
  /** Bandeaux horizontaux (hauteurs). */
  bands?: number[];
  bandColor?: string;
  /** Corniche en deux ressauts au sommet. */
  cornice?: string;
  /** Acrotère au-dessus du volume (toiture plate). */
  parapet?: { h?: number; color?: string; coping?: string };
  /** Chaînes d'angle harpées. */
  quoins?: string;
}

/** Volume de façade complet, à habiller ensuite de fenêtres et d'équipements. */
export function Volume({
  p = [0, 0, 0],
  ry = 0,
  w,
  d,
  h,
  color,
  finish = FINISH.render,
  plinth,
  bands = [],
  bandColor = C.white,
  cornice,
  parapet,
  quoins,
}: VolumeProps) {
  const courses = quoins ? Math.floor((h - (plinth?.h ?? 0)) / 0.56) : 0;
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, h / 2, 0]} s={[w, h, d]} color={color} finish={finish} />
      {plinth && (
        <Box
          p={[0, plinth.h / 2, 0]}
          s={[w + 0.14, plinth.h, d + 0.14]}
          color={plinth.color}
          finish={plinth.finish ?? FINISH.stone}
        />
      )}
      {bands.map((y) => (
        <Box key={y} p={[0, y, 0]} s={[w + 0.12, 0.16, d + 0.12]} color={bandColor} finish={FINISH.paint} />
      ))}
      {cornice && (
        <>
          <Box p={[0, h - 0.27, 0]} s={[w + 0.2, 0.14, d + 0.2]} color={cornice} finish={FINISH.paint} />
          <Box p={[0, h - 0.09, 0]} s={[w + 0.42, 0.18, d + 0.42]} color={cornice} finish={FINISH.paint} />
        </>
      )}
      {parapet && (
        <Parapet
          y={h}
          w={w + (cornice ? 0.42 : 0)}
          d={d + (cornice ? 0.42 : 0)}
          h={parapet.h ?? 0.6}
          color={parapet.color ?? color}
          coping={parapet.coping}
          finish={finish}
        />
      )}
      {Array.from({ length: courses }, (_, k) =>
        [
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([sx, sz]) => {
          const long = k % 2 === 0;
          return (
            <Box
              key={`${k}${sx}${sz}`}
              p={[
                sx * (w / 2 - (long ? 0.28 : 0.2) + 0.03),
                (plinth?.h ?? 0) + 0.28 + k * 0.56,
                sz * (d / 2 - (long ? 0.2 : 0.28) + 0.03),
              ]}
              s={[long ? 0.62 : 0.46, 0.5, long ? 0.46 : 0.62]}
              color={quoins!}
              finish={FINISH.stone}
            />
          );
        }),
      )}
    </group>
  );
}

/** Gouttière horizontale le long d'une rive (de x0 à x1, à la hauteur y, en z). */
export function Gutter({
  x0,
  x1,
  y,
  z,
  color = C.metal,
}: {
  x0: number;
  x1: number;
  y: number;
  z: number;
  color?: string;
}) {
  return (
    <Rod
      p={[(x0 + x1) / 2, y, z]}
      s={[0.09, x1 - x0, 0.09]}
      r={[0, 0, Math.PI / 2]}
      color={color}
      finish={FINISH.steel}
    />
  );
}

/** Descente d'eau : tuyau, cuvette en tête, dauphin en pied, colliers. */
export function Downpipe({
  p,
  h,
  ry = 0,
  color = C.metal,
}: {
  p: V3;
  h: number;
  ry?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Rod p={[0, h / 2 + 0.25, 0.12]} s={[0.065, h - 0.5, 0.065]} color={color} finish={FINISH.steel} />
      <Box p={[0, h - 0.1, 0.14]} s={[0.24, 0.22, 0.2]} color={color} finish={FINISH.steel} />
      <Box p={[0, 0.2, 0.2]} s={[0.12, 0.18, 0.24]} r={[0.5, 0, 0]} color={color} finish={FINISH.steel} />
      <Fine>
        {Array.from({ length: Math.max(1, Math.floor(h / 1.6)) }, (_, i) => (
          <Box key={i} p={[0, 0.9 + i * 1.6, 0.08]} s={[0.18, 0.05, 0.12]} color={C.slate} shadow={false} />
        ))}
      </Fine>
    </group>
  );
}

/** Grille de ventilation à lames. */
export function Vent({ p, ry = 0, w = 0.7, h = 0.5 }: { p: V3; ry?: number; w?: number; h?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0, 0.03]} s={[w + 0.1, h + 0.1, 0.06]} color={C.slate} />
      <Box p={[0, 0, 0.07]} s={[w, h, 0.03]} color={C.concrete} finish={FINISH.slats} shadow={false} />
    </group>
  );
}

/** Climatiseur mural : caisson, ventilateur, grille et support. */
export function AirCon({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0, 0.22]} s={[0.95, 0.62, 0.38]} color={C.white} finish={FINISH.plastic} />
      <Cylinder
        p={[0.15, 0, 0.42]}
        s={[0.24, 0.03, 0.24]}
        r={[Math.PI / 2, 0, 0]}
        color={C.slate}
        shadow={false}
      />
      <Fine>
        <Box
          p={[-0.32, 0, 0.42]}
          s={[0.2, 0.46, 0.02]}
          color={C.concrete}
          finish={FINISH.slats}
          shadow={false}
        />
        {[-0.38, 0.38].map((x) => (
          <Box key={x} p={[x, -0.36, 0.2]} s={[0.05, 0.05, 0.42]} color={C.slate} shadow={false} />
        ))}
        <Rod p={[-0.42, -0.6, 0.1]} s={[0.025, 0.5, 0.025]} color={C.slate} shadow={false} />
      </Fine>
    </group>
  );
}

/** Boîtier technique (coffret électrique, compteur) : armoire, portes, aérations. */
export function TechBox({
  p,
  ry = 0,
  w = 0.9,
  h = 1.3,
  color = C.concrete,
}: {
  p: V3;
  ry?: number;
  w?: number;
  h?: number;
  color?: string;
}) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, h / 2, 0.2]} s={[w, h, 0.4]} color={color} finish={FINISH.paint} />
      <Box p={[0, h + 0.03, 0.2]} s={[w + 0.08, 0.06, 0.46]} color={C.slate} />
      <Fine>
        <Box p={[0, h / 2, 0.41]} s={[0.02, h - 0.12, 0.01]} color={C.slate} shadow={false} />
        <Box
          p={[w * 0.25, h * 0.75, 0.41]}
          s={[0.3, 0.14, 0.01]}
          color={C.concrete}
          finish={FINISH.slats}
          shadow={false}
        />
        <Box p={[-w * 0.25, h * 0.7, 0.41]} s={[0.16, 0.1, 0.01]} color={C.yellow} shadow={false} />
      </Fine>
    </group>
  );
}

/** Applique murale allumée. */
export function WallLamp({ p, r = [0, 0, 0] }: { p: V3; r?: V3 }) {
  return (
    <group position={p} rotation={r}>
      <Box p={[0, 0, 0.06]} s={[0.2, 0.36, 0.12]} color={C.ink} shadow={false} />
      <Box p={[0, 0.06, 0.16]} s={[0.3, 0.05, 0.22]} color={C.ink} shadow={false} />
      <Box
        p={[0, -0.04, 0.18]}
        s={[0.16, 0.22, 0.12]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.4 }}
        shadow={false}
      />
    </group>
  );
}
