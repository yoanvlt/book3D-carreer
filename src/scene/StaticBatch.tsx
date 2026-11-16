import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { useGame } from '../state';
import { PATTERNS, applySurface, type Pattern } from './surface';

/**
 * Fusionne les maillages statiques d'un sous-arbre. Couleur, matière procédurale, rugosité, métal
 * et lumière émise de chaque pièce sont recopiés sur ses sommets (attributs color, surface et
 * glowMetal, lus par surface.ts) : un bâtiment de plusieurs milliers de pièces devient deux à
 * quatre draw calls, un par combinaison de face (simple ou double), d'ombre portée et de niveau
 * de détail.
 *
 * Les maillages d'origine restent dans l'arbre React mais sont masqués. Sont exclus : les
 * maillages instanciés, ceux dont le matériau a une texture (panneaux), des couleurs de
 * sommets ou de la transparence (vitrines), les objets masqués et tout ce qui est sous un objet userData.dynamic.
 *
 * Les pièces placées sous <Fine> forment des maillages à part (userData.fine) : le bâtiment les
 * masque de loin, et la qualité Légère ne les construit pas (voir Fine).
 */
function batchMeshes(root: THREE.Object3D): { meshes: THREE.Mesh[]; restore: () => void } {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const groups = new Map<
    string,
    { parts: THREE.BufferGeometry[]; side: THREE.Side; cast: boolean; fine: boolean }
  >();
  const hidden: THREE.Mesh[] = [];
  const glow = new THREE.Color();
  const visit = (object: THREE.Object3D, fine: boolean) => {
    if (object.userData.dynamic || !object.visible) return;
    fine = fine || !!object.userData.fine;
    if (
      object instanceof THREE.Mesh &&
      !(object instanceof THREE.InstancedMesh) &&
      !Array.isArray(object.material) &&
      object.material instanceof THREE.MeshStandardMaterial &&
      !object.material.map &&
      !object.material.vertexColors &&
      !object.material.transparent
    ) {
      const m = object.material;
      const source = object.geometry as THREE.BufferGeometry;
      const part = source.index ? source.toNonIndexed() : source.clone();
      for (const name of Object.keys(part.attributes))
        if (!['position', 'normal', 'uv'].includes(name)) part.deleteAttribute(name);
      const count = part.attributes.position.count;
      if (!part.attributes.uv)
        part.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2));
      // Couleur (espace de travail linéaire), matière et lumière émise recopiées sur chaque sommet.
      const colors = new Float32Array(count * 3);
      const surface = new Float32Array(count * 3);
      const glowMetal = new Float32Array(count * 4);
      const pattern = PATTERNS[(m.userData.pattern as Pattern) ?? 'none'] ?? 0;
      glow.copy(m.emissive).multiplyScalar(m.emissiveIntensity);
      for (let i = 0; i < count; i++) {
        colors.set([m.color.r, m.color.g, m.color.b], i * 3);
        surface.set([pattern, m.roughness, m.userData.scale ?? 1], i * 3);
        glowMetal.set([glow.r, glow.g, glow.b, m.metalness], i * 4);
      }
      part.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      part.setAttribute('surface', new THREE.Float32BufferAttribute(surface, 3));
      part.setAttribute('glowMetal', new THREE.Float32BufferAttribute(glowMetal, 4));
      part.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, object.matrixWorld));
      const key = [m.side, object.castShadow, fine].join('|');
      const group = groups.get(key) ?? { parts: [], side: m.side, cast: object.castShadow, fine };
      group.parts.push(part);
      groups.set(key, group);
      hidden.push(object);
    }
    for (const child of object.children) visit(child, fine);
  };
  visit(root, false);
  const meshes: THREE.Mesh[] = [];
  for (const { parts, side, cast, fine } of groups.values()) {
    const merged = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    if (!merged) continue;
    merged.computeBoundingSphere();
    const material = applySurface(new THREE.MeshStandardMaterial({ vertexColors: true, side }));
    const mesh = new THREE.Mesh(merged, material);
    mesh.castShadow = cast;
    mesh.receiveShadow = true;
    mesh.userData.batched = true;
    mesh.userData.fine = fine;
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

/**
 * Petits détails, troisième niveau de lecture (visibles devant une porte) : absents en qualité
 * Légère, regroupés à part en qualité Soignée pour être masqués de loin.
 */
export function Fine({ children }: { children: ReactNode }) {
  const { quality } = useGame();
  if (quality === 'low') return null;
  return <group userData={{ fine: true }}>{children}</group>;
}

/** Regroupe les maillages statiques de ses enfants (voir batchMeshes). */
export default function StaticBatch({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!);
  const { quality } = useGame();
  // La qualité change le contenu (Fine) : le regroupement est refait.
  useLayoutEffect(() => batchMeshes(ref.current).restore, [quality]);
  return <group ref={ref}>{children}</group>;
}
