/**
 * Île flottante (V8), même écriture que les kits : sol en anneaux concentriques (légèrement
 * marbré dans le dégradé de l'herbe), rebord d'herbe arrondi, falaise en strates douces, dessous
 * rocheux bosselé jusqu'à la pointe, rochers arrondis et racines qui pendent.
 */
import { Builder, type MeshData } from './mesh';
import { dome } from './shapes';
import { edgeRadius, undersideRadius, undersideY, ISLAND } from '../world/island';
import { heightAt } from '../world/terrain';
import type { Swatch } from '../world/palette';

const SEGMENTS = 160;
const hash = (x: number, z: number) => {
  const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** Bruit doux (valeur interpolée) pour marbrer l'herbe et bosseler la roche. */
function noise(x: number, z: number) {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz);
  const b = hash(ix + 1, iz);
  const c = hash(ix, iz + 1);
  const d = hash(ix + 1, iz + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Sol de l'île : anneaux du centre au bord, hauteur du relief, normales lissées. */
export function terrain(): MeshData {
  const b = new Builder();
  const rings = 52;
  const index: number[][] = [];
  const height = (x: number, z: number) => heightAt(x, z);
  for (let j = 0; j <= rings; j++) {
    const row: number[] = [];
    for (let i = 0; i < (j === 0 ? 1 : SEGMENTS); i++) {
      const a = (i / SEGMENTS) * Math.PI * 2;
      const r = (edgeRadius(a) * j) / rings;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const e = 0.35;
      const nx = height(x - e, z) - height(x + e, z);
      const nz = height(x, z - e) - height(x, z + e);
      const l = Math.hypot(nx, 2 * e, nz);
      const mottle = noise(x * 0.12, z * 0.12) * 0.6 + noise(x * 0.5, z * 0.5) * 0.4;
      row.push(b.vertex([x, height(x, z), z], [nx / l, (2 * e) / l, nz / l], 'herbe', 0.2 + mottle * 0.55));
    }
    index.push(row);
  }
  for (let i = 0; i < SEGMENTS; i++) b.triangle(index[0][0], index[1][(i + 1) % SEGMENTS], index[1][i]);
  for (let j = 1; j < rings; j++)
    for (let i = 0; i < SEGMENTS; i++) {
      const i1 = (i + 1) % SEGMENTS;
      b.triangle(index[j][i], index[j][i1], index[j + 1][i1]);
      b.triangle(index[j][i], index[j + 1][i1], index[j + 1][i]);
    }
  return b.finish();
}

/** Bandes de la falaise : profondeur relative (0 : bord, 1 : pointe) et couleur. */
const BANDS: [number, number, Swatch][] = [
  [0, 0.012, 'herbe-profonde'],
  [0.012, 0.05, 'strate-claire'],
  [0.05, 0.09, 'strate'],
  [0.09, 0.12, 'strate-claire'],
  [0.12, 0.19, 'strate-profonde'],
  [0.19, 0.24, 'strate'],
  [0.24, 0.45, 'roche'],
  [0.45, 0.72, 'roche-profonde'],
  [0.72, 1, 'roche'],
];

/** Rayon et hauteur d'un point du dessous (t de 0 à 1), bosselé, sans fissure entre bandes. */
function under(a: number, t: number): [number, number, number] {
  const lump =
    t < 0.012
      ? 0
      : (noise(a * 9, t * 12) - 0.5) *
        (t < ISLAND.cliff ? 1.4 : 3.2) *
        Math.sin(Math.PI * Math.min(1, t * 1.1));
  // Rebord arrondi : l'herbe déborde un peu avant de plonger.
  const lip =
    t < 0.012 ? 0.5 * Math.sin((t / 0.012) * Math.PI * 0.5) : 0.5 * (1 - Math.min(1, (t - 0.012) / 0.04));
  const r = undersideRadius(a, t) + lump + lip;
  const y = t < 0.012 ? -0.55 * (t / 0.012) : undersideY(t);
  return [Math.cos(a) * r, y, Math.sin(a) * r];
}

/** Falaise et dessous de l'île, en bandes de couleur, avec rochers et racines. */
export function underside(): MeshData {
  const b = new Builder();
  for (const [t0, t1, paint] of BANDS) {
    const rows = Math.max(1, Math.ceil((t1 - t0) * 40));
    const start = b.vertexCount;
    for (let j = 0; j <= rows; j++) {
      const t = t0 + ((t1 - t0) * j) / rows;
      for (let i = 0; i <= SEGMENTS; i++) {
        const a = (i / SEGMENTS) * Math.PI * 2;
        const p = under(a, t);
        // Normale par différences finies sur la surface (lissée).
        const pa = under(a + 0.01, t);
        const pt = under(a, Math.min(1, t + 0.01));
        const u = [pa[0] - p[0], pa[1] - p[1], pa[2] - p[2]];
        const v = [pt[0] - p[0], pt[1] - p[1], pt[2] - p[2]];
        let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        if (n[0] * p[0] + n[2] * p[2] < 0) n = n.map((c) => -c);
        const l = Math.hypot(...n) || 1;
        b.vertex(p, [n[0] / l, n[1] / l, n[2] / l], paint, 0.2 + noise(a * 20, t * 30) * 0.6);
      }
    }
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < SEGMENTS; i++) {
        const k = start + j * (SEGMENTS + 1) + i;
        b.triangle(k, k + 1, k + SEGMENTS + 2);
        b.triangle(k, k + SEGMENTS + 2, k + SEGMENTS + 1);
      }
  }
  // Rochers arrondis en saillie sur la falaise.
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + hash(i, 3) * 0.2;
    const t = 0.03 + hash(i, 7) * 0.16;
    const [x, y, z] = under(a, t);
    const r = 1.4 + hash(i, 11) * 1.6;
    b.within({ x: x * 0.985, y: y - r * 0.4, z: z * 0.985, ry: -a }, () =>
      dome(b, 0, 0, 0, r, i % 2 ? 'roche-claire' : 'roche', { segments: 10, height: 0.9 }),
    );
  }
  // Racines qui pendent sous le rebord.
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2 + hash(i, 5) * 0.12;
    const length = 2.5 + hash(i, 9) * 6;
    const [x, y, z] = under(a, 0.014);
    root(b, x, y, z, a, length, 0.12 + hash(i, 2) * 0.1);
  }
  return b.finish();
}

/** Racine : tube fin à 5 côtés, qui descend en s'écartant un peu de la falaise. */
function root(b: Builder, x: number, y: number, z: number, a: number, length: number, radius: number) {
  const steps = 6;
  const sides = 5;
  const start = b.vertexCount;
  for (let j = 0; j <= steps; j++) {
    const t = j / steps;
    const out = Math.sin(t * Math.PI * 0.8) * 0.8;
    const cx = x + Math.cos(a) * out;
    const cz = z + Math.sin(a) * out;
    const cy = y - t * length;
    const r = radius * (1 - t * 0.85);
    for (let i = 0; i <= sides; i++) {
      const s = (i / sides) * Math.PI * 2;
      const n: [number, number, number] = [Math.cos(s) * Math.cos(a), 0, Math.cos(s) * Math.sin(a)];
      const tx = -Math.sin(a) * Math.sin(s);
      const tz = Math.cos(a) * Math.sin(s);
      b.vertex(
        [cx + (n[0] + tx) * r, cy, cz + (n[2] + tz) * r],
        [n[0] + tx, 0, n[2] + tz],
        'tronc',
        0.3 + t * 0.4,
      );
    }
  }
  for (let j = 0; j < steps; j++)
    for (let i = 0; i < sides; i++) {
      const k = start + j * (sides + 1) + i;
      b.triangle(k, k + 1, k + sides + 2);
      b.triangle(k, k + sides + 2, k + sides + 1);
    }
}
