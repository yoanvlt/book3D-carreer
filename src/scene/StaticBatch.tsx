import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Fusionne les maillages statiques d'un sous-arbre par type de finition (rugosité, métal,
 * émission, face, ombre portée). La couleur de chaque pièce est conservée dans les sommets :
 * un bâtiment de plusieurs centaines de pièces devient cinq ou six draw calls.
 *
 * Les maillages d'origine restent dans l'arbre React mais sont masqués. Sont exclus : les
 * maillages instanciés, ceux dont le matériau a une texture (panneaux) ou des couleurs de
 * sommets, les objets masqués et tout ce qui est sous un objet userData.dynamic.
 */
export function batchMeshes(root: THREE.Object3D): { meshes: THREE.Mesh[]; restore: () => void } {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map<
    string,
    { parts: THREE.BufferGeometry[]; source: THREE.MeshStandardMaterial; cast: boolean }
  >();
  const hidden: THREE.Mesh[] = [];
  const visit = (object: THREE.Object3D) => {
    if (object.userData.dynamic || !object.visible) return;
    if (
      object instanceof THREE.Mesh &&
      !(object instanceof THREE.InstancedMesh) &&
      !Array.isArray(object.material) &&
      object.material instanceof THREE.MeshStandardMaterial &&
      !object.material.map &&
      !object.material.vertexColors
    ) {
      const m = object.material;
      const source = object.geometry as THREE.BufferGeometry;
      const part = source.index ? source.toNonIndexed() : source.clone();
      for (const name of Object.keys(part.attributes))
        if (!['position', 'normal', 'uv'].includes(name)) part.deleteAttribute(name);
      const count = part.attributes.position.count;
      if (!part.attributes.uv)
        part.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
      // Couleur du matériau (espace de travail linéaire) recopiée sur chaque sommet.
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) colors.set([m.color.r, m.color.g, m.color.b], i * 3);
      part.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      part.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const key = [
        m.roughness,
        m.metalness,
        m.emissive.getHexString(),
        m.emissiveIntensity,
        m.side,
        object.castShadow,
      ].join('|');
      const group = groups.get(key) ?? { parts: [], source: m, cast: object.castShadow };
      group.parts.push(part);
      groups.set(key, group);
      hidden.push(object);
    }
    for (const child of object.children) visit(child);
  };
  visit(root);
  const meshes: THREE.Mesh[] = [];
  for (const { parts, source, cast } of groups.values()) {
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: source.roughness,
      metalness: source.metalness,
      emissive: source.emissive,
      emissiveIntensity: source.emissiveIntensity,
      side: source.side,
    });
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
        (mesh.material as THREE.Material).dispose();
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
