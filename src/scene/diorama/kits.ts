/**
 * Modèles des kits (V8), produits par scripts/kits.mjs : un GLB compressé (meshopt, quantifié)
 * par lot. Le monde (ville.glb) est chargé au démarrage, avec la progression réelle des octets
 * reçus ; le mobilier (meubles.glb) seulement à l'entrée du premier lieu.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import catalogue from '../../world/catalogue.json';

export type KitBatch = keyof typeof catalogue;
export type KitModel = keyof (typeof catalogue)['ville'] | keyof (typeof catalogue)['meubles'];

const loaded = new Map<KitBatch, Promise<Map<string, THREE.BufferGeometry>>>();
const ready = new Map<string, THREE.BufferGeometry>();

/**
 * Charge un lot de modèles ; `progress` reçoit la part reçue (0 à 1). Les géométries sont
 * dénormalisées (quantification levée) pour être instanciées avec la matière diorama.
 */
export function loadKits(batch: KitBatch, progress?: (fraction: number) => void) {
  const pending = loaded.get(batch);
  if (pending) return pending;
  const promise = new Promise<Map<string, THREE.BufferGeometry>>((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      `${import.meta.env.BASE_URL}modeles/${batch}.glb`,
      (gltf) => {
        const map = new Map<string, THREE.BufferGeometry>();
        gltf.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (!mesh.isMesh) return;
          // Attributs quantifiés convertis en flottants d'abord, puis matrice du nœud appliquée
          // (la quantification range l'échelle et le décalage des positions dans le nœud).
          const geometry = mesh.geometry.clone();
          for (const name of ['position', 'normal', 'uv'])
            if (geometry.getAttribute(name)) {
              const attribute = geometry.getAttribute(name) as THREE.BufferAttribute;
              if (attribute.normalized || !(attribute.array instanceof Float32Array))
                geometry.setAttribute(name, toFloat(attribute));
            }
          mesh.updateWorldMatrix(true, false);
          geometry.applyMatrix4(mesh.matrixWorld);
          geometry.computeBoundingSphere();
          map.set(mesh.name || o.parent?.name || '', geometry);
          ready.set(mesh.name || o.parent?.name || '', geometry);
        });
        progress?.(1);
        resolve(map);
      },
      (event) => {
        if (event.lengthComputable && event.total) progress?.(Math.min(0.99, event.loaded / event.total));
      },
      reject,
    );
  });
  loaded.set(batch, promise);
  return promise;
}

function toFloat(attribute: THREE.BufferAttribute) {
  const out = new Float32Array(attribute.count * attribute.itemSize);
  for (let i = 0; i < attribute.count; i++)
    for (let k = 0; k < attribute.itemSize; k++)
      out[i * attribute.itemSize + k] = attribute.getComponent(i, k);
  return new THREE.BufferAttribute(out, attribute.itemSize);
}

/** Géométrie d'un modèle déjà chargé. */
export function kitGeometry(name: KitModel): THREE.BufferGeometry {
  const geometry = ready.get(name);
  if (!geometry) throw new Error(`Modèle non chargé : ${name}`);
  return geometry;
}
