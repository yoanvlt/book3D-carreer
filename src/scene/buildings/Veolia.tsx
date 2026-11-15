/**
 * Veolia : la station de traitement d'eau. Bâtiment technique blanc à bandeau rouge, deux cuves
 * sur la toiture reliées par une passerelle et desservies par des échelles à crinoline ; devant,
 * un bassin rectangulaire et un clarificateur circulaire de part et d'autre du hall d'entrée,
 * reliés par des canalisations à vannes et brides ; signalétique technique. Emprise 17 × 12,
 * porte en z = 6,5. L'eau des bassins est animée à part (scene/Life.tsx).
 */
import { Box, Cone, Cylinder, FINISH, Pipe, Rod, Sign, Torus, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import {
  AirCon,
  CageLadder,
  Downpipe,
  GravelRoof,
  Railing,
  TechBox,
  Valve,
  Flange,
  Vent,
  Volume,
  Walkway,
  WallLamp,
  WindowRow,
} from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

const RED = '#d64a3f';
const WHITE = '#f4f2ec';
const CONCRETE = '#cfd3d4';
const STEEL = '#2f3b45';
const PIPE_BLUE = '#3f7fa8';

/** Bandes de danger jaunes et noires le long d'une arête (axe x). */
function Hazard({ x0, x1, y, z }: { x0: number; x1: number; y: number; z: number }) {
  const n = Math.max(2, Math.round((x1 - x0) / 0.4));
  return (
    <>
      {times(n, (i) => (
        <Box
          key={i}
          p={[x0 + ((x1 - x0) * (i + 0.5)) / n, y, z]}
          s={[(x1 - x0) / n, 0.14, 0.04]}
          color={i % 2 ? C.ink : C.yellow}
          shadow={false}
        />
      ))}
    </>
  );
}

/** Cuve verticale : virole, cerclages rouges, toit conique, échelle, garde-corps sommital. */
function Tank({ x, z, color, ladder }: { x: number; z: number; color: string; ladder: number }) {
  return (
    <group position={[x, 5.2, z]}>
      <Cylinder p={[0, 0.15, 0]} s={[2.6, 0.3, 2.6]} color={CONCRETE} finish={FINISH.concrete} />
      <Cylinder p={[0, 3.8, 0]} s={[2.35, 7, 2.35]} color={color} finish={FINISH.cladding} />
      {[1.6, 4.4].map((y) => (
        <Cylinder key={y} p={[0, y, 0]} s={[2.4, 0.4, 2.4]} color={RED} finish={FINISH.paint} />
      ))}
      <Cylinder p={[0, 7.35, 0]} s={[2.45, 0.15, 2.45]} color={WHITE} />
      <Cone p={[0, 7.85, 0]} s={[2.45, 0.9, 2.45]} color={WHITE} finish={FINISH.steel} />
      <Torus p={[0, 8.45, 0]} r={[Math.PI / 2, 0, 0]} radius={2.3} tube={0.035} segments={36} color={STEEL} />
      {times(12, (i, n) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <Rod key={i} p={[Math.sin(a) * 2.3, 7.95, Math.cos(a) * 2.3]} s={[0.03, 1, 0.03]} color={STEEL} />
        );
      })}
      <group rotation={[0, ladder, 0]}>
        <CageLadder p={[0, 0.3, 2.35]} h={7.1} color={STEEL} />
      </group>
      <Fine>
        <Cylinder p={[0.9, 8.4, 0.6]} s={[0.25, 0.4, 0.25]} color={STEEL} />
        <Box p={[0, 3.6, 2.36]} s={[0.9, 0.5, 0.04]} color={C.white} shadow={false} />
      </Fine>
    </group>
  );
}

export default function Veolia() {
  return (
    <>
      {/* Bâtiment technique : panneaux de béton blancs, bandeau rouge, fenêtres à stores. */}
      <Volume
        p={[0, 0, -3.25]}
        w={17}
        d={5.5}
        h={5.2}
        color={WHITE}
        finish={FINISH.concrete}
        plinth={{ h: 0.7, color: RED, finish: FINISH.paint }}
        bands={[3.6]}
        bandColor={RED}
      />
      <WindowRow
        p={[-5.6, 2.1, -0.5]}
        count={2}
        spacing={2.4}
        w={1.5}
        h={1.5}
        cols={2}
        frame={C.white}
        wall={WHITE}
        variant='blind'
        accent={RED}
        lit={[1]}
      />
      <WindowRow
        p={[5.6, 2.1, -0.5]}
        count={2}
        spacing={2.4}
        w={1.5}
        h={1.5}
        cols={2}
        frame={C.white}
        wall={WHITE}
        variant='blind'
        accent={RED}
      />
      <WindowRow
        p={[0, 2.1, -6]}
        ry={Math.PI}
        count={5}
        spacing={3}
        w={1.4}
        h={1.3}
        cols={2}
        frame={C.white}
        wall={WHITE}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <WindowRow
            p={[s * 8.5, 2.1, -3.25]}
            ry={(s * Math.PI) / 2}
            count={2}
            spacing={2.4}
            w={1.3}
            h={1.3}
            cols={2}
            frame={C.white}
            wall={WHITE}
          />
          <Downpipe p={[s * 8.2, 0, -6]} ry={Math.PI} h={5.2} />
        </group>
      ))}
      <Vent p={[-2.6, 4.4, -6]} ry={Math.PI} w={1.2} h={0.6} />
      <AirCon p={[3.8, 4.3, -6]} ry={Math.PI} />
      <TechBox p={[7.4, 0, -6.02]} ry={Math.PI} color={C.concrete} />
      <GravelRoof
        y={5.2}
        w={17}
        d={5.5}
        z={-3.25}
        wall={WHITE}
        units={[[-7.2, -1.2]]}
        vents={[
          [7.6, -1.8],
          [-0.3, -1.4],
        ]}
      />
      <Sign text={place('veolia').enseigne} p={[-5.6, 4.35, -0.46]} s={[4.6, 0.9]} color={RED} bg={C.white} />

      {/* Cuves, passerelle entre les sommets. */}
      <Tank x={-4.4} z={-3.2} color='#d9e4df' ladder={Math.PI * 0.75} />
      <Tank x={4.4} z={-3.2} color='#ece0c4' ladder={-Math.PI * 0.75} />
      <Walkway a={[-2.05, 12.6, -3.2]} b={[2.05, 12.6, -3.2]} width={1.0} color={C.metal} rail={RED} />

      {/* Hall d'entrée. */}
      <Volume
        p={[0, 0, 2.55]}
        w={5.2}
        d={6.1}
        h={4.6}
        color={WHITE}
        finish={FINISH.concrete}
        plinth={{ h: 0.7, color: RED, finish: FINISH.paint }}
        parapet={{ h: 0.35, color: WHITE, coping: RED }}
      />
      <Sign text={place('veolia').enseigne} p={[0, 4.45, 5.62]} s={[3.4, 0.55]} color={RED} bg={C.white} />
      <WallLamp p={[-2.2, 2.7, 5.62]} />
      <WallLamp p={[2.2, 2.7, 5.62]} />

      {/* Bassin rectangulaire : voiles de béton, eau, passerelle, bandes de danger. */}
      <group position={[-5.75, 0, 2.6]}>
        {[
          [0, 2.85, 5.4, 0.3],
          [0, -2.85, 5.4, 0.3],
          [2.55, 0, 0.3, 5.4],
          [-2.55, 0, 0.3, 5.4],
        ].map(([x, z, w, d], i) => (
          <Box key={i} p={[x, 0.7, z]} s={[w, 1.4, d]} color={CONCRETE} finish={FINISH.concrete} />
        ))}
        <Box p={[0, 0.5, 0]} s={[4.8, 1, 5.4]} color='#557d86' finish={FINISH.concrete} shadow={false} />
        <Hazard x0={-2.7} x1={2.7} y={1.33} z={3.02} />
        <Walkway a={[-2.7, 1.45, 0.4]} b={[2.7, 1.45, 0.4]} width={0.9} color={C.metal} rail={RED} />
        <Railing a={[-2.65, 1.4, 2.9]} b={[2.65, 1.4, 2.9]} color={RED} />
        <Sign
          text='BASSIN 1'
          p={[0, 0.85, 3.02]}
          s={[1.6, 0.36]}
          color={C.white}
          bg={STEEL}
          rounded={false}
        />
      </group>

      {/* Clarificateur circulaire : cuve, goulotte, pont racleur, colonne centrale. */}
      <group position={[5.8, 0, 2.7]}>
        <Cylinder p={[0, 0.7, 0]} s={[2.6, 1.4, 2.6]} color={CONCRETE} finish={FINISH.concrete} />
        <Torus
          p={[0, 1.42, 0]}
          r={[Math.PI / 2, 0, 0]}
          radius={2.62}
          tube={0.08}
          segments={40}
          color={C.metal}
        />
        <Cylinder p={[0, 1.6, 0]} s={[0.35, 1.2, 0.35]} color={STEEL} />
        <Box p={[1.2, 1.75, 0]} s={[2.6, 0.12, 0.7]} color={C.metal} finish={FINISH.slats} />
        <Railing a={[-0.1, 1.8, 0.35]} b={[2.5, 1.8, 0.35]} h={0.9} color={RED} />
        <Box p={[2.45, 1.0, 0]} s={[0.2, 1.5, 0.5]} color={STEEL} />
        <Sign
          text='CLARIFICATEUR'
          p={[0, 1.1, 2.62]}
          s={[1.8, 0.32]}
          color={C.white}
          bg={STEEL}
          rounded={false}
        />
      </group>

      {/* Canalisations le long de la façade, vannes, brides, supports. */}
      {(
        [
          [0.75, RED, 0.2],
          [1.35, PIPE_BLUE, 0.16],
        ] as const
      ).map(([y, color, r]) => (
        <group key={y}>
          <Pipe a={[-8.3, y, -0.2]} b={[-2.7, y, -0.2]} radius={r} color={color} finish={FINISH.paint} />
          <Pipe a={[2.7, y, -0.2]} b={[8.3, y, -0.2]} radius={r} color={color} finish={FINISH.paint} />
          {[-7, -4, 4, 7].map((x) => (
            <Flange key={x} p={[x, y, -0.2]} r={[0, 0, Math.PI / 2]} radius={r} />
          ))}
        </group>
      ))}
      <Pipe a={[-3.2, 0.75, -0.2]} b={[-3.2, 0.75, 1.2]} radius={0.2} color={RED} finish={FINISH.paint} />
      <Pipe
        a={[3.4, 1.35, -0.2]}
        b={[3.4, 1.35, 1.6]}
        radius={0.16}
        color={PIPE_BLUE}
        finish={FINISH.paint}
      />
      <Valve p={[-5.5, 0.95, -0.2]} color={RED} />
      <Valve p={[6.2, 1.5, -0.2]} color={PIPE_BLUE} />
      <Fine>
        {[-7.8, -6, -4.6, 4.6, 6, 7.8].map((x) => (
          <group key={x}>
            <Box p={[x, 0.3, -0.2]} s={[0.1, 0.6, 0.3]} color={STEEL} shadow={false} />
            <Box p={[x, 1.05, -0.2]} s={[0.08, 0.08, 0.5]} color={STEEL} shadow={false} />
          </group>
        ))}
        {/* Flèches de sens d'écoulement */}
        {[-6.5, 5.2].map((x, i) => (
          <Box key={x} p={[x, i ? 1.55 : 0.98, -0.02]} s={[0.4, 0.08, 0.02]} color={C.white} shadow={false} />
        ))}
      </Fine>
    </>
  );
}
