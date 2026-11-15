/**
 * Autres missions : galerie. Parquet clair, murs blancs ; cimaises et cadres de toutes tailles
 * entre les rangées, rail de spots au plafond, sculptures sur socles et banc de galerie au fond,
 * cartels sous les cadres.
 */
import { Ball, Box, Cone, FINISH, Rod, Torus } from '../Primitives';
import { Bevel } from '../kit';
import { Fine } from '../StaticBatch';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, D, WALL_H, GAPS, Frame } from './parts';

const ART = [
  [C.teal, C.orange, C.cream],
  [C.blue, C.yellowSoft],
  [C.violetSoft, C.white, C.ink],
  [C.yellow, C.teal],
  [C.orange, C.blueDeep, C.white],
  [C.tealSoft, C.red],
];

/** Rail de spots orientables le long d'une ligne du plafond. */
function SpotRail({ x }: { x: number }) {
  return (
    <>
      <Box p={[x, WALL_H - 0.08, -1]} s={[0.12, 0.08, D * 2 - 3]} color={C.ink} />
      {[-9.5, -5, -0.5, 4.5, 9].map((z) => (
        <group key={z} position={[x, WALL_H - 0.2, z]} rotation={[0, 0, -Math.sign(x) * 0.6]}>
          <Rod p={[0, 0.05, 0]} s={[0.02, 0.15, 0.02]} color={C.ink} shadow={false} />
          <Cone p={[0, -0.15, 0]} s={[0.12, 0.3, 0.12]} r={[Math.PI, 0, 0]} color={C.ink} shadow={false} />
          <Ball
            p={[0, -0.3, 0]}
            s={[0.08, 0.03, 0.08]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 2 }}
            shadow={false}
          />
        </group>
      ))}
    </>
  );
}

export default function GalleryInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.missions;
  return (
    <>
      {/* Cimaises et cadres entre les rangées, cartels. */}
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * (W - 0.05), 4.6, 0]} s={[0.08, 0.06, D * 2]} color='#c9c2b4' shadow={false} />
      ))}
      {[-1, 1].flatMap((s, si) =>
        GAPS.slice(1, 4).map((z, i) => {
          const k = si * 3 + i;
          const tall = k % 2 === 0;
          return (
            <group key={`${s}${z}`}>
              <Frame
                side={s}
                z={z}
                y={tall ? 2.7 : 3.0}
                w={tall ? 1.3 : 1.7}
                h={tall ? 1.7 : 1.1}
                colors={ART[k]}
                rail
              />
              <Box
                p={[s * (W - 0.06), 1.45, z + 0.9]}
                s={[0.02, 0.14, 0.24]}
                color={C.white}
                shadow={false}
              />
            </group>
          );
        }),
      )}
      {/* Sculptures sur socles au fond */}
      {f.slice(0, 2).map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box p={[0, 0.6, 0]} s={[1, 1.2, 1]} color={C.white} finish={FINISH.stone} />
          {i ? (
            <>
              <Torus
                p={[0, 1.9, 0]}
                radius={0.5}
                tube={0.12}
                segments={28}
                color={mood.accent}
                finish={{ rough: 0.3, metal: 0.4 }}
              />
              <Ball p={[0, 1.35, 0]} s={[0.18, 0.18, 0.18]} color={C.ink} />
            </>
          ) : (
            <>
              <Ball p={[0, 1.55, 0]} s={[0.4, 0.4, 0.4]} color={C.violet} finish={{ rough: 0.25 }} />
              <Ball p={[0, 2.1, 0]} s={[0.26, 0.26, 0.26]} color={C.orange} finish={{ rough: 0.25 }} />
              <Ball p={[0, 2.45, 0]} s={[0.15, 0.15, 0.15]} color={C.yellow} finish={{ rough: 0.25 }} />
            </>
          )}
          <Fine>
            <Box p={[0, 0.9, 0.51]} s={[0.4, 0.12, 0.02]} color={C.ink} shadow={false} />
          </Fine>
        </group>
      ))}
      {/* Banc de galerie */}
      <group position={[f[2][0], 0, f[2][1]]}>
        <Bevel p={[0, 0.45, 0]} s={[3, 0.14, 0.7]} color={C.woodDark} radius={0.04} finish={FINISH.wood} />
        {[-1.3, 1.3].map((x) => (
          <Box key={x} p={[x, 0.2, 0]} s={[0.1, 0.4, 0.6]} color={C.ink} />
        ))}
      </group>
      <SpotRail x={-4} />
      <SpotRail x={4} />
    </>
  );
}
