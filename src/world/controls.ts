/**
 * Entrées du joueur, indépendantes de leur source. Le clavier et le joystick tactile écrivent
 * dans le même vecteur ; le contrôleur (scene/Controller.tsx) le lit à chaque image.
 */
import { allObstacles, type Vec3 } from './collision';
import { buildings, type BuildingId, type Point } from './config';
import { heightAt } from './terrain';

/** Joystick analogique : x vers la droite, y vers l'avant, dans le disque unité. */
export const stick = { x: 0, y: 0, run: false };
/** Demandes ponctuelles (saut) : un compteur incrémenté par le clavier ou le bouton tactile. */
export const actions = { jump: 0 };

export interface Intent {
  forward: number;
  right: number;
  run: boolean;
  /** Intensité de 0 à 1 : le joystick à mi-course fait marcher à mi-vitesse. */
  magnitude: number;
}

/** Combine clavier (crans de -1 à 1) et joystick, limité au disque unité. */
export function combineInput(keys: { forward: number; right: number; run: boolean }, pad = stick): Intent {
  let forward = keys.forward + pad.y;
  let right = keys.right + pad.x;
  const length = Math.hypot(forward, right);
  if (length > 1) {
    forward /= length;
    right /= length;
  }
  return { forward, right, run: keys.run || pad.run, magnitude: Math.min(1, length) };
}

/**
 * Vitesse souhaitée dans le monde. `yaw` est l'azimut de la caméra vue depuis le robot :
 * avancer éloigne le robot de la caméra.
 */
export function desiredVelocity(intent: Intent, yaw: number, speed: number): Point {
  const { forward, right } = intent;
  return [
    (right * Math.cos(yaw) - forward * Math.sin(yaw)) * speed,
    (-right * Math.sin(yaw) - forward * Math.cos(yaw)) * speed,
  ];
}

/** Saut du robot : purement visuel, il ne modifie ni les collisions ni la caméra. */
export const JUMP = { velocity: 6.2, gravity: 24 };
export function stepJump(jump: { height: number; velocity: number }, dt: number) {
  if (jump.height <= 0 && jump.velocity <= 0) return;
  jump.velocity -= JUMP.gravity * dt;
  jump.height += jump.velocity * dt;
  if (jump.height <= 0) {
    jump.height = 0;
    jump.velocity = 0;
  }
}

/**
 * Point du sol visé par un toucher : on avance le long du rayon caméra jusqu'à passer sous le
 * terrain (ou sous le sol d'un intérieur). Si le rayon rencontre d'abord un bâtiment, on le renvoie.
 */
export function groundHit(
  origin: Vec3,
  direction: Vec3,
  interior: boolean,
): { point: Point; building: BuildingId | null } | null {
  const step = 0.25;
  for (let t = 0; t < 400; t += step) {
    const x = origin.x + direction.x * t;
    const y = origin.y + direction.y * t;
    const z = origin.z + direction.z * t;
    if (!interior) {
      const hit = allObstacles.findIndex((o) => {
        if (y < o.bottom || y > o.top) return false;
        const c = Math.cos(o.angle);
        const s = Math.sin(o.angle);
        const dx = x - o.x;
        const dz = z - o.z;
        return Math.abs(dx * c - dz * s) < o.halfX && Math.abs(dx * s + dz * c) < o.halfZ;
      });
      if (hit >= 0 && hit < buildings.length) return { point: [x, z], building: buildings[hit].id };
    }
    if (y <= (interior ? 0 : heightAt(x, z))) return { point: [x, z], building: null };
  }
  return null;
}
