/**
 * Palette « diorama doux » (V8) : la seule source des couleurs du monde. Elle produit l'atlas
 * partagé par les kits KayKit (recolorés par scripts/kits.mjs) et par les six bâtiments, comme
 * l'atlas d'origine des kits : une grille de 8 × 8 cases, chacune en léger dégradé vertical
 * (haut un peu plus clair, bas un peu plus sombre). Aucun fichier image : la texture est générée
 * au chargement à partir de cette liste (scene/atlas.ts).
 *
 * Verts tendres, pierre claire, toits terre cuite et ardoise ; les accents vifs sont réservés aux
 * enseignes et aux détails des six lieux.
 */
export const SWATCHES = [
  // Nature (0-20)
  ['herbe-claire', '#b3c98a'],
  ['herbe', '#98b874'],
  ['herbe-profonde', '#7a9f60'],
  ['feuillage-clair', '#a3c27c'],
  ['feuillage', '#7fa762'],
  ['feuillage-profond', '#5d8650'],
  ['feuillage-automne', '#cfa968'],
  ['tronc', '#86664c'],
  ['paillis', '#9a7a5c'],
  ['roche-claire', '#d3cbbd'],
  ['roche', '#b2aa9c'],
  ['roche-profonde', '#8d8579'],
  ['strate-claire', '#d4b994'],
  ['strate', '#b9997a'],
  ['strate-profonde', '#977c68'],
  ['eau', '#9ccad3'],
  ['eau-profonde', '#78afbf'],
  ['fleur-creme', '#f3ead8'],
  ['fleur-rose', '#e5b0a7'],
  ['fleur-lilas', '#bdaed3'],
  ['fleur-jaune', '#ead386'],
  // Minéral et voirie (21-31)
  ['dalle', '#e9e3d7'],
  ['bordure', '#d3cbbb'],
  ['pierre', '#bcb19e'],
  ['enrobe', '#7d8183'],
  ['enrobe-clair', '#949899'],
  ['marquage', '#efece4'],
  ['marquage-ocre', '#d8bb7c'],
  ['beton', '#dcd8d0'],
  ['beton-profond', '#bfbab1'],
  ['enduit', '#f1e9db'],
  ['enduit-chaud', '#e9d6bd'],
  // Toits et matières (32-45)
  ['terre-cuite', '#cf8a69'],
  ['terre-cuite-profonde', '#b06f55'],
  ['brique', '#c07c62'],
  ['brique-profonde', '#9c624b'],
  ['ardoise', '#7b8691'],
  ['ardoise-profonde', '#606b76'],
  ['zinc', '#a6aeb2'],
  ['metal-sombre', '#5b6369'],
  ['bois-clair', '#d2ab83'],
  ['bois', '#ae8562'],
  ['bois-profond', '#87664b'],
  ['verre', '#c2dce3'],
  ['verre-profond', '#a3c3cf'],
  ['fenetre-chaude', '#f2ddab'],
  // Accents des six lieux (46-51)
  ['accent-profile', '#d98a67'],
  ['accent-project-1', '#6aa3b7'],
  ['accent-project-2', '#d6a557'],
  ['accent-project-3', '#9890c4'],
  ['accent-missions', '#6aa392'],
  ['accent-veolia', '#c8645a'],
  // Divers (52-63)
  ['blanc', '#f6f3ed'],
  ['encre', '#3a4045'],
  ['tissu-bleu', '#8aa7bc'],
  ['tissu-ocre', '#d9bb7a'],
  ['tissu-rouge', '#c47c6f'],
  ['carrosserie-rouge', '#c47a6c'],
  ['carrosserie-bleue', '#7f9bb0'],
  ['carrosserie-verte', '#8eab95'],
  ['gris-fonce', '#676c70'],
  ['gris-clair', '#c3c5c5'],
  ['creme', '#f1e3bb'],
  ['lumiere', '#fff1c9'],
] as const;

export type Swatch = (typeof SWATCHES)[number][0];
export const ATLAS = { columns: 8, rows: 8, cell: 16 } as const;

const INDEX = new Map<string, number>(SWATCHES.map(([name], i) => [name, i]));

/** Index d'une case de la palette. */
export function swatchIndex(name: Swatch): number {
  return INDEX.get(name)!;
}

/**
 * Coordonnées de texture d'une case : `shade` de 0 (haut du dégradé, plus clair) à 1 (bas, plus
 * sombre). Les bords de case sont évités pour que le filtrage ne mélange pas deux couleurs.
 */
export function swatchUV(name: Swatch | number, shade = 0.5): [number, number] {
  const i = typeof name === 'number' ? name : swatchIndex(name);
  const col = i % ATLAS.columns;
  const row = Math.floor(i / ATLAS.columns);
  const inset = 2 / ATLAS.cell;
  const s = inset + (1 - 2 * inset) * Math.max(0, Math.min(1, shade));
  // Convention glTF : v = 0 en haut de l'image (la texture est créée sans flipY).
  return [(col + 0.5) / ATLAS.columns, (row + s) / ATLAS.rows];
}

const hex = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);

/** Couleur sRGB (0-1) d'une case, à une position du dégradé (même calcul que la texture). */
export function swatchColor(i: number, shade = 0.5): [number, number, number] {
  const [r, g, b] = hex(SWATCHES[i][1]);
  // Haut : +7 % vers le blanc ; bas : -9 % vers le noir. Contraste doux.
  const k = 0.07 - 0.16 * shade;
  const mix = (c: number) => (k >= 0 ? c + (1 - c) * k : c * (1 + k));
  return [mix(r), mix(g), mix(b)];
}

/** Pixels RGBA de l'atlas (ligne 0 en haut), pour la texture et pour le pipeline des kits. */
export function atlasPixels(): Uint8Array {
  const { columns, rows, cell } = ATLAS;
  const width = columns * cell;
  const data = new Uint8Array(width * rows * cell * 4);
  for (let y = 0; y < rows * cell; y++)
    for (let x = 0; x < width; x++) {
      const i = Math.floor(y / cell) * columns + Math.floor(x / cell);
      const shade = ((y % cell) + 0.5) / cell;
      const c = swatchColor(Math.min(i, SWATCHES.length - 1), shade);
      const o = (y * width + x) * 4;
      data[o] = Math.round(c[0] * 255);
      data[o + 1] = Math.round(c[1] * 255);
      data[o + 2] = Math.round(c[2] * 255);
      data[o + 3] = 255;
    }
  return data;
}

/** Composantes OKLab d'une couleur sRGB (0-1), pour choisir la case la plus proche. */
function oklab([r, g, b]: number[]): [number, number, number] {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Case de la palette la plus proche d'une couleur des kits, après adoucissement : saturation
 * réduite de 40 %, clarté remontée vers le pastel. Les accents des six lieux sont exclus : ils
 * sont réservés aux enseignes et aux bâtiments. @public */
export function nearestSwatch(rgb: number[]): number {
  const [L, a, b] = oklab(rgb);
  const soft: [number, number, number] = [L + (0.78 - L) * 0.18, a * 0.6, b * 0.6];
  let best = 0;
  let distance = Infinity;
  SWATCHES.forEach(([name, value], i) => {
    if (name.startsWith('accent-') || name === 'lumiere') return;
    const [L2, a2, b2] = oklab(hex(value));
    const d = (soft[0] - L2) ** 2 * 1.4 + (soft[1] - a2) ** 2 + (soft[2] - b2) ** 2;
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best;
}
