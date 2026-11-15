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
import { blocked } from './world/collision';
import { TIMING, cumulative, travelDuration } from './world/timing';
import { loadStamps, saveStamps } from './world/passport';
import { ROOM, stationsFor, indoorRoute, stationApproach, stationAt, indoorBlocked } from './world/narrative';
type Phase = 'home' | 'entering' | 'explore' | 'travel' | 'doorway' | 'showcase' | 'returning' | 'homing';
export type CameraMode =
  'aerial' | 'arrival' | 'exterior' | 'interior' | 'guided' | 'door' | 'presentation' | 'return' | 'homeward';
type State = {
  phase: Phase;
  map: boolean;
  help: boolean;
  detail: BuildingId | null;
  nearby: BuildingId | null;
  quality: 'high' | 'low';
  /** Faux dès que le visiteur choisit lui-même la qualité graphique. */
  qualityAuto: boolean;
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
  /** Le visiteur a déjà marché : l'aide clavier n'est plus affichée. */
  moved: boolean;
  /** Visite guidée : index du lieu présenté, ou null. */
  tour: number | null;
  /** Carte de fin de visite ouverte. */
  ending: boolean;
};
let state: State = {
  phase: 'home',
  map: false,
  help: false,
  detail: null,
  nearby: null,
  quality: 'high',
  qualityAuto: true,
  visited: loadStamps(),
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
  moved: false,
  tour: null,
  ending: false,
};
const listeners = new Set<() => void>();
export const getState = () => state;
export const setState = (patch: Partial<State>) => {
  if (patch.visited && patch.visited !== state.visited) saveStamps(patch.visited);
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
  angle: WORLD.spawnAngle,
  speed: 0,
  teleport: 0,
  reaction: 0,
  /** Saut visuel : hauteur au-dessus du sol et vitesse verticale. */
  jump: { height: 0, velocity: 0 },
};
export const view = {
  yaw: WORLD.spawnAngle - Math.PI,
  movementYaw: 0,
  pitch: CAMERA.elevation,
  distance: CAMERA.distance,
  reset: 0,
};
/** Trajet automatique en cours : ligne brisée parcourue en temps fixé (voir world/timing.ts). */
export const journey = {
  points: [] as Point[],
  lengths: [0] as number[],
  duration: 0,
  elapsed: 0,
  index: 1,
  destination: null as BuildingId | null,
  exit: false,
  speed: 0,
  stalled: 0,
};
export type DoorStage = 'approach' | 'cut' | 'opening' | 'crossing' | 'handoff' | 'emerging' | 'closing';
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
  lengths: [0] as number[],
  approach: 0,
  startAngle: 0,
  index: 1,
};
/** Demande de passer la séquence en cours (trajet, porte, présentation, descente de caméra). */
export const skip = { serial: 0 };
export const presentation = {
  /** Durée de la présentation (hors retour) et jeu de vues : 2 vues (court) ou 4 (visite guidée). */
  duration: TIMING.showcase as number,
  full: false,
  preview: false,
  serial: 0,
  enterAfter: false,
  fromHome: false,
  savedYaw: 0,
  savedPitch: CAMERA.elevation,
  savedDistance: CAMERA.distance,
};
const isIdle = () => state.phase === 'home' || state.phase === 'explore';
const arrival = { destination: null as BuildingId | null };
const overlaysClosed = { map: false, help: false, detail: null, reading: null };
export function enter() {
  if (state.phase !== 'home') return;
  arrival.destination = null;
  // Le robot atterrit au départ, sur la place (il a pu quitter la ville ailleurs).
  player.x = WORLD.spawn[0];
  player.z = WORLD.spawn[1];
  player.y = heightAt(...WORLD.spawn);
  player.speed = 0;
  player.angle = WORLD.spawnAngle;
  view.yaw = WORLD.spawnAngle - Math.PI;
  setState({ phase: 'entering', ...overlaysClosed, interior: null });
}
export function finishArrival() {
  if (state.phase !== 'entering') return;
  const destination = arrival.destination;
  arrival.destination = null;
  setState({ phase: 'explore' });
  if (destination) travel(destination);
}
/** Marche lancée en touchant le sol : elle ne bloque pas l'interface. */
const isTapWalk = (s = state) => s.phase === 'travel' && !journey.destination && !journey.exit;
/** Une séquence automatique possède le robot et la caméra : l'interface attend. */
export const isBusy = (s = state) => s.phase !== 'home' && s.phase !== 'explore' && !isTapWalk(s);
export function showPanel(panel: 'map' | 'help') {
  if (isTapWalk()) cancelJourney();
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
  presentation.duration = TIMING.showcase;
  presentation.full = false;
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
  if (state.tour !== null) {
    const next = state.tour + 1;
    if (next < TOUR.order.length) {
      setState({ tour: next });
      tourStep();
    } else setState({ tour: null });
    return;
  }
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
  const lengths = cumulative(points);
  Object.assign(journey, {
    points,
    lengths,
    duration: travelDuration(lengths.at(-1) ?? 0, !!state.interior),
    elapsed: 0,
    index: 1,
    destination,
    exit,
    speed: 0,
    stalled: 0,
  });
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
  const lengths = cumulative(route);
  const length = lengths.at(-1) ?? 0;
  Object.assign(passage, {
    time: 0,
    swapped: false,
    leaving,
    from: [player.x, player.z],
    to: leaving ? ROOM.door : localToWorld(b, 0, b.size[1] / 2 + 0.1),
    // Loin de la porte intérieure, un fondu remplace la marche jusqu'au seuil.
    stage: leaving && length > 3 ? 'cut' : 'approach',
    openness: 0,
    fade: 0,
    route,
    lengths,
    approach: Math.min(TIMING.approach, Math.max(0.12, length / 9)),
    startAngle: player.angle,
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
/** @public Utilisé par les tests ou les scripts. */
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
    } else if (Math.hypot(player.x - ROOM.exit[0], player.z - ROOM.exit[1]) < 3) leaveBuilding();
  } else if (state.nearby) openBuilding(state.nearby);
}
export function guideToStation(index: number) {
  if (!state.interior || state.phase !== 'explore') return;
  const s = stationsFor(state.interior)[index];
  if (!s) return;
  startJourney(indoorRoute([player.x, player.z], stationApproach(s), state.interior), null);
}
/** Robot de l'accueil : position du curseur (écran normalisé) et signe de la main au survol. */
export const robotUi = {
  pointer: [0, 0] as [number, number],
  wave: false,
  /** Captures : vol figé à cette fraction (0 à 1) de sa durée totale ; null en jeu. */
  hold: null as number | null,
  /** Position et cap du robot pendant les vols, suivis par la caméra. */
  position: [0, 0, 0] as [number, number, number],
  heading: 0,
};

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
  player.angle = WORLD.spawnAngle;
  player.teleport++;
  view.yaw = WORLD.spawnAngle - Math.PI;
  setState({ phase: 'entering', ...overlaysClosed, nearby: null });
}
export function guideExit(): boolean {
  if (!state.interior || state.phase !== 'explore') return false;
  // Près du seuil : la porte s'ouvre ; plus loin, un fondu remplace la marche (sortie ≤ 2 s).
  leaveBuilding();
  return getState().phase === 'doorway';
}

/** Repère du dernier « toucher pour aller », affiché au sol pendant la marche. */
export const marker = { point: null as Point | null, serial: 0 };

/** Toucher le sol pour y aller : itinéraire calculé par la navigation existante. */
export function walkTo(p: Point): boolean {
  if (state.phase === 'travel' && !journey.destination) cancelJourney();
  if (state.phase !== 'explore' || state.map || state.help || state.detail || state.reading) return false;
  if (Math.hypot(p[0] - player.x, p[1] - player.z) < 0.6) return false;
  const route = state.interior
    ? indoorBlocked(p[0], p[1], state.interior)
      ? []
      : indoorRoute([player.x, player.z], p, state.interior)
    : blocked(p[0], p[1])
      ? []
      : findRoute([player.x, player.z], p);
  if (!route.length) return false;
  marker.point = p;
  marker.serial++;
  return startJourney(route, null);
}

/**
 * Visite guidée depuis l'accueil : les six lieux s'enchaînent, chacun avec sa présentation complète
 * (quatre vues) et sa fiche. Durée totale : 6 × (8 + 0,8) s ≈ 53 s. On la quitte à tout moment ;
 * un clic ou Espace passe au lieu suivant.
 */
export const TOUR = { perPlace: 8, order: buildings.map((b) => b.id) };
function tourStep() {
  const id = TOUR.order[state.tour ?? 0];
  discover(id, true);
  presentation.full = true;
  presentation.duration = TOUR.perPlace;
}
export function startTour() {
  if (state.phase !== 'home' || state.tour !== null) return;
  setState({ tour: 0, ...overlaysClosed });
  tourStep();
}
export function stopTour() {
  if (state.tour === null) return;
  setState({ tour: null });
  endPresentation();
}
