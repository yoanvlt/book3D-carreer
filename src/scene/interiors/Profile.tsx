import { Ball, Box, Cone, Cylinder } from '../Primitives';
import { Bevel } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { D, pendants, Bookcase } from './parts';

/** Décor de l'intérieur Profil. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function ProfileInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.profile;
  return (
    <>
      {f.slice(0, 4).map((p, i) => (
        <Bookcase key={i} f={p} />
      ))}
      <group position={[f[4][0], 0, f[4][1]]}>
        <Bevel p={[0, 0.4, 0]} s={[4.4, 0.6, 1.2]} color={mood.accent} radius={0.2} />
        <Bevel p={[0, 0.95, -0.45]} s={[4.4, 0.9, 0.3]} color={mood.accent} radius={0.15} />
        {[-1, 1].map((s) => (
          <Bevel key={s} p={[s * 2.1, 0.75, 0]} s={[0.3, 0.7, 1.2]} color={mood.accent} radius={0.12} />
        ))}
        <Bevel p={[-1, 0.85, 0.05]} s={[0.7, 0.5, 0.3]} color={C.yellow} radius={0.12} />
        <Bevel p={[0.9, 0.85, 0.05]} s={[0.7, 0.5, 0.3]} color={C.blue} radius={0.12} />
      </group>
      <group position={[f[5][0], 0, f[5][1]]}>
        <Bevel p={[0, 0.45, 0]} s={[1.5, 0.6, 1.3]} color={C.blue} radius={0.2} />
        <Bevel p={[0, 1, -0.5]} s={[1.5, 0.9, 0.3]} color={C.blue} radius={0.12} />
      </group>
      <group position={[6, 0, -D + 1.3]}>
        <Cylinder p={[0, 1.3, 0]} s={[0.05, 2.6, 0.05]} color={C.ink} />
        <Cone p={[0, 2.75, 0]} s={[0.5, 0.5, 0.5]} color={C.white} />
        <Ball
          p={[0, 2.55, 0]}
          s={[0.14, 0.14, 0.14]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 2 }}
        />
      </group>
      {/* Tapis dans l'allée */}
      <Box p={[0, 0.012, -1]} s={[4, 0.02, D * 2 - 6]} color={mood.accent} shadow={false} />
      <Box p={[0, 0.02, -1]} s={[3.4, 0.02, D * 2 - 6.6]} color='#ffb38a' shadow={false} />
      {pendants(C.white)}
    </>
  );
}
