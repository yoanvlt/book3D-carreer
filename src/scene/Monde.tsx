/**
 * Monde statique (V8) : construit dans un worker (géométrie et lumière précalculée), modèles des
 * kits chargés en parallèle, puis monté en une fois. Peu d'appels de dessin : un maillage par
 * bâtiment, un pour le terrain, un pour l'île, un lot d'exemplaires par modèle des kits.
 * Les bâtiments deviennent transparents quand ils cachent le robot.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { buildings, doorPlane, type BuildingId } from '../world/config';
import { getState, player } from '../state';
import { place } from '../content';
import { loadingStep } from '../loading';
import { FOUNTAIN, FOUNTAIN_RADIUS } from '../world/plan';
import type { Model } from '../world/placer';
import type { WorldBuild } from '../geometry/monde';
import { loadKits, kitGeometry, type KitModel } from './diorama/kits';
import { ownMaterial, setGroundLight, SUN } from './diorama/material';
import { instances, staticMesh, toGeometry } from './diorama/geometry';
import { waterMaterial } from './diorama/water';
import { DoorLeaves } from './Door';
import { Sign } from './Primitives';

/** Modèles posés à plat (routes, dalles) : lumière lue sous chaque pixel. */
const FLAT = new Set<Model>(['route', 'route-passage', 'route-courbe', 'dalle']);

/** Enseigne de chaque lieu (repère local) : position et taille. */
const SIGNS: Record<BuildingId, [number, number, number, number, number]> = {
  profile: [0, 3.98, 5.03, 2.6, 0.42],
  missions: [0, 6.7, 6.02, 6, 0.6],
  'project-3': [0, 3.95, 6.66, 4, 0.42],
  'project-2': [0, 4.3, 6.52, 4, 0.55],
  veolia: [0, 6.6, 6.14, 5, 0.6],
  'project-1': [0, 4.0, 5.92, 5, 0.36],
};

/** Construction du monde dans le worker, avec la progression des étapes « monde » et « lumière ». */
function buildInWorker(): Promise<WorldBuild> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../geometry/monde.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      if (e.data.type === 'progress') loadingStep(e.data.step, e.data.fraction);
      else {
        resolve(e.data.world);
        worker.terminate();
      }
    };
    worker.onerror = reject;
    worker.postMessage({ sun: SUN });
  });
}

let pending: Promise<[WorldBuild, Map<string, THREE.BufferGeometry>]> | null = null;
/** Lancé une fois (et dès l'import du module) : worker et modèles en parallèle. */
export function prepareWorld() {
  pending ??= Promise.all([buildInWorker(), loadKits('ville', (f) => loadingStep('modeles', f))]);
  return pending;
}

function Building({ id, mesh }: { id: BuildingId; mesh: THREE.Mesh }) {
  const b = buildings.find((x) => x.id === id)!;
  const material = mesh.material as THREE.ShaderMaterial;
  const ray = useMemo(() => new THREE.Ray(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const box = useMemo(() => {
    const m = new THREE.Matrix4().makeRotationY(b.rotation).setPosition(b.position[0], 0, b.position[1]);
    const local = new THREE.Box3(
      new THREE.Vector3(-b.size[0] / 2, -0.2, -b.size[1] / 2),
      new THREE.Vector3(b.size[0] / 2, b.height, b.size[1] / 2),
    );
    return { inverse: m.clone().invert(), local };
  }, [b]);
  const origin = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, dt) => {
    const s = getState();
    let obscured = false;
    if (s.phase === 'explore' || s.phase === 'travel') {
      origin.set(player.x, player.y + 1.6, player.z).applyMatrix4(box.inverse);
      target.copy(camera.position).applyMatrix4(box.inverse);
      ray.origin.copy(origin);
      ray.direction.subVectors(target, origin).normalize();
      obscured = !!ray.intersectBox(box.local, hit) && hit.distanceTo(origin) < origin.distanceTo(target);
    }
    const opacity = THREE.MathUtils.damp(material.uniforms.opacity.value, obscured ? 0.25 : 1, 7, dt);
    material.uniforms.opacity.value = opacity > 0.995 ? 1 : opacity;
    material.transparent = opacity < 0.995;
    material.depthWrite = opacity >= 0.995;
  });
  const [sx, sy, sz, sw, sh] = SIGNS[id];
  const front = doorPlane(b);
  return (
    <>
      <primitive object={mesh} />
      <group position={[b.position[0], 0, b.position[1]]} rotation={[0, b.rotation, 0]}>
        <group position={[0, id === 'project-1' ? 0.25 : 0.02, front - (id === 'project-1' ? 0.22 : 0.55)]}>
          <DoorLeaves id={id} />
        </group>
        <Sign text={place(id).enseigne} p={[sx, sy, sz]} s={[sw, sh]} color='#3a4045' bg='#f6f3ed' />
      </group>
    </>
  );
}

/** Eau de la fontaine : bassin et vasque, animées ; éclaboussure quand le robot y entre. */
function FountainWater() {
  const splash = useRef(99);
  useFrame((_, dt) => {
    waterMaterial.uniforms.time.value += dt;
    const inside = Math.hypot(player.x - FOUNTAIN[0], player.z - FOUNTAIN[1]) < FOUNTAIN_RADIUS - 0.4;
    if (inside && player.speed > 0.5 && splash.current > 0.6) splash.current = 0;
    splash.current += dt;
    waterMaterial.uniforms.splash.value.set(player.x, player.z, splash.current);
  });
  return (
    <>
      <mesh material={waterMaterial} position={[FOUNTAIN[0], 0.55, FOUNTAIN[1]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[FOUNTAIN_RADIUS - 0.45, 40]} />
      </mesh>
      <mesh material={waterMaterial} position={[FOUNTAIN[0], 2.08, FOUNTAIN[1]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.25, 24]} />
      </mesh>
    </>
  );
}

interface Built {
  statics: THREE.Object3D[];
  buildings: { id: BuildingId; mesh: THREE.Mesh }[];
}

/** Le monde : monté quand le worker et les modèles sont prêts ; `onBuilt` après la création. */
export default function Monde({ onBuilt }: { onBuilt: () => void }) {
  const [built, setBuilt] = useState<Built | null>(null);
  useEffect(() => {
    let live = true;
    prepareWorld().then(([world]) => {
      if (!live) return;
      setGroundLight(world.ground.data, world.ground.size, world.ground.min, world.ground.extent);
      const statics: THREE.Object3D[] = [
        staticMesh(world.terrain, 'ground'),
        staticMesh(world.island.data, 'baked', world.island.light),
        staticMesh(world.fountain.data, 'baked', world.fountain.light),
      ];
      const feuillu = toGeometry(world.feuillu);
      for (const [model, list] of Object.entries(world.instances)) {
        if (!list?.length) continue;
        const geometry = model === 'feuillu' ? feuillu : kitGeometry(model as KitModel);
        statics.push(instances(geometry, list, FLAT.has(model as Model)));
      }
      const meshes = world.buildings.map((b) => {
        const mesh = new THREE.Mesh(toGeometry(b.data, b.light), ownMaterial('baked'));
        mesh.matrixAutoUpdate = false;
        mesh.name = `building-${b.id}`;
        return { id: b.id, mesh };
      });
      setBuilt({ statics, buildings: meshes });
    });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (built) onBuilt();
  }, [built, onBuilt]);
  if (!built) return null;
  return (
    <>
      {built.statics.map((o, i) => (
        <primitive key={i} object={o} />
      ))}
      {built.buildings.map((b) => (
        <Building key={b.id} id={b.id} mesh={b.mesh} />
      ))}
      <FountainWater />
    </>
  );
}
