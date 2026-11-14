import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scene } from '../design/tokens';

/** Ciel en dégradé (zénith, horizon, mer sous l'île), centré sur la caméra. */
export function SkyDome() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color(scene.sky.top) },
          horizon: { value: new THREE.Color(scene.sky.horizon) },
          bottom: { value: new THREE.Color(scene.sky.bottom) },
        },
        vertexShader: `varying vec3 vDir;
          void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
          void main() {
            float y = vDir.y;
            vec3 c = y > 0.0
              ? mix(horizon, top, pow(smoothstep(0.0, 0.85, y), 0.75))
              : mix(horizon, bottom, smoothstep(0.0, 0.35, -y));
            gl_FragColor = vec4(c, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      }),
    [],
  );
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ camera }) => ref.current.position.copy(camera.position));
  return (
    <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[600, 32, 16]} />
    </mesh>
  );
}
