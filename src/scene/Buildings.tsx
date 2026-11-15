import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import SlidingDoor from './SlidingDoor';
import { batchMeshes, Fine } from './StaticBatch';
import { Beam, Box, FINISH, Sign } from './Primitives';
import { Bevel } from './kit';
import { color as C, scenePlaceColor } from '../design/tokens';
import Portrait from './buildings/Profile';
import Innovation from './buildings/Innovation';
import Mechanism from './buildings/Mechanism';
import Discovery from './buildings/Discovery';
import Atelier from './buildings/Gallery';
import Veolia from './buildings/Veolia';
import { buildings, type Building } from '../world/config';
import { getState, player, useGame } from '../state';
import { place } from '../content';

/*
 * Les six bâtiments, en coordonnées locales : façade d'entrée vers +Z, porte en (0, 0, profondeur/2 + 0,5).
 * Les silhouettes et volumes de collision (config.ts) sont ceux de la V3 ; seuls les détails changent.
 */

/** Porte commune : encadrement, linteau à la couleur du lieu, porte coulissante animée. */
function Portal({ b }: { b: Building }) {
  const accent = scenePlaceColor[b.id];
  return (
    <group position={[0, 0, b.size[1] / 2 + 0.5]}>
      {/* Embrasure : fond sombre jusqu'à la façade, piédroits et linteau. */}
      <Box p={[0, 1.75, -0.45]} s={[3.5, 3.5, 0.9]} color={C.slate} />
      {[-1, 1].map((side) => (
        <Bevel key={side} p={[side * 1.62, 1.8, -0.1]} s={[0.34, 3.6, 1.1]} color={C.white} radius={0.06} />
      ))}
      <Bevel p={[0, 3.66, -0.1]} s={[3.6, 0.32, 1.1]} color={C.white} radius={0.06} />
      {/* Marquise à la couleur du lieu, filet lumineux en sous-face. */}
      <Box p={[0, 3.92, 0.55]} s={[4.2, 0.16, 2.2]} color={accent} finish={FINISH.paint} />
      <Box
        p={[0, 3.82, 1.62]}
        s={[4.1, 0.05, 0.05]}
        color={C.lamp}
        finish={{ glow: C.lamp, glowIntensity: 0.9 }}
        shadow={false}
      />
      <group userData={{ dynamic: true }}>
        <SlidingDoor id={b.id} />
      </group>
      {/* Seuil de pierre */}
      <Box p={[0, 0.05, 0.75]} s={[4, 0.1, 1.9]} color={C.stone} finish={FINISH.stone} />
      <Fine>
        {[-1, 1].map((side) => (
          <Beam
            key={side}
            a={[side * 1.9, 2.9, -0.5]}
            b={[side * 1.9, 3.84, 1.3]}
            width={0.06}
            color={C.ink}
          />
        ))}
        <Box
          p={[0, 0.115, 0.85]}
          s={[2.2, 0.03, 0.9]}
          color={C.slate}
          finish={FINISH.fabric}
          shadow={false}
        />
        <Sign
          text={b.number}
          p={[1.62, 2.5, 0.47]}
          s={[0.28, 0.24]}
          color={C.white}
          bg={C.ink}
          rounded={false}
        />
      </Fine>
    </group>
  );
}

/** Distance de la caméra en deçà de laquelle les petits détails (Fine) d'un bâtiment sont dessinés. */
const FINE_DISTANCE = 48;

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
  const fine = useRef<THREE.Mesh[]>([]);
  const { quality } = useGame();
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
    fine.current = batch.meshes.filter((m) => m.userData.fine);
    return () => {
      originals.forEach((m, mesh) => (mesh.material = m));
      clones.forEach((m) => m.dispose());
      faded.current = [];
      batch.restore();
    };
  }, [quality]);
  useFrame(({ camera }, dt) => {
    const s = getState();
    // Troisième niveau de détail : seulement à portée de la porte.
    const near =
      Math.hypot(camera.position.x - b.position[0], camera.position.z - b.position[1]) < FINE_DISTANCE;
    for (const mesh of fine.current) mesh.visible = near;
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
      // Un verre clair garde sa propre opacité, multipliée par le fondu.
      const base = (m.userData.baseOpacity as number | undefined) ?? 1;
      const target = (obscured ? 0.24 : 1) * base;
      const alpha = THREE.MathUtils.damp(m.opacity, target, 7, dt);
      if (Math.abs(alpha - target) < 1e-4 && !obscured) {
        if (m.opacity === target) continue;
      }
      m.opacity = Math.abs(alpha - target) < 1e-4 ? target : alpha;
      m.transparent = m.opacity < 0.99;
      m.depthWrite = m.opacity >= 0.99;
    }
  });
  const totem: [number, number, number] = [b.size[0] / 2 + 0.9, 0, b.size[1] / 2 + 1.4];
  return (
    <group ref={root} position={[b.position[0], b.elevation, b.position[1]]} rotation={[0, b.rotation, 0]}>
      {/* Socle en deux assises */}
      <Box p={[0, -0.25, 0]} s={[b.size[0] + 2.2, 0.5, b.size[1] + 2.2]} color={C.stoneDark} />
      <Box
        p={[0, -0.02, 0]}
        s={[b.size[0] + 1.8, 0.06, b.size[1] + 1.8]}
        color={C.stone}
        finish={FINISH.paving}
      />
      <Model />
      <Portal b={b} />
      {/* Totem d'entrée au nom du lieu */}
      <group position={totem}>
        <Box p={[0, 0.15, 0]} s={[1.9, 0.3, 0.6]} color={C.stoneDark} finish={FINISH.stone} />
        <Bevel p={[0, 1.25, 0]} s={[1.6, 2.1, 0.3]} color={scenePlaceColor[b.id]} radius={0.1} />
        <Box p={[0, 2.36, 0]} s={[1.75, 0.1, 0.42]} color={C.ink} />
        <Sign text={place(b.id).titre} p={[0, 1.7, 0.16]} s={[1.45, 0.5]} color={C.ink} bg={C.white} />
        <Fine>
          <Box
            p={[0, 2.3, 0.2]}
            s={[1.3, 0.04, 0.06]}
            color={C.lamp}
            finish={{ glow: C.lamp, glowIntensity: 1 }}
            shadow={false}
          />
        </Fine>
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
