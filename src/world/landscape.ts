import { buildings, type Point } from './config';
import { distanceToRoad } from './urban';
/** Hand-composed groves: outer edge, street corners and pockets between destinations. */
export const trees: { p: Point; s: number; kind: number }[] = [
  [-49, 18, 1.4, 0],
  [-49, 25, 1.2, 1],
  [-47, 31, 1.3, 0],
  [-42, 40, 1.6, 0],
  [-35, 44, 1.1, 2],
  [-25, 46, 1.3, 0],
  [-19, 42, 1.2, 1],
  [-4, 45, 1.5, 0],
  [4, 43, 1.3, 0],
  [11, 45, 1.1, 2],
  [24, 46, 1.2, 0],
  [45, 37, 1.2, 0],
  [48, 19, 1.1, 2],
  [50, 5, 1.4, 0],
  [48, -10, 1.4, 1],
  [-2, -48, 1.2, 0],
  [8, -46, 1.5, 0],
  [15, -43, 1.1, 2],
  [-20, -44, 1.5, 0],
  [-30, -45, 1.3, 1],
  [-45, -15, 1.4, 0],
  [-48, -4, 1.1, 2],
  [-42, -21, 1.2, 0],
  [-39, -26, 1.5, 0],
  [-43, -32, 1.1, 1],
  [-34, -36, 1.3, 2],
  [-28, -36, 1, 0],
  [-19, -38, 1.2, 0],
  [-11, -42, 1.1, 2],
  [15, -36, 1.2, 0],
  [21, -35, 1.4, 1],
  [29, -34, 1.2, 0],
  [38, -28, 1.3, 2],
  [41, -21, 1.1, 0],
  [44, -9, 1.2, 0],
  [43, -2, 1.4, 1],
  [44, 9, 1.2, 2],
  [40, 23, 1.1, 0],
  [36, 31, 1.3, 0],
  [28, 37, 1.1, 2],
  [20, 38, 1.2, 0],
  [15, 43, 0.85, 0],
  [-14, 42, 1.3, 0],
  [-22, 37, 1.4, 1],
  [-31, 32, 1.2, 0],
  [-40, 22, 1.3, 2],
  [-42, 15, 1.15, 0],
  [-43, 4, 1.4, 0],
  [-42, -5, 1.2, 1],
  [-36, -1, 0.85, 0],
  [-16, 5, 0.9, 0],
  [-18, -4, 0.85, 2],
  [-12, -16, 0.9, 0],
  [-10, -9, 0.75, 1],
  [11, -14, 0.9, 0],
  [17, -8, 0.85, 2],
  [17, 4, 0.85, 0],
  [11, 16, 0.8, 1],
  [-15, 26, 0.85, 0],
  [-12, 31, 0.95, 2],
  [10, 29, 0.85, 0],
  [33, 7, 0.75, 1],
  [-33, 22, 0.8, 0],
  [-30, 25, 0.7, 0],
]
  .map(([x, z, s, kind]) => ({ p: [x, z] as Point, s, kind }))
  .filter(
    (t) =>
      distanceToRoad(...t.p) > 3.8 &&
      buildings.every(
        (b) => Math.hypot(t.p[0] - b.position[0], t.p[1] - b.position[1]) > Math.hypot(...b.size) / 2 + 2,
      ),
  );
export const benches: { p: Point; angle: number }[] = [
  { p: [-6, 5], angle: -0.6 },
  { p: [6, 5], angle: 0.6 },
  { p: [-7, -5], angle: 2.2 },
  { p: [8, -4], angle: -2.1 },
  { p: [-35, 5], angle: 1.5 },
  { p: [15, 24], angle: -0.3 },
  { p: [14, -27], angle: 0 },
];
export const lamps: Point[] = [
  [-11, 9],
  [12, 8],
  [-12, -8],
  [10, -10],
  [-30, 4],
  [-34, -9],
  [-17, -24],
  [10, -23],
  [33, -4],
  [35, 12],
  [17, 27],
  [-16, 23],
];

/** Pelouses fleuries et plates-bandes : centre, demi-axes et angle (x, z, rx, rz, angle). */
export const gardens: [number, number, number, number, number][] = [
  [-41, 39, 9, 5, -0.4],
  [-25, 44, 13, 4, 0],
  [4, 45, 13, 4, 0.1],
  [46, 18, 4, 15, -0.1],
  [-48, 20, 5, 13, 0],
  [5, -47, 12, 4, 0.2],
  [-41, -23, 4, 11, -0.3],
  [-25, -37, 11, 3, 0.05],
  [23, -35, 11, 4, 0.3],
  [43, -5, 4, 12, 0],
  [38, 28, 4, 7, -0.55],
  [24, 39, 9, 3.6, 0],
  [-23, 37, 8, 4, -0.5],
  [-42, 12, 3.5, 10, 0],
  [-16, -5, 3.2, 4.4, -0.2],
  [16, 3, 3.3, 4, 0.3],
  [-13, -17, 2.5, 3, 0],
];

/** Poubelle à l'extrémité de chaque banc (dans le volume de collision du banc, à 1,9 m). */
export const bins: { p: Point; angle: number }[] = benches.map((b) => ({
  p: [b.p[0] + Math.cos(b.angle) * 1.9, b.p[1] - Math.sin(b.angle) * 1.9] as Point,
  angle: b.angle,
}));
/** Bornes sur les bords nord et sud de la place. */
export const bollards: Point[] = [
  [-2.6, -5.75],
  [2.6, -5.75],
  [-2.6, 5.75],
  [2.6, 5.75],
];
/** Supports à vélos : position, orientation, couleurs des vélos garés. */
export const bikeRacks: { p: Point; angle: number; bikes: string[] }[] = [
  { p: [-5.5, -7.8], angle: 0, bikes: ['#3f9c88', '#d64a3f'] },
  { p: [5.2, 7.9], angle: 0, bikes: ['#e8ad45'] },
];
/** Clôtures basses le long des pelouses du nord. */
export const fences: [Point, Point][] = [
  [
    [-36, 40.3],
    [-15, 40.3],
  ],
  [
    [-7, 41.6],
    [14, 41.6],
  ],
];
/** Plaques de rue portées par certains lampadaires (indice dans lamps). */
export const streetPlates: Record<number, string> = {
  0: 'Place centrale',
  6: 'Rue des Ateliers',
  9: 'Allée de Veolia',
};
