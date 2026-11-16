/**
 * Modèles maison du décor (V8), écrits avec les mêmes règles que les kits : facettes franches,
 * atlas de la palette. Le pack nature n'a que des conifères : le feuillu complète la famille.
 * La fontaine de la place est un ouvrage de pierre (son eau est animée à part).
 */
import { IcosahedronGeometry } from 'three';
import { Builder, type MeshData } from './mesh';
import { cylinder } from './shapes';
import type { Swatch } from '../world/palette';

/** Boule facettée (icosaèdre bosselé), à normales plates, dégradé clair en haut. */
function blob(b: Builder, x: number, y: number, z: number, r: number, paint: Swatch, seed: number) {
  const g = new IcosahedronGeometry(1, 1).toNonIndexed();
  const p = g.getAttribute('position');
  const jitter = (i: number) => 1 + 0.12 * Math.sin(i * 12.9898 + seed * 78.233);
  const pts: [number, number, number][] = [];
  for (let i = 0; i < p.count; i++) {
    const k = jitter(Math.round((p.getX(i) * 7 + p.getY(i) * 13 + p.getZ(i) * 17) * 10));
    pts.push([x + p.getX(i) * r * k, y + p.getY(i) * r * 0.85 * k, z + p.getZ(i) * r * k]);
  }
  for (let i = 0; i < pts.length; i += 3) {
    const [a, c, d] = [pts[i], pts[i + 1], pts[i + 2]];
    const u = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n: [number, number, number] = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    const l = Math.hypot(...n) || 1;
    const normal: [number, number, number] = [n[0] / l, n[1] / l, n[2] / l];
    const ids = [a, c, d].map((q) =>
      b.vertex(q, normal, paint, 0.1 + 0.6 * (1 - (q[1] - (y - r)) / (2 * r))),
    );
    b.triangle(ids[0], ids[1], ids[2]);
  }
}

/** Feuillu : tronc et houppier de trois boules facettées (environ 5,2 m à l'échelle 1). */
export function feuillu(): MeshData {
  const b = new Builder();
  cylinder(b, 0, 0, 0, 0.28, 2.6, 'tronc', { r1: 0.2, segments: 6, cap: false });
  blob(b, 0, 3.4, 0, 1.6, 'feuillage', 1);
  blob(b, 0.85, 3.0, 0.4, 1.05, 'feuillage-clair', 2);
  blob(b, -0.7, 3.9, -0.35, 1.0, 'feuillage', 3);
  return b.finish();
}

/** Anneau de pierre (bassin) : paroi extérieure, dessus, paroi intérieure. */
function ring(
  b: Builder,
  x: number,
  z: number,
  r0: number,
  r1: number,
  y0: number,
  y1: number,
  paint: Swatch,
) {
  const seg = 32;
  const rows: [number, number, number, boolean][] = [
    [r1, y0, y1, true],
    [r0, y1, y0, false],
  ];
  for (const [r, ya, yb, out] of rows) {
    const start = b.vertexCount;
    for (let j = 0; j < 2; j++)
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const s = out ? 1 : -1;
        b.vertex(
          [x + Math.sin(a) * r, j ? yb : ya, z + Math.cos(a) * r],
          [Math.sin(a) * s, 0, Math.cos(a) * s],
          paint,
          j ? 0.25 : 0.65,
        );
      }
    for (let i = 0; i < seg; i++) {
      const k = start + i;
      b.triangle(k, k + 1, k + seg + 2);
      b.triangle(k, k + seg + 2, k + seg + 1);
    }
  }
  const start = b.vertexCount;
  for (const r of [r0, r1])
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      b.vertex([x + Math.sin(a) * r, y1, z + Math.cos(a) * r], [0, 1, 0], 'bordure', 0.3);
    }
  for (let i = 0; i < seg; i++) {
    const k = start + i;
    b.triangle(k, k + seg + 2, k + 1);
    b.triangle(k, k + seg + 1, k + seg + 2);
  }
}

/** Fontaine de la place : bassin, fût, vasque, pomme. Eau animée à part (scene/Water.tsx). */
export function fountain(x: number, z: number, radius: number): MeshData {
  const b = new Builder();
  ring(b, x, z, radius - 0.45, radius, 0, 0.7, 'pierre');
  cylinder(b, x, 0, z, radius - 0.4, 0.3, 'pierre', { segments: 32 });
  cylinder(b, x, 0.3, z, 0.55, 1.5, 'pierre', { r1: 0.42, segments: 12, cap: false });
  ring(b, x, z, 1.25, 1.6, 1.8, 2.2, 'pierre');
  cylinder(b, x, 1.5, z, 1.6, 0.35, 'pierre', { r1: 1.6, segments: 24, cap: false });
  cylinder(b, x, 1.8, z, 1.3, 0.15, 'pierre', { segments: 24 });
  cylinder(b, x, 2.0, z, 0.22, 1.0, 'pierre', { segments: 10, cap: false });
  cylinder(b, x, 3.0, z, 0.38, 0.35, 'bordure', { r1: 0.12, segments: 10 });
  return b.finish();
}
