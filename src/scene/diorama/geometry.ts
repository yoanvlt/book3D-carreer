/**
 * Passage des données pures (geometry/) aux objets three.js : géométries avec lumière par sommet,
 * et lots d'exemplaires d'un modèle des kits (InstancedMesh) avec lumière par exemplaire.
 */
import * as THREE from 'three';
import type { MeshData } from '../../geometry/mesh';
import { dioramaMaterial, type DioramaKind } from './material';

/** Géométrie three.js d'un maillage ; `light` (soleil, occlusion) par sommet si fourni. */
export function toGeometry(data: MeshData, light?: Float32Array): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(data.uvs, 2));
  if (light) g.setAttribute('light', new THREE.BufferAttribute(light, 2));
  g.setIndex(new THREE.BufferAttribute(data.indices, 1));
  g.computeBoundingSphere();
  return g;
}

/** Maillage statique éclairé (bâtiment, île, terrain). */
export function staticMesh(data: MeshData, kind: DioramaKind, light?: Float32Array) {
  const mesh = new THREE.Mesh(toGeometry(data, light), dioramaMaterial(kind));
  mesh.matrixAutoUpdate = false;
  return mesh;
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  ry: number;
  /** Échelle uniforme, ou [x, y, z]. */
  scale?: number | [number, number, number];
  /** Lumière de l'exemplaire : soleil, occlusion (1, 1 par défaut). */
  light?: [number, number];
}

/**
 * Lot d'exemplaires d'un modèle : un seul appel de dessin. `ground` : lumière lue sous chaque
 * pixel (objets plats posés au sol : routes, dalles) au lieu de la lumière par exemplaire.
 */
export function instances(geometry: THREE.BufferGeometry, list: Placement[], ground = false) {
  const g = geometry.clone();
  const lights = new Float32Array(list.length * 2);
  list.forEach((p, i) => {
    lights[i * 2] = p.light?.[0] ?? 1;
    lights[i * 2 + 1] = p.light?.[1] ?? 1;
  });
  g.setAttribute('instanceLight', new THREE.InstancedBufferAttribute(lights, 2));
  const mesh = new THREE.InstancedMesh(g, dioramaMaterial(ground ? 'ground' : 'instanced'), list.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  list.forEach((p, i) => {
    const k = p.scale ?? 1;
    if (Array.isArray(k)) s.set(...k);
    else s.setScalar(k);
    m.compose(new THREE.Vector3(p.x, p.y, p.z), q.setFromAxisAngle(up, p.ry), s);
    mesh.setMatrixAt(i, m);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.matrixAutoUpdate = false;
  return mesh;
}
