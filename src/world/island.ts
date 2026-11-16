/**
 * Forme de l'île flottante : bord du plateau, falaise à strates puis cône rocheux jusqu'à la
 * pointe. Partagée par le maillage (scene/Island.tsx), le terrain et le filtre des nuages
 * (world/clouds.ts), pour qu'aucun nuage ne cache le dessous de l'île vu de l'accueil.
 */
export const ISLAND = {
  /** Profondeur de la pointe sous le plateau. */
  bottom: -40,
  /** Part de la hauteur occupée par la falaise presque verticale, avant le cône. */
  cliff: 0.24,
};

/** Rayon du bord du plateau dans la direction a (x = cos a, z = sin a). */
export function edgeRadius(a: number): number {
  return 66 + 4 * Math.sin(3 * a + 0.5) + 2 * Math.cos(5 * a);
}

/**
 * Rayon du dessous de l'île à la fraction t de la hauteur (0 : bord, 1 : pointe), sans le relief
 * de détail. Falaise légèrement rentrante, puis cône arrondi.
 */
export function undersideRadius(a: number, t: number): number {
  const edge = edgeRadius(a);
  if (t <= ISLAND.cliff) return edge * (1 - 0.12 * t);
  const u = (t - ISLAND.cliff) / (1 - ISLAND.cliff);
  return edge * (1 - 0.12 * ISLAND.cliff) * Math.pow(Math.cos((u * Math.PI) / 2), 0.85);
}

/** Hauteur (y) à la fraction t, du bord (y = 0) à la pointe. */
export const undersideY = (t: number) => ISLAND.bottom * t;
