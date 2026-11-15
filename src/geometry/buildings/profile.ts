/**
 * Profil — maison d'architecte (fiche : docs/batiments/profile.md). Brique, pierre, ardoise ;
 * médaillon-portrait en relief dans le fronton. Repère local : façade d'entrée vers +z.
 */
import { Builder } from '../mesh';
import { box, gableRoof, gableWall, prism } from '../shapes';
import { band, doorSurround, wallWithDoor, windowAt, windowRow, type WindowStyle } from '../elements';

const W = 14;
const D = 10;
const H = 7;
const RISE = 4;
const WALL = 'brique';
const STONE = 'pierre';
const FRAME: WindowStyle = { frame: 'blanc', sill: STONE, lintel: STONE, bars: 1 };

/** Silhouette de buste de profil (tête, cou, épaules), en mètres, centrée sur l'origine. */
function bust(): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const a = -Math.PI * 0.15 + (Math.PI * 1.3 * i) / 16;
    pts.push([Math.cos(a) * 0.36 + (i > 4 && i < 9 ? 0.05 : 0), 0.28 + Math.sin(a) * 0.42]);
  }
  return [
    [0.42, -0.86],
    [0.16, -0.5],
    [-0.24, -0.38],
    [-0.34, -0.12],
    ...pts.reverse().map(([x, y]) => [-x, y] as [number, number]),
    [-0.6, -0.42],
    [-0.8, -0.86],
  ];
}

export function profile(b: Builder) {
  // Soubassement, puis corps de brique. La façade sud est un mur percé de la porte.
  box(b, 0, 0, 0, W + 0.2, 0.8, D + 0.2, STONE, { bevel: 0.06 });
  box(b, 0, 0.8, -0.5, W, H - 0.8, D - 1, WALL, { bevel: 0.08 });
  b.within({ z: D / 2 }, () => {
    wallWithDoor(b, -W / 2, W / 2, 0.8, H, 1, WALL);
    // Avant-corps : deux pilastres de pierre, fronton et médaillon.
    b.within({ z: 0.6 }, () => {
      box(b, -2.5 + 0.35, 0.8, -0.3, 0.7, H + 0.6 - 0.8, 0.6, STONE, { bevel: 0.06 });
      box(b, 2.5 - 0.35, 0.8, -0.3, 0.7, H + 0.6 - 0.8, 0.6, STONE, { bevel: 0.06 });
      box(b, 0, 4.4, -0.3, 3.6, H + 0.6 - 4.4, 0.6, WALL, { bevel: 0.06 });
      prism(
        b,
        [
          [-2.8, H + 0.6],
          [2.8, H + 0.6],
          [0, H + 3.2],
        ],
        -0.6,
        0.15,
        STONE,
      );
      windowAt(b, 0, 4.6, 1.3, 1.7, FRAME);
    });
    doorSurround(b, 0, 0.8, STONE);
    windowRow(b, 2, 3.4, 1.4, 1.3, 2.2, FRAME);
  });
  // Médaillon : disque de pierre dans le fronton, buste en relief (brique foncée).
  b.within({ y: 8.3, z: D / 2 + 0.75 }, () => {
    {
      // Disque : prisme polygonal d'axe z.
      const disk: [number, number][] = Array.from({ length: 28 }, (_, i) => [
        Math.cos((i / 28) * Math.PI * 2) * 1.1,
        Math.sin((i / 28) * Math.PI * 2) * 1.1,
      ]);
      prism(b, disk, -0.1, 0.12, 'roche-claire');
      const ring: [number, number][] = Array.from({ length: 28 }, (_, i) => [
        Math.cos((i / 28) * Math.PI * 2) * 1.25,
        Math.sin((i / 28) * Math.PI * 2) * 1.25,
      ]);
      prism(b, ring, -0.12, 0.05, STONE);
      prism(b, bust(), 0.12, 0.3, 'brique-profonde');
    }
  });
  // Fenêtres sud des ailes, au rez-de-chaussée et à l'étage.
  for (const side of [-1, 1])
    b.within({ x: side * 4.75, z: D / 2 }, () => {
      windowAt(b, -0.9, 1.3, 1.3, 2.2, FRAME);
      windowAt(b, 0.9, 1.3, 1.3, 2.2, FRAME);
      windowAt(b, -0.9, 4.4, 1.2, 1.8, FRAME);
      windowAt(b, 0.9, 4.4, 1.2, 1.8, FRAME);
    });
  // Cordon et corniche de pierre sur les quatre faces.
  for (const [ry, len, off] of [
    [0, W, D / 2],
    [Math.PI, W, D / 2],
    [Math.PI / 2, D, W / 2],
    [-Math.PI / 2, D, W / 2],
  ] as const)
    b.within({ ry, z: 0 }, () =>
      b.within({ z: off }, () => {
        band(b, -len / 2, len / 2, 3.5, 0.22, 0.12, STONE);
        band(b, -len / 2 - 0.1, len / 2 + 0.1, H - 0.3, 0.3, 0.2, STONE);
      }),
    );
  // Nord : porte de service et fenêtres.
  b.within({ ry: Math.PI, z: 0 }, () =>
    b.within({ z: D / 2 }, () => {
      windowRow(b, 4, 9.6, 1.4, 1.3, 2.0, FRAME, [2]);
      box(b, 1.6, 0.8, 0.06, 1.3, 2.5, 0.14, 'bois-profond', { bevel: 0.04 });
      box(b, 1.6, 0.8, 0.12, 0.9, 1.2, 0.04, 'verre', { bevel: 0.02 });
      box(b, 1.6, 0, 0.5, 1.8, 0.8, 1, STONE, { bevel: 0.05 });
      windowRow(b, 4, 9.6, 4.4, 1.2, 1.8, FRAME);
    }),
  );
  // Pignons est et ouest : fenêtres, oculus ; cheminée sur le pignon est.
  for (const side of [-1, 1])
    b.within({ ry: (side * Math.PI) / 2 }, () =>
      b.within({ z: W / 2 }, () => {
        windowRow(b, 2, 4.4, 1.4, 1.2, 2.0, FRAME);
        windowRow(b, 2, 4.4, 4.4, 1.2, 1.8, FRAME);
        const oculus: [number, number][] = Array.from({ length: 20 }, (_, i) => [
          Math.cos((i / 20) * Math.PI * 2) * 0.55,
          8.6 + Math.sin((i / 20) * Math.PI * 2) * 0.55,
        ]);
        prism(b, oculus, -0.05, 0.14, STONE);
        prism(
          b,
          oculus.map(([x, y]) => [x * 0.75, 8.6 + (y - 8.6) * 0.75] as [number, number]),
          0.1,
          0.18,
          'verre',
        );
      }),
    );
  // Pignons maçonnés sous le toit, puis toit d'ardoise à deux pans (faîtage selon x).
  b.within({ ry: Math.PI / 2 }, () => {
    gableWall(b, H, D, 0.01, RISE, -W / 2, -W / 2 + 0.4, WALL);
    gableWall(b, H, D, 0.01, RISE, W / 2 - 0.4, W / 2, WALL);
    prism(
      b,
      [
        [-D / 2 + 0.4, H],
        [D / 2 - 0.4, H],
        [0, H + RISE - 0.35],
      ],
      -W / 2 + 0.4,
      W / 2 - 0.4,
      WALL,
    );
  });
  gableRoof(b, H, W, D, RISE, 'ardoise', { overhang: 0.5, thickness: 0.32 });
  box(b, 0, H + RISE + 0.1, 0, W + 1.1, 0.22, 0.36, 'ardoise-profonde', { bevel: 0.06 });
  // Lucarnes à fronton sur le versant sud.
  for (const x of [-4.6, 4.6])
    b.within({ x, y: H + 0.9, z: 2.3 }, () => {
      box(b, 0, 0, -0.6, 1.6, 1.9, 1.6, 'enduit', { bevel: 0.05 });
      b.within({ z: 0.2 }, () => windowAt(b, 0, 0.25, 1.0, 1.3, { frame: 'blanc', bars: 1 }));
      b.within({ z: 0 }, () =>
        prism(
          b,
          [
            [-1.05, 1.9],
            [1.05, 1.9],
            [0, 2.7],
          ],
          -1.4,
          0.15,
          'ardoise',
        ),
      );
    });
  box(b, 5.2, H, -1.2, 1.0, RISE + 1.6, 0.8, 'brique-profonde', { bevel: 0.06 });
  box(b, 5.2, H + RISE + 1.6, -1.2, 1.2, 0.2, 1.0, STONE, { bevel: 0.05 });
}
