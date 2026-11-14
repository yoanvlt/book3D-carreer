import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { color as C } from '../design/tokens';
import { Box, Cylinder, Beam, Sign, material } from './Primitives';
import { trees, benches, lamps } from '../world/landscape';
import { heightAt } from '../world/terrain';
import { buildings } from '../world/config';
import { setState } from '../state';

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
function Planting() {
  const { trunks, leaves, shrubs } = useMemo(() => {
    const trunks: Item[] = [],
      leaves: Item[] = [],
      shrubs: Item[] = [];
    for (const t of trees) {
      const [x, z] = t.p,
        y = heightAt(x, z),
        s = t.s;
      trunks.push({ p: [x, y + 1.5 * s, z], s: [0.22 * s, 3 * s, 0.22 * s], color: '#7a5236' });
      if (t.kind === 2) {
        for (let j = 0; j < 3; j++)
          leaves.push({
            p: [x, y + (3 + j * 0.8) * s, z],
            s: [(1.35 - j * 0.3) * s, 1.6 * s, (1.35 - j * 0.3) * s],
            color: C.leafDark,
            angle: j,
          });
      } else {
        for (const [dx, dy, dz, r] of [
          [0, 4, 0, 1.8],
          [-0.8, 3.2, 0.2, 1.3],
          [0.8, 3.4, 0.1, 1.2],
          [0.25, 3.7, -0.7, 1.35],
        ])
          leaves.push({
            p: [x + dx * s, y + dy * s, z + dz * s],
            s: [r * s, r * (t.kind === 1 ? 0.65 : 1) * s, r * s],
            color: t.kind === 1 ? '#ffc23d' : C.leaf,
            angle: x,
          });
      }
    }
    // Flower beds arranged in narrow bands, not random scattering.
    for (const [x, z, length, angle] of [
      [-16, 9, 7, 0.1],
      [13, 5, 6, 0.3],
      [-10, -15, 6, 1],
      [15, -22, 6, 0.2],
      [18, 29, 8, -0.4],
      [-31, 28, 6, 0.8],
    ]) {
      for (let i = 0; i < length; i++) {
        const xx = x + i * Math.cos(angle) * 0.7,
          zz = z + i * Math.sin(angle) * 0.7;
        shrubs.push({
          p: [xx, heightAt(xx, zz) + 0.4, zz],
          s: [0.65, 0.6, 0.6],
          color: i % 3 === 0 ? '#c896c3' : '#729854',
        });
      }
    }
    return { trunks, leaves, shrubs };
  }, []);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(1, 1.25, 1, 6), []),
    leafGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  return (
    <>
      <Instances items={trunks} geometry={trunkGeo} />
      <Instances items={leaves} geometry={leafGeo} />
      <Instances items={shrubs} geometry={leafGeo} />
    </>
  );
}
function Bench({ p, angle }: { p: [number, number]; angle: number }) {
  return (
    <group position={[p[0], heightAt(...p) + 0.08, p[1]]} rotation={[0, angle, 0]}>
      {[-1.1, 1.1].map((x) => (
        <Box key={x} p={[x, 0.35, 0]} s={[0.16, 0.7, 0.7]} color={C.ink} />
      ))}
      {[-0.28, 0, 0.28].map((z) => (
        <Box key={z} p={[0, 0.74, z]} s={[3, 0.13, 0.21]} color='#c97b3f' />
      ))}
      {[1, 1.3].map((y) => (
        <Box key={y} p={[0, y, -0.36]} s={[3, 0.2, 0.13]} color='#c97b3f' />
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
      <Box p={[0.58, 3.81, 0]} s={[0.5, 0.08, 0.25]} color={C.cream} />
    </group>
  );
}
function Monument() {
  return (
    <group position={[0, 0.8, 0]}>
      <Cylinder p={[0, 0.22, 0]} s={[2.65, 0.44, 2.65]} color={C.cream} />
      <Cylinder p={[0, 0.46, 0]} s={[2.25, 0.06, 2.25]} color='#79c2ce' />
      <Cylinder p={[0, 0.65, 0]} s={[1.05, 0.45, 1.05]} color={C.cream} />
      <group position={[0, 2.75, 0]} rotation={[0.12, 0.42, 0.15]}>
        <mesh castShadow>
          <torusGeometry args={[1.9, 0.33, 8, 40, Math.PI * 1.72]} />
          <meshStandardMaterial color={C.orange} roughness={0.4} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0.2]} castShadow>
          <torusGeometry args={[1.35, 0.13, 6, 40, Math.PI * 1.6]} />
          <meshStandardMaterial color='#fcbb48' metalness={0.2} roughness={0.4} />
        </mesh>
      </group>
      <Sign text='PLACE DES POSSIBLES' p={[0, 0.55, 2.5]} s={[3.2, 0.4]} />
    </group>
  );
}
function Wayfinding() {
  return (
    <group
      position={[-8, 0.7, 5]}
      onClick={(e) => {
        e.stopPropagation();
        setState({ map: true });
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <Cylinder p={[0, 1.6, 0]} s={[0.1, 3.2, 0.1]} color={C.ink} />
      <Sign text='LES PROJETS  →' p={[0.4, 2.9, 0.12]} s={[3, 0.5]} />
      <Sign text='←  PROFIL' p={[-0.35, 2.25, 0.12]} s={[2.8, 0.5]} color={C.cream} bg={C.orange} />
      <Sign text='PLAN DU CAMPUS  ↗' p={[0.3, 1.55, 0.12]} s={[3.3, 0.55]} />
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
            <Box p={[0, -0.75, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4, 1.5, 0.7]} color='#cbb594' />
            <Box p={[0, 0.05, -b.size[1] / 2 - 1.5]} s={[b.size[0] + 4.3, 0.16, 0.9]} color={C.cream} />
            <Box p={[-b.size[0] / 2 - 1.7, -0.6, -1]} s={[0.65, 1.2, b.size[1] - 1]} color='#cbb594' />
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
        <Box key={x} p={[x, 3.5, 0]} s={[0.2, 0.2, 4]} color='#d68f55' />
      ))}
      <Beam a={[-2.3, 3.35, -1.5]} b={[2.3, 3.35, -1.5]} width={0.2} color={C.cream} />
      <Beam a={[-2.3, 3.35, 1.5]} b={[2.3, 3.35, 1.5]} width={0.2} color={C.cream} />
    </group>
  );
}
export default function Environment() {
  return (
    <>
      <Planting />
      <Monument />
      <Wayfinding />
      <Terraces />
      <Pergola />
      {benches.map((b, i) => (
        <Bench key={i} {...b} />
      ))}
      {lamps.map((p, i) => (
        <Lamp key={i} p={p} />
      ))}
    </>
  );
}
