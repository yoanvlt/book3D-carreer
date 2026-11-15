/**
 * Dessous de l'île flottante, visible depuis l'accueil : falaise à strates, cône rocheux jusqu'à
 * la pointe, rochers saillants, racines pendantes et deux sources qui tombent en cascade.
 * La forme vient de world/island.ts.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { color as C } from '../design/tokens';
import { ISLAND, WATERFALLS, edgeRadius, undersideRadius } from '../world/island';
import { heightAt } from '../world/terrain';
import { Ball, Box, Cylinder, FINISH, Pipe, Torus } from './Primitives';
import StaticBatch, { Fine } from './StaticBatch';

/** Le plateau descend jusqu'à cette hauteur au bord, où commence la falaise. */
export const RIM_Y = -0.6;
const STRATA = ['#6e4a33', '#a9744a', '#8c5f3d', '#c08a5a', '#94664a', '#b58457'];
const ROCK = ['#8a8580', '#9b958c', '#7d7873', '#a39a8c'];

/** Pseudo-aléa déterministe. */
function random(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function cliffGeometry() {
  const segments = 160;
  const levels = 30;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const c = new THREE.Color();
  for (let k = 0; k <= levels; k++) {
    // Niveaux plus serrés dans la falaise, pour dessiner les strates.
    const t = Math.pow(k / levels, 1.35);
    const y = RIM_Y + ISLAND.bottom * t;
    for (let j = 0; j <= segments; j++) {
      const a = (j / segments) * Math.PI * 2;
      const band = Math.floor(-y / 1.7 + Math.sin(a * 3) * 0.35);
      // Strates en léger ressaut, relief irrégulier, pointe sans relief.
      const ledge = t < ISLAND.cliff ? (band % 2 ? 0.35 : -0.1) : 0;
      const jag =
        (0.035 * Math.sin(9 * a + t * 6) + 0.025 * Math.sin(23 * a - t * 11) + 0.02 * Math.sin(41 * a)) *
        (1 - t);
      const r = undersideRadius(a, t) * (1 + jag) + ledge;
      positions.push(Math.cos(a) * r, y, Math.sin(a) * r);
      if (y > RIM_Y - 1.1) c.set('#5e4130');
      else if (t < ISLAND.cliff * 1.4 || (band + j) % 7 === 0)
        c.set(STRATA[((band % STRATA.length) + STRATA.length) % STRATA.length]);
      else c.set(ROCK[((band % ROCK.length) + ROCK.length) % ROCK.length]);
      c.offsetHSL(0, 0, Math.sin(a * 17 + band) * 0.025);
      colors.push(c.r, c.g, c.b);
      if (k < levels && j < segments) {
        const i = k * (segments + 1) + j;
        indices.push(i, i + 1, i + segments + 1, i + 1, i + segments + 2, i + segments + 1);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

/** Rochers saillants sur la falaise et sous la pointe : un seul maillage instancié. */
function Rocks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const rocks = useMemo(() => {
    const rnd = random(11);
    return Array.from({ length: 56 }, () => {
      const a = rnd() * Math.PI * 2;
      const t = 0.08 + rnd() * 0.85;
      const r = undersideRadius(a, t) + 0.4;
      const size = 0.8 + rnd() * (1.2 + t * 2.4);
      return {
        p: [Math.cos(a) * r, RIM_Y + ISLAND.bottom * t, Math.sin(a) * r],
        size,
        spin: rnd() * 6,
        tone: ROCK[Math.floor(rnd() * ROCK.length)],
      };
    });
  }, []);
  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const c = new THREE.Color();
    rocks.forEach((rock, i) => {
      o.position.set(rock.p[0], rock.p[1], rock.p[2]);
      o.rotation.set(rock.spin, rock.spin * 1.7, rock.spin * 0.4);
      o.scale.set(rock.size, rock.size * 0.8, rock.size);
      o.updateMatrix();
      ref.current.setMatrixAt(i, o.matrix);
      ref.current.setColorAt(i, c.set(rock.tone));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [rocks]);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }), []);
  return <instancedMesh ref={ref} args={[geometry, material, rocks.length]} />;
}

/** Racines qui pendent du bord : trois segments qui s'écartent un peu de la paroi. */
function Roots() {
  const rnd = random(5);
  return (
    <>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + rnd() * 0.3;
        const r = edgeRadius(a) - 0.1;
        const length = 2.5 + rnd() * 3.5;
        const points: [number, number, number][] = [0, 1, 2, 3].map((k) => {
          const rr = r + 0.35 + k * 0.25 + (k === 3 ? rnd() * 0.5 : 0);
          const aa = a + (k * (rnd() - 0.5)) / 40;
          return [Math.cos(aa) * rr, RIM_Y - 0.3 - (length * k) / 3, Math.sin(aa) * rr];
        });
        return points
          .slice(1)
          .map((p, k) => (
            <Pipe
              key={`${i}-${k}`}
              a={points[k]}
              b={p}
              radius={0.11 - k * 0.03}
              color='#5b3d2a'
              shadow={false}
            />
          ));
      })}
    </>
  );
}

/** Une source au bord du plateau et sa cascade dans le vide. */
function Waterfall({ a, width, drop }: { a: number; width: number; drop: number }) {
  const edge = edgeRadius(a);
  const pond: [number, number] = [Math.cos(a) * (edge - 4.5), Math.sin(a) * (edge - 4.5)];
  const ground = heightAt(...pond);
  const out = Math.PI / 2 - a;
  return (
    <>
      {/* Bassin de source : margelle de pierres et eau. */}
      <Cylinder
        p={[pond[0], ground + 0.06, pond[1]]}
        s={[1.7, 0.12, 1.7]}
        color='#7fc6df'
        finish={FINISH.glass}
        shadow={false}
      />
      <Torus
        p={[pond[0], ground + 0.1, pond[1]]}
        r={[Math.PI / 2, 0, 0]}
        radius={1.85}
        tube={0.22}
        segments={18}
        color='#9b958c'
        finish={FINISH.stone}
      />
      {/* Ruisseau jusqu'au bord, puis chute : rideau d'eau strié, écume en tête, brume au pied. */}
      <group position={[Math.cos(a) * (edge - 2.1), 0, Math.sin(a) * (edge - 2.1)]} rotation={[0, out, 0]}>
        <Box
          p={[0, (ground + RIM_Y) / 2 + 0.06, 0]}
          s={[width * 0.6, 0.08, 4.2]}
          r={[Math.atan2(ground - RIM_Y, 4.2), 0, 0]}
          color='#8fd0e6'
          finish={FINISH.glass}
          shadow={false}
        />
      </group>
      <group
        position={[Math.cos(a) * (edge + 0.45), RIM_Y, Math.sin(a) * (edge + 0.45)]}
        rotation={[0, out, 0]}
      >
        <Box
          p={[0, -drop / 2, 0]}
          s={[width, drop, 0.16]}
          color='#cdeefa'
          finish={{ ...FINISH.cladding, rough: 0.2, metal: 0, glow: '#9fdcf2', glowIntensity: 0.25 }}
          shadow={false}
        />
        <Box
          p={[0, -drop / 2, 0.1]}
          s={[width * 0.55, drop * 0.96, 0.08]}
          color={C.white}
          finish={{ rough: 0.3, glow: '#ffffff', glowIntensity: 0.15 }}
          shadow={false}
        />
        <Fine>
          {Array.from({ length: 5 }, (_, i) => (
            <Ball
              key={i}
              p={[(i - 2) * width * 0.22, 0.05, 0.1]}
              s={[0.24, 0.16, 0.2]}
              color={C.white}
              shadow={false}
            />
          ))}
        </Fine>
        {Array.from({ length: 6 }, (_, i) => (
          <Ball
            key={i}
            p={[(i - 2.5) * width * 0.35, -drop - 0.4 + (i % 2) * 0.5, 0.4]}
            s={[1.1, 0.8, 0.9]}
            color='#eef8fd'
            finish={{ rough: 1, glow: '#ffffff', glowIntensity: 0.25 }}
            shadow={false}
          />
        ))}
      </group>
    </>
  );
}

export default function Island() {
  const geometry = useMemo(cliffGeometry, []);
  return (
    <>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>
      <Rocks />
      <StaticBatch>
        <Roots />
        {WATERFALLS.map((w) => (
          <Waterfall key={w.a} {...w} />
        ))}
      </StaticBatch>
    </>
  );
}
