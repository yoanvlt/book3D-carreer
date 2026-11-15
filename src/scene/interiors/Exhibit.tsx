import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Ball, Beam, Box, Sign, material } from '../Primitives';
import { Bevel } from '../kit';
import { color as C, placeColor, type InteriorMood } from '../../design/tokens';
import type { BuildingId } from '../../world/config';
import { STATION, type Station } from '../../world/narrative';
import { getState } from '../../state';
import { stationContentById } from '../../content';

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
export default function Exhibit({
  id,
  station,
  mood,
}: {
  id: BuildingId;
  station: Station;
  mood: InteriorMood;
}) {
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
