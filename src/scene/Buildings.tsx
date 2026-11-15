import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SlidingDoor from './SlidingDoor';
import { batchMeshes } from './StaticBatch';
import { Box, Sign } from './Primitives';
import { Bevel } from './kit';
import { color as C, placeColor } from '../design/tokens';
import Portrait from './buildings/Profile';
import Innovation from './buildings/Innovation';
import Mechanism from './buildings/Mechanism';
import Discovery from './buildings/Discovery';
import Atelier from './buildings/Gallery';
import Veolia from './buildings/Veolia';
import { buildings, type Building } from '../world/config';
import { getState, player } from '../state';
import { place } from '../content';

/*
 * Les six bâtiments, en coordonnées locales : façade d'entrée vers +Z, porte en (0, 0, profondeur/2 + 0,5).
 * Les silhouettes et volumes de collision (config.ts) sont ceux de la V3 ; seuls les détails changent.
 */

/** Porte commune : encadrement, linteau à la couleur du lieu, porte coulissante animée. */
function Portal({ b }: { b: Building }) {
  return (
    <group position={[0, 0, b.size[1] / 2 + 0.5]}>
      <Box p={[0, 1.7, -0.12]} s={[2.9, 3.4, 0.22]} color={C.slate} />
      {[-1, 1].map((side) => (
        <Bevel key={side} p={[side * 1.65, 1.8, 0.2]} s={[0.3, 3.6, 1]} color={C.white} radius={0.08} />
      ))}
      <Bevel p={[0, 3.62, 0.25]} s={[3.6, 0.34, 1.1]} color={placeColor[b.id]} radius={0.08} />
      <group userData={{ dynamic: true }}>
        <SlidingDoor id={b.id} />
      </group>
      <Box p={[0, 0.05, 1.25]} s={[4, 0.1, 2.4]} color={C.white} />
    </group>
  );
}

/** Un fichier par bâtiment, dans src/scene/buildings/. */
const models = {
  profile: Portrait,
  'project-1': Innovation,
  'project-2': Mechanism,
  'project-3': Discovery,
  missions: Atelier,
  veolia: Veolia,
};

/**
 * Un bâtiment : socle, modèle, porte et totem. Les pièces statiques sont fusionnées par matériau ;
 * chaque maillage reçoit un matériau propre pour devenir transparent quand il cache le robot.
 */
function BuildingModel({ b }: { b: Building }) {
  const Model = models[b.id];
  const root = useRef<THREE.Group>(null!);
  const faded = useRef<THREE.MeshStandardMaterial[]>([]);
  const ray = useMemo(() => new THREE.Ray(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const bounds = useMemo(
    () =>
      new THREE.Box3(
        new THREE.Vector3(-b.size[0] / 2, -0.2, -b.size[1] / 2),
        new THREE.Vector3(b.size[0] / 2, b.height, b.size[1] / 2),
      ),
    [b],
  );
  useLayoutEffect(() => {
    const batch = batchMeshes(root.current);
    const owned: THREE.MeshStandardMaterial[] = [];
    const clones: THREE.MeshStandardMaterial[] = [];
    const originals = new Map<THREE.Mesh, THREE.Material>();
    root.current.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.visible) return;
      if (!(object.material instanceof THREE.MeshStandardMaterial)) return;
      // Panneaux et maillages regroupés ont déjà un matériau propre ; seuls les partagés sont clonés.
      if (object.material.map || object.userData.batched) {
        owned.push(object.material);
        return;
      }
      originals.set(object, object.material);
      const clone = object.material.clone();
      object.material = clone;
      owned.push(clone);
      clones.push(clone);
    });
    faded.current = owned;
    return () => {
      originals.forEach((m, mesh) => (mesh.material = m));
      clones.forEach((m) => m.dispose());
      faded.current = [];
      batch.restore();
    };
  }, []);
  useFrame(({ camera }, dt) => {
    const s = getState();
    let obscured = false;
    if (s.phase === 'explore' || s.phase === 'travel') {
      ray.origin.set(player.x, player.y + 1.6, player.z);
      root.current.worldToLocal(ray.origin);
      target.copy(camera.position);
      root.current.worldToLocal(target);
      const distance = ray.origin.distanceTo(target);
      ray.direction.subVectors(target, ray.origin).normalize();
      obscured = !!ray.intersectBox(bounds, hit) && hit.distanceTo(ray.origin) < distance;
    }
    for (const m of faded.current) {
      const alpha = THREE.MathUtils.damp(m.opacity, obscured ? 0.24 : 1, 7, dt);
      if (Math.abs(alpha - m.opacity) < 1e-4 && alpha === 1) continue;
      m.opacity = alpha;
      m.transparent = alpha < 0.99;
      m.depthWrite = alpha >= 0.99;
    }
  });
  const totem: [number, number, number] = [b.size[0] / 2 + 0.9, 0, b.size[1] / 2 + 1.4];
  return (
    <group ref={root} position={[b.position[0], b.elevation, b.position[1]]} rotation={[0, b.rotation, 0]}>
      {/* Socle en deux assises */}
      <Box p={[0, -0.25, 0]} s={[b.size[0] + 2.2, 0.5, b.size[1] + 2.2]} color={C.stoneDark} />
      <Box p={[0, -0.02, 0]} s={[b.size[0] + 1.8, 0.06, b.size[1] + 1.8]} color={C.stone} />
      <Model />
      <Portal b={b} />
      {/* Totem d'entrée au nom du lieu */}
      <group position={totem}>
        <Bevel p={[0, 1.1, 0]} s={[1.6, 2.2, 0.3]} color={placeColor[b.id]} radius={0.1} />
        <Sign text={place(b.id).titre} p={[0, 1.55, 0.16]} s={[1.45, 0.5]} color={C.ink} bg={C.white} />
      </group>
    </group>
  );
}

export default function Buildings() {
  return (
    <>
      {buildings.map((b) => (
        <BuildingModel key={b.id} b={b} />
      ))}
    </>
  );
}
