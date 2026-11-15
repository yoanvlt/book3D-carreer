import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vec3 } from '../world/collision';
import { CAMERA } from '../world/config';
import { chooseCamera, moveCamera, chooseInteriorCamera, moveInteriorCamera, framing } from '../world/camera';
import { heightAt } from '../world/terrain';
import { getState, player, view, robotUi } from '../state';
import { FLIGHT, flightCamera, flightPose, type Path } from '../world/flight';
import { photo } from './photo';

/**
 * Vols (V8) : caméra de travelling de la timeline (world/flight.ts), raccordée au départ et à
 * l'arrivée par des fondus de position et de regard (aucun saut d'échelle).
 */
const rigPosition = new THREE.Vector3();
const rigTarget = new THREE.Vector3();
function flightView(fov: number) {
  const f = robotUi.flight;
  if (!f.path) return null;
  const pose = flightPose(f.path as Path, f.time, f.startYaw, f.endYaw);
  const view = flightCamera(pose, f.path as Path, fov);
  rigPosition.set(...view.position);
  rigTarget.set(...view.target);
  return {
    time: f.time,
    start: THREE.MathUtils.smoothstep(f.time, 0, 0.7),
    end: THREE.MathUtils.smoothstep(f.time, FLIGHT.total - 0.75, FLIGHT.total),
  };
}

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
    flightEnd: 0,
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
      // Retour : vue de ville → travelling → vue d'accueil.
      const distance = narrow ? 1.36 : 1;
      if (r.phase !== 'homing') {
        r.from.copy(camera.position);
        r.lookFrom.copy(r.look);
      }
      const v = flightView(narrow ? 48 : 41);
      const w = v ?? { start: 1, end: 1 };
      const homeView = new THREE.Vector3(
        CAMERA.aerial[0] * distance,
        CAMERA.aerial[1] * distance,
        CAMERA.aerial[2] * distance,
      );
      camera.position.copy(r.from).lerp(rigPosition, w.start).lerp(homeView, w.end);
      r.look
        .copy(r.lookFrom)
        .lerp(rigTarget, w.start)
        .lerp(new THREE.Vector3(0, 1, 0), w.end);
      camera.lookAt(r.look);
      // Focale du travelling (celle de l'accueil) tenue pendant tout le vol.
      perspective.fov = THREE.MathUtils.lerp(narrow ? 53 : 48, narrow ? 48 : 41, Math.max(w.start, w.end));
      r.offset = (narrow ? 0 : -size.width * CAMERA.homeOffset) * w.end;
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
        // Aller : vue d'accueil → travelling → vue de ville derrière le robot posé.
        if (r.phase !== 'entering') {
          r.from.copy(camera.position);
          r.lookFrom.copy(r.look);
        }
        const v = flightView(narrow ? 48 : 41);
        const w = v ?? { start: 1, end: 1 };
        camera.position.copy(r.from).lerp(rigPosition, w.start).lerp(r.safe, w.end);
        r.look.copy(r.lookFrom).lerp(rigTarget, w.start).lerp(r.aim, w.end);
        camera.position.y = Math.max(
          camera.position.y,
          heightAt(camera.position.x, camera.position.z) + CAMERA.clearance,
        );
        r.offset *= 1 - w.start;
        r.flightEnd = w.end;
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
      perspective.fov =
        s.phase === 'entering'
          ? THREE.MathUtils.lerp(narrow ? 48 : 41, narrow ? 53 : 48, r.flightEnd)
          : THREE.MathUtils.damp(perspective.fov, narrow ? 53 : 48, 3, dt);
    }
    perspective.setViewOffset(size.width, size.height, r.offset, 0, size.width, size.height);
    perspective.updateProjectionMatrix();
    r.phase = s.phase;
    r.teleport = player.teleport;
  }, -1);
  return null;
}
