/**
 * Éléments d'architecture communs aux six bâtiments (V8). Repère d'une façade : x le long du mur,
 * y vers le haut, z vers l'extérieur, z = 0 sur le nu du mur. Les fenêtres sont posées en saillie
 * (cadre, vitre, appui, linteau), comme dans les kits ; seule la porte traverse le mur.
 */
import { Builder } from './mesh';
import { box } from './shapes';
import type { Swatch } from '../world/palette';

type Paint = Swatch | number;

/** Ouverture commune des portes : le robot passe sans frôler. */
const DOOR = { w: 2.7, h: 3.3 } as const;

export interface WindowStyle {
  frame: Paint;
  glass?: Paint;
  sill?: Paint;
  lintel?: Paint;
  /** Petits bois : 0 (aucun), 1 (croix) ou 2 (deux traverses). */
  bars?: number;
  /** Volets battants de part et d'autre. */
  shutters?: Paint;
}

/** Fenêtre en saillie sur le nu du mur, centrée en x, d'allège y0, de taille w × h. */
export function windowAt(b: Builder, x: number, y0: number, w: number, h: number, s: WindowStyle) {
  const glass = s.glass ?? 'verre';
  box(b, x, y0, 0.04, w - 0.12, h - 0.12, 0.08, glass, { bevel: 0.02, top: 0.1, base: 0.85 });
  // Cadre : quatre montants fins.
  box(b, x - w / 2 + 0.06, y0 - 0.06, 0.08, 0.14, h + 0.12, 0.16, s.frame, { bevel: 0.03 });
  box(b, x + w / 2 - 0.06, y0 - 0.06, 0.08, 0.14, h + 0.12, 0.16, s.frame, { bevel: 0.03 });
  box(b, x, y0 + h - 0.06, 0.08, w, 0.14, 0.16, s.frame, { bevel: 0.03 });
  box(b, x, y0 - 0.06, 0.08, w, 0.12, 0.16, s.frame, { bevel: 0.03 });
  const bars = s.bars ?? 1;
  if (bars >= 1) box(b, x, y0, 0.1, 0.07, h, 0.06, s.frame, { bevel: 0.015 });
  for (let i = 1; i <= bars; i++)
    box(b, x, y0 + (h * i) / (bars + 1), 0.1, w - 0.1, 0.07, 0.06, s.frame, { bevel: 0.015 });
  if (s.sill) box(b, x, y0 - 0.2, 0.14, w + 0.3, 0.16, 0.28, s.sill, { bevel: 0.04 });
  if (s.lintel) box(b, x, y0 + h, 0.06, w + 0.36, 0.3, 0.14, s.lintel, { bevel: 0.04 });
  if (s.shutters)
    for (const side of [-1, 1])
      box(b, x + side * (w / 2 + 0.38), y0, 0.08, 0.68, h, 0.08, s.shutters, { bevel: 0.03 });
}

/** Rangée de fenêtres régulières, centrée, sur une largeur donnée. */
export function windowRow(
  b: Builder,
  count: number,
  span: number,
  y0: number,
  w: number,
  h: number,
  s: WindowStyle,
  skip: number[] = [],
) {
  for (let i = 0; i < count; i++) {
    if (skip.includes(i)) continue;
    const x = count === 1 ? 0 : -span / 2 + (span * i) / (count - 1);
    windowAt(b, x, y0, w, h, s);
  }
}

/**
 * Mur plein entre x0 et x1, y0 et y1, d'épaisseur `depth` (vers l'intérieur, z ≤ 0), percé
 * d'une porte centrée en `doorX` : trois blocs autour de l'ouverture, embrasure du même
 * matériau, fond sombre et seuil de pierre. Rien de l'intérieur n'est visible.
 */
export function wallWithDoor(
  b: Builder,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  depth: number,
  wall: Paint,
  doorX = 0,
) {
  const { w, h } = DOOR;
  const left = doorX - w / 2;
  const right = doorX + w / 2;
  const z = -depth / 2;
  box(b, (x0 + left) / 2, y0, z, left - x0, y1 - y0, depth, wall, { bevel: 0.06 });
  box(b, (right + x1) / 2, y0, z, x1 - right, y1 - y0, depth, wall, { bevel: 0.06 });
  box(b, doorX, y0 + h, z, w, y1 - y0 - h, depth, wall, { bevel: 0.04 });
  // Fond du sas (sombre) et seuil.
  box(b, doorX, y0, -depth + 0.05, w + 0.1, h + 0.05, 0.1, 'encre', { bevel: 0.01 });
  box(b, doorX, y0, 0.1, w + 0.4, 0.12, 0.6, 'pierre', { bevel: 0.04 });
}

/** Encadrement de porte en saillie (piédroits et linteau), autour de l'ouverture commune. */
export function doorSurround(
  b: Builder,
  x: number,
  y0: number,
  paint: Paint,
  o: { width?: number; cap?: Paint } = {},
) {
  const { w, h } = DOOR;
  const t = o.width ?? 0.4;
  for (const side of [-1, 1])
    box(b, x + side * (w / 2 + t / 2), y0, 0.08, t, h + t, 0.18, paint, { bevel: 0.04 });
  box(b, x, y0 + h, 0.1, w + 2 * t + 0.1, t + 0.05, 0.22, o.cap ?? paint, { bevel: 0.05 });
}

/** Bandeau horizontal (corniche, cordon, soubassement) sur toute une façade. */
export function band(b: Builder, x0: number, x1: number, y0: number, h: number, out: number, paint: Paint) {
  box(b, (x0 + x1) / 2, y0, out / 2 - 0.02, x1 - x0, h, out + 0.04, paint, { bevel: Math.min(0.06, h / 3) });
}

/** Garde-corps à barreaux le long de x, posé en y0, de longueur `length`, centré en x. */
export function railing(
  b: Builder,
  x: number,
  y0: number,
  length: number,
  paint: Paint,
  o: { height?: number; spacing?: number } = {},
) {
  const h = o.height ?? 1.05;
  const n = Math.max(2, Math.round(length / (o.spacing ?? 0.32)));
  box(b, x, y0 + h - 0.06, 0, length, 0.08, 0.1, paint, { bevel: 0.03 });
  box(b, x, y0 + 0.12, 0, length, 0.06, 0.07, paint, { bevel: 0.02 });
  for (let i = 0; i <= n; i++)
    box(b, x - length / 2 + (length * i) / n, y0, 0, 0.05, h, 0.05, paint, { bevel: 0.015 });
}
