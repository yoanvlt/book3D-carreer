import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeClouds, DRIFT } from '../world/clouds';
import { getState } from '../state';

/** Nuages doux et arrondis : boules lisses, dessus blanc, dessous légèrement bleuté ; un seul
 * maillage instancié, chaque nuage oscille lentement sur place. */
export function Clouds() {
  const clouds = useMemo(makeClouds, []);
  const puffs = useMemo(
    () =>
      clouds.flatMap((c, i) =>
        c.parts.map(([x, y, z, s]) => ({
          cloud: i,
          offset: new THREE.Vector3(x, y, z).multiplyScalar(c.size),
          scale: new THREE.Vector3(s * 1.25, s * 0.8, s).multiplyScalar(c.size),
        })),
      ),
    [clouds],
  );
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 20, 12), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        name: 'nuage',
        fog: true,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          { top: { value: new THREE.Color('#ffffff') }, bottom: { value: new THREE.Color('#c9dcea') } },
        ]),
        vertexShader: `#include <common>
          #include <fog_pars_vertex>
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
            vec4 mvPosition = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `#include <common>
          #include <fog_pars_fragment>
          uniform vec3 top; uniform vec3 bottom; varying vec3 vNormal;
          void main() {
            float k = smoothstep(-0.6, 0.8, vNormal.y);
            gl_FragColor = vec4(mix(bottom, top, k), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      }),
    [],
  );
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const temp = useMemo(() => new THREE.Object3D(), []);
  const place = (time: number) => {
    puffs.forEach((p, i) => {
      const c = clouds[p.cloud];
      const t = time * 0.05 + c.phase;
      temp.position.set(
        c.x + Math.sin(t) * DRIFT * 0.9 + p.offset.x,
        c.y + Math.sin(t * 1.7) * 0.4 + p.offset.y,
        c.z + Math.cos(t) * DRIFT * 0.4 + p.offset.z,
      );
      temp.scale.copy(p.scale);
      temp.updateMatrix();
      mesh.current.setMatrixAt(i, temp.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  };
  useLayoutEffect(() => {
    place(0);
    mesh.current.computeBoundingSphere();
  });
  useFrame(({ clock }) => {
    if (getState().reducedMotion) return;
    place(clock.elapsedTime);
  });
  return <instancedMesh ref={mesh} args={[geometry, material, puffs.length]} frustumCulled={false} />;
}
