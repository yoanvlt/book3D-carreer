/**
 * Profil : la maison d'architecte (V7). Rez-de-chaussée sur toute l'emprise de la maison, atelier
 * vitré dans la façade ; étage blanc en retrait sur une terrasse ; étage orange en léger
 * porte-à-faux portant un médaillon : un portrait de profil en relief. Toit de tuiles, cheminée,
 * tour-belvédère en brique, jardin clos avec le buste. Arrière : porte de service, fenêtres,
 * local poubelles. Emprise 15 × 10 : maison de x = -7,5 à 2,8, jardin à droite ; vantaux en
 * z = 5,5, façade du rez-de-chaussée en z = 4,9.
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import {
  Ball,
  Box,
  Cylinder,
  FINISH,
  Gable,
  GLASS,
  Rod,
  Sign,
  Torus,
  material,
  type V3,
} from '../Primitives';
import { Fine } from '../StaticBatch';
import {
  AirCon,
  Bike,
  DoorSet,
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

/** Profil d'un buste regardant vers +x (hauteur ≈ 1,3), avec lunettes : tracé en courbes. */
function profileShape() {
  const s = new THREE.Shape();
  s.moveTo(-0.75, -0.62);
  s.lineTo(0.62, -0.62);
  s.quadraticCurveTo(0.6, -0.4, 0.22, -0.33);
  s.lineTo(0.2, -0.12);
  s.quadraticCurveTo(0.3, -0.1, 0.33, -0.02);
  s.quadraticCurveTo(0.36, 0.03, 0.3, 0.06);
  s.lineTo(0.34, 0.1);
  s.quadraticCurveTo(0.3, 0.13, 0.33, 0.16);
  s.lineTo(0.42, 0.27);
  s.quadraticCurveTo(0.4, 0.3, 0.32, 0.32);
  s.quadraticCurveTo(0.33, 0.42, 0.3, 0.48);
  s.quadraticCurveTo(0.22, 0.66, 0, 0.68);
  s.quadraticCurveTo(-0.3, 0.66, -0.36, 0.4);
  s.quadraticCurveTo(-0.4, 0.18, -0.2, 0.02);
  s.lineTo(-0.18, -0.3);
  s.quadraticCurveTo(-0.4, -0.36, -0.75, -0.45);
  s.closePath();
  return s;
}

/** Médaillon : disque clair, cerclage, portrait de profil en relief et lunettes. */
function Medallion({ p, radius }: { p: V3; radius: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(profileShape(), {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.015,
      bevelSegments: 1,
      curveSegments: 8,
    });
    g.scale(radius * 1.15, radius * 1.15, 1);
    return g;
  }, [radius]);
  return (
    <group position={p}>
      <Cylinder
        p={[0, 0, 0.02]}
        s={[radius, 0.04, radius]}
        r={[Math.PI / 2, 0, 0]}
        color='#f3dcc6'
        finish={FINISH.render}
      />
      <Torus
        p={[0, 0, 0.05]}
        radius={radius}
        tube={0.09}
        segments={48}
        color={C.white}
        finish={FINISH.stone}
      />
      <mesh
        position={[-0.05, -0.05, 0.04]}
        geometry={geometry}
        material={material('#9c3f22', FINISH.stone)}
        castShadow
        receiveShadow
      />
      <Torus
        p={[radius * 0.3, radius * 0.33, 0.2]}
        radius={radius * 0.07}
        tube={0.025}
        segments={16}
        color={C.ink}
      />
      <Box
        p={[radius * 0.13, radius * 0.36, 0.2]}
        s={[radius * 0.22, 0.03, 0.02]}
        color={C.ink}
        shadow={false}
      />
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
      {/* Rez-de-chaussée : soubassement de pierre, enduit blanc, atelier vitré en façade. */}
      <Volume
        p={[-2.35, 0, -0.05]}
        w={10.3}
        d={9.9}
        h={4.4}
        color={WHITE}
        plinth={{ h: 0.6, color: C.stoneDark }}
        cornice={C.white}
      />
      <Windows
        p={[-4.65, 2.35, 4.92]}
        w={5.0}
        h={3.5}
        cols={5}
        rows={3}
        frame={STEEL}
        glass='#7fbcd6'
        bar={0.1}
        sill={false}
        lit={[1, 3]}
      />
      <Box p={[-4.65, 4.2, 5.02]} s={[5.3, 0.2, 0.2]} color={STEEL} />
      <Window
        p={[2.1, 2.2, 4.9]}
        w={0.8}
        h={1.8}
        cols={1}
        rows={2}
        wall={WHITE}
        sill={C.stone}
        lintel={C.stone}
      />
      <Sign text={place('profile').enseigne} p={[0, 4.15, 5.01]} s={[2.6, 0.38]} color={C.ink} bg={C.white} />
      {/* Terrasse sur le rez-de-chaussée : dallage, garde-corps, jardinières, deux chaises. */}
      <Box
        p={[-2.35, 4.47, 3.25]}
        s={[10.1, 0.06, 3.3]}
        color={C.stone}
        finish={FINISH.paving}
        shadow={false}
      />
      <Railing a={[-7.4, 4.5, 4.85]} b={[2.7, 4.5, 4.85]} color={STEEL} />
      <Railing a={[2.7, 4.5, 1.7]} b={[2.7, 4.5, 4.85]} color={STEEL} />
      <Planter p={[-5.5, 4.5, 4.3]} w={2} color={STEEL} />
      <Planter p={[1.2, 4.5, 4.3]} w={1.6} color={STEEL} />
      <Fine>
        {[-2.6, -1.6].map((x) => (
          <group key={x} position={[x, 4.5, 3.2]}>
            <Box p={[0, 0.45, 0]} s={[0.5, 0.06, 0.5]} color={C.wood} finish={FINISH.wood} />
            <Box p={[0, 0.75, -0.22]} s={[0.5, 0.55, 0.05]} color={C.wood} finish={FINISH.wood} />
            {[-0.2, 0.2].map((dx) => (
              <Box key={dx} p={[dx, 0.22, 0]} s={[0.04, 0.45, 0.45]} color={STEEL} />
            ))}
          </group>
        ))}
      </Fine>
      {/* Étage blanc en retrait : portes-fenêtres sur la terrasse, fenêtres à volets ailleurs. */}
      <Volume p={[-2.35, 4.4, -1.7]} w={10.3} d={6.6} h={4.2} color={WHITE} bands={[0.05]} />
      <WindowRow
        p={[-2.35, 6.3, 1.6]}
        count={3}
        spacing={3.1}
        w={1.5}
        h={2.4}
        cols={2}
        rows={2}
        wall={WHITE}
        lintel={C.white}
        sill={false}
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
        p={[2.8, 6.4, -3.2]}
        ry={Math.PI / 2}
        w={1.2}
        h={1.6}
        wall={WHITE}
        variant='box'
        accent={BRICK}
      />
      <Window
        p={[2.8, 2.2, -3.2]}
        ry={Math.PI / 2}
        w={1.6}
        h={1.7}
        wall={WHITE}
        variant='blind'
        accent={ORANGE}
        lit
      />
      <Window p={[2.8, 2.2, 0.6]} ry={Math.PI / 2} w={1.2} h={1.7} wall={WHITE} />
      <Window
        p={[-7.5, 2.2, -2.5]}
        ry={-Math.PI / 2}
        w={1.4}
        h={1.6}
        wall={WHITE}
        variant='shutters'
        accent={C.slate}
      />
      <Downpipe p={[-7.5, 0, 0.9]} ry={-Math.PI / 2} h={8.6} />
      <Downpipe p={[2.5, 0, -5]} ry={Math.PI} h={8.6} />
      <Vent p={[-7.5, 1.4, -1.0]} ry={-Math.PI / 2} />

      {/* Arrière : porte de service à auvent sur consoles, fenêtres, climatiseur, local poubelles. */}
      <DoorSet
        p={[-1.2, 0, -5]}
        ry={Math.PI}
        w={1.0}
        h={2.3}
        leaf={'#7a4a2c'}
        glazed
        canopy='flat'
        canopyColor={C.white}
        steps={1}
        lamps={false}
        number='01b'
        mat={false}
      />
      <WindowRow
        p={[-4.6, 2.2, -5]}
        ry={Math.PI}
        count={2}
        spacing={2.4}
        w={1.2}
        h={1.5}
        wall={WHITE}
        sill={C.stone}
      />
      <Window p={[1.4, 2.2, -5]} ry={Math.PI} w={0.8} h={1.2} cols={1} wall={WHITE} />
      <AirCon p={[-4.5, 3.6, -5]} ry={Math.PI} />
      <group position={[-6.1, 0, -5.55]}>
        <Box p={[0, 0.65, 0]} s={[2.2, 1.3, 1]} color={C.wood} finish={FINISH.wood} />
        <Box p={[0, 1.33, 0]} s={[2.3, 0.06, 1.1]} color={STEEL} />
      </group>

      {/* Étage orange en léger porte-à-faux, médaillon-portrait, nom ; toit, cheminée, panneaux. */}
      <Volume
        p={[-2.25, 8.6, -1.2]}
        w={9.1}
        d={6.8}
        h={4.2}
        color={ORANGE}
        bands={[0.15]}
        bandColor={C.white}
      />
      <Medallion p={[-2.25, 10.75, 2.21]} radius={1.55} />
      <Sign
        text={site.nom.toUpperCase()}
        p={[-2.25, 9.05, 2.24]}
        s={[4.2, 0.42]}
        color={C.white}
        bg={C.ink}
      />
      {[-1, 1].map((s) => (
        <WindowRow
          key={s}
          p={[-2.25 + s * 4.55, 10.8, -1.2]}
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
      {[-5.7, 1.2].map((x) => (
        <Window
          key={x}
          p={[x, 10.8, 2.2]}
          w={1.1}
          h={1.6}
          wall={ORANGE}
          variant='shutters'
          accent={C.white}
        />
      ))}
      <GableRoof x={-2.25} y={12.8} z={-1.2} w={9.1} d={6.8} h={2.7} color={SLATE_ROOF} gable={ORANGE} />
      <Box p={[0.6, 15.0, -2.9]} s={[0.8, 2.6, 0.8]} color={BRICK} finish={FINISH.brick} />
      <Box p={[0.6, 16.35, -2.9]} s={[1, 0.15, 1]} color={C.stone} />
      <Fine>
        {[-0.18, 0.18].map((x) => (
          <Rod key={x} p={[0.6 + x, 16.65, -2.9]} s={[0.12, 0.45, 0.12]} color='#a9583b' />
        ))}
      </Fine>
      <group position={[-2.3, 14.0, -3.4]} rotation={[-0.66, 0, 0]}>
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
        <Cylinder p={[-2.4, 0.3, 5.35]} s={[0.35, 0.6, 0.35]} color={C.stoneDark} />
        <Ball p={[-2.4, 0.85, 5.35]} s={[0.4, 0.45, 0.4]} color={C.leafDark} />
      </Fine>
    </>
  );
}
