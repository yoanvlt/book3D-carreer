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

/**
 * Salle d'exposition : 22 × 26 unités. Les stations sont adossées aux murs latéraux, en rangées
 * espacées de 5 unités ; chacune a un socle (objet exposé) et un écran tourné vers l'allée.
 */
export const ROOM = {
  halfWidth: 11,
  halfDepth: 13,
  spawn: [0, 6] as Point,
  /** Point d'où l'on sort par la porte (E ou « Sortir »). */
  exit: [0, 11] as Point,
  /** Seuil intérieur de la porte. */
  door: [0, 12.55] as Point,
  /** Point atteint après la porte : assez loin du seuil pour que la caméra voie la salle. */
  arrival: [0, 4] as Point,
};
/** Rangées des stations (z), de la porte vers le fond. */
export const ROWS = [7, 2, -3, -8];
/** Socle (centre x) et écran (centre x) d'une station, côté droit ; symétriques à gauche. */
export const STATION = { plinthX: 6.8, screenX: 9.3, approachX: 3.9 };

const PROFILE_SLOTS: Pick<Station, 'position' | 'object'>[] = [
  { position: [-STATION.plinthX, ROWS[0]], object: 'portrait' },
  { position: [STATION.plinthX, ROWS[1]], object: 'network' },
  { position: [-STATION.plinthX, ROWS[2]], object: 'data' },
  { position: [STATION.plinthX, ROWS[3]], object: 'craft' },
];
const OBJECTS = ['network', 'data', 'craft', 'portrait'] as const;
/** Huit stations en vis-à-vis : 0 et 1 sur la première rangée, puis 2 et 3, etc. */
const GALLERY_SLOTS: Pick<Station, 'position' | 'object'>[] = Array.from({ length: 8 }, (_, i) => ({
  position: [i % 2 ? STATION.plinthX : -STATION.plinthX, ROWS[Math.floor(i / 2)]] as Point,
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

/** Mobilier qui bloque la marche : [x, z, demi-largeur, demi-profondeur]. */
export type Footprint = [number, number, number, number];
/** Emprise d'une station : du bord intérieur du socle jusqu'au mur, écran compris. */
function stationFootprint(s: Station): Footprint {
  const side = Math.sign(s.position[0]);
  const inner = STATION.plinthX - 1.2;
  const outer = ROOM.halfWidth - 0.7;
  return [(side * (inner + outer)) / 2, s.position[1], (outer - inner) / 2, 1.4];
}
const BACK = -ROOM.halfDepth + 1.3;
/** Profil : bibliothèques sur les emplacements libres, canapé et fauteuil au fond. */
const SHELVES: Footprint[] = [
  [9.75, ROWS[0], 0.55, 1.6],
  [-9.75, ROWS[1], 0.55, 1.6],
  [9.75, ROWS[2], 0.55, 1.6],
  [-9.75, ROWS[3], 0.55, 1.6],
];
export const FURNITURE: Record<BuildingId, Footprint[]> = {
  profile: [...SHELVES, [-2.2, BACK, 2.2, 0.6], [3.4, BACK, 0.8, 0.7]],
  'project-1': [[0, BACK, 2.6, 0.7]],
  'project-2': [[0, BACK + 0.2, 3.2, 0.55]],
  'project-3': [[0, BACK, 1.1, 0.9]],
  missions: [
    [-3, BACK, 0.6, 0.6],
    [3, BACK, 0.6, 0.6],
  ],
  veolia: [[0, BACK, 3, 0.6]],
};
/** Colonnes techniques de Veolia, dans les coins du fond. */
export const VEOLIA_COLUMNS: Point[] = [
  [-9.7, -ROOM.halfDepth + 2.5],
  [9.7, -ROOM.halfDepth + 2.5],
];
/** Jardinières de part et d'autre de la porte. */
export const DOOR_PLANTERS: Point[] = [
  [-9, ROOM.halfDepth - 3.2],
  [9, ROOM.halfDepth - 3.2],
];

export function indoorBlocked(x: number, z: number, id: BuildingId) {
  if (Math.abs(x) > ROOM.halfWidth - 0.7 || Math.abs(z) > ROOM.halfDepth - 0.8) return true;
  if (DOOR_PLANTERS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 1.65)) return true;
  if (id === 'veolia' && VEOLIA_COLUMNS.some(([px, pz]) => Math.hypot(x - px, z - pz) < 1.3)) return true;
  // Rayon du robot (0,55) autour de chaque emprise : il ne traverse ni socle ni écran.
  const touches = ([fx, fz, hx, hz]: Footprint) =>
    Math.hypot(Math.max(0, Math.abs(x - fx) - hx), Math.max(0, Math.abs(z - fz) - hz)) < 0.55;
  return FURNITURE[id].some(touches) || stationsFor(id).some((s) => touches(stationFootprint(s)));
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
/** Point d'arrêt devant une station : dans l'allée, face à l'écran. */
export const stationApproach = (s: Station): Point => [
  Math.sign(s.position[0]) * STATION.approachX,
  s.position[1],
];
/** @public Utilisé par les tests ou les scripts. */
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
  for (let x = -ROOM.halfWidth + 1; x <= ROOM.halfWidth - 1; x++)
    for (let z = -ROOM.halfDepth + 1; z <= ROOM.halfDepth - 1; z++)
      if (!indoorBlocked(x, z, id)) nodes.push([x, z]);
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
