import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SlidingDoor from './SlidingDoor';
import StaticBatch from './StaticBatch';
import { Ball, Beam, Box, Cone, Cylinder, GLASS, METAL, Sign, material } from './Primitives';
import { Bevel, Planter, Windows } from './kit';
import { color as C, interiors, placeColor, type InteriorMood } from '../design/tokens';
import { buildings, type BuildingId } from '../world/config';
import { FURNITURE, ROOM, stationsFor, type Footprint, type Station } from '../world/narrative';
import { getState, useGame } from '../state';
import { isOpen, place, stationContentById } from '../content';

const W = ROOM.halfWidth;
const D = ROOM.halfDepth;
const WALL_H = 7.6;

/** Première phrase d'une station, pour l'écran vu depuis l'allée. */
function excerpt(id: BuildingId, station: Station): string | null {
  const content = stationContentById(id, station.id);
  const first = content?.texte.find((b) => b.type === 'p');
  if (!first || first.type !== 'p') return null;
  const text = first.inline.map((i) => i.v).join('');
  const sentence = text.split(/(?<=[.!?])\s/)[0];
  return sentence.length > 64 ? sentence.slice(0, 62).trimEnd() + '…' : sentence;
}

/** Une station : socle, objet exposé et écran orienté vers l'allée. */
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
      active ? 0.55 : 0.12,
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
  return (
    <group position={[station.position[0], 0, station.position[1] - 1.3]}>
      {/* Socle */}
      <Bevel p={[0, 0.36, 0]} s={[3.4, 0.72, 1.45]} color={mood.wall} radius={0.08} />
      <Box p={[0, 0.74, 0]} s={[3.6, 0.08, 1.6]} color={accent} />
      <group ref={sculpture} userData={{ dynamic: true }}>
        {station.object === 'portrait' ? (
          <>
            <Box p={[0, 1.35, 0]} s={[0.7, 1, 0.45]} color={accent} />
            <Ball p={[0, 2.2, 0]} s={[0.4, 0.5, 0.4]} color='#ffd3ad' />
            <Box p={[0, 2.55, -0.04]} s={[0.75, 0.17, 0.6]} color={C.ink} />
          </>
        ) : station.object === 'network' ? (
          <>
            {[
              [-0.7, 1.3, 0],
              [0.8, 2.1, 0],
              [-0.4, 2.6, 0],
            ].map((p, i) => (
              <Ball
                key={i}
                p={p as [number, number, number]}
                s={[0.3, 0.3, 0.3]}
                color={i === 1 ? accent : C.white}
              />
            ))}
            <Beam a={[-0.7, 1.3, 0]} b={[0.8, 2.1, 0]} width={0.08} color={C.ink} />
            <Beam a={[0.8, 2.1, 0]} b={[-0.4, 2.6, 0]} width={0.08} color={C.ink} />
          </>
        ) : station.object === 'data' ? (
          <>
            {[-0.8, 0, 0.8].map((x, i) => (
              <Box
                key={x}
                p={[x, 1.1 + i * 0.3, 0]}
                s={[0.55, 0.8 + i * 0.6, 0.55]}
                color={i === 1 ? C.glass : accent}
              />
            ))}
          </>
        ) : (
          <mesh position={[0, 1.8, 0]} castShadow material={material(accent, { rough: 0.4 })}>
            <torusKnotGeometry args={[0.6, 0.16, 48, 6]} />
          </mesh>
        )}
      </group>
      {/* Écran : pied, cadre, dalle lumineuse et texte, tourné vers l'allée. Absent sans contenu. */}
      <group position={[0, 0, -0.55]} rotation={[0, -side * 0.38, 0]} visible={!!content}>
        <Box p={[0, 1.6, -0.1]} s={[0.18, 3.2, 0.18]} color={C.ink} />
        <Bevel p={[0, 3.75, -0.2]} s={[5.3, 2.75, 0.22]} color={C.ink} radius={0.1} />
        <mesh position={[0, 3.75, -0.08]} userData={{ dynamic: true }}>
          <planeGeometry args={[5, 2.45]} />
          <meshStandardMaterial ref={glow} color={mood.screen} emissive={accent} emissiveIntensity={0.12} />
        </mesh>
        {content && (
          <>
            <Sign
              text={content.titre}
              p={[0, line ? 4.25 : 3.75, -0.06]}
              s={[4.7, 0.95]}
              color={C.white}
              bg='transparent'
            />
            {line && (
              <Sign
                text={line}
                p={[0, 3.35, -0.06]}
                s={[4.7, 0.5]}
                color='#dfe7ec'
                bg='transparent'
                weight={500}
              />
            )}
          </>
        )}
      </group>
    </group>
  );
}

/** Pièces de mobilier, placées sur les emprises déclarées dans narrative.ts (FURNITURE). */
function Shelf({ f, mood }: { f: Footprint; mood: InteriorMood }) {
  const [x, z, hx, hz] = f;
  const facing = Math.sign(x);
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 1.4, 0]} s={[hx * 2, 2.8, hz * 2]} color={C.woodDark} />
      {[0.55, 1.3, 2.05].map((y, i) => (
        <group key={y}>
          <Box p={[-facing * 0.05, y + 0.32, 0]} s={[hx * 1.6, 0.06, hz * 1.85]} color={C.wood} />
          {Array.from({ length: 6 }, (_, k) => (
            <Box
              key={k}
              p={[-facing * 0.12, y + 0.12 + ((k * 7 + i) % 3) * 0.03, -hz * 0.8 + k * hz * 0.32]}
              s={[0.5, 0.42 + ((k + i) % 3) * 0.08, 0.16]}
              color={[mood.accent, C.white, C.blueDeep, C.yellow][(k + i) % 4]}
              shadow={false}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
function Desk({ f, mood }: { f: Footprint; mood: InteriorMood }) {
  const [x, z, hx, hz] = f;
  const facing = -Math.sign(x);
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.78, 0]} s={[hx * 2, 0.08, hz * 2]} color={C.white} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[0, 0.38, s * (hz - 0.08)]} s={[hx * 2 - 0.1, 0.76, 0.06]} color={C.metal} />
      ))}
      <Box p={[-facing * 0.25, 1.25, 0]} s={[0.06, 0.6, 1]} color={C.ink} />
      <Box
        p={[-facing * 0.21, 1.25, 0]}
        s={[0.02, 0.5, 0.9]}
        color={mood.screen}
        finish={{ glow: mood.accent, glowIntensity: 0.25 }}
      />
      <Bevel p={[facing * 0.9, 0.45, 0]} s={[0.6, 0.9, 0.6]} color={mood.accent} radius={0.12} />
    </group>
  );
}
function Bench({ f, mood }: { f: Footprint; mood: InteriorMood }) {
  const [x, z, hx, hz] = f;
  return (
    <group position={[x, 0, z]}>
      <Bevel p={[0, 0.45, 0]} s={[hx * 1.6, 0.18, hz * 2]} color={C.wood} radius={0.06} />
      {[-1, 1].map((s) => (
        <Box key={s} p={[0, 0.2, s * (hz - 0.2)]} s={[hx * 1.4, 0.4, 0.12]} color={mood.accent} />
      ))}
    </group>
  );
}
function Cabinet({ f, mood }: { f: Footprint; mood: InteriorMood }) {
  const [x, z, hx, hz] = f;
  const facing = -Math.sign(x);
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 1.1, 0]} s={[hx * 2, 2.2, hz * 2]} color={C.concrete} finish={METAL} />
      {Array.from({ length: 3 }, (_, i) => (
        <Box
          key={i}
          p={[facing * hx, 1.1, -hz * 0.66 + i * hz * 0.66]}
          s={[0.04, 1.9, hz * 0.6]}
          color={C.white}
          shadow={false}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <Ball
          key={i}
          p={[facing * (hx + 0.02), 1.7, -0.4 + i * 0.4]}
          s={[0.06, 0.06, 0.06]}
          color={i === 1 ? mood.accent : C.teal}
          finish={{ glow: i === 1 ? mood.accent : C.teal, glowIntensity: 1 }}
        />
      ))}
    </group>
  );
}
function Workbench({ f }: { f: Footprint }) {
  const [x, z, hx, hz] = f;
  const facing = -Math.sign(x);
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.9, 0]} s={[hx * 2, 0.14, hz * 2]} color={C.wood} />
      {[-1, 1].flatMap((a) =>
        [-1, 1].map((b) => (
          <Box
            key={`${a}${b}`}
            p={[a * (hx - 0.1), 0.42, b * (hz - 0.1)]}
            s={[0.1, 0.84, 0.1]}
            color={C.ink}
          />
        )),
      )}
      <Box p={[-facing * 0.3, 1.9, 0]} s={[0.06, 1.6, hz * 2]} color={C.slate} />
      {[-0.6, 0, 0.6].map((dz, i) => (
        <Box
          key={dz}
          p={[-facing * 0.22, 1.7 + i * 0.25, dz]}
          s={[0.08, 0.5, 0.12]}
          r={[0.3 * i, 0, 0]}
          color={i === 1 ? C.yellow : C.metal}
          shadow={false}
        />
      ))}
      <Box p={[facing * 0.1, 1.15, 0.5]} s={[0.5, 0.36, 0.4]} color={C.yellow} />
    </group>
  );
}
function Frames({ x, z, mood }: { x: number; z: number; mood: InteriorMood }) {
  const facing = -Math.sign(x);
  const art: [number, number, number, number, string][] = [
    [-1.2, 3.6, 1.6, 2.1, mood.accent],
    [0.9, 4.1, 1.2, 1.2, C.blue],
    [0.9, 2.8, 1.2, 0.9, C.yellow],
  ];
  return (
    <group position={[x + facing * 0.02, 0, z]} rotation={[0, (facing * Math.PI) / 2, 0]}>
      {art.map(([px, py, w, h, color], i) => (
        <group key={i} position={[px, py, 0]}>
          <Box p={[0, 0, 0]} s={[w + 0.16, h + 0.16, 0.06]} color={C.ink} shadow={false} />
          <Box p={[0, 0, 0.04]} s={[w, h, 0.04]} color={color} shadow={false} />
        </group>
      ))}
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

/** Décor propre à chaque lieu, en plus de la coque commune. */
function Theme({ id, mood }: { id: BuildingId; mood: InteriorMood }) {
  const f = FURNITURE[id];
  const sides = f.slice(0, 4);
  const pendants = (color: string) =>
    [-12, -4, 4, 11].map((z) => <Pendant key={z} p={[0, 7, z]} color={color} />);
  switch (id) {
    case 'profile':
      return (
        <>
          {sides.map((p, i) => (
            <Shelf key={i} f={p} mood={mood} />
          ))}
          {/* Canapé, fauteuil et lampadaire au fond */}
          <group position={[f[4][0], 0, f[4][1]]}>
            <Bevel p={[0, 0.4, 0]} s={[4.4, 0.6, 1.2]} color={mood.accent} radius={0.2} />
            <Bevel p={[0, 0.95, -0.45]} s={[4.4, 0.9, 0.3]} color={mood.accent} radius={0.15} />
            {[-1, 1].map((s) => (
              <Bevel key={s} p={[s * 2.1, 0.75, 0]} s={[0.3, 0.7, 1.2]} color={mood.accent} radius={0.12} />
            ))}
            <Bevel p={[-1, 0.85, 0.05]} s={[0.7, 0.5, 0.3]} color={C.yellow} radius={0.12} />
          </group>
          <group position={[f[5][0], 0, f[5][1]]}>
            <Bevel p={[0, 0.45, 0]} s={[1.5, 0.6, 1.3]} color={C.blue} radius={0.2} />
            <Bevel p={[0, 1, -0.5]} s={[1.5, 0.9, 0.3]} color={C.blue} radius={0.12} />
          </group>
          <group position={[-6, 0, -16.3]}>
            <Cylinder p={[0, 1.3, 0]} s={[0.05, 2.6, 0.05]} color={C.ink} />
            <Cone p={[0, 2.75, 0]} s={[0.5, 0.5, 0.5]} color={C.white} />
            <Ball
              p={[0, 2.55, 0]}
              s={[0.14, 0.14, 0.14]}
              color={C.lamp}
              finish={{ glow: C.lamp, glowIntensity: 2 }}
            />
          </group>
          {/* Tapis le long de l'allée */}
          <Box p={[0, 0.012, -1]} s={[3.2, 0.02, 28]} color={mood.accent} shadow={false} />
          <Box p={[0, 0.02, -1]} s={[2.6, 0.02, 27.4]} color='#ffb38a' shadow={false} />
          {/* Charpente : poteaux et entraits hauts, au-dessus du titre */}
          {[-11, -3, 5, 13].map((z) => (
            <group key={z}>
              {[-1, 1].map((s) => (
                <group key={s}>
                  <Box p={[s * 10.3, 3.8, z]} s={[0.45, 7.6, 0.5]} color={mood.accent} />
                  <Beam a={[s * 10.3, 7.4, z]} b={[s * 6.5, 7.55, z]} width={0.42} color={mood.accent} />
                </group>
              ))}
            </group>
          ))}
          {pendants(C.white)}
        </>
      );
    case 'project-1':
      return (
        <>
          {sides.map((p, i) => (
            <Desk key={i} f={p} mood={mood} />
          ))}
          <group position={[f[4][0], 0, f[4][1]]}>
            <Bevel p={[0, 0.78, 0]} s={[5.2, 0.1, 1.4]} color={C.white} radius={0.04} />
            {[-2.3, 2.3].map((x) => (
              <Box key={x} p={[x, 0.38, 0]} s={[0.1, 0.76, 1.2]} color={C.metal} />
            ))}
            {[-1.6, 0, 1.6].map((x) => (
              <Bevel key={x} p={[x, 0.45, 1.1]} s={[0.6, 0.9, 0.6]} color={mood.accent} radius={0.12} />
            ))}
          </group>
          {/* Cloisons vitrées entre les postes */}
          {[-1, 1].flatMap((s) =>
            [-5.3, -12.3, 1.7].map((z) => (
              <Box
                key={`${s}${z}`}
                p={[s * 9.4, 1.4, z]}
                s={[1.6, 2.8, 0.08]}
                color={C.glass}
                finish={GLASS}
              />
            )),
          )}
          {/* Bandeaux lumineux au plafond */}
          {[-12, -6, 0, 6, 12].map((z) => (
            <Box
              key={z}
              p={[0, WALL_H - 0.15, z]}
              s={[14, 0.08, 0.3]}
              color={C.lamp}
              finish={{ glow: '#ffffff', glowIntensity: 1.2 }}
              shadow={false}
            />
          ))}
        </>
      );
    case 'project-2':
      return (
        <>
          {sides.map((p, i) => (
            <Workbench key={i} f={p} />
          ))}
          <group position={[f[4][0], 0, f[4][1]]}>
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
          {/* Portiques métalliques et lignes de sécurité au sol */}
          {[-11, -3, 5, 13].map((z) => (
            <group key={z}>
              <Beam a={[-10.5, 0, z]} b={[-10.5, 7.4, z]} width={0.3} color={mood.accent} />
              <Beam a={[10.5, 0, z]} b={[10.5, 7.4, z]} width={0.3} color={mood.accent} />
              <Beam a={[-10.5, 7.4, z]} b={[10.5, 7.4, z]} width={0.3} color={mood.accent} />
            </group>
          ))}
          {[-1.7, 1.7].map((x) => (
            <Box key={x} p={[x, 0.02, -1]} s={[0.18, 0.02, 30]} color={mood.accent} shadow={false} />
          ))}
          {pendants(C.slate)}
        </>
      );
    case 'project-3':
      return (
        <>
          {sides.map((p, i) => (
            <Bench key={i} f={p} mood={mood} />
          ))}
          {/* Lunette sur trépied */}
          <group position={[f[4][0], 0, f[4][1]]}>
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
          {/* Carte du ciel sur le mur du fond, autour du titre */}
          {Array.from({ length: 28 }, (_, i) => {
            const x = -10 + ((i * 37) % 20);
            const y = 1.2 + ((i * 53) % 60) / 10;
            if (Math.abs(x) < 6.5 && y > 3.2 && y < 6.4) return null;
            const r = 0.07 * (1 + (i % 3));
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
          {[-12, -4, 4, 11].map((z) => (
            <Ball
              key={z}
              p={[0, WALL_H - 0.4, z]}
              s={[0.35, 0.18, 0.35]}
              color={C.lamp}
              finish={{ glow: '#d9d0ff', glowIntensity: 2 }}
              shadow={false}
            />
          ))}
        </>
      );
    case 'missions':
      return (
        <>
          {sides.map((p, i) => (
            <Bench key={i} f={p} mood={mood} />
          ))}
          {[-1, 1].flatMap((s) =>
            [5.4, -5.3, -12.4].map((z) => <Frames key={`${s}${z}`} x={s * (W - 0.02)} z={z} mood={mood} />),
          )}
          {f.slice(4).map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
              <Box p={[0, 0.6, 0]} s={[1, 1.2, 1]} color={C.white} />
              <Ball p={[0, 1.6, 0]} s={[0.45, 0.6, 0.45]} color={i ? C.violet : mood.accent} />
            </group>
          ))}
          {/* Rails d'éclairage de galerie */}
          {[-1, 1].map((s) => (
            <Box key={s} p={[s * 7.5, WALL_H - 0.2, -1]} s={[0.12, 0.12, 30]} color={C.ink} shadow={false} />
          ))}
          {[-1, 1].flatMap((s) =>
            [-12, -6, 0, 6, 12].map((z) => (
              <Cone
                key={`${s}${z}`}
                p={[s * 7.8, WALL_H - 0.45, z]}
                s={[0.22, 0.4, 0.22]}
                r={[0, 0, s * 0.6]}
                color={C.lamp}
                finish={{ glow: C.lamp, glowIntensity: 1.5 }}
                shadow={false}
              />
            )),
          )}
        </>
      );
    case 'veolia':
      return (
        <>
          {sides.map((p, i) => (
            <Cabinet key={i} f={p} mood={mood} />
          ))}
          {/* Pupitre de contrôle */}
          <group position={[f[4][0], 0, f[4][1]]}>
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
          {/* Colonnes et canalisations le long des murs */}
          {[-9.7, 9.7].map((x) => (
            <group key={x}>
              <Cylinder p={[x, 3, -13]} s={[0.75, 6, 0.75]} color={C.white} finish={METAL} />
              <Cylinder p={[x, 4.2, -13]} s={[0.78, 0.35, 0.78]} color={mood.accent} />
              {[5.2, 5.9].map((y, i) => (
                <Cylinder
                  key={y}
                  p={[x * 1.07, y, -1]}
                  s={[0.16 + i * 0.06, 32, 0.16 + i * 0.06]}
                  r={[Math.PI / 2, 0, 0]}
                  color={i ? mood.accent : C.metal}
                />
              ))}
              {[-8, 0, 8].map((z) => (
                <Cylinder
                  key={z}
                  p={[x * 1.07, 5.9, z]}
                  s={[0.36, 0.3, 0.36]}
                  r={[Math.PI / 2, 0, 0]}
                  color={C.ink}
                />
              ))}
            </group>
          ))}
          {[-1.7, 1.7].map((x) => (
            <Box key={x} p={[x, 0.02, -1]} s={[0.14, 0.02, 30]} color={mood.accent} shadow={false} />
          ))}
          {pendants(C.white)}
        </>
      );
  }
}

/** Coque de la salle : sol, murs, plafond, fenêtres, porte et titre. */
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
            {[-13, 13].map((z) => (
              <Windows
                key={z}
                p={[side * (W - 0.02), 3.6, z]}
                r={[0, -side * (Math.PI / 2), 0]}
                w={4.5}
                h={3}
                cols={3}
                rows={2}
                frame={C.white}
                glass='#bfe6f5'
              />
            ))}
            <Box
              p={[side * 6.6, WALL_H / 2, D - 0.05]}
              s={[8.8, WALL_H, 0.3]}
              color={mood.wall}
              shadow={false}
            />
            <Cylinder p={[side * 9, 0.5, 14.8]} s={[0.8, 1, 0.8]} color={mood.accent} />
            <Ball p={[side * 9, 1.8, 14.8]} s={[1.1, 1.3, 1.1]} color={C.leaf} />
          </group>
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
        <Planter p={[-4, 0, 16.6]} w={2} color={mood.accent} />
        <Planter p={[4, 0, 16.6]} w={2} color={mood.accent} />
      </StaticBatch>
      <group position={[0, 0, 17.8]} rotation={[0, Math.PI, 0]}>
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
      {/* Titre du lieu sur le mur du fond, à hauteur de regard : ni poutre ni suspension devant */}
      <Sign
        text={content.titre}
        p={[0, open ? 3.1 : 3.6, -D + 0.24]}
        s={[10, 1.5]}
        color={C.white}
        bg='transparent'
      />
      {!open && (
        <Sign text='Bientôt' p={[0, 2.3, -D + 0.24]} s={[4.2, 0.85]} color={mood.backWall} bg={C.white} />
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
