import { Box, Cylinder, METAL } from '../Primitives';
import { Bevel } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE, VEOLIA_COLUMNS } from '../../world/narrative';
import { W, D, pendants } from './parts';

/** Décor de l'intérieur Veolia. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function VeoliaInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.veolia;
  return (
    <>
      <group position={[f[0][0], 0, f[0][1]]}>
        <Bevel p={[0, 0.5, 0]} s={[6, 1, 1.2]} color={C.white} radius={0.08} />
        <Box p={[0, 1.05, 0.2]} s={[5.8, 0.08, 0.9]} r={[-0.35, 0, 0]} color={C.ink} />
        {[-2, 0, 2].map((x) => (
          <Box
            key={x}
            p={[x, 1.7, -0.4]}
            s={[1.6, 1, 0.08]}
            color={mood.screen}
            finish={{ glow: C.teal, glowIntensity: 0.3 }}
          />
        ))}
      </group>
      {VEOLIA_COLUMNS.map(([x, z]) => (
        <group key={x}>
          <Cylinder p={[x, 3, z]} s={[0.75, 6, 0.75]} color={C.white} finish={METAL} />
          <Cylinder p={[x, 4.2, z]} s={[0.78, 0.35, 0.78]} color={mood.accent} />
        </group>
      ))}
      {[-1, 1].map((s) =>
        [5.6, 6.3].map((y, i) => (
          <Cylinder
            key={`${s}${y}`}
            p={[s * (W - 0.25), y, 0]}
            s={[0.16 + i * 0.06, D * 2 - 1, 0.16 + i * 0.06]}
            r={[Math.PI / 2, 0, 0]}
            color={i ? mood.accent : C.metal}
          />
        )),
      )}
      {[-2.1, 2.1].map((x) => (
        <Box key={x} p={[x, 0.02, -1]} s={[0.14, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
      ))}
      {pendants(C.white)}
    </>
  );
}
