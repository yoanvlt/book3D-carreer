/**
 * Projet 1 : le pavillon de verre et d'acier. Trois plateaux vitrés décalés sur une ossature
 * d'acier apparente (poteaux, poutres de rive, croix de contreventement), tour de service orange
 * coiffée d'antennes, grand auvent en porte-à-faux au-dessus de l'entrée. Au rez-de-chaussée, un
 * verre clair laisse voir les prototypes exposés. Emprise 15 × 12, porte en z = 6,5.
 */
import { Ball, Beam, Box, Cylinder, Dome, FINISH, GLASS, Pipe, Rod, Sign } from '../Primitives';
import { Fine } from '../StaticBatch';
import { Planter, Railing, RoofUnit, SolarPanel, Vent, Volume, WallLamp, Windows } from '../kit';
import { color as C, scenePlaceColor } from '../../design/tokens';
import { place } from '../../content';

const STEEL = '#2f3b45';
const TOWER = '#f08a4b';
const PALE = '#8cc6dc';
const DEEP = '#5f9fbe';

/** Ossature d'un plateau : poteaux aux angles et au tiers, poutres de rive. */
function Frame({ w, d, h }: { w: number; d: number; h: number }) {
  const xs = [-w / 2, -w / 6, w / 6, w / 2];
  const zs = [-d / 2, d / 2];
  return (
    <>
      {xs.flatMap((x) =>
        zs.map((z) => (
          <Box key={`${x}${z}`} p={[x, h / 2, z]} s={[0.24, h, 0.24]} color={STEEL} finish={FINISH.steel} />
        )),
      )}
      {[-w / 2, w / 2].map((x) => (
        <Box key={x} p={[x, h / 2, 0]} s={[0.24, h, 0.24]} color={STEEL} finish={FINISH.steel} />
      ))}
      {zs.map((z) => (
        <Box key={z} p={[0, h - 0.2, z]} s={[w + 0.3, 0.4, 0.28]} color={STEEL} finish={FINISH.steel} />
      ))}
      {[-w / 2, w / 2].map((x) => (
        <Box key={x} p={[x, h - 0.2, 0]} s={[0.28, 0.4, d + 0.3]} color={STEEL} finish={FINISH.steel} />
      ))}
      <Fine>
        {xs.map((x) => (
          <Box key={x} p={[x, h - 0.45, d / 2 + 0.02]} s={[0.4, 0.12, 0.08]} color={C.metal} shadow={false} />
        ))}
      </Fine>
    </>
  );
}

/** Prototypes exposés derrière la vitrine du rez-de-chaussée. */
function Prototypes() {
  return (
    <>
      {/* Bras robotisé */}
      <group position={[-2.2, 0.3, 3]}>
        <Box p={[0, 0.4, 0]} s={[1.2, 0.8, 1]} color={C.white} />
        <Cylinder p={[0, 0.95, 0]} s={[0.35, 0.3, 0.35]} color={C.ink} />
        <Pipe a={[0, 1.1, 0]} b={[0.5, 2.1, 0]} radius={0.12} color={scenePlaceColor['project-1']} />
        <Ball p={[0.5, 2.1, 0]} s={[0.16, 0.16, 0.16]} color={C.ink} />
        <Pipe a={[0.5, 2.1, 0]} b={[1.2, 1.8, 0]} radius={0.09} color={scenePlaceColor['project-1']} />
        <Box p={[1.28, 1.7, 0]} s={[0.12, 0.3, 0.3]} color={C.ink} />
      </group>
      {/* Drone sur son socle */}
      <group position={[1.4, 0.3, 3.2]}>
        <Box p={[0, 0.5, 0]} s={[1, 1, 1]} color={C.white} />
        <Box p={[0, 1.65, 0]} s={[0.45, 0.16, 0.45]} color={C.ink} />
        {[0.785, 2.356, 3.927, 5.498].map((a) => (
          <group key={a}>
            <Box
              p={[Math.cos(a) * 0.35, 1.65, Math.sin(a) * 0.35]}
              s={[0.45, 0.05, 0.06]}
              r={[0, -a, 0]}
              color={C.ink}
            />
            <Cylinder
              p={[Math.cos(a) * 0.55, 1.72, Math.sin(a) * 0.55]}
              s={[0.22, 0.02, 0.22]}
              color={DEEP}
            />
          </group>
        ))}
      </group>
      {/* Rover */}
      <group position={[4.4, 0.3, 2.9]}>
        <Box p={[0, 0.55, 0]} s={[1.1, 0.4, 0.8]} color={C.yellow} />
        {[-0.4, 0.4].flatMap((x) =>
          [-0.45, 0.45].map((z) => (
            <Cylinder
              key={`${x}${z}`}
              p={[x, 0.25, z]}
              s={[0.22, 0.12, 0.22]}
              r={[Math.PI / 2, 0, 0]}
              color={C.ink}
            />
          )),
        )}
        <Rod p={[0.3, 1.0, 0]} s={[0.03, 0.5, 0.03]} color={C.ink} />
        <Box p={[0.3, 1.28, 0]} s={[0.24, 0.14, 0.14]} color={C.white} />
      </group>
      {/* Imprimante 3D, écrans au mur du fond */}
      <group position={[5.6, 0.3, -2.5]}>
        <Box p={[0, 0.5, 0]} s={[1.2, 1, 1]} color={C.slate} />
        <Box p={[0, 1.55, 0]} s={[1.1, 1.1, 0.9]} color={C.ink} />
        <Box p={[0, 1.55, 0.46]} s={[0.9, 0.9, 0.02]} color={PALE} finish={GLASS} />
      </group>
      {[-1.5, 1.5].map((x) => (
        <Box
          key={x}
          p={[x, 2.4, -5.25]}
          s={[2.4, 1.3, 0.06]}
          color='#16324a'
          finish={{ glow: scenePlaceColor['project-1'], glowIntensity: 0.6 }}
          shadow={false}
        />
      ))}
    </>
  );
}

export default function Innovation() {
  return (
    <>
      {/* Tour de service : bardage métallique orange, fentes vitrées, antennes. */}
      <Volume
        p={[-5.9, 0, -1.6]}
        w={3.2}
        d={8}
        h={14.6}
        color={TOWER}
        finish={FINISH.cladding}
        plinth={{ h: 0.6, color: C.slate }}
        parapet={{ h: 0.4, color: TOWER, coping: C.white }}
      />
      <Windows
        p={[-7.52, 7.6, -1.6]}
        r={[0, -Math.PI / 2, 0]}
        w={1.2}
        h={12.4}
        rows={9}
        glass={C.glassDeep}
        frame={C.white}
        bar={0.1}
        sill={false}
        lit={[3, 6]}
      />
      {[4.4, 8.8, 13.2].map((y) => (
        <Box key={y} p={[-5.9, y, 2.44]} s={[3.25, 0.2, 0.12]} color={C.white} />
      ))}
      <Vent p={[-5.9, 2.2, 2.4]} w={1.4} h={0.9} />
      <group position={[-5.9, 15, -2.4]}>
        <Box p={[0, 0.2, 0]} s={[1.2, 0.4, 1.2]} color={C.slate} />
        {[-0.35, 0.35].flatMap((x) =>
          [-0.35, 0.35].map((z) => (
            <Rod key={`${x}${z}`} p={[x, 2.6, z]} s={[0.04, 4.8, 0.04]} color={STEEL} />
          )),
        )}
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} p={[0, 0.8 + i * 0.6, 0]} s={[0.74, 0.04, 0.74]} color={STEEL} shadow={false} />
        ))}
        <Rod p={[0, 5.6, 0]} s={[0.03, 1.6, 0.03]} color={STEEL} />
        <Dome p={[0.55, 3.2, 0.3]} s={[0.6, 0.22, 0.6]} r={[-1.2, 0.6, 0]} color={C.white} />
        <Dome p={[-0.5, 4.2, -0.2]} s={[0.45, 0.16, 0.45]} r={[-1.1, -2.2, 0]} color={C.white} />
        <Fine>
          <Ball
            p={[0, 6.45, 0]}
            s={[0.09, 0.09, 0.09]}
            color={C.red}
            finish={{ glow: C.red, glowIntensity: 1.5 }}
          />
          {[1.2, 2.4].map((y) => (
            <Rod key={y} p={[0.5, 3 + y, -0.4]} s={[0.015, 1.2, 0.015]} color={STEEL} shadow={false} />
          ))}
        </Fine>
      </group>

      {/* Rez-de-chaussée : vitrine en verre clair, plancher, mur du fond, prototypes. */}
      <group position={[1.45, 0, 0.05]}>
        <Box p={[0, 0.15, 0]} s={[11.8, 0.3, 11.4]} color={C.slate} />
        <Box p={[0, 0.32, 0]} s={[11.4, 0.04, 11]} color='#e9eef1' finish={FINISH.paving} shadow={false} />
        <Box p={[0, 2.4, -5.45]} s={[11.4, 4.2, 0.2]} color={C.white} />
        <Box p={[0, 2.45, 0]} s={[11.5, 4.3, 11.1]} color={PALE} finish={FINISH.clearGlass} shadow={false} />
        <Frame w={11.5} d={11.1} h={4.6} />
        {[-2.9, 0, 2.9].map((x) => (
          <Box key={x} p={[x, 2.45, 5.56]} s={[0.08, 4.3, 0.1]} color={STEEL} shadow={false} />
        ))}
      </group>
      <Prototypes />

      {/* Deux plateaux vitrés décalés, dalles de béton clair et filets lumineux. */}
      {[0, 1].map((i) => (
        <group key={i} position={[i ? 1.1 : 1.9, 4.6 + i * 4.4, 0]} rotation={[0, i ? 0.08 : -0.12, 0]}>
          <Box p={[0, 0.18, 0]} s={[11.9, 0.36, 10.2]} color={C.white} finish={FINISH.concrete} />
          <Box p={[0, 2.3, 0]} s={[11.2, 3.9, 9.4]} color={i ? PALE : DEEP} finish={GLASS} />
          <Windows
            p={[0, 2.3, 4.72]}
            w={11.2}
            h={3.8}
            cols={7}
            rows={2}
            glass={i ? PALE : DEEP}
            frame={STEEL}
            bar={0.1}
            sill={false}
            lit={i ? [9] : [3, 10]}
          />
          <Windows
            p={[5.62, 2.3, 0]}
            r={[0, Math.PI / 2, 0]}
            w={9.4}
            h={3.8}
            cols={5}
            rows={2}
            glass={PALE}
            frame={STEEL}
            bar={0.1}
            sill={false}
          />
          <Windows
            p={[0, 2.3, -4.72]}
            r={[0, Math.PI, 0]}
            w={11.2}
            h={3.8}
            cols={7}
            glass={PALE}
            frame={STEEL}
            bar={0.1}
            sill={false}
          />
          <Frame w={11.2} d={9.4} h={4.4} />
          <Box
            p={[0, 0.02, 5.08]}
            s={[11.6, 0.05, 0.08]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 0.9 }}
            shadow={false}
          />
          <Railing a={[-5.7, 0.36, 5]} b={[5.7, 0.36, 5]} color={STEEL} />
          {/* Brise-soleil horizontaux sur la face sud */}
          {[3.2, 3.7].map((y) => (
            <Box key={y} p={[0, y, 4.95]} s={[11.2, 0.06, 0.5]} color={C.white} shadow={false} />
          ))}
        </group>
      ))}
      <Box p={[1.5, 13.25, 0]} s={[11.6, 0.36, 10]} color={C.white} finish={FINISH.concrete} />

      {/* Contreventement en croix sur la façade est. */}
      <Beam a={[7.35, 0.3, -5.3]} b={[7.35, 13.2, 5.3]} width={0.32} color={TOWER} />
      <Beam a={[7.35, 0.3, 5.3]} b={[7.35, 13.2, -5.3]} width={0.22} color={STEEL} />
      <Fine>
        <Box p={[7.35, 6.75, 0]} s={[0.5, 0.5, 0.5]} color={STEEL} />
      </Fine>

      {/* Auvent en porte-à-faux : grande dalle blanche, rive acier, tirants vers la tour. */}
      <group position={[1.6, 13.7, 1.6]}>
        <Box p={[0, 0, 0]} s={[12.4, 0.34, 13.4]} color={C.white} finish={FINISH.paint} />
        <Box p={[0, -0.04, 6.72]} s={[12.5, 0.44, 0.1]} color={STEEL} finish={FINISH.steel} />
        <Box
          p={[0, -0.2, 6.62]}
          s={[12.2, 0.05, 0.06]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 1 }}
          shadow={false}
        />
        {[-3.5, 3.5].map((x) => (
          <Pipe key={x} a={[-7.5, 1.1, -3.6]} b={[x, 0.2, 6.4]} radius={0.04} color={STEEL} />
        ))}
        <SolarPanel p={[2, 0.17, -2.5]} w={2.6} />
        <SolarPanel p={[-1.2, 0.17, -2.5]} w={2.6} />
        <SolarPanel p={[2, 0.17, 0.2]} w={2.6} />
        <RoofUnit p={[4.6, 0.17, -4.8]} />
      </group>
      <Sign
        text={place('project-1').enseigne}
        p={[1.6, 13.66, 8.39]}
        s={[6, 0.42]}
        color={C.white}
        bg={STEEL}
        rounded={false}
      />

      <Planter p={[-3.6, 0, 7.4]} w={2.4} color={STEEL} />
      <Planter p={[4.2, 0, 7.4]} w={2.4} color={STEEL} />
      <WallLamp p={[-2.1, 2.7, 5.65]} />
      <WallLamp p={[2.1, 2.7, 5.65]} />
    </>
  );
}
