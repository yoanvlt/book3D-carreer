/**
 * Modèle du robot (V8) : corps, tête à visière, bras et jambes articulés, propulseurs sous les
 * pieds (flamme bruitée et halo). Les articulations sont exposées par `rig` pour Robot.tsx.
 */
import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { color as C } from '../../design/tokens';
import { Box, Cylinder, Ball, material } from '../Primitives';

export interface Rig {
  root: React.RefObject<THREE.Group>;
  body: React.RefObject<THREE.Group>;
  head: React.RefObject<THREE.Group>;
  eyes: React.RefObject<THREE.Group>;
  armL: React.RefObject<THREE.Group>;
  armR: React.RefObject<THREE.Group>;
  left: React.RefObject<THREE.Group>;
  right: React.RefObject<THREE.Group>;
  flames: React.RefObject<THREE.Group>;
}

export function useRig(): Rig {
  return {
    root: useRef<THREE.Group>(null!),
    body: useRef<THREE.Group>(null!),
    head: useRef<THREE.Group>(null!),
    eyes: useRef<THREE.Group>(null!),
    armL: useRef<THREE.Group>(null!),
    armR: useRef<THREE.Group>(null!),
    left: useRef<THREE.Group>(null!),
    right: useRef<THREE.Group>(null!),
    flames: useRef<THREE.Group>(null!),
  };
}

/** Flamme d'un propulseur : cône orangé, cœur clair, halo additif. */
function Flame({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh
        position={[0, -0.34, 0]}
        rotation={[Math.PI, 0, 0]}
        material={material('#ffb15c', { glow: '#ff9a3c', glowIntensity: 1.8 })}
      >
        <coneGeometry args={[0.15, 0.62, 10]} />
      </mesh>
      <mesh
        position={[0, -0.22, 0]}
        rotation={[Math.PI, 0, 0]}
        material={material('#fff1c4', { glow: '#fff1c4', glowIntensity: 2.4 })}
      >
        <coneGeometry args={[0.08, 0.34, 8]} />
      </mesh>
    </group>
  );
}

export function RobotModel({ rig }: { rig: Rig }) {
  return (
    <group ref={rig.root}>
      <group ref={rig.body}>
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
        <group ref={rig.head} position={[0, 1.53, 0]}>
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
            <group ref={rig.eyes} position={[0, 1.98, 0.5]}>
              {[-0.21, 0.21].map((x) => (
                <RoundedBox
                  key={x}
                  args={[0.105, 0.19, 0.035]}
                  radius={0.045}
                  smoothness={2}
                  position={[x, 0, 0]}
                  material={material('#b8e3e7')}
                />
              ))}
            </group>
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
          <group key={side} ref={side < 0 ? rig.armL : rig.armR} position={[side * 0.52, 1.3, 0]}>
            <Ball s={[0.16, 0.16, 0.16]} color={C.ink} />
            <Box p={[0, -0.25, 0]} s={[0.2, 0.43, 0.24]} color={C.cream} />
            <Ball p={[0, -0.51, 0.03]} s={[0.15, 0.15, 0.16]} color={C.orange} />
          </group>
        ))}
      </group>
      {[-1, 1].map((side) => (
        <group key={side} ref={side < 0 ? rig.left : rig.right} position={[side * 0.24, 0.7, 0]}>
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
      <group ref={rig.flames} position={[0, 0.08, 0.09]} visible={false}>
        <Flame x={-0.24} />
        <Flame x={0.24} />
        <mesh position={[0, -0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={3}>
          <circleGeometry args={[0.7, 20]} />
          <meshBasicMaterial
            color='#ffcf8a'
            transparent
            opacity={0.35}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}
