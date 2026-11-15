/**
 * Végétation, toute instanciée : quatre essences d'arbres (feuillus à couronne irrégulière,
 * bouleaux, conifères à étages, quelques feuillus d'automne), haies taillées, herbes hautes,
 * fleurs et cailloux. Les feuillages ondulent au vent ; un arbre qui cache le robot devient
 * translucide (trame) ou disparaît s'il couvre l'écran, comme en V5.
 */
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { color as C, muted } from '../design/tokens';
import { gardens, trees } from '../world/landscape';
import { hedgeBlocks } from '../world/decor';
import { heightAt } from '../world/terrain';
import { distanceToRoad } from '../world/urban';
import { buildings } from '../world/config';
import { getState, player, useGame } from '../state';

type Item = {
  p: [number, number, number];
  s: [number, number, number];
  color: string;
  r?: [number, number, number];
};

/** Pseudo-aléa déterministe (graine fixe : la végétation est identique à chaque visite). */
function random(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const temp = new THREE.Object3D();
function matrixOf(item: Item) {
  temp.position.set(...item.p);
  temp.scale.set(...item.s);
  temp.rotation.set(...(item.r ?? [0, 0, 0]));
  temp.updateMatrix();
  return temp.matrix.clone();
}

/** Horloge du vent, partagée par tous les feuillages. */
const swayTime = { value: 0 };

/**
 * Matériau de la végétation : ondulation selon la position de chaque instance ; marques sombres
 * de l'écorce des bouleaux (troncs très clairs) ; pour les arbres gênants, transparence tramée
 * (alphaHash) pilotée par instance : pas de tri, pas de voile.
 */
function plantMaterial({ ghost, sway, bark = false }: { ghost: boolean; sway: number; bark?: boolean }) {
  const m = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: bark ? 0.9 : 0.8,
    alphaHash: ghost,
    flatShading: !bark,
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.swayTime = swayTime;
    let vertex = 'uniform float swayTime;\nvarying vec3 vPlantPos;\n' + shader.vertexShader;
    let fragment = 'varying vec3 vPlantPos;\n' + shader.fragmentShader;
    vertex = vertex.replace('#include <begin_vertex>', '#include <begin_vertex>\nvPlantPos = position;');
    if (sway)
      vertex = vertex.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 root = instanceMatrix[3].xyz;
          float lift = position.y + 1.0;
          transformed.x += sin(swayTime * 1.3 + root.x * 0.35 + root.z * 0.27) * ${(0.05 * sway).toFixed(3)} * lift;
          transformed.z += cos(swayTime * 1.1 + root.x * 0.21) * ${(0.035 * sway).toFixed(3)} * lift;
        #endif`,
      );
    if (bark)
      // Bouleau : tirets sombres horizontaux sur un tronc clair (couleur d'instance très claire).
      fragment = fragment.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        #ifdef USE_INSTANCING_COLOR
          if (vColor.r + vColor.g + vColor.b > 2.4) {
            float ring = fract(vPlantPos.y * 4.0 + sin(atan(vPlantPos.z, vPlantPos.x) * 3.0) * 0.25);
            float dash = step(0.5, sin(atan(vPlantPos.z, vPlantPos.x) * 5.0 + vPlantPos.y * 7.0));
            diffuseColor.rgb *= 1.0 - 0.7 * step(0.86, ring) * dash;
          }
        #endif`,
      );
    if (ghost) {
      vertex =
        'attribute float instanceOpacity;\nvarying float vInstanceOpacity;\n' +
        vertex.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvInstanceOpacity = instanceOpacity;',
        );
      fragment =
        'varying float vInstanceOpacity;\n' +
        fragment.replace(
          '#include <alphahash_fragment>',
          'diffuseColor.a *= vInstanceOpacity;\n#include <alphahash_fragment>',
        );
    }
    shader.vertexShader = vertex;
    shader.fragmentShader = fragment;
  };
  m.customProgramCacheKey = () => `plant-${ghost}-${sway}-${bark}`;
  return m;
}

/** Palettes : couronnes vertes variées, bouleaux clairs, conifères sombres, automne adouci. */
const LEAF = [C.leaf, C.leafDark, muted('#7bb052'), muted('#4f9a45')];
const BIRCH_LEAF = [muted('#a7cf63'), muted('#8fc05a'), muted('#b9d873')];
const CONIFER = ['#2f6e4a', '#2a6343', '#357852'];
const AUTUMN = [muted('#d99a45', 0.2), muted('#c7813f', 0.2), muted('#b9a24b', 0.2)];

/** Géométries : 0 couronne (icosaèdre), 1 étage de conifère (cône à huit pans). */
const GEOMETRIES = 2;
interface Part {
  trunks: number[];
  leaves: [number, number][];
  center: THREE.Vector3;
  radius: number;
}

/** Arbres : un tronc (et parfois des branches ou un second tronc), puis la couronne de l'essence. */
function plantTrees() {
  const rnd = random(19);
  const trunks: Item[] = [];
  const leaves: Item[][] = [[], []];
  const parts: Part[] = [];
  trees.forEach((t, n) => {
    const [x, z] = t.p;
    const y = heightAt(x, z);
    const s = t.s;
    // Essences : 2 conifère, 1 bouleau, quelques feuillus d'automne parmi les autres.
    const kind = t.kind === 2 ? 'conifer' : t.kind === 1 ? 'birch' : n % 9 === 4 ? 'autumn' : 'leafy';
    const part: Part = {
      trunks: [],
      leaves: [],
      center: new THREE.Vector3(x, y + 3.4 * s, z),
      radius: 2.1 * s,
    };
    const trunk = (item: Item) => {
      part.trunks.push(trunks.length);
      trunks.push(item);
    };
    const leaf = (geo: number, item: Item) => {
      part.leaves.push([geo, leaves[geo].length]);
      leaves[geo].push(item);
    };
    if (kind === 'conifer') {
      trunk({ p: [x, y + 0.9 * s, z], s: [0.2 * s, 1.8 * s, 0.2 * s], color: '#5a3d2a' });
      for (let j = 0; j < 4; j++)
        leaf(1, {
          p: [x, y + (1.6 + j * 1.05) * s, z],
          s: [(1.75 - j * 0.38) * s, 1.6 * s, (1.75 - j * 0.38) * s],
          color: CONIFER[(n + j) % 3],
          r: [0, j * 0.4 + rnd(), 0],
        });
      part.center.set(x, y + 3.2 * s, z);
    } else if (kind === 'birch') {
      const twin = n % 2 === 0;
      for (const [dx, lean] of twin
        ? ([
            [-0.25, -0.08],
            [0.25, 0.1],
          ] as const)
        : ([[0, 0.03]] as const))
        trunk({
          p: [x + dx * s, y + 2.1 * s, z],
          s: [0.13 * s, 4.2 * s, 0.13 * s],
          color: '#efebe2',
          r: [lean, 0, lean * 0.5],
        });
      for (let j = 0; j < 5; j++) {
        const a = j * 1.3 + rnd();
        leaf(0, {
          p: [x + Math.cos(a) * 0.55 * s, y + (3.6 + (j % 3) * 0.55) * s, z + Math.sin(a) * 0.55 * s],
          s: [0.75 * s, 1.0 * s, 0.75 * s],
          color: BIRCH_LEAF[j % 3],
          r: [0, a, 0],
        });
      }
      part.radius = 1.5 * s;
      part.center.set(x, y + 4 * s, z);
    } else {
      trunk({ p: [x, y + 1.5 * s, z], s: [0.22 * s, 3 * s, 0.22 * s], color: C.trunk });
      // Deux branches maîtresses, puis une couronne de six volumes inégaux.
      for (const a of [0.6 + rnd(), 3.4 + rnd()])
        trunk({
          p: [x + Math.cos(a) * 0.35 * s, y + 2.7 * s, z + Math.sin(a) * 0.35 * s],
          s: [0.1 * s, 1.3 * s, 0.1 * s],
          color: C.trunk,
          r: [Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7],
        });
      const palette = kind === 'autumn' ? AUTUMN : LEAF;
      const lumps: [number, number, number, number][] = [
        [0, 4.05, 0, 1.55],
        [-0.95, 3.4, 0.3, 1.15],
        [0.9, 3.55, 0.2, 1.1],
        [0.25, 3.75, -0.85, 1.2],
        [-0.3, 3.3, 0.95, 1.0],
        [0.55, 4.6, 0.4, 0.85],
      ];
      lumps.forEach(([dx, dy, dz, r], j) =>
        leaf(0, {
          p: [x + dx * s, y + dy * s, z + dz * s],
          s: [r * s * (0.9 + rnd() * 0.2), r * 0.82 * s, r * s * (0.9 + rnd() * 0.2)],
          color: palette[(j + n) % palette.length],
          r: [0, rnd() * 6, 0],
        }),
      );
    }
    parts.push(part);
  });
  return { trunks, leaves, parts };
}

/** Arbres instanciés. Un arbre qui cache le robot passe dans des maillages translucides. */
const MAX_GHOSTS = 10;
const GHOST_LEAVES = 6;
function Trees() {
  const { trunks, leaves, parts } = useMemo(plantTrees, []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.25, 1, 7), []);
  const leafGeos = useMemo(() => {
    const cone = new THREE.ConeGeometry(1, 1, 8);
    return [new THREE.IcosahedronGeometry(1, 1), cone];
  }, []);
  const solidTrunks = useRef<THREE.InstancedMesh>(null!);
  const ghostTrunks = useRef<THREE.InstancedMesh>(null!);
  const solidLeaves = useRef<THREE.InstancedMesh[]>([]);
  const ghostLeaves = useRef<THREE.InstancedMesh[]>([]);
  const ghost = useMemo(() => {
    // Opacité par instance, lue par le shader modifié (voir plantMaterial).
    const make = (geometry: THREE.BufferGeometry, count: number) => {
      const g = geometry.clone();
      g.setAttribute(
        'instanceOpacity',
        new THREE.InstancedBufferAttribute(new Float32Array(count).fill(1), 1),
      );
      return g;
    };
    return {
      trunk: make(trunkGeo, MAX_GHOSTS * 2),
      leaves: leafGeos.map((g) => make(g, MAX_GHOSTS * GHOST_LEAVES)),
      trunkMaterial: plantMaterial({ ghost: true, sway: 0, bark: true }),
      leafMaterial: plantMaterial({ ghost: true, sway: 1 }),
      solidTrunkMaterial: plantMaterial({ ghost: false, sway: 0, bark: true }),
      solidLeafMaterial: plantMaterial({ ghost: false, sway: 1 }),
    };
  }, [trunkGeo, leafGeos]);
  const state = useMemo(
    () => ({ alpha: new Float32Array(parts.length).fill(1), solid: new Uint8Array(parts.length).fill(1) }),
    [parts],
  );
  const t = useMemo(
    () => ({
      zero: new THREE.Matrix4().makeScale(0, 0, 0),
      c: new THREE.Color(),
      eye: new THREE.Vector3(),
      head: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      to: new THREE.Vector3(),
    }),
    [],
  );
  const matrices = useMemo(
    () => ({ trunks: trunks.map(matrixOf), leaves: leaves.map((l) => l.map(matrixOf)) }),
    [trunks, leaves],
  );
  useLayoutEffect(() => {
    trunks.forEach((item, i) => {
      solidTrunks.current.setMatrixAt(i, matrices.trunks[i]);
      solidTrunks.current.setColorAt(i, t.c.set(item.color));
    });
    leaves.forEach((list, g) =>
      list.forEach((item, i) => {
        solidLeaves.current[g].setMatrixAt(i, matrices.leaves[g][i]);
        solidLeaves.current[g].setColorAt(i, t.c.set(item.color));
      }),
    );
    for (const mesh of [solidTrunks.current, ...solidLeaves.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    for (const mesh of [ghostTrunks.current, ...ghostLeaves.current]) {
      mesh.count = 0;
      mesh.setColorAt(0, t.c.set('#ffffff'));
    }
  }, [trunks, leaves, matrices, t]);
  useFrame(({ camera, clock }, delta) => {
    const s = getState();
    if (!s.reducedMotion) swayTime.value = clock.elapsedTime;
    const active = s.phase === 'explore' || s.phase === 'travel';
    const fov = (camera as THREE.PerspectiveCamera).fov;
    t.eye.copy(camera.position);
    t.head.set(player.x, player.y + 1.2, player.z);
    t.dir.subVectors(t.head, t.eye);
    const length = t.dir.length();
    t.dir.divideScalar(length || 1);
    let changed = false;
    let trunkCount = 0;
    const leafCount = leafGeos.map(() => 0);
    const trunkOpacity = ghost.trunk.attributes.instanceOpacity as THREE.InstancedBufferAttribute;
    const leafOpacity = ghost.leaves.map(
      (g) => g.attributes.instanceOpacity as THREE.InstancedBufferAttribute,
    );
    parts.forEach((part, i) => {
      let hidden = false;
      let cover = false;
      if (active) {
        // 1. Le feuillage coupe la ligne de vue caméra → robot.
        const along = THREE.MathUtils.clamp(t.to.subVectors(part.center, t.eye).dot(t.dir), 0, length);
        hidden =
          along < length - 0.8 &&
          t.to.copy(t.eye).addScaledVector(t.dir, along).distanceTo(part.center) < part.radius + 0.4;
        // 2. Un arbre plus proche que le robot couvre une grande part de l'écran.
        const distance = part.center.distanceTo(t.eye);
        if (!hidden && distance < length) {
          const size = part.radius / (distance * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
          t.to.copy(part.center).project(camera);
          hidden = size > 0.26 && t.to.z < 1 && Math.abs(t.to.x) < 1 + size && Math.abs(t.to.y) < 1 + size;
          cover = hidden;
        }
      }
      // Arbre sur la ligne de vue : trame légère ; arbre qui couvre l'écran : disparition complète.
      const alpha = THREE.MathUtils.damp(state.alpha[i], hidden ? (cover ? 0 : 0.35) : 1, 9, delta);
      state.alpha[i] = alpha > 0.995 ? 1 : alpha;
      const solid = state.alpha[i] === 1 ? 1 : 0;
      if (solid !== state.solid[i]) {
        state.solid[i] = solid;
        changed = true;
        for (const k of part.trunks) solidTrunks.current.setMatrixAt(k, solid ? matrices.trunks[k] : t.zero);
        for (const [g, k] of part.leaves)
          solidLeaves.current[g].setMatrixAt(k, solid ? matrices.leaves[g][k] : t.zero);
      }
      if (!solid && trunkCount + part.trunks.length <= MAX_GHOSTS * 2) {
        for (const k of part.trunks) {
          ghostTrunks.current.setMatrixAt(trunkCount, matrices.trunks[k]);
          ghostTrunks.current.setColorAt(trunkCount, t.c.set(trunks[k].color));
          trunkOpacity.setX(trunkCount++, state.alpha[i]);
        }
        for (const [g, k] of part.leaves) {
          if (leafCount[g] >= MAX_GHOSTS * GHOST_LEAVES) continue;
          ghostLeaves.current[g].setMatrixAt(leafCount[g], matrices.leaves[g][k]);
          ghostLeaves.current[g].setColorAt(leafCount[g], t.c.set(leaves[g][k].color));
          leafOpacity[g].setX(leafCount[g]++, state.alpha[i]);
        }
      }
    });
    if (changed)
      for (const mesh of [solidTrunks.current, ...solidLeaves.current])
        mesh.instanceMatrix.needsUpdate = true;
    const ghosts: [THREE.InstancedMesh, number, THREE.InstancedBufferAttribute][] = [
      [ghostTrunks.current, trunkCount, trunkOpacity],
      ...ghostLeaves.current.map(
        (m, g) =>
          [m, leafCount[g], leafOpacity[g]] as [THREE.InstancedMesh, number, THREE.InstancedBufferAttribute],
      ),
    ];
    for (const [mesh, count, opacity] of ghosts) {
      mesh.count = count;
      if (!count) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      opacity.needsUpdate = true;
    }
  });
  return (
    <>
      <instancedMesh
        ref={solidTrunks}
        args={[trunkGeo, ghost.solidTrunkMaterial, trunks.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={ghostTrunks}
        args={[ghost.trunk, ghost.trunkMaterial, MAX_GHOSTS * 2]}
        frustumCulled={false}
      />
      {Array.from({ length: GEOMETRIES }, (_, g) => (
        <group key={g}>
          <instancedMesh
            ref={(m) => {
              if (m) solidLeaves.current[g] = m;
            }}
            args={[leafGeos[g], ghost.solidLeafMaterial, leaves[g].length]}
            castShadow
            receiveShadow
          />
          <instancedMesh
            ref={(m) => {
              if (m) ghostLeaves.current[g] = m;
            }}
            args={[ghost.leaves[g], ghost.leafMaterial, MAX_GHOSTS * GHOST_LEAVES]}
            frustumCulled={false}
          />
        </group>
      ))}
    </>
  );
}

/** Maillage instancié statique (haies, fleurs, herbes, cailloux). */
function Instances({
  items,
  geometry,
  material,
  shadow = true,
}: {
  items: Item[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  shadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const c = new THREE.Color();
    items.forEach((item, i) => {
      ref.current.setMatrixAt(i, matrixOf(item));
      ref.current.setColorAt(i, c.set(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={shadow}
      receiveShadow
      dispose={null}
    />
  );
}

/** Haies taillées le long des allées (world/decor.ts) : blocs arrondis jointifs, posés au plus bas du sol. */
function Hedges() {
  const items = useMemo(
    () =>
      hedgeBlocks.map((h, i): Item => ({
        p: [h.p[0], h.y + h.h / 2, h.p[1]],
        s: [0.78, h.h, 0.72],
        color: i % 4 === 1 ? muted('#4f8a46') : C.hedge,
        r: [0, -h.angle, 0],
      })),
    [],
  );
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.18), []);
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), []);
  return <Instances items={items} geometry={geometry} material={material} />;
}

/** Vrai si (x, z) est libre pour une petite plante : hors allées et hors des bâtiments. */
function open(x: number, z: number, road = 3.4) {
  if (Math.hypot(x, z) > 58 || Math.hypot(x, z) < 9) return false;
  if (distanceToRoad(x, z) < road) return false;
  return buildings.every(
    (b) => Math.hypot(x - b.position[0], z - b.position[1]) > Math.hypot(...b.size) / 2 + 2.5,
  );
}

/** Herbes hautes, fleurs des plates-bandes et cailloux : semés une fois, graine fixe. */
function GroundCover() {
  const { quality } = useGame();
  const { grass, flowers, pebbles, shrubs } = useMemo(() => {
    const shrubs: Item[] = [];
    const rnd = random(23);
    const grass: Item[] = [];
    const flowers: Item[] = [];
    const pebbles: Item[] = [];
    // Touffes au pied des arbres et en lisière des pelouses.
    for (const t of trees)
      for (let k = 0; k < 5; k++) {
        const a = rnd() * Math.PI * 2;
        const r = 0.8 + rnd() * 1.8;
        const x = t.p[0] + Math.cos(a) * r;
        const z = t.p[1] + Math.sin(a) * r;
        if (!open(x, z, 3.2)) continue;
        const s = 0.5 + rnd() * 0.5;
        grass.push({
          p: [x, heightAt(x, z), z],
          s: [s, s * (0.9 + rnd() * 0.6), s],
          color: rnd() > 0.5 ? muted('#6f9e45') : muted('#86ad52'),
          r: [0, rnd() * 6, 0],
        });
      }
    // Plates-bandes fleuries dans les jardins.
    for (const [gx, gz, rx, rz, angle] of gardens) {
      const count = Math.round(rx * rz * 1.4);
      for (let k = 0; k < count; k++) {
        const u = Math.sqrt(rnd()) * 0.85;
        const a = rnd() * Math.PI * 2;
        const dx = Math.cos(a) * rx * u;
        const dz = Math.sin(a) * rz * u;
        const x = gx + dx * Math.cos(angle) - dz * Math.sin(angle);
        const z = gz + dx * Math.sin(angle) + dz * Math.cos(angle);
        if (!open(x, z, 3.0)) continue;
        const kind = rnd();
        if (kind < 0.55) {
          const color = [C.flower, C.yellowSoft, '#ffffff', muted('#ef8f6a'), muted('#9fb7ef')][
            Math.floor(rnd() * 5)
          ];
          flowers.push({ p: [x, heightAt(x, z) + 0.28, z], s: [0.11, 0.09, 0.11], color });
        } else
          grass.push({
            p: [x, heightAt(x, z), z],
            s: [0.45, 0.6, 0.45],
            color: muted('#7aa84c'),
            r: [0, rnd() * 6, 0],
          });
      }
    }
    // Cailloux en bord d'allée.
    for (let k = 0; k < 260; k++) {
      const a = rnd() * Math.PI * 2;
      const r = 10 + rnd() * 47;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const d = distanceToRoad(x, z);
      if (d < 3.3 || d > 4.6 || !open(x, z, 0)) continue;
      const s = 0.08 + rnd() * 0.16;
      pebbles.push({
        p: [x, heightAt(x, z) + s * 0.3, z],
        s: [s * 1.3, s, s],
        color: ['#a7a196', '#bcb5a8', '#8d877c'][k % 3],
        r: [rnd(), rnd() * 6, 0],
      });
    }
    // Massifs composés : deux ou trois arbustes au pied d'un arbre sur deux, côté opposé au chemin.
    trees.forEach((t, n) => {
      if (n % 2 || t.grate) return;
      for (let k = 0; k < 3; k++) {
        const a = n * 1.7 + k * 1.1;
        const r = 1.1 + (k % 2) * 0.5;
        const [x, z] = [t.p[0] + Math.cos(a) * r, t.p[1] + Math.sin(a) * r];
        if (!open(x, z, 3.2)) continue;
        const s = 0.42 + rnd() * 0.25;
        shrubs.push({
          p: [x, heightAt(x, z) + s * 0.6, z],
          s: [s * 1.2, s, s],
          color: k % 2 ? C.leafDark : muted('#5d9a4a'),
          r: [0, rnd() * 6, 0],
        });
      }
    });
    return { grass, flowers, pebbles, shrubs };
  }, []);
  const geometries = useMemo(() => {
    // Touffe : cinq brins triangulaires croisés.
    const blades: number[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI;
      const lean = (i % 2 ? 0.18 : -0.12) * Math.cos(a);
      const [cx, cz] = [Math.cos(a) * 0.09, Math.sin(a) * 0.09];
      blades.push(-cx, 0, -cz, cx, 0, cz, lean, 0.7 + (i % 3) * 0.15, lean * 0.5);
    }
    const tuft = new THREE.BufferGeometry();
    tuft.setAttribute('position', new THREE.Float32BufferAttribute(blades, 3));
    tuft.computeVertexNormals();
    return { tuft, flower: new THREE.IcosahedronGeometry(1, 0), pebble: new THREE.IcosahedronGeometry(1, 0) };
  }, []);
  const materials = useMemo(() => {
    const grass = plantMaterial({ ghost: false, sway: 1.6 });
    grass.side = THREE.DoubleSide;
    return {
      grass,
      pebble: new THREE.MeshStandardMaterial({ roughness: 0.95, flatShading: true }),
    };
  }, []);
  // Qualité Légère : petits éléments du sol retirés (troisième niveau de lecture).
  if (quality === 'low') return null;
  return (
    <>
      <Instances items={grass} geometry={geometries.tuft} material={materials.grass} shadow={false} />
      <Instances items={flowers} geometry={geometries.flower} material={materials.grass} shadow={false} />
      <Instances items={pebbles} geometry={geometries.pebble} material={materials.pebble} shadow={false} />
      <Instances items={shrubs} geometry={geometries.flower} material={materials.pebble} />
    </>
  );
}

/** Pieds d'arbres : disque de paillage sous chaque arbre, grille de fonte sous les arbres d'alignement. */
function TreePits() {
  const { mulch, grates } = useMemo(() => {
    const mulch: Item[] = [];
    const grates: Item[] = [];
    for (const t of trees) {
      const y = heightAt(...t.p);
      if (t.grate) grates.push({ p: [t.p[0], y + 0.16, t.p[1]], s: [1.5, 0.03, 1.5], color: '#2f3b45' });
      else mulch.push({ p: [t.p[0], y + 0.02, t.p[1]], s: [0.75 * t.s, 0.04, 0.75 * t.s], color: '#6b4a33' });
    }
    return { mulch, grates };
  }, []);
  const geometries = useMemo(
    () => ({ disc: new THREE.CylinderGeometry(1, 1, 1, 12), square: new THREE.BoxGeometry(1, 1, 1) }),
    [],
  );
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 1 }), []);
  return (
    <>
      <Instances items={mulch} geometry={geometries.disc} material={material} shadow={false} />
      <Instances items={grates} geometry={geometries.square} material={material} shadow={false} />
    </>
  );
}

export { Trees, Hedges, GroundCover, TreePits };
