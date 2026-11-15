/**
 * Projet 2 : atelier. Sol de béton, murs de brique peinte, portiques jaunes et pont roulant avec
 * son palan ; établi à étau et outils, tour et perceuse à colonne, panneaux à outils entre les
 * rangées, lampes d'atelier, bandes de sécurité au sol.
 */
import { Beam, Box, Cylinder, FINISH, Pipe, Rod, Torus } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Crate } from '../kit';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE } from '../../world/narrative';
import { W, D, GAPS, pendants } from './parts';

const STEEL = '#3a4752';

/** Panneau perforé à outils sur un mur latéral (side) : clés, marteau, scie, pinces. */
function Pegboard({ side, z }: { side: number; z: number }) {
  return (
    <group position={[side * (W - 0.08), 2.4, z]} rotation={[0, (-side * Math.PI) / 2, 0]}>
      <Box p={[0, 0, 0]} s={[1.6, 1.2, 0.04]} color='#d9b98a' finish={FINISH.gravel} shadow={false} />
      <Box p={[-0.5, 0.1, 0.05]} s={[0.06, 0.7, 0.04]} r={[0, 0, 0.2]} color={STEEL} shadow={false} />
      <Box p={[-0.2, 0.15, 0.05]} s={[0.05, 0.6, 0.04]} color={C.red} shadow={false} />
      <Box p={[-0.2, 0.42, 0.06]} s={[0.25, 0.08, 0.05]} color={STEEL} shadow={false} />
      <Box p={[0.3, 0.0, 0.05]} s={[0.5, 0.16, 0.03]} color={C.metal} shadow={false} />
      <Box p={[0.3, -0.1, 0.06]} s={[0.12, 0.2, 0.04]} color={C.yellow} shadow={false} />
      <Torus p={[0.55, 0.3, 0.06]} radius={0.12} tube={0.02} segments={10} color={STEEL} />
    </group>
  );
}

export default function MechanismInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE['project-2'];
  return (
    <>
      {/* Portiques et pont roulant */}
      {GAPS.map((z) => (
        <group key={z}>
          <Beam a={[-W + 0.35, 0, z]} b={[-W + 0.35, 7.4, z]} width={0.3} color={mood.accent} />
          <Beam a={[W - 0.35, 0, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
          <Beam a={[-W + 0.35, 7.4, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
        </group>
      ))}
      {[-W + 0.6, W - 0.6].map((x) => (
        <Box key={x} p={[x, 6.6, -1]} s={[0.3, 0.4, D * 2 - 3]} color={STEEL} finish={FINISH.steel} />
      ))}
      <group position={[0, 6.6, -6]}>
        <Box p={[0, 0.1, 0]} s={[W * 2 - 1.2, 0.45, 0.5]} color={C.yellow} finish={FINISH.paint} />
        <Box p={[1.5, -0.3, 0]} s={[0.7, 0.45, 0.6]} color={STEEL} />
        <Rod p={[1.5, -1.6, 0]} s={[0.02, 2.2, 0.02]} color={C.ink} shadow={false} />
        <Torus p={[1.5, -2.8, 0]} radius={0.12} tube={0.03} arc={Math.PI * 1.5} segments={10} color={C.ink} />
      </group>
      {/* Établi : plateau en bois, étau, tiroirs, outils posés. */}
      <group position={[f[0][0], 0, f[0][1]]}>
        <Box p={[0, 0.95, 0]} s={[6.4, 0.12, 1.1]} color={C.wood} finish={FINISH.wood} />
        {[-3, -1, 1, 3].map((x) => (
          <Box key={x} p={[x, 0.45, 0]} s={[0.1, 0.9, 1]} color={STEEL} finish={FINISH.steel} />
        ))}
        <Box p={[-2, 0.55, 0.05]} s={[1.8, 0.7, 0.9]} color={C.red} finish={FINISH.paint} />
        <Fine>
          {[0.75, 0.48, 0.28].map((y) => (
            <Box key={y} p={[-2, y, 0.51]} s={[1.6, 0.02, 0.02]} color={C.ink} shadow={false} />
          ))}
        </Fine>
        <group position={[2.4, 1.01, 0.2]}>
          <Box p={[0, 0.15, 0]} s={[0.4, 0.3, 0.3]} color={STEEL} />
          <Box p={[0, 0.2, 0.25]} s={[0.36, 0.2, 0.2]} color={STEEL} />
          <Rod p={[0, 0.2, 0.42]} s={[0.02, 0.4, 0.02]} r={[0, 0, Math.PI / 2]} color={C.metal} />
        </group>
        <Box p={[0, 1.75, -0.5]} s={[6.2, 1.15, 0.06]} color='#d9b98a' finish={FINISH.gravel} />
        <Fine>
          {[-2.4, -1.2, 0, 1.2].map((x, i) => (
            <Box
              key={x}
              p={[x, 2.1, -0.44]}
              s={[0.08 + (i % 2) * 0.3, 0.6, 0.04]}
              r={[0, 0, i * 0.3]}
              color={[STEEL, C.red, C.yellow, C.metal][i]}
              shadow={false}
            />
          ))}
          <Box p={[0.6, 1.07, 0.2]} s={[0.5, 0.06, 0.12]} color={C.yellow} shadow={false} />
          <Box p={[-0.6, 1.08, 0.1]} s={[0.36, 0.1, 0.2]} color={C.orange} shadow={false} />
        </Fine>
      </group>
      {/* Tour à métaux */}
      <group position={[f[1][0], 0, f[1][1]]}>
        <Box p={[0, 0.45, 0]} s={[2.2, 0.9, 0.7]} color='#4f6b5e' finish={FINISH.paint} />
        <Box p={[0, 1.05, 0]} s={[2.4, 0.15, 0.55]} color={STEEL} finish={FINISH.steel} />
        <Box p={[-0.8, 1.45, 0]} s={[0.7, 0.65, 0.6]} color='#4f6b5e' finish={FINISH.paint} />
        <Cylinder
          p={[0, 1.4, 0]}
          s={[0.12, 1.6, 0.12]}
          r={[0, 0, Math.PI / 2]}
          color={C.metal}
          finish={FINISH.metal}
        />
        <Box p={[0.85, 1.35, 0]} s={[0.4, 0.4, 0.45]} color='#4f6b5e' />
        <Fine>
          <Torus p={[-0.8, 1.3, 0.32]} radius={0.14} tube={0.02} segments={12} color={C.metal} />
          <Box p={[-1.2, 1.6, 0.31]} s={[0.12, 0.12, 0.02]} color={C.red} shadow={false} />
        </Fine>
      </group>
      {/* Perceuse à colonne */}
      <group position={[f[2][0], 0, f[2][1]]}>
        <Box p={[0, 0.1, 0]} s={[0.8, 0.2, 0.8]} color='#4f6b5e' />
        <Rod p={[0, 1.2, -0.2]} s={[0.08, 2.2, 0.08]} color={C.metal} />
        <Box p={[0, 0.95, 0.05]} s={[0.55, 0.06, 0.55]} color={STEEL} />
        <Box p={[0, 2.1, 0]} s={[0.5, 0.45, 0.7]} color='#4f6b5e' finish={FINISH.paint} />
        <Rod p={[0, 1.75, 0.15]} s={[0.04, 0.3, 0.04]} color={C.ink} />
        <Fine>
          {[0, 2.1, 4.2].map((a) => (
            <Rod
              key={a}
              p={[0.3 + Math.cos(a) * 0.1, 2.0, 0.1 + Math.sin(a) * 0.1]}
              s={[0.015, 0.3, 0.015]}
              r={[0, 0, Math.PI / 2]}
              color={C.ink}
              shadow={false}
            />
          ))}
        </Fine>
      </group>
      {/* Panneaux à outils et caisses entre les rangées */}
      {[
        [-1, 4.5],
        [1, -0.5],
        [-1, -5.5],
      ].map(([s, z]) => (
        <Pegboard key={`${s}${z}`} side={s} z={z} />
      ))}
      <Crate p={[W - 1.0, 0, -0.5]} s={0.8} />
      <Crate p={[-W + 1.0, 0, 4.5]} s={0.7} ry={0.4} />
      {/* Air comprimé le long du mur, bandes de sécurité au sol */}
      <Pipe
        a={[-W + 0.25, 4.6, -D + 0.6]}
        b={[-W + 0.25, 4.6, D - 0.6]}
        radius={0.06}
        color={C.blue}
        shadow={false}
      />
      {[-2.1, 2.1].map((x) => (
        <Box key={x} p={[x, 0.02, -1]} s={[0.18, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
      ))}
      {pendants(C.slate)}
    </>
  );
}
