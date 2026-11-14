import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SlidingDoor from './SlidingDoor';
import { batchMeshes } from './StaticBatch';
import { Ball, Beam, Box, Cone, Cylinder, GLASS, METAL, Sign, Vault, material } from './Primitives';
import { Awning, Bevel, Planter, Railing, RoofUnit, SolarPanel, WallLamp, Windows } from './kit';
import { color as C, placeColor } from '../design/tokens';
import { buildings, type Building } from '../world/config';
import { getState, player } from '../state';
import { place, site } from '../content';

/*
 * Les six bâtiments, en coordonnées locales : façade d'entrée vers +Z, porte en (0, 0, profondeur/2 + 0,5).
 * Les silhouettes et volumes de collision (config.ts) sont ceux de la V3 ; seuls les détails changent.
 */

const SKIN = '#ffd3ad';
const HAIR = '#5a3e2e';

/** Profil : un portrait habitable. Jambes = rez-de-chaussée, buste = étages, tête = belvédère. */
function Portrait() {
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Chaussures : socle */}
          <Bevel p={[side * 2.5, 0.45, 0.5]} s={[4.1, 0.9, 9.5]} color={C.slate} radius={0.3} />
          <Box p={[side * 2.5, 0.92, 0.5]} s={[3.9, 0.06, 9.3]} color={C.white} shadow={false} />
          {/* Jambes : rez-de-chaussée vitré */}
          <Bevel p={[side * 2.5, 2.4, -0.1]} s={[3.5, 3.2, 7.8]} color='#3f7fc4' radius={0.15} />
          <Windows p={[side * 2.5, 2.45, 3.82]} w={2.6} h={2.2} cols={2} rows={2} lit={[side < 0 ? 1 : 2]} />
          <Windows p={[side * 4.27, 2.45, -0.4]} r={[0, side * (Math.PI / 2), 0]} w={5.2} h={1.6} cols={4} />
          {/* Bras : volumes latéraux, poignets et mains */}
          <Bevel
            p={[side * 6.05, 7.8, -0.3]}
            s={[2.2, 8.7, 5]}
            r={[0, 0, side * 0.14]}
            color={C.orange}
            radius={0.35}
          />
          <Box p={[side * 6.62, 3.95, -0.25]} s={[2.3, 0.45, 5.1]} r={[0, 0, side * 0.14]} color={C.white} />
          <Bevel p={[side * 6.7, 3.1, 0.2]} s={[2, 1.3, 4.2]} color={SKIN} radius={0.4} />
          <group position={[side * 6.05, 7.8, -0.3]} rotation={[0, 0, side * 0.14]}>
            <Windows
              p={[side * 1.12, 0.4, 0]}
              r={[0, side * (Math.PI / 2), 0]}
              w={3.2}
              h={4.4}
              cols={2}
              rows={3}
              lit={[3]}
            />
          </group>
          {/* Col de chemise */}
          <Box p={[side * 1.35, 13.25, 3.72]} s={[2.8, 0.5, 0.3]} r={[0, 0, side * -0.42]} color={C.white} />
        </group>
      ))}
      {/* Ceinture */}
      <Box p={[0, 4.15, -0.1]} s={[8.6, 0.42, 8]} color={C.slate} />
      <Box p={[0, 4.15, 3.92]} s={[0.9, 0.5, 0.12]} color={C.yellow} finish={METAL} />
      {/* Buste : chemise orange, façade vitrée */}
      <Bevel p={[0, 8.8, -0.5]} s={[10.5, 9.6, 8.2]} color='#ff7a4d' radius={0.65} />
      <Windows p={[0, 8.1, 3.72]} w={4.6} h={5.6} cols={3} rows={4} frame={C.white} lit={[4, 7]} />
      <Windows p={[0, 8.6, -4.62]} r={[0, Math.PI, 0]} w={7} h={5} cols={4} rows={3} />
      {[5.4, 7.2, 9, 10.8].map((y) => (
        <Ball key={y} p={[2.75, y, 3.72]} s={[0.16, 0.16, 0.08]} color={C.white} />
      ))}
      <Sign text={site.nom.toUpperCase()} p={[0, 12.1, 3.77]} s={[7.6, 1]} color={C.white} bg='#e8552c' />
      {/* Cou et tête */}
      <Cylinder p={[0, 14, 0]} s={[2, 1.4, 2]} color='#f3b98a' />
      <Bevel p={[0, 18.1, 0]} s={[7.6, 6.9, 6.8]} color={SKIN} radius={0.65} />
      {[-1, 1].map((side) => (
        <Bevel key={side} p={[side * 3.95, 18.1, 0]} s={[0.5, 1.6, 1.2]} color='#f3b98a' radius={0.2} />
      ))}
      {/* Cheveux */}
      <Bevel p={[0, 21.8, -0.35]} s={[8.2, 1.2, 7.5]} color={HAIR} radius={0.3} />
      <Bevel p={[-2.6, 20.95, 3.15]} s={[2.6, 1.6, 0.7]} color={HAIR} radius={0.2} />
      <Bevel p={[0.6, 21.15, 3.2]} s={[2.4, 1.1, 0.6]} color={HAIR} radius={0.2} />
      <Bevel p={[0, 19.4, -3.45]} s={[7.8, 4, 0.5]} color={HAIR} radius={0.2} />
      {/* Lunettes : deux fenêtres panoramiques */}
      {[-2, 2].map((x) => (
        <group key={x}>
          <Bevel p={[x, 18.8, 3.5]} s={[2.5, 1.55, 0.32]} color={C.ink} radius={0.2} />
          <Box p={[x, 18.8, 3.67]} s={[2.1, 1.12, 0.06]} color='#9fd8ec' finish={GLASS} />
          <Box p={[x - 0.45, 19.05, 3.71]} s={[0.5, 0.18, 0.02]} color={C.white} shadow={false} />
        </group>
      ))}
      <Box p={[0, 18.95, 3.62]} s={[1.6, 0.18, 0.15]} color={C.ink} />
      <Box p={[0, 20.1, 3.45]} s={[1.2, 0.16, 0.12]} r={[0, 0, 0.1]} color={HAIR} />
      <Bevel p={[0, 17.6, 3.55]} s={[0.8, 1.1, 0.9]} color='#f0a47a' radius={0.25} />
      <Bevel p={[0, 16.15, 3.45]} s={[2.6, 0.32, 0.16]} color='#c2493a' radius={0.1} />
      {/* Entrée */}
      <Awning p={[0, 4.3, 4.5]} w={4.2} d={1.3} color={C.orange} />
      <Sign text={place('profile').enseigne} p={[0, 5.3, 4.08]} s={[4, 0.8]} color={C.ink} bg={C.white} />
      <WallLamp p={[-2.25, 2.6, 4.25]} />
      <WallLamp p={[2.25, 2.6, 4.25]} />
      <Planter p={[-4.8, 0.9, 5.6]} w={1.8} />
      <Planter p={[4.8, 0.9, 5.6]} w={1.8} />
    </>
  );
}

/** Projet 1 : trois plateaux vitrés décalés, tour de service et diagonales. */
function Innovation() {
  return (
    <>
      {/* Tour de service */}
      <Bevel p={[-4.9, 6.9, -1.6]} s={[3.2, 13.8, 8]} color='#ff9d4d' radius={0.2} />
      <Windows p={[-6.52, 7, -1.6]} r={[0, -Math.PI / 2, 0]} w={1.4} h={11} rows={8} glass={C.glassDeep} />
      {[3.5, 7.9, 12.3].map((y) => (
        <Box key={y} p={[-4.9, y, 2.44]} s={[3.25, 0.18, 0.12]} color={C.white} />
      ))}
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          position={[i === 1 ? 1.3 : 0, 1 + i * 4.4, 0]}
          rotation={[0, i === 1 ? -0.12 : 0.08, 0]}
        >
          {/* Vitrage avec menuiseries sur toutes les faces */}
          <Box p={[0, 1.8, 0]} s={[12.2, 3.5, 9.2]} color={i === 1 ? '#5aa7c9' : '#7fc4dd'} finish={GLASS} />
          <Windows
            p={[0, 1.85, 4.62]}
            w={12}
            h={3.3}
            cols={6}
            rows={2}
            glass={i === 1 ? '#5aa7c9' : '#7fc4dd'}
            sill={false}
            lit={i === 0 ? [7, 9] : i === 2 ? [8] : []}
          />
          <Windows
            p={[6.12, 1.85, 0]}
            r={[0, Math.PI / 2, 0]}
            w={9}
            h={3.3}
            cols={4}
            rows={2}
            glass='#6db6d3'
            sill={false}
          />
          <Windows
            p={[0, 1.85, -4.62]}
            r={[0, Math.PI, 0]}
            w={12}
            h={3.3}
            cols={6}
            glass='#6db6d3'
            sill={false}
          />
          {/* Dalles en béton clair, nez de dalle et éclairage en sous-face */}
          <Bevel p={[0, 0, 0]} s={[13.2, 0.36, 10.2]} color={C.white} radius={0.12} />
          <Bevel p={[0, 3.7, 0]} s={[13.2, 0.36, 10.2]} color={C.white} radius={0.12} />
          <Box
            p={[0, 3.5, 5.02]}
            s={[12.6, 0.06, 0.1]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 0.9 }}
            shadow={false}
          />
          {i > 0 && <Railing a={[-6.3, 3.88, 5]} b={[6.3, 3.88, 5]} posts={10} h={0.8} />}
        </group>
      ))}
      {/* Contreventements */}
      <Beam a={[-7, 0, 5.4]} b={[6, 13.8, 5.4]} width={0.38} color={C.orange} />
      <Beam a={[6, 0, 5.4]} b={[-7, 13.8, 5.4]} width={0.24} color={C.white} />
      {/* Toiture : auvent incliné, panneaux et équipements */}
      <Box p={[0, 14.7, -1]} s={[9, 0.25, 7]} r={[0, 0, -0.12]} color={C.orange} />
      <SolarPanel p={[2.5, 14.4, 2.6]} />
      <SolarPanel p={[-0.2, 14.4, 2.6]} />
      <RoofUnit p={[4.6, 14.3, -3]} />
      <Sign
        text={place('project-1').enseigne}
        p={[0, 10.15, 5.16]}
        s={[6.4, 1]}
        color={C.white}
        bg={placeColor['project-1']}
      />
      <Planter p={[-3.8, 0, 7.2]} w={2.2} />
      <Planter p={[3.8, 0, 7.2]} w={2.2} />
      <WallLamp p={[-1.9, 2.7, 6.15]} />
      <WallLamp p={[1.9, 2.7, 6.15]} />
    </>
  );
}

/** Projet 2 : manufacture voûtée, roue mécanique et cheminées. */
function Mechanism() {
  return (
    <>
      <Bevel p={[0, 2.8, -0.2]} s={[16, 5.6, 11.5]} color='#f0a92e' radius={0.2} />
      {/* Soubassement en brique et fenêtres d'atelier */}
      <Box p={[0, 0.55, 5.58]} s={[16, 1.1, 0.12]} color={C.brick} />
      {[-5.6, 5.6].map((x) => (
        <Windows
          key={x}
          p={[x, 3.1, 5.6]}
          w={3.6}
          h={2.6}
          cols={4}
          rows={3}
          frame={C.ink}
          glass='#8fd0e6'
          lit={x < 0 ? [5] : [2, 9]}
        />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Windows
            p={[side * 8.03, 3, -2.5]}
            r={[0, side * (Math.PI / 2), 0]}
            w={4.4}
            h={2.4}
            cols={4}
            rows={2}
            frame={C.ink}
            glass='#8fd0e6'
          />
          {/* Porte de chargement */}
          <group position={[side * 8.04, 0, 2.6]} rotation={[0, side * (Math.PI / 2), 0]}>
            <Box p={[0, 1.7, 0.02]} s={[3, 3.4, 0.08]} color={C.concrete} />
            {Array.from({ length: 8 }, (_, i) => (
              <Box
                key={i}
                p={[0, 0.3 + i * 0.4, 0.08]}
                s={[2.9, 0.06, 0.04]}
                color={C.metal}
                shadow={false}
              />
            ))}
            <Box p={[0, 3.55, 0.25]} s={[3.4, 0.25, 0.5]} color={C.ink} />
          </group>
        </group>
      ))}
      {/* Voûte, nervures et verrière faîtière */}
      <Vault p={[0, 5.6, 0]} s={[7.8, 7.8, 11.5]} color='#f7c64a' />
      {[-5.5, -2.8, 0, 2.8, 5.5].map((z) => (
        <mesh key={z} position={[0, 5.6, z]} castShadow material={material(C.white)}>
          <torusGeometry args={[7.9, 0.17, 6, 36, Math.PI]} />
        </mesh>
      ))}
      <Box p={[0, 13.42, 0]} s={[1.6, 0.18, 11]} color='#8fd0e6' finish={GLASS} />
      {/* Roue */}
      <Cylinder p={[0, 7.1, 5.85]} s={[3.5, 0.4, 3.5]} r={[Math.PI / 2, 0, 0]} color={C.ink} />
      <Cylinder
        p={[0, 7.1, 6.08]}
        s={[2.7, 0.2, 2.7]}
        r={[Math.PI / 2, 0, 0]}
        color='#8fd0e6'
        finish={GLASS}
      />
      <Cylinder p={[0, 7.1, 6.22]} s={[0.5, 0.2, 0.5]} r={[Math.PI / 2, 0, 0]} color={C.orange} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <group key={i}>
            <Box
              p={[Math.sin(a) * 3.45, 7.1 + Math.cos(a) * 3.45, 6.1]}
              s={[0.7, 1, 0.5]}
              r={[0, 0, -a]}
              color={C.white}
            />
            {i % 2 === 0 && (
              <Beam
                a={[0, 7.1, 6.18]}
                b={[Math.sin(a) * 2.6, 7.1 + Math.cos(a) * 2.6, 6.18]}
                width={0.1}
                color={C.ink}
              />
            )}
          </group>
        );
      })}
      {[-6.5, 6.5].map((x) => (
        <group key={x}>
          <Box p={[x, 4, 6]} s={[0.45, 8, 0.5]} color={C.ink} />
          {/* Cheminées baguées */}
          <Cylinder p={[x, 9, -3]} s={[0.65, 4, 0.65]} color={C.orange} />
          <Cylinder p={[x, 10.2, -3]} s={[0.72, 0.3, 0.72]} color={C.white} />
          <Cylinder p={[x, 11.1, -3]} s={[0.8, 0.22, 0.8]} color={C.ink} />
        </group>
      ))}
      <Sign text={place('project-2').enseigne} p={[0, 4.4, 6.3]} s={[5.6, 0.9]} color={C.ink} bg={C.white} />
      <WallLamp p={[-2.6, 2.7, 5.62]} />
      <WallLamp p={[2.6, 2.7, 5.62]} />
      {/* Caisses devant l'atelier */}
      <Box p={[6.6, 0.45, 7.3]} s={[0.9, 0.9, 0.9]} color={C.wood} />
      <Box p={[7.3, 0.35, 6.6]} s={[0.7, 0.7, 0.7]} r={[0, 0.4, 0]} color={C.woodDark} />
    </>
  );
}

/** Projet 3 : observatoire, plateaux en spirale et coupole. */
function Discovery() {
  return (
    <>
      <Cylinder p={[0, 0.2, 0]} s={[6.4, 0.4, 6.4]} color={C.stoneDark} />
      <Cylinder p={[0, 2.6, 0]} s={[6, 4.8, 6]} color='#8a74e8' />
      {/* Fentes vitrées du socle */}
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) < 0.35) return null;
        return (
          <Box
            key={i}
            p={[Math.sin(a) * 6.01, 2.8, Math.cos(a) * 6.01]}
            s={[0.55, 3, 0.1]}
            r={[0, a, 0]}
            color={i % 4 === 1 ? C.glassLit : '#a9e0f2'}
            finish={i % 4 === 1 ? { glow: C.glassLit, glowIntensity: 0.5 } : GLASS}
          />
        );
      })}
      <Cylinder p={[0, 5.2, 0]} s={[6.6, 0.45, 6.6]} color={C.white} />
      <Cylinder p={[-1, 8.7, -0.6]} s={[3.1, 7, 3.1]} color='#8fd0e6' finish={GLASS} />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Box
            key={i}
            p={[-1 + Math.sin(a) * 3.12, 8.7, -0.6 + Math.cos(a) * 3.12]}
            s={[0.12, 7, 0.12]}
            r={[0, a, 0]}
            color={C.white}
          />
        );
      })}
      {[6.2, 8.5, 10.8, 13].map((y, i) => (
        <group key={y} rotation={[0, i * 0.45, 0]}>
          <Bevel p={[0, y, 0]} s={[11, 0.3, 4.5]} color={i % 2 ? C.white : '#b4a6f2'} radius={0.12} />
          <Box p={[5, y + 0.6, 0]} s={[0.1, 1, 4.5]} color={C.white} />
          <Railing a={[-5.4, y + 0.15, 2.2]} b={[4.9, y + 0.15, 2.2]} posts={8} h={0.75} />
          <Box
            p={[0, y - 0.18, 2.24]}
            s={[10.6, 0.05, 0.08]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 0.8 }}
            shadow={false}
          />
        </group>
      ))}
      <Cylinder p={[-1, 14.6, -0.6]} s={[4.3, 3.3, 4.3]} color='#b4a6f2' />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <Box
            key={i}
            p={[-1 + Math.sin(a) * 4.32, 14.6, -0.6 + Math.cos(a) * 4.32]}
            s={[0.45, 1.1, 0.08]}
            r={[0, a, 0]}
            color='#a9e0f2'
            finish={GLASS}
          />
        );
      })}
      {/* Coupole, nervures et fente d'observation */}
      <mesh position={[-1, 16.3, -0.6]} castShadow material={material(C.white)}>
        <sphereGeometry args={[4.3, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          position={[-1, 16.3, -0.6]}
          rotation={[0, (i * Math.PI) / 3, 0]}
          material={material(C.concrete)}
        >
          <torusGeometry args={[4.33, 0.07, 5, 28, Math.PI]} />
        </mesh>
      ))}
      <mesh position={[-1, 16.3, -0.6]} rotation={[0, -0.5, 0]} material={material(C.ink)}>
        <torusGeometry args={[4.36, 0.42, 4, 24, Math.PI / 2.4]} />
      </mesh>
      <Cylinder p={[1.7, 17.2, 1.4]} s={[0.7, 5, 0.7]} r={[Math.PI / 2 - 0.4, 0, -0.5]} color={C.ink} />
      <Cylinder
        p={[-1, 16.35, -0.6]}
        s={[4.45, 0.12, 4.45]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 0.6 }}
        shadow={false}
      />
      {/* Entrée */}
      <Box p={[0, 3.95, 6.6]} s={[4.4, 0.25, 1.6]} color={C.white} />
      {[-2, 2].map((x) => (
        <Cylinder key={x} p={[x, 1.95, 7.2]} s={[0.12, 3.9, 0.12]} color={C.white} />
      ))}
      <Sign
        text={place('project-3').enseigne}
        p={[0, 4.55, 6.62]}
        s={[5.6, 0.9]}
        color={C.white}
        bg={placeColor['project-3']}
      />
      <WallLamp p={[-1.9, 2.7, 5.6]} />
      <WallLamp p={[1.9, 2.7, 5.6]} />
    </>
  );
}

/** Autres missions : galerie de trois pavillons. */
function Atelier() {
  return (
    <>
      {[-4.7, 0, 4.7].map((x, i) => {
        const roof = i === 1 ? C.white : placeColor.missions;
        const wall = i === 1 ? C.cream : '#d8f1ea';
        return (
          <group key={x} position={[x, 0, i === 1 ? -1 : 0]}>
            <Bevel p={[0, 2.5, 0]} s={[4.3, 5, 8.2]} color={wall} radius={0.12} />
            <Windows
              p={[0, i === 1 ? 2.05 : 2.45, 4.12]}
              w={3.6}
              h={i === 1 ? 3.4 : 4.2}
              cols={i === 1 ? 2 : 3}
              rows={3}
              frame={C.white}
              glass={C.glass}
              sill={false}
              lit={i === 0 ? [1] : i === 2 ? [7] : []}
            />
            <Windows p={[0, 3, -4.12]} r={[0, Math.PI, 0]} w={3} h={2} cols={2} />
            {/* Toiture à un pan : rive, couverture et verrière */}
            <Box p={[0, 5.8, 0]} s={[5, 0.35, 9]} r={[0, 0, i % 2 ? 0.27 : -0.27]} color={roof} />
            <Box p={[0, 5.62, 4.52]} s={[5.05, 0.5, 0.1]} r={[0, 0, i % 2 ? 0.27 : -0.27]} color={C.ink} />
            <Box
              p={[i % 2 ? -0.8 : 0.8, 6.05, -1]}
              s={[1.4, 0.12, 3.2]}
              r={[0, 0, i % 2 ? 0.27 : -0.27]}
              color='#a9e0f2'
              finish={GLASS}
            />
            {[-2, 2].map((s) => (
              <Box key={s} p={[s, 2.9, 4.35]} s={[0.16, 5.8, 0.2]} color={C.white} />
            ))}
            {i !== 1 && <Awning p={[0, 4.95, 4.35]} w={3.8} d={0.9} color={placeColor.missions} />}
          </group>
        );
      })}
      <Sign text={place('missions').enseigne} p={[0, 4.3, 3.3]} s={[3.4, 0.8]} color={C.ink} bg={C.white} />
      {/* Guirlande entre les pavillons */}
      {Array.from({ length: 9 }, (_, i) => (
        <Ball
          key={i}
          p={[-6 + i * 1.5, 5.3 - Math.sin((i / 8) * Math.PI) * 0.5, 5.5]}
          s={[0.1, 0.1, 0.1]}
          color={C.lamp}
          finish={{ glow: C.lamp, glowIntensity: 1.5 }}
        />
      ))}
      <Box p={[-5.4, 0.6, 5.2]} s={[2, 1.2, 0.6]} color={C.orange} />
      <Ball p={[-5.4, 1.8, 5.2]} s={[0.65, 0.9, 0.65]} color={C.violetSoft} />
      <Planter p={[5.4, 0, 5.4]} w={2.2} />
    </>
  );
}

/** Veolia : bâtiment technique, cuves, réseaux et passerelle. */
function Veolia() {
  return (
    <>
      <Bevel p={[0, 2.3, 0]} s={[16.5, 4.6, 11.8]} color='#f7f4ec' radius={0.18} />
      <Box p={[0, 0.35, 5.93]} s={[16.5, 0.7, 0.06]} color={C.red} />
      {[-1, 1].map((side) => (
        <Windows
          key={side}
          p={[side * 8.28, 2.4, 0]}
          r={[0, side * (Math.PI / 2), 0]}
          w={9}
          h={1.8}
          cols={6}
          glass={C.glass}
        />
      ))}
      {[-6.7, -4.6, 4.6, 6.7].map((x, i) => (
        <Windows
          key={x}
          p={[x, 1.95, 5.95]}
          w={1.7}
          h={2.3}
          rows={2}
          glass={C.glass}
          lit={i === 1 ? [1] : []}
        />
      ))}
      {[-1, 1].map((side) => (
        <Windows
          key={side}
          p={[side * 5.6, 4.6, -5.95]}
          r={[0, Math.PI, 0]}
          w={4}
          h={1.2}
          cols={4}
          sill={false}
        />
      ))}
      {/* Cuves : bagues, échelles, toits coniques */}
      {[-4.4, 4.4].map((x, i) => (
        <group key={x}>
          <Cylinder
            p={[x, 7.8, -1]}
            s={[3.4, 8, 3.4]}
            color={i ? '#eddaaf' : '#d1e2da'}
            finish={{ rough: 0.55, metal: 0.15 }}
          />
          <Cylinder p={[x, 11.9, -1]} s={[3.65, 0.3, 3.65]} color={C.white} />
          <Cylinder p={[x, 8.4, -1]} s={[3.46, 0.55, 3.46]} color={C.red} />
          <Cylinder p={[x, 5.2, -1]} s={[3.5, 0.25, 3.5]} color={C.concrete} />
          <Cone p={[x, 12.05, -1]} s={[3.5, 1.5, 3.5]} color={C.white} />
          <Beam a={[x, 12, 1.5]} b={[x, 5.1, 1.5]} width={0.4} color={C.red} />
          {/* Échelle */}
          <group position={[x + (i ? -2.4 : 2.4), 0, -1]} rotation={[0, i ? -Math.PI / 2 : Math.PI / 2, 0]}>
            {[-0.25, 0.25].map((dx) => (
              <Box key={dx} p={[dx, 8.6, 1.05]} s={[0.06, 7, 0.06]} color={C.metal} shadow={false} />
            ))}
            {Array.from({ length: 12 }, (_, k) => (
              <Box
                key={k}
                p={[0, 5.4 + k * 0.55, 1.05]}
                s={[0.5, 0.05, 0.05]}
                color={C.metal}
                shadow={false}
              />
            ))}
          </group>
        </group>
      ))}
      {/* Réseaux et passerelle */}
      <Beam a={[-4.4, 9, 2.6]} b={[4.4, 9, 2.6]} width={0.5} color={C.red} />
      <Box p={[0, 11.95, -1]} s={[2.8, 0.16, 1.2]} color={C.metal} finish={METAL} />
      <Railing a={[-1.4, 12, -0.45]} b={[1.4, 12, -0.45]} posts={3} h={0.8} color={C.red} />
      <Railing a={[-1.4, 12, -1.55]} b={[1.4, 12, -1.55]} posts={3} h={0.8} color={C.red} />
      {[-7.4, 7.4].map((x) => (
        <group key={x}>
          <Cylinder p={[x, 5.3, -4.4]} s={[0.35, 1.4, 0.35]} color={C.metal} finish={METAL} />
          <Cylinder p={[x, 6.05, -4.4]} s={[0.5, 0.18, 0.5]} color={C.red} />
        </group>
      ))}
      {/* Marquise et enseigne */}
      <Box p={[0, 5.6, 4.9]} s={[16.9, 0.3, 3.4]} color={C.white} />
      <Box
        p={[0, 5.42, 6.58]}
        s={[16.9, 0.08, 0.06]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 0.8 }}
        shadow={false}
      />
      <Box p={[0, 3.9, 6.1]} s={[16, 1.6, 0.3]} color={C.white} />
      <Sign text={place('veolia').enseigne} p={[0, 4.05, 6.28]} s={[7, 1.5]} color='#e4212d' bg={C.white} />
      <Sign
        text={place('veolia').enseigne}
        p={[0, 9.4, -4.5]}
        s={[7, 1.5]}
        rotation={[0, Math.PI, 0]}
        color='#e4212d'
        bg={C.white}
      />
      {[-5, 0, 5].map((x) => (
        <SolarPanel key={x} p={[x, 5.7, 4.6]} w={3.4} d={2} />
      ))}
      <WallLamp p={[-2.1, 2.6, 6.02]} />
      <WallLamp p={[2.1, 2.6, 6.02]} />
    </>
  );
}

/** Porte commune : encadrement, linteau à la couleur du lieu, porte coulissante animée. */
function Portal({ b }: { b: Building }) {
  return (
    <group position={[0, 0, b.size[1] / 2 + 0.5]}>
      <Box p={[0, 1.7, -0.12]} s={[2.9, 3.4, 0.22]} color={C.slate} />
      {[-1, 1].map((side) => (
        <Bevel key={side} p={[side * 1.65, 1.8, 0.2]} s={[0.3, 3.6, 1]} color={C.white} radius={0.08} />
      ))}
      <Bevel p={[0, 3.62, 0.25]} s={[3.6, 0.34, 1.1]} color={placeColor[b.id]} radius={0.08} />
      <group userData={{ dynamic: true }}>
        <SlidingDoor id={b.id} />
      </group>
      <Box p={[0, 0.05, 1.25]} s={[4, 0.1, 2.4]} color={C.white} />
    </group>
  );
}

const models = {
  profile: Portrait,
  'project-1': Innovation,
  'project-2': Mechanism,
  'project-3': Discovery,
  missions: Atelier,
  veolia: Veolia,
};

/**
 * Un bâtiment : socle, modèle, porte et totem. Les pièces statiques sont fusionnées par matériau ;
 * chaque maillage reçoit un matériau propre pour devenir transparent quand il cache le robot.
 */
function BuildingModel({ b }: { b: Building }) {
  const Model = models[b.id];
  const root = useRef<THREE.Group>(null!);
  const faded = useRef<THREE.MeshStandardMaterial[]>([]);
  const ray = useMemo(() => new THREE.Ray(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const bounds = useMemo(
    () =>
      new THREE.Box3(
        new THREE.Vector3(-b.size[0] / 2, -0.2, -b.size[1] / 2),
        new THREE.Vector3(b.size[0] / 2, b.height, b.size[1] / 2),
      ),
    [b],
  );
  useLayoutEffect(() => {
    const batch = batchMeshes(root.current);
    const owned: THREE.MeshStandardMaterial[] = [];
    const clones: THREE.MeshStandardMaterial[] = [];
    const originals = new Map<THREE.Mesh, THREE.Material>();
    root.current.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.visible) return;
      if (!(object.material instanceof THREE.MeshStandardMaterial)) return;
      // Panneaux et maillages regroupés ont déjà un matériau propre ; seuls les partagés sont clonés.
      if (object.material.map || object.userData.batched) {
        owned.push(object.material);
        return;
      }
      originals.set(object, object.material);
      const clone = object.material.clone();
      object.material = clone;
      owned.push(clone);
      clones.push(clone);
    });
    faded.current = owned;
    return () => {
      originals.forEach((m, mesh) => (mesh.material = m));
      clones.forEach((m) => m.dispose());
      faded.current = [];
      batch.restore();
    };
  }, []);
  useFrame(({ camera }, dt) => {
    const s = getState();
    let obscured = false;
    if (s.phase === 'explore' || s.phase === 'travel') {
      ray.origin.set(player.x, player.y + 1.6, player.z);
      root.current.worldToLocal(ray.origin);
      target.copy(camera.position);
      root.current.worldToLocal(target);
      const distance = ray.origin.distanceTo(target);
      ray.direction.subVectors(target, ray.origin).normalize();
      obscured = !!ray.intersectBox(bounds, hit) && hit.distanceTo(ray.origin) < distance;
    }
    for (const m of faded.current) {
      const alpha = THREE.MathUtils.damp(m.opacity, obscured ? 0.24 : 1, 7, dt);
      if (Math.abs(alpha - m.opacity) < 1e-4 && alpha === 1) continue;
      m.opacity = alpha;
      m.transparent = alpha < 0.99;
      m.depthWrite = alpha >= 0.99;
    }
  });
  const totem: [number, number, number] = [b.size[0] / 2 + 0.9, 0, b.size[1] / 2 + 1.4];
  return (
    <group ref={root} position={[b.position[0], b.elevation, b.position[1]]} rotation={[0, b.rotation, 0]}>
      {/* Socle en deux assises */}
      <Box p={[0, -0.25, 0]} s={[b.size[0] + 2.2, 0.5, b.size[1] + 2.2]} color={C.stoneDark} />
      <Box p={[0, -0.02, 0]} s={[b.size[0] + 1.8, 0.06, b.size[1] + 1.8]} color={C.stone} />
      <Model />
      <Portal b={b} />
      {/* Totem d'entrée au nom du lieu */}
      <group position={totem}>
        <Bevel p={[0, 1.1, 0]} s={[1.6, 2.2, 0.3]} color={placeColor[b.id]} radius={0.1} />
        <Sign text={place(b.id).titre} p={[0, 1.55, 0.16]} s={[1.45, 0.5]} color={C.ink} bg={C.white} />
      </group>
    </group>
  );
}

export default function Buildings() {
  return (
    <>
      {buildings.map((b) => (
        <BuildingModel key={b.id} b={b} />
      ))}
    </>
  );
}
