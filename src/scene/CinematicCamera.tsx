import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getState, presentation, endPresentation, finishPresentation, skip } from '../state';
import { TIMING } from '../world/timing';
import { buildings } from '../world/config';
import { buildingShots, safeCameraRoute, sampleRoute, mix3, ease, type Shot } from '../world/cinematics';
import type { Vec3 } from '../world/collision';

/** Présentation courte : deux vues ; visite guidée : les quatre vues composées. */
const pick = (shots: Shot[]) => (presentation.full ? shots : [shots[1], shots[3]]);

export default function CinematicCamera() {
  const { camera, size } = useThree();
  const runtime = useRef({
    returnFov: 48,
    returnOffset: 0,
    savedFov: 48,
    savedOffset: 0,
    serial: -1,
    skip: skip.serial,
    phase: '',
    time: 0,
    aspect: 0,
    shots: [] as Shot[],
    routes: [] as Vec3[][],
    saved: null as Shot | null,
    returnFrom: null as Shot | null,
    returnRoute: [] as Vec3[],
    look: new THREE.Vector3(),
  });
  useFrame((_, delta) => {
    const skipped = runtime.current.skip !== skip.serial;
    runtime.current.skip = skip.serial;
    const s = getState();
    if (s.phase !== 'showcase' && s.phase !== 'returning') return;
    const r = runtime.current,
      b = buildings.find((b) => b.id === s.showcase)!;
    const aspect = size.width / size.height,
      pc = camera as THREE.PerspectiveCamera;
    if (r.serial !== presentation.serial) {
      r.savedFov = pc.fov;
      r.savedOffset = pc.view?.enabled ? pc.view.offsetX : 0;
      r.serial = presentation.serial;
      r.phase = '';
      r.time = 0;
      r.aspect = aspect;
      const direction = camera.getWorldDirection(new THREE.Vector3());
      r.look.copy(camera.position).addScaledVector(direction, 20);
      r.saved = { position: { ...camera.position }, target: { ...r.look } };
      r.shots = [r.saved, ...pick(buildingShots(b, aspect))];
      r.routes = r.shots.slice(1).map((shot, i) => safeCameraRoute(r.shots[i].position, shot.position));
    }
    if (r.phase !== s.phase) {
      r.time = 0;
      r.phase = s.phase;
      if (s.phase === 'returning') {
        r.returnFov = pc.fov;
        r.returnOffset = pc.view?.enabled ? pc.view.offsetX : 0;
        r.returnFrom = { position: { ...camera.position }, target: { ...r.look } };
        r.returnRoute = safeCameraRoute(r.returnFrom.position, r.saved!.position);
      }
    }
    r.time += Math.min(delta, 0.05);
    // Demande de passer pendant le retour : pose finale immédiate.
    if (skipped && s.phase === 'returning') r.time = TIMING.showcaseReturn;
    let position: Vec3, target: Vec3;
    if (s.phase === 'returning') {
      const t = s.reducedMotion ? 1 : Math.min(1, r.time / TIMING.showcaseReturn);
      position = sampleRoute(r.returnRoute, t);
      target = mix3(r.returnFrom!.target, r.saved!.target, ease(t));
      if (t >= 1) finishPresentation();
    } else if (s.reducedMotion) {
      const shot = buildingShots(b, aspect)[2];
      position = shot.position;
      target = shot.target;
    } else {
      if (aspect !== r.aspect) {
        // Reframe from the current pose on resize, never snap.
        r.aspect = aspect;
        r.time = 0;
        r.shots = [
          { position: { ...camera.position }, target: { ...r.look } },
          ...pick(buildingShots(b, aspect)),
        ];
        r.routes = r.shots.slice(1).map((shot, i) => safeCameraRoute(r.shots[i].position, shot.position));
      }
      const t = Math.min(1, r.time / presentation.duration) * r.routes.length,
        index = Math.min(r.routes.length - 1, Math.floor(t)),
        u = Math.min(1, t - index);
      position = sampleRoute(r.routes[index], u);
      target = mix3(r.shots[index].target, r.shots[index + 1].target, ease(u));
      if (t >= r.routes.length) endPresentation();
    }
    camera.position.set(position.x, position.y, position.z);
    r.look.set(target.x, target.y, target.z);
    camera.lookAt(r.look);
    const blend = s.reducedMotion
      ? 1
      : ease(
          s.phase === 'returning'
            ? r.time / TIMING.showcaseReturn
            : Math.min(r.time, presentation.duration * 0.4) / 1.2,
        );
    const offset =
      s.phase === 'returning'
        ? r.returnOffset + (r.savedOffset - r.returnOffset) * blend
        : r.savedOffset * (1 - blend);
    pc.setViewOffset(size.width, size.height, offset, 0, size.width, size.height);
    pc.fov =
      s.phase === 'returning'
        ? r.returnFov + (r.savedFov - r.returnFov) * blend
        : r.savedFov + (48 - r.savedFov) * blend;
    pc.updateProjectionMatrix();
  }, -1);
  return null;
}
