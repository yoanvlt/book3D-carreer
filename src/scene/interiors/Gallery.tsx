import { Ball, Box } from '../Primitives';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, GAPS as gaps, CeilingLights } from './parts';

/** Décor de l'intérieur Autres missions. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function GalleryInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.missions;
  return (
    <>
      {f.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, 0.6, 0]} s={[1, 1.2, 1]} color={C.white} />
          <Ball p={[0, 1.6, 0]} s={[0.45, 0.6, 0.45]} color={i ? C.violet : mood.accent} />
        </group>
      ))}
      {[-1, 1].flatMap((s) =>
        gaps.slice(1, 4).map((z, i) => (
          <group key={`${s}${z}`} position={[s * (W - 0.03), 5.3, z]} rotation={[0, (-s * Math.PI) / 2, 0]}>
            <Box p={[0, 0, 0]} s={[1.6, 1.2, 0.06]} color={C.ink} shadow={false} />
            <Box
              p={[0, 0, 0.04]}
              s={[1.4, 1, 0.04]}
              color={[mood.accent, C.blue, C.yellow][i]}
              shadow={false}
            />
          </group>
        )),
      )}
      <CeilingLights />
    </>
  );
}
