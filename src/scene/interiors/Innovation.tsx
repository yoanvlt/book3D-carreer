/**
 * Projet 1 : laboratoire et showroom. Sol de résine en grandes dalles, plafond de dalles
 * lumineuses et chemins de câbles ; paillasse avec écrans et microscope, bras robotisé sur socle,
 * baie de serveurs, cloisons vitrées, tableau blanc, marquages de sécurité.
 */
import { Ball, Box, Cylinder, FINISH, GLASS, Pipe, Rod } from '../Primitives';
import { Bevel } from '../kit';
import { Fine } from '../StaticBatch';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, D, WALL_H, GAPS } from './parts';

const STEEL = '#3a4752';

export default function InnovationInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-1'];
  return (
    <>
      {/* Plafond : dalles lumineuses en grille, chemins de câbles. */}
      {[-6, -2, 2, 6].flatMap((x) =>
        [-9, -4, 1, 6].map((z) => (
          <Box
            key={`${x}${z}`}
            p={[x, WALL_H - 0.05, z]}
            s={[2.2, 0.05, 1.2]}
            color={C.lamp}
            finish={{ glow: '#f2f8ff', glowIntensity: 1 }}
            shadow={false}
          />
        )),
      )}
      {[-8.4, 8.4].map((x) => (
        <group key={x}>
          <Box
            p={[x, WALL_H - 0.6, 0]}
            s={[0.5, 0.06, D * 2 - 1]}
            color={C.metal}
            finish={FINISH.slats}
            shadow={false}
          />
          <Pipe
            a={[x - 0.1, WALL_H - 0.52, -D + 0.5]}
            b={[x - 0.1, WALL_H - 0.52, D - 0.5]}
            radius={0.05}
            color={mood.accent}
            shadow={false}
          />
          <Pipe
            a={[x + 0.1, WALL_H - 0.52, -D + 0.5]}
            b={[x + 0.1, WALL_H - 0.52, D - 0.5]}
            radius={0.04}
            color={C.yellow}
            shadow={false}
          />
        </group>
      ))}
      {/* Paillasse : plan blanc, piètement acier, trois écrans, microscope, étagère à flacons. */}
      <group position={[f[0][0], 0, f[0][1]]}>
        <Bevel p={[0, 0.9, 0]} s={[5.2, 0.08, 1.4]} color={C.white} radius={0.03} finish={FINISH.plastic} />
        {[-2.4, 2.4].map((x) => (
          <Box key={x} p={[x, 0.45, 0]} s={[0.1, 0.9, 1.2]} color={STEEL} finish={FINISH.steel} />
        ))}
        <Box p={[-1.6, 0.45, 0.1]} s={[1.4, 0.8, 1.1]} color={C.concrete} finish={FINISH.paint} />
        {[-1.6, 0, 1.6].map((x) => (
          <group key={x}>
            <Bevel
              p={[x, 1.45, -0.3]}
              s={[1.1, 0.68, 0.06]}
              r={[-0.15, 0, 0]}
              color={mood.screen}
              finish={{ glow: mood.accent, glowIntensity: 0.35 }}
            />
            <Box p={[x, 1.02, -0.32]} s={[0.08, 0.2, 0.08]} color={STEEL} />
          </group>
        ))}
        <Box p={[0, 2.3, -0.55]} s={[5, 0.06, 0.4]} color={C.white} />
        <Fine>
          {Array.from({ length: 12 }, (_, i) => (
            <Cylinder
              key={i}
              p={[-2.2 + i * 0.4, 2.45, -0.55]}
              s={[0.08, 0.24, 0.08]}
              color={[C.teal, C.white, mood.accent, C.yellowSoft][i % 4]}
              finish={GLASS}
              shadow={false}
            />
          ))}
          <group position={[1.9, 0.94, 0.3]}>
            <Box p={[0, 0.05, 0]} s={[0.4, 0.1, 0.35]} color={C.ink} />
            <Rod p={[0.1, 0.35, -0.1]} s={[0.05, 0.5, 0.05]} color={C.white} />
            <Cylinder p={[0, 0.45, 0]} s={[0.07, 0.35, 0.07]} r={[0.4, 0, 0]} color={C.white} />
          </group>
          <Box p={[-0.6, 0.95, 0.35]} s={[0.4, 0.02, 0.3]} color={C.ink} shadow={false} />
        </Fine>
      </group>
      {/* Bras robotisé sur son socle, zone balisée. */}
      <group position={[f[1][0], 0, f[1][1]]}>
        <Box p={[0, 0.02, 0]} s={[2, 0.02, 1.6]} color={C.yellow} shadow={false} />
        <Box p={[0, 0.03, 0]} s={[1.8, 0.02, 1.4]} color={mood.floor} shadow={false} />
        <Box p={[0, 0.4, 0]} s={[0.9, 0.8, 0.9]} color={C.white} finish={FINISH.plastic} />
        <Cylinder p={[0, 0.95, 0]} s={[0.35, 0.3, 0.35]} color={STEEL} />
        <Pipe a={[0, 1.1, 0]} b={[0.5, 2.4, 0.2]} radius={0.15} color={mood.accent} />
        <Ball p={[0.5, 2.4, 0.2]} s={[0.2, 0.2, 0.2]} color={STEEL} />
        <Pipe a={[0.5, 2.4, 0.2]} b={[1.2, 2.0, 0.5]} radius={0.11} color={mood.accent} />
        <Box p={[1.28, 1.85, 0.55]} s={[0.16, 0.3, 0.3]} color={STEEL} />
      </group>
      {/* Baie de serveurs : façade perforée et voyants. */}
      <group position={[f[2][0], 0, f[2][1]]}>
        <Box p={[0, 1.1, 0]} s={[1.3, 2.2, 1.1]} color={C.ink} finish={FINISH.steel} />
        <Box p={[-0.66, 1.1, 0]} s={[0.02, 2, 0.9]} color={C.slate} finish={FINISH.slats} shadow={false} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            p={[-0.67, 0.3 + i * 0.24, 0.3 - (i % 3) * 0.2]}
            s={[0.02, 0.04, 0.06]}
            color={i % 3 ? '#7fd6ff' : C.tealSoft}
            finish={{ glow: i % 3 ? '#7fd6ff' : C.tealSoft, glowIntensity: 1.5 }}
            shadow={false}
          />
        ))}
      </group>
      {/* Cloisons vitrées entre les rangées, tableau blanc, marquages au sol. */}
      {[-1, 1].flatMap((s) =>
        GAPS.slice(1, 4).map((z) => (
          <group key={`${s}${z}`}>
            <Box p={[s * (W - 0.4), 1.6, z]} s={[0.06, 3.2, 1.2]} color={C.glass} finish={GLASS} />
            <Box p={[s * (W - 0.4), 3.24, z]} s={[0.1, 0.08, 1.3]} color={STEEL} />
          </group>
        )),
      )}
      <group position={[-5, 1.9, -D + 0.25]}>
        <Box p={[0, 0, 0]} s={[2.6, 1.5, 0.05]} color={C.white} />
        <Box p={[0, -0.8, 0.06]} s={[2.6, 0.06, 0.12]} color={C.metal} />
        <Fine>
          {[0.3, 0, -0.3].map((y, i) => (
            <Box
              key={y}
              p={[-0.5 + i * 0.3, y, 0.03]}
              s={[1.2 - i * 0.3, 0.04, 0.01]}
              color={[mood.accent, C.ink, C.red][i]}
              shadow={false}
            />
          ))}
        </Fine>
      </group>
      {[-2.1, 2.1].map((x) => (
        <Box key={x} p={[x, 0.02, -1]} s={[0.12, 0.02, D * 2 - 4]} color={C.yellow} shadow={false} />
      ))}
    </>
  );
}
