/**
 * Placement du décor extérieur (haies, plaques d'égout, mobilier, arbres) et règles de pose :
 * chaque objet a une emprise (rayon) et une base posée au plus bas du terrain sous lui, pour
 * ne jamais flotter. tests/coherence.test.mjs vérifie qu'aucun objet n'est sur le dallage sans
 * y être destiné, ni hors du terrain.
 */
import { heightAt } from './terrain';
import { alongStreet } from './roads';
import { benches, bikeRacks, bins, bollards, fences, lamps, trees } from './landscape';
import type { Point } from './config';

/** Hauteur de pose : le point le plus bas du terrain sous l'emprise (centre et huit points du bord). */
export function groundY(x: number, z: number, radius = 0.3): number {
  let low = heightAt(x, z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    low = Math.min(low, heightAt(x + Math.cos(a) * radius, z + Math.sin(a) * radius));
  }
  return low;
}

/** Haies taillées : départ, nombre de blocs de 0,7 m, orientation (radians, sens trigonométrique en xz). */
const HEDGES: [number, number, number, number][] = [
  [-16, 9, 4, 0.1],
  [13, 5, 6, 0.3],
  [-8.87, -13.23, 3, 1],
  [15, -22, 6, 0.2],
  [10, 23, 8, 0.2],
  [-31, 28, 4, 0.8],
];
export const hedgeBlocks = HEDGES.flatMap(([x, z, count, angle]) =>
  Array.from({ length: count }, (_, i) => {
    const p: Point = [x + i * Math.cos(angle) * 0.7, z + i * Math.sin(angle) * 0.7];
    return { p, angle, h: 0.85 + ((i * 7) % 3) * 0.04, y: groundY(p[0], p[1], 0.45) };
  }),
);

/** Plaques d'égout : une par rue, sur la chaussée, à 1 m de l'axe. */
export const manholes: Point[] = [0.3, 0.55, 0.5, 0.45, 0.5].map((u, i) => {
  const { p, t } = alongStreet(i, u);
  return [p[0] - t[1] * 1.0, p[1] + t[0] * 1.0];
});

interface DecorItem {
  kind: string;
  p: Point;
  /** Rayon de l'emprise au sol. */
  radius: number;
  /** Hauteur de la base. */
  y: number;
  /** L'objet est fait pour le dallage (plaque d'égout, mobilier de la place). */
  paved: boolean;
}
const item = (kind: string, p: Point, radius: number, paved = false): DecorItem => ({
  kind,
  p,
  radius,
  y: groundY(p[0], p[1], radius),
  paved,
});
const onPlaza = ([x, z]: Point) => Math.abs(x) <= 8.2 && Math.abs(z) <= 6.2;

/** Tout le décor posé au sol, pour les contrôles de cohérence. @public */
export const decor: DecorItem[] = [
  ...hedgeBlocks.map((h) => item('haie', h.p, 0.45)),
  ...manholes.map((p) => item('plaque d’égout', p, 0.4, true)),
  ...benches.map((b) => item('banc', b.p, 0.8, onPlaza(b.p))),
  ...bins.map((b) => item('poubelle', b.p, 0.25, onPlaza(b.p))),
  ...bollards.map((p) => item('borne', p, 0.15, true)),
  ...lamps.map((p) => item('lampadaire', p, 0.25)),
  ...bikeRacks.map((r) => item('support à vélos', r.p, 1.2)),
  ...fences.flatMap(([a, b]) =>
    Array.from({ length: 5 }, (_, i) =>
      item('clôture', [a[0] + ((b[0] - a[0]) * i) / 4, a[1] + ((b[1] - a[1]) * i) / 4], 0.1),
    ),
  ),
  ...trees.map((t) => item('arbre', t.p, 0.3 * t.s)),
];
