/**
 * Profil : salon-bibliothèque. Parquet, lambris, poutres apparentes ; bibliothèques garnies,
 * canapé et fauteuil autour d'une table basse sur un grand tapis, lampadaire de lecture,
 * guéridon et globe, cadres et appliques. Le mobilier qui gêne la marche suit FURNITURE.
 */
import { Ball, Box, Cone, Cylinder, FINISH, Rod, Torus, times } from '../Primitives';
import { Bevel } from '../kit';
import { Fine } from '../StaticBatch';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { D, pendants, Bookcase, CeilingBeams, Frame, Rug, Sconce } from './parts';

const FABRIC = '#c8573a';
const WOOD = '#9a6338';

/** Canapé à coussins, accoudoirs et pieds tournés. */
function Sofa({ x, z, w, color }: { x: number; z: number; w: number; color: string }) {
  return (
    <group position={[x, 0, z]}>
      <Bevel p={[0, 0.42, 0]} s={[w, 0.5, 1.15]} color={color} radius={0.14} finish={FINISH.fabric} />
      <Bevel p={[0, 0.98, -0.45]} s={[w, 0.95, 0.3]} color={color} radius={0.12} finish={FINISH.fabric} />
      {[-1, 1].map((s) => (
        <Bevel
          key={s}
          p={[s * (w / 2 - 0.12), 0.75, 0]}
          s={[0.26, 0.75, 1.15]}
          color={color}
          radius={0.1}
          finish={FINISH.fabric}
        />
      ))}
      {times(Math.max(1, Math.round((w - 0.6) / 0.9)), (i, n) => (
        <Bevel
          key={i}
          p={[-w / 2 + 0.3 + ((w - 0.6) / n) * (i + 0.5), 0.74, 0.05]}
          s={[(w - 0.6) / n - 0.06, 0.16, 0.95]}
          color={color}
          radius={0.07}
          finish={FINISH.fabric}
        />
      ))}
      <Fine>
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <Cylinder
              key={`${sx}${sz}`}
              p={[sx * (w / 2 - 0.15), 0.08, sz * 0.45]}
              s={[0.05, 0.16, 0.05]}
              color={WOOD}
              shadow={false}
            />
          )),
        )}
        <Bevel
          p={[-w / 4, 1.0, -0.22]}
          s={[0.55, 0.42, 0.14]}
          r={[-0.2, 0, 0.1]}
          color={C.yellowSoft}
          radius={0.06}
          finish={FINISH.fabric}
        />
        <Bevel
          p={[w / 4, 1.0, -0.22]}
          s={[0.55, 0.42, 0.14]}
          r={[-0.2, 0, -0.1]}
          color={C.blue}
          radius={0.06}
          finish={FINISH.fabric}
        />
      </Fine>
    </group>
  );
}

export default function ProfileInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.profile;
  return (
    <>
      <CeilingBeams color={WOOD} />
      {f.slice(0, 4).map((p, i) => (
        <Bookcase key={i} f={p} />
      ))}
      {/* Coin salon : tapis, canapé, fauteuil, table basse, lampadaire. */}
      <Rug p={[-0.6, -10.4]} w={7.4} d={3.6} color='#e8b48a' border={FABRIC} />
      <Sofa x={f[4][0]} z={f[4][1]} w={4.4} color={FABRIC} />
      <group position={[f[5][0], 0, f[5][1]]} rotation={[0, -0.5, 0]}>
        <Sofa x={0} z={0} w={1.6} color={C.blue} />
      </group>
      <group position={[f[6][0], 0, f[6][1]]}>
        <Box p={[0, 0.42, 0]} s={[1.6, 0.08, 0.8]} color={WOOD} finish={FINISH.wood} />
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <Box key={`${sx}${sz}`} p={[sx * 0.7, 0.19, sz * 0.32]} s={[0.07, 0.38, 0.07]} color={WOOD} />
          )),
        )}
        <Box p={[0, 0.12, 0]} s={[1.4, 0.04, 0.64]} color={WOOD} finish={FINISH.wood} />
        <Fine>
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              p={[-0.4, 0.5 + i * 0.06, 0]}
              s={[0.5 - i * 0.05, 0.05, 0.36]}
              r={[0, i * 0.2, 0]}
              color={[C.orange, C.cream, C.teal][i]}
              shadow={false}
            />
          ))}
          <Cylinder p={[0.35, 0.56, 0.05]} s={[0.07, 0.2, 0.07]} color={C.white} shadow={false} />
          <Ball p={[0.35, 0.72, 0.05]} s={[0.12, 0.12, 0.12]} color={C.flower} shadow={false} />
        </Fine>
      </group>
      {/* Lampadaire de lecture à côté du fauteuil */}
      <group position={[5.2, 0, -12]}>
        <Cylinder p={[0, 0.04, 0]} s={[0.3, 0.08, 0.3]} color={C.ink} />
        <Rod p={[0, 1.3, 0]} s={[0.03, 2.5, 0.03]} color={C.ink} />
        <Cone p={[0, 2.65, 0]} s={[0.42, 0.4, 0.42]} color={C.cream} />
        <Ball
          p={[0, 2.5, 0]}
          s={[0.12, 0.12, 0.12]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 2 }}
        />
      </group>
      {/* Guéridon et globe terrestre */}
      <group position={[f[7][0], 0, f[7][1]]}>
        <Cylinder p={[0, 0.7, 0]} s={[0.55, 0.05, 0.55]} color={WOOD} finish={FINISH.wood} />
        <Rod p={[0, 0.35, 0]} s={[0.06, 0.7, 0.06]} color={WOOD} />
        <Cylinder p={[0, 0.03, 0]} s={[0.3, 0.06, 0.3]} color={WOOD} />
        <Torus
          p={[0, 1.15, 0]}
          r={[0.3, 0, 0]}
          radius={0.36}
          tube={0.02}
          arc={Math.PI * 1.4}
          segments={16}
          color='#b08a3a'
        />
        <Ball p={[0, 1.15, 0]} s={[0.32, 0.32, 0.32]} color={C.blue} />
        <Fine>
          <Ball p={[0.08, 1.22, 0.24]} s={[0.12, 0.08, 0.06]} color={C.leaf} shadow={false} />
          <Ball p={[-0.18, 1.05, 0.2]} s={[0.1, 0.1, 0.06]} color={C.leaf} shadow={false} />
        </Fine>
      </group>
      {/* Cadres et appliques entre les rangées */}
      {[
        [-1, 4.5, [C.orange, C.yellowSoft, C.blue]],
        [1, -0.5, [C.teal, C.white]],
        [-1, -5.5, [C.violetSoft, C.orange]],
        [1, 4.5, [C.yellow, C.blueDeep, C.white]],
      ].map(([side, z, colors]) => (
        <Frame
          key={`${side}${z}`}
          side={side as number}
          z={z as number}
          y={2.6}
          w={1.4}
          h={1.1}
          colors={colors as string[]}
        />
      ))}
      {[-0.5, -5.5].flatMap((z) =>
        [-1, 1].map((s) => <Sconce key={`${s}${z}`} side={s} z={z + 1} y={3.6} color={C.cream} />),
      )}
      <Box
        p={[0, 0.012, 2]}
        s={[3.6, 0.02, D * 2 - 9]}
        color={mood.accent}
        finish={FINISH.fabric}
        shadow={false}
      />
      <Box
        p={[0, 0.02, 2]}
        s={[3.0, 0.02, D * 2 - 9.6]}
        color='#f2c29b'
        finish={FINISH.fabric}
        shadow={false}
      />
      {pendants(C.white)}
    </>
  );
}
