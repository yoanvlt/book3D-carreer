import type { BuildingId, Point } from './config';

/**
 * Emplacement physique d'une station dans une salle : position du socle et objet exposé.
 * Le texte des stations vient de src/content/ ; ce fichier ne contient que la géométrie.
 */
export interface Station {
  id: string;
  position: Point;
  object: 'portrait' | 'network' | 'data' | 'craft';
}

const PROFILE_SLOTS: Pick<Station, 'position' | 'object'>[] = [
  { position: [-5, 7], object: 'portrait' },
  { position: [5, 1], object: 'network' },
  { position: [-5, -6], object: 'data' },
  { position: [5, -12], object: 'craft' },
];
const OBJECTS = ['network', 'data', 'craft', 'portrait'] as const;
const GALLERY_SLOTS: Pick<Station, 'position' | 'object'>[] = Array.from({ length: 8 }, (_, i) => ({
  position: [i % 2 ? 6 : -6, 10 - Math.floor(i / 2) * 7] as Point,
  object: OBJECTS[i % 4],
}));
const cache = new Map<BuildingId, Station[]>();

/** Stations disponibles dans un bâtiment, dans l'ordre de visite. */
export function stationsFor(id: BuildingId): Station[] {
  let stations = cache.get(id);
  if (!stations) {
    stations = (id === 'profile' ? PROFILE_SLOTS : GALLERY_SLOTS).map((slot, i) => ({
      id: `step-${i}`,
      ...slot,
    }));
    cache.set(id, stations);
  }
  return stations;
}

export const ROOM = {
  halfWidth: 11,
  halfDepth: 18,
  spawn: [0, 11] as Point,
  exit: [0, 16] as Point,
  /** Point atteint après la porte : assez loin du seuil pour que la caméra voie la salle. */
  arrival: [0, 8.5] as Point,
};
/** Mobilier qui bloque la marche, le long des murs et au fond : [x, z, demi-largeur, demi-profondeur]. */
export type Footprint = [number, number, number, number];
const SIDES = (z1: number, z2: number, half = 1.4): Footprint[] => [
  [-9.85, z1, 0.45, half],
  [9.85, z1, 0.45, half],
  [-9.85, z2, 0.45, half],
  [9.85, z2, 0.45, half],
];
export const FURNITURE: Record<BuildingId, Footprint[]> = {
  profile: [...SIDES(0.8, -7.2, 1.6), [-2.4, -16.3, 2.2, 0.6], [3.6, -16.2, 0.8, 0.7]],
  'project-1': [...SIDES(-1.8, -8.8, 1.3), [0, -16.2, 2.6, 0.7]],
  'project-2': [...SIDES(1, -7, 1.4), [0, -16.4, 3.2, 0.55]],
  'project-3': [...SIDES(-1.8, -8.8, 1.1), [5, -16, 1.1, 1]],
  missions: [...SIDES(-1.8, -8.8, 1.3), [-3.4, -16.2, 0.6, 0.6], [3.4, -16.2, 0.6, 0.6]],
  veolia: [...SIDES(-1.8, -8.8, 1.3), [0, -16.3, 3, 0.6]],
};

export function indoorBlocked(x: number, z: number, id: BuildingId) {
  if (Math.abs(x) > ROOM.halfWidth - 0.7 || Math.abs(z) > ROOM.halfDepth - 0.8) return true;
  if ([-9, 9].some((px) => Math.hypot(x - px, z - 14.8) < 1.65)) return true;
  if (id === 'veolia' && [-9.7, 9.7].some((px) => Math.hypot(x - px, z + 13) < 1.3)) return true;
  if (
    (id === 'profile' || id === 'project-2') &&
    [-11, -3, 5, 13].some((pz) => Math.abs(z - pz) < 0.8 && Math.abs(x) > 9.5)
  )
    return true;
  if (
    FURNITURE[id].some(
      ([fx, fz, hx, hz]) =>
        Math.hypot(Math.max(0, Math.abs(x - fx) - hx), Math.max(0, Math.abs(z - fz) - hz)) < 0.55,
    )
  )
    return true;
  // Include the robot's radius around plinths, not only their centre footprint.
  return stationsFor(id).some(
    (s) =>
      Math.hypot(
        Math.max(0, Math.abs(x - s.position[0]) - 1.8),
        Math.max(0, Math.abs(z - (s.position[1] - 1.3)) - 0.8),
      ) < 0.55,
  );
}

/** Broad circulation bands; one screen owns a zone, with hysteresis at boundaries. */
/**
 * Stations activables. Par défaut toutes ; le contenu (src/content/index.ts) n'active
 * que les emplacements qui ont un texte, pour qu'un lieu vide ne propose rien à lire.
 */
export const stationAvailability = { test: (_id: BuildingId, _station: string) => true };

export function stationAt(
  id: BuildingId,
  x: number,
  z: number,
  current: string | null = null,
): Station | null {
  const candidates = stationsFor(id).filter(
    (s) =>
      Math.abs(z - s.position[1]) < 2.5 &&
      Math.abs(x - s.position[0]) < 7.5 &&
      stationAvailability.test(id, s.id),
  );
  const score = (s: Station) =>
    Math.abs(z - s.position[1]) * 2 + Math.abs(x - s.position[0]) * 0.3 - (s.id === current ? 0.35 : 0);
  return candidates.sort((a, b) => score(a) - score(b))[0] ?? null;
}
export const stationApproach = (s: Station): Point => [Math.sign(s.position[0]) * 2.7, s.position[1] + 0.4];
export function clearIndoorSegment(a: Point, b: Point, id: BuildingId) {
  const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15));
  for (let i = 0; i <= n; i++)
    if (indoorBlocked(a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, id)) return false;
  return true;
}
/** Small room grid; every segment, including off-grid endpoints, is validated. */
export function indoorRoute(from: Point, to: Point, id: BuildingId): Point[] {
  if (clearIndoorSegment(from, to, id)) return [from, to];
  const nodes: Point[] = [];
  for (let x = -10; x <= 10; x++)
    for (let z = -17; z <= 17; z++) if (!indoorBlocked(x, z, id)) nodes.push([x, z]);
  const anchor = (p: Point) =>
    nodes
      .filter((n) => Math.hypot(n[0] - p[0], n[1] - p[1]) < 2 && clearIndoorSegment(p, n, id))
      .sort((a, b) => Math.hypot(a[0] - p[0], a[1] - p[1]) - Math.hypot(b[0] - p[0], b[1] - p[1]))[0];
  const start = anchor(from),
    end = anchor(to);
  if (!start || !end) return [];
  const key = (p: Point) => p.join(','),
    valid = new Set(nodes.map(key)),
    open = [key(start)],
    prev = new Map<string, string>(),
    cost = new Map([[key(start), 0]]);
  const point = (s: string) => s.split(',').map(Number) as Point;
  while (open.length) {
    open.sort(
      (a, b) =>
        cost.get(a)! +
        Math.hypot(point(a)[0] - end[0], point(a)[1] - end[1]) -
        cost.get(b)! -
        Math.hypot(point(b)[0] - end[0], point(b)[1] - end[1]),
    );
    const cur = open.shift()!,
      p = point(cur);
    if (cur === key(end)) {
      const route = [to, p];
      let k = cur;
      while (prev.has(k)) {
        k = prev.get(k)!;
        route.push(point(k));
      }
      route.push(from);
      route.reverse();
      const smooth = [route[0]];
      for (let i = 0; i < route.length - 1;) {
        let j = route.length - 1;
        while (j > i + 1 && !clearIndoorSegment(route[i], route[j], id)) j--;
        smooth.push(route[j]);
        i = j;
      }
      return smooth;
    }
    for (const d of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const next: Point = [p[0] + d[0], p[1] + d[1]],
        k = key(next),
        g = cost.get(cur)! + 1;
      if (!valid.has(k) || g >= (cost.get(k) ?? Infinity) || !clearIndoorSegment(p, next, id)) continue;
      cost.set(k, g);
      prev.set(k, cur);
      if (!open.includes(k)) open.push(k);
    }
  }
  return [];
}
export function moveIndoors(p: Point, d: Point, id: BuildingId): Point {
  let [x, z] = p;
  const n = Math.max(1, Math.ceil(Math.hypot(...d) / 0.15));
  for (let i = 0; i < n; i++) {
    if (!indoorBlocked(x + d[0] / n, z, id)) x += d[0] / n;
    if (!indoorBlocked(x, z + d[1] / n, id)) z += d[1] / n;
  }
  return [x, z];
}
