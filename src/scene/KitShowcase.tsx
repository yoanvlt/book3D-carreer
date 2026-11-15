/**
 * Planche du kit de construction (`?debug=1&kit`) : chaque pièce et chaque matière, posées sur un
 * sol neutre, pour le contrôle visuel. Jamais chargée en visite normale.
 */
import { color as C } from '../design/tokens';
import { Box, Cylinder, FINISH, Pipe, Sign, type Finish } from './Primitives';
import StaticBatch from './StaticBatch';
import {
  AirCon,
  Awning,
  Balcony,
  Barrel,
  Bike,
  CageLadder,
  Crate,
  DoorSet,
  Downpipe,
  Flange,
  GableRoof,
  GlassRoof,
  GravelRoof,
  LouvredDome,
  Mailbox,
  Pallet,
  Planter,
  SawtoothRoof,
  Stair,
  TechBox,
  Valve,
  Vent,
  Volume,
  Walkway,
  Window,
  WindowRow,
} from './kit';

const SWATCHES: [string, string, Finish][] = [
  ['brique', C.brick, FINISH.brick],
  ['bardage bois', C.wood, FINISH.wood],
  ['bac acier', C.blue, FINISH.cladding],
  ['béton', C.concrete, FINISH.concrete],
  ['enduit', C.peach, FINISH.render],
  ['tuiles', C.brick, FINISH.tiles],
  ['dallage', C.stone, FINISH.paving],
  ['gravier', C.stone, FINISH.gravel],
  ['pavés', C.stoneDark, FINISH.cobbles],
  ['parquet', C.wood, FINISH.parquet],
  ['lames', C.concrete, FINISH.slats],
  ['pierre', C.stone, FINISH.stone],
];

export default function KitShowcase() {
  return (
    <>
      <color attach='background' args={['#d6efff']} />
      <StaticBatch>
        <Box p={[0, -0.1, 0]} s={[80, 0.2, 50]} color={C.sand} finish={FINISH.paving} />
        {/* Matières */}
        {SWATCHES.map(([, color, finish], i) => (
          <Box key={i} p={[-27 + i * 4.9, 1.5, 18]} s={[3.6, 3, 1.2]} color={color} finish={finish} />
        ))}
        {/* Façades : enduit et fenêtres, brique à chaînes d'angle, bac acier et équipements */}
        <Volume
          p={[-22, 0, 0]}
          w={10}
          d={5}
          h={6}
          color={C.peach}
          plinth={{ h: 0.6, color: C.stoneDark }}
          bands={[3.1]}
          cornice={C.white}
        />
        <Window p={[-25.5, 1.9, 2.5]} variant='plain' wall={C.peach} lintel={C.white} />
        <Window p={[-23.2, 1.9, 2.5]} variant='blind' accent={C.orange} wall={C.peach} />
        <Window p={[-18.5, 1.9, 2.5]} variant='box' accent={C.slate} wall={C.peach} lit />
        <WindowRow
          p={[-22, 4.5, 2.5]}
          count={3}
          spacing={2.6}
          variant='shutters'
          accent={C.teal}
          wall={C.peach}
          lit={[1]}
        />
        <Awning p={[-25.5, 3.05, 2.6]} w={1.6} d={0.8} color={C.orange} />
        <DoorSet p={[-20.8, 0, 2.5]} w={1.1} h={2.2} number='01' canopy='glass' />
        <Volume
          p={[-8, 0, 0]}
          w={8}
          d={5}
          h={7}
          color={C.brick}
          finish={FINISH.brick}
          quoins={C.stone}
          parapet={{ color: C.brick }}
          plinth={{ h: 0.5, color: C.slate }}
        />
        <DoorSet p={[-8, 0.51, 2.5]} w={1.6} h={2.4} double leaf={C.teal} steps={3} canopy='flat' />
        <Volume
          p={[4, 0, 0]}
          w={8}
          d={5}
          h={5}
          color={C.blue}
          finish={FINISH.cladding}
          parapet={{ h: 0.4, color: C.blueDeep }}
        />
        <AirCon p={[1.5, 3.4, 2.5]} />
        <Vent p={[4, 3.6, 2.5]} />
        <Downpipe p={[7.6, 0, 2.5]} h={5} />
        <TechBox p={[5.5, 0, 2.5]} />
        <Balcony p={[2, 2.8, 2.5]} w={2} d={0.9} rail={C.ink} />
        {/* Toitures */}
        <Volume p={[16, 0, 0]} w={7} d={6} h={3.5} color={C.cream} />
        <GableRoof x={16} y={3.5} w={7} d={6} h={2.2} gable={C.cream} />
        <Volume p={[28, 0, 0]} w={8} d={8} h={3} color={C.yellowSoft} finish={FINISH.concrete} />
        <group position={[28, 0, 0]}>
          <SawtoothRoof y={3} w={8} d={8} teeth={3} />
        </group>
        <Volume p={[-22, 0, -14]} w={10} d={7} h={3.6} color={C.white} />
        <GravelRoof
          x={-22}
          z={-14}
          y={3.6}
          w={10}
          d={7}
          wall={C.white}
          skylights={[[-2.5, 0]]}
          units={[[2.5, 1]]}
          vents={[[0, -2]]}
        />
        <Cylinder p={[-6, 1.5, -14]} s={[4.2, 3, 4.2]} color={C.violetSoft} finish={FINISH.render} />
        <LouvredDome p={[-6, 3, -14]} radius={4} slit={0.6} />
        <Volume p={[8, 0, -14]} w={8} d={6} h={3} color={C.tealSoft} />
        <GlassRoof p={[8, 3, -14]} w={8} d={6} h={1.6} />
        {/* Structures et accessoires */}
        <Cylinder p={[22, 4, -14]} s={[2.4, 8, 2.4]} color={C.cream} finish={FINISH.steel} />
        <CageLadder p={[22, 0, -11.6]} h={8} />
        <Stair p={[27, 0, -18]} rise={3} run={4.5} />
        <Box p={[27, 1.5, -12]} s={[3, 3, 2.5]} color={C.concrete} finish={FINISH.concrete} />
        <Walkway a={[22, 8, -16.4]} b={[22, 8, -24]} />
        <Pipe a={[30, 0.6, -24]} b={[30, 0.6, -8]} radius={0.25} color={C.red} />
        <Flange p={[30, 0.6, -20]} r={[Math.PI / 2, 0, 0]} />
        <Valve p={[30, 0.9, -16]} />
        <Crate p={[33, 0, -10]} />
        <Pallet p={[34.5, 0, -12]} load />
        <Barrel p={[33, 0, -13.5]} />
        <Bike p={[34, 0, -16]} ry={0.4} />
        <Mailbox p={[33, 0, -18.5]} />
        <Planter p={[34, 0, -21]} />
      </StaticBatch>
      {SWATCHES.map(([name], i) => (
        <Sign
          key={name}
          text={name}
          p={[-27 + i * 4.9, 3.5, 18.62]}
          s={[3.6, 0.6]}
          color={C.ink}
          bg={C.white}
        />
      ))}
    </>
  );
}
