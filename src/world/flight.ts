/**
 * Le robot, fil conducteur (V7) : à l'accueil il plane devant la caméra, à côté du titre (au-dessus
 * de la carte d'accueil sur téléphone) ; à l'entrée il vole jusqu'à la place, au retour il remonte
 * planer à l'accueil. Trajet : courbe de Bézier cubique au-dessus des toits, qui ne traverse
 * jamais l'île. Tout est pur et testé (tests/v7.test.mjs).
 */
import { Vector3, type PerspectiveCamera } from 'three';
import { buildings, WORLD } from './config';
import { heightAt } from './terrain';
import { edgeRadius } from './island';

export type V3 = [number, number, number];

/** Durées (s) : vol, puis atterrissage ; le tout tient en 2,5 s. Passables (Espace, clic). */
export const FLIGHT = { duration: 2.1, landing: 0.3, total: 2.4 };

/**
 * Place du robot à l'accueil, en coordonnées d'écran normalisées (le centre vaut 0, ±1 aux bords,
 * vue décalée comprise) et en distance à la caméra.
 */
const HOME_POSE = {
  desktop: { x: 0.07, y: 0.02, distance: 12 },
  mobile: { x: 0.0, y: 0.3, distance: 13 },
};
const isNarrow = (width: number) => width < 760;

/** Point où planer, vu par la caméra d'accueil (réelle ou calculée par homeCamera). */
export function homePosition(camera: PerspectiveCamera, width: number): V3 {
  const pose = isNarrow(width) ? HOME_POSE.mobile : HOME_POSE.desktop;
  camera.updateMatrixWorld();
  const target = new Vector3(pose.x, pose.y, 0.5).unproject(camera);
  const dir = target.sub(camera.position).normalize();
  return camera.position.clone().addScaledVector(dir, pose.distance).toArray() as V3;
}

/** Point d'arrivée sur la place : le départ du joueur, au sol. */
export const landingPoint = (): V3 => [WORLD.spawn[0], heightAt(...WORLD.spawn), WORLD.spawn[1]];

/** Hauteur de survol : au-dessus du plus haut toit (antennes et girouette comprises). */
const CRUISE = Math.max(...buildings.map((b) => b.elevation + b.height)) + 8;

/**
 * Courbe d'un vol de `from` à `to`. Le départ monte d'abord (décollage), le passage se fait au-dessus
 * des toits, l'arrivée descend à la verticale (atterrissage) ; à l'aller comme au retour.
 */
export function flightPath(from: V3, to: V3, landing = true): [V3, V3, V3, V3] {
  const high = Math.max(CRUISE, landing ? from[1] : to[1]);
  if (landing)
    return [
      from,
      [from[0] * 0.55 + to[0] * 0.45, high + 6, from[2] * 0.55 + to[2] * 0.45],
      [to[0], CRUISE, to[2]],
      to,
    ];
  return [
    from,
    [from[0], CRUISE, from[2]],
    [from[0] * 0.45 + to[0] * 0.55, high + 6, from[2] * 0.45 + to[2] * 0.55],
    to,
  ];
}

/** Point de la courbe à t (0 à 1) et direction de vol (cap dans le plan xz). */
export function pointOnFlight([a, b, c, d]: [V3, V3, V3, V3], t: number) {
  const u = 1 - t;
  const p = [0, 1, 2].map(
    (k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k],
  ) as V3;
  const dp = [0, 1, 2].map(
    (k) => 3 * u * u * (b[k] - a[k]) + 6 * u * t * (c[k] - b[k]) + 3 * t * t * (d[k] - c[k]),
  );
  return { p, heading: Math.atan2(dp[0], dp[2]) };
}

/** Vrai si le point est sous le terrain ou dans le volume d'un bâtiment (contrôle des trajets). @public */
export function collides([x, y, z]: V3, margin = 1): boolean {
  const r = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  if (r < edgeRadius(angle) + 2 && y < (r < 60 ? heightAt(x, z) : 0) + margin) return true;
  // Sous l'île (cône rocheux jusqu'à -40) : interdit dans tout le disque de l'île.
  if (r < edgeRadius(angle) + 2 && y < 0) return true;
  return buildings.some((b) => {
    const dx = x - b.position[0];
    const dz = z - b.position[1];
    const lx = dx * Math.cos(b.rotation) - dz * Math.sin(b.rotation);
    const lz = dx * Math.sin(b.rotation) + dz * Math.cos(b.rotation);
    return (
      Math.abs(lx) < b.size[0] / 2 + margin &&
      Math.abs(lz) < b.size[1] / 2 + margin &&
      y < b.elevation + b.height + margin + 4
    );
  });
}
