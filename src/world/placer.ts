/**
 * Placeur du décor (V8). Chaque objet est posé par une règle du plan (world/plan.ts) et vérifié
 * par les tests (tests/v8.test.mjs) :
 * - zones : un objet n'est accepté que dans les zones qui lui sont destinées (rien sur la
 *   chaussée sauf la route, rien sur la place sauf le mobilier de place…) ;
 * - distances : deux objets ne se touchent pas (rayons + marge) ;
 * - île : rien hors du plateau ni flottant (posé à la hauteur du sol) ;
 * - façades : aucun arbre contre une façade ni devant une porte ;
 * - alignement : lampadaires et bancs parallèles aux bordures, à distance fixe de la chaussée.
 */
import { buildings, entrance, localToWorld, type BuildingId } from './config';
import { edgeRadius } from './island';
import { heightAt } from './terrain';
import { FOUNTAIN, INNER, LOOP, OUTER, PARCELS, ROAD_SINK, ROAD_TILES, zoneAt, type Zone } from './plan';

export type Model =
  | 'route'
  | 'route-passage'
  | 'route-courbe'
  | 'dalle'
  | 'lampadaire'
  | 'banc'
  | 'buisson'
  | 'benne'
  | 'borne-incendie'
  | 'corbeille'
  | 'caisse'
  | 'pin'
  | 'sapin'
  | 'feuillu'
  | 'rocher-a'
  | 'rocher-c'
  | 'rocher-e'
  | 'voiture'
  | 'citadine';

export interface Item {
  model: Model;
  x: number;
  y: number;
  z: number;
  ry: number;
  scale: number | [number, number, number];
  /** Rayon d'encombrement au sol (0 : ne gêne pas, ex. route, dalle). */
  radius: number;
  /** Lieu dont la parcelle contient l'objet, s'il y en a un. */
  parcel?: BuildingId;
}

/** Zones acceptées par type d'objet. @public */
export const ZONES: Record<string, Zone[]> = {
  route: ['route'],
  'route-passage': ['route'],
  'route-courbe': ['route'],
  dalle: ['trottoir', 'place'],
  lampadaire: ['trottoir', 'place', 'parcelle'],
  banc: ['trottoir', 'place', 'pelouse', 'parcelle'],
  corbeille: ['trottoir', 'place', 'pelouse', 'parcelle'],
  'borne-incendie': ['trottoir'],
  buisson: ['pelouse', 'parcelle'],
  benne: ['parcelle'],
  caisse: ['parcelle'],
  pin: ['pelouse', 'parcelle'],
  sapin: ['pelouse', 'parcelle'],
  feuillu: ['pelouse', 'parcelle'],
  'rocher-a': ['pelouse'],
  'rocher-c': ['pelouse'],
  'rocher-e': ['pelouse'],
  voiture: ['parcelle'],
  citadine: ['parcelle'],
};

/** Rayon d'encombrement par type (mètres), pour les distances minimales et les collisions. */
const RADIUS: Partial<Record<Model, number>> = {
  lampadaire: 0.25,
  banc: 0.9,
  corbeille: 0.3,
  'borne-incendie': 0.3,
  buisson: 0.6,
  benne: 1.2,
  caisse: 0.5,
  pin: 0.9,
  sapin: 1.1,
  feuillu: 1.2,
  'rocher-a': 0.8,
  'rocher-c': 1,
  'rocher-e': 1.3,
  voiture: 2,
  citadine: 1.8,
};

const items: Item[] = [];
function put(model: Model, x: number, z: number, ry = 0, scale: Item['scale'] = 1, parcel?: BuildingId) {
  const k = typeof scale === 'number' ? scale : Math.max(scale[0], scale[2]);
  items.push({ model, x, y: heightAt(x, z), z, ry, scale, radius: (RADIUS[model] ?? 0) * k, parcel });
}

// Routes : les tuiles du plan, enfoncées pour que la chaussée affleure.
for (const t of ROAD_TILES)
  items.push({ model: t.kind, x: t.x, y: -ROAD_SINK, z: t.z, ry: t.rotation, scale: 1, radius: 0 });

// Trottoirs : dalles du kit étirées en bandes de 3 m, par tronçons de 8 m au plus.
function strip(x0: number, x1: number, z0: number, z1: number) {
  const alongX = x1 - x0 >= z1 - z0;
  const length = alongX ? x1 - x0 : z1 - z0;
  const n = Math.ceil(length / 8);
  for (let i = 0; i < n; i++) {
    const a = (length * i) / n;
    const b = (length * (i + 1)) / n;
    const cx = alongX ? x0 + (a + b) / 2 : (x0 + x1) / 2;
    const cz = alongX ? (z0 + z1) / 2 : z0 + (a + b) / 2;
    const sx = (alongX ? b - a : x1 - x0) / 8;
    const sz = (alongX ? z1 - z0 : b - a) / 8;
    items.push({ model: 'dalle', x: cx, y: -ROAD_SINK - 0.08, z: cz, ry: 0, scale: [sx, 1, sz], radius: 0 });
  }
}
const road = { x0: LOOP.west - 4, x1: LOOP.east + 4, z0: LOOP.north - 4, z1: LOOP.south + 4 };
strip(OUTER.x0, OUTER.x1, OUTER.z0, road.z0);
strip(OUTER.x0, OUTER.x1, road.z1, OUTER.z1);
strip(OUTER.x0, road.x0, road.z0, road.z1);
strip(road.x1, OUTER.x1, road.z0, road.z1);
strip(INNER.x0 - 3, INNER.x1 + 3, road.z0 + 8, INNER.z0);
strip(INNER.x0 - 3, INNER.x1 + 3, INNER.z1, road.z1 - 8);
strip(road.x0 + 8, INNER.x0, INNER.z0, INNER.z1);
strip(INNER.x1, road.x1 - 8, INNER.z0, INNER.z1);

// Place : dallage, fontaine (géométrie), quatre bancs tournés vers la fontaine, corbeilles.
for (const [x, z] of [
  [-12, -9],
  [-4, -9],
  [4, -9],
  [12, -9],
  [-12, 1],
  [-4, 1],
  [4, 1],
  [12, 1],
])
  items.push({ model: 'dalle', x, y: -ROAD_SINK - 0.08, z, ry: 0, scale: [1, 1, 10 / 8], radius: 0 });
for (const a of [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]) {
  const x = FOUNTAIN[0] + Math.cos(a) * 8;
  const z = FOUNTAIN[1] + Math.sin(a) * 7.5;
  put('banc', x, z, -a + Math.PI / 2);
  // Corbeille derrière le banc (côté extérieur), hors de son axe.
  put('corbeille', FOUNTAIN[0] + Math.cos(a + 0.42) * 10, FOUNTAIN[1] + Math.sin(a + 0.42) * 9.4);
}

// Lampadaires : sur les trottoirs, à 0,7 m de la bordure, bras au-dessus de la chaussée.
const lamp = (x: number, z: number, ry: number) => put('lampadaire', x, z, ry);
for (const x of [-36, -12, 12, 36]) lamp(x, road.z0 - 0.7, Math.PI / 2);
for (const x of [-24, -8, 8, 24]) lamp(x, road.z1 + 0.7, -Math.PI / 2);
for (const z of [-16, 12]) {
  lamp(road.x0 - 0.7, z, Math.PI);
  lamp(road.x1 + 0.7, z, 0);
}
for (const x of [-12, 12]) {
  lamp(x, road.z0 + 8.7, -Math.PI / 2);
  lamp(x, road.z1 - 8.7, Math.PI / 2);
}
// Bornes d'incendie aux angles extérieurs.
for (const [x, z] of [
  [OUTER.x0 + 1, OUTER.z0 + 1],
  [OUTER.x1 - 1, OUTER.z1 - 1],
])
  put('borne-incendie', x, z);

// Pelouses de l'îlot central : un feuillu et des buissons de chaque côté de la place.
for (const side of [-1, 1]) {
  put('feuillu', side * 20.5, -9, side, 1.3);
  put('feuillu', side * 20.5, 3, side * 2, 1.15);
  for (const z of [-15.5, 7.5]) put('buisson', side * 17.5, z, z, 0.9);
}

// Parcs au sud de la boucle, de part et d'autre du pavillon de verre.
for (const side of [-1, 1]) {
  put('feuillu', side * 18, 30, 0.5, 1.4);
  put('feuillu', side * 30, 28, 1.7, 1.2);
  put('pin', side * 24, 38, 0.3, 1.5);
  put('sapin', side * 33, 36, 2.2, 1.3);
  put('banc', side * 24, 27.5, 0);
  put('corbeille', side * 25.9, 27.5);
  put('buisson', side * 15, 25, 0, 1);
}

// Abords des lieux, en coordonnées locales (façade vers +z), dans leur parcelle.
const ABORDS: Record<BuildingId, [Model, number, number, number, number][]> = {
  profile: [
    ['feuillu', -10.5, -8, 0.4, 1.35],
    ['buisson', -11, 4.5, 0, 0.9],
    ['buisson', -9.4, 4.5, 1, 0.8],
    ['buisson', 9.4, 4.5, 2, 0.8],
    ['banc', -10.5, -1, Math.PI / 2, 1],
    ['sapin', 9.5, -10, 0.7, 1.3],
  ],
  missions: [
    ['buisson', -10.2, 4, 0, 0.9],
    ['buisson', 10.2, 4, 1, 0.9],
    ['pin', -10.5, -9, 0, 1.4],
    ['pin', 10.5, -9, 2, 1.3],
  ],
  'project-3': [
    ['buisson', -7.5, 5.5, 0, 0.9],
    ['buisson', 7.5, 5.5, 1, 0.9],
    ['sapin', 10, -9, 1, 1.4],
  ],
  'project-2': [
    ['benne', 20.5, -8.5, 0, 1],
    ['caisse', 13.2, 3.4, 0.3, 1],
    ['caisse', 14.1, 3.9, 1, 0.8],
    ['caisse', 13.6, 2.5, 2, 0.9],
  ],
  veolia: [
    ['buisson', 10.6, 6, 0, 0.9],
    ['corbeille', -10.4, 6.6, 0, 1],
  ],
  'project-1': [
    ['citadine', 10.6, 2.2, Math.PI, 1],
    ['buisson', -8.6, 5.6, 0, 0.9],
    ['feuillu', -10.5, -7, 1, 1.2],
  ],
};
for (const b of buildings)
  for (const [model, lx, lz, ry, k] of ABORDS[b.id]) {
    const [x, z] = localToWorld(b, lx, lz);
    put(model, x, z, ry + b.rotation, k, b.id);
  }

// Bord de l'île : pins et sapins en lisière, rochers sur la crête, hors parcelles et rues.
for (let i = 0; i < 64; i++) {
  const a = (i / 64) * Math.PI * 2 + 0.03;
  const edge = edgeRadius(a);
  const r = edge - (i % 2 ? 6 : 9.5);
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  if (
    zoneAt(x, z) !== 'pelouse' ||
    PARCELS.some(
      (p) => p.bounds.x0 - 3 < x && x < p.bounds.x1 + 3 && p.bounds.z0 - 3 < z && z < p.bounds.z1 + 3,
    )
  )
    continue;
  if (Math.hypot(x - 0, z - 60) < 14 || Math.hypot(x - 46, z - 46) < 10) continue;
  put(i % 3 === 0 ? 'sapin' : 'pin', x, z, i * 1.7, 1.15 + ((i * 37) % 7) / 14);
}
for (let i = 0; i < 26; i++) {
  const a = (i / 26) * Math.PI * 2 + 0.11;
  const model = (['rocher-e', 'rocher-c', 'rocher-a'] as const)[i % 3];
  const k = 1.4 + (i % 4) * 0.3;
  const r = edgeRadius(a) - 1.2 - (RADIUS[model] ?? 1) * k;
  const x = Math.cos(a) * r;
  const z = Math.sin(a) * r;
  if (zoneAt(x, z) !== 'pelouse') continue;
  put(model, x, z, i * 2.3, k);
}

/** Tout le décor posé, après application des règles (les objets en conflit sont retirés). */
export const decor: Item[] = items.filter((item, i) => {
  if (!ZONES[item.model]?.includes(zoneAt(item.x, item.z))) return false;
  if (item.radius === 0) return true;
  return !items.some(
    (o, j) => j < i && o.radius > 0 && Math.hypot(o.x - item.x, o.z - item.z) < o.radius + item.radius + 0.3,
  );
});

/** Ce qui gêne la marche (rayon > 0), pour les collisions. */
export const solids = decor.filter((d) => d.radius > 0 && !d.model.startsWith('route'));

/** Distance d'un point à la façade d'entrée d'un lieu (couloir de 5 m devant la porte). @public */
export function inFrontOfDoor(x: number, z: number) {
  return buildings.some((b) => {
    const [ex, ez] = entrance(b);
    const [dx, dz] = [Math.sin(b.rotation), Math.cos(b.rotation)];
    const along = (x - ex) * dx + (z - ez) * dz;
    const across = Math.abs((x - ex) * dz - (z - ez) * dx);
    return along > -3.5 && along < 6 && across < 2.5;
  });
}
