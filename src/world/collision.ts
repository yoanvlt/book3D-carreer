import { buildings, WORLD, type Point } from './config';
import { heightAt } from './terrain';
import { trees, benches, lamps, bollards, bikeRacks, fences } from './landscape';
interface Obstacle {
  x: number;
  z: number;
  halfX: number;
  halfZ: number;
  angle: number;
  bottom: number;
  top: number;
}
/** @public Utilisé par les tests ou les scripts. */
export const obstacles: Obstacle[] = buildings.map((b) => ({
  x: b.position[0],
  z: b.position[1],
  halfX: b.size[0] / 2 + 0.25,
  halfZ: b.size[1] / 2 + 0.25,
  angle: b.rotation,
  bottom: b.elevation - 0.2,
  top: b.elevation + b.height + 0.8,
}));
const props: Obstacle[] = [
  { x: 0, z: 0, halfX: 2.6, halfZ: 2.6, angle: 0, bottom: 0.65, top: 5.6 },
  {
    x: -43,
    z: 20,
    halfX: 2.4,
    halfZ: 1.9,
    angle: -0.3,
    bottom: heightAt(-43, 20),
    top: heightAt(-43, 20) + 3.8,
  },
  { x: -8, z: 5, halfX: 0.4, halfZ: 0.4, angle: 0, bottom: 0.65, top: 3.8 },
];
export const allObstacles = [
  ...obstacles,
  ...props,
  ...trees.map((t) => ({
    x: t.p[0],
    z: t.p[1],
    halfX: 0.25 * t.s,
    halfZ: 0.25 * t.s,
    angle: 0,
    bottom: heightAt(...t.p),
    top: heightAt(...t.p) + 3 * t.s,
  })),
  ...benches.map((b) => ({
    x: b.p[0],
    z: b.p[1],
    halfX: 1.5,
    halfZ: 0.45,
    angle: b.angle,
    bottom: heightAt(...b.p),
    top: heightAt(...b.p) + 1.3,
  })),
  ...bollards.map((p) => ({ x: p[0], z: p[1], halfX: 0.15, halfZ: 0.15, angle: 0, bottom: 0.65, top: 1.6 })),
  ...bikeRacks.map((r) => ({
    x: r.p[0],
    z: r.p[1],
    halfX: 1.6,
    halfZ: 0.5,
    angle: r.angle,
    bottom: heightAt(...r.p),
    top: heightAt(...r.p) + 1.1,
  })),
  ...fences.map(([a, b]) => ({
    x: (a[0] + b[0]) / 2,
    z: (a[1] + b[1]) / 2,
    halfX: Math.hypot(b[0] - a[0], b[1] - a[1]) / 2,
    halfZ: 0.08,
    angle: -Math.atan2(b[1] - a[1], b[0] - a[0]),
    bottom: heightAt(...a),
    top: heightAt(...a) + 1,
  })),
  ...lamps.map((p) => ({
    x: p[0],
    z: p[1],
    halfX: 0.13,
    halfZ: 0.13,
    angle: 0,
    bottom: heightAt(...p),
    top: heightAt(...p) + 4,
  })),
];
export function blocked(x: number, z: number, radius = WORLD.robotRadius): boolean {
  if (Math.hypot(x, z) > WORLD.radius) return true;
  return allObstacles.some((o) => {
    const dx = x - o.x,
      dz = z - o.z,
      c = Math.cos(o.angle),
      s = Math.sin(o.angle);
    const lx = dx * c - dz * s,
      lz = dx * s + dz * c;
    return Math.hypot(Math.max(Math.abs(lx) - o.halfX, 0), Math.max(Math.abs(lz) - o.halfZ, 0)) < radius;
  });
}
/** Sub-stepping plus axis sliding prevents tunneling even at a low frame rate. */
/**
 * Normale de contact au point (x, z) : direction qui éloigne de l'obstacle le plus pénétré,
 * calculée dans le repère tourné de chaque boîte. Sert à glisser le long des murs en biais.
 */
function contactNormal(x: number, z: number, radius = WORLD.robotRadius): Point | null {
  let best: Point | null = null;
  let depth = -Infinity;
  const r = Math.hypot(x, z);
  if (r > WORLD.radius - radius) {
    best = [-x / r, -z / r];
    depth = r - (WORLD.radius - radius);
  }
  for (const o of allObstacles) {
    const dx = x - o.x,
      dz = z - o.z,
      c = Math.cos(o.angle),
      s = Math.sin(o.angle);
    const lx = dx * c - dz * s,
      lz = dx * s + dz * c;
    const cx = Math.max(-o.halfX, Math.min(o.halfX, lx)),
      cz = Math.max(-o.halfZ, Math.min(o.halfZ, lz));
    let nx = lx - cx,
      nz = lz - cz;
    const d = Math.hypot(nx, nz);
    let penetration = radius - d;
    if (d < 1e-6) {
      // Centre dans la boîte : sortir par la face la plus proche.
      const px = o.halfX - Math.abs(lx),
        pz = o.halfZ - Math.abs(lz);
      [nx, nz] = px < pz ? [Math.sign(lx) || 1, 0] : [0, Math.sign(lz) || 1];
      penetration = radius + Math.min(px, pz);
    } else {
      nx /= d;
      nz /= d;
    }
    if (penetration > depth && penetration > 0) {
      depth = penetration;
      // Retour du repère local au monde (rotation inverse).
      best = [nx * c + nz * s, -nx * s + nz * c];
    }
  }
  return best;
}

/**
 * Sous-pas et glissement : un déplacement qui rencontre un obstacle est projeté sur sa
 * tangente, y compris pour les bâtiments et les bancs tournés ; à défaut, glissement par axe.
 */
export function moveWithCollisions(position: Point, delta: Point): Point {
  let [x, z] = position;
  const steps = Math.max(1, Math.ceil(Math.hypot(...delta) / 0.2));
  for (let i = 0; i < steps; i++) {
    const dx = delta[0] / steps,
      dz = delta[1] / steps;
    if (!blocked(x + dx, z + dz)) {
      x += dx;
      z += dz;
      continue;
    }
    const n = contactNormal(x + dx, z + dz);
    if (n) {
      const dot = dx * n[0] + dz * n[1];
      if (dot < 0) {
        const tx = dx - dot * n[0],
          tz = dz - dot * n[1];
        if (!blocked(x + tx, z + tz)) {
          x += tx;
          z += tz;
          continue;
        }
      }
    }
    if (!blocked(x + dx, z)) x += dx;
    if (!blocked(x, z + dz)) z += dz;
  }
  return [x, z];
}
export type Vec3 = { x: number; y: number; z: number };
/** Swept sphere/OBB slab intersection, including a near-plane clearance. */
export function cameraFraction(from: Vec3, to: Vec3, clearance = 0.7): number {
  let fraction = 1;
  for (const o of allObstacles) {
    const c = Math.cos(o.angle),
      s = Math.sin(o.angle);
    const start = [(from.x - o.x) * c - (from.z - o.z) * s, from.y, (from.x - o.x) * s + (from.z - o.z) * c];
    const d = [
      (to.x - from.x) * c - (to.z - from.z) * s,
      to.y - from.y,
      (to.x - from.x) * s + (to.z - from.z) * c,
    ];
    // If the player is closer than the camera radius to a wall, shrink only
    // this sweep's margin. Otherwise the origin is inside the padded box and
    // the first hit would be discarded, letting the camera cross the wall.
    const outside = Math.max(
      Math.abs(start[0]) - o.halfX,
      Math.abs(start[2]) - o.halfZ,
      o.bottom - start[1],
      start[1] - o.top,
    );
    const pad = Math.min(clearance, Math.max(0.025, outside - 0.025));
    const min = [-o.halfX - pad, o.bottom - pad, -o.halfZ - pad],
      max = [o.halfX + pad, o.top + pad, o.halfZ + pad];
    let near = 0,
      far = 1,
      hit = true;
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-8) {
        if (start[k] < min[k] || start[k] > max[k]) {
          hit = false;
          break;
        }
      } else {
        let a = (min[k] - start[k]) / d[k],
          b = (max[k] - start[k]) / d[k];
        if (a > b) [a, b] = [b, a];
        near = Math.max(near, a);
        far = Math.min(far, b);
        if (near > far) {
          hit = false;
          break;
        }
      }
    }
    if (hit && far > 0 && near > 0) fraction = Math.min(fraction, Math.max(0.02, near - 0.015));
  }
  // March along the ray for the analytic terrain, not only at the endpoint.
  for (let t = 0.04; t <= fraction; t += 0.025) {
    const x = from.x + (to.x - from.x) * t,
      z = from.z + (to.z - from.z) * t,
      y = from.y + (to.y - from.y) * t;
    if (y < heightAt(x, z) + clearance) {
      fraction = Math.min(fraction, Math.max(0.03, t - 0.025));
      break;
    }
  }
  return fraction;
}
