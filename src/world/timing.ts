/**
 * Durées des séquences automatiques (secondes). Cibles V5 :
 * trajet ≤ 6 s quel que soit le lieu, entrer ≤ 2,5 s, sortir ≤ 2 s, présentation 4 s.
 * Vérifiées par tests/v5.test.mjs et mesurées par scripts/temps-morts.mjs.
 */
export const TIMING = {
  /** Trajet extérieur : vitesse de croisière visée, durée minimale et maximale. */
  travelSpeed: 8.5,
  travelMin: 0.6,
  travelMax: 5.2,
  /** Trajet intérieur (vers une station ou la sortie). */
  indoorSpeed: 7,
  indoorMin: 0.35,
  indoorMax: 1.4,
  /** Porte : approche (au plus), ouverture, franchissement, raccord, émergence, fermeture. */
  approach: 0.45,
  opening: 0.3,
  crossing: 0.45,
  handoff: 0.2,
  emerging: 0.45,
  closing: 0.2,
  /** Sortie demandée loin de la porte : fondu, puis le robot est replacé au seuil. */
  cut: 0.3,
  /** Présentation d'un bâtiment, puis retour de caméra. */
  showcase: 3.2,
  showcaseReturn: 0.8,
} as const;

/** Profil de vitesse en trapèze : accélération, croisière, freinage. u ∈ [0, 1] → distance ∈ [0, 1]. */
export function trapezoid(u: number, accel = 0.2, brake = 0.25): number {
  const t = Math.max(0, Math.min(1, u));
  const peak = 1 / (1 - accel / 2 - brake / 2);
  if (t < accel) return (peak * t * t) / (2 * accel);
  if (t < 1 - brake) return peak * (accel / 2 + (t - accel));
  return 1 - (peak * (1 - t) * (1 - t)) / (2 * brake);
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Durée d'un trajet automatique de longueur donnée. */
export function travelDuration(length: number, indoor: boolean): number {
  return indoor
    ? clamp(length / TIMING.indoorSpeed, TIMING.indoorMin, TIMING.indoorMax)
    : clamp(length / TIMING.travelSpeed, TIMING.travelMin, TIMING.travelMax);
}

/** Longueurs cumulées d'une ligne brisée. */
export function cumulative(points: [number, number][]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++)
    out.push(out[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return out;
}

/** Point situé à la distance s le long de la ligne brisée, et direction locale. */
export function pointAlong(
  points: [number, number][],
  lengths: number[],
  s: number,
): { p: [number, number]; heading: number } {
  const total = lengths.at(-1) ?? 0;
  const d = clamp(s, 0, total);
  let i = 1;
  while (i < points.length - 1 && lengths[i] < d) i++;
  const a = points[i - 1] ?? points[0];
  const b = points[i] ?? a;
  const span = lengths[i] - lengths[i - 1] || 1;
  const k = clamp((d - lengths[i - 1]) / span, 0, 1);
  return {
    p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k],
    heading: Math.atan2(b[0] - a[0], b[1] - a[1]),
  };
}
