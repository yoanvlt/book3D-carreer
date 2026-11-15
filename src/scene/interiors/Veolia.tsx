/**
 * Veolia : salle de contrôle. Faux plancher technique, pupitres en arc avec écrans et fauteuils,
 * grand écran synoptique en haut du mur du fond (cuves, bassins, réseaux), tuyauteries et vannes
 * le long des murs, colonnes techniques dans les coins, gaines au plafond.
 */
import { Ball, Box, Cylinder, FINISH, Pipe } from '../Primitives';
import { Bevel, Valve } from '../kit';
import { Fine } from '../StaticBatch';
import { color as C, type InteriorMood } from '../../design/tokens';
import { FURNITURE, VEOLIA_COLUMNS } from '../../world/narrative';
import { W, D, WALL_H } from './parts';

const SCREEN = '#0f2a33';
const LINE = '#7fe0d0';
const STEEL = '#3a4752';

/** Synoptique : réseau d'eau en traits lumineux sur fond sombre. */
function Synoptic() {
  const glow = (c: string) => ({ glow: c, glowIntensity: 1.3 });
  return (
    <group position={[0, 6.35, -D + 0.24]}>
      <Box p={[0, 0, 0]} s={[12, 1.9, 0.06]} color={C.ink} shadow={false} />
      <Box p={[0, 0, 0.03]} s={[11.6, 1.6, 0.02]} color={SCREEN} finish={glow(SCREEN)} shadow={false} />
      {[-4.4, -2.6].map((x) => (
        <Box
          key={x}
          p={[x, 0.05, 0.05]}
          s={[1.0, 1.1, 0.01]}
          color={C.white}
          finish={glow('#9fd8ee')}
          shadow={false}
        />
      ))}
      <Box
        p={[0.5, -0.3, 0.05]}
        s={[2.4, 0.5, 0.01]}
        color={C.blue}
        finish={glow('#5fb4e6')}
        shadow={false}
      />
      <Box
        p={[3.6, -0.3, 0.05]}
        s={[1.3, 0.6, 0.01]}
        color={C.teal}
        finish={glow('#59c9b2')}
        shadow={false}
      />
      <Box p={[-1.8, -0.55, 0.05]} s={[8.5, 0.05, 0.01]} color={LINE} finish={glow(LINE)} shadow={false} />
      <Box p={[1.0, 0.45, 0.05]} s={[7, 0.05, 0.01]} color={C.red} finish={glow('#ff8b80')} shadow={false} />
      {[-3.5, -1.2, 2.1, 4.6].map((x) => (
        <Box
          key={x}
          p={[x, -0.05, 0.05]}
          s={[0.05, 1.0, 0.01]}
          color={LINE}
          finish={glow(LINE)}
          shadow={false}
        />
      ))}
      {[-3.5, 0.6, 4.6].map((x, i) => (
        <Ball
          key={x}
          p={[x, 0.45, 0.06]}
          s={[0.08, 0.08, 0.01]}
          color={i === 1 ? C.yellow : '#7cff9a'}
          finish={glow(i === 1 ? C.yellow : '#7cff9a')}
          shadow={false}
        />
      ))}
    </group>
  );
}

export default function VeoliaInterior({ mood }: { mood: InteriorMood }) {
  const f = FURNITURE.veolia;
  return (
    <>
      <Synoptic />
      {/* Pupitres en arc : trois éléments, écrans, claviers, fauteuils. */}
      <group position={[f[0][0], 0, f[0][1]]}>
        {[-2.4, 0, 2.4].map((x, i) => (
          <group key={x} position={[x, 0, Math.abs(x) * 0.12]} rotation={[0, -x * 0.12, 0]}>
            <Bevel p={[0, 0.5, 0]} s={[2.3, 1, 1.2]} color={C.white} radius={0.06} finish={FINISH.plastic} />
            <Box p={[0, 1.05, 0.2]} s={[2.2, 0.08, 0.9]} r={[-0.3, 0, 0]} color={C.ink} />
            {[-0.55, 0.55].map((sx) => (
              <Bevel
                key={sx}
                p={[sx, 1.6, -0.4]}
                s={[1.0, 0.65, 0.06]}
                r={[-0.1, 0, 0]}
                color={SCREEN}
                finish={{ glow: i === 1 ? C.teal : '#3d8fb0', glowIntensity: 0.45 }}
              />
            ))}
            <Fine>
              <Box p={[0, 1.12, 0.35]} s={[0.8, 0.03, 0.25]} r={[-0.3, 0, 0]} color={STEEL} shadow={false} />
              <Ball
                p={[0.7, 1.15, 0.3]}
                s={[0.05, 0.03, 0.05]}
                color={C.red}
                finish={{ glow: C.red, glowIntensity: 1.2 }}
                shadow={false}
              />
            </Fine>
            {/* Fauteuil */}
            <group position={[0, 0, 1.25]}>
              <Cylinder p={[0, 0.25, 0]} s={[0.05, 0.5, 0.05]} color={STEEL} />
              <Bevel
                p={[0, 0.55, 0]}
                s={[0.6, 0.12, 0.6]}
                color={mood.accent}
                radius={0.05}
                finish={FINISH.fabric}
              />
              <Bevel
                p={[0, 0.95, 0.27]}
                s={[0.56, 0.7, 0.1]}
                color={mood.accent}
                radius={0.05}
                finish={FINISH.fabric}
              />
              <Box p={[0, 0.04, 0]} s={[0.6, 0.04, 0.06]} color={C.ink} />
              <Box p={[0, 0.04, 0]} s={[0.06, 0.04, 0.6]} color={C.ink} />
            </group>
          </group>
        ))}
      </group>
      {/* Colonnes techniques dans les coins du fond */}
      {VEOLIA_COLUMNS.map(([x, z]) => (
        <group key={x}>
          <Cylinder p={[x, 3, z]} s={[0.75, 6, 0.75]} color={C.white} finish={FINISH.metal} />
          <Cylinder p={[x, 4.2, z]} s={[0.78, 0.35, 0.78]} color={mood.accent} />
          <Cylinder p={[x, 1.2, z]} s={[0.8, 0.08, 0.8]} color={STEEL} />
          <Valve
            p={[x - Math.sign(x) * 0.85, 1.6, z]}
            r={[0, 0, (Math.sign(x) * Math.PI) / 2]}
            color={mood.accent}
          />
        </group>
      ))}
      {/* Tuyauteries le long des murs, descentes, vannes ; gaines au plafond. */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {[5.6, 6.3].map((y, i) => (
            <Pipe
              key={y}
              a={[s * (W - 0.25), y, -D + 0.5]}
              b={[s * (W - 0.25), y, D - 0.5]}
              radius={0.16 + i * 0.06}
              color={i ? mood.accent : C.metal}
              finish={FINISH.paint}
            />
          ))}
          {[4.5, -0.5, -5.5].map((z) => (
            <group key={z}>
              <Pipe
                a={[s * (W - 0.25), 5.6, z]}
                b={[s * (W - 0.25), 0.4, z]}
                radius={0.1}
                color={C.blue}
                finish={FINISH.paint}
              />
              <Valve p={[s * (W - 0.5), 1.8, z]} r={[0, 0, (s * Math.PI) / 2]} size={0.8} color={C.blue} />
              <Fine>
                <Box
                  p={[s * (W - 0.3), 2.6, z + 0.35]}
                  s={[0.02, 0.3, 0.5]}
                  color={C.yellow}
                  shadow={false}
                />
              </Fine>
            </group>
          ))}
        </group>
      ))}
      {[-3, 3].map((x) => (
        <group key={x}>
          <Box
            p={[x, WALL_H - 0.35, -1]}
            s={[1.0, 0.55, D * 2 - 3]}
            color={C.concrete}
            finish={FINISH.cladding}
          />
          {[-8, -3, 2, 7].map((z) => (
            <Box
              key={z}
              p={[x, WALL_H - 0.64, z]}
              s={[0.8, 0.04, 0.5]}
              color={C.lamp}
              finish={{ glow: C.lamp, glowIntensity: 1.2 }}
              shadow={false}
            />
          ))}
        </group>
      ))}
      {[-2.1, 2.1].map((x) => (
        <Box key={x} p={[x, 0.02, -1]} s={[0.14, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
      ))}
    </>
  );
}
