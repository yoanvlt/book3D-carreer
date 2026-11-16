/**
 * Matière « diorama doux » (V8) : la seule matière opaque du monde. Couleur lue dans l'atlas de la
 * palette, lumière douce : ciel et sol (hémisphère), soleil, ombre et occlusion précalculées une
 * seule fois (le monde est statique). Pas de carte d'ombres en temps réel, pas de contours.
 *
 * Variantes (une par source de lumière précalculée) :
 * - baked : attribut `light` par sommet (soleil, occlusion), pour les bâtiments et l'île ;
 * - ground : texture de lumière du sol, lue sous chaque pixel (terrain, routes, places, herbe) ;
 * - instanced : attribut `instanceLight` par exemplaire (arbres, mobilier), plus une occlusion
 *   de pied qui s'éclaircit avec la hauteur ;
 * - dynamic : objets mobiles (robot, personnages, voitures), éclairés par la texture du sol sous
 *   eux (ils passent à l'ombre des bâtiments).
 */
import * as THREE from 'three';
import { atlasPixels, ATLAS } from '../../world/palette';
import { scene } from '../../design/tokens';

let atlas: THREE.DataTexture | null = null;
/** Atlas de la palette, généré une fois (aucun téléchargement). */
function atlasTexture(): THREE.DataTexture {
  if (atlas) return atlas;
  const size = ATLAS.columns * ATLAS.cell;
  atlas = new THREE.DataTexture(atlasPixels(), size, ATLAS.rows * ATLAS.cell, THREE.RGBAFormat);
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.magFilter = THREE.LinearFilter;
  atlas.minFilter = THREE.LinearFilter;
  atlas.generateMipmaps = false;
  atlas.flipY = false;
  atlas.needsUpdate = true;
  return atlas;
}

/** Lumière du sol : R = soleil (0 à l'ombre), G = occlusion ambiante. Remplie par le précalcul. */
export const groundLight = {
  texture: new THREE.DataTexture(new Uint8Array([255, 255, 0, 255]), 1, 1, THREE.RGBAFormat),
  /** Rectangle couvert : x min, z min, côté (mètres). */
  rect: new THREE.Vector3(-1, -1, 2),
};
groundLight.texture.needsUpdate = true;

/** Remplace la texture de lumière du sol par le résultat du précalcul. */
export function setGroundLight(data: Uint8Array, size: number, min: number, extent: number) {
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.flipY = false;
  texture.needsUpdate = true;
  groundLight.texture = texture;
  groundLight.rect.set(min, min, extent);
  for (const m of materials.values()) m.uniforms.groundLight.value = texture;
}

const sun = new THREE.Vector3(...scene.sun.position).normalize();
/** Direction du soleil (vers le soleil), partagée par le précalcul. */
export const SUN = sun.toArray() as [number, number, number];

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vLight;
  #ifdef BAKED
    attribute vec2 light;
  #endif
  #ifdef INSTANCE_LIGHT
    attribute vec2 instanceLight;
  #endif
  void main() {
    vec4 local = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      local = instanceMatrix * local;
      n = mat3(instanceMatrix) * n;
    #endif
    vec4 world = modelMatrix * local;
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * n);
    vUv = uv;
    vLight = vec2(1.0);
    #ifdef BAKED
      vLight = light;
    #endif
    #ifdef INSTANCE_LIGHT
      // Occlusion de pied : plus sombre au ras du sol, pleine lumière à 1,5 m.
      vLight = instanceLight * vec2(1.0, mix(0.72, 1.0, clamp(position.y / 1.5, 0.0, 1.0)));
    #endif
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform sampler2D atlas;
  uniform sampler2D groundLight;
  uniform vec3 groundRect;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform vec3 skyColor;
  uniform vec3 groundColor;
  uniform vec3 cloudColor;
  uniform float ambient;
  uniform vec3 tint;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorld;
  varying vec2 vLight;
  void main() {
    vec3 albedo = texture2D(atlas, vUv).rgb * tint;
    vec3 n = normalize(vNormal);
    float sun = vLight.x;
    float ao = vLight.y;
    #ifdef GROUND_LIGHT
      vec2 g = texture2D(groundLight, (vWorld.xz - groundRect.xy) / groundRect.z).rg;
      sun *= g.r;
      #ifdef DYNAMIC
        ao *= mix(1.0, g.g, 0.35);
      #else
        ao *= g.g;
      #endif
    #endif
    float ndl = max(dot(n, sunDir), 0.0);
    // Terminateur adouci : la face à contre-jour ne tombe pas au noir.
    ndl = smoothstep(-0.12, 1.0, ndl);
    vec3 hemi = mix(groundColor, skyColor, n.y * 0.5 + 0.5);
    // Faces tournées vers le bas : éclairées par la mer de nuages, claire et bleutée.
    hemi = mix(hemi, cloudColor, 1.0 - smoothstep(-0.85, -0.35, n.y));
    vec3 color = albedo * (hemi * ambient * ao + sunColor * ndl * sun * mix(0.6, 1.0, ao));
    gl_FragColor = vec4(color, opacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export type DioramaKind = 'baked' | 'ground' | 'instanced' | 'dynamic';
const materials = new Map<string, THREE.ShaderMaterial>();

/**
 * Matière diorama d'une variante. Une seule instance par variante et par teinte : toutes les
 * pièces de même variante partagent le même programme (peu de shaders à compiler).
 */
export function dioramaMaterial(kind: DioramaKind, tint = '#ffffff'): THREE.ShaderMaterial {
  const key = `${kind}:${tint}`;
  const cached = materials.get(key);
  if (cached) return cached;
  const defines: Record<string, string> = {};
  if (kind === 'baked') defines.BAKED = '';
  if (kind === 'ground' || kind === 'dynamic') defines.GROUND_LIGHT = '';
  if (kind === 'dynamic') defines.DYNAMIC = '';
  if (kind === 'instanced') defines.INSTANCE_LIGHT = '';
  const material = new THREE.ShaderMaterial({
    name: `diorama-${kind}`,
    defines,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib.fog,
      {
        atlas: { value: null },
        groundLight: { value: null },
        groundRect: { value: new THREE.Vector3() },
        sunDir: { value: sun.clone() },
        sunColor: { value: new THREE.Color(scene.sun.color).multiplyScalar(1.15) },
        skyColor: { value: new THREE.Color(scene.hemisphere.sky) },
        groundColor: { value: new THREE.Color(scene.hemisphere.ground) },
        cloudColor: { value: new THREE.Color(scene.hemisphere.clouds) },
        ambient: { value: 0.78 },
        tint: { value: new THREE.Color(tint) },
        opacity: { value: 1 },
      },
    ]),
    vertexShader,
    fragmentShader,
  });
  // Les textures ne passent pas par UniformsUtils.merge (copie) : on les relie après.
  material.uniforms.atlas.value = atlasTexture();
  material.uniforms.groundLight.value = groundLight.texture;
  material.uniforms.groundRect.value = groundLight.rect;
  materials.set(key, material);
  return material;
}

/**
 * Copie d'une matière pour un seul objet (fondu d'un bâtiment qui cache le robot) : même
 * programme, uniformes propres.
 */
export function ownMaterial(kind: DioramaKind): THREE.ShaderMaterial {
  const base = dioramaMaterial(kind);
  const m = base.clone();
  m.uniforms.atlas.value = base.uniforms.atlas.value;
  m.uniforms.groundLight.value = groundLight.texture;
  m.uniforms.groundRect.value = groundLight.rect;
  materials.set(`${kind}:own:${materials.size}`, m);
  return m;
}
