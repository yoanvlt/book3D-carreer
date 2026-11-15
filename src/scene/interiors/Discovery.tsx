/**
 * Projet 3 : observatoire. Lambris violet, plafond nervuré semé d'étoiles ; au fond à droite,
 * une estrade avec garde-corps porte le télescope, desservie par un escalier le long du mur ;
 * sphère armillaire, cartes du ciel encadrées entre les rangées.
 */
import { Ball, Box, Cylinder, FINISH, GLASS, Pipe, Rod, Torus, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Railing, Stair } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, D, WALL_H, CeilingBeams, Rug } from './parts';

const NIGHT = '#1d1840';
const BRASS = '#b08a3a';

/** Carte du ciel encadrée : fond nuit, étoiles, constellation reliée. */
function StarChart({ side, z, seed }: { side: number; z: number; seed: number }) {
  const stars = times(
    9,
    (i) => [((i * 37 + seed * 13) % 17) / 17 - 0.5, ((i * 53 + seed * 7) % 13) / 13 - 0.5] as const,
  );
  return (
    <group position={[side * (W - 0.06), 2.8, z]} rotation={[0, (-side * Math.PI) / 2, 0]}>
      <Box p={[0, 0, 0]} s={[1.7, 1.3, 0.06]} color={BRASS} shadow={false} />
      <Box p={[0, 0, 0.03]} s={[1.5, 1.1, 0.02]} color={NIGHT} shadow={false} />
      <Torus p={[0, 0, 0.045]} radius={0.5} tube={0.008} segments={32} color='#8e86c8' />
      {stars.map(([x, y], i) => (
        <Ball
          key={i}
          p={[x * 1.3, y * 0.95, 0.05]}
          s={[0.035, 0.035, 0.01]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 1.4 }}
          shadow={false}
        />
      ))}
      <Fine>
        {stars.slice(0, 5).map(([x, y], i) => {
          const [nx, ny] = stars[i + 1];
          return (
            <Pipe
              key={i}
              a={[x * 1.3, y * 0.95, 0.045]}
              b={[nx * 1.3, ny * 0.95, 0.045]}
              radius={0.006}
              color='#cfc8ff'
              shadow={false}
            />
          );
        })}
      </Fine>
    </group>
  );
}

export default function DiscoveryInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-3'];
  const [px, pz, phx, phz] = f[0];
  const top = 2.0;
  return (
    <>
      <CeilingBeams color='#3a3170' every={2.6} depth={0.3} />
      {times(46, (i) => {
        const x = -W + 0.8 + ((i * 37) % 20);
        const z = -D + 1 + ((i * 53) % 24);
        const r = 0.04 * (1 + (i % 3));
        return (
          <Ball
            key={i}
            p={[x, WALL_H - 0.04, z]}
            s={[r, r * 0.5, r]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 1.8 }}
            shadow={false}
          />
        );
      })}
      {/* Étoiles du mur du fond, autour du titre */}
      {times(34, (i) => {
        const x = -10 + ((i * 37) % 20);
        const y = 1 + ((i * 53) % 62) / 10;
        if (Math.abs(x) < 6 && y > 1.6 && y < 5.9) return null;
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
      {/* Estrade du télescope, garde-corps, escalier le long du mur du fond. */}
      <Box p={[px, top / 2, pz]} s={[phx * 2, top, phz * 2]} color='#3a3170' finish={FINISH.paint} />
      <Box
        p={[px, top + 0.05, pz]}
        s={[phx * 2 + 0.1, 0.1, phz * 2 + 0.1]}
        color={mood.floor}
        finish={FINISH.parquet}
      />
      <Railing a={[px - phx, top, pz + phz]} b={[px + phx, top, pz + phz]} color={BRASS} />
      <Stair
        p={[f[1][0] - f[1][2], 0, -D + 0.75]}
        ry={Math.PI / 2}
        rise={top}
        run={f[1][2] * 2}
        width={0.95}
        color='#3a3170'
        rail={BRASS}
        sides={[-1]}
      />
      {/* Télescope : pilier, monture, tube, chercheur, contrepoids. */}
      <group position={[px + 0.4, top, pz - 0.1]}>
        <Cylinder p={[0, 0.7, 0]} s={[0.28, 1.4, 0.28]} color={C.white} finish={FINISH.paint} />
        <Box p={[0, 1.5, 0]} s={[0.5, 0.3, 0.5]} color={C.ink} />
        <group position={[0, 1.75, 0]} rotation={[0.85, 0.5, 0]}>
          <Cylinder p={[0, 0.6, 0]} s={[0.32, 2.6, 0.32]} color={C.white} finish={FINISH.steel} />
          <Cylinder p={[0, 1.95, 0]} s={[0.36, 0.2, 0.36]} color={mood.accent} />
          <Cylinder p={[0, -0.75, 0]} s={[0.22, 0.2, 0.22]} color={C.ink} />
          <Cylinder p={[0.32, 0.9, 0]} s={[0.07, 0.7, 0.07]} color={C.ink} />
          <Fine>
            <Cylinder p={[0, 2.06, 0]} s={[0.3, 0.02, 0.3]} color={NIGHT} finish={GLASS} shadow={false} />
          </Fine>
        </group>
        <Rod p={[-0.3, 1.5, 0]} s={[0.04, 0.6, 0.04]} r={[0, 0, Math.PI / 2]} color={C.metal} />
        <Cylinder p={[-0.62, 1.5, 0]} s={[0.15, 0.2, 0.15]} r={[0, 0, Math.PI / 2]} color={C.ink} />
      </group>
      {/* Sphère armillaire sur son pied */}
      <group position={[f[2][0], 0, f[2][1]]}>
        <Cylinder p={[0, 0.05, 0]} s={[0.4, 0.1, 0.4]} color={BRASS} finish={{ rough: 0.3, metal: 0.6 }} />
        <Rod p={[0, 0.6, 0]} s={[0.05, 1.1, 0.05]} color={BRASS} />
        {[0, 1.2, 2.4].map((a) => (
          <Torus
            key={a}
            p={[0, 1.55, 0]}
            r={[a, a * 0.6, 0]}
            radius={0.45}
            tube={0.02}
            segments={24}
            color={BRASS}
            finish={{ rough: 0.3, metal: 0.6 }}
          />
        ))}
        <Ball p={[0, 1.55, 0]} s={[0.12, 0.12, 0.12]} color={mood.accent} />
      </group>
      {[
        [-1, 4.5, 1],
        [1, -0.5, 2],
        [-1, -5.5, 3],
        [1, 4.5, 4],
      ].map(([s, z, seed]) => (
        <StarChart key={`${s}${z}`} side={s} z={z} seed={seed} />
      ))}
      <Rug p={[0, -1.5]} w={3.6} d={D * 2 - 8} color='#4a3f8a' border={mood.accent} />
    </>
  );
}
