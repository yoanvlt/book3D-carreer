import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { safeCameraRoute, sampleRoute, ease, mix3 } from '../world/cinematics';
import type { Vec3 } from '../world/collision';
import { CAMERA } from '../world/config';
import { chooseCamera, moveCamera, chooseInteriorCamera, moveInteriorCamera, framing } from '../world/camera';
import { heightAt } from '../world/terrain';
import { getState, setState, player, view, finishArrival, skip, robotUi } from '../state';
import { FLIGHT } from '../world/flight';
import { photo } from './photo';

/**
 * Poursuite du robot pendant les vols : la caméra se place derrière lui, un peu au-dessus (poids
 * `weight`), et le regarde (poids `lookWeight`, qui peut durer plus longtemps).
 */
const CHASE = { back: 8, up: 3.5 };
const chasePoint = new THREE.Vector3();
const chaseLook = new THREE.Vector3();
function chase(weight: number, lookWeight: number, position: THREE.Vector3, look: THREE.Vector3) {
  if (lookWeight <= 0) return;
  const [x, y, z] = robotUi.position;
  const h = robotUi.heading;
  chasePoint.set(x - Math.sin(h) * CHASE.back, y + CHASE.up, z - Math.cos(h) * CHASE.back);
  position.lerp(chasePoint, weight);
  // Mélange des directions (pas des points) : un point visé lointain ne doit pas sortir le robot du cadre.
  chaseLook.copy(look).sub(position).normalize();
  chasePoint
    .set(x, y + 1.2, z)
    .sub(position)
    .normalize();
  chaseLook.lerp(chasePoint, lookWeight).normalize();
  look.copy(position).addScaledVector(chaseLook, 10);
}
/** Poids de la poursuite : monte jusqu'à `rise`, tient, puis rend la main à partir de `release`. */
const chaseWeight = (t: number, rise: number, release: number) =>
  THREE.MathUtils.smoothstep(t, 0, rise) * (1 - THREE.MathUtils.smoothstep(t, release, 1));

export default function CameraRig() {
  const { camera, size } = useThree();
  const perspective = camera as THREE.PerspectiveCamera;
  const runtime = useRef({
    route: [] as Vec3[],
    phase: '',
    interior: null as string | null,
    chosenYaw: 0,
    teleport: 0,
    skip: 0,
    t: 0,
    offset: 0,
    from: new THREE.Vector3(),
    lookFrom: new THREE.Vector3(),
    look: new THREE.Vector3(),
    aim: new THREE.Vector3(),
    desired: new THREE.Vector3(),
    target: new THREE.Vector3(),
    safe: new THREE.Vector3(),
  });
  useFrame((_, delta) => {
    if (photo.active) {
      camera.position.set(...photo.position);
      camera.lookAt(...photo.target);
      perspective.clearViewOffset();
      perspective.fov = photo.fov;
      perspective.updateProjectionMatrix();
      return;
    }
    // Une demande de passer n'est valable que pour la séquence en cours.
    const skipped = runtime.current.skip !== skip.serial;
    runtime.current.skip = skip.serial;
    const dt = Math.min(delta, 0.05),
      r = runtime.current,
      // Cadrage portrait réglé ici, à chaque image, selon le format réel de l'écran.
      frame = framing(size.width / size.height, view.distance, view.pitch),
      s = getState();
    const narrow = size.width < 760;
    if (s.phase === 'showcase' || s.phase === 'returning') {
      r.phase = s.phase;
      return;
    }
    view.movementYaw = Math.atan2(camera.position.x - player.x, camera.position.z - player.z);
    if (s.interior) {
      const candidate = chooseInteriorCamera(player.x, player.z, view.yaw, r.chosenYaw);
      r.chosenYaw = candidate.yaw;
      r.target.set(player.x, 1.65, player.z);
      r.desired.set(candidate.x, candidate.y, candidate.z);
      if (r.interior !== s.interior || r.teleport !== player.teleport) {
        camera.position.copy(r.desired);
        r.look.copy(r.target);
      } else {
        const next = moveInteriorCamera(camera.position, r.desired, r.target, dt);
        camera.position.set(next.x, next.y, next.z);
        r.look.lerp(r.target, 1 - Math.exp(-6 * dt));
      }
      camera.lookAt(r.look);
      perspective.clearViewOffset();
      perspective.fov = narrow ? 64 : 60;
      perspective.updateProjectionMatrix();
      r.interior = s.interior;
      r.teleport = player.teleport;
      r.phase = s.phase;
      return;
    }
    if (r.interior) {
      r.interior = null;
      r.target.set(player.x, player.y + 1.65, player.z);
      const c = chooseCamera(r.target, view.yaw, frame.pitch, frame.distance, view.yaw);
      camera.position.set(c.point.x, c.point.y, c.point.z);
      r.look.copy(r.target);
    }
    if (s.phase === 'homing') {
      const distance = narrow ? 1.36 : 1;
      const end = {
        x: CAMERA.aerial[0] * distance,
        y: CAMERA.aerial[1] * distance,
        z: CAMERA.aerial[2] * distance,
      };
      if (r.phase !== 'homing') {
        r.t = 0;
        r.from.copy(camera.position);
        r.lookFrom.copy(r.look);
        r.route = safeCameraRoute(r.from, end);
      }
      r.t = Math.min(1, r.t + dt / (s.reducedMotion ? 0.001 : FLIGHT.total));
      if (skipped) r.t = 1;
      if (robotUi.hold !== null) r.t = robotUi.hold;
      // La caméra suit le robot qui remonte, puis se cale sur la vue d'accueil.
      const p = sampleRoute(r.route, r.t),
        aim = mix3(r.lookFrom, { x: 0, y: 1, z: 0 }, ease(r.t));
      camera.position.set(p.x, p.y, p.z);
      r.look.set(aim.x, aim.y, aim.z);
      // Le regard reste sur le robot presque jusqu'au bout : à l'arrivée, il est déjà dans la vue d'accueil.
      chase(chaseWeight(r.t, 0.2, 0.6), chaseWeight(r.t, 0.15, 0.92), camera.position, r.look);
      camera.position.y = Math.max(
        camera.position.y,
        heightAt(camera.position.x, camera.position.z) + CAMERA.clearance,
      );
      camera.lookAt(r.look);
      perspective.fov = THREE.MathUtils.damp(perspective.fov, narrow ? 48 : 41, 3, dt);
      r.offset = (narrow ? 0 : -size.width * CAMERA.homeOffset) * ease(r.t);
      if (r.t >= 1) setState({ phase: 'home' });
    } else if (s.phase === 'home') {
      const drift = 0;
      const distance = narrow ? 1.36 : 1;
      camera.position.set(
        (CAMERA.aerial[0] + drift) * distance,
        CAMERA.aerial[1] * distance,
        CAMERA.aerial[2] * distance,
      );
      r.look.set(0, 1, 0);
      camera.lookAt(r.look);
      r.offset = narrow ? 0 : -size.width * CAMERA.homeOffset;
      perspective.fov = narrow ? 48 : 41;
    } else {
      r.target.set(player.x, player.y + CAMERA.targetHeight, player.z);
      r.aim.set(
        r.target.x - Math.sin(view.yaw) * CAMERA.lookAhead,
        r.target.y,
        r.target.z - Math.cos(view.yaw) * CAMERA.lookAhead,
      );
      r.desired.set(
        player.x + Math.sin(view.yaw) * frame.distance * Math.cos(frame.pitch),
        r.target.y + Math.sin(frame.pitch) * frame.distance,
        player.z + Math.cos(view.yaw) * frame.distance * Math.cos(frame.pitch),
      );
      const candidate = chooseCamera(r.target, view.yaw, frame.pitch, frame.distance, r.chosenYaw);
      r.chosenYaw = candidate.yaw;
      r.safe.set(candidate.point.x, candidate.point.y, candidate.point.z);
      if (s.phase === 'explore' && r.teleport !== player.teleport) {
        camera.position.copy(r.safe);
        r.look.copy(r.target);
      }
      if (s.phase === 'entering') {
        if (r.phase !== 'entering' || r.teleport !== player.teleport) {
          r.t = 0;
          r.from.copy(camera.position);
          r.lookFrom.copy(r.look);
          if (r.teleport !== player.teleport) {
            r.from.copy(r.safe).add(new THREE.Vector3(0, 23, 0));
            r.lookFrom.copy(r.aim);
            r.offset = 0;
          }
        }
        if (r.t === 0) r.route = safeCameraRoute(r.from, r.safe);
        r.t += dt / (s.reducedMotion ? 0.001 : FLIGHT.total);
        if (skipped) r.t = 1;
        if (robotUi.hold !== null) r.t = robotUi.hold;
        const t = Math.min(1, r.t),
          e = t * t * (3 - 2 * t);
        const pathPosition = sampleRoute(r.route, t);
        camera.position.set(pathPosition.x, pathPosition.y, pathPosition.z);
        r.look.lerpVectors(r.lookFrom, r.aim, e);
        // Pendant le vol, la caméra plonge derrière le robot et le suit jusqu'à la place.
        if (r.teleport === player.teleport)
          chase(chaseWeight(t, 0.25, 0.7), chaseWeight(t, 0.2, 0.85), camera.position, r.look);
        // An elevated arc clears roofs during descent and destination transitions.
        // The route is swept against terrain and building collision volumes.
        camera.position.y = Math.max(
          camera.position.y,
          heightAt(camera.position.x, camera.position.z) + CAMERA.clearance,
        );
        r.offset *= 1 - Math.min(0.3, dt * 3);
        if (t >= 1) {
          r.offset = 0;
          finishArrival();
        }
      } else {
        const smooth = 1 - Math.exp(-CAMERA.stiffness * dt);
        r.look.lerp(r.target, smooth);
        r.desired.copy(camera.position).lerp(r.safe, smooth);
        const moved = moveCamera(camera.position, r.desired);
        camera.position.set(moved.x, moved.y, moved.z);
        // Resolve after interpolation too: smoothing must never pull the camera through a wall.
        r.offset = 0;
      }
      camera.lookAt(r.look);
      perspective.fov = THREE.MathUtils.damp(perspective.fov, narrow ? 53 : 48, 3, dt);
    }
    perspective.setViewOffset(size.width, size.height, r.offset, 0, size.width, size.height);
    perspective.updateProjectionMatrix();
    r.phase = s.phase;
    r.teleport = player.teleport;
  }, -1);
  return null;
}
