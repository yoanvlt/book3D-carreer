/**
 * Le robot, du départ à l'arrivée (V8). Tout le vol est réglé ici, en une courte timeline de
 * poses-clés avec leurs courbes d'accélération ; robot (Robot.tsx) et caméra (CameraRig.tsx)
 * ne font que lire `flightPose` et `flightCamera`. Pur et testé (tests/v7.test.mjs).
 *
 * Aller : accroupi sur l'îlot → saut et allumage → arc au-dessus des toits, incliné dans les
 * virages → redressement et freinage → atterrissage (léger écrasement, anneau de poussière).
 * Retour : le chemin inverse jusqu'à l'îlot ; il se retourne une fois vers la ville avant de se
 * poser. Caméra : travelling de profil ou de trois quarts avant, à distance constante.
 */
import { Vector3, type PerspectiveCamera } from 'three';
import { buildings, WORLD } from './config';
import { heightAt } from './terrain';
import { edgeRadius } from './island';

export type V3 = [number, number, number];

/** Timeline (secondes) : chaque étape et sa durée. Total entre 3 et 3,5 s. */
export const STEPS = { crouch: 0.4, launch: 0.3, cruise: 1.9, settle: 0.45, land: 0.3 } as const;
export const FLIGHT = { total: Object.values(STEPS).reduce((a, b) => a + b, 0) };

/** Réglages de la pose : inclinaisons (radians), accroupissement, écrasement. */
export const POSE = { pitch: 0.38, flare: -0.22, bank: 0.42, crouch: 0.32, squash: 0.82 } as const;

/** Caméra de travelling : part de la hauteur d'écran occupée par le robot (2,5 m). */
export const TRACK = { screen: 0.15, robot: 2.5, height: 0.62, ahead: 0.2 } as const;

/** Courbes d'accélération. */
export const ease = {
  inOut: (t: number) => t * t * (3 - 2 * t),
  out: (t: number) => 1 - (1 - t) ** 3,
  in: (t: number) => t * t * t,
  /** Retour élastique doux (atterrissage). */
  back: (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2,
};

/** Accueil : position du robot en coordonnées d'écran normalisées et distance à la caméra. */
const HOME_POSE = {
  desktop: { x: 0.06, y: 0.4, distance: 20 },
  mobile: { x: 0.0, y: 0.45, distance: 20 },
};
const isNarrow = (width: number) => width < 760;

/** Point où l'îlot porte le robot, vu par la caméra d'accueil (réelle ou calculée). */
export function homePosition(camera: PerspectiveCamera, width: number): V3 {
  const pose = isNarrow(width) ? HOME_POSE.mobile : HOME_POSE.desktop;
  camera.updateMatrixWorld();
  const target = new Vector3(pose.x, pose.y, 0.5).unproject(camera);
  const dir = target.sub(camera.position).normalize();
  return camera.position.clone().addScaledVector(dir, pose.distance).toArray() as V3;
}

/** Point d'arrivée sur la place : le départ du joueur, au sol. */
export const landingPoint = (): V3 => [WORLD.spawn[0], heightAt(...WORLD.spawn), WORLD.spawn[1]];

/** Hauteur de survol : au-dessus du plus haut toit (cheminée de l'atelier comprise). */
const CRUISE = Math.max(16, ...buildings.map((b) => b.elevation + b.height)) + 9;

export type Path = [V3, V3, V3, V3];
/** Arc de `from` à `to` : monte presque à la verticale, passe au-dessus des toits, descend à la verticale de l'arrivée. */
export function flightPath(from: V3, to: V3): Path {
  const apex = Math.max(CRUISE, Math.min(from[1], to[1]) + 10);
  return [
    from,
    [from[0], Math.max(from[1], apex) + 6 + Math.max(0, to[1] - from[1]) * 0.4, from[2]],
    [to[0], Math.max(to[1], apex) + 2, to[2]],
    to,
  ];
}

/** Point et tangente de la courbe à s (0 à 1). */
export function pointOnFlight([a, b, c, d]: Path, s: number) {
  const u = 1 - s;
  const p = [0, 1, 2].map(
    (k) => u * u * u * a[k] + 3 * u * u * s * b[k] + 3 * u * s * s * c[k] + s * s * s * d[k],
  ) as V3;
  const dp = [0, 1, 2].map(
    (k) => 3 * u * u * (b[k] - a[k]) + 6 * u * s * (c[k] - b[k]) + 3 * s * s * (d[k] - c[k]),
  ) as V3;
  return { p, dp, heading: Math.atan2(dp[0], dp[2]) };
}

export interface Pose {
  /** Position des pieds. */
  p: V3;
  yaw: number;
  /** Inclinaison avant (positive : penché en avant) et roulis (virage). */
  pitch: number;
  roll: number;
  /** Accroupissement (0 à 1), écrasement vertical (1 : normal), poussée des propulseurs (0 à 1). */
  crouch: number;
  squash: number;
  thrust: number;
  /** Étape en cours et avancement (0 à 1) du vol. */
  step: keyof typeof STEPS;
  progress: number;
}

/** Étape de la timeline à l'instant `time` (secondes), avec l'avancement dans l'étape. */
export function stepAt(time: number): { step: keyof typeof STEPS; u: number } {
  let t = Math.max(0, time);
  for (const [step, d] of Object.entries(STEPS) as [keyof typeof STEPS, number][]) {
    if (t <= d) return { step, u: t / d };
    t -= d;
  }
  return { step: 'land', u: 1 };
}

/** Avancement sur la courbe (0 à 1) selon l'instant : départ lent, croisière, freinage. */
function along(time: number) {
  const { step, u } = stepAt(time);
  if (step === 'crouch') return 0;
  if (step === 'launch') return 0.05 * ease.in(u);
  if (step === 'cruise') return 0.05 + 0.88 * ease.inOut(u);
  if (step === 'settle') return 0.93 + 0.07 * ease.out(u);
  return 1;
}

/**
 * Pose du robot à l'instant `time` (secondes) d'un vol `path`. `startYaw` : orientation de départ ;
 * `endYaw` : orientation à l'arrivée (retour : tourné vers la ville).
 */
export function flightPose(path: Path, time: number, startYaw: number, endYaw: number): Pose {
  const { step, u } = stepAt(time);
  const s = along(time);
  const here = pointOnFlight(path, s);
  const ahead = pointOnFlight(path, Math.min(1, s + 0.04));
  const turn = Math.atan2(Math.sin(ahead.heading - here.heading), Math.cos(ahead.heading - here.heading));
  const travel = Math.atan2(path[3][0] - path[0][0], path[3][2] - path[0][2]);
  const lerpAngle = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
  const pose: Pose = {
    p: here.p,
    yaw: travel,
    pitch: 0,
    roll: 0,
    crouch: 0,
    squash: 1,
    thrust: 0,
    step,
    progress: time / FLIGHT.total,
  };
  if (step === 'crouch') {
    pose.yaw = lerpAngle(startYaw, travel, ease.inOut(u));
    pose.crouch = ease.inOut(Math.min(1, u * 1.4));
  } else if (step === 'launch') {
    pose.crouch = 1 - ease.out(u);
    pose.thrust = ease.out(u);
    pose.pitch = POSE.pitch * u * 0.5;
  } else if (step === 'cruise') {
    pose.thrust = 1;
    pose.pitch = POSE.pitch * (1 - 0.3 * Math.abs(u - 0.5) * 2);
    pose.roll = Math.max(-POSE.bank, Math.min(POSE.bank, -turn * 6));
  } else if (step === 'settle') {
    pose.thrust = 1 - 0.3 * u;
    pose.pitch = POSE.pitch * (1 - u) + POSE.flare * Math.sin(u * Math.PI);
    pose.yaw = lerpAngle(travel, endYaw, ease.inOut(u));
  } else {
    pose.yaw = endYaw;
    pose.squash = POSE.squash + (1 - POSE.squash) * ease.back(u);
    pose.crouch = (1 - ease.out(u)) * 0.6;
  }
  return pose;
}

/**
 * Caméra de travelling : de profil, légèrement en avant (jamais de dos), à la distance qui donne
 * au robot `TRACK.screen` de la hauteur d'écran ; du côté opposé à l'île, pour la garder en fond.
 */
export function flightCamera(pose: Pose, path: Path, fov: number): { position: V3; target: V3 } {
  const distance = TRACK.robot / (TRACK.screen * 2 * Math.tan((fov * Math.PI) / 360));
  const dir = new Vector3(path[3][0] - path[0][0], 0, path[3][2] - path[0][2]).normalize();
  const side = new Vector3(dir.z, 0, -dir.x);
  const center = new Vector3(pose.p[0], pose.p[1] + 1.2, pose.p[2]);
  // Côté opposé à l'île : la caméra regarde la ville derrière le robot.
  if (side.dot(new Vector3(center.x, 0, center.z)) < 0) side.negate();
  const offset = side
    .multiplyScalar(0.9)
    .addScaledVector(dir, TRACK.ahead)
    .add(new Vector3(0, TRACK.height, 0))
    .normalize();
  const position = center.clone().addScaledVector(offset, distance);
  // Jamais sous le relief de l'île.
  position.y = Math.max(position.y, heightAt(position.x, position.z) + 2);
  return { position: position.toArray() as V3, target: center.toArray() as V3 };
}

/** Vrai si le point est sous le terrain ou dans le volume d'un bâtiment (contrôle des trajets). @public */
export function collides([x, y, z]: V3, margin = 1): boolean {
  const r = Math.hypot(x, z);
  const angle = Math.atan2(z, x);
  if (r < edgeRadius(angle) + 2 && y < heightAt(x, z) + margin) return true;
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
