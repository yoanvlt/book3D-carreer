import { useSyncExternalStore } from 'react';
import {
  WORLD,
  CAMERA,
  entrance,
  localToWorld,
  buildings,
  type BuildingId,
  type Point,
} from './world/config';
import { heightAt } from './world/terrain';
import { findRoute } from './world/navigation';
import { ROOM, stationsFor, indoorRoute, stationApproach, stationAt } from './world/narrative';
export type Phase =
  'home' | 'entering' | 'explore' | 'travel' | 'doorway' | 'showcase' | 'returning' | 'homing';
export type CameraMode =
  'aerial' | 'arrival' | 'exterior' | 'interior' | 'guided' | 'door' | 'presentation' | 'return' | 'homeward';
type State = {
  phase: Phase;
  map: boolean;
  help: boolean;
  detail: BuildingId | null;
  nearby: BuildingId | null;
  quality: 'high' | 'low';
  visited: BuildingId[];
  ready: boolean;
  reducedMotion: boolean;
  fps: number;
  interior: BuildingId | null;
  door: BuildingId | null;
  station: string | null;
  reading: string | null;
  seen: string[];
  notice: string;
  showcase: BuildingId | null;
};
let state: State = {
  phase: 'home',
  map: false,
  help: false,
  detail: null,
  nearby: null,
  quality: 'high',
  visited: [],
  ready: false,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  fps: 0,
  interior: null,
  door: null,
  station: null,
  reading: null,
  seen: [],
  notice: '',
  showcase: null,
};
const listeners = new Set<() => void>();
export const getState = () => state;
export const setState = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};
export const useGame = () =>
  useSyncExternalStore((fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, getState);
export function cameraMode(s = state): CameraMode {
  if (s.phase === 'explore') return s.interior ? 'interior' : 'exterior';
  return (
    {
      home: 'aerial',
      entering: 'arrival',
      travel: 'guided',
      doorway: 'door',
      showcase: 'presentation',
      returning: 'return',
      homing: 'homeward',
    } as const
  )[s.phase];
}
export const player = {
  x: WORLD.spawn[0],
  z: WORLD.spawn[1],
  y: heightAt(...WORLD.spawn),
  angle: Math.PI,
  speed: 0,
  teleport: 0,
  reaction: 0,
};
export const view = { yaw: 0, movementYaw: 0, pitch: CAMERA.elevation, distance: CAMERA.distance, reset: 0 };
export const journey = {
  points: [] as Point[],
  index: 1,
  destination: null as BuildingId | null,
  exit: false,
  speed: 0,
  stalled: 0,
};
export type DoorStage = 'approach' | 'opening' | 'crossing' | 'handoff' | 'emerging' | 'closing';
export const passage = {
  time: 0,
  swapped: false,
  leaving: false,
  from: [0, 0] as Point,
  to: [0, 0] as Point,
  pending: null as BuildingId | null,
  stage: 'approach' as DoorStage,
  openness: 0,
  fade: 0,
  route: [] as Point[],
  index: 1,
};
export const presentation = {
  preview: false,
  serial: 0,
  enterAfter: false,
  fromHome: false,
  savedYaw: 0,
  savedPitch: CAMERA.elevation,
  savedDistance: CAMERA.distance,
};
export const isIdle = () => state.phase === 'home' || state.phase === 'explore';
export const arrival = { destination: null as BuildingId | null };
const overlaysClosed = { map: false, help: false, detail: null, reading: null };
export function enter() {
  if (state.phase !== 'home') return;
  arrival.destination = null;
  setState({ phase: 'entering', ...overlaysClosed, interior: null });
}
export function finishArrival() {
  if (state.phase !== 'entering') return;
  const destination = arrival.destination;
  arrival.destination = null;
  setState({ phase: 'explore' });
  if (destination) travel(destination);
}
export function showPanel(panel: 'map' | 'help') {
  if (!isIdle()) return;
  setState({ ...overlaysClosed, [panel]: !state[panel] });
}
export function discover(id: BuildingId, preview = false) {
  if (!isIdle() || state.interior) return;
  const b = buildings.find((b) => b.id === id)!;
  if (
    !preview &&
    (state.phase !== 'explore' || Math.hypot(player.x - entrance(b)[0], player.z - entrance(b)[1]) > 4)
  )
    return;
  presentation.preview = preview;
  presentation.serial++;
  presentation.enterAfter = false;
  presentation.fromHome = state.phase === 'home';
  presentation.savedYaw = view.yaw;
  presentation.savedPitch = view.pitch;
  presentation.savedDistance = view.distance;
  player.reaction = 1;
  setState({ phase: 'showcase', showcase: id, ...overlaysClosed });
}
export function endPresentation(enterAfter = false) {
  if (state.phase !== 'showcase') return;
  presentation.enterAfter = enterAfter;
  setState({ phase: 'returning' });
}
export function finishPresentation() {
  if (state.phase !== 'returning') return;
  const id = state.showcase,
    enterAfter = presentation.enterAfter;
  view.yaw = presentation.savedYaw;
  view.pitch = presentation.savedPitch;
  view.distance = presentation.savedDistance;
  setState({ phase: presentation.fromHome ? 'home' : 'explore', showcase: null });
  if (id && enterAfter) {
    if (presentation.preview) setState({ detail: id });
    else openBuilding(id);
  }
}
function startJourney(points: Point[], destination: BuildingId | null, exit = false) {
  if (!points.length) {
    setState({ notice: 'Ce trajet est indisponible. Avancez de quelques pas et réessayez.', map: false });
    return false;
  }
  Object.assign(journey, { points, index: 1, destination, exit, speed: 0, stalled: 0 });
  setState({ phase: 'travel', nearby: null, station: null, notice: '', ...overlaysClosed });
  if (state.reducedMotion) skipJourney();
  return true;
}
export function travel(id: BuildingId) {
  if (!isIdle()) return;
  if (state.phase === 'home') {
    enter();
    arrival.destination = id;
    return;
  }
  if (state.interior) {
    passage.pending = id;
    if (!guideExit()) passage.pending = null;
    return;
  }
  startJourney(findRoute([player.x, player.z], entrance(buildings.find((b) => b.id === id)!)), id);
}
export function finishJourney() {
  if (state.phase !== 'travel') return;
  player.speed = 0;
  journey.speed = 0;
  const exit = journey.exit;
  journey.exit = false;
  setState({
    phase: 'explore',
    nearby: state.interior ? null : journey.destination,
    station: state.interior ? (stationAt(state.interior, player.x, player.z)?.id ?? null) : null,
  });
  if (exit) leaveBuilding();
}
export function skipJourney() {
  if (state.phase !== 'travel') return;
  const p = journey.points.at(-1);
  if (!p) return;
  player.x = p[0];
  player.z = p[1];
  player.y = state.interior ? 0 : heightAt(...p);
  player.speed = 0;
  player.teleport++;
  if (journey.destination) {
    const b = buildings.find((b) => b.id === journey.destination)!;
    view.yaw = b.rotation;
    player.angle = b.rotation + Math.PI;
  }
  finishJourney();
}
export function cancelJourney() {
  if (state.phase !== 'travel') return;
  journey.points = [];
  journey.exit = false;
  passage.pending = null;
  player.speed = 0;
  setState({ phase: 'explore', notice: '' });
}
function startDoor(id: BuildingId, leaving: boolean, route: Point[]) {
  if (!route.length) return;
  const b = buildings.find((b) => b.id === id)!;
  Object.assign(passage, {
    time: 0,
    swapped: false,
    leaving,
    from: [player.x, player.z],
    to: leaving ? [0, 17.55] : localToWorld(b, 0, b.size[1] / 2 + 0.1),
    stage: 'approach',
    openness: 0,
    fade: 0,
    route,
    index: 1,
  });
  player.reaction = 1;
  setState({ phase: 'doorway', door: id, station: null, ...overlaysClosed });
}
export function openBuilding(id: BuildingId) {
  if (state.phase !== 'explore' || state.interior) return;
  const b = buildings.find((b) => b.id === id)!,
    p = entrance(b);
  if (Math.hypot(player.x - p[0], player.z - p[1]) > 4) return;
  startDoor(id, false, findRoute([player.x, player.z], p));
}
export function leaveBuilding() {
  if (!state.interior || state.phase !== 'explore') return;
  startDoor(state.interior, true, indoorRoute([player.x, player.z], ROOM.exit, state.interior));
}
export function interact() {
  if (state.phase !== 'explore' || state.map || state.help || state.reading || state.detail) return;
  if (state.interior) {
    if (state.station) {
      player.reaction = 1;
      setState({ reading: state.station });
    } else if (Math.hypot(player.x, player.z - 16) < 3) leaveBuilding();
  } else if (state.nearby) openBuilding(state.nearby);
}
export function guideToStation(index: number) {
  if (!state.interior || state.phase !== 'explore') return;
  const s = stationsFor(state.interior)[index];
  if (!s) return;
  startJourney(indoorRoute([player.x, player.z], stationApproach(s), state.interior), null);
}
export function goHome() {
  if (state.phase !== 'explore' || state.interior) return;
  journey.points = [];
  passage.pending = null;
  player.speed = 0;
  setState({ phase: 'homing', ...overlaysClosed, nearby: null });
}
export function resetPlayer() {
  if (!isIdle()) return;
  if (state.interior) {
    guideExit();
    return;
  }
  arrival.destination = null;
  player.x = WORLD.spawn[0];
  player.z = WORLD.spawn[1];
  player.y = heightAt(...WORLD.spawn);
  player.speed = 0;
  player.teleport++;
  view.yaw = 0;
  setState({ phase: 'entering', ...overlaysClosed, nearby: null });
}
export function guideExit(): boolean {
  if (!state.interior || state.phase !== 'explore') return false;
  if (Math.hypot(player.x, player.z - 16) < 3) {
    leaveBuilding();
    return getState().phase === 'doorway';
  }
  return startJourney(indoorRoute([player.x, player.z], ROOM.exit, state.interior), null, true);
}
