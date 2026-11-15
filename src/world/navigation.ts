import { blocked } from './collision';
import { WORLD, type Point } from './config';
import { distanceToRoad } from './urban';
/** @public Utilisé par les tests ou les scripts. */
export function clearSegment(a: Point, b: Point, radius = WORLD.robotRadius + 0.15) {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.25);
  for (let i = 0; i <= n; i++) {
    const t = n ? i / n : 0;
    if (blocked(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, radius)) return false;
  }
  return true;
}
/** A* on a 2-unit grid. Weighted road distance keeps journeys on the urban network. */
export function findRoute(start: Point, goal: Point): Point[] {
  const step = 2,
    key = (x: number, z: number) => `${x},${z}`,
    coords = (k: string) => k.split(',').map(Number) as Point;
  function anchor(p: Point) {
    let best: Point | null = null,
      d = Infinity;
    for (let dx = -2; dx <= 2; dx++)
      for (let dz = -2; dz <= 2; dz++) {
        const q: Point = [
          Math.round(p[0] / step) * step + dx * step,
          Math.round(p[1] / step) * step + dz * step,
        ];
        const n = Math.hypot(q[0] - p[0], q[1] - p[1]);
        if (n < d && clearSegment(p, q, 0.56)) {
          best = q;
          d = n;
        }
      }
    return best;
  }
  const a = anchor(start),
    b = anchor(goal);
  if (!a || !b) return [];
  const origin = key(...a),
    end = key(...b),
    open = new Set([origin]),
    g = new Map([[origin, 0]]),
    f = new Map([[origin, 0]]),
    parent = new Map<string, string>();
  const costs = new Map<string, number>();
  for (let iterations = 0; open.size && iterations < 6500; iterations++) {
    let current = origin,
      best = Infinity;
    for (const k of open) {
      const score = f.get(k) ?? Infinity;
      if (score < best) {
        best = score;
        current = k;
      }
    }
    if (current === end) {
      const result: Point[] = [goal, b];
      let k = end;
      while (parent.has(k)) {
        k = parent.get(k)!;
        result.push(coords(k));
      }
      result.push(start);
      result.reverse();
      return smoothRoute(
        result.filter((p, i) => !i || Math.hypot(p[0] - result[i - 1][0], p[1] - result[i - 1][1]) > 0.01),
      );
    }
    open.delete(current);
    const p = coords(current);
    for (const [dx, dz] of [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
      [2, 2],
      [-2, 2],
      [2, -2],
      [-2, -2],
    ]) {
      const q: Point = [p[0] + dx, p[1] + dz],
        k = key(...q);
      if (Math.hypot(...q) > WORLD.radius - 1 || !clearSegment(p, q, 0.68)) continue;
      let cost = costs.get(k);
      if (cost === undefined) {
        cost = 1 + Math.min(8, distanceToRoad(...q)) * 0.6;
        costs.set(k, cost);
      }
      const score = g.get(current)! + Math.hypot(dx, dz) * cost;
      if (score < (g.get(k) ?? Infinity)) {
        parent.set(k, current);
        g.set(k, score);
        f.set(k, score + Math.hypot(q[0] - b[0], q[1] - b[1]));
        open.add(k);
      }
    }
  }
  return [];
}

/**
 * Supprime les crans de la grille : un point intermédiaire est retiré quand la ligne droite
 * qui le contourne reste libre. Les raccourcis sont limités à 10 unités pour suivre les rues.
 */
function smoothRoute(route: Point[]): Point[] {
  if (route.length < 3) return route;
  const out = [route[0]];
  for (let i = 0; i < route.length - 1;) {
    let j = route.length - 1;
    while (
      j > i + 1 &&
      (Math.hypot(route[j][0] - route[i][0], route[j][1] - route[i][1]) > 10 ||
        !clearSegment(route[i], route[j]))
    )
      j--;
    out.push(route[j]);
    i = j;
  }
  return out;
}
