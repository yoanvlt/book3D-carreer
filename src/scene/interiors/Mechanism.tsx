import { Beam, Box } from '../Primitives';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, D, GAPS as gaps, pendants } from './parts';

/** Décor de l'intérieur Projet 2. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function MechanismInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-2'];
  return (
    <>
      <group position={[f[0][0], 0, f[0][1]]}>
        {[-2.4, -0.8, 0.8, 2.4].map((x, i) => (
          <Box
            key={x}
            p={[x, 0.5 + (i % 2) * 0.1, 0]}
            s={[1.4, 1 + (i % 2) * 0.2, 1]}
            r={[0, i * 0.08, 0]}
            color={i % 2 ? C.woodDark : C.wood}
          />
        ))}
        <Box p={[-1.6, 1.35, 0]} s={[1.2, 0.7, 0.9]} color={C.yellow} />
      </group>
      {gaps.map((z) => (
        <group key={z}>
          <Beam a={[-W + 0.35, 0, z]} b={[-W + 0.35, 7.4, z]} width={0.3} color={mood.accent} />
          <Beam a={[W - 0.35, 0, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
          <Beam a={[-W + 0.35, 7.4, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
        </group>
      ))}
      {[-2.1, 2.1].map((x) => (
        <Box key={x} p={[x, 0.02, -1]} s={[0.18, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
      ))}
      {pendants(C.slate)}
    </>
  );
}
