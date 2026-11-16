/**
 * Formes du kit des bâtiments (V8) : mêmes règles que les modèles KayKit — arêtes chanfreinées,
 * couleurs de l'atlas en dégradé vertical, épaisseurs franches. Toutes les grandes faces sont
 * découpées en grille conforme (aucune jonction en T), pour la lumière précalculée.
 */
import { ShapeUtils, Vector2 } from 'three';
import { Builder, cells, faceNormal, gradient } from './mesh';
import type { Swatch } from '../world/palette';

type V3 = [number, number, number];
type Paint = Swatch | number;

/** Chanfrein par défaut des arêtes (0,1 m), comme les kits à l'échelle du site. */
const BEVEL = 0.1;

function oriented(
  b: Builder,
  pts: V3[],
  expected: V3,
  paint: Paint,
  shade: (y: number) => number,
  nu = 1,
  nv = 1,
) {
  const n = faceNormal(pts[0], pts[1], pts[3]);
  const ok = n[0] * expected[0] + n[1] * expected[1] + n[2] * expected[2] >= 0;
  const [a, bb, c, d] = ok ? pts : [pts[0], pts[3], pts[2], pts[1]];
  if (ok) b.quad(a, bb, c, d, paint, shade, nu, nv);
  else b.quad(a, bb, c, d, paint, shade, nv, nu);
}

function corner(b: Builder, pts: V3[], expected: V3, paint: Paint, shade: (y: number) => number) {
  const n = faceNormal(pts[0], pts[1], pts[2]);
  const order =
    n[0] * expected[0] + n[1] * expected[1] + n[2] * expected[2] >= 0 ? pts : [pts[0], pts[2], pts[1]];
  const l = Math.hypot(...expected);
  const normal: V3 = [expected[0] / l, expected[1] / l, expected[2] / l];
  const i = order.map((p) => b.vertex(p, normal, paint, shade(p[1])));
  b.triangle(i[0], i[1], i[2]);
}

export interface BoxOptions {
  bevel?: number;
  /** Faces du dessous (masquées quand la pièce est posée). */
  bottom?: boolean;
  top?: number;
  base?: number;
}

/**
 * Pavé chanfreiné posé en (x, y0, z), de taille w × h × d. Faces en grille conforme : chaque
 * bande de chanfrein a le même découpage que les faces qu'elle relie.
 */
export function box(
  b: Builder,
  x: number,
  y0: number,
  z: number,
  w: number,
  h: number,
  d: number,
  paint: Paint,
  o: BoxOptions = {},
) {
  const r = Math.min(o.bevel ?? BEVEL, w / 3, h / 3, d / 3);
  const half: V3 = [w / 2, h / 2, d / 2];
  const center: V3 = [x, y0 + h / 2, z];
  const inner: V3 = [half[0] - r, half[1] - r, half[2] - r];
  const shade = gradient(y0, y0 + h, o.top, o.base);
  const at = (v: V3): V3 => [center[0] + v[0], center[1] + v[1], center[2] + v[2]];
  const keepBottom = o.bottom ?? false;
  const count = inner.map((v) => cells(2 * v));
  for (let a = 0; a < 3; a++)
    for (const sa of [-1, 1]) {
      if (a === 1 && sa < 0 && !keepBottom) continue;
      const [u, v] = [0, 1, 2].filter((k) => k !== a);
      const pt = (su: number, sv: number): V3 => {
        const p: V3 = [0, 0, 0];
        p[a] = sa * half[a];
        p[u] = su * inner[u];
        p[v] = sv * inner[v];
        return at(p);
      };
      const e: V3 = [0, 0, 0];
      e[a] = sa;
      oriented(b, [pt(-1, -1), pt(1, -1), pt(1, 1), pt(-1, 1)], e, paint, shade, count[u], count[v]);
    }
  // Bandes de chanfrein le long des 12 arêtes.
  for (let a = 0; a < 3; a++)
    for (let c = a + 1; c < 3; c++) {
      const along = 3 - a - c;
      for (const sa of [-1, 1])
        for (const sc of [-1, 1]) {
          if (!keepBottom && ((a === 1 && sa < 0) || (c === 1 && sc < 0))) continue;
          const pt = (s: number, onA: boolean): V3 => {
            const p: V3 = [0, 0, 0];
            p[a] = sa * (onA ? half[a] : inner[a]);
            p[c] = sc * (onA ? inner[c] : half[c]);
            p[along] = s * inner[along];
            return at(p);
          };
          const e: V3 = [0, 0, 0];
          e[a] = sa;
          e[c] = sc;
          oriented(
            b,
            [pt(-1, true), pt(1, true), pt(1, false), pt(-1, false)],
            e,
            paint,
            shade,
            count[along],
            1,
          );
        }
    }
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        if (sy < 0 && !keepBottom) continue;
        corner(
          b,
          [
            at([sx * half[0], sy * inner[1], sz * inner[2]]),
            at([sx * inner[0], sy * half[1], sz * inner[2]]),
            at([sx * inner[0], sy * inner[1], sz * half[2]]),
          ],
          [sx, sy, sz],
          paint,
          shade,
        );
      }
}

/**
 * Tronc de cône (ou cylindre si r0 = r1) d'axe vertical, lissé, chanfreiné en haut, découpé en
 * anneaux pour la lumière. `cap` ferme le dessus.
 */
export function cylinder(
  b: Builder,
  x: number,
  y0: number,
  z: number,
  r0: number,
  h: number,
  paint: Paint,
  o: {
    r1?: number;
    segments?: number;
    cap?: boolean;
    bevel?: number;
    top?: number;
    base?: number;
    arc?: [number, number];
  } = {},
) {
  const r1 = o.r1 ?? r0;
  const seg = o.segments ?? 16;
  const bevel = Math.min(o.bevel ?? BEVEL, h / 3, r1 / 3);
  const rings = cells(h);
  const shade = gradient(y0, y0 + h, o.top, o.base);
  const [a0, a1] = o.arc ?? [0, Math.PI * 2];
  const slope = (r0 - r1) / h;
  const base = b.vertexCount;
  const top = o.cap === false ? h : h - bevel;
  for (let j = 0; j <= rings; j++) {
    const y = (top * j) / rings;
    const r = r0 + (r1 - r0) * (y / h);
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((a1 - a0) * i) / seg;
      const n: V3 = [Math.sin(a), slope, Math.cos(a)];
      const l = Math.hypot(...n);
      b.vertex(
        [x + Math.sin(a) * r, y0 + y, z + Math.cos(a) * r],
        [n[0] / l, n[1] / l, n[2] / l],
        paint,
        shade(y0 + y),
      );
    }
  }
  for (let j = 0; j < rings; j++)
    for (let i = 0; i < seg; i++) {
      const k = base + j * (seg + 1) + i;
      b.triangle(k, k + 1, k + seg + 2);
      b.triangle(k, k + seg + 2, k + seg + 1);
    }
  if (o.cap === false) return;
  // Chanfrein puis disque du dessus.
  const ring = (radius: number, y: number, n: (a: number) => V3) => {
    const start = b.vertexCount;
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((a1 - a0) * i) / seg;
      b.vertex([x + Math.sin(a) * radius, y0 + y, z + Math.cos(a) * radius], n(a), paint, shade(y0 + y));
    }
    return start;
  };
  const rTop = r0 + (r1 - r0) * (top / h);
  const lo = ring(rTop, top, (a) => [Math.sin(a) * 0.7, 0.7, Math.cos(a) * 0.7]);
  const hi = ring(Math.max(0.01, r1 - bevel), h, (a) => [Math.sin(a) * 0.7, 0.7, Math.cos(a) * 0.7]);
  for (let i = 0; i < seg; i++) {
    b.triangle(lo + i, lo + i + 1, hi + i + 1);
    b.triangle(lo + i, hi + i + 1, hi + i);
  }
  const center = b.vertex([x, y0 + h, z], [0, 1, 0], paint, shade(y0 + h));
  const disk = ring(Math.max(0.01, r1 - bevel), h, () => [0, 1, 0]);
  for (let i = 0; i < seg; i++) b.triangle(center, disk + i, disk + i + 1);
}

/** Calotte sphérique lisse (dôme), de rayon r, posée en y0 ; `height` en part du rayon. */
export function dome(
  b: Builder,
  x: number,
  y0: number,
  z: number,
  r: number,
  paint: Paint,
  o: { segments?: number; height?: number; top?: number; base?: number } = {},
) {
  const seg = o.segments ?? 24;
  const rows = Math.max(6, Math.ceil((r * Math.PI) / 2 / 1.2));
  const span = Math.asin(Math.min(1, o.height ?? 1));
  const shade = gradient(y0, y0 + r, o.top, o.base);
  const start = b.vertexCount;
  for (let j = 0; j <= rows; j++) {
    const phi = (span * j) / rows;
    for (let i = 0; i <= seg; i++) {
      const a = (Math.PI * 2 * i) / seg;
      const n: V3 = [Math.cos(phi) * Math.sin(a), Math.sin(phi), Math.cos(phi) * Math.cos(a)];
      b.vertex([x + n[0] * r, y0 + n[1] * r, z + n[2] * r], n, paint, shade(y0 + n[1] * r));
    }
  }
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < seg; i++) {
      const k = start + j * (seg + 1) + i;
      b.triangle(k, k + 1, k + seg + 2);
      b.triangle(k, k + seg + 2, k + seg + 1);
    }
}

/**
 * Prisme : polygone (dans le plan x, y local) extrudé selon z de z0 à z1. Sert aux pignons, aux
 * frontons, aux pans de toit épais. Faces latérales découpées selon la longueur.
 */
export function prism(
  b: Builder,
  polygon: [number, number][],
  z0: number,
  z1: number,
  paint: Paint,
  o: { top?: number; base?: number; caps?: boolean } = {},
) {
  const ys = polygon.map((p) => p[1]);
  const shade = gradient(Math.min(...ys), Math.max(...ys), o.top, o.base);
  const area = polygon.reduce((s, p, i) => {
    const q = polygon[(i + 1) % polygon.length];
    return s + p[0] * q[1] - q[0] * p[1];
  }, 0);
  const pts = area < 0 ? [...polygon].reverse() : polygon;
  const nz = cells(Math.abs(z1 - z0));
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) continue;
    const out: V3 = [by - ay, -(bx - ax), 0];
    oriented(
      b,
      [
        [ax, ay, z0],
        [ax, ay, z1],
        [bx, by, z1],
        [bx, by, z0],
      ],
      out,
      paint,
      shade,
      nz,
      cells(len),
    );
  }
  if (o.caps === false) return;
  const triangles = ShapeUtils.triangulateShape(
    pts.map(([u, v]) => new Vector2(u, v)),
    [],
  );
  for (const [z, sign] of [
    [z1, 1],
    [z0, -1],
  ] as const) {
    const ids = pts.map(([u, v]) => b.vertex([u, v, z], [0, 0, sign], paint, shade(v)));
    for (const [i, j, k] of triangles) {
      if (sign > 0) b.triangle(ids[i], ids[j], ids[k]);
      else b.triangle(ids[i], ids[k], ids[j]);
    }
  }
}

/**
 * Toit à deux pans d'épaisseur `thickness`, faîtage selon x, au-dessus d'un rectangle w × d posé
 * en y0, avec débord `overhang` tout autour. Les pignons ne sont pas inclus.
 */
export function gableRoof(
  b: Builder,
  y0: number,
  w: number,
  d: number,
  rise: number,
  paint: Paint,
  o: { overhang?: number; thickness?: number } = {},
) {
  const over = o.overhang ?? 0.5;
  const t = o.thickness ?? 0.3;
  const half = d / 2 + over;
  const drop = (over * rise) / (d / 2);
  // Coupe dans le plan (z, y), extrudée selon x : on tourne le repère d'un quart de tour.
  b.within({ ry: Math.PI / 2 }, () => {
    for (const side of [-1, 1]) {
      const poly: [number, number][] = [
        [0, y0 + rise + t],
        [0, y0 + rise],
        [side * half, y0 - drop],
        [side * half, y0 - drop + t],
      ];
      prism(
        b,
        poly.map(([u, v]) => [u, v] as [number, number]),
        -w / 2 - over,
        w / 2 + over,
        paint,
        { top: 0.15, base: 0.55 },
      );
    }
  });
}

/** Mur pignon : pentagone (rectangle w × h surmonté d'un triangle de hauteur `rise`), épaisseur d. */
export function gableWall(
  b: Builder,
  y0: number,
  w: number,
  h: number,
  rise: number,
  z0: number,
  z1: number,
  paint: Paint,
) {
  prism(
    b,
    [
      [-w / 2, y0],
      [w / 2, y0],
      [w / 2, y0 + h],
      [0, y0 + h + rise],
      [-w / 2, y0 + h],
    ],
    z0,
    z1,
    paint,
  );
}
