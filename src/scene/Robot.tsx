import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { color as C } from '../design/tokens';
import { player, getState, marker, journey } from '../state';
import { heightAt } from '../world/terrain';
import { Box, Cylinder, Ball, material } from './Primitives';
import { angleDifference } from '../world/motion';
import { buildings } from '../world/config';

/** Petits nuages de poussière aux pas rapides et à la réception d'un saut. */
const PUFFS = 14;
function Dust() {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const puffs = useRef(Array.from({ length: PUFFS }, () => ({ x: 0, y: -100, z: 0, age: 1, size: 0 })));
  const last = useRef({ step: 0, airborne: false, next: 0 });
  const temp = useRef(new THREE.Object3D());
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = getState();
    const spawn = (size: number) => {
      const p = puffs.current[last.current.next];
      last.current.next = (last.current.next + 1) % PUFFS;
      const back = 0.35;
      Object.assign(p, {
        x: player.x - Math.sin(player.angle) * back + (Math.random() - 0.5) * 0.3,
        y: player.y + 0.12,
        z: player.z - Math.cos(player.angle) * back + (Math.random() - 0.5) * 0.3,
        age: 0,
        size,
      });
    };
    if (!s.reducedMotion) {
      const step = Math.floor(state.clock.elapsedTime * Math.max(1, player.speed) * 0.8);
      if (player.speed > 5 && player.jump.height === 0 && step !== last.current.step) spawn(0.22);
      last.current.step = step;
      const airborne = player.jump.height > 0;
      if (last.current.airborne && !airborne) for (let i = 0; i < 3; i++) spawn(0.32);
      last.current.airborne = airborne;
    }
    const o = temp.current;
    puffs.current.forEach((p, i) => {
      p.age = Math.min(1, p.age + dt / 0.55);
      const k = p.age >= 1 ? 0 : Math.sin(p.age * Math.PI) * p.size * (1 + p.age);
      o.position.set(p.x, p.y + p.age * 0.35, p.z);
      o.scale.setScalar(Math.max(0.0001, k));
      o.updateMatrix();
      mesh.current.setMatrixAt(i, o.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, material(C.stone, { rough: 1 }), PUFFS]}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 0]} />
    </instancedMesh>
  );
}

/** Repère au sol du « toucher pour aller », visible pendant la marche. */
function TapMarker() {
  const ring = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const s = getState();
    const p = marker.point;
    const show = !!p && s.phase === 'travel' && !journey.destination;
    ring.current.visible = show;
    if (!show) return;
    ring.current.position.set(p[0], (s.interior ? 0 : heightAt(p[0], p[1])) + 0.08, p[1]);
    ring.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 6) * 0.08);
  });
  return (
    <mesh
      ref={ring}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
      material={material(C.white, { glow: C.white, glowIntensity: 0.6 })}
    >
      <ringGeometry args={[0.45, 0.65, 32]} />
    </mesh>
  );
}

export default function Robot() {
  const root = useRef<THREE.Group>(null!),
    body = useRef<THREE.Group>(null!),
    left = useRef<THREE.Group>(null!),
    right = useRef<THREE.Group>(null!),
    armL = useRef<THREE.Group>(null!),
    armR = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const gait = useRef(0),
    motion = useRef(0),
    previous = useRef({ speed: 0, angle: player.angle });
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    root.current.position.set(player.x, player.y + 0.14 + player.jump.height, player.z);
    root.current.rotation.y = player.angle;
    const state = getState(),
      active = !state.map && !state.detail && !state.reading && !state.help;
    motion.current = THREE.MathUtils.damp(motion.current, active ? player.speed : 0, 9, dt);
    const speed = motion.current,
      run = Math.max(0, Math.min(1, (speed - 6) / 3));
    gait.current += dt * (speed * 2.5);
    const swing = Math.sin(gait.current) * Math.min(1, speed / 3) * (0.55 + run * 0.35);
    left.current.rotation.x = swing;
    right.current.rotation.x = -swing;
    player.reaction = Math.max(0, player.reaction - dt * 0.8);
    const acceleration = Math.max(-8, Math.min(8, (speed - previous.current.speed) / Math.max(0.001, dt)));
    const turning = Math.max(
      -2,
      Math.min(2, angleDifference(player.angle, previous.current.angle) / Math.max(0.001, dt)),
    );
    previous.current = { speed, angle: player.angle };
    armL.current.rotation.x = THREE.MathUtils.damp(armL.current.rotation.x, -swing * 0.8, 14, dt);
    armR.current.rotation.x = THREE.MathUtils.damp(
      armR.current.rotation.x,
      swing * 0.8 - player.reaction * 0.65,
      10,
      dt,
    );
    armR.current.rotation.z = THREE.MathUtils.damp(armR.current.rotation.z, -player.reaction * 0.3, 10, dt);
    body.current.rotation.x = THREE.MathUtils.damp(
      body.current.rotation.x,
      run * 0.14 + acceleration * 0.008,
      6,
      dt,
    );
    body.current.rotation.z = THREE.MathUtils.damp(
      body.current.rotation.z,
      Math.sin(gait.current) * Math.min(speed / 6, 1) * 0.045 - turning * Math.min(speed / 6, 1) * 0.06,
      8,
      dt,
    );
    body.current.rotation.y = THREE.MathUtils.damp(
      body.current.rotation.y,
      !state.reducedMotion && speed < 0.3 ? Math.sin(_.clock.elapsedTime * 0.7) * 0.06 : 0,
      5,
      dt,
    );
    // Regard : vers le bâtiment présenté, sinon vers le lieu tout proche.
    const b = buildings.find((b) => b.id === (state.showcase ?? (state.interior ? null : state.nearby)));
    const gaze = b
      ? Math.max(
          -0.6,
          Math.min(
            0.6,
            angleDifference(Math.atan2(b.position[0] - player.x, b.position[1] - player.z), player.angle),
          ),
        )
      : turning * 0.12;
    head.current.rotation.y = THREE.MathUtils.damp(head.current.rotation.y, gaze, 4, dt);
    head.current.rotation.x = THREE.MathUtils.damp(
      head.current.rotation.x,
      state.showcase ? -0.1 : b ? -0.05 : state.reading ? -0.06 : 0,
      4,
      dt,
    );
    body.current.position.y =
      (state.reducedMotion ? 0 : Math.sin(_.clock.elapsedTime * 2) * 0.018) +
      Math.abs(Math.sin(gait.current)) * Math.min(speed / 6, 1) * (0.07 + run * 0.08);
  });
  return (
    <>
      <Dust />
      <TapMarker />
      <group ref={root}>
        <group ref={body}>
          <RoundedBox
            args={[0.84, 0.8, 0.64]}
            radius={0.17}
            smoothness={2}
            position={[0, 1.04, 0]}
            material={material(C.cream)}
            castShadow
          />
          <Box p={[0, 1.08, 0.34]} s={[0.49, 0.36, 0.035]} color={C.orange} />
          <Box p={[0, 1.09, 0.365]} s={[0.25, 0.06, 0.02]} color={C.cream} />
          <Box p={[0, 1, -0.4]} s={[0.61, 0.6, 0.25]} color={C.orange} />
          <Box p={[0, 1.04, -0.54]} s={[0.39, 0.3, 0.05]} color={C.ink} />
          <Cylinder p={[0, 1.53, 0]} s={[0.19, 0.2, 0.19]} color={C.ink} />
          <group ref={head} position={[0, 1.53, 0]}>
            <group position={[0, -1.53, 0]}>
              <RoundedBox
                args={[1.13, 0.73, 0.8]}
                radius={0.2}
                smoothness={3}
                position={[0, 1.94, 0.02]}
                material={material(C.cream)}
                castShadow
              />
              <RoundedBox
                args={[0.93, 0.44, 0.14]}
                radius={0.13}
                smoothness={2}
                position={[0, 1.96, 0.42]}
                material={material(C.ink)}
                castShadow
              />
              {[-0.21, 0.21].map((x) => (
                <RoundedBox
                  key={x}
                  args={[0.105, 0.19, 0.035]}
                  radius={0.045}
                  smoothness={2}
                  position={[x, 1.98, 0.5]}
                  material={material('#b8e3e7')}
                />
              ))}
              {[-0.6, 0.6].map((x) => (
                <Cylinder
                  key={x}
                  p={[x, 1.94, 0]}
                  s={[0.18, 0.17, 0.18]}
                  r={[0, 0, Math.PI / 2]}
                  color={C.orange}
                />
              ))}
              <Cylinder p={[0.33, 2.43, -0.08]} s={[0.035, 0.32, 0.035]} color={C.ink} />
              <Ball p={[0.33, 2.62, -0.08]} s={[0.1, 0.1, 0.1]} color={C.orange} />
            </group>
          </group>
          {[-1, 1].map((side) => (
            <group key={side} ref={side < 0 ? armL : armR} position={[side * 0.52, 1.3, 0]}>
              <Ball s={[0.16, 0.16, 0.16]} color={C.ink} />
              <Box p={[0, -0.25, 0]} s={[0.2, 0.43, 0.24]} color={C.cream} />
              <Ball p={[0, -0.51, 0.03]} s={[0.15, 0.15, 0.16]} color={C.orange} />
            </group>
          ))}
        </group>
        {[-1, 1].map((side) => (
          <group key={side} ref={side < 0 ? left : right} position={[side * 0.24, 0.7, 0]}>
            <Cylinder p={[0, -0.19, 0]} s={[0.105, 0.39, 0.105]} color={C.ink} />
            <RoundedBox
              args={[0.33, 0.28, 0.52]}
              radius={0.09}
              smoothness={2}
              position={[0, -0.49, 0.09]}
              material={material(C.orange)}
              castShadow
            />
            <Box p={[0, -0.62, 0.09]} s={[0.34, 0.06, 0.54]} color={C.ink} />
          </group>
        ))}
      </group>
    </>
  );
}
