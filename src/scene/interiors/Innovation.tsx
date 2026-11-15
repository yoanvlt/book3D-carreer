import { Box, GLASS } from '../Primitives';
import { Bevel } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, GAPS as gaps, CeilingLights } from './parts';

/** Décor de l'intérieur Projet 1. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function InnovationInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-1'];
  return (
    <>
      <group position={[f[0][0], 0, f[0][1]]}>
        <Bevel p={[0, 0.78, 0]} s={[5.2, 0.1, 1.4]} color={C.white} radius={0.04} />
        {[-2.3, 2.3].map((x) => (
          <Box key={x} p={[x, 0.38, 0]} s={[0.1, 0.76, 1.2]} color={C.metal} />
        ))}
        {[-1.6, 0, 1.6].map((x) => (
          <Bevel
            key={x}
            p={[x, 1.1, 0]}
            s={[1, 0.6, 0.06]}
            r={[-0.3, 0, 0]}
            color={mood.screen}
            finish={{ glow: mood.accent, glowIntensity: 0.3 }}
          />
        ))}
      </group>
      {[-1, 1].flatMap((s) =>
        gaps.map((z) => (
          <Box
            key={`${s}${z}`}
            p={[s * (W - 0.35), 1.6, z]}
            s={[0.5, 3.2, 0.08]}
            color={C.glass}
            finish={GLASS}
          />
        )),
      )}
      <CeilingLights />
    </>
  );
}
