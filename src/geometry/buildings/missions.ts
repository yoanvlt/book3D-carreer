/**
 * Autres missions — galerie à portique (fiche : docs/batiments/missions.md). Enduit, pierre,
 * zinc ; quatre colonnes sous un fronton. Repère local : façade d'entrée vers +z.
 */
import { Builder } from '../mesh';
import { box, cylinder, gableRoof, prism } from '../shapes';
import { band, doorSurround, wallWithDoor, windowAt, windowRow, type WindowStyle } from '../elements';

const W = 18;
const H = 7.2;
const FRONT = 3;
const BACK = -6;
const WALL = 'enduit';
const STONE = 'pierre';
const TALL: WindowStyle = { frame: 'blanc', sill: STONE, lintel: STONE, bars: 2 };

export function missions(b: Builder) {
  const depth = FRONT - BACK;
  // Soubassement (hors du seuil), corps et façade percée de la porte.
  box(b, 0, 0, (FRONT + BACK) / 2 - 0.5, W + 0.2, 0.6, depth - 1 + 0.2, STONE, { bevel: 0.05 });
  box(b, 0, 0, (FRONT + BACK) / 2 - 0.5, W, H, depth - 1, WALL, { bevel: 0.08 });
  b.within({ z: FRONT }, () => {
    wallWithDoor(b, -W / 2, W / 2, 0, H, 1, WALL);
    doorSurround(b, 0, 0, 'accent-missions', { width: 0.24, cap: STONE });
    for (const x of [-5.2, 5.2]) windowAt(b, x, 0.9, 1.4, 3.2, TALL);
  });
  // Stylobate, quatre colonnes, entablement et fronton.
  // Une seule marche basse (le robot marche au niveau du sol).
  box(b, 0, 0, FRONT + 1.6, W - 1.2, 0.15, 3.2, 'bordure', { bevel: 0.04 });
  for (const x of [-7.6, -2.8, 2.8, 7.6]) {
    box(b, x, 0.15, 5.2, 1.0, 0.3, 1.0, STONE, { bevel: 0.06 });
    cylinder(b, x, 0.45, 5.2, 0.38, 5.45, 'roche-claire', { r1: 0.33, segments: 14, cap: false });
    box(b, x, 5.85, 5.2, 0.95, 0.35, 0.95, STONE, { bevel: 0.06 });
  }
  box(b, 0, 6.2, 4.3, 17.2, 1.0, 3.4, STONE, { bevel: 0.08 });
  band(b, -8.6, 8.6, 6.95, 0.25, 0.12, 'bordure');
  b.within({ z: 0 }, () =>
    prism(
      b,
      [
        [-6, H + 0.02],
        [6, H + 0.02],
        [0, 9.4],
      ],
      5.2,
      6.0,
      STONE,
    ),
  );
  b.within({ z: 6.0 }, () =>
    prism(
      b,
      [
        [-5.2, H + 0.25],
        [5.2, H + 0.25],
        [0, 9.0],
      ],
      0,
      0.06,
      'roche-claire',
    ),
  );
  // Pilastres d'angle, cordon et acrotère sur les côtés et l'arrière.
  for (const x of [-W / 2, W / 2])
    for (const z of [BACK, FRONT])
      box(b, x - Math.sign(x) * 0.2, 0, z - Math.sign(z - 0.1) * 0.2, 0.7, H + 0.2, 0.7, STONE, {
        bevel: 0.06,
      });
  box(b, 0, H, (FRONT + BACK) / 2, W + 0.5, 0.45, depth + 0.4, STONE, { bevel: 0.08 });
  // Côtés : trois hautes fenêtres de galerie.
  for (const side of [-1, 1])
    b.within({ ry: (side * Math.PI) / 2, z: 0 }, () =>
      b.within({ x: side * -((FRONT + BACK) / 2), z: W / 2 }, () =>
        windowRow(b, 3, 5.4, 1.2, 1.4, 3.2, TALL),
      ),
    );
  // Arrière : porte de service, fenêtres, descente d'eau.
  b.within({ ry: Math.PI }, () =>
    b.within({ z: -BACK }, () => {
      windowRow(b, 4, 12, 1.2, 1.4, 3.2, TALL, [1]);
      box(b, -2, 0, 0.06, 1.3, 2.5, 0.14, 'accent-missions', { bevel: 0.04 });
      box(b, -2, 0, 0.5, 2, 0.15, 1, STONE, { bevel: 0.04 });
      box(b, 8.4, 0, 0.12, 0.16, H, 0.16, 'zinc', { bevel: 0.04 });
    }),
  );
  // Toit de zinc à faible pente et verrière au faîtage.
  b.within({ z: (FRONT + BACK) / 2 }, () => {
    gableRoof(b, H + 0.45, W - 0.6, depth - 0.6, 1.0, 'zinc', { overhang: 0.05, thickness: 0.2 });
    box(b, 0, H + 1.45, 0, W - 5, 0.5, 2.0, 'verre', { bevel: 0.08 });
    for (let x = -6; x <= 6; x += 2) box(b, x, H + 1.45, 0, 0.1, 0.56, 2.1, 'metal-sombre', { bevel: 0.02 });
  });
}
