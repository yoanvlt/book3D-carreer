/**
 * Herbe vivante (V8) : brins instanciés, animés par la carte graphique. Vent continu, brins
 * couchés autour du robot, teintes variées, fleurs (brins plus hauts à tête colorée). Éclairés par
 * la lumière du sol précalculée (à l'ombre d'un bâtiment, ils s'assombrissent). Seulement dans les
 * pelouses ; au loin et à l'accueil, la texture du sol suffit (le lot est masqué).
 */
import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { swatchColor, swatchIndex, type Swatch } from '../world/palette';
import { getState, player, useGame } from '../state';
import { groundLight } from './diorama/material';
import { BLADE } from '../geometry/herbe';
import { sown } from './Monde';
import { kitGeometry } from './diorama/kits';
import { instances } from './diorama/geometry';

/** Brins par mètre carré selon la qualité. */
/** Part des brins dessinés selon la qualité (le semis est fait à 7 brins/m²). */
const STRIDE = { high: 1, low: 3 };
const FLOWERS: Swatch[] = ['fleur-creme', 'fleur-rose', 'fleur-lilas', 'fleur-jaune'];

function rgb(name: Swatch, shade: number) {
  return new THREE.Color().setRGB(...swatchColor(swatchIndex(name), shade), THREE.SRGBColorSpace);
}

const vertexShader = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  attribute vec4 blade;
  attribute float lift;
  uniform float time;
  uniform vec3 robot;
  uniform sampler2D groundLight;
  uniform vec3 groundRect;
  uniform vec3 base;
  uniform vec3 tip;
  uniform vec3 flowers[4];
  varying vec3 vColor;
  void main() {
    vec2 at = blade.xy;
    float h = 0.35 + blade.z * 0.45;
    float flower = step(0.965, blade.w);
    h *= 1.0 + flower * 0.5;
    float angle = blade.w * 6.2831;
    vec3 p = position;
    p.y *= h;
    float t = position.y;
    // Vent : deux ondes qui traversent la pelouse.
    float wind = sin(time * 1.7 + at.x * 0.31 + at.y * 0.17) * 0.6 + sin(time * 2.9 + at.x * 0.9) * 0.25;
    vec2 bend = vec2(wind * 0.18, wind * 0.06);
    // Brins couchés autour du robot.
    vec2 away = at - robot.xz;
    float d = length(away);
    float press = (1.0 - smoothstep(0.6, 1.5, d)) * step(robot.y, 0.5);
    bend += normalize(away + 1e-4) * press * 0.55;
    p.y *= 1.0 - press * 0.55;
    float c = cos(angle), s = sin(angle);
    vec3 world = vec3(at.x + p.x * c - p.z * s, 0.0, at.y + p.x * s + p.z * c);
    world.xz += bend * t * t * h;
    world.y = lift + p.y;
    vec2 g = texture2D(groundLight, (at - groundRect.xy) / groundRect.z).rg;
    vec3 color = mix(base, tip, t) * mix(0.82, 1.08, blade.z);
    if (flower > 0.5 && t > 0.8) color = flowers[int(blade.z * 3.99)];
    vColor = color * (0.55 + 0.45 * g.r) * mix(0.75, 1.0, g.g);
    vec4 mvPosition = viewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export default function Herbe() {
  const { quality } = useGame();
  const mesh = useMemo(() => {
    // Semis du worker : x, z, deux tirages, hauteur du sol ; un brin sur trois en Légère.
    const all = sown.grass;
    const stride = STRIDE[quality] * BLADE;
    const count = Math.floor(all.length / stride);
    const blades = new Float32Array(count * 4);
    const heights = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      blades.set(all.subarray(i * stride, i * stride + 4), i * 4);
      heights[i] = all[i * stride + 4];
    }
    // Brin : 5 sommets, 3 triangles, effilé vers la pointe.
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-0.06, 0, 0, 0.06, 0, 0, -0.04, 0.55, 0, 0.04, 0.55, 0, 0, 1, 0], 3),
    );
    geometry.setIndex([0, 1, 3, 0, 3, 2, 2, 3, 4]);
    geometry.setAttribute('blade', new THREE.InstancedBufferAttribute(blades, 4));
    geometry.setAttribute('lift', new THREE.InstancedBufferAttribute(heights, 1));
    geometry.instanceCount = count;
    const material = new THREE.ShaderMaterial({
      name: 'herbe',
      fog: true,
      side: THREE.DoubleSide,
      uniforms: THREE.UniformsUtils.merge([
        THREE.UniformsLib.fog,
        {
          time: { value: 0 },
          robot: { value: new THREE.Vector3(0, 99, 0) },
          groundLight: { value: null },
          groundRect: { value: new THREE.Vector3() },
          base: { value: rgb('herbe-profonde', 0.8) },
          tip: { value: rgb('herbe-claire', 0.15) },
          flowers: { value: FLOWERS.map((f) => rgb(f, 0.3)) },
        },
      ]),
      vertexShader,
      fragmentShader: /* glsl */ `
        #include <common>
        #include <fog_pars_fragment>
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }
      `,
    });
    const m = new THREE.Mesh(geometry, material);
    m.frustumCulled = false;
    m.name = 'herbe';
    return m;
  }, [quality]);
  useFrame(({ camera }, dt) => {
    const u = (mesh.material as THREE.ShaderMaterial).uniforms;
    u.groundLight.value = groundLight.texture;
    u.groundRect.value = groundLight.rect;
    if (!getState().reducedMotion) u.time.value += dt;
    u.robot.value.set(player.x, player.y + player.jump.height, player.z);
    // Au loin (accueil, vols), la texture du sol suffit : le lot n'est pas dessiné.
    mesh.visible = camera.position.length() < 120 && getState().interior === null;
  });
  // Cailloux épars dans les pelouses (rochers du pack nature, réduits).
  const pebbles = useMemo(() => {
    const list = sown.pebbles;
    const placed = [];
    for (let i = 0; i < list.length; i += BLADE)
      placed.push({
        x: list[i],
        y: list[i + 4],
        z: list[i + 1],
        ry: list[i + 2] * 6.28,
        scale: 0.22 + list[i + 3] * 0.25,
      });
    return instances(kitGeometry('rocher-a'), placed);
  }, []);
  return (
    <>
      <primitive object={mesh} />
      <primitive object={pebbles} />
    </>
  );
}
