import { streets, approaches } from '../world/urban';
import { gardens } from '../world/landscape';
import { manholes } from '../world/decor';
import { APPROACH_WIDTH, STREET_WIDTH, pavementClearance, sampleRoad } from '../world/roads';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { edgeRadius } from '../world/island';
import Island, { RIM_Y } from './Island';
import type { Point } from '../world/config';
import { material, Box, Cylinder, FINISH, type Finish } from './Primitives';
import StaticBatch, { Fine } from './StaticBatch';
import { color as C } from '../design/tokens';
const T = {
  low: C.grass,
  high: C.grassHigh,
  edge: C.earth,
  garden: C.garden,
  path: C.path,
  streetEdge: C.pathEdge,
};

function TerrainMesh() {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry(),
      vertices: number[] = [],
      indices: number[] = [],
      colors: number[] = [];
    const color = new THREE.Color();
    const segments = 192,
      rings = 120;
    for (let i = 0; i <= rings; i++)
      for (let j = 0; j <= segments; j++) {
        const a = (j / segments) * Math.PI * 2,
          rim = edgeRadius(a);
        const d = (rim * i) / rings,
          x = Math.cos(a) * d,
          z = Math.sin(a) * d;
        let h = heightAt(x, z);
        // Lèvre arrondie : le plateau descend vers le haut de la falaise (scene/Island.tsx).
        const lip = Math.max(0, Math.min(1, (d - (rim - 2.6)) / 2.6)) ** 2;
        h = h * (1 - lip) + RIM_Y * lip;
        // Sous le dallage et à ses abords, le terrain s'abaisse : l'herbe ne perce jamais une allée.
        if (d < 58) h -= 0.14 * (1 - smoothstep(-0.2, 0.8, pavementClearance(x, z)));
        vertices.push(x, h, z);
        color.set(d > rim - 0.9 ? T.edge : h > 4.4 ? T.high : T.low);
        // Herbe : grandes taches de teinte et de saturation, petit grain de lumière.
        const patch = Math.sin(x * 0.11 + z * 0.07) * Math.cos(z * 0.09 - x * 0.04);
        const noise =
          Math.sin(x * 0.21 + z * 0.13) * Math.cos(z * 0.17 - x * 0.05) * 0.035 +
          Math.sin(x * 1.31 + z * 0.7) * Math.cos(z * 1.53) * 0.014;
        color.offsetHSL(patch * 0.018, patch * 0.06, noise);
        colors.push(color.r, color.g, color.b);
        if (i < rings && j < segments) {
          const k = i * (segments + 1) + j;
          indices.push(k, k + 1, k + segments + 1, k + 1, k + segments + 2, k + segments + 1);
        }
      }
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} flatShading />
    </mesh>
  );
}
function Path({
  points,
  width = 3.5,
  color = T.path,
  offset = 0.15,
  shift = 0,
  segments = 8,
  finish,
}: {
  points: Point[];
  width?: number;
  color?: string;
  offset?: number;
  /** Décalage latéral de la bande par rapport à l'axe (bordures). */
  shift?: number;
  segments?: number;
  finish?: Finish;
}) {
  const geometry = useMemo(() => {
    const samples = sampleRoad(points, 240);
    const vertices: number[] = [],
      indices: number[] = [];
    const lengthSegments = 240,
      widthSegments = segments;
    for (let i = 0; i <= lengthSegments; i++) {
      const {
        p: [px, pz],
        t: [tx, tz],
      } = samples[i];
      const p = { x: px, z: pz },
        t = { x: tx, z: tz };
      const dx = (-t.z * width) / 2,
        dz = (t.x * width) / 2;
      for (let j = 0; j <= widthSegments; j++) {
        const side = (2 * j) / widthSegments - 1;
        const x = p.x + dx * side - t.z * shift,
          z = p.z + dz * side + t.x * shift;
        vertices.push(x, heightAt(x, z) + offset, z);
        if (i < lengthSegments && j < widthSegments) {
          const a = i * (widthSegments + 1) + j;
          indices.push(a, a + 1, a + widthSegments + 1, a + 1, a + widthSegments + 2, a + widthSegments + 1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [points, width, offset, shift, segments]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} material={material(color, finish)} receiveShadow dispose={null} />;
}
function Garden({
  x,
  z,
  rx,
  rz,
  angle = 0,
}: {
  x: number;
  z: number;
  rx: number;
  rz: number;
  angle?: number;
}) {
  const geometry = useMemo(() => {
    const vertices: number[] = [],
      indices: number[] = [];
    const n = 48,
      rings = 8;
    for (let i = 0; i <= rings; i++)
      for (let j = 0; j <= n; j++) {
        const a = (j / n) * Math.PI * 2,
          r = (i / rings) * (1 + 0.07 * Math.sin(a * 3));
        const dx = Math.cos(a) * rx * r,
          dz = Math.sin(a) * rz * r;
        const px = x + dx * Math.cos(angle) - dz * Math.sin(angle),
          pz = z + dx * Math.sin(angle) + dz * Math.cos(angle);
        vertices.push(px, heightAt(px, pz) + 0.055, pz);
        if (i < rings && j < n) {
          const k = i * (n + 1) + j;
          indices.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1);
        }
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [x, z, rx, rz, angle]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow material={material(T.garden)} dispose={null} />;
}
/** Place centrale pavée : bordure, rose des vents autour de la fontaine, carrés d'angle. */
function Plaza() {
  return (
    <group position={[0, 0.69, 0]}>
      <Box p={[0, 0, 0]} s={[16, 0.12, 12]} color={T.path} finish={FINISH.cobbles} />
      {[
        [0, 5.8, 16, 0.4],
        [0, -5.8, 16, 0.4],
        [7.8, 0, 0.4, 11.2],
        [-7.8, 0, 0.4, 11.2],
      ].map(([x, z, w, d], i) => (
        <Box key={i} p={[x, 0.07, z]} s={[w, 0.03, d]} color={C.stoneDark} finish={FINISH.stone} />
      ))}
      <Cylinder p={[0, 0.065, 0]} s={[5.4, 0.02, 5.4]} color={C.stoneDark} finish={FINISH.stone} />
      <Cylinder p={[0, 0.075, 0]} s={[5.0, 0.02, 5.0]} color={C.sand} finish={FINISH.cobbles} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        const long = i % 2 === 0;
        return (
          <Box
            key={i}
            p={[Math.sin(a) * (long ? 3.9 : 3.6), 0.09, Math.cos(a) * (long ? 3.9 : 3.6)]}
            s={[long ? 0.3 : 0.2, 0.02, long ? 2.2 : 1.6]}
            r={[0, a, 0]}
            color={long ? C.stoneDark : C.stone}
            finish={FINISH.stone}
          />
        );
      })}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <Box
            key={`${sx}${sz}`}
            p={[sx * 6.4, 0.075, sz * 4.4]}
            s={[1.4, 0.02, 1.4]}
            r={[0, Math.PI / 4, 0]}
            color={C.stoneDark}
            finish={FINISH.stone}
          />
        )),
      )}
    </group>
  );
}

/** Plaques d'égout sur la chaussée (world/decor.ts). */
function StreetDetails() {
  return (
    <>
      {manholes.map(([x, z]) => (
        <group key={`${x},${z}`} position={[x, heightAt(x, z) + 0.155, z]}>
          <Cylinder s={[0.4, 0.02, 0.4]} color={C.slate} finish={FINISH.steel} />
          <Fine>
            {[-0.18, 0, 0.18].map((dx) => (
              <Box key={dx} p={[dx, 0.012, 0]} s={[0.05, 0.01, 0.6]} color={C.ink} shadow={false} />
            ))}
          </Fine>
        </group>
      ))}
    </>
  );
}

/** Bordure de pierres autour d'une plate-bande (même contour que Garden). */
function Edging({ x, z, rx, rz, angle }: { x: number; z: number; rx: number; rz: number; angle: number }) {
  const n = 28;
  const point = (a: number) => {
    const r = 1 + 0.07 * Math.sin(a * 3);
    const dx = Math.cos(a) * rx * r;
    const dz = Math.sin(a) * rz * r;
    return [x + dx * Math.cos(angle) - dz * Math.sin(angle), z + dx * Math.sin(angle) + dz * Math.cos(angle)];
  };
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const [ax, az] = point((i / n) * Math.PI * 2);
        const [bx, bz] = point(((i + 1) / n) * Math.PI * 2);
        const [mx, mz] = [(ax + bx) / 2, (az + bz) / 2];
        // Pas de bordure posée sur une allée : la plate-bande s'arrête au dallage.
        if (pavementClearance(mx, mz) < 0.25) return null;
        return (
          <Box
            key={i}
            p={[mx, heightAt(mx, mz) + 0.1, mz]}
            s={[0.22, 0.16, Math.hypot(bx - ax, bz - az) + 0.05]}
            r={[0, Math.atan2(bx - ax, bz - az), 0]}
            color={C.stone}
            finish={FINISH.stone}
          />
        );
      })}
    </>
  );
}

/** Nombre de tranches du terrain, montées une par image pendant le chargement (voir World.tsx). */
export const TERRAIN_STAGES = 3;
export default function Terrain({ stage = TERRAIN_STAGES }: { stage?: number }) {
  return (
    <>
      {stage >= 1 && <TerrainMesh />}
      {stage >= 2 && <Island />}
      {stage >= 3 && (
        <StaticBatch>
          {gardens.map(([x, z, rx, rz, angle], i) => (
            <Garden key={i} {...{ x, z, rx, rz, angle }} />
          ))}
          {/* Rues dallées et bordures de pierre ; les bordures passent sous le dallage d'une rue qui croise. */}
          {streets.map((points, i) => (
            <group key={i}>
              <Path points={points} width={STREET_WIDTH} finish={FINISH.paving} />
              {[-1, 1].map((s) => (
                <Path
                  key={s}
                  points={points}
                  width={0.42}
                  shift={s * 3.0}
                  offset={0.13}
                  segments={1}
                  color={T.streetEdge}
                  finish={FINISH.stone}
                />
              ))}
            </group>
          ))}
          {approaches.map((points, i) => (
            <group key={i}>
              <Path points={points} width={APPROACH_WIDTH} finish={FINISH.paving} />
              {[-1, 1].map((s) => (
                <Path
                  key={s}
                  points={points}
                  width={0.3}
                  shift={s * 1.9}
                  offset={0.12}
                  segments={1}
                  color={T.streetEdge}
                  finish={FINISH.stone}
                />
              ))}
            </group>
          ))}
          <Plaza />
          <StreetDetails />
          {gardens.map(([x, z, rx, rz, angle], i) => (
            <Edging key={i} {...{ x, z, rx, rz, angle }} />
          ))}
        </StaticBatch>
      )}
    </>
  );
}
