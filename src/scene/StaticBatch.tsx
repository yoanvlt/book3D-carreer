import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Fusionne les maillages statiques d'un sous-arbre par matériau : un bâtiment de plusieurs
 * centaines de pièces devient une quinzaine de draw calls. Les maillages d'origine restent
 * dans l'arbre React mais sont masqués. Sont exclus : les maillages instanciés, ceux dont
 * le matériau a une texture (panneaux) et tout ce qui est sous un objet userData.dynamic.
 *
 * `onBatched` reçoit les maillages créés (par exemple pour gérer leur transparence).
 */
export function batchMeshes(root: THREE.Object3D): { meshes: THREE.Mesh[]; restore: () => void } {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map<THREE.Material, { parts: THREE.BufferGeometry[]; cast: boolean }>();
  const hidden: THREE.Mesh[] = [];
  const visit = (object: THREE.Object3D) => {
    if (object.userData.dynamic || !object.visible) return;
    if (
      object instanceof THREE.Mesh &&
      !(object instanceof THREE.InstancedMesh) &&
      !Array.isArray(object.material) &&
      object.material instanceof THREE.MeshStandardMaterial &&
      !object.material.map
    ) {
      const source = object.geometry as THREE.BufferGeometry;
      const part = source.index ? source.toNonIndexed() : source.clone();
      for (const name of Object.keys(part.attributes))
        if (!['position', 'normal', 'uv'].includes(name)) part.deleteAttribute(name);
      if (!part.attributes.uv)
        part.setAttribute(
          'uv',
          new THREE.Float32BufferAttribute(new Float32Array(part.attributes.position.count * 2), 2),
        );
      part.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const group = groups.get(object.material) ?? { parts: [], cast: false };
      group.parts.push(part);
      group.cast ||= object.castShadow;
      groups.set(object.material, group);
      hidden.push(object);
    }
    for (const child of object.children) visit(child);
  };
  visit(root);
  const meshes: THREE.Mesh[] = [];
  for (const [material, { parts, cast }] of groups) {
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    mesh.userData.batched = true;
    root.add(mesh);
    meshes.push(mesh);
  }
  hidden.forEach((m) => (m.visible = false));
  return {
    meshes,
    restore: () => {
      for (const mesh of meshes) {
        root.remove(mesh);
        mesh.geometry.dispose();
      }
      hidden.forEach((m) => (m.visible = true));
    },
  };
}

/** Regroupe les maillages statiques de ses enfants (voir batchMeshes). */
export default function StaticBatch({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  useLayoutEffect(() => batchMeshes(ref.current).restore, []);
  return <group ref={ref}>{children}</group>;
}
