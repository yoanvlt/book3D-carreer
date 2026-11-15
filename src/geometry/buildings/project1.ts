/**
 * Projet 1 — pavillon de verre et d'acier (fiche : docs/batiments/project-1.md). Repère local :
 * façade d'entrée vers +z (nord, vers la place).
 */
import { Builder } from '../mesh';
import { box } from '../shapes';
import { doorSurround, wallWithDoor } from '../elements';

const W = 15;
const D = 11;
const LEVELS: [number, number][] = [
  [0.25, 3.8],
  [4.2, 7.6],
];

/** Mur-rideau d'une face (repère de façade), montants tous les 1,5 m. */
function curtain(b: Builder, length: number, y0: number, y1: number, door = false) {
  if (door) wallWithDoor(b, -length / 2, length / 2, y0, y1, 0.4, 'verre');
  else box(b, 0, y0, -0.2, length, y1 - y0, 0.4, 'verre', { bevel: 0.02, top: 0.1, base: 0.85 });
  const n = Math.round(length / 1.5);
  for (let i = 1; i < n; i++) {
    const x = -length / 2 + (length * i) / n;
    if (door && Math.abs(x) < 1.7) continue;
    box(b, x, y0, 0.02, 0.1, y1 - y0, 0.1, 'metal-sombre', { bevel: 0.02 });
  }
  box(b, 0, y0 + (y1 - y0) * 0.72, 0.03, length, 0.08, 0.08, 'metal-sombre', { bevel: 0.02 });
}

export function project1(b: Builder) {
  box(b, 0, 0, 0, W, 0.25, D, 'beton', { bevel: 0.05 });
  for (const [i, [y0, y1]] of LEVELS.entries()) {
    // Faces : avant (porte au rez-de-chaussée), arrière, côtés.
    for (let k = 0; k < 4; k++) {
      const len = k % 2 ? D - 0.8 : W - 0.8;
      b.within({ ry: (k * Math.PI) / 2 }, () =>
        b.within({ z: (k % 2 ? W : D) / 2 - 0.4 }, () => curtain(b, len, y0, y1, k === 0 && i === 0)),
      );
    }
    // Cœur plein derrière le verre (rien de visible à travers).
    box(b, 0, y0, 0, W - 1.6, y1 - y0, D - 1.6, 'verre-profond', { bevel: 0.02 });
  }
  b.within({ z: D / 2 - 0.4 }, () => doorSurround(b, 0, 0.25, 'accent-project-1', { width: 0.18 }));
  // Dalles blanches débordantes et poteaux d'acier blanc.
  box(b, 0, 3.8, 0, W + 0.8, 0.4, D + 0.8, 'blanc', { bevel: 0.08 });
  box(b, 0, 7.6, 0, W + 1.6, 0.5, D + 1.6, 'blanc', { bevel: 0.1 });
  for (const x of [-W / 2, -2.5, 2.5, W / 2])
    for (const z of [-D / 2, D / 2])
      box(b, x - Math.sign(x) * 0.15, 0.25, z - Math.sign(z) * 0.15, 0.3, 7.35, 0.3, 'blanc', {
        bevel: 0.04,
      });
  for (const z of [-D / 6, D / 6])
    for (const x of [-W / 2, W / 2])
      box(b, x - Math.sign(x) * 0.15, 0.25, z, 0.3, 7.35, 0.3, 'blanc', { bevel: 0.04 });
  // Toit équipé : acrotère, panneaux solaires inclinés en rangée, jardinières.
  for (const [x, z, w, d] of [
    [0, D / 2 + 0.6, W + 1.6, 0.2],
    [0, -D / 2 - 0.6, W + 1.6, 0.2],
    [W / 2 + 0.6, 0, 0.2, D + 1.6],
    [-W / 2 - 0.6, 0, 0.2, D + 1.6],
  ])
    box(b, x, 8.1, z, w, 0.4, d, 'blanc', { bevel: 0.05 });
  for (let i = 0; i < 6; i++) {
    const x = -5 + (i % 3) * 3.6;
    const z = i < 3 ? -2.2 : 1.4;
    box(b, x, 8.15, z, 3.1, 0.12, 1.6, 'ardoise-profonde', { bevel: 0.03 });
    box(b, x, 8.1, z - 0.6, 3.0, 0.3, 0.12, 'metal-sombre', { bevel: 0.02 });
  }
  for (const x of [-6.2, 6.2]) {
    box(b, x, 8.1, 3.6, 1.8, 0.5, 1.2, 'beton', { bevel: 0.06 });
    box(b, x, 8.6, 3.6, 1.5, 0.35, 0.9, 'feuillage', { bevel: 0.15 });
  }
}
