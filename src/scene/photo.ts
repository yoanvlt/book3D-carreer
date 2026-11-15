import * as THREE from 'three';
import { buildings } from '../world/config';

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
export const probe = {
  scene: null as THREE.Scene | null,
  renderer: null as THREE.WebGLRenderer | null,
  camera: null as THREE.Camera | null,
};

/**
 * Emprise de chaque bâtiment dans son repère local (x : largeur, z : profondeur, porte vers +z),
 * calculée sur tous les sommets de son maillage (V8 : construit en coordonnées du monde, ramené
 * dans le repère du bâtiment par sa position et sa rotation).
 */
export function measureFootprints(ids: string[]) {
  const scene = probe.scene;
  if (!scene) return [];
  return ids.flatMap((id) => {
    const mesh = scene.getObjectByName(`building-${id}`) as THREE.Mesh | undefined;
    const b = buildings.find((x) => x.id === id);
    if (!mesh?.geometry || !b) return [];
    const inverse = new THREE.Matrix4()
      .makeRotationY(b.rotation)
      .setPosition(b.position[0], 0, b.position[1])
      .invert();
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    const p = mesh.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(inverse));
    const round = (x: THREE.Vector3) => x.toArray().map((n) => +n.toFixed(2));
    return [{ id, min: round(box.min), max: round(box.max) }];
  });
}
