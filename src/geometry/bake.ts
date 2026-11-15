/**
 * Lumière précalculée (V8), une seule fois au chargement, dans un worker : le monde est statique.
 * Tout ce qui fait de l'ombre est rastérisé dans un champ de hauteurs (0,5 m). Pour chaque point :
 * - soleil : quelques rayons vers le soleil, légèrement dispersés (ombre douce) ;
 * - occlusion ambiante : horizon dans 8 directions, au-dessus du plan tangent du point.
 * Sorties : lumière par sommet (bâtiments, île) et texture de lumière du sol (terrain, routes,
 * herbe, objets mobiles). Approximation 2,5D : suffisante vue d'en haut, comme une maquette.
 */
import type { MeshData } from './mesh';

export const FIELD = { min: -76, extent: 152, cell: 0.5 } as const;
const RES = Math.round(FIELD.extent / FIELD.cell);

export class HeightField {
  readonly data = new Float32Array(RES * RES).fill(-50);
  readonly res = RES;

  private index(x: number, z: number) {
    const i = Math.floor((x - FIELD.min) / FIELD.cell);
    const j = Math.floor((z - FIELD.min) / FIELD.cell);
    return i < 0 || j < 0 || i >= RES || j >= RES ? -1 : j * RES + i;
  }

  height(x: number, z: number) {
    const k = this.index(x, z);
    return k < 0 ? -50 : this.data[k];
  }

  /** Relève la hauteur d'une case (garde le maximum). */
  raise(x: number, z: number, y: number) {
    const k = this.index(x, z);
    if (k >= 0 && y > this.data[k]) this.data[k] = y;
  }

  /** Sol : fonction de hauteur échantillonnée au centre de chaque case. */
  ground(heightAt: (x: number, z: number) => number, within: (x: number, z: number) => boolean) {
    for (let j = 0; j < RES; j++)
      for (let i = 0; i < RES; i++) {
        const x = FIELD.min + (i + 0.5) * FIELD.cell;
        const z = FIELD.min + (j + 0.5) * FIELD.cell;
        if (within(x, z)) this.raise(x, z, heightAt(x, z));
      }
  }

  /** Rastérise les faces d'un maillage vues de dessus (toits, dessus des volumes). */
  rasterize(mesh: MeshData) {
    const p = mesh.positions;
    const ix = mesh.indices;
    for (let t = 0; t < ix.length; t += 3) {
      const a = ix[t] * 3;
      const b = ix[t + 1] * 3;
      const c = ix[t + 2] * 3;
      const ax = p[a],
        az = p[a + 2],
        bx = p[b],
        bz = p[b + 2],
        cx = p[c],
        cz = p[c + 2];
      const den = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(den) < 1e-6) continue;
      const x0 = Math.min(ax, bx, cx),
        x1 = Math.max(ax, bx, cx);
      const z0 = Math.min(az, bz, cz),
        z1 = Math.max(az, bz, cz);
      for (let z = Math.floor((z0 - FIELD.min) / FIELD.cell); z * FIELD.cell + FIELD.min <= z1; z++)
        for (let x = Math.floor((x0 - FIELD.min) / FIELD.cell); x * FIELD.cell + FIELD.min <= x1; x++) {
          const px = FIELD.min + (x + 0.5) * FIELD.cell;
          const pz = FIELD.min + (z + 0.5) * FIELD.cell;
          const u = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / den;
          const v = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / den;
          const w = 1 - u - v;
          if (u < -0.02 || v < -0.02 || w < -0.02) continue;
          this.raise(px, pz, u * p[a + 1] + v * p[b + 1] + w * p[c + 1]);
        }
    }
  }

  /** Volume simple (arbre, mobilier) : disque de rayon r jusqu'à la hauteur `top`. */
  disc(x: number, z: number, r: number, top: number) {
    for (let dz = -r; dz <= r; dz += FIELD.cell)
      for (let dx = -r; dx <= r; dx += FIELD.cell)
        if (dx * dx + dz * dz <= r * r) this.raise(x + dx, z + dz, top);
  }
}

/** Directions du soleil légèrement dispersées (ombre douce). */
function sunRays(sun: [number, number, number]) {
  const rays: [number, number, number][] = [];
  const spread = 0.045;
  for (const [a, b] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const d = [sun[0] + a * spread, sun[1], sun[2] + b * spread];
    const l = Math.hypot(...d);
    rays.push([d[0] / l, d[1] / l, d[2] / l]);
  }
  return rays;
}

const DIRS = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4)]);
const DISTANCES = [0.6, 1.3, 2.6, 5, 9];

export class Light {
  private rays: [number, number, number][];
  constructor(
    private field: HeightField,
    sun: [number, number, number],
  ) {
    this.rays = sunRays(sun);
  }

  /** Part de soleil reçue (0 à 1) au point p, de normale n. */
  sun(px: number, py: number, pz: number, nx: number, ny: number, nz: number) {
    let lit = 0;
    const sx = px + nx * 0.4;
    const sy = py + ny * 0.4 + 0.05;
    const sz = pz + nz * 0.4;
    for (const [dx, dy, dz] of this.rays) {
      let open = 1;
      for (let t = 0.5; t < 70; t += 0.5) {
        const y = sy + dy * t;
        if (y > 32) break;
        if (this.field.height(sx + dx * t, sz + dz * t) > y) {
          open = 0;
          break;
        }
      }
      lit += open;
    }
    return lit / this.rays.length;
  }

  /** Occlusion ambiante (1 : à découvert) : horizon au-dessus du plan tangent. */
  ambient(px: number, py: number, pz: number, nx: number, ny: number, nz: number) {
    const sx = px + nx * 0.3;
    const sy = py + ny * 0.3;
    const sz = pz + nz * 0.3;
    const flat = Math.hypot(nx, nz);
    let total = 0;
    let weight = 0;
    for (const [dx, dz] of DIRS) {
      // Murs : seulement les directions devant le mur.
      const facing = flat > 0.3 ? (dx * nx + dz * nz) / flat : 1;
      if (facing < -0.05) continue;
      const w = flat > 0.3 ? 0.3 + facing : 1;
      let horizon = 0;
      for (const d of DISTANCES) {
        const x = sx + dx * d;
        const z = sz + dz * d;
        const plane = ny > 0.25 ? sy - (nx * (x - sx) + nz * (z - sz)) / ny : sy;
        const rise = this.field.height(x, z) - plane;
        if (rise > 0) horizon = Math.max(horizon, rise / Math.hypot(d, rise));
      }
      total += horizon * w;
      weight += w;
    }
    const occlusion = weight ? total / weight : 0;
    // Les faces tournées vers le bas reçoivent moins de ciel.
    const sky = 0.75 + 0.25 * Math.max(-1, Math.min(1, ny));
    return Math.max(0.25, (1 - occlusion * 0.85) * sky);
  }

  /** Lumière par sommet : (soleil, occlusion) pour chaque sommet du maillage. */
  bake(mesh: MeshData): Float32Array {
    const out = new Float32Array((mesh.positions.length / 3) * 2);
    const p = mesh.positions;
    const n = mesh.normals;
    for (let i = 0; i < p.length / 3; i++) {
      const k = i * 3;
      const lit = n[k] * this.rays[0][0] + n[k + 1] * this.rays[0][1] + n[k + 2] * this.rays[0][2] > -0.05;
      out[i * 2] = lit ? this.sun(p[k], p[k + 1], p[k + 2], n[k], n[k + 1], n[k + 2]) : 0;
      out[i * 2 + 1] = this.ambient(p[k], p[k + 1], p[k + 2], n[k], n[k + 1], n[k + 2]);
    }
    return out;
  }

  /** Texture de lumière du sol (RGBA 8 bits : R soleil, G occlusion), un texel par case. */
  ground(heightAt: (x: number, z: number) => number, size = 256): Uint8Array {
    const data = new Uint8Array(size * size * 4);
    const step = FIELD.extent / size;
    for (let j = 0; j < size; j++)
      for (let i = 0; i < size; i++) {
        const x = FIELD.min + (i + 0.5) * step;
        const z = FIELD.min + (j + 0.5) * step;
        const y = Math.max(heightAt(x, z), 0);
        const o = (j * size + i) * 4;
        data[o] = Math.round(this.sun(x, y, z, 0, 1, 0) * 255);
        data[o + 1] = Math.round(this.ambient(x, y, z, 0, 1, 0) * 255);
        data[o + 3] = 255;
      }
    return data;
  }
}
