/**
 * Veolia — station de traitement d'eau (fiche : docs/batiments/veolia.md). Repère local :
 * façade d'entrée vers +z (rue est), x vers le sud (cour des cuves).
 */
import { Builder } from '../mesh';
import { box, cylinder } from '../shapes';
import { band, doorSurround, railing, wallWithDoor, windowRow, type WindowStyle } from '../elements';

const W = 18;
const D = 12;
const H = 7;
const RIBBON: WindowStyle = { frame: 'metal-sombre', bars: 0 };
/** Cuves : centre (x, z local), rayon, hauteur. */
const TANKS: [number, number][] = [
  [13.5, 2.2],
  [18.6, 2.2],
];
const BASIN = { x: 16, z: -9, r: 3 };

export function veolia(b: Builder) {
  box(b, 0, 0, -0.5, W, H, D - 1, 'beton', { bevel: 0.08 });
  b.within({ z: D / 2 }, () => {
    wallWithDoor(b, -W / 2, W / 2, 0, H, 1, 'beton');
    doorSurround(b, 0, 0, 'beton-profond', { width: 0.3, cap: 'accent-veolia' });
    for (const x of [-5.5, 5.5]) b.within({ x }, () => windowRow(b, 3, 4.2, 2.2, 1.2, 1.4, RIBBON));
  });
  // Joints horizontaux, bandeau rouge et acrotère sur les quatre faces.
  for (let k = 0; k < 4; k++) {
    const len = k % 2 ? D : W;
    b.within({ ry: (k * Math.PI) / 2 }, () =>
      b.within({ z: k % 2 ? W / 2 : D / 2 }, () => {
        for (let y = 1.4; y < 6; y += 1.4) band(b, -len / 2, len / 2, y, 0.06, 0.03, 'beton-profond');
        band(b, -len / 2 - 0.05, len / 2 + 0.05, 6.2, 0.8, 0.12, 'accent-veolia');
        band(b, -len / 2 - 0.08, len / 2 + 0.08, H, 0.6, 0.2, 'beton');
      }),
    );
  }
  // Toit plat équipé : groupes de ventilation et gaine.
  box(b, 0, H, 0, W - 0.3, 0.08, D - 0.3, 'beton-profond', { bevel: 0.02 });
  for (const x of [-4.5, 0.5]) {
    box(b, x, H + 0.08, -2, 2.6, 1.3, 1.8, 'zinc', { bevel: 0.08 });
    cylinder(b, x, H + 1.38, -2, 0.6, 0.2, 'metal-sombre', { segments: 12 });
  }
  box(b, 5, H + 0.08, 1.5, 4.5, 0.6, 0.6, 'zinc', { bevel: 0.06 });
  // Nord : bande de fenêtres. Est (arrière) : porte de service, grilles, groupes extérieurs.
  b.within({ ry: -Math.PI / 2 }, () =>
    b.within({ z: W / 2 }, () => windowRow(b, 4, 8.4, 2.4, 1.3, 1.4, RIBBON)),
  );
  b.within({ ry: Math.PI }, () =>
    b.within({ z: D / 2 }, () => {
      box(b, -4, 0, 0.07, 1.3, 2.5, 0.14, 'zinc', { bevel: 0.04 });
      for (const x of [1, 3.4]) box(b, x, 3.2, 0.06, 1.6, 1.0, 0.12, 'metal-sombre', { bevel: 0.03 });
      for (const x of [2.2, 5.6]) box(b, x, 0, 0.8, 1.5, 1.2, 0.9, 'zinc', { bevel: 0.08 });
    }),
  );
  // Sud (cour) : fenêtres, porte de service, arrivée des conduites.
  b.within({ ry: Math.PI / 2 }, () =>
    b.within({ z: W / 2 }, () => {
      windowRow(b, 2, 6, 2.6, 1.3, 1.4, RIBBON);
      box(b, 3.6, 0, 0.07, 1.3, 2.5, 0.14, 'zinc', { bevel: 0.04 });
    }),
  );
  // Cour des cuves : socle, deux cuves cerclées, échelles, passerelle, conduites.
  box(b, 16, 0, 0, 12, 0.5, 9, 'beton', { bevel: 0.06 });
  for (const [x, r] of TANKS) {
    cylinder(b, x, 0.5, 0, r, 8, 'beton', { segments: 24, cap: false, top: 0.15, base: 0.6 });
    cylinder(b, x, 8.5, 0, r + 0.05, 0.9, 'zinc', { r1: 0.5, segments: 24 });
    for (const y of [2.4, 6.3])
      cylinder(b, x, y, 0, r + 0.08, 0.35, 'accent-veolia', { segments: 24, cap: false });
    // Échelle à crinoline côté sud (x local +).
    b.within({ x: x + r + 0.2, ry: Math.PI / 2 }, () => {
      for (const s of [-0.3, 0.3]) box(b, s, 0.5, 0, 0.07, 8.4, 0.07, 'metal-sombre', { bevel: 0.02 });
      for (let y = 1.0; y < 8.6; y += 0.4) box(b, 0, y, 0, 0.6, 0.05, 0.05, 'metal-sombre', { bevel: 0.01 });
      for (let y = 3; y < 8.6; y += 1.2) box(b, 0, y, 0.35, 0.8, 0.06, 0.06, 'metal-sombre', { bevel: 0.01 });
    });
  }
  box(b, (TANKS[0][0] + TANKS[1][0]) / 2, 8.5, 0, TANKS[1][0] - TANKS[0][0], 0.15, 1.1, 'metal-sombre', {
    bevel: 0.03,
  });
  for (const s of [-0.55, 0.55])
    b.within({ x: (TANKS[0][0] + TANKS[1][0]) / 2, z: s }, () =>
      railing(b, 0, 8.65, TANKS[1][0] - TANKS[0][0], 'metal-sombre', { height: 0.9 }),
    );
  // Conduites des cuves au mur sud, avec brides et vanne rouge.
  // Première cuve : conduite droite au droit de la cuve ; seconde : le long de la première, coude.
  const pipe = (x0: number, x1: number, z: number) => {
    box(b, (x0 + x1) / 2, 1.6, z, x1 - x0, 0.4, 0.4, 'zinc', { bevel: 0.1 });
    for (const x of [x0 + 0.4, x1 - 0.3]) box(b, x, 1.5, z, 0.12, 0.6, 0.6, 'metal-sombre', { bevel: 0.03 });
    cylinder(b, (x0 + x1) / 2, 2.0, z, 0.12, 0.5, 'metal-sombre', { segments: 8 });
    cylinder(b, (x0 + x1) / 2, 2.5, z, 0.32, 0.1, 'accent-veolia', { segments: 14 });
  };
  pipe(W / 2, TANKS[0][0] - TANKS[0][1], 0.9);
  pipe(W / 2, TANKS[1][0], -3.0);
  box(b, TANKS[1][0], 1.6, -2.55, 0.4, 0.4, 0.9, 'zinc', { bevel: 0.1 });
  // Bassin rond (clarificateur).
  cylinder(b, BASIN.x, 0, BASIN.z, BASIN.r, 0.9, 'beton', { segments: 28, cap: false });
  cylinder(b, BASIN.x, 0, BASIN.z, BASIN.r - 0.25, 0.7, 'eau', { segments: 28 });
  box(b, BASIN.x, 0.9, BASIN.z, BASIN.r * 2 - 0.4, 0.12, 0.5, 'metal-sombre', { bevel: 0.03 });
}
