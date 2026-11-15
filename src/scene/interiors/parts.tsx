import { Ball, Box, Cone, Cylinder } from '../Primitives';
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
/** Lignes lumineuses au plafond, tout le long de la salle. */
export function CeilingLights({ color = '#ffffff' }: { color?: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Box
          key={s}
          p={[s * 4, WALL_H - 0.12, 0]}
          s={[0.25, 0.08, D * 2 - 4]}
          color={C.lamp}
          finish={{ glow: color, glowIntensity: 1.1 }}
          shadow={false}
        />
      ))}
    </>
  );
}

/** Suspensions alignées dans l'allée centrale. */
export const pendants = (color: string) =>
  [-8, -2, 4].map((z) => <Pendant key={z} p={[0, 6.6, z]} color={color} />);
/** Intervalles entre les rangées de stations, le long des murs. */
export const GAPS = [9.5, 4.5, -0.5, -5.5, -10.5];
