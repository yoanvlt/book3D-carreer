/**
 * Plan de l'île sur une grille de 4 m (V8). Tout ce qui est posé au sol vient d'ici : rues (tuiles
 * KayKit de 8 m, soit 2 × 2 cases), trottoirs, place, parcelles des six bâtiments, pelouses.
 * Les incohérences sont impossibles par construction : chaque objet est placé dans une zone qui
 * l'accepte (world/placer.ts), et les tests vérifient ces règles.
 *
 * Composition : une boucle de rues (les voitures y circulent sans demi-tour) entoure la place.
 * Trois bâtiments bordent la rue nord, face au sud ; l'atelier et la station d'eau bordent les
 * rues ouest et est ; le pavillon de verre ferme la vue au sud. Vue de l'accueil (sud-est), on
 * voit les façades nord, la façade de l'atelier et la cour des cuves de Veolia.
 */
import type { BuildingId, Point } from './config';

export const GRID = 4;
/** Tuile de route : 8 m de côté, chaussée de 7,2 m, bordures de 0,4 m. */
export const TILE = 8;
/** La chaussée est posée 0,24 m plus bas : son dessus est à 4 cm au-dessus du sol (pas de scintillement). */
export const ROAD_SINK = 0.24;

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}
export const rect = (x0: number, x1: number, z0: number, z1: number): Rect => ({ x0, x1, z0, z1 });
export const inside = (r: Rect, x: number, z: number, margin = 0) =>
  x >= r.x0 - margin && x <= r.x1 + margin && z >= r.z0 - margin && z <= r.z1 + margin;
/** Distance signée au rectangle (négative dedans). */
export function rectDistance(r: Rect, x: number, z: number) {
  const dx = Math.max(r.x0 - x, x - r.x1);
  const dz = Math.max(r.z0 - z, z - r.z1);
  return dx > 0 || dz > 0 ? Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) : Math.max(dx, dz);
}

/** Axes de la boucle de rues (centres des tuiles). */
export const LOOP = { west: -32, east: 32, north: -24, south: 16 } as const;

export type RoadKind = 'route' | 'route-passage' | 'route-courbe';
export interface RoadTile {
  kind: RoadKind;
  x: number;
  z: number;
  /** Rotation autour de y (la tuile droite court selon z à rotation 0). */
  rotation: number;
}

/** Passages piétons : devant chaque porte qui donne sur la boucle. */
const CROSSINGS = new Set(['-24,-24', '0,-24', '24,-24', '0,16', '-32,0', '32,0']);

function loopTiles(): RoadTile[] {
  const tiles: RoadTile[] = [];
  const { west, east, north, south } = LOOP;
  const kind = (x: number, z: number): RoadKind => (CROSSINGS.has(`${x},${z}`) ? 'route-passage' : 'route');
  for (let x = west + TILE; x < east; x += TILE) {
    tiles.push({ kind: kind(x, north), x, z: north, rotation: Math.PI / 2 });
    tiles.push({ kind: kind(x, south), x, z: south, rotation: Math.PI / 2 });
  }
  for (let z = north + TILE; z < south; z += TILE) {
    tiles.push({ kind: kind(west, z), x: west, z, rotation: 0 });
    tiles.push({ kind: kind(east, z), x: east, z, rotation: 0 });
  }
  // Virages : la tuile d'origine relie les bords +x et +z.
  tiles.push({ kind: 'route-courbe', x: west, z: north, rotation: 0 });
  tiles.push({ kind: 'route-courbe', x: east, z: north, rotation: -Math.PI / 2 });
  tiles.push({ kind: 'route-courbe', x: east, z: south, rotation: Math.PI });
  tiles.push({ kind: 'route-courbe', x: west, z: south, rotation: Math.PI / 2 });
  return tiles;
}
export const ROAD_TILES = loopTiles();

/** Chaussée de la boucle, en rectangles (pour les zones et les tests). */
export const CARRIAGEWAYS: Rect[] = [
  rect(LOOP.west - 4, LOOP.east + 4, LOOP.north - 4, LOOP.north + 4),
  rect(LOOP.west - 4, LOOP.east + 4, LOOP.south - 4, LOOP.south + 4),
  rect(LOOP.west - 4, LOOP.west + 4, LOOP.north - 4, LOOP.south + 4),
  rect(LOOP.east - 4, LOOP.east + 4, LOOP.north - 4, LOOP.south + 4),
];

/** Trottoirs : 3 m de chaque côté de la chaussée (sauf dans les virages, déjà pavés). */
export const SIDEWALK = 3;
export const OUTER = rect(
  LOOP.west - 4 - SIDEWALK,
  LOOP.east + 4 + SIDEWALK,
  LOOP.north - 4 - SIDEWALK,
  LOOP.south + 4 + SIDEWALK,
);
export const INNER = rect(
  LOOP.west + 4 + SIDEWALK,
  LOOP.east - 4 - SIDEWALK,
  LOOP.north + 4 + SIDEWALK,
  LOOP.south - 4 - SIDEWALK,
);

/** Place centrale (dallée), dans l'îlot de la boucle ; fontaine en son centre. */
export const PLAZA = rect(-16, 16, -14, 6);
export const FOUNTAIN: Point = [0, -4];
export const FOUNTAIN_RADIUS = 3.6;

export interface Parcel {
  id: BuildingId;
  /** Emprise de la parcelle : le bâtiment et tous ses abords y restent. */
  bounds: Rect;
}
/** Parcelles des six lieux (le bâtiment est décrit dans config.ts, ses abords ici). */
export const PARCELS: Parcel[] = [
  { id: 'profile', bounds: rect(-38, -12, -52, OUTER.z0) },
  { id: 'missions', bounds: rect(-12, 12, -50, OUTER.z0) },
  { id: 'project-3', bounds: rect(12, 38, -52, OUTER.z0) },
  { id: 'project-2', bounds: rect(-58, OUTER.x0, -26, 12) },
  { id: 'veolia', bounds: rect(OUTER.x1, 58, -12, 26) },
  { id: 'project-1', bounds: rect(-12, 12, OUTER.z1, 40) },
];
export const parcelOf = (id: BuildingId) => PARCELS.find((p) => p.id === id)!;

export type Zone = 'route' | 'trottoir' | 'place' | 'parcelle' | 'pelouse';
/** Nature du sol en (x, z). */
export function zoneAt(x: number, z: number): Zone {
  if (CARRIAGEWAYS.some((r) => inside(r, x, z))) return 'route';
  if (inside(OUTER, x, z) && !inside(INNER, x, z)) return 'trottoir';
  if (inside(PLAZA, x, z)) return 'place';
  if (PARCELS.some((p) => inside(p.bounds, x, z))) return 'parcelle';
  return 'pelouse';
}

/**
 * Voie des voitures : boucle dans le sens inverse des aiguilles d'une montre, sur la file de
 * droite (1,8 m du centre de la chaussée), virages arrondis.
 */
export function laneLoop(offset = 1.8): Point[] {
  const { west, east, north, south } = LOOP;
  const r = 4 + offset;
  const pts: Point[] = [];
  const arc = (cx: number, cz: number, a0: number, a1: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + ((a1 - a0) * i) / 6;
      pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  };
  // Centres des virages : coin intérieur de chaque tuile courbe.
  arc(east - 4, south - 4, Math.PI / 2, 0);
  arc(east - 4, north + 4, 0, -Math.PI / 2);
  arc(west + 4, north + 4, -Math.PI / 2, -Math.PI);
  arc(west + 4, south - 4, Math.PI, Math.PI / 2);
  return pts;
}
