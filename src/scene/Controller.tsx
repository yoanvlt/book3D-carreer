import { moveIndoors, stationAt } from '../world/narrative';
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  getState,
  setState,
  player,
  view,
  interact,
  resetPlayer,
  showPanel,
  discover,
  endPresentation,
  cancelJourney,
} from '../state';
import { WORLD, CAMERA, buildings, entrance } from '../world/config';
import { heightAt } from '../world/terrain';
import { moveWithCollisions } from '../world/collision';

export default function Controller() {
  const keys = useRef(new Set<string>()),
    nearTimer = useRef(0),
    velocity = useRef({ x: 0, z: 0 });
  const { gl } = useThree();
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
        endPresentation();
        cancelJourney();
        setState({ map: false, help: false, detail: null, reading: null });
        held.clear();
        return;
      }
      if (state.phase !== 'explore' || state.map || state.detail || state.reading || state.help) return;
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
      if (
        !state.moved &&
        ['w', 'z', 'a', 'q', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)
      )
        window.setTimeout(() => setState({ moved: true }), 1500);
    }
    const up = (e: KeyboardEvent) => held.delete(e.key.toLowerCase());
    const clear = () => {
      held.clear();
      player.speed = 0;
      velocity.current = { x: 0, z: 0 };
      dragging = false;
    };
    let dragging = false,
      lastX = 0,
      lastY = 0;
    const start = (e: PointerEvent) => {
      if (
        getState().phase !== 'explore' ||
        getState().map ||
        getState().detail ||
        getState().reading ||
        getState().help
      )
        return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      gl.domElement.setPointerCapture(e.pointerId);
    };
    const drag = (e: PointerEvent) => {
      if (getState().phase !== 'explore') {
        dragging = false;
        return;
      }
      if (!dragging) return;
      view.yaw -= (e.clientX - lastX) * 0.005;
      view.pitch = Math.max(0.25, Math.min(1.14, view.pitch + (e.clientY - lastY) * 0.003));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const end = () => {
      dragging = false;
    };
    const wheel = (e: WheelEvent) => {
      if (
        getState().phase === 'explore' &&
        !getState().map &&
        !getState().help &&
        !getState().reading &&
        !getState().detail
      ) {
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
  }, [gl]);
  useFrame((_, delta) => {
    const dt = Math.max(0.001, Math.min(delta, 0.05)),
      state = getState();
    if (['travel', 'doorway', 'showcase', 'returning'].includes(state.phase)) {
      keys.current.clear();
      velocity.current = { x: 0, z: 0 };
      return;
    }
    if (state.phase !== 'explore' || state.map || state.detail || state.reading || state.help) {
      keys.current.clear();
      player.speed = 0;
      velocity.current = { x: 0, z: 0 };
      return;
    }
    const has = (...ks: string[]) => ks.some((k) => keys.current.has(k));
    let forward = Number(has('w', 'z', 'arrowup')) - Number(has('s', 'arrowdown'));
    let right = Number(has('d', 'arrowright')) - Number(has('a', 'q', 'arrowleft'));
    const len = Math.hypot(forward, right);
    if (len) {
      forward /= len;
      right /= len;
    }
    const speed = (has('shift') ? WORLD.runSpeed : WORLD.walkSpeed) * (state.interior ? 0.7 : 1);
    const desiredX = (right * Math.cos(view.movementYaw) - forward * Math.sin(view.movementYaw)) * speed * dt;
    const desiredZ =
      (-right * Math.sin(view.movementYaw) - forward * Math.cos(view.movementYaw)) * speed * dt;
    const damping = 1 - Math.exp(-(len ? 7 : 10) * dt);
    velocity.current.x += (desiredX / dt - velocity.current.x) * damping;
    velocity.current.z += (desiredZ / dt - velocity.current.z) * damping;
    const dx = velocity.current.x * dt,
      dz = velocity.current.z * dt;
    const [x, z] = state.interior
      ? moveIndoors([player.x, player.z], [dx, dz], state.interior)
      : moveWithCollisions([player.x, player.z], [dx, dz]);
    player.speed = Math.hypot(x - player.x, z - player.z) / Math.max(dt, 0.001);
    player.x = x;
    player.z = z;
    player.y = state.interior ? 0 : heightAt(x, z);
    if (len) {
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
