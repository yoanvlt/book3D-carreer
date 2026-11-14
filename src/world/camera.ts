import { cameraFraction, allObstacles, type Vec3 } from './collision';
import { heightAt } from './terrain';
import { CAMERA } from './config';
import { ROOM } from './narrative';

/** Caméra intérieure : rayon de l'orbite et volume libre de la salle (au-dessus des écrans). */
export const INTERIOR_CAMERA = {
  radius: 7.5,
  height: 6.2,
  maxX: ROOM.halfWidth - 2.8,
  maxZ: ROOM.halfDepth - 1.4,
};

export const cameraSettings = { minimumDistance: 9, clearance: 0.65 };
export function cameraPoint(target: Vec3, yaw: number, pitch: number, distance: number): Vec3 {
  return {
    x: target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    y: target.y + Math.sin(pitch) * distance,
    z: target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
  };
}
const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
/** Prefer a full boom at a nearby azimuth, then an elevated view. Never a first-person retraction. */
export function chooseCamera(
  target: Vec3,
  yaw: number,
  pitch: number,
  distance: number,
  previousYaw: number,
) {
  let best = {
    point: cameraPoint(target, previousYaw, 1.35, distance),
    yaw: previousYaw,
    pitch: 1.35,
    score: Infinity,
  };
  for (const p of [pitch, Math.max(pitch, 0.85), 1.16, 1.4])
    for (const offset of [
      angleDelta(previousYaw, yaw),
      0,
      0.35,
      -0.35,
      0.7,
      -0.7,
      1.15,
      -1.15,
      1.6,
      -1.6,
      2.2,
      -2.2,
      Math.PI,
    ]) {
      const a = yaw + offset,
        point = cameraPoint(target, a, p, Math.max(cameraSettings.minimumDistance, distance));
      if (cameraFraction(target, point, cameraSettings.clearance) < 0.995) continue;
      const score =
        Math.abs(offset) * 1.2 +
        Math.abs(angleDelta(a, previousYaw)) * 0.65 +
        (p - pitch) * 3 -
        (Math.abs(angleDelta(a, previousYaw)) < 0.001 ? 0.16 : 0);
      if (score < best.score) best = { point, yaw: a, pitch: p, score };
    }
  return best;
}
/** Sweep the camera body itself, not only its line of sight. Slide rather than snap to the robot. */
export function moveCamera(from: Vec3, to: Vec3): Vec3 {
  const out = { ...from };
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z) / 0.15));
  for (let i = 0; i < n; i++)
    for (const axis of ['y', 'x', 'z'] as const) {
      const candidate = { ...out, [axis]: out[axis] + (to[axis] - from[axis]) / n };
      if (!cameraBodyBlocked(candidate)) out[axis] = candidate[axis];
    }
  out.y = Math.max(out.y, heightAt(out.x, out.z) + cameraSettings.clearance);
  return out;
}
export function cameraBodyBlocked(p: Vec3) {
  if (p.y < heightAt(p.x, p.z) + cameraSettings.clearance) return true;
  return allObstacles.some((o) => {
    const c = Math.cos(o.angle),
      s = Math.sin(o.angle),
      dx = p.x - o.x,
      dz = p.z - o.z;
    return (
      Math.hypot(
        Math.max(0, Math.abs(dx * c - dz * s) - o.halfX),
        Math.max(0, o.bottom - p.y, p.y - o.top),
        Math.max(0, Math.abs(dx * s + dz * c) - o.halfZ),
      ) < cameraSettings.clearance
    );
  });
}
/** The room is convex: full-distance orbit candidates and interpolation stay inside its walls. */
export function chooseInteriorCamera(x: number, z: number, yaw: number, previousYaw: number) {
  let best = { x: 0, y: 6.2, z: 0, yaw, score: Infinity };
  for (const a of [previousYaw, ...Array.from({ length: 32 }, (_, i) => yaw + (i * Math.PI) / 16)]) {
    const px = x + Math.sin(a) * INTERIOR_CAMERA.radius,
      pz = z + Math.cos(a) * INTERIOR_CAMERA.radius;
    if (Math.abs(px) > INTERIOR_CAMERA.maxX || Math.abs(pz) > INTERIOR_CAMERA.maxZ) continue;
    const score =
      Math.abs(angleDelta(a, yaw)) +
      Math.abs(angleDelta(a, previousYaw)) * 0.35 -
      (Math.abs(angleDelta(a, previousYaw)) < 0.001 ? 0.12 : 0);
    if (score < best.score) best = { x: px, y: 6.2, z: pz, yaw: a, score };
  }
  return best;
}

/** Avoid a chord through the robot when the user reverses the camera in a room. */
export function moveInteriorCamera(from: Vec3, to: Vec3, target: Vec3, dt: number): Vec3 {
  const dx = to.x - from.x,
    dz = to.z - from.z,
    length = dx * dx + dz * dz;
  const u = length
    ? Math.max(0, Math.min(1, ((target.x - from.x) * dx + (target.z - from.z) * dz) / length))
    : 0;
  const clearance = Math.hypot(from.x + dx * u - target.x, from.z + dz * u - target.z),
    alpha = 1 - Math.exp(-5 * dt);
  if (clearance >= 6) return { x: from.x + dx * alpha, y: 6.2, z: from.z + dz * alpha };
  const start = Math.atan2(from.x - target.x, from.z - target.z),
    end = Math.atan2(to.x - target.x, to.z - target.z),
    short = angleDelta(end, start);
  const radius = Math.max(6, Math.min(8, Math.hypot(from.x - target.x, from.z - target.z)));
  const point = (angle: number, r = radius) => ({
    x: target.x + Math.sin(angle) * r,
    y: 6.2,
    z: target.z + Math.cos(angle) * r,
  });
  const inside = (p: Vec3) => Math.abs(p.x) <= INTERIOR_CAMERA.maxX && Math.abs(p.z) <= INTERIOR_CAMERA.maxZ;
  for (const arc of [short, short > 0 ? short - 2 * Math.PI : short + 2 * Math.PI]) {
    if (!Array.from({ length: 65 }, (_, i) => point(start + (arc * i) / 64)).every(inside)) continue;
    const a = start + Math.sign(arc) * Math.min(Math.abs(arc), dt * 1.25);
    const p = point(a),
      originalRadius = Math.hypot(from.x - target.x, from.z - target.z);
    const gentle = point(a, originalRadius + (radius - originalRadius) * alpha);
    return inside(gentle) ? gentle : p;
  }
  // At a boundary a translating target can invalidate the previous orbit.
  // The room's convex free camera volume permits this bounded fallback.
  return { x: from.x + dx * alpha, y: 6.2, z: from.z + dz * alpha };
}

/**
 * Cadrage effectif selon le format d'écran. En portrait (largeur / hauteur < 0,8), la caméra
 * recule et monte ; les réglages du visiteur (molette, glisser) restent relatifs.
 */
export function framing(aspect: number, distance: number, pitch: number) {
  if (aspect >= CAMERA.portrait.below) return { distance, pitch };
  return {
    distance: distance * (CAMERA.portrait.distance / CAMERA.distance),
    pitch: Math.min(CAMERA.maxElevation, pitch + (CAMERA.portrait.elevation - CAMERA.elevation)),
  };
}
