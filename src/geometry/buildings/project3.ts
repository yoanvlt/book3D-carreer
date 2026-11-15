/**
 * Projet 3 — observatoire à dôme (fiche : docs/batiments/project-3.md). Socle carré à terrasse,
 * tambour à douze pans, dôme de zinc à fente. Repère local : façade d'entrée vers +z.
 */
import { Builder, cells, faceNormal, gradient } from '../mesh';
import { box, dome } from '../shapes';
import {
  band,
  doorSurround,
  railing,
  wallWithDoor,
  windowAt,
  windowRow,
  type WindowStyle,
} from '../elements';

const S = 13;
const BASE = 4.2;
const DRUM = 4.6;
const TOP = 9.6;
const ACCENT = 'accent-project-3';
const SQUARE: WindowStyle = { frame: 'blanc', sill: 'pierre', bars: 1 };

export function project3(b: Builder) {
  // Socle : volume plein, façade sud percée, bandeau lavande sur les quatre faces.
  box(b, 0, 0, -0.5, S, BASE, S - 1, 'enduit', { bevel: 0.08 });
  b.within({ z: S / 2 }, () => {
    wallWithDoor(b, -S / 2, S / 2, 0, BASE, 1, 'enduit');
    doorSurround(b, 0, 0, 'pierre', { width: 0.3 });
    for (const x of [-4.2, 4.2]) windowAt(b, x, 1.1, 1.3, 1.3, SQUARE);
  });
  for (let k = 0; k < 4; k++)
    b.within({ ry: (k * Math.PI) / 2 }, () =>
      b.within({ z: S / 2 }, () => {
        band(b, -S / 2, S / 2, 0, 0.5, 0.08, 'pierre');
        band(b, -S / 2 - 0.05, S / 2 + 0.05, 3.7, 0.5, 0.14, ACCENT);
        if (k === 1 || k === 3) windowRow(b, 2, 6, 1.1, 1.3, 1.3, SQUARE);
        if (k === 2) windowRow(b, 2, 6, 1.1, 1.3, 1.3, SQUARE);
        railing(b, 0, BASE + 0.05, S - 0.3, 'metal-sombre', { height: 1 });
      }),
    );
  box(b, 0, BASE, 0, S - 0.2, 0.08, S - 0.2, 'beton', { bevel: 0.03 });
  // Tambour polygonal (12 pans) : les fenêtres sont plates sur des faces plates.
  const sides = 12;
  const ring: [number, number][] = Array.from({ length: sides }, (_, i) => {
    const a = ((i + 0.5) / sides) * Math.PI * 2;
    return [Math.sin(a) * DRUM, Math.cos(a) * DRUM];
  });
  for (let i = 0; i < sides; i++) {
    const [ax, az] = ring[i];
    const [bx, bz] = ring[(i + 1) % sides];
    const mid = Math.atan2((ax + bx) / 2, (az + bz) / 2);
    const apothem = Math.hypot((ax + bx) / 2, (az + bz) / 2);
    const width = Math.hypot(bx - ax, bz - az);
    // Pan plat (normale sortante), découpé en grille pour la lumière.
    const n = faceNormal([ax, BASE, az], [bx, BASE, bz], [ax, TOP, az]);
    const outward = n[0] * (ax + bx) + n[2] * (az + bz) > 0;
    const quad: [number, number, number][] = outward
      ? [
          [ax, BASE, az],
          [bx, BASE, bz],
          [bx, TOP, bz],
          [ax, TOP, az],
        ]
      : [
          [bx, BASE, bz],
          [ax, BASE, az],
          [ax, TOP, az],
          [bx, TOP, bz],
        ];
    b.quad(
      quad[0],
      quad[1],
      quad[2],
      quad[3],
      'enduit',
      gradient(BASE, TOP),
      cells(width),
      cells(TOP - BASE),
    );
    b.within({ ry: mid }, () =>
      b.within({ z: apothem }, () => {
        if (i !== 11) windowAt(b, 0, 1.4 + BASE, 1.0, 1.6, { frame: 'blanc', sill: 'pierre', bars: 1 });
        band(b, -width / 2 - 0.06, width / 2 + 0.06, TOP - 0.5, 0.5, 0.16, ACCENT);
      }),
    );
  }
  // Dôme de zinc et fente sombre tournée vers le sud.
  dome(b, 0, TOP, 0, DRUM + 0.3, 'zinc', { segments: 28 });
  for (let k = 0; k < 9; k++) {
    const phi = 0.08 + (k / 9) * 1.3;
    const r = DRUM + 0.36;
    b.within({ y: TOP + Math.sin(phi) * r, z: Math.cos(phi) * r }, () =>
      box(b, 0, -0.35, -0.2, 1.2, 0.7, 0.4, 'metal-sombre', { bevel: 0.05 }),
    );
  }
  box(b, 0, TOP + DRUM + 0.2, 0, 0.5, 0.25, 0.5, 'metal-sombre', { bevel: 0.06 });
  // Escalier droit sur la face est, du sol à la terrasse : marches pleines jusqu'au sol.
  b.within({ x: S / 2 + 0.75 }, () => {
    const steps = 14;
    for (let i = 0; i < steps; i++)
      box(
        b,
        0,
        0,
        -S / 2 + 1 + ((i + 0.5) * (S - 3)) / steps,
        1.3,
        (BASE * (i + 1)) / steps,
        (S - 3) / steps + 0.02,
        'beton',
        { bevel: 0.02 },
      );
  });
}
