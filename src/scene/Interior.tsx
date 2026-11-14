import SlidingDoor from './SlidingDoor';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildings, COLORS as C } from '../world/config';
import { stationsFor, type Station } from '../world/narrative';
import { useGame, getState } from '../state';
import { theme } from '../theme';
import { isOpen, place, stationContentById } from '../content';
import { Box, Cylinder, Ball, Beam, Sign } from './Primitives';

function Exhibit({
  station: s,
  color,
  title: label,
}: {
  station: Station;
  color: string;
  title: string | null;
}) {
  const title = useRef<THREE.Group>(null!);
  const sculpture = useRef<THREE.Group>(null!),
    light = useRef<THREE.MeshStandardMaterial>(null!);
  useFrame(({ clock }, dt) => {
    const state = getState(),
      active = state.station === s.id;
    const seen = state.seen.includes(state.interior + ':' + s.id);
    const scale = THREE.MathUtils.damp(title.current.scale.x, active || seen ? 1 : 0.8, 6, dt);
    title.current.scale.setScalar(scale);
    light.current.emissiveIntensity = THREE.MathUtils.damp(
      light.current.emissiveIntensity,
      active ? 0.85 : 0.08,
      5,
      dt,
    );
    const reduced = getState().reducedMotion;
    sculpture.current.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * 0.22 + s.position[1]) * 0.22;
    sculpture.current.position.y = THREE.MathUtils.damp(
      sculpture.current.position.y,
      active ? 0.3 : 0,
      4,
      dt,
    );
  });
  return (
    <group position={[s.position[0], 0, s.position[1] - 1.3]}>
      <Box p={[0, 0.35, 0]} s={[3.4, 0.7, 1.45]} color='#d7b08b' />
      <Box p={[0, 0.73, 0]} s={[3.6, 0.1, 1.6]} color={C.cream} />
      <group ref={sculpture}>
        {s.object === 'portrait' ? (
          <>
            <Box p={[0, 1.35, 0]} s={[0.7, 1, 0.45]} color={color} />
            <Ball p={[0, 2.2, 0]} s={[0.4, 0.5, 0.4]} color='#deb18d' />
            <Box p={[0, 2.55, -0.04]} s={[0.75, 0.17, 0.6]} color={C.ink} />
          </>
        ) : s.object === 'network' ? (
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
                color={i === 1 ? color : C.cream}
              />
            ))}
            <Beam a={[-0.7, 1.3, 0]} b={[0.8, 2.1, 0]} width={0.08} color={C.ink} />
            <Beam a={[0.8, 2.1, 0]} b={[-0.4, 2.6, 0]} width={0.08} color={C.ink} />
          </>
        ) : s.object === 'data' ? (
          <>
            {[-0.8, 0, 0.8].map((x, i) => (
              <Box
                key={x}
                p={[x, 1.1 + i * 0.3, 0]}
                s={[0.55, 0.8 + i * 0.6, 0.55]}
                color={i === 1 ? C.glass : color}
              />
            ))}
          </>
        ) : (
          <mesh position={[0, 1.8, 0]} castShadow>
            <torusKnotGeometry args={[0.6, 0.16, 48, 6]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        )}
      </group>
      <Box p={[0, 3.4, -0.3]} s={[4.3, 1.9, 0.2]} color={C.ink} />
      <mesh position={[0, 3.4, -0.185]}>
        <planeGeometry args={[4.1, 1.7]} />
        <meshStandardMaterial ref={light} color='#2e515a' emissive={color} emissiveIntensity={0.08} />
      </mesh>
      <group ref={title}>
        {label && <Sign text={label} p={[0, 3.4, -0.16]} s={[3.9, 0.55]} color={C.cream} bg='#2e515a' />}
      </group>
      <Cylinder p={[0, 0.015, 2.5]} s={[1.2, 0.02, 1.2]} color={color} />
    </group>
  );
}
function PortraitArchitecture() {
  return (
    <>
      {/* The ribs of the sculptural torso form a sequence of warm exhibition bays. */}
      {[-11, -3, 5, 13].map((z) => (
        <group key={z}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box p={[side * 10.3, 3.7, z]} s={[0.45, 7.4, 0.5]} color='#df9772' />
              <Beam a={[side * 10.3, 7.4, z]} b={[side * 6.5, 10, z]} width={0.45} color='#df9772' />
            </group>
          ))}
          <Beam a={[-6.5, 10, z]} b={[6.5, 10, z]} width={0.4} color={C.cream} />
        </group>
      ))}
      <Cylinder p={[0, 8, -14.5]} s={[2.3, 0.24, 2.3]} color={C.coral} />
      <mesh position={[0, 8.1, -14.5]}>
        <torusGeometry args={[2.1, 0.12, 8, 32]} />
        <meshStandardMaterial color={C.cream} />
      </mesh>
      <Sign
        text='UN PARCOURS, DES CONNEXIONS.'
        p={[0, 5.9, -17.68]}
        s={[15, 1.15]}
        color={C.cream}
        bg='#385965'
      />
    </>
  );
}
function ThematicArchitecture({ id, color }: { id: string; color: string }) {
  if (id === 'project-3')
    return (
      <>
        {[3, 7, 11].map((y, i) => (
          <mesh key={y} position={[0, y, -15]} rotation={[Math.PI / 2, 0.2 * i, 0]}>
            <torusGeometry args={[4.5 + i, 0.12, 8, 48]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </>
    );
  if (id === 'veolia')
    return (
      <>
        {[-9.7, 9.7].map((x) => (
          <group key={x}>
            <Cylinder p={[x, 3, -13]} s={[0.75, 6, 0.75]} color={C.cream} />
            <Beam a={[x, 6, -13]} b={[x, 6, 13]} width={0.32} color={color} />
            {[-8, 0, 8].map((z) => (
              <Cylinder key={z} p={[x, 5.7, z]} s={[0.48, 0.15, 0.48]} color={color} />
            ))}
          </group>
        ))}
      </>
    );
  if (id === 'project-2')
    return (
      <>
        {[-11, -3, 5, 13].map((z) => (
          <group key={z}>
            <Beam a={[-10.5, 0, z]} b={[-10.5, 8, z]} width={0.3} color={color} />
            <Beam a={[10.5, 0, z]} b={[10.5, 8, z]} width={0.3} color={color} />
            <Beam a={[-10.5, 8, z]} b={[10.5, 8, z]} width={0.3} color={color} />
          </group>
        ))}
      </>
    );
  return (
    <>
      {[-10, -3, 4, 11].map((z, i) => (
        <Box
          key={z}
          p={[i % 2 ? 4 : -4, 8, z]}
          s={[13, 0.18, 3]}
          r={[0, 0, i % 2 ? 0.12 : -0.12]}
          color={color}
        />
      ))}
    </>
  );
}
export default function Interior() {
  const { interior } = useGame();
  if (!interior) return null;
  const b = buildings.find((b) => b.id === interior)!;
  return (
    <>
      <color attach='background' args={[theme.interior.background]} />
      <Box p={[0, -0.5, 0]} s={[90, 0.8, 90]} color={theme.interior.background} />
      <Box p={[0, -0.12, 0]} s={[22, 0.24, 36]} color='#e9d3b0' />
      <Box p={[0, 0.018, 0]} s={[2.4, 0.025, 32]} color={b.color} />
      {[-14, -7, 0, 7, 14].map((z) => (
        <Box key={z} p={[0, 0.025, z]} s={[22, 0.02, 0.035]} color='#bfa78b' />
      ))}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[side * 11, 2.5, 0]} s={[0.35, 5, 36]} color='#f2e1c6' />
          {[-13, -5, 3, 11].map((z) => (
            <group key={z}>
              <Box p={[side * 10.79, 3.3, z]} s={[0.08, 2.2, 5.5]} color='#91bbc5' />
              <Box p={[side * 10.65, 2.1, z]} s={[0.4, 0.12, 5.9]} color={C.cream} />
            </group>
          ))}
          <Box p={[side * 6.5, 2.5, 17.9]} s={[9, 5, 0.35]} color={C.cream} />
          <Cylinder p={[side * 9, 0.5, 14.8]} s={[0.8, 1, 0.8]} color={b.color} />
          <Ball p={[side * 9, 1.8, 14.8]} s={[1.1, 1.3, 1.1]} color={C.leaf} />
        </group>
      ))}
      <Box p={[0, 3.8, -18]} s={[22, 7.6, 0.4]} color='#385965' />
      <group position={[0, 0, 17.8]} rotation={[0, Math.PI, 0]}>
        <SlidingDoor id={b.id} />
      </group>
      <Sign text='SORTIE / LA VILLE' p={[0, 4.4, 17.55]} s={[5, 0.65]} rotation={[0, Math.PI, 0]} />
      <Sign
        text={place(b.id).sous_titre.toUpperCase()}
        p={[0, 6.8, -17.75]}
        s={[15, 1.15]}
        color={C.cream}
        bg='#385965'
      />
      {!isOpen(b.id) && (
        <Sign text='Bientôt' p={[0, 5.2, -17.75]} s={[6, 0.9]} color={C.cream} bg='#385965' />
      )}
      {b.id === 'profile' ? <PortraitArchitecture /> : <ThematicArchitecture id={b.id} color={b.color} />}
      {stationsFor(b.id).map((station) => (
        <Exhibit
          key={station.id}
          station={station}
          color={b.color}
          title={stationContentById(b.id, station.id)?.titre ?? null}
        />
      ))}
      <directionalLight
        position={[0, 12, 10]}
        intensity={theme.interior.lightIntensity}
        color={theme.interior.light}
      />
    </>
  );
}
