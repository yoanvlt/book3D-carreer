import { Ball, Beam, Cylinder, METAL } from '../Primitives';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { D, CeilingLights } from './parts';

/** Décor de l'intérieur Projet 3. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
export default function DiscoveryInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-3'];
  return (
    <>
      <group position={[f[0][0], 0, f[0][1]]}>
        {[0, 2.1, 4.2].map((a) => (
          <Beam
            key={a}
            a={[Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9]}
            b={[0, 1.6, 0]}
            width={0.08}
            color={C.ink}
          />
        ))}
        <Cylinder p={[0, 2.1, 0.2]} s={[0.32, 2.4, 0.32]} r={[0.9, 0, 0]} color={C.white} finish={METAL} />
        <Cylinder p={[0, 2.85, -0.75]} s={[0.4, 0.2, 0.4]} r={[0.9, 0, 0]} color={mood.accent} />
      </group>
      {Array.from({ length: 34 }, (_, i) => {
        const x = -10 + ((i * 37) % 20);
        const y = 1 + ((i * 53) % 62) / 10;
        if (Math.abs(x) < 6 && y > 1.6 && y < 5.6) return null;
        const r = 0.06 * (1 + (i % 3));
        return (
          <Ball
            key={i}
            p={[x, y, -D + 0.25]}
            s={[r, r, r]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 1.6 }}
            shadow={false}
          />
        );
      })}
      <CeilingLights color='#d9d0ff' />
    </>
  );
}
