/**
 * Projet 2 : la manufacture. Halle en brique couverte de sheds jaunes, cheminée baguée, quai de
 * chargement couvert à droite (palettes, caisses, chariot élévateur, potence), bureau en annexe à
 * l'arrière et, en façade, deux engrenages en prise sur leur platine. Emprise 17 × 12, porte en z = 6,5.
 */
import { Box, Cylinder, FINISH, Pipe, Rod, Sign, Torus, times, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';
import {
  Barrel,
  Crate,
  Downpipe,
  Pallet,
  SawtoothRoof,
  TechBox,
  Vent,
  Volume,
  WallLamp,
  Window,
  Windows,
} from '../kit';
import { color as C } from '../../design/tokens';
import { place } from '../../content';

const BRICK = '#b5603f';
const YELLOW = '#e8ad45';
const STEEL = '#2f3b45';
const CONCRETE = '#cfcbc2';

/** Engrenage droit : jante, dents, moyeu et bras ; plan XY, axe selon z. */
function Gear({
  p,
  radius,
  teeth,
  color,
  phase = 0,
}: {
  p: V3;
  radius: number;
  teeth: number;
  color: string;
  phase?: number;
}) {
  return (
    <group position={p} rotation={[0, 0, phase]}>
      <Cylinder
        p={[0, 0, 0]}
        s={[radius, 0.24, radius]}
        r={[Math.PI / 2, 0, 0]}
        color={color}
        finish={FINISH.steel}
      />
      {times(teeth, (i, n) => {
        const a = (i / n) * Math.PI * 2;
        return (
          <Box
            key={i}
            p={[Math.sin(a) * (radius + 0.1), Math.cos(a) * (radius + 0.1), 0]}
            s={[(Math.PI * radius) / n, 0.26, 0.24]}
            r={[0, 0, -a]}
            color={color}
            finish={FINISH.steel}
          />
        );
      })}
      <Torus p={[0, 0, 0.13]} radius={radius * 0.82} tube={0.05} segments={28} color={C.ink} />
      <Cylinder
        p={[0, 0, 0.16]}
        s={[radius * 0.28, 0.2, radius * 0.28]}
        r={[Math.PI / 2, 0, 0]}
        color={C.ink}
        finish={FINISH.metal}
      />
      <Fine>
        {times(5, (i) => {
          const a = (i / 5) * Math.PI * 2;
          return (
            <Cylinder
              key={i}
              p={[Math.sin(a) * radius * 0.55, Math.cos(a) * radius * 0.55, 0.13]}
              s={[radius * 0.14, 0.04, radius * 0.14]}
              r={[Math.PI / 2, 0, 0]}
              color={C.ink}
              shadow={false}
            />
          );
        })}
      </Fine>
    </group>
  );
}

/** Chariot élévateur : châssis, contrepoids, toit de protection, mât, fourches chargées. */
function Forklift({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.55, 0]} s={[0.95, 0.6, 1.5]} color={YELLOW} finish={FINISH.paint} />
      <Box p={[0, 0.75, -0.75]} s={[0.95, 0.75, 0.35]} color={C.slate} finish={FINISH.steel} />
      {[-0.5, 0.5].flatMap((x) =>
        [-0.45, 0.5].map((z) => (
          <Cylinder
            key={`${x}${z}`}
            p={[x, 0.28, z]}
            s={[0.26, 0.2, 0.26]}
            r={[0, 0, Math.PI / 2]}
            color={C.ink}
          />
        )),
      )}
      {[-0.42, 0.42].flatMap((x) =>
        [-0.5, 0.35].map((z) => (
          <Rod key={`${x}${z}`} p={[x, 1.55, z]} s={[0.035, 1.4, 0.035]} color={C.ink} />
        )),
      )}
      <Box p={[0, 2.25, -0.08]} s={[0.95, 0.06, 1]} color={C.ink} />
      <Box p={[0, 1.05, -0.2]} s={[0.5, 0.12, 0.45]} color={C.ink} />
      {/* Mât et fourches */}
      {[-0.32, 0.32].map((x) => (
        <Box key={x} p={[x, 1.3, 0.85]} s={[0.08, 2.4, 0.1]} color={STEEL} finish={FINISH.steel} />
      ))}
      {[-0.22, 0.22].map((x) => (
        <Box key={x} p={[x, 0.5, 1.35]} s={[0.1, 0.05, 1]} color={STEEL} />
      ))}
      <Pallet p={[0, 0.53, 1.4]} load />
      <Fine>
        <Rod p={[0, 1.25, 0.15]} s={[0.02, 0.4, 0.02]} r={[-0.5, 0, 0]} color={C.ink} />
        <Torus
          p={[0, 1.42, 0.25]}
          r={[Math.PI / 2 - 0.5, 0, 0]}
          radius={0.14}
          tube={0.02}
          segments={12}
          color={C.ink}
        />
        <Box
          p={[0, 2.3, -0.5]}
          s={[0.12, 0.06, 0.12]}
          color={C.orange}
          finish={{ glow: C.orange, glowIntensity: 1 }}
        />
      </Fine>
    </group>
  );
}

/** Potence de levage : fût, flèche, palan, crochet et caisse suspendue. */
function JibCrane({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation={[0, ry, 0]}>
      <Box p={[0, 0.1, 0]} s={[0.7, 0.2, 0.7]} color={STEEL} />
      <Rod p={[0, 2.1, 0]} s={[0.16, 4, 0.16]} color={YELLOW} finish={FINISH.paint} />
      <Box p={[0, 4.1, 1.3]} s={[0.22, 0.3, 2.9]} color={YELLOW} finish={FINISH.paint} />
      <Pipe a={[0, 3.3, 0.1]} b={[0, 4.0, 1.6]} radius={0.05} color={YELLOW} />
      <Box p={[0, 3.85, 2.2]} s={[0.3, 0.3, 0.36]} color={STEEL} />
      <Rod p={[0, 3.0, 2.2]} s={[0.02, 1.4, 0.02]} color={C.ink} shadow={false} />
      <Torus p={[0, 2.25, 2.2]} radius={0.1} tube={0.025} arc={Math.PI * 1.5} segments={10} color={C.ink} />
      <Crate p={[0, 1.25, 2.2]} s={0.7} />
    </group>
  );
}

export default function Mechanism() {
  return (
    <>
      {/* Halle en brique : soubassement béton, bandeau acier, grandes verrières d'atelier. */}
      <Volume
        p={[-1.75, 0, -0.2]}
        w={13.5}
        d={11.6}
        h={7}
        color={BRICK}
        finish={FINISH.brick}
        plinth={{ h: 0.8, color: CONCRETE, finish: FINISH.concrete }}
        bands={[3.7]}
        bandColor={STEEL}
        cornice={C.stone}
      />
      {[
        [-5.5, 3.6],
        [3.3, 2.8],
      ].map(([x, w]) => (
        <Windows
          key={x}
          p={[x, 5.3, 5.62]}
          w={w}
          h={2.4}
          cols={x < 0 ? 6 : 4}
          rows={3}
          frame={STEEL}
          glass='#8fc4d6'
          bar={0.08}
          sill={false}
          lit={x < 0 ? [7] : [2, 9]}
        />
      ))}
      {[-4.5, 0.5].map((z) => (
        <Windows
          key={z}
          p={[-8.52, 4.9, z]}
          r={[0, -Math.PI / 2, 0]}
          w={4}
          h={2.6}
          cols={6}
          rows={3}
          frame={STEEL}
          glass='#8fc4d6'
          bar={0.08}
          sill={false}
        />
      ))}
      {[-6, -2, 2].map((x) => (
        <Window
          key={x}
          p={[x, 2.1, -6]}
          ry={Math.PI}
          w={1.6}
          h={1.6}
          cols={3}
          rows={2}
          frame={STEEL}
          wall={BRICK}
          sill={C.stone}
          lintel={C.stone}
        />
      ))}
      <Window
        p={[-5.6, 2.1, 5.6]}
        w={1.8}
        h={1.7}
        cols={3}
        rows={2}
        frame={STEEL}
        wall={BRICK}
        sill={C.stone}
        lintel={C.stone}
        lit
      />
      <Downpipe p={[-8.2, 0, 5.6]} h={7} />
      <Downpipe p={[4.7, 0, 5.6]} h={7} />
      <Vent p={[-8.5, 1.8, -2]} ry={-Math.PI / 2} w={1} h={0.7} />
      <TechBox p={[-7.2, 0, -6.05]} ry={Math.PI} />
      {/* Sheds jaunes, verrières au nord. */}
      <group position={[-1.75, 0, -0.2]}>
        <SawtoothRoof y={7} w={13.5} d={11.6} teeth={4} h={1.9} color={YELLOW} frame={C.white} />
      </group>

      {/* Engrenages en prise sur leur platine, au-dessus de l'entrée. */}
      <group position={[0, 0, 5.62]}>
        <Box p={[0, 5.85, 0.05]} s={[3.2, 2, 0.1]} color={STEEL} finish={FINISH.steel} />
        {[-1.4, 1.4].flatMap((x) =>
          [5.0, 6.7].map((y) => (
            <Cylinder
              key={`${x}${y}`}
              p={[x, y, 0.12]}
              s={[0.06, 0.05, 0.06]}
              r={[Math.PI / 2, 0, 0]}
              color={C.metal}
              shadow={false}
            />
          )),
        )}
        <Gear p={[-0.45, 5.85, 0.26]} radius={0.68} teeth={16} color={YELLOW} />
        <Gear p={[0.75, 6.05, 0.26]} radius={0.4} teeth={10} color={C.metal} phase={0.31} />
      </group>
      <Sign text={place('project-2').enseigne} p={[0, 4.45, 5.68]} s={[3.6, 0.6]} color={C.ink} bg={YELLOW} />

      {/* Cheminée de brique baguée. */}
      <group position={[-6.4, 7, -4]}>
        <Box p={[0, 0.4, 0]} s={[1.6, 0.8, 1.6]} color={BRICK} finish={FINISH.brick} />
        <Cylinder p={[0, 3.4, 0]} s={[0.62, 5.6, 0.62]} color={BRICK} finish={FINISH.brick} />
        {[2.6, 4.6, 6.1].map((y) => (
          <Cylinder key={y} p={[0, y, 0]} s={[0.68, 0.2, 0.68]} color={y > 6 ? C.ink : YELLOW} />
        ))}
      </group>

      {/* Quai de chargement couvert. */}
      <group position={[6.75, 0, 2.8]}>
        <Box p={[0, 0.5, 0]} s={[3.5, 1, 5.6]} color={CONCRETE} finish={FINISH.concrete} />
        <Box p={[0, 1.02, 0]} s={[3.5, 0.04, 5.6]} color={C.slate} finish={FINISH.slats} shadow={false} />
        {[-2, 0, 2].map((z) => (
          <Box key={z} p={[1.78, 0.6, z]} s={[0.12, 0.4, 0.5]} color={C.ink} />
        ))}
        {[-1.6, 1.6].flatMap((x) =>
          [-2.7, 2.7].map((z) => <Rod key={`${x}${z}`} p={[x, 3.0, z]} s={[0.08, 4, 0.08]} color={STEEL} />),
        )}
        <Box p={[0, 5.05, 0]} s={[3.9, 0.18, 6]} r={[0, 0, -0.06]} color={YELLOW} finish={FINISH.cladding} />
        <Box p={[1.95, 4.9, 0]} s={[0.1, 0.4, 6]} color={STEEL} />
        <Pallet p={[-0.8, 1.04, -1.6]} load />
        <Pallet p={[0.6, 1.04, -1.9]} />
        <Crate p={[0.5, 1.2, -1.9]} s={0.75} ry={0.3} />
        <Crate p={[-0.9, 1.04, 0.6]} s={0.9} />
        <Crate p={[-0.9, 1.94, 0.6]} s={0.6} ry={0.5} color={C.woodDark} />
        <Barrel p={[1.1, 1.04, 2.3]} />
        <Barrel p={[0.4, 1.04, 2.5]} color={C.red} />
        <JibCrane p={[-1.2, 1.04, -0.6]} ry={Math.PI / 2} />
        {/* Marches d’accès au quai */}
        {[0, 1, 2].map((i) => (
          <Box key={i} p={[-1.1, 0.17 + i * 0.33, 2.95 - i * 0.3]} s={[1.2, 0.33, 0.3]} color={CONCRETE} />
        ))}
      </group>
      {/* Porte sectionnelle du quai et annexe de bureau à l'arrière. */}
      <group position={[5.02, 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <Box p={[0, 3.0, 0]} s={[3.2, 3.6, 0.08]} color={C.concrete} finish={FINISH.slats} />
        <Box p={[0, 4.95, 0.12]} s={[3.6, 0.3, 0.3]} color={STEEL} />
      </group>
      <Volume
        p={[6.75, 0, -3.1]}
        w={3.5}
        d={5.8}
        h={5}
        color={CONCRETE}
        finish={FINISH.concrete}
        parapet={{ h: 0.4, color: CONCRETE }}
      />
      <Window
        p={[8.5, 2.6, -3.1]}
        ry={Math.PI / 2}
        w={2.4}
        h={1.4}
        cols={3}
        frame={STEEL}
        wall={CONCRETE}
        variant='blind'
        accent={YELLOW}
        lit
      />
      <Window p={[6.75, 2.6, -6]} ry={Math.PI} w={1.6} h={1.4} cols={2} frame={STEEL} wall={CONCRETE} />
      <Forklift p={[6.9, 0, 6.05]} ry={Math.PI / 2} />
      <WallLamp p={[-2.2, 2.7, 5.62]} />
      <WallLamp p={[2.2, 2.7, 5.62]} />
      <Fine>
        {/* Bornes de protection du quai */}
        {[5.2, 8.3].map((x) => (
          <group key={x} position={[x, 0, 5.9]}>
            <Rod p={[0, 0.5, 0]} s={[0.12, 1, 0.12]} color={YELLOW} />
            <Box p={[0, 0.75, 0]} s={[0.26, 0.12, 0.26]} color={C.ink} />
          </group>
        ))}
      </Fine>
    </>
  );
}
