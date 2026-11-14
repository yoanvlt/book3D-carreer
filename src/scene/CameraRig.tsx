import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { safeCameraRoute, sampleRoute, ease, mix3 } from '../world/cinematics';
import type { Vec3 } from '../world/collision';
import { CAMERA } from '../world/config';
import { chooseCamera, moveCamera, chooseInteriorCamera, moveInteriorCamera } from '../world/camera';
import { heightAt } from '../world/terrain';
import { getState, setState, player, view, finishArrival } from '../state';

export default function CameraRig() {
  const { camera, size } = useThree();
  const perspective = camera as THREE.PerspectiveCamera;
  const runtime = useRef({
    route: [] as Vec3[],
    phase: '',
    interior: null as string | null,
    chosenYaw: 0,
    teleport: 0,
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
    const dt = Math.min(delta, 0.05),
      r = runtime.current,
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
      const c = chooseCamera(r.target, view.yaw, view.pitch, view.distance, view.yaw);
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
      r.t += dt / (s.reducedMotion ? 0.001 : 2.5);
      const p = sampleRoute(r.route, r.t),
        aim = mix3(r.lookFrom, { x: 0, y: 1, z: 0 }, ease(r.t));
      camera.position.set(p.x, p.y, p.z);
      r.look.set(aim.x, aim.y, aim.z);
      camera.lookAt(r.look);
      perspective.fov = THREE.MathUtils.damp(perspective.fov, narrow ? 48 : 41, 3, dt);
      r.offset = (narrow ? 0 : -size.width * 0.16) * ease(r.t);
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
      r.offset = narrow ? 0 : -size.width * 0.16;
      perspective.fov = narrow ? 48 : 41;
    } else {
      r.target.set(player.x, player.y + CAMERA.targetHeight, player.z);
      r.aim.set(
        r.target.x - Math.sin(view.yaw) * CAMERA.lookAhead,
        r.target.y,
        r.target.z - Math.cos(view.yaw) * CAMERA.lookAhead,
      );
      r.desired.set(
        player.x + Math.sin(view.yaw) * view.distance * Math.cos(view.pitch),
        r.target.y + Math.sin(view.pitch) * view.distance,
        player.z + Math.cos(view.yaw) * view.distance * Math.cos(view.pitch),
      );
      const candidate = chooseCamera(r.target, view.yaw, view.pitch, view.distance, r.chosenYaw);
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
        r.t += dt / (s.reducedMotion ? 0.001 : 2.7);
        const t = Math.min(1, r.t),
          e = t * t * (3 - 2 * t);
        const pathPosition = sampleRoute(r.route, t);
        camera.position.set(pathPosition.x, pathPosition.y, pathPosition.z);
        r.look.lerpVectors(r.lookFrom, r.aim, e);
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
