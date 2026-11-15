/**
 * Matières procédurales : brique, bardage, bac acier, béton, enduit, tuiles, dallage, gravier,
 * pavés, parquet, lames, pierre. Aucune texture : le motif est calculé dans le shader à partir de
 * la position et de la normale de chaque fragment, dans le repère de l'objet regroupé (StaticBatch),
 * donc aligné sur les murs d'un bâtiment même tourné.
 *
 * Chaque sommet porte deux attributs, `surface` (motif, rugosité, échelle) et `glowMetal` (lumière
 * émise et métal) : toutes les matières d'un bâtiment partagent un seul matériau, donc un seul draw call. Le motif s'efface quand il
 * devient plus fin qu'un pixel (pas de moirage vu de loin).
 */
import * as THREE from 'three';

export const PATTERNS = {
  none: 0,
  brick: 1,
  planks: 2,
  cladding: 3,
  panels: 4,
  render: 5,
  tiles: 6,
  paving: 7,
  gravel: 8,
  cobbles: 9,
  parquet: 10,
  slats: 11,
  stone: 12,
} as const;
export type Pattern = keyof typeof PATTERNS;

const common = /* glsl */ `
varying vec3 vSurface;
varying vec4 vGlowMetal;
varying vec3 vSurfPos;
varying vec3 vSurfNormal;
float sHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(sHash(i), sHash(i + vec2(1, 0)), u.x), mix(sHash(i + vec2(0, 1)), sHash(i + vec2(1, 1)), u.x), u.y);
}
// 1 sur un joint (bord de cellule), 0 au milieu ; w en part de cellule, lissé sur un pixel.
float sJoint(float x, float w) {
  float d = abs(fract(x + 0.5) - 0.5);
  float aa = fwidth(x);
  return 1.0 - smoothstep(w - aa, w + aa, d);
}
vec3 surfacePattern(vec3 base) {
  float id = floor(vSurface.x + 0.5);
  if (id < 0.5) return base;
  vec3 n = abs(normalize(vSurfNormal));
  vec3 p = vSurfPos * vSurface.z;
  bool top = n.y > max(n.x, n.z);
  // u : horizontal le long de la face, v : vertical (ou profondeur pour une face horizontale).
  vec2 uv = top ? p.xz : (n.x > n.z ? vec2(p.z, p.y) : vec2(p.x, p.y));
  float fade = 1.0 - smoothstep(0.08, 0.35, max(fwidth(uv.x), fwidth(uv.y)));
  float s = 1.0;
  vec3 tint = vec3(1.0);
  if (id < 1.5) {
    // Brique : assises de 0,25, briques de 0,5 décalées d'une demi-brique.
    if (top) return base;
    vec2 c = uv / vec2(0.5, 0.25);
    float row = floor(c.y);
    c.x += 0.5 * mod(row, 2.0);
    float mortar = max(sJoint(c.x, 0.05), sJoint(c.y, 0.09));
    s = mix(0.9 + 0.16 * sHash(floor(c) + row), 1.32, mortar);
  } else if (id < 2.5) {
    // Bardage bois : lames verticales de 0,3, fil du bois.
    vec2 c = vec2(uv.x / 0.3, uv.y);
    float board = floor(c.x);
    float grain = sNoise(vec2(c.x * 6.0, c.y * 0.6 + board * 3.1));
    s = (0.9 + 0.14 * sHash(vec2(board, 7.0))) * (0.95 + 0.08 * grain) * mix(1.0, 0.62, sJoint(c.x, 0.06));
  } else if (id < 3.5) {
    // Bac acier : nervures verticales.
    float r = fract(uv.x / 0.32);
    s = 0.84 + 0.2 * smoothstep(0.0, 0.25, r) * (1.0 - smoothstep(0.55, 0.8, r));
  } else if (id < 4.5) {
    // Panneaux de béton : calepinage 2,4 × 1,5, joints creux.
    vec2 c = uv / vec2(2.4, 1.5);
    s = (0.95 + 0.08 * sHash(floor(c))) * mix(1.0, 0.72, max(sJoint(c.x, 0.012), sJoint(c.y, 0.02)));
    s *= 0.97 + 0.05 * sNoise(uv * 3.0);
  } else if (id < 5.5) {
    // Enduit : grain fin.
    s = 0.95 + 0.07 * sNoise(uv * 7.0) + 0.03 * sNoise(uv * 23.0);
  } else if (id < 6.5) {
    // Tuiles : rangs de 0,32, recouvrement ombré, tuiles de 0,28 décalées.
    vec2 c = uv / vec2(0.28, 0.32);
    float row = floor(c.y);
    c.x += 0.5 * mod(row, 2.0);
    float lap = fract(c.y);
    s = (0.82 + 0.26 * lap) * (0.92 + 0.12 * sHash(floor(c))) * mix(1.0, 0.7, sJoint(c.x, 0.05));
  } else if (id < 7.5) {
    // Dallage : dalles de 0,8, joints clairs.
    vec2 c = uv / 0.8;
    s = mix(0.95 + 0.08 * sHash(floor(c)), 0.82, max(sJoint(c.x, 0.03), sJoint(c.y, 0.03)));
  } else if (id < 8.5) {
    // Gravier.
    s = 0.86 + 0.24 * sHash(floor(uv * 16.0)) * (0.7 + 0.3 * sNoise(uv * 3.0));
  } else if (id < 9.5) {
    // Pavés : 0,36 × 0,24 en quinconce, joints larges.
    vec2 c = uv / vec2(0.36, 0.24);
    float row = floor(c.y);
    c.x += 0.5 * mod(row, 2.0);
    s = mix(0.9 + 0.16 * sHash(floor(c) + row), 0.7, max(sJoint(c.x, 0.1), sJoint(c.y, 0.14)));
  } else if (id < 10.5) {
    // Parquet : lames de 0,2 × 1,2 à coupes décalées.
    vec2 c = uv / vec2(0.2, 1.2);
    float col = floor(c.x);
    c.y += sHash(vec2(col, 3.0));
    s = (0.9 + 0.14 * sHash(vec2(col, floor(c.y)))) * mix(1.0, 0.75, max(sJoint(c.x, 0.04), sJoint(c.y, 0.008)));
  } else if (id < 11.5) {
    // Lames horizontales (stores, ventelles, grilles).
    s = 0.78 + 0.26 * smoothstep(0.15, 0.6, fract(uv.y / 0.12));
  } else {
    // Pierre : plaques irrégulières.
    float k = sNoise(uv * 1.3) * 0.6 + sNoise(uv * 4.0) * 0.4;
    s = 0.84 + 0.24 * k;
    tint = mix(vec3(1.0), vec3(0.96, 1.0, 1.04), sNoise(uv * 0.7));
  }
  return base * mix(vec3(1.0), s * tint, fade);
}
`;

/** Ajoute au matériau standard la lecture de l'attribut `surface` (motif et rugosité par sommet). */
export function applySurface(m: THREE.MeshStandardMaterial) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nattribute vec3 surface;\nattribute vec4 glowMetal;\nvarying vec3 vSurface;\nvarying vec4 vGlowMetal;\nvarying vec3 vSurfPos;\nvarying vec3 vSurfNormal;',
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvSurface = surface;\nvGlowMetal = glowMetal;\nvSurfPos = position;\nvSurfNormal = normal;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + common)
      .replace(
        '#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb = surfacePattern(diffuseColor.rgb);',
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = vSurface.y;',
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = vGlowMetal.w;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance = vGlowMetal.rgb;',
      );
  };
  m.customProgramCacheKey = () => 'careerverse-surface';
  return m;
}
