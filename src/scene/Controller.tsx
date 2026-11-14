import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getState,
  setState,
  player,
  view,
  journey,
  interact,
  resetPlayer,
  showPanel,
  discover,
  endPresentation,
  cancelJourney,
  travel,
  walkTo,
  stopTour,
} from '../state';
import { moveIndoors, stationAt } from '../world/narrative';
import { WORLD, CAMERA, buildings, entrance } from '../world/config';
import { heightAt } from '../world/terrain';
import { moveWithCollisions } from '../world/collision';
import { skipCurrent } from '../world/motion';
import { JUMP, actions, combineInput, desiredVelocity, groundHit, stepJump } from '../world/controls';

const MOVE_KEYS = ['w', 'z', 'a', 'q', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
const overlay = () => {
  const s = getState();
  return !!(s.map || s.detail || s.reading || s.help);
};

/**
 * Entrées du visiteur : clavier, souris et toucher. Le clavier et le joystick alimentent le même
 * vecteur d'entrée (world/controls.ts). Un appui court sur la scène fait marcher jusqu'au point
 * touché ; un glisser tourne la caméra ; pendant une séquence automatique, il la passe.
 */
export default function Controller() {
  const keys = useRef(new Set<string>()),
    nearTimer = useRef(0),
    velocity = useRef({ x: 0, z: 0 }),
    jumps = useRef(actions.jump);
  const { gl, camera } = useThree();
  useEffect(() => {
    const held = keys.current;
    function down(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && e.target.closest('select,input,textarea,[role="dialog"]'))
        return;
      if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.closest('button')) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (e.repeat) return;
      const state = getState();
      if (k === 'm') {
        showPanel('map');
        held.clear();
        return;
      }
      if (k === 'escape') {
        stopTour();
        endPresentation();
        cancelJourney();
        setState({ map: false, help: false, detail: null, reading: null });
        held.clear();
        return;
      }
      // Pendant une séquence automatique, Espace, Entrée ou E la termine.
      if ([' ', 'enter', 'e'].includes(k) && skipCurrent()) {
        held.clear();
        return;
      }
      if (state.phase !== 'explore' || overlay()) return;
      if (k === ' ') {
        actions.jump++;
        return;
      }
      if (k === 'v' && state.nearby) {
        discover(state.nearby);
        return;
      }
      if (k === 'e' || k === 'enter') {
        interact();
        return;
      }
      if (k === 'r') {
        resetPlayer();
        return;
      }
      if (k === 'c') {
        view.yaw = player.angle - Math.PI;
        view.pitch = CAMERA.elevation;
        return;
      }
      held.add(k);
      if (!state.moved && MOVE_KEYS.includes(k)) window.setTimeout(() => setState({ moved: true }), 1500);
    }
    const up = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
    // Un appui devient un glisser (rotation de caméra) au-delà de 8 px, sinon un toucher.
    let press: {
      id: number;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      time: number;
      drag: boolean;
    } | null = null;
    const clear = () => {
      held.clear();
      player.speed = 0;
      velocity.current = { x: 0, z: 0 };
      press = null;
    };
    const start = (e: PointerEvent) => {
      const s = getState();
      if (overlay()) return;
      // Un nouveau toucher pendant une marche « toucher pour aller » la redirige au lieu de la passer.
      const tapWalk = s.phase === 'travel' && !journey.destination;
      if (!tapWalk && skipCurrent()) return;
      if (s.phase !== 'explore' && !tapWalk) return;
      press = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        time: performance.now(),
        drag: false,
      };
      gl.domElement.setPointerCapture(e.pointerId);
    };
    const drag = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      if (!press.drag && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) press.drag = true;
      if (!press.drag || getState().phase !== 'explore') return;
      view.yaw -= (e.clientX - press.lastX) * 0.005;
      view.pitch = Math.max(
        CAMERA.minElevation,
        Math.min(CAMERA.maxElevation, view.pitch + (e.clientY - press.lastY) * 0.003),
      );
      press.lastX = e.clientX;
      press.lastY = e.clientY;
    };
    const end = (e: PointerEvent) => {
      const p = press;
      press = null;
      if (!p || p.drag || e.type === 'pointercancel' || performance.now() - p.time > 500 || overlay()) return;
      // Toucher : point du sol (ou bâtiment) sous le doigt.
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, camera);
      const hit = groundHit(ray.ray.origin, ray.ray.direction, !!getState().interior);
      if (!hit) return;
      // Différé d'une tâche : un clic sur le poteau indicateur ouvre le plan, on ne marche pas alors.
      window.setTimeout(() => {
        if (overlay()) return;
        if (hit.building) {
          if (getState().phase === 'travel') cancelJourney();
          travel(hit.building);
        } else walkTo(hit.point);
        if (!getState().moved) setState({ moved: true });
      }, 0);
    };
    const wheel = (e: WheelEvent) => {
      if (getState().phase === 'explore' && !overlay()) {
        e.preventDefault();
        view.distance = Math.max(
          CAMERA.minDistance,
          Math.min(CAMERA.maxDistance, view.distance + e.deltaY * 0.008),
        );
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    gl.domElement.addEventListener('pointerdown', start);
    gl.domElement.addEventListener('pointermove', drag);
    gl.domElement.addEventListener('pointerup', end);
    gl.domElement.addEventListener('pointercancel', end);
    gl.domElement.addEventListener('wheel', wheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
      gl.domElement.removeEventListener('pointerdown', start);
      gl.domElement.removeEventListener('pointermove', drag);
      gl.domElement.removeEventListener('pointerup', end);
      gl.domElement.removeEventListener('pointercancel', end);
      gl.domElement.removeEventListener('wheel', wheel);
    };
  }, [gl, camera]);
  useFrame((_, delta) => {
    const dt = Math.max(0.001, Math.min(delta, 0.05)),
      state = getState();
    stepJump(player.jump, dt);
    if (state.phase !== 'explore' || overlay()) {
      keys.current.clear();
      if (!['travel', 'doorway', 'showcase', 'returning'].includes(state.phase)) player.speed = 0;
      velocity.current = { x: 0, z: 0 };
      jumps.current = actions.jump;
      return;
    }
    if (jumps.current !== actions.jump) {
      jumps.current = actions.jump;
      if (player.jump.height === 0) player.jump.velocity = JUMP.velocity;
    }
    const has = (...ks: string[]) => ks.some((k) => keys.current.has(k));
    const intent = combineInput({
      forward: Number(has('w', 'z', 'arrowup')) - Number(has('s', 'arrowdown')),
      right: Number(has('d', 'arrowright')) - Number(has('a', 'q', 'arrowleft')),
      run: has('shift'),
    });
    const speed = (intent.run ? WORLD.runSpeed : WORLD.walkSpeed) * (state.interior ? 0.7 : 1);
    const [vx, vz] = desiredVelocity(intent, view.movementYaw, speed);
    const damping = 1 - Math.exp(-(intent.magnitude ? 7 : 10) * dt);
    velocity.current.x += (vx - velocity.current.x) * damping;
    velocity.current.z += (vz - velocity.current.z) * damping;
    const dx = velocity.current.x * dt,
      dz = velocity.current.z * dt;
    const [x, z] = state.interior
      ? moveIndoors([player.x, player.z], [dx, dz], state.interior)
      : moveWithCollisions([player.x, player.z], [dx, dz]);
    player.speed = Math.hypot(x - player.x, z - player.z) / Math.max(dt, 0.001);
    player.x = x;
    player.z = z;
    player.y = state.interior ? 0 : heightAt(x, z);
    if (intent.magnitude > 0.05 && Math.hypot(dx, dz) > 1e-4) {
      const target = Math.atan2(dx, dz);
      const diff = Math.atan2(Math.sin(target - player.angle), Math.cos(target - player.angle));
      player.angle += diff * (1 - Math.exp(-14 * dt));
    }
    nearTimer.current += dt;
    if (nearTimer.current > 0.12) {
      nearTimer.current = 0;
      if (state.interior) {
        const found = stationAt(state.interior, x, z, state.station),
          id = found?.id ?? null;
        if (state.station !== id || (id && !state.seen.includes(state.interior + ':' + id))) {
          player.reaction = id?.length ? 1 : 0;
          setState({
            station: id,
            seen:
              id && !state.seen.includes(state.interior + ':' + id)
                ? [...state.seen, state.interior + ':' + id]
                : state.seen,
          });
        }
      } else {
        const found = buildings.find((b) => {
          const [ex, ez] = entrance(b);
          return Math.hypot(x - ex, z - ez) < 3.7;
        });
        if (state.nearby !== (found?.id ?? null)) {
          player.reaction = found ? 1 : 0;
          setState({ nearby: found?.id ?? null });
        }
      }
    }
  }, -2);
  return null;
}
