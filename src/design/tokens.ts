/**
 * Design tokens de la direction A « Diorama ». Source unique des couleurs, de la typographie,
 * des espacements, des rayons et des ombres, partagée par l'interface (variables CSS injectées
 * au démarrage, voir cssVariables) et par la scène 3D (import direct).
 *
 * Contrastes vérifiés (WCAG 2.1) : ink sur paper 14,5:1 ; inkSoft sur paper 6,5:1 ; ink sur le ciel 5:1 au moins ;
 * paper sur accentStrong 5,1:1 ; paper sur accent 3,1:1, réservé au texte de 18 px gras et plus.
 */
import type { BuildingId } from '../world/config';

/** Couleurs de l'interface. */
export const ui = {
  ink: '#1f2b33',
  inkSoft: '#50606b',
  paper: '#ffffff',
  paperMuted: '#f2f5f7',
  line: '#dfe5ea',
  accent: '#ff5a2c',
  accentStrong: '#c93c10',
  accentShade: '#b5360f',
  focus: '#1d6fd1',
  backdrop: 'rgba(20, 34, 44, 0.42)',
} as const;

export const typography = {
  family: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, sans-serif",
  /** Tailles en px. Aucun texte d'information sous 13 px. */
  size: {
    xs: 13,
    sm: 14,
    md: 16,
    lg: 18,
    /** Bouton principal : blanc sur orange (3,1:1) n'est conforme AA qu'en grand texte gras (18,66 px et plus). */
    button: 19,
    xl: 22,
    xxl: 30,
    display: 'clamp(52px, 5.6vw, 96px)',
  },
  weight: { regular: 450, medium: 550, bold: 700, heavy: 800 },
  lineHeight: { tight: 1.05, snug: 1.3, body: 1.55 },
} as const;

/** Espacements en px (échelle de 4). */
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64 } as const;

export const radius = { sm: 8, md: 16, lg: 24, pill: 999 } as const;

export const shadow = {
  panel: '0 3px 0 rgba(31, 43, 51, 0.08), 0 12px 30px rgba(29, 79, 112, 0.16)',
  raised: '0 5px 0 ' + ui.accentShade,
  pressed: '0 2px 0 ' + ui.accentShade,
} as const;

/** Couleurs du monde 3D (sRGB). */
export const color = {
  // Neutres
  white: '#ffffff',
  cream: '#fbf8f1',
  sand: '#f3efe6',
  stone: '#e4dccb',
  stoneDark: '#cbb594',
  concrete: '#d9dde0',
  ink: '#1f2b33',
  slate: '#3b4d59',
  // Matières
  glass: '#7fcde8',
  glassDeep: '#3f8fb5',
  glassLit: '#ffe6a8',
  wood: '#c97b3f',
  woodDark: '#8a5530',
  metal: '#aab4bb',
  brick: '#d9663f',
  // Végétation
  grass: '#8fc463',
  grassHigh: '#7db456',
  garden: '#6aa94a',
  leaf: '#5fae46',
  leafDark: '#2c7a4c',
  leafAutumn: '#ffc23d',
  trunk: '#7a5236',
  flower: '#c896c3',
  hedge: '#729854',
  // Sol
  path: '#fbf6ea',
  pathEdge: '#d8c9ab',
  earth: '#9a6a46',
  water: '#79c3dd',
  // Accents
  orange: '#ff6a3d',
  orangeSoft: '#ff8a5c',
  peach: '#ffe2b8',
  yellow: '#f7b52e',
  yellowSoft: '#ffd36b',
  blue: '#4aa8d8',
  blueDeep: '#2f6f9a',
  violet: '#8a74e8',
  violetSoft: '#b4a6f2',
  teal: '#22a389',
  tealSoft: '#7fd6c2',
  red: '#e8423a',
  redDeep: '#b8231d',
  lamp: '#fff3c4',
} as const;

/** Couleur d'identité de chaque bâtiment : plan, navigation, accents 3D. */
export const placeColor: Record<BuildingId, string> = {
  profile: color.orange,
  'project-1': color.blue,
  'project-2': color.yellow,
  'project-3': color.violet,
  missions: color.teal,
  veolia: color.red,
};

/** Lumière, ciel et sol extérieurs. */
export const scene = {
  sky: { top: '#3f9fe0', horizon: '#d6efff', bottom: '#8fd0ea' },
  fog: { color: '#cfeafa', near: 190, far: 520 },
  hemisphere: { sky: '#d8ecff', ground: '#6e7d4f', intensity: 1.25 },
  sun: { color: '#fff6e6', intensity: 3.1, position: [-40, 70, 34] as [number, number, number] },
  exposure: 1,
} as const;

/** Ambiance propre à chaque intérieur. */
export interface InteriorMood {
  floor: string;
  floorLine: string;
  wall: string;
  backWall: string;
  ceiling: string;
  accent: string;
  screen: string;
  light: string;
  lightIntensity: number;
  ambient: string;
  ambientIntensity: number;
}
export const interiors: Record<BuildingId, InteriorMood> = {
  // Maison portrait : bois clair, tons pêche, lumière chaude de salon.
  profile: {
    floor: '#e9c9a0',
    floorLine: '#d4ac7d',
    wall: '#fff1e4',
    backWall: '#ff8a5c',
    ceiling: '#ffe2c8',
    accent: color.orange,
    screen: '#3a2a26',
    light: '#ffd9b0',
    lightIntensity: 1.5,
    ambient: '#fff0e0',
    ambientIntensity: 1.2,
  },
  // Pavillon de verre : blanc, bleu ciel, lumière froide et nette.
  'project-1': {
    floor: '#eef3f6',
    floorLine: '#d3dee5',
    wall: '#ffffff',
    backWall: '#4aa8d8',
    ceiling: '#e8f4fb',
    accent: color.blue,
    screen: '#16324a',
    light: '#f2f8ff',
    lightIntensity: 1.6,
    ambient: '#e6f2ff',
    ambientIntensity: 1.25,
  },
  // Manufacture : béton, jaune de chantier, lampes d'atelier.
  'project-2': {
    floor: '#d9d6cf',
    floorLine: '#bdb8ad',
    wall: '#f4eee2',
    backWall: '#f7b52e',
    ceiling: '#3b4d59',
    accent: color.yellow,
    screen: '#262a2e',
    light: '#ffe3a6',
    lightIntensity: 1.6,
    ambient: '#fff3da',
    ambientIntensity: 1.05,
  },
  // Observatoire : violet crépusculaire, éclairage plus tamisé.
  'project-3': {
    floor: '#d9d3f2',
    floorLine: '#b9b0e3',
    wall: '#efeafd',
    backWall: '#5b4bb7',
    ceiling: '#2e2a5a',
    accent: color.violet,
    screen: '#1d1840',
    light: '#e3dcff',
    lightIntensity: 1.35,
    ambient: '#d8d0ff',
    ambientIntensity: 1.05,
  },
  // Galerie : murs blancs de musée, sol clair, touches vert d'eau.
  missions: {
    floor: '#f1ece2',
    floorLine: '#ddd5c6',
    wall: '#ffffff',
    backWall: '#22a389',
    ceiling: '#f7f7f4',
    accent: color.teal,
    screen: '#173a33',
    light: '#ffffff',
    lightIntensity: 1.55,
    ambient: '#f4fffb',
    ambientIntensity: 1.25,
  },
  // Veolia : rouge et blanc, tuyauteries, salle de contrôle.
  veolia: {
    floor: '#e3e7ea',
    floorLine: '#c8cfd4',
    wall: '#f7f7f7',
    backWall: '#e8423a',
    ceiling: '#d9dde0',
    accent: color.red,
    screen: '#2a1416',
    light: '#ffffff',
    lightIntensity: 1.5,
    ambient: '#fff2f0',
    ambientIntensity: 1.15,
  },
};

/** Variables CSS dérivées des tokens, injectées une fois au démarrage (src/main.tsx). */
export function cssVariables(): string {
  const vars: Record<string, string | number> = {
    '--font': typography.family,
    '--ink': ui.ink,
    '--ink-soft': ui.inkSoft,
    '--paper': ui.paper,
    '--paper-muted': ui.paperMuted,
    '--line': ui.line,
    '--accent': ui.accent,
    '--accent-strong': ui.accentStrong,
    '--accent-shade': ui.accentShade,
    '--focus': ui.focus,
    '--backdrop': ui.backdrop,
    '--sky-top': scene.sky.top,
    '--sky-horizon': scene.sky.horizon,
    '--sky-bottom': scene.sky.bottom,
    '--shadow-panel': shadow.panel,
    '--shadow-raised': shadow.raised,
    '--shadow-pressed': shadow.pressed,
    '--display': typography.size.display,
  };
  for (const [k, v] of Object.entries(typography.size))
    if (typeof v === 'number') vars[`--text-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(typography.weight)) vars[`--weight-${k}`] = v;
  for (const [k, v] of Object.entries(space)) vars[`--space-${k}`] = `${v}px`;
  for (const [k, v] of Object.entries(radius)) vars[`--radius-${k}`] = `${v}px`;
  for (const [id, v] of Object.entries(placeColor)) vars[`--place-${id}`] = v;
  return `:root{${Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
}
