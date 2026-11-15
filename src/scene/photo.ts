import * as THREE from 'three';

/**
 * Mode photo des captures automatiques (`?debug=1` seulement) : la caméra quitte le robot et se
 * place exactement où le script le demande. Sans effet tant que `active` est faux.
 */
export const photo = {
  active: false,
  position: [0, 0, 0] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
  fov: 40,
};

/** Scène courante, pour les relevés de `?debug=1` (emprise réelle des bâtiments). */
export const probe = { scene: null as THREE.Scene | null };

/**
 * Emprise de chaque bâtiment dans son repère local (x : largeur, z : profondeur, porte vers +z),
 * calculée sur la géométrie de toutes ses pièces d'origine. Les objets marqués userData.outside
 * (totem, parvis) et les maillages regroupés (copies des pièces) sont ignorés.
 */
export function measureFootprints(ids: string[]) {
  const scene = probe.scene;
  if (!scene) return [];
  return ids.flatMap((id) => {
    const root = scene.getObjectByName(`building-${id}`);
    if (!root) return [];
    root.updateWorldMatrix(true, true);
    const inverse = root.matrixWorld.clone().invert();
    const box = new THREE.Box3();
    const part = new THREE.Box3();
    const visit = (o: THREE.Object3D) => {
      if (o.userData.outside) return;
      if (o instanceof THREE.Mesh && !o.userData.batched && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        part
          .copy(o.geometry.boundingBox!)
          .applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
        box.union(part);
      }
      o.children.forEach(visit);
    };
    visit(root);
    const round = (v: THREE.Vector3) => v.toArray().map((n) => +n.toFixed(2));
    return [{ id, min: round(box.min), max: round(box.max) }];
  });
}
