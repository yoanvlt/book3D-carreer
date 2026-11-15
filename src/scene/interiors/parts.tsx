import { Ball, Box, Cone, Cylinder, FINISH } from '../Primitives';
import { Fine } from '../StaticBatch';
import { color as C } from '../../design/tokens';
import { ROOM, type Footprint } from '../../world/narrative';

/** Dimensions de la salle (narrative.ts) et mobilier commun aux intérieurs. */
export const W = ROOM.halfWidth;
export const D = ROOM.halfDepth;
export const WALL_H = 7.6;

/** Bibliothèque ouverte : montants, étagères et livres visibles depuis l'allée. */
export function Bookcase({ f }: { f: Footprint }) {
  const [x, z, hx, hz] = f;
  const facing = -Math.sign(x); // vers le centre de la salle
  const depth = hx * 2;
  return (
    <group position={[x, 0, z]}>
      <Box p={[-facing * (hx - 0.05), 1.5, 0]} s={[0.1, 3, hz * 2]} color={C.woodDark} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[0, 1.5, s * (hz - 0.05)]} s={[depth, 3, 0.1]} color={C.woodDark} />
      ))}
      {[0.08, 0.85, 1.65, 2.45, 2.95].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[depth, 0.08, hz * 2]} color={C.wood} />
      ))}
      {[0.12, 0.89, 1.69].map((y, row) =>
        Array.from({ length: 9 }, (_, k) => {
          const h = 0.48 + ((k * 5 + row * 3) % 4) * 0.06;
          return (
            <Box
              key={`${row}-${k}`}
              p={[facing * 0.04, y + h / 2 + 0.04, -hz + 0.3 + k * ((hz * 2 - 0.6) / 8)]}
              s={[depth * 0.7, h, 0.2]}
              r={[k === 7 ? 0.25 : 0, 0, 0]}
              color={[C.orange, C.white, C.blueDeep, C.yellow, C.teal, C.violetSoft][(k + row * 2) % 6]}
              shadow={false}
            />
          );
        }),
      )}
      <Ball p={[facing * 0.05, 2.75, hz * 0.4]} s={[0.25, 0.3, 0.25]} color={C.leaf} />
      <Cylinder p={[facing * 0.05, 2.6, hz * 0.4]} s={[0.18, 0.2, 0.18]} color={C.white} />
    </group>
  );
}
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
function Pendant({ p, color }: { p: [number, number, number]; color: string }) {
  return (
    <group position={p}>
      <Cylinder
        p={[0, (WALL_H - p[1]) / 2, 0]}
        s={[0.02, WALL_H - p[1], 0.02]}
        color={C.ink}
        shadow={false}
      />
      <Cone p={[0, 0.15, 0]} s={[0.55, 0.4, 0.55]} color={color} shadow={false} />
      <Ball
        p={[0, -0.08, 0]}
        s={[0.18, 0.18, 0.18]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 2 }}
      />
    </group>
  );
}

/** Suspensions alignées dans l'allée centrale. */
export const pendants = (color: string) =>
  [-8, -2, 4].map((z) => <Pendant key={z} p={[0, 6.6, z]} color={color} />);
/** Intervalles entre les rangées de stations, le long des murs. */
export const GAPS = [9.5, 4.5, -0.5, -5.5, -10.5];

/** Tapis à bordure, posé dans l'allée ou devant un meuble. */
export function Rug({
  p,
  w,
  d,
  color,
  border,
}: {
  p: [number, number];
  w: number;
  d: number;
  color: string;
  border: string;
}) {
  return (
    <>
      <Box p={[p[0], 0.012, p[1]]} s={[w, 0.02, d]} color={border} finish={FINISH.fabric} shadow={false} />
      <Box
        p={[p[0], 0.024, p[1]]}
        s={[w - 0.4, 0.02, d - 0.4]}
        color={color}
        finish={FINISH.fabric}
        shadow={false}
      />
    </>
  );
}

/**
 * Cadre accroché à un mur latéral (side = -1 gauche, 1 droite) : baguette, passe-partout et
 * œuvre abstraite en aplats ; suspendu à la cimaise par deux fils.
 */
export function Frame({
  side,
  z,
  y,
  w,
  h,
  colors,
  rail = false,
}: {
  side: number;
  z: number;
  y: number;
  w: number;
  h: number;
  colors: string[];
  rail?: boolean;
}) {
  return (
    <group position={[side * (W - 0.06), y, z]} rotation={[0, (-side * Math.PI) / 2, 0]}>
      <Box p={[0, 0, 0]} s={[w + 0.16, h + 0.16, 0.06]} color={C.ink} shadow={false} />
      <Box p={[0, 0, 0.03]} s={[w, h, 0.02]} color={C.cream} shadow={false} />
      <Box p={[0, 0, 0.04]} s={[w * 0.82, h * 0.8, 0.02]} color={colors[0]} shadow={false} />
      {colors.slice(1).map((c, i) => (
        <Box
          key={i}
          p={[(i % 2 ? 1 : -1) * w * 0.18, (i - 0.5) * h * 0.22, 0.05]}
          s={[w * (0.32 - i * 0.06), h * 0.3, 0.02]}
          r={[0, 0, i * 0.4]}
          color={c}
          shadow={false}
        />
      ))}
      {rail && (
        <Fine>
          {[-1, 1].map((s) => (
            <Box
              key={s}
              p={[s * w * 0.3, h / 2 + 0.5, -0.01]}
              s={[0.01, 1, 0.01]}
              r={[0, 0, -s * 0.2]}
              color={C.metal}
              shadow={false}
            />
          ))}
        </Fine>
      )}
    </group>
  );
}

/** Applique murale sur un mur latéral. */
export function Sconce({
  side,
  z,
  y = 3.2,
  color = C.white,
}: {
  side: number;
  z: number;
  y?: number;
  color?: string;
}) {
  return (
    <group position={[side * (W - 0.05), y, z]} rotation={[0, (-side * Math.PI) / 2, 0]}>
      <Box p={[0, 0, 0.04]} s={[0.16, 0.3, 0.08]} color={C.ink} shadow={false} />
      <Cone p={[0, 0.12, 0.22]} s={[0.2, 0.24, 0.2]} r={[Math.PI, 0, 0]} color={color} shadow={false} />
      <Ball
        p={[0, 0.02, 0.22]}
        s={[0.08, 0.08, 0.08]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.6 }}
        shadow={false}
      />
    </group>
  );
}

/** Poutres apparentes en travers du plafond. */
export function CeilingBeams({
  color,
  every = 3.2,
  depth = 0.4,
}: {
  color: string;
  every?: number;
  depth?: number;
}) {
  return (
    <>
      {Array.from({ length: Math.floor((D * 2) / every) }, (_, i) => (
        <Box
          key={i}
          p={[0, WALL_H - depth / 2, -D + every * (i + 0.5)]}
          s={[W * 2, depth, 0.3]}
          color={color}
          finish={FINISH.wood}
        />
      ))}
    </>
  );
}
