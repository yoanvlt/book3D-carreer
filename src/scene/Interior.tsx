import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SlidingDoor from './SlidingDoor';
import StaticBatch from './StaticBatch';
import { Ball, Beam, Box, Cone, Cylinder, GLASS, METAL, Sign, material } from './Primitives';
import { Bevel, Planter, Windows } from './kit';
import { color as C, interiors, placeColor, type InteriorMood } from '../design/tokens';
import { buildings, type BuildingId } from '../world/config';
import {
  DOOR_PLANTERS,
  FURNITURE,
  ROOM,
  ROWS,
  STATION,
  VEOLIA_COLUMNS,
  stationsFor,
  type Footprint,
  type Station,
} from '../world/narrative';
import { getState, useGame } from '../state';
import { isOpen, place, stationContentById } from '../content';

const W = ROOM.halfWidth;
const D = ROOM.halfDepth;
const WALL_H = 7.6;
/** Écran tourné vers l'allée et un peu vers la porte, pour être lu en avançant. */
const SCREEN_TURN = 0.45;

/** Première phrase d'une station, pour l'écran vu depuis l'allée. */
function excerpt(id: BuildingId, station: Station): string | null {
  const content = stationContentById(id, station.id);
  const first = content?.texte.find((b) => b.type === 'p');
  if (!first || first.type !== 'p') return null;
  const text = first.inline.map((i) => i.v).join('');
  const sentence = text.split(/(?<=[.!?])\s/)[0];
  return sentence.length > 48 ? sentence.slice(0, 46).trimEnd() + '…' : sentence;
}

/** Une station : socle et objet exposé dans l'allée, écran adossé au mur derrière. */
function Exhibit({ id, station, mood }: { id: BuildingId; station: Station; mood: InteriorMood }) {
  const sculpture = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  const content = stationContentById(id, station.id);
  const accent = placeColor[id];
  const side = Math.sign(station.position[0]);
  useFrame(({ clock }, dt) => {
    const s = getState();
    const active = s.station === station.id;
    glow.current.emissiveIntensity = THREE.MathUtils.damp(
      glow.current.emissiveIntensity,
      active ? 0.6 : 0.14,
      5,
      dt,
    );
    sculpture.current.rotation.y = s.reducedMotion
      ? 0
      : Math.sin(clock.elapsedTime * 0.22 + station.position[1]) * 0.22;
    sculpture.current.position.y = THREE.MathUtils.damp(
      sculpture.current.position.y,
      active ? 0.25 : 0,
      4,
      dt,
    );
  });
  const line = excerpt(id, station);
  const [x, z] = station.position;
  return (
    <>
      <group position={[x, 0, z]}>
        <Bevel p={[0, 0.42, 0]} s={[2.4, 0.84, 1.4]} color={mood.wall} radius={0.08} />
        <Box p={[0, 0.86, 0]} s={[2.5, 0.06, 1.5]} color={accent} />
        <group ref={sculpture} userData={{ dynamic: true }}>
          {station.object === 'portrait' ? (
            <>
              <Box p={[0, 1.4, 0]} s={[0.7, 1, 0.45]} color={accent} />
              <Ball p={[0, 2.25, 0]} s={[0.4, 0.5, 0.4]} color='#ffd3ad' />
              <Box p={[0, 2.6, -0.04]} s={[0.75, 0.17, 0.6]} color={C.ink} />
            </>
          ) : station.object === 'network' ? (
            <>
              {[
                [-0.6, 1.35, 0],
                [0.6, 2.05, 0],
                [-0.3, 2.55, 0],
              ].map((p, i) => (
                <Ball
                  key={i}
                  p={p as [number, number, number]}
                  s={[0.28, 0.28, 0.28]}
                  color={i === 1 ? accent : C.white}
                />
              ))}
              <Beam a={[-0.6, 1.35, 0]} b={[0.6, 2.05, 0]} width={0.08} color={C.ink} />
              <Beam a={[0.6, 2.05, 0]} b={[-0.3, 2.55, 0]} width={0.08} color={C.ink} />
            </>
          ) : station.object === 'data' ? (
            <>
              {[-0.65, 0, 0.65].map((bx, i) => (
                <Box
                  key={bx}
                  p={[bx, 1.15 + i * 0.3, 0]}
                  s={[0.45, 0.6 + i * 0.6, 0.45]}
                  color={i === 1 ? C.glass : accent}
                />
              ))}
            </>
          ) : (
            <mesh position={[0, 1.75, 0]} castShadow material={material(accent, { rough: 0.4 })}>
              <torusKnotGeometry args={[0.5, 0.14, 48, 6]} />
            </mesh>
          )}
        </group>
      </group>
      {/* Écran adossé au mur, absent sur un emplacement sans contenu. */}
      <group
        position={[side * STATION.screenX, 0, z]}
        rotation={[0, side > 0 ? -Math.PI / 2 + SCREEN_TURN : Math.PI / 2 - SCREEN_TURN, 0]}
        visible={!!content}
      >
        <Box p={[0, 0.75, -0.1]} s={[0.16, 1.5, 0.16]} color={C.ink} />
        <Bevel p={[0, 2.75, -0.12]} s={[3.8, 2.4, 0.2]} color={C.ink} radius={0.1} />
        <mesh position={[0, 2.75, -0.01]} userData={{ dynamic: true }}>
          <planeGeometry args={[3.55, 2.15]} />
          <meshStandardMaterial ref={glow} color={mood.screen} emissive={accent} emissiveIntensity={0.14} />
        </mesh>
        {content && (
          <>
            <Sign
              text={content.titre}
              p={[0, line ? 3.2 : 2.75, 0.01]}
              s={[3.3, 0.8]}
              color={C.white}
              bg='transparent'
            />
            {line && (
              <Sign
                text={line}
                p={[0, 2.4, 0.01]}
                s={[3.3, 0.42]}
                color='#dfe7ec'
                bg='transparent'
                weight={500}
              />
            )}
          </>
        )}
      </group>
    </>
  );
}

/** Bibliothèque ouverte : montants, étagères et livres visibles depuis l'allée. */
function Bookcase({ f }: { f: Footprint }) {
  const [x, z, hx, hz] = f;
  const facing = -Math.sign(x); // vers le centre de la salle
  const depth = hx * 2;
  return (
    <group position={[x, 0, z]}>
      <Box p={[-facing * (hx - 0.05), 1.5, 0]} s={[0.1, 3, hz * 2]} color={C.woodDark} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[0, 1.5, s * (hz - 0.05)]} s={[depth, 3, 0.1]} color={C.woodDark} />
      ))}
      {[0.08, 0.85, 1.65, 2.45, 2.95].map((y) => (
        <Box key={y} p={[0, y, 0]} s={[depth, 0.08, hz * 2]} color={C.wood} />
      ))}
      {[0.12, 0.89, 1.69].map((y, row) =>
        Array.from({ length: 9 }, (_, k) => {
          const h = 0.48 + ((k * 5 + row * 3) % 4) * 0.06;
          return (
            <Box
              key={`${row}-${k}`}
              p={[facing * 0.04, y + h / 2 + 0.04, -hz + 0.3 + k * ((hz * 2 - 0.6) / 8)]}
              s={[depth * 0.7, h, 0.2]}
              r={[k === 7 ? 0.25 : 0, 0, 0]}
              color={[C.orange, C.white, C.blueDeep, C.yellow, C.teal, C.violetSoft][(k + row * 2) % 6]}
              shadow={false}
            />
          );
        }),
      )}
      <Ball p={[facing * 0.05, 2.75, hz * 0.4]} s={[0.25, 0.3, 0.25]} color={C.leaf} />
      <Cylinder p={[facing * 0.05, 2.6, hz * 0.4]} s={[0.18, 0.2, 0.18]} color={C.white} />
    </group>
  );
}
function Plant({ p, scale = 1, pot }: { p: [number, number]; scale?: number; pot: string }) {
  return (
    <group position={[p[0], 0, p[1]]} scale={scale}>
      <Cylinder p={[0, 0.45, 0]} s={[0.6, 0.9, 0.6]} color={pot} />
      <Cylinder p={[0, 0.92, 0]} s={[0.66, 0.08, 0.66]} color={C.woodDark} />
      <Ball p={[0, 1.6, 0]} s={[0.75, 0.85, 0.75]} color={C.leaf} />
      <Ball p={[0.35, 1.3, 0.2]} s={[0.5, 0.55, 0.5]} color={C.leafDark} />
      <Ball p={[-0.3, 1.35, -0.2]} s={[0.5, 0.6, 0.5]} color={C.leaf} />
      <Ball p={[0.05, 2.2, 0.05]} s={[0.4, 0.45, 0.4]} color={C.leafDark} />
    </group>
  );
}
function Pendant({ p, color }: { p: [number, number, number]; color: string }) {
  return (
    <group position={p}>
      <Cylinder
        p={[0, (WALL_H - p[1]) / 2, 0]}
        s={[0.02, WALL_H - p[1], 0.02]}
        color={C.ink}
        shadow={false}
      />
      <Cone p={[0, 0.15, 0]} s={[0.55, 0.4, 0.55]} color={color} shadow={false} />
      <Ball
        p={[0, -0.08, 0]}
        s={[0.18, 0.18, 0.18]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 2 }}
      />
    </group>
  );
}
/** Lignes lumineuses au plafond, tout le long de la salle. */
function CeilingLights({ color = '#ffffff' }: { color?: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Box
          key={s}
          p={[s * 4, WALL_H - 0.12, 0]}
          s={[0.25, 0.08, D * 2 - 4]}
          color={C.lamp}
          finish={{ glow: color, glowIntensity: 1.1 }}
          shadow={false}
        />
      ))}
    </>
  );
}

/** Décor propre à chaque lieu. Le mobilier qui gêne la marche suit FURNITURE (narrative.ts). */
function Theme({ id, mood }: { id: BuildingId; mood: InteriorMood }) {
  const f = FURNITURE[id];
  const pendants = (color: string) =>
    [-8, -2, 4].map((z) => <Pendant key={z} p={[0, 6.6, z]} color={color} />);
  const gaps = [9.5, 4.5, -0.5, -5.5, -10.5];
  switch (id) {
    case 'profile':
      return (
        <>
          {f.slice(0, 4).map((p, i) => (
            <Bookcase key={i} f={p} />
          ))}
          <group position={[f[4][0], 0, f[4][1]]}>
            <Bevel p={[0, 0.4, 0]} s={[4.4, 0.6, 1.2]} color={mood.accent} radius={0.2} />
            <Bevel p={[0, 0.95, -0.45]} s={[4.4, 0.9, 0.3]} color={mood.accent} radius={0.15} />
            {[-1, 1].map((s) => (
              <Bevel key={s} p={[s * 2.1, 0.75, 0]} s={[0.3, 0.7, 1.2]} color={mood.accent} radius={0.12} />
            ))}
            <Bevel p={[-1, 0.85, 0.05]} s={[0.7, 0.5, 0.3]} color={C.yellow} radius={0.12} />
            <Bevel p={[0.9, 0.85, 0.05]} s={[0.7, 0.5, 0.3]} color={C.blue} radius={0.12} />
          </group>
          <group position={[f[5][0], 0, f[5][1]]}>
            <Bevel p={[0, 0.45, 0]} s={[1.5, 0.6, 1.3]} color={C.blue} radius={0.2} />
            <Bevel p={[0, 1, -0.5]} s={[1.5, 0.9, 0.3]} color={C.blue} radius={0.12} />
          </group>
          <group position={[6, 0, -D + 1.3]}>
            <Cylinder p={[0, 1.3, 0]} s={[0.05, 2.6, 0.05]} color={C.ink} />
            <Cone p={[0, 2.75, 0]} s={[0.5, 0.5, 0.5]} color={C.white} />
            <Ball
              p={[0, 2.55, 0]}
              s={[0.14, 0.14, 0.14]}
              color={C.lamp}
              finish={{ glow: C.lamp, glowIntensity: 2 }}
            />
          </group>
          {/* Tapis dans l'allée */}
          <Box p={[0, 0.012, -1]} s={[4, 0.02, D * 2 - 6]} color={mood.accent} shadow={false} />
          <Box p={[0, 0.02, -1]} s={[3.4, 0.02, D * 2 - 6.6]} color='#ffb38a' shadow={false} />
          {pendants(C.white)}
        </>
      );
    case 'project-1':
      return (
        <>
          <group position={[f[0][0], 0, f[0][1]]}>
            <Bevel p={[0, 0.78, 0]} s={[5.2, 0.1, 1.4]} color={C.white} radius={0.04} />
            {[-2.3, 2.3].map((x) => (
              <Box key={x} p={[x, 0.38, 0]} s={[0.1, 0.76, 1.2]} color={C.metal} />
            ))}
            {[-1.6, 0, 1.6].map((x) => (
              <Bevel
                key={x}
                p={[x, 1.1, 0]}
                s={[1, 0.6, 0.06]}
                r={[-0.3, 0, 0]}
                color={mood.screen}
                finish={{ glow: mood.accent, glowIntensity: 0.3 }}
              />
            ))}
          </group>
          {[-1, 1].flatMap((s) =>
            gaps.map((z) => (
              <Box
                key={`${s}${z}`}
                p={[s * (W - 0.35), 1.6, z]}
                s={[0.5, 3.2, 0.08]}
                color={C.glass}
                finish={GLASS}
              />
            )),
          )}
          <CeilingLights />
        </>
      );
    case 'project-2':
      return (
        <>
          <group position={[f[0][0], 0, f[0][1]]}>
            {[-2.4, -0.8, 0.8, 2.4].map((x, i) => (
              <Box
                key={x}
                p={[x, 0.5 + (i % 2) * 0.1, 0]}
                s={[1.4, 1 + (i % 2) * 0.2, 1]}
                r={[0, i * 0.08, 0]}
                color={i % 2 ? C.woodDark : C.wood}
              />
            ))}
            <Box p={[-1.6, 1.35, 0]} s={[1.2, 0.7, 0.9]} color={C.yellow} />
          </group>
          {gaps.map((z) => (
            <group key={z}>
              <Beam a={[-W + 0.35, 0, z]} b={[-W + 0.35, 7.4, z]} width={0.3} color={mood.accent} />
              <Beam a={[W - 0.35, 0, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
              <Beam a={[-W + 0.35, 7.4, z]} b={[W - 0.35, 7.4, z]} width={0.3} color={mood.accent} />
            </group>
          ))}
          {[-2.1, 2.1].map((x) => (
            <Box key={x} p={[x, 0.02, -1]} s={[0.18, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
          ))}
          {pendants(C.slate)}
        </>
      );
    case 'project-3':
      return (
        <>
          <group position={[f[0][0], 0, f[0][1]]}>
            {[0, 2.1, 4.2].map((a) => (
              <Beam
                key={a}
                a={[Math.sin(a) * 0.9, 0, Math.cos(a) * 0.9]}
                b={[0, 1.6, 0]}
                width={0.08}
                color={C.ink}
              />
            ))}
            <Cylinder
              p={[0, 2.1, 0.2]}
              s={[0.32, 2.4, 0.32]}
              r={[0.9, 0, 0]}
              color={C.white}
              finish={METAL}
            />
            <Cylinder p={[0, 2.85, -0.75]} s={[0.4, 0.2, 0.4]} r={[0.9, 0, 0]} color={mood.accent} />
          </group>
          {Array.from({ length: 34 }, (_, i) => {
            const x = -10 + ((i * 37) % 20);
            const y = 1 + ((i * 53) % 62) / 10;
            if (Math.abs(x) < 6 && y > 1.6 && y < 5.6) return null;
            const r = 0.06 * (1 + (i % 3));
            return (
              <Ball
                key={i}
                p={[x, y, -D + 0.25]}
                s={[r, r, r]}
                color={C.lamp}
                finish={{ glow: C.lamp, glowIntensity: 1.6 }}
                shadow={false}
              />
            );
          })}
          <CeilingLights color='#d9d0ff' />
        </>
      );
    case 'missions':
      return (
        <>
          {f.map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Box p={[0, 0.6, 0]} s={[1, 1.2, 1]} color={C.white} />
              <Ball p={[0, 1.6, 0]} s={[0.45, 0.6, 0.45]} color={i ? C.violet : mood.accent} />
            </group>
          ))}
          {[-1, 1].flatMap((s) =>
            gaps.slice(1, 4).map((z, i) => (
              <group
                key={`${s}${z}`}
                position={[s * (W - 0.03), 5.3, z]}
                rotation={[0, (-s * Math.PI) / 2, 0]}
              >
                <Box p={[0, 0, 0]} s={[1.6, 1.2, 0.06]} color={C.ink} shadow={false} />
                <Box
                  p={[0, 0, 0.04]}
                  s={[1.4, 1, 0.04]}
                  color={[mood.accent, C.blue, C.yellow][i]}
                  shadow={false}
                />
              </group>
            )),
          )}
          <CeilingLights />
        </>
      );
    case 'veolia':
      return (
        <>
          <group position={[f[0][0], 0, f[0][1]]}>
            <Bevel p={[0, 0.5, 0]} s={[6, 1, 1.2]} color={C.white} radius={0.08} />
            <Box p={[0, 1.05, 0.2]} s={[5.8, 0.08, 0.9]} r={[-0.35, 0, 0]} color={C.ink} />
            {[-2, 0, 2].map((x) => (
              <Box
                key={x}
                p={[x, 1.7, -0.4]}
                s={[1.6, 1, 0.08]}
                color={mood.screen}
                finish={{ glow: C.teal, glowIntensity: 0.3 }}
              />
            ))}
          </group>
          {VEOLIA_COLUMNS.map(([x, z]) => (
            <group key={x}>
              <Cylinder p={[x, 3, z]} s={[0.75, 6, 0.75]} color={C.white} finish={METAL} />
              <Cylinder p={[x, 4.2, z]} s={[0.78, 0.35, 0.78]} color={mood.accent} />
            </group>
          ))}
          {[-1, 1].map((s) =>
            [5.6, 6.3].map((y, i) => (
              <Cylinder
                key={`${s}${y}`}
                p={[s * (W - 0.25), y, 0]}
                s={[0.16 + i * 0.06, D * 2 - 1, 0.16 + i * 0.06]}
                r={[Math.PI / 2, 0, 0]}
                color={i ? mood.accent : C.metal}
              />
            )),
          )}
          {[-2.1, 2.1].map((x) => (
            <Box key={x} p={[x, 0.02, -1]} s={[0.14, 0.02, D * 2 - 4]} color={mood.accent} shadow={false} />
          ))}
          {pendants(C.white)}
        </>
      );
  }
}

/** Coque de la salle : sol, murs, plafond, fenêtres hautes, porte et titre. */
function Room({ id, mood, children }: { id: BuildingId; mood: InteriorMood; children: ReactNode }) {
  const content = place(id);
  const open = isOpen(id);
  return (
    <>
      <StaticBatch>
        <Box p={[0, -0.5, 0]} s={[90, 0.8, 90]} color={mood.ceiling} shadow={false} />
        <Box p={[0, -0.12, 0]} s={[W * 2, 0.24, D * 2]} color={mood.floor} shadow={false} />
        {Array.from({ length: 11 }, (_, i) => (
          <Box
            key={i}
            p={[-W + 1 + i * 2, 0.005, 0]}
            s={[0.03, 0.01, D * 2]}
            color={mood.floorLine}
            shadow={false}
          />
        ))}
        {[-1, 1].map((side) => (
          <group key={side}>
            <Box
              p={[side * (W + 0.2), WALL_H / 2, 0]}
              s={[0.4, WALL_H, D * 2]}
              color={mood.wall}
              shadow={false}
            />
            <Box p={[side * (W - 0.05), 0.15, 0]} s={[0.12, 0.3, D * 2]} color={mood.accent} shadow={false} />
            {/* Fenêtres hautes entre les rangées, au-dessus des écrans */}
            {[ROWS[0] + 2.5, ROWS[1] + 2.5, ROWS[2] + 2.5, ROWS[3] + 2.5, ROWS[3] - 2.5].map((z) => (
              <Windows
                key={z}
                p={[side * (W - 0.02), 5.7, z]}
                r={[0, -side * (Math.PI / 2), 0]}
                w={2.4}
                h={1.3}
                cols={2}
                frame={C.white}
                glass='#bfe6f5'
                sill={false}
              />
            ))}
            <Box
              p={[side * 6.6, WALL_H / 2, D - 0.05]}
              s={[8.8, WALL_H, 0.3]}
              color={mood.wall}
              shadow={false}
            />
          </group>
        ))}
        {DOOR_PLANTERS.map((p) => (
          <Plant key={p[0]} p={p} scale={1.15} pot={mood.accent} />
        ))}
        <Box
          p={[0, WALL_H / 2 + 1.75, D - 0.05]}
          s={[4.4, WALL_H - 3.5, 0.3]}
          color={mood.wall}
          shadow={false}
        />
        <Box p={[0, WALL_H + 0.1, 0]} s={[W * 2 + 0.8, 0.2, D * 2]} color={mood.ceiling} shadow={false} />
        <Box p={[0, WALL_H / 2, -D]} s={[W * 2, WALL_H, 0.4]} color={mood.backWall} shadow={false} />
        {children}
        <Planter p={[-4, 0, D - 1.4]} w={2} color={mood.accent} />
        <Planter p={[4, 0, D - 1.4]} w={2} color={mood.accent} />
      </StaticBatch>
      <group position={[0, 0, D - 0.2]} rotation={[0, Math.PI, 0]}>
        <SlidingDoor id={id} />
      </group>
      <Sign
        text='Sortie'
        p={[0, 4.1, D - 0.25]}
        s={[2.4, 0.7]}
        rotation={[0, Math.PI, 0]}
        color={C.white}
        bg={C.ink}
      />
      {/* Titre du lieu sur le mur du fond, au-dessus du mobilier, rien devant. */}
      <Sign
        text={content.titre}
        p={[0, open ? 4.4 : 4.9, -D + 0.24]}
        s={[10, 1.5]}
        color={C.white}
        bg='transparent'
      />
      {!open && (
        <Sign text='Bientôt' p={[0, 3.1, -D + 0.24]} s={[7, 1.4]} color={mood.backWall} bg={C.white} />
      )}
    </>
  );
}

export default function Interior() {
  const { interior } = useGame();
  if (!interior) return null;
  const b = buildings.find((b) => b.id === interior)!;
  const mood = interiors[b.id];
  return (
    <>
      <color attach='background' args={[mood.ceiling]} />
      <ambientLight color={mood.ambient} intensity={mood.ambientIntensity * 0.8} />
      <directionalLight position={[0, 12, 10]} intensity={mood.lightIntensity} color={mood.light} />
      {/* Appoint latéral : les deux murs restent clairs quelle que soit la direction du soleil extérieur. */}
      <directionalLight position={[14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <directionalLight position={[-14, 6, 2]} intensity={mood.lightIntensity * 0.45} color={mood.light} />
      <Room id={b.id} mood={mood}>
        <Theme id={b.id} mood={mood} />
      </Room>
      <StaticBatch>
        {stationsFor(b.id).map((station) => (
          <Exhibit key={station.id} id={b.id} station={station} mood={mood} />
        ))}
      </StaticBatch>
    </>
  );
}
