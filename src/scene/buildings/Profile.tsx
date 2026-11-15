/**
 * Profil : la maison d'architecte. Atelier vitré en avancée, corps blanc à deux niveaux, étage
 * orange en porte-à-faux portant une fresque-portrait, toit de tuiles, tour-belvédère en brique
 * surmontée d'une lanterne et d'une girouette, jardin clos avec le buste, boîte aux lettres et vélo.
 * Emprise 15 × 10 : maison à gauche (x de -7,5 à 2,8), jardin à droite, porte au centre (x = 0).
 */
import { Ball, Box, Cylinder, FINISH, Gable, GLASS, Rod, Sign, type V3 } from '../Primitives';
import { Fine } from '../StaticBatch';
import {
  AirCon,
  Balcony,
  Bike,
  Downpipe,
  GableRoof,
  Mailbox,
  Parapet,
  Planter,
  Railing,
  Vent,
  Volume,
  Window,
  WindowRow,
  Windows,
} from '../kit';
import { color as C } from '../../design/tokens';
import { place, site } from '../../content';

const ORANGE = '#e8774f';
const WHITE = '#f6f1e8';
const BRICK = '#b8573a';
const SLATE_ROOF = '#55606a';
const STEEL = '#2b3640';
const SKIN = '#f1c7a1';
const HAIR = '#4a3428';

/** Fresque-portrait peinte sur la façade de l'étage (plan XY, face à +Z). */
function Fresco({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0, 0]} s={[5.4, 3.9, 0.04]} color='#fbe7cf' shadow={false} />
      <Box p={[0, 0, 0.01]} s={[5.6, 4.1, 0.02]} color={C.white} shadow={false} />
      {/* Disque de fond et épaules */}
      <Box p={[0, 0.2, 0.03]} s={[3.4, 3.2, 0.02]} color='#f7b267' shadow={false} />
      <Box p={[0, -1.45, 0.04]} s={[3.6, 1, 0.02]} color='#3f7fc4' shadow={false} />
      <Box p={[0, -1.12, 0.05]} s={[1.1, 0.42, 0.02]} color={C.white} shadow={false} />
      {/* Visage, cou, oreilles */}
      <Box p={[0, -0.85, 0.05]} s={[0.7, 0.5, 0.02]} color='#e4ae86' shadow={false} />
      <Box p={[0, 0.25, 0.06]} s={[1.8, 2.1, 0.02]} color={SKIN} shadow={false} />
      <Box p={[0, 0.25, 0.06]} s={[2.05, 1.6, 0.02]} color={SKIN} shadow={false} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 1.1, 0.25, 0.06]} s={[0.25, 0.5, 0.02]} color='#e4ae86' shadow={false} />
      ))}
      {/* Cheveux */}
      <Box p={[0, 1.38, 0.07]} s={[2.15, 0.62, 0.02]} color={HAIR} shadow={false} />
      <Box p={[-0.55, 1.05, 0.07]} s={[1.0, 0.3, 0.02]} color={HAIR} shadow={false} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 1.0, 0.95, 0.07]} s={[0.2, 0.75, 0.02]} color={HAIR} shadow={false} />
      ))}
      {/* Lunettes, sourcils, nez, sourire */}
      {[-0.48, 0.48].map((x) => (
        <group key={x}>
          <Box p={[x, 0.42, 0.08]} s={[0.72, 0.5, 0.02]} color={C.ink} shadow={false} />
          <Box p={[x, 0.42, 0.09]} s={[0.56, 0.36, 0.02]} color='#bfe3f2' shadow={false} />
          <Box p={[x, 0.82, 0.08]} s={[0.5, 0.08, 0.02]} color={HAIR} shadow={false} />
        </group>
      ))}
      <Box p={[0, 0.48, 0.08]} s={[0.26, 0.07, 0.02]} color={C.ink} shadow={false} />
      <Box p={[0, 0.0, 0.08]} s={[0.18, 0.36, 0.02]} color='#e4ae86' shadow={false} />
      <Box p={[0, -0.42, 0.08]} s={[0.66, 0.1, 0.02]} color='#b5413a' shadow={false} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * 0.36, -0.37, 0.08]} s={[0.1, 0.1, 0.02]} color='#b5413a' shadow={false} />
      ))}
    </group>
  );
}

/** Buste sur socle, dans le jardin. */
function Bust({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Box p={[0, 0.55, 0]} s={[0.8, 1.1, 0.8]} color={C.stone} finish={FINISH.stone} />
      <Box p={[0, 1.13, 0]} s={[0.95, 0.06, 0.95]} color={C.cream} />
      <Box p={[0, 1.42, 0]} s={[0.9, 0.5, 0.42]} color='#d9d2c4' finish={FINISH.stone} />
      <Rod p={[0, 1.75, 0]} s={[0.14, 0.2, 0.14]} color='#d9d2c4' />
      <Ball p={[0, 2.05, 0.02]} s={[0.3, 0.36, 0.3]} color='#e2dbcd' finish={FINISH.stone} />
      <Box p={[0, 2.3, -0.03]} s={[0.56, 0.16, 0.5]} color='#c9c0b0' />
      <Fine>
        <Box p={[0, 2.08, 0.29]} s={[0.46, 0.12, 0.04]} color={C.ink} shadow={false} />
      </Fine>
    </group>
  );
}

/** Jardin clos : muret de brique, grille, pelouse, arbre, massifs, banc et buste. */
function Garden() {
  return (
    <group position={[5.35, 0, 0]}>
      <Box p={[0, 0.06, 0]} s={[4.2, 0.12, 9.6]} color='#86b25c' finish={FINISH.render} shadow={false} />
      <Box p={[0.6, 0.14, 0.6]} s={[0.9, 0.06, 7.4]} color={C.stone} finish={FINISH.paving} shadow={false} />
      {/* Muret et chaperon */}
      {(
        [
          [2.05, 0, 0.3, 9.8],
          [0, -4.85, 4.4, 0.3],
          [-1.25, 4.85, 1.7, 0.3],
          [1.55, 4.85, 1.3, 0.3],
        ] as const
      ).map(([x, z, w, d], i) => (
        <group key={i}>
          <Box p={[x, 0.5, z]} s={[w, 1, d]} color={BRICK} finish={FINISH.brick} />
          <Box p={[x, 1.04, z]} s={[w + 0.08, 0.08, d + 0.08]} color={C.stone} />
        </group>
      ))}
      {/* Piliers et grille du portail */}
      {[-0.4, 0.9].map((x) => (
        <Box key={x} p={[x, 0.7, 4.85]} s={[0.4, 1.4, 0.4]} color={BRICK} finish={FINISH.brick} />
      ))}
      <Railing a={[-0.2, 0.05, 4.85]} b={[0.7, 0.05, 4.85]} h={1.05} color={STEEL} />
      {/* Arbre, massifs, banc */}
      <Rod p={[0.8, 1.4, -2.6]} s={[0.16, 2.8, 0.16]} color={C.trunk} />
      {(
        [
          [0.8, 3.4, -2.6, 1.15],
          [0.2, 3.0, -2.2, 0.8],
          [1.3, 3.1, -3.0, 0.85],
          [0.9, 3.9, -2.9, 0.7],
        ] as const
      ).map(([x, y, z, r], i) => (
        <Ball key={i} p={[x, y, z]} s={[r, r * 0.85, r]} color={i % 2 ? C.leafDark : C.leaf} />
      ))}
      <Planter p={[-1.3, 0, -3.6]} w={1.4} color={BRICK} />
      <Planter p={[1.6, 0, 2.6]} w={1.2} color={BRICK} />
      <Box p={[1.55, 0.45, -0.3]} s={[0.5, 0.08, 1.8]} color={C.wood} finish={FINISH.wood} />
      <Box p={[1.8, 0.75, -0.3]} s={[0.06, 0.5, 1.8]} color={C.wood} finish={FINISH.wood} />
      {[-0.9, 0.3].map((z) => (
        <Box key={z} p={[1.55, 0.22, z]} s={[0.45, 0.44, 0.08]} color={STEEL} />
      ))}
      <Bust p={[-0.6, 0.12, 1.6]} />
      <Fine>
        {Array.from({ length: 10 }, (_, i) => (
          <Ball
            key={i}
            p={[-1.6 + (i % 5) * 0.32, 0.3, 3.6 + Math.floor(i / 5) * 0.4]}
            s={[0.14, 0.16, 0.14]}
            color={i % 3 ? C.flower : C.yellowSoft}
          />
        ))}
      </Fine>
    </group>
  );
}

export default function Portrait() {
  return (
    <>
      {/* Corps blanc : rez-de-chaussée et étage, soubassement de pierre, bandeau d'étage. */}
      <Volume
        p={[-2.35, 0, -1.9]}
        w={10.3}
        d={6.2}
        h={8.6}
        color={WHITE}
        plinth={{ h: 0.7, color: C.stoneDark }}
        bands={[4.4]}
        parapet={{ h: 0.4, color: WHITE }}
      />
      <WindowRow
        p={[-2.35, 6.8, 1.2]}
        count={3}
        spacing={3.1}
        w={1.5}
        h={1.7}
        wall={WHITE}
        lintel={C.white}
        variant='blind'
        accent={ORANGE}
        lit={[2]}
      />
      <WindowRow
        p={[-2.35, 6.4, -5]}
        ry={Math.PI}
        count={3}
        spacing={3.1}
        w={1.3}
        h={1.6}
        wall={WHITE}
        variant='shutters'
        accent={C.slate}
      />
      <WindowRow p={[-2.35, 2.3, -5]} ry={Math.PI} count={3} spacing={3.1} w={1.3} h={1.5} wall={WHITE} />
      <Window
        p={[-7.5, 6.4, -3.5]}
        ry={-Math.PI / 2}
        w={1.2}
        h={1.6}
        wall={WHITE}
        variant='shutters'
        accent={C.slate}
      />
      <Window
        p={[2.8, 2.3, -3.2]}
        ry={Math.PI / 2}
        w={1.6}
        h={1.7}
        wall={WHITE}
        variant='box'
        accent={BRICK}
        lit
      />
      <Window p={[2.8, 6.4, -3.2]} ry={Math.PI / 2} w={1.2} h={1.6} wall={WHITE} />
      <Balcony p={[2.8, 4.55, -0.4]} ry={Math.PI / 2} w={2.4} d={1.1} color={WHITE} rail={STEEL} />
      <Windows
        p={[2.82, 5.9, -0.4]}
        r={[0, Math.PI / 2, 0]}
        w={1.6}
        h={2.4}
        cols={2}
        frame={STEEL}
        sill={false}
      />
      <Downpipe p={[-7.5, 0, 0.9]} ry={-Math.PI / 2} h={8.6} />
      <Downpipe p={[2.5, 0, -5]} ry={Math.PI} h={8.6} />
      <AirCon p={[-4.5, 3.2, -5]} ry={Math.PI} />
      <Vent p={[-7.5, 1.4, -1.2]} ry={-Math.PI / 2} />

      {/* Atelier vitré en avancée : ossature acier noire, toiture-terrasse plantée. */}
      <group position={[-4.55, 0, 3.05]}>
        <Box p={[0, 2.8, 0]} s={[5.4, 5.6, 3.6]} color='#3a6f8c' finish={GLASS} />
        <Windows
          p={[0, 2.85, 1.82]}
          w={5.4}
          h={5.4}
          cols={5}
          rows={3}
          frame={STEEL}
          glass='#7fbcd6'
          bar={0.1}
          sill={false}
          lit={[1, 3]}
        />
        <Windows
          p={[-2.72, 2.85, 0]}
          r={[0, -Math.PI / 2, 0]}
          w={3.6}
          h={5.4}
          cols={3}
          rows={3}
          frame={STEEL}
          glass='#7fbcd6'
          bar={0.1}
          sill={false}
        />
        <Box p={[0, 5.7, 0]} s={[5.8, 0.24, 4]} color={STEEL} />
        <Box p={[0, 5.86, 0]} s={[5.4, 0.1, 3.6]} color={C.garden} finish={FINISH.gravel} shadow={false} />
        <Railing a={[-2.8, 5.82, 1.9]} b={[2.8, 5.82, 1.9]} color={STEEL} />
        <Railing a={[-2.8, 5.82, -1.7]} b={[-2.8, 5.82, 1.9]} color={STEEL} />
        <Planter p={[0.8, 5.82, 1.2]} w={1.8} color={STEEL} />
        <Box p={[0, 0.12, 0]} s={[5.6, 0.24, 3.8]} color={C.stoneDark} />
      </group>

      {/* Hall d'entrée en brique autour de la porte. */}
      <Volume
        p={[0.5, 0, 3.1]}
        w={4.6}
        d={3.8}
        h={4.4}
        color={BRICK}
        finish={FINISH.brick}
        parapet={{ h: 0.35, color: BRICK, coping: C.white }}
      />
      <Sign text={place('profile').enseigne} p={[0, 4.3, 5.04]} s={[3.6, 0.62]} color={C.white} bg={C.ink} />

      {/* Étage orange en porte-à-faux, fresque-portrait, nom de l'habitant. */}
      <Volume p={[-2.25, 8.6, -1.1]} w={9.1} d={7} h={4.4} color={ORANGE} bands={[0.2]} bandColor={C.white} />
      <group scale={0.92}>
        <Fresco p={[-2.25 / 0.92, 11 / 0.92, 2.42 / 0.92]} />
      </group>
      <Sign
        text={site.nom.toUpperCase()}
        p={[-2.25, 8.85, 2.46]}
        s={[4.4, 0.48]}
        color={C.white}
        bg={C.ink}
      />
      {[-1, 1].map((s) => (
        <WindowRow
          key={s}
          p={[-2.25 + s * 4.55, 10.8, -1.1]}
          ry={(s * Math.PI) / 2}
          count={2}
          spacing={3}
          w={1.2}
          h={1.6}
          wall={ORANGE}
          variant='shutters'
          accent={C.white}
          lit={s > 0 ? [0] : []}
        />
      ))}
      <WindowRow p={[-2.25, 10.8, -4.6]} ry={Math.PI} count={3} spacing={2.8} w={1.3} h={1.6} wall={ORANGE} />
      {/* Toit de tuiles, cheminée, panneaux, gouttières. */}
      <GableRoof x={-2.25} y={13} z={-1.1} w={9.1} d={7} h={2.7} color={SLATE_ROOF} gable={ORANGE} />
      <Box p={[0.6, 15.2, -2.8]} s={[0.8, 2.6, 0.8]} color={BRICK} finish={FINISH.brick} />
      <Box p={[0.6, 16.55, -2.8]} s={[1, 0.15, 1]} color={C.stone} />
      <Fine>
        {[-0.18, 0.18].map((x) => (
          <Rod key={x} p={[0.6 + x, 16.85, -2.8]} s={[0.12, 0.45, 0.12]} color='#a9583b' />
        ))}
      </Fine>
      <group position={[-2.3, 14.2, -3.3]} rotation={[-0.66, 0, 0]}>
        <Box p={[0, 0.06, 0]} s={[2.4, 0.06, 1.3]} color={C.blueDeep} finish={GLASS} />
        <Box p={[0, 0.02, 0]} s={[2.5, 0.05, 1.4]} color={C.white} />
      </group>

      {/* Tour-belvédère : brique, fenêtres étroites, lanterne vitrée, toit en pointe, girouette. */}
      <Volume
        p={[-5.6, 0, -3.2]}
        w={3.4}
        d={3.4}
        h={17.4}
        color={BRICK}
        finish={FINISH.brick}
        plinth={{ h: 0.7, color: C.stoneDark }}
        bands={[8.6, 13]}
        bandColor={C.stone}
        quoins={C.stone}
      />
      <Window
        p={[-7.3, 10.8, -3.2]}
        ry={-Math.PI / 2}
        w={0.7}
        h={1.9}
        cols={1}
        rows={2}
        wall={BRICK}
        sill={C.stone}
        lintel={C.stone}
        lit
      />
      {[
        [-5.6, -1.5, 0],
        [-7.3, -3.2, -Math.PI / 2],
        [-5.6, -4.9, Math.PI],
      ].map(([x, z, ry]) => (
        <Window
          key={ry}
          p={[x, 15.2, z]}
          ry={ry}
          w={0.8}
          h={1.9}
          cols={1}
          rows={2}
          wall={BRICK}
          sill={C.stone}
          lintel={C.stone}
        />
      ))}
      <group position={[-5.6, 0, -3.2]}>
        <Parapet y={17.4} w={3.6} d={3.6} h={0.3} color={C.stone} />
      </group>
      <group position={[-5.6, 17.4, -3.2]}>
        <Box p={[0, 1.1, 0]} s={[2.6, 2.2, 2.6]} color='#86c3dc' finish={GLASS} />
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <Box key={`${sx}${sz}`} p={[sx * 1.3, 1.1, sz * 1.3]} s={[0.16, 2.2, 0.16]} color={STEEL} />
          )),
        )}
        {[0.05, 2.2].map((y) => (
          <Box key={y} p={[0, y, 0]} s={[2.8, 0.14, 2.8]} color={STEEL} />
        ))}
        <Gable p={[0, 2.25, 0]} s={[3.2, 1.6, 3.2]} color={SLATE_ROOF} finish={FINISH.tiles} />
        <Gable
          p={[0, 2.25, 0]}
          s={[3.2, 1.6, 3.2]}
          r={[0, Math.PI / 2, 0]}
          color={SLATE_ROOF}
          finish={FINISH.tiles}
        />
        <Rod p={[0, 4.3, 0]} s={[0.05, 0.9, 0.05]} color={STEEL} />
      </group>

      {/* Boîte aux lettres et vélo devant le jardin. */}
      <Mailbox p={[3.9, 0, 5.4]} color={C.yellow} />
      <Bike p={[6.4, 0, 5.35]} color={C.teal} />
      <Garden />
      <Fine>
        <Cylinder p={[-2.3, 0.3, 5.3]} s={[0.35, 0.6, 0.35]} color={C.stoneDark} />
        <Ball p={[-2.3, 0.85, 5.3]} s={[0.4, 0.45, 0.4]} color={C.leafDark} />
      </Fine>
    </>
  );
}
