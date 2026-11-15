/**
 * Veolia : la station de traitement d'eau. Hall d'entrée au centre, aile technique à l'arrière,
 * cour de service à droite où deux cuves reposent sur un socle de béton, reliées à l'aile par une
 * passerelle et des canalisations à brides ; devant, un bassin rectangulaire et un clarificateur
 * circulaire. Une seule enseigne, au-dessus de la porte. L'eau est animée à part (scene/Life.tsx).
 * Emprise 17 × 12 ; vantaux de la porte en z = 6,5, façade du hall en z = 5,9.
 */
import { Box, Cone, Cylinder, FINISH, Pipe, Rod, Sign, Torus, times } from '../Primitives';
import { Fine } from '../StaticBatch';
import {
  AirCon,
  CageLadder,
  DoorSet,
  Downpipe,
  Flange,
  GravelRoof,
  Parapet,
  Railing,
  RoofUnit,
  TechBox,
  Valve,
  Vent,
  Volume,
  Walkway,
  WallLamp,
  Window,
  WindowRow,
} from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

const RED = '#d64a3f';
const WHITE = '#f4f2ec';
const CONCRETE = '#cfd3d4';
const STEEL = '#2f3b45';
const PIPE_BLUE = '#3f7fa8';
/** Cuves : centres (x, z), rayon, hauteur au-dessus du socle. */
const TANKS: [number, number][] = [
  [4.35, -3.75],
  [7.05, -3.75],
];
const TANK = { r: 1.15, h: 9.2, socle: 0.7 };
/** Bassin rectangulaire et clarificateur (centres), repris par l'eau animée de Life.tsx. */
export const BASIN = { x: -5.75, z: 2.25, w: 4.8, d: 5.4 };
export const CLARIFIER = { x: 5.7, z: 2.4, r: 2.5 };

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

/** Cuve verticale sur le socle : virole, cerclages, toit conique, garde-corps, piquages. */
function Tank({ x, z, color, ladder }: { x: number; z: number; color: string; ladder: number }) {
  const y0 = TANK.socle;
  return (
    <group position={[x, y0, z]}>
      <Cylinder
        p={[0, 0.12, 0]}
        s={[TANK.r + 0.15, 0.24, TANK.r + 0.15]}
        color={STEEL}
        finish={FINISH.steel}
      />
      <Cylinder
        p={[0, TANK.h / 2 + 0.2, 0]}
        s={[TANK.r, TANK.h, TANK.r]}
        color={color}
        finish={FINISH.cladding}
      />
      {[2, 5.2, 8].map((y) => (
        <Cylinder
          key={y}
          p={[0, y, 0]}
          s={[TANK.r + 0.04, 0.35, TANK.r + 0.04]}
          color={RED}
          finish={FINISH.paint}
        />
      ))}
      <Cylinder p={[0, TANK.h + 0.25, 0]} s={[TANK.r + 0.08, 0.12, TANK.r + 0.08]} color={WHITE} />
      <Cone
        p={[0, TANK.h + 0.65, 0]}
        s={[TANK.r + 0.08, 0.7, TANK.r + 0.08]}
        color={WHITE}
        finish={FINISH.steel}
      />
      <Torus
        p={[0, TANK.h + 1.25, 0]}
        r={[Math.PI / 2, 0, 0]}
        radius={TANK.r}
        tube={0.03}
        segments={28}
        color={STEEL}
      />
      {times(8, (i, n) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <Rod
            key={i}
            p={[Math.sin(a) * TANK.r, TANK.h + 0.8, Math.cos(a) * TANK.r]}
            s={[0.03, 0.9, 0.03]}
            color={STEEL}
          />
        );
      })}
      <group rotation={[0, ladder, 0]}>
        <CageLadder p={[0, 0.25, TANK.r]} h={TANK.h} color={STEEL} />
      </group>
      {/* Piquage vers l'aile technique */}
      <Cylinder p={[-TANK.r - 0.1, 1.6, 0]} s={[0.32, 0.2, 0.32]} r={[0, 0, Math.PI / 2]} color={STEEL} />
      <Fine>
        <Box p={[0, 3.4, TANK.r + 0.01]} s={[0.8, 0.5, 0.02]} color={C.white} shadow={false} />
        <Box p={[0, 3.4, TANK.r + 0.02]} s={[0.6, 0.08, 0.02]} color={PIPE_BLUE} shadow={false} />
      </Fine>
    </group>
  );
}

export default function Veolia() {
  return (
    <>
      {/* Aile technique : panneaux de béton blancs, soubassement rouge, bandeau, fenêtres en bande. */}
      <Volume
        p={[-2.85, 0, -3.75]}
        w={11.3}
        d={4.5}
        h={5.4}
        color={WHITE}
        finish={FINISH.concrete}
        plinth={{ h: 0.7, color: RED, finish: FINISH.paint }}
        bands={[3.7]}
        bandColor={RED}
      />
      <GravelRoof
        x={-2.85}
        z={-3.75}
        y={5.4}
        w={11.3}
        d={4.5}
        wall={WHITE}
        units={[
          [-3.2, -0.6],
          [-1.2, -0.6],
        ]}
        vents={[
          [2.5, 1],
          [4.4, -1.2],
        ]}
        skylights={[[1.6, 0.4]]}
      />
      {/* Chemin de câbles sur la toiture, de l'aile vers les cuves */}
      <Box p={[0.4, 6.1, -2.4]} s={[5.6, 0.12, 0.35]} color={C.metal} finish={FINISH.slats} />
      {[-2, 0.4, 2.6].map((x) => (
        <Box key={x} p={[x, 5.75, -2.4]} s={[0.08, 0.6, 0.3]} color={STEEL} />
      ))}
      <WindowRow
        p={[-2.85, 2.2, -6]}
        ry={Math.PI}
        count={4}
        spacing={2.6}
        w={1.4}
        h={1.3}
        cols={2}
        frame={C.white}
        wall={WHITE}
        variant='blind'
        accent={RED}
        lit={[2]}
      />
      <WindowRow
        p={[-8.5, 2.2, -3.75]}
        ry={-Math.PI / 2}
        count={2}
        spacing={2.2}
        w={1.2}
        h={1.3}
        cols={2}
        frame={C.white}
        wall={WHITE}
      />
      {/* Accès de service à l'arrière : porte à auvent, rideau de livraison, local poubelles. */}
      <DoorSet
        p={[-7.2, 0, -6]}
        ry={Math.PI}
        w={1.0}
        h={2.2}
        leaf={STEEL}
        glazed={false}
        canopy='flat'
        canopyColor={RED}
        number='S1'
        lamps={false}
      />
      <group position={[0.8, 0, -6.02]} rotation={[0, Math.PI, 0]}>
        <Box p={[0, 1.6, 0.04]} s={[2.8, 3.2, 0.06]} color={C.concrete} finish={FINISH.slats} />
        <Box p={[0, 3.35, 0.12]} s={[3.1, 0.3, 0.25]} color={STEEL} />
        {[-1, 1].map((s) => (
          <Box key={s} p={[s * 1.47, 1.6, 0.08]} s={[0.12, 3.2, 0.14]} color={STEEL} />
        ))}
      </group>
      <group position={[-4.2, 0, -6.5]}>
        <Box p={[0, 0.7, 0]} s={[2.4, 1.4, 1.1]} color={CONCRETE} finish={FINISH.concrete} />
        <Box p={[0, 1.42, 0]} s={[2.5, 0.06, 1.2]} color={STEEL} />
        <Fine>
          {[-0.6, 0, 0.6].map((x, i) => (
            <Box
              key={x}
              p={[x, 0.55, -0.6]}
              s={[0.5, 0.9, 0.05]}
              color={[C.yellow, C.teal, '#5b6770'][i]}
              shadow={false}
            />
          ))}
        </Fine>
      </group>
      <Vent p={[-6.2, 4.4, -6]} ry={Math.PI} w={1.2} h={0.6} />
      <AirCon p={[-0.8, 4.3, -6]} ry={Math.PI} />
      <TechBox p={[-8.52, 0, -2.4]} ry={-Math.PI / 2} />
      <Downpipe p={[-8.2, 0, -6]} ry={Math.PI} h={5.4} />
      <Downpipe p={[2.5, 0, -6]} ry={Math.PI} h={5.4} />

      {/* Hall d'entrée : béton blanc, bandeau rouge, vitrages latéraux, toiture en partie végétalisée. */}
      <Volume
        p={[0, 0, 2.2]}
        w={5.6}
        d={7.4}
        h={5}
        color={WHITE}
        finish={FINISH.concrete}
        plinth={{ h: 0.7, color: RED, finish: FINISH.paint }}
        bands={[4.2]}
        bandColor={RED}
      />
      <Parapet y={5} w={5.6} d={7.4} h={0.4} color={WHITE} coping={RED} />
      <group position={[0, 0, 2.2]}>
        <Box p={[0, 5.06, 0.6]} s={[5, 0.12, 4.4]} color={C.leaf} finish={FINISH.gravel} shadow={false} />
        <Box p={[0, 5.06, -2.4]} s={[5, 0.1, 2]} color={C.stone} finish={FINISH.gravel} shadow={false} />
        <RoofUnit p={[1.2, 5.0, -2.6]} s={[1.4, 0.7, 1]} />
      </group>
      {[-1, 1].map((s) => (
        <WindowRow
          key={s}
          p={[s * 2.8, 2.4, 2.6]}
          ry={(s * Math.PI) / 2}
          count={2}
          spacing={2.4}
          w={1.4}
          h={2.2}
          cols={2}
          rows={2}
          frame={C.white}
          wall={WHITE}
          lit={s > 0 ? [0] : []}
        />
      ))}
      <Sign text={place('veolia').enseigne} p={[0, 4.55, 5.93]} s={[4.4, 0.7]} color={RED} bg={C.white} />
      <WallLamp p={[-2.1, 2.7, 5.92]} />
      <WallLamp p={[2.1, 2.7, 5.92]} />

      {/* Cour de service : socle des cuves, cuves, passerelle, canalisations vers l'aile. */}
      <Box
        p={[5.7, TANK.socle / 2, -3.75]}
        s={[5.4, TANK.socle, 4.3]}
        color={CONCRETE}
        finish={FINISH.concrete}
      />
      <Hazard x0={3.0} x1={8.4} y={TANK.socle - 0.05} z={-1.58} />
      <Tank x={TANKS[0][0]} z={TANKS[0][1]} color='#d9e4df' ladder={-Math.PI / 2 - 0.4} />
      <Tank x={TANKS[1][0]} z={TANKS[1][1]} color='#ece0c4' ladder={Math.PI / 2 + 0.4} />
      <Walkway
        a={[TANKS[0][0] + TANK.r - 0.1, TANK.socle + TANK.h + 0.3, -3.75]}
        b={[TANKS[1][0] - TANK.r + 0.1, TANK.socle + TANK.h + 0.3, -3.75]}
        width={0.9}
        color={C.metal}
        rail={RED}
      />
      {(
        [
          [2.2, RED, 0.2],
          [3.2, PIPE_BLUE, 0.16],
        ] as const
      ).map(([y, color, r]) => (
        <group key={y}>
          <Pipe
            a={[2.8, y, -3.75]}
            b={[TANKS[0][0] - TANK.r, y, -3.75]}
            radius={r}
            color={color}
            finish={FINISH.paint}
          />
          <Flange p={[3.0, y, -3.75]} r={[0, 0, Math.PI / 2]} radius={r} />
        </group>
      ))}
      <Valve p={[3.2, 2.55, -3.75]} color={RED} />
      {/* Bassin rectangulaire */}
      <group position={[BASIN.x, 0, BASIN.z]}>
        {(
          [
            [0, BASIN.d / 2 + 0.15, BASIN.w + 0.6, 0.3],
            [0, -BASIN.d / 2 - 0.15, BASIN.w + 0.6, 0.3],
            [BASIN.w / 2 + 0.15, 0, 0.3, BASIN.d],
            [-BASIN.w / 2 - 0.15, 0, 0.3, BASIN.d],
          ] as const
        ).map(([x, z, w, d], i) => (
          <Box key={i} p={[x, 0.7, z]} s={[w, 1.4, d]} color={CONCRETE} finish={FINISH.concrete} />
        ))}
        <Box p={[0, 0.5, 0]} s={[BASIN.w, 1, BASIN.d]} color='#557d86' finish={FINISH.concrete} />
        <Hazard x0={-2.7} x1={2.7} y={1.33} z={BASIN.d / 2 + 0.32} />
        <Walkway a={[-2.7, 1.45, 0.3]} b={[2.7, 1.45, 0.3]} width={0.9} color={C.metal} rail={RED} />
        <Railing a={[-2.65, 1.4, BASIN.d / 2 + 0.15]} b={[2.65, 1.4, BASIN.d / 2 + 0.15]} color={RED} />
        <Sign
          text='BASSIN 1'
          p={[0, 0.85, BASIN.d / 2 + 0.31]}
          s={[1.6, 0.36]}
          color={C.white}
          bg={STEEL}
          rounded={false}
        />
        <Pipe a={[2.55, 0.9, -1.2]} b={[2.95, 0.9, -1.2]} radius={0.18} color={RED} finish={FINISH.paint} />
      </group>
      {/* Clarificateur */}
      <group position={[CLARIFIER.x, 0, CLARIFIER.z]}>
        <Cylinder
          p={[0, 0.7, 0]}
          s={[CLARIFIER.r + 0.1, 1.4, CLARIFIER.r + 0.1]}
          color={CONCRETE}
          finish={FINISH.concrete}
        />
        <Torus
          p={[0, 1.42, 0]}
          r={[Math.PI / 2, 0, 0]}
          radius={CLARIFIER.r + 0.12}
          tube={0.08}
          segments={40}
          color={C.metal}
        />
        <Cylinder p={[0, 1.6, 0]} s={[0.35, 1.2, 0.35]} color={STEEL} />
        <Box p={[1.2, 1.75, 0]} s={[2.6, 0.12, 0.7]} color={C.metal} finish={FINISH.slats} />
        <Railing a={[-0.1, 1.8, 0.35]} b={[2.5, 1.8, 0.35]} h={0.9} color={RED} />
        <Sign
          text='CLARIFICATEUR'
          p={[0, 1.1, CLARIFIER.r + 0.12]}
          s={[1.8, 0.32]}
          color={C.white}
          bg={STEEL}
          rounded={false}
        />
        <Pipe
          a={[0, 0.9, -CLARIFIER.r - 0.1]}
          b={[0, 0.9, -4.5]}
          radius={0.16}
          color={PIPE_BLUE}
          finish={FINISH.paint}
        />
      </group>
      <Fine>
        {/* Supports des canalisations, flèches de sens d'écoulement */}
        {[3.6, 4.6].map((x) => (
          <Box key={x} p={[x, 1.1, -3.75]} s={[0.1, 2.2, 0.3]} color={STEEL} shadow={false} />
        ))}
        <Box p={[CLARIFIER.x, 1.12, -1.2]} s={[0.08, 0.04, 0.4]} color={C.white} shadow={false} />
      </Fine>
      <Window p={[2.8, 2.4, -2.6]} ry={Math.PI / 2} w={0.9} h={1.3} cols={1} frame={C.white} wall={WHITE} />
    </>
  );
}
