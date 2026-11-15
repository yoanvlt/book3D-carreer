/**
 * Réseau piéton et routier (V8), dérivé du plan : axes de la boucle de rues, allées de la place
 * et accès aux portes. Sert à la navigation (coût du chemin), au plan (Map.tsx) et aux tests.
 */
import { buildings, doorPoint, entrance, type Point } from './config';
import { FOUNTAIN, LOOP } from './plan';

const { west, east, north, south } = LOOP;
/** Axes des rues : la boucle, fermée. */
export const streets: Point[][] = [
  [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
    [west, north],
  ],
  // Allées de la place : nord-sud et est-ouest, par la fontaine.
  [
    [0, north],
    [FOUNTAIN[0], FOUNTAIN[1] - 6],
  ],
  [
    [0, FOUNTAIN[1] + 6],
    [0, south],
  ],
  [
    [west, FOUNTAIN[1]],
    [FOUNTAIN[0] - 6, FOUNTAIN[1]],
  ],
  [
    [FOUNTAIN[0] + 6, FOUNTAIN[1]],
    [east, FOUNTAIN[1]],
  ],
];

/** Accès : de la rue la plus proche au seuil de chaque porte, en ligne droite. */
export const approaches = buildings.map((b) => {
  const door = entrance(b);
  const [dx, dz] = [Math.sin(b.rotation), Math.cos(b.rotation)];
  // La rue est droit devant la porte : on prolonge l'axe de la porte jusqu'à la boucle.
  const reach =
    Math.abs(dx) > 0.5
      ? Math.abs(door[0] - (dx > 0 ? west : east))
      : Math.abs(door[1] - (dz > 0 ? north : south));
  return [[door[0] + dx * reach, door[1] + dz * reach] as Point, door, doorPoint(b, 0.7)];
});

export const roads = [...streets, ...approaches];

export function distanceToRoad(x: number, z: number) {
  let best = Infinity;
  for (const points of roads)
    for (let i = 1; i < points.length; i++) {
      const [ax, az] = points[i - 1],
        [bx, bz] = points[i],
        dx = bx - ax,
        dz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
      best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
    }
  return best;
}
