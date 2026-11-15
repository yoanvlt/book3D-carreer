/**
 * Projet 2 — atelier à sheds (fiche : docs/batiments/project-2.md). Repère local : façade
 * d'entrée vers +z (rue ouest), x vers le nord (cour et quai), -z vers l'arrière.
 */
import { Builder } from '../mesh';
import { box, cylinder, prism } from '../shapes';
import { band, doorSurround, wallWithDoor, windowAt, windowRow, type WindowStyle } from '../elements';

const W = 18;
const D = 13;
const H = 5.2;
const RIDGE = 7.8;
const STEEL: WindowStyle = { frame: 'metal-sombre', sill: 'pierre', bars: 2 };

export function project2(b: Builder) {
  box(b, 0, 0, -0.5, W, H, D - 1, 'brique', { bevel: 0.08 });
  b.within({ z: D / 2 }, () => {
    wallWithDoor(b, -W / 2, W / 2, 0, H, 1, 'brique');
    doorSurround(b, 0, 0, 'metal-sombre', { width: 0.25, cap: 'accent-project-2' });
    for (const x of [-5.4, 5.4]) windowAt(b, x, 1.0, 3.0, 2.4, STEEL);
  });
  // Corniche de pierre et soubassement sur les quatre faces.
  for (let k = 0; k < 4; k++) {
    const len = k % 2 ? D : W;
    b.within({ ry: (k * Math.PI) / 2 }, () =>
      b.within({ z: k % 2 ? W / 2 : D / 2 }, () => {
        band(b, -len / 2 - 0.1, len / 2 + 0.1, H - 0.3, 0.3, 0.16, 'pierre');
        if (k !== 0) band(b, -len / 2, len / 2, 0, 0.45, 0.08, 'brique-profonde');
      }),
    );
  }
  // Trois sheds identiques : pente de zinc vers le sud (-x), vitrage vertical au nord (+x).
  for (let i = 0; i < 3; i++) {
    const x0 = -W / 2 + i * 6;
    prism(
      b,
      [
        [x0, H],
        [x0 + 6, RIDGE],
        [x0 + 6, RIDGE + 0.22],
        [x0 - 0.1, H + 0.22],
      ],
      -D / 2 - 0.3,
      D / 2 + 0.3,
      'zinc',
      { top: 0.15, base: 0.5 },
    );
    for (const z of [-D / 2, D / 2 - 0.4])
      prism(
        b,
        [
          [x0, H],
          [x0 + 6, H],
          [x0 + 6, RIDGE],
        ],
        z,
        z + 0.4,
        'brique',
      );
    box(b, x0 + 5.94, H, 0, 0.12, RIDGE - H, D - 0.6, 'verre', { bevel: 0.02, top: 0.1, base: 0.8 });
    for (let z = -D / 2 + 0.6; z <= D / 2 - 0.5; z += 1.3)
      box(b, x0 + 6.02, H, z, 0.12, RIDGE - H, 0.1, 'metal-sombre', { bevel: 0.02 });
  }
  // Nord : quai fermé sous auvent, fenêtres hautes.
  b.within({ ry: Math.PI / 2 }, () =>
    b.within({ z: W / 2 }, () => {
      box(b, 2.5, 0, 1.2, 6, 1.1, 2.4, 'beton', { bevel: 0.06 });
      for (let y = 1.1; y < 4.6; y += 0.3) box(b, 2.5, y, 0.06, 3.6, 0.26, 0.12, 'zinc', { bevel: 0.03 });
      box(b, 2.5, 4.6, 0.06, 4.1, 0.3, 0.2, 'metal-sombre', { bevel: 0.04 });
      for (const x of [0.9, 4.1]) box(b, x, 0.3, 2.4, 0.25, 0.5, 0.2, 'encre', { bevel: 0.05 });
      box(b, 2.5, 4.6, 1.6, 7, 0.22, 3.4, 'metal-sombre', { bevel: 0.05 });
      for (const x of [-0.6, 5.6]) box(b, x, 0, 3.1, 0.2, 4.6, 0.2, 'metal-sombre', { bevel: 0.04 });
      windowAt(b, -3.6, 2.4, 2.0, 1.6, STEEL);
    }),
  );
  // Ouest (arrière) : rangée de fenêtres hautes.
  b.within({ ry: Math.PI }, () => b.within({ z: D / 2 }, () => windowRow(b, 5, 13.6, 2.6, 1.6, 1.6, STEEL)));
  // Sud : fenêtres d'atelier et descentes d'eau.
  b.within({ ry: -Math.PI / 2 }, () =>
    b.within({ z: W / 2 }, () => {
      windowRow(b, 3, 8, 1.0, 2.4, 2.4, STEEL);
      for (const x of [-6.1, 6.1]) box(b, x, 0, 0.12, 0.16, H, 0.16, 'zinc', { bevel: 0.04 });
    }),
  );
  // Cheminée de brique à l'angle sud-ouest.
  cylinder(b, -W / 2 + 1.2, 0, -D / 2 - 1.1, 0.85, 15, 'brique', { r1: 0.7, segments: 14 });
  cylinder(b, -W / 2 + 1.2, 14.4, -D / 2 - 1.1, 0.88, 0.6, 'pierre', { segments: 14 });
  // Cour au nord : mur de brique, portail ouvert côté rue, sol de béton.
  const x0 = W / 2 + 0.5;
  const x1 = 24;
  const z0 = -12;
  const z1 = D / 2;
  box(b, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0, 'beton', { bevel: 0.02 });
  box(b, x1 - 0.2, 0, (z0 + z1) / 2, 0.4, 1.4, z1 - z0, 'brique', { bevel: 0.05 });
  box(b, (x0 + x1) / 2, 0, z0 + 0.2, x1 - x0, 1.4, 0.4, 'brique', { bevel: 0.05 });
  box(b, x0 + 3, 0, z1 - 0.2, 6, 1.4, 0.4, 'brique', { bevel: 0.05 });
  box(b, x1 - 2.5, 0, z1 - 0.2, 4.6, 1.4, 0.4, 'brique', { bevel: 0.05 });
  for (const x of [x0 + 6.2, x1 - 5]) box(b, x, 0, z1 - 0.2, 0.6, 1.8, 0.6, 'pierre', { bevel: 0.05 });
}
