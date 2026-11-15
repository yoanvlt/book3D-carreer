/**
 * Chaussées et allées telles qu'elles sont dessinées (courbes de Catmull-Rom centripètes, comme
 * scene/Terrain.tsx), pour placer le décor et vérifier qu'il ne se pose pas sur le dallage.
 */
import { CatmullRomCurve3, Vector3 } from 'three';
import { approaches, streets } from './urban';
import type { Point } from './config';

export const STREET_WIDTH = 5.7;
export const APPROACH_WIDTH = 3.6;
/** Place centrale pavée : demi-largeurs en x et z, centrée sur l'origine. */
export const PLAZA = { halfX: 8, halfZ: 6 };

export interface Road {
  kind: 'street' | 'approach';
  width: number;
  /** Points échantillonnés le long de l'axe et tangentes unitaires (plan xz). */
  samples: { p: Point; t: Point }[];
}

/** Échantillonne l'axe d'une voie : mêmes paramètres que le maillage du terrain. */
export function sampleRoad(points: Point[], segments = 240): Road['samples'] {
  const curve = new CatmullRomCurve3(
    points.map(([x, z]) => new Vector3(x, 0, z)),
    false,
    'centripetal',
  );
  return Array.from({ length: segments + 1 }, (_, i) => {
    const p = curve.getPoint(i / segments);
    const t = curve.getTangent(i / segments);
    const n = Math.hypot(t.x, t.z) || 1;
    return { p: [p.x, p.z] as Point, t: [t.x / n, t.z / n] as Point };
  });
}

const roads: Road[] = [
  ...streets.map((points) => ({ kind: 'street' as const, width: STREET_WIDTH, samples: sampleRoad(points) })),
  ...approaches.map((points) => ({
    kind: 'approach' as const,
    width: APPROACH_WIDTH,
    samples: sampleRoad(points),
  })),
];

function segmentDistance(x: number, z: number, [ax, az]: Point, [bx, bz]: Point) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(x - ax - t * dx, z - az - t * dz);
}

/**
 * Distance signée au bord du dallage le plus proche : négative sur une chaussée, une allée ou la
 * place, positive dans l'herbe. `kinds` limite aux rues (« street ») ou aux allées.
 */
export function pavementClearance(
  x: number,
  z: number,
  kinds: Road['kind'][] = ['street', 'approach'],
): number {
  let best = Infinity;
  for (const road of roads) {
    if (!kinds.includes(road.kind)) continue;
    let d = Infinity;
    for (let i = 1; i < road.samples.length; i++)
      d = Math.min(d, segmentDistance(x, z, road.samples[i - 1].p, road.samples[i].p));
    best = Math.min(best, d - road.width / 2);
  }
  if (kinds.includes('street')) {
    const outside = Math.hypot(
      Math.max(0, Math.abs(x) - PLAZA.halfX),
      Math.max(0, Math.abs(z) - PLAZA.halfZ),
    );
    const inside = Math.max(Math.abs(x) - PLAZA.halfX, Math.abs(z) - PLAZA.halfZ);
    best = Math.min(best, outside > 0 ? outside : inside);
  }
  return best;
}

/** Point de l'axe d'une rue à la fraction u de sa longueur, avec sa tangente. */
export function alongStreet(index: number, u: number) {
  const samples = roads.filter((r) => r.kind === 'street')[index].samples;
  return samples[Math.round(u * (samples.length - 1))];
}
