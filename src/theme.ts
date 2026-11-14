import * as THREE from 'three';
import { CAMERA } from './world/config';

/**
 * Prototype des directions artistiques V4.
 * Sélection par l'URL : ?theme=a | b | c (sans paramètre : rendu actuel).
 * Une fois une direction choisie, ce fichier deviendra la source unique des design tokens.
 */
export type ThemeId = 'current' | 'a' | 'b' | 'c';

export interface Theme {
  id: ThemeId;
  name: string;
  sky: { top: string; horizon: string; bottom: string } | null;
  fog: { color: string; near: number; far: number } | null;
  terrain: { low: string; high: string; edge: string; base: string; garden: string; path: string; streetEdge: string };
  hemi: { sky: string; ground: string; intensity: number };
  sun: { color: string; intensity: number; position: [number, number, number] };
  interior: { background: string; light: string; lightIntensity: number };
  toneMapping: THREE.ToneMapping;
  exposure: number;
  /** Couleurs de la scène actuelle remplacées explicitement (hex sRGB minuscules). */
  palette: Record<string, string>;
  /** Transformation des autres couleurs : multiplicateurs de saturation et de luminosité. */
  shift: { s: number; l: number };
  /** Matériaux rendus lumineux (fenêtres la nuit, par exemple). */
  glow: Record<string, { emissive: string; intensity: number }>;
  signGlow: number;
}

const base = {
  terrain: { low: '#edb978', high: '#d99453', edge: '#c78354', base: '#e6c4a0', garden: '#91aa5e', path: '#f5dfb8', streetEdge: '#c58d63' },
};

export const themes: Record<ThemeId, Theme> = {
  current: {
    id: 'current', name: 'Actuel', sky: null, fog: null, terrain: base.terrain,
    hemi: { sky: '#d3eaff', ground: '#b99679', intensity: 1.4 },
    sun: { color: '#fff0d5', intensity: 2.8, position: [-35, 65, 28] },
    interior: { background: '#36535c', light: '#ffdbb6', lightIntensity: 1 },
    toneMapping: THREE.ACESFilmicToneMapping, exposure: 1.15, palette: {}, shift: { s: 1, l: 1 }, glow: {}, signGlow: 0,
  },
  // A — Diorama : plein jour, ciel bleu, herbe franche, couleurs primaires adoucies.
  a: {
    id: 'a', name: 'Diorama',
    sky: { top: '#3f9fe0', horizon: '#d6efff', bottom: '#8fd0ea' },
    fog: { color: '#cfeafa', near: 190, far: 520 },
    terrain: { low: '#8fc463', high: '#7db456', edge: '#9a6a46', base: '#79c3dd', garden: '#6aa94a', path: '#fbf6ea', streetEdge: '#d8c9ab' },
    hemi: { sky: '#d8ecff', ground: '#6e7d4f', intensity: 1.25 },
    sun: { color: '#fff6e6', intensity: 3.1, position: [-40, 70, 34] },
    interior: { background: '#eef3f6', light: '#ffffff', lightIntensity: 1.4 },
    toneMapping: THREE.NeutralToneMapping, exposure: 1.0,
    palette: {
      '#fff1d8': '#fbf8f1', '#e6c5a0': '#e4dccb', '#273f49': '#1f2b33', '#ed8159': '#ff6a3d', '#d9603b': '#ff5a2c',
      '#659faf': '#7fcde8', '#89ab57': '#5fae46', '#3f7858': '#2c7a4c', '#e6a34f': '#ffc23d', '#8a6547': '#7a5236',
      '#ec8057': '#ff6a3d', '#df7852': '#ff7a4d', '#efc59e': '#ffe2b8', '#705443': '#5a3e2e', '#4b7080': '#2f6f9a',
      '#ce904d': '#f0a92e', '#e8b05d': '#f7c64a', '#9383b8': '#8a74e8', '#b5a2d2': '#b4a6f2', '#dc945f': '#ff9d4d',
      '#f0dfb9': '#f7f2e6', '#d64b42': '#e8423a', '#c78d59': '#c97b3f', '#e9d3b0': '#f3efe6', '#f2e1c6': '#ffffff',
      '#385965': '#24485e', '#d7b08b': '#e3d6c2', '#2e515a': '#1e3a4a', '#df9772': '#ff8a5c', '#c79772': '#cbb594',
    },
    shift: { s: 1.2, l: 1 }, glow: {}, signGlow: 0,
  },
  // B — Heure dorée : soleil rasant, ombres violettes, ciel crépusculaire, contraste chaud/froid.
  b: {
    id: 'b', name: 'Heure dorée',
    sky: { top: '#1f2d57', horizon: '#f59a5f', bottom: '#c86d4b' },
    fog: { color: '#e79a6c', near: 170, far: 470 },
    terrain: { low: '#9aa24f', high: '#879244', edge: '#6e3d2c', base: '#b4603f', garden: '#6f8a38', path: '#f4d9a8', streetEdge: '#9a5e3c' },
    hemi: { sky: '#7f8fd6', ground: '#4b2f4a', intensity: 1.0 },
    sun: { color: '#ffb066', intensity: 4.2, position: [-85, 34, 22] },
    interior: { background: '#2a2238', light: '#ffc58a', lightIntensity: 1.6 },
    toneMapping: THREE.AgXToneMapping, exposure: 1.35,
    palette: {
      '#fff1d8': '#fff0da', '#273f49': '#2a2440', '#659faf': '#5b8fd0', '#89ab57': '#7f9d3c', '#3f7858': '#3d6a3a',
      '#e6a34f': '#ff9f2e', '#e9d3b0': '#ead2ad', '#385965': '#3a2f55', '#2e515a': '#2d2a4a', '#f2e1c6': '#f3dcc0',
    },
    shift: { s: 1.15, l: 1 }, glow: {}, signGlow: 0,
  },
  // C — Nuit data : ville de nuit, fenêtres éclairées, HUD façon terminal.
  c: {
    id: 'c', name: 'Nuit data',
    sky: { top: '#050914', horizon: '#1d3157', bottom: '#0a1224' },
    fog: { color: '#0e1a33', near: 150, far: 420 },
    terrain: { low: '#34504b', high: '#3d5a52', edge: '#18202f', base: '#0a1224', garden: '#2f5a45', path: '#7a8aa6', streetEdge: '#2a3550' },
    hemi: { sky: '#5b80c8', ground: '#151b2a', intensity: 1.5 },
    sun: { color: '#b4caff', intensity: 2.4, position: [45, 75, -25] },
    interior: { background: '#0a1020', light: '#9fc4ff', lightIntensity: 0.8 },
    toneMapping: THREE.NeutralToneMapping, exposure: 1.45,
    palette: {
      '#fff1d8': '#8a93a8', '#e6c5a0': '#3b4458', '#273f49': '#0f1626', '#e9d3b0': '#2a3346', '#f2e1c6': '#3a4560',
      '#385965': '#0f1a30', '#2e515a': '#0c1528', '#d7b08b': '#3a4458', '#f0dfb9': '#7c8598',
    },
    shift: { s: 0.85, l: 0.62 },
    glow: {
      '#659faf': { emissive: '#ffbf66', intensity: 1.6 },
      '#90bfcb': { emissive: '#ffbf66', intensity: 1.6 },
      '#91bbc5': { emissive: '#5ee6c8', intensity: 0.9 },
      '#d64b42': { emissive: '#ff3b3b', intensity: 0.9 },
      '#ed8159': { emissive: '#ff6a3d', intensity: 0.35 },
    },
    signGlow: 0.9,
  },
};

const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('theme');
export const theme: Theme = themes[(requested as ThemeId) in themes ? (requested as ThemeId) : 'current'];
export const themed = theme.id !== 'current';

if (typeof document !== 'undefined') document.documentElement.dataset.theme = theme.id;

// Caméra plus haute et plus large pour toutes les directions V4 (le rendu actuel est trop proche).
if (themed) {
  Object.assign(CAMERA, { distance: 21, elevation: 0.56, aerial: [92, 98, 122] });
}
export const maxCameraDistance = themed ? 27 : 19;

const tmp = new THREE.Color();
const hsl = { h: 0, s: 0, l: 0 };
/** Couleur sRGB → couleur de la direction choisie. */
export function remapHex(hex: string): string {
  if (!themed) return hex;
  const key = hex.toLowerCase();
  if (theme.palette[key]) return theme.palette[key];
  tmp.set(key).getHSL(hsl, THREE.SRGBColorSpace);
  tmp.setHSL(hsl.h, Math.min(1, hsl.s * theme.shift.s), Math.min(1, hsl.l * theme.shift.l), THREE.SRGBColorSpace);
  return '#' + tmp.getHexString(THREE.SRGBColorSpace);
}
