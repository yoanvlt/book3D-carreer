/**
 * Constructeur de maillage du monde (V8), pur : sans React ni WebGL, utilisable dans le worker du
 * précalcul et dans les tests. Chaque pièce est peinte dans l'atlas de la palette (une case et sa
 * position dans le dégradé), comme les modèles des kits. Les grandes faces sont découpées en
 * grille (≤ 1,6 m) : la lumière précalculée par sommet garde des ombres nettes sur les murs.
 */
import { swatchUV, type Swatch } from '../world/palette';

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  indices: Uint32Array;
}

/** Repère d'une pièce : rotation autour de y, puis translation. */
export interface Frame {
  x: number;
  y: number;
  z: number;
  ry: number;
}
export const ORIGIN: Frame = { x: 0, y: 0, z: 0, ry: 0 };

/** Pas maximal entre deux sommets d'une grande face. */
export const STEP = 1.6;

type V3 = [number, number, number];

export class Builder {
  readonly p: number[] = [];
  readonly n: number[] = [];
  readonly uv: number[] = [];
  readonly idx: number[] = [];
  private frames: Frame[] = [ORIGIN];

  get vertexCount() {
    return this.p.length / 3;
  }

  /** Construit un groupe de pièces dans un repère local (composé avec le repère courant). */
  within(frame: Partial<Frame>, build: () => void) {
    const f = { ...ORIGIN, ...frame };
    const parent = this.frames[this.frames.length - 1];
    const c = Math.cos(parent.ry);
    const s = Math.sin(parent.ry);
    this.frames.push({
      x: parent.x + f.x * c + f.z * s,
      y: parent.y + f.y,
      z: parent.z - f.x * s + f.z * c,
      ry: parent.ry + f.ry,
    });
    build();
    this.frames.pop();
  }

  /** Ajoute un sommet (coordonnées et normale dans le repère courant). */
  vertex(pos: V3, normal: V3, swatch: Swatch | number, shade: number): number {
    const f = this.frames[this.frames.length - 1];
    const c = Math.cos(f.ry);
    const s = Math.sin(f.ry);
    this.p.push(f.x + pos[0] * c + pos[2] * s, f.y + pos[1], f.z - pos[0] * s + pos[2] * c);
    this.n.push(normal[0] * c + normal[2] * s, normal[1], -normal[0] * s + normal[2] * c);
    this.uv.push(...swatchUV(swatch, shade));
    return this.vertexCount - 1;
  }

  triangle(a: number, b: number, c: number) {
    this.idx.push(a, b, c);
  }

  /**
   * Quadrilatère plan a-b-c-d (sens trigonométrique vu de l'extérieur), découpé en grille de
   * `nu` × `nv` cases. `shadeAt` donne la position dans le dégradé selon la hauteur locale.
   */
  quad(a: V3, b: V3, c: V3, d: V3, swatch: Swatch | number, shadeAt: (y: number) => number, nu = 1, nv = 1) {
    const normal = faceNormal(a, b, d);
    const base = this.vertexCount;
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const u = i / nu;
        const v = j / nv;
        const point: V3 = [0, 1, 2].map(
          (k) => (1 - u) * (1 - v) * a[k] + u * (1 - v) * b[k] + u * v * c[k] + (1 - u) * v * d[k],
        ) as V3;
        this.vertex(point, normal, swatch, shadeAt(point[1]));
      }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const k = base + j * (nu + 1) + i;
        this.triangle(k, k + 1, k + nu + 2);
        this.triangle(k, k + nu + 2, k + nu + 1);
      }
  }

  /** Ajoute un maillage déjà construit (même repère que le monde). */
  append(data: MeshData) {
    const base = this.vertexCount;
    for (const v of data.positions) this.p.push(v);
    for (const v of data.normals) this.n.push(v);
    for (const v of data.uvs) this.uv.push(v);
    for (const i of data.indices) this.idx.push(base + i);
  }

  finish(): MeshData {
    return {
      positions: new Float32Array(this.p),
      normals: new Float32Array(this.n),
      uvs: new Float32Array(this.uv),
      indices: new Uint32Array(this.idx),
    };
  }
}

export function faceNormal(a: V3, b: V3, c: V3): V3 {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}

/** Dégradé vertical d'une pièce : clair en haut (`top`), plus sombre en bas (`bottom`). */
export const gradient =
  (y0: number, y1: number, top = 0.22, bottom = 0.72) =>
  (y: number) =>
    top + (bottom - top) * Math.max(0, Math.min(1, (y1 - y) / Math.max(1e-6, y1 - y0)));

/** Nombre de cases pour une longueur donnée. */
export const cells = (length: number) => Math.max(1, Math.ceil(length / STEP - 1e-6));

/** Fusionne plusieurs maillages en un seul. */
export function mergeMeshes(list: MeshData[]): MeshData {
  const b = new Builder();
  for (const m of list) b.append(m);
  return b.finish();
}
