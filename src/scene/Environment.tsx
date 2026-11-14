import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { color as C, placeColor } from '../design/tokens';
import { Box, Cylinder, Beam, Sign, material } from './Primitives';
import StaticBatch from './StaticBatch';
import { trees, benches, lamps } from '../world/landscape';
import { heightAt } from '../world/terrain';
import { buildings } from '../world/config';
import { getState, player, setState } from '../state';
import { place } from '../content';

type Item = { p: [number, number, number]; s: [number, number, number]; color: string; angle?: number };
function Instances({ items, geometry }: { items: Item[]; geometry: THREE.BufferGeometry }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const obj = new THREE.Object3D();
    items.forEach((item, i) => {
      obj.position.set(...item.p);
      obj.scale.set(...item.s);
      obj.rotation.set(0, item.angle ?? 0, 0);
      obj.updateMatrix();
      ref.current.setMatrixAt(i, obj.matrix);
      ref.current.setColorAt(i, new THREE.Color(item.color));
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material('#ffffff'), items.length]}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}
/** Horloge du vent, partagée par tous les feuillages. */
const swayTime = { value: 0 };

/**
 * Matériau des arbres : ondulation du feuillage selon la position de chaque instance et, pour les
 * arbres gênants, transparence tramée (alphaHash) pilotée par instance : pas de tri, pas de voile.
 */
function treeMaterial({ ghost, sway }: { ghost: boolean; sway: boolean }) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, alphaHash: ghost });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.swayTime = swayTime;
    let vertex = 'uniform float swayTime;\n' + shader.vertexShader;
    let fragment = shader.fragmentShader;
    if (sway)
      vertex = vertex.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 root = instanceMatrix[3].xyz;
          float lift = position.y + 1.0;
          transformed.x += sin(swayTime * 1.3 + root.x * 0.35 + root.z * 0.27) * 0.05 * lift;
          transformed.z += cos(swayTime * 1.1 + root.x * 0.21) * 0.035 * lift;
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
  m.customProgramCacheKey = () => `tree-${ghost}-${sway}`;
  return m;
}

/** Arbres instanciés. Un arbre qui cache le robot passe dans un maillage translucide. */
const MAX_GHOSTS = 10;
function Trees() {
  const { trunks, leaves, parts } = useMemo(() => {
    const trunks: Item[] = [];
    const leaves: Item[] = [];
    const parts: { trunk: number; leaves: number[]; center: THREE.Vector3; radius: number }[] = [];
    for (const t of trees) {
      const [x, z] = t.p;
      const y = heightAt(x, z);
      const s = t.s;
      const part = {
        trunk: trunks.length,
        leaves: [] as number[],
        center: new THREE.Vector3(x, y + 3.4 * s, z),
        radius: 2.1 * s,
      };
      trunks.push({ p: [x, y + 1.5 * s, z], s: [0.22 * s, 3 * s, 0.22 * s], color: C.trunk });
      if (t.kind === 2) {
        for (let j = 0; j < 3; j++) {
          part.leaves.push(leaves.length);
          leaves.push({
            p: [x, y + (3 + j * 0.8) * s, z],
            s: [(1.35 - j * 0.3) * s, 1.6 * s, (1.35 - j * 0.3) * s],
            color: C.leafDark,
            angle: j,
          });
        }
      } else {
        for (const [dx, dy, dz, r] of [
          [0, 4, 0, 1.8],
          [-0.8, 3.2, 0.2, 1.3],
          [0.8, 3.4, 0.1, 1.2],
          [0.25, 3.7, -0.7, 1.35],
        ]) {
          part.leaves.push(leaves.length);
          leaves.push({
            p: [x + dx * s, y + dy * s, z + dz * s],
            s: [r * s, r * (t.kind === 1 ? 0.65 : 1) * s, r * s],
            color: t.kind === 1 ? C.leafAutumn : C.leaf,
            angle: x,
          });
        }
      }
      parts.push(part);
    }
    return { trunks, leaves, parts };
  }, []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.25, 1, 6), []);
  const leafGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const solidTrunks = useRef<THREE.InstancedMesh>(null!);
  const solidLeaves = useRef<THREE.InstancedMesh>(null!);
  const ghostTrunks = useRef<THREE.InstancedMesh>(null!);
  const ghostLeaves = useRef<THREE.InstancedMesh>(null!);
  const ghost = useMemo(() => {
    // Opacité par instance, lue par le shader standard modifié (voir treeMaterial).
    const make = (geometry: THREE.BufferGeometry, count: number) => {
      const g = geometry.clone();
      g.setAttribute(
        'instanceOpacity',
        new THREE.InstancedBufferAttribute(new Float32Array(count).fill(1), 1),
      );
      return g;
    };
    return {
      trunk: make(trunkGeo, MAX_GHOSTS),
      leaf: make(leafGeo, MAX_GHOSTS * 4),
      trunkMaterial: treeMaterial({ ghost: true, sway: false }),
      leafMaterial: treeMaterial({ ghost: true, sway: true }),
      solidLeafMaterial: treeMaterial({ ghost: false, sway: true }),
    };
  }, [trunkGeo, leafGeo]);
  const state = useMemo(
    () => ({ alpha: new Float32Array(trees.length).fill(1), solid: new Uint8Array(trees.length).fill(1) }),
    [],
  );
  const temp = useMemo(
    () => ({
      m: new THREE.Matrix4(),
      zero: new THREE.Matrix4().makeScale(0, 0, 0),
      c: new THREE.Color(),
      eye: new THREE.Vector3(),
      head: new THREE.Vector3(),
      dir: new THREE.Vector3(),
      to: new THREE.Vector3(),
    }),
    [],
  );
  const matrices = useMemo(() => {
    const object = new THREE.Object3D();
    const build = (item: Item) => {
      object.position.set(...item.p);
      object.scale.set(...item.s);
      object.rotation.set(0, item.angle ?? 0, 0);
      object.updateMatrix();
      return object.matrix.clone();
    };
    return { trunks: trunks.map(build), leaves: leaves.map(build) };
  }, [trunks, leaves]);
  useLayoutEffect(() => {
    trunks.forEach((item, i) => {
      solidTrunks.current.setMatrixAt(i, matrices.trunks[i]);
      solidTrunks.current.setColorAt(i, temp.c.set(item.color));
    });
    leaves.forEach((item, i) => {
      solidLeaves.current.setMatrixAt(i, matrices.leaves[i]);
      solidLeaves.current.setColorAt(i, temp.c.set(item.color));
    });
    for (const mesh of [solidTrunks.current, solidLeaves.current]) {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    for (const mesh of [ghostTrunks.current, ghostLeaves.current]) {
      mesh.count = 0;
      mesh.setColorAt(0, temp.c.set('#ffffff'));
    }
  }, [trunks, leaves, matrices, temp]);
  useFrame(({ camera, clock }, delta) => {
    const s = getState();
    if (!s.reducedMotion) swayTime.value = clock.elapsedTime;
    const active = s.phase === 'explore' || s.phase === 'travel';
    const fov = (camera as THREE.PerspectiveCamera).fov;
    temp.eye.copy(camera.position);
    temp.head.set(player.x, player.y + 1.2, player.z);
    temp.dir.subVectors(temp.head, temp.eye);
    const length = temp.dir.length();
    temp.dir.divideScalar(length || 1);
    let changed = false;
    let trunkCount = 0;
    let leafCount = 0;
    const trunkOpacity = ghost.trunk.attributes.instanceOpacity as THREE.InstancedBufferAttribute;
    const leafOpacity = ghost.leaf.attributes.instanceOpacity as THREE.InstancedBufferAttribute;
    parts.forEach((part, i) => {
      let hidden = false;
      let cover = false;
      if (active) {
        // 1. Le feuillage coupe la ligne de vue caméra → robot.
        const t = THREE.MathUtils.clamp(temp.to.subVectors(part.center, temp.eye).dot(temp.dir), 0, length);
        hidden =
          t < length - 0.8 &&
          temp.to.copy(temp.eye).addScaledVector(temp.dir, t).distanceTo(part.center) < part.radius + 0.4;
        // 2. Un arbre plus proche que le robot couvre une grande part de l'écran.
        const distance = part.center.distanceTo(temp.eye);
        if (!hidden && distance < length) {
          const size = part.radius / (distance * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
          temp.to.copy(part.center).project(camera);
          hidden =
            size > 0.26 && temp.to.z < 1 && Math.abs(temp.to.x) < 1 + size && Math.abs(temp.to.y) < 1 + size;
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
        solidTrunks.current.setMatrixAt(part.trunk, solid ? matrices.trunks[part.trunk] : temp.zero);
        for (const l of part.leaves)
          solidLeaves.current.setMatrixAt(l, solid ? matrices.leaves[l] : temp.zero);
      }
      if (!solid && trunkCount < MAX_GHOSTS) {
        ghostTrunks.current.setMatrixAt(trunkCount, matrices.trunks[part.trunk]);
        ghostTrunks.current.setColorAt(trunkCount, temp.c.set(trunks[part.trunk].color));
        trunkOpacity.setX(trunkCount++, state.alpha[i]);
        for (const l of part.leaves) {
          ghostLeaves.current.setMatrixAt(leafCount, matrices.leaves[l]);
          ghostLeaves.current.setColorAt(leafCount, temp.c.set(leaves[l].color));
          leafOpacity.setX(leafCount++, state.alpha[i]);
        }
      }
    });
    if (changed) {
      solidTrunks.current.instanceMatrix.needsUpdate = true;
      solidLeaves.current.instanceMatrix.needsUpdate = true;
    }
    for (const [mesh, count, opacity] of [
      [ghostTrunks.current, trunkCount, trunkOpacity],
      [ghostLeaves.current, leafCount, leafOpacity],
    ] as const) {
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
        args={[trunkGeo, material('#ffffff'), trunks.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={solidLeaves}
        args={[leafGeo, ghost.solidLeafMaterial, leaves.length]}
        castShadow
        receiveShadow
      />
      <instancedMesh
        ref={ghostTrunks}
        args={[ghost.trunk, ghost.trunkMaterial, MAX_GHOSTS]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={ghostLeaves}
        args={[ghost.leaf, ghost.leafMaterial, MAX_GHOSTS * 4]}
        frustumCulled={false}
      />
    </>
  );
}

/** Massifs fleuris, disposés en bandes le long des allées. */
function Shrubs() {
  const shrubs = useMemo(() => {
    const items: Item[] = [];
    for (const [x, z, length, angle] of [
      [-16, 9, 7, 0.1],
      [13, 5, 6, 0.3],
      [-10, -15, 6, 1],
      [15, -22, 6, 0.2],
      [18, 29, 8, -0.4],
      [-31, 28, 6, 0.8],
    ]) {
      for (let i = 0; i < length; i++) {
        const xx = x + i * Math.cos(angle) * 0.7;
        const zz = z + i * Math.sin(angle) * 0.7;
        items.push({
          p: [xx, heightAt(xx, zz) + 0.4, zz],
          s: [0.65, 0.6, 0.6],
          color: i % 3 === 0 ? C.flower : C.hedge,
        });
      }
    }
    return items;
  }, []);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  return <Instances items={shrubs} geometry={geometry} />;
}

function Bench({ p, angle }: { p: [number, number]; angle: number }) {
  return (
    <group position={[p[0], heightAt(...p) + 0.08, p[1]]} rotation={[0, angle, 0]}>
      {[-1.1, 1.1].map((x) => (
        <Box key={x} p={[x, 0.35, 0]} s={[0.16, 0.7, 0.7]} color={C.ink} />
      ))}
      {[-0.28, 0, 0.28].map((z) => (
        <Box key={z} p={[0, 0.74, z]} s={[3, 0.13, 0.21]} color={C.wood} />
      ))}
      {[1, 1.3].map((y) => (
        <Box key={y} p={[0, y, -0.36]} s={[3, 0.2, 0.13]} color={C.wood} />
      ))}
      {[-1.2, 1.2].map((x) => (
        <Box key={x} p={[x, 1, -0.4]} s={[0.1, 0.75, 0.1]} color={C.ink} />
      ))}
    </group>
  );
}
function Lamp({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], heightAt(...p), p[1]]}>
      <Cylinder p={[0, 1.95, 0]} s={[0.075, 3.9, 0.075]} color={C.ink} />
      <Cylinder p={[0, 0.18, 0]} s={[0.2, 0.36, 0.2]} color={C.ink} />
      <Box p={[0.33, 3.9, 0]} s={[0.8, 0.12, 0.22]} color={C.ink} />
      <Box
        p={[0.58, 3.81, 0]}
        s={[0.5, 0.08, 0.25]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 1.2 }}
      />
    </group>
  );
}
/** Sculpture de la place centrale. */
function Monument() {
  return (
    <group position={[0, 0.8, 0]}>
      <Cylinder p={[0, 0.22, 0]} s={[2.65, 0.44, 2.65]} color={C.cream} />
      <Cylinder p={[0, 0.46, 0]} s={[2.25, 0.06, 2.25]} color={C.water} />
      <Cylinder p={[0, 0.65, 0]} s={[1.05, 0.45, 1.05]} color={C.cream} />
      <group position={[0, 2.75, 0]} rotation={[0.12, 0.42, 0.15]}>
        <mesh castShadow material={material(C.orange, { rough: 0.4 })}>
          <torusGeometry args={[1.9, 0.33, 8, 40, Math.PI * 1.72]} />
        </mesh>
        <mesh
          rotation={[0, Math.PI / 2, 0.2]}
          castShadow
          material={material(C.yellow, { rough: 0.4, metal: 0.2 })}
        >
          <torusGeometry args={[1.35, 0.13, 6, 40, Math.PI * 1.6]} />
        </mesh>
      </group>
    </group>
  );
}
/**
 * Poteau indicateur de la place : une lame par lieu, orientée vers lui, dans la police de l'interface.
 * Un clic ouvre le plan.
 */
const POST: [number, number] = [-8, 5];
function Wayfinding() {
  return (
    <group
      position={[POST[0], 0.7, POST[1]]}
      userData={{ dynamic: true }}
      onClick={(e) => {
        e.stopPropagation();
        setState({ map: true });
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <Cylinder p={[0, 2.2, 0]} s={[0.1, 4.4, 0.1]} color={C.ink} />
      <Cylinder p={[0, 4.45, 0]} s={[0.16, 0.1, 0.16]} color={C.ink} />
      {buildings.map((b, i) => {
        const angle = Math.atan2(b.position[0] - POST[0], b.position[1] - POST[1]) - Math.PI / 2;
        const text = place(b.id).titre;
        const bg = placeColor[b.id];
        const ink = b.id === 'project-2' ? C.ink : C.white;
        return (
          <group key={b.id} position={[0, 4.05 - i * 0.6, 0]} rotation={[0, angle, 0]}>
            <Sign text={`${text}  →`} p={[1.45, 0, 0.035]} s={[2.7, 0.5]} color={ink} bg={bg} />
            <Sign
              text={`←  ${text}`}
              p={[1.45, 0, -0.035]}
              s={[2.7, 0.5]}
              rotation={[0, Math.PI, 0]}
              color={ink}
              bg={bg}
            />
          </group>
        );
      })}
      <Box p={[0, 0.1, 0]} s={[0.6, 0.2, 0.6]} color={C.stone} />
    </group>
  );
}
function Terraces() {
  return (
    <>
      {buildings
        .filter((b) => b.elevation > 2)
        .map((b) => (
          <group
            key={b.id}
            position={[b.position[0], b.elevation, b.position[1]]}
            rotation={[0, b.rotation, 0]}
          >
            <Box p={[0, -0.75, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4, 1.5, 0.7]} color={C.stoneDark} />
            <Box p={[0, 0.05, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4.3, 0.16, 0.9]} color={C.cream} />
            <Box p={[-b.size[0] / 2 - 1.7, -0.6, -1]} s={[0.65, 1.2, b.size[1] - 1]} color={C.stoneDark} />
          </group>
        ))}
    </>
  );
}
function Pergola() {
  return (
    <group position={[-43, heightAt(-43, 20), 20]} rotation={[0, -0.3, 0]}>
      {[-2, 2].flatMap((x) =>
        [-1.5, 1.5].map((z) => (
          <Box key={`${x}${z}`} p={[x, 1.7, z]} s={[0.16, 3.4, 0.16]} color={C.cream} />
        )),
      )}
      {[-2, -1, 0, 1, 2].map((x) => (
        <Box key={x} p={[x, 3.5, 0]} s={[0.2, 0.2, 4]} color={C.wood} />
      ))}
      <Beam a={[-2.3, 3.35, -1.5]} b={[2.3, 3.35, -1.5]} width={0.2} color={C.cream} />
      <Beam a={[-2.3, 3.35, 1.5]} b={[2.3, 3.35, 1.5]} width={0.2} color={C.cream} />
    </group>
  );
}
export default function Environment() {
  return (
    <>
      <Trees />
      <Shrubs />
      <Wayfinding />
      <StaticBatch>
        <Monument />
        <Terraces />
        <Pergola />
        {benches.map((b, i) => (
          <Bench key={i} {...b} />
        ))}
        {lamps.map((p, i) => (
          <Lamp key={i} p={p} />
        ))}
      </StaticBatch>
    </>
  );
}
