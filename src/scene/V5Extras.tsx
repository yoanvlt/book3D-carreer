import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { EffectComposer, N8AO, SMAA } from '@react-three/postprocessing';
import * as THREE from 'three';

/** Prototype V5 : occlusion ambiante (contact entre les volumes, coins, pieds des arbres). */
export function Effects({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <N8AO aoRadius={2.2} distanceFalloff={1.2} intensity={2.6} color='#1d3a4a' quality='medium' halfRes />
      <SMAA />
    </EffectComposer>
  );
}

/** Prototype V5 : mer de nuages sous l'île et quelques nuages qui dérivent autour. */
export function Clouds() {
  const puff = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        roughness: 1,
        flatShading: true,
        emissive: '#dbefff',
        emissiveIntensity: 0.35,
      }),
    [],
  );
  const clouds = useMemo(() => {
    const rnd = (() => {
      let s = 7;
      return () => (s = (s * 16807) % 2147483647) / 2147483647;
    })();
    const list: {
      p: [number, number, number];
      s: number;
      parts: [number, number, number, number][];
      drift: number;
    }[] = [];
    // Couronne basse : la « mer de nuages » où flotte l'île.
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + rnd() * 0.2,
        r = 70 + rnd() * 70;
      list.push({
        p: [Math.cos(a) * r, -16 - rnd() * 10, Math.sin(a) * r],
        s: 6 + rnd() * 6,
        parts: [],
        drift: 0.01,
      });
    }
    // Nuages hauts qui passent.
    for (let i = 0; i < 9; i++) {
      const a = rnd() * Math.PI * 2,
        r = 55 + rnd() * 45;
      list.push({
        p: [Math.cos(a) * r, 26 + rnd() * 16, Math.sin(a) * r],
        s: 3 + rnd() * 2.5,
        parts: [],
        drift: 0.025,
      });
    }
    for (const c of list) {
      const n = 4 + Math.floor(rnd() * 3);
      for (let k = 0; k < n; k++)
        c.parts.push([(k - n / 2) * 1.1 + rnd() * 0.6, rnd() * 0.6, (rnd() - 0.5) * 1.4, 0.7 + rnd() * 0.7]);
    }
    return list;
  }, []);
  const group = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    group.current.rotation.y += dt * 0.006;
  });
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={c.p} scale={c.s}>
          {c.parts.map(([x, y, z, s], k) => (
            <mesh
              key={k}
              geometry={puff}
              material={mat}
              position={[x, y, z]}
              scale={[s * 1.25, s * 0.8, s]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
