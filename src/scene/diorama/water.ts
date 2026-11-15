/**
 * Eau animée (V8) : fontaine de la place. Bleu doux, petites rides qui tournent, reflet clair sur
 * les crêtes ; anneaux d'éclaboussure quand le robot passe dedans (uniform `splash`).
 */
import * as THREE from 'three';
import { scene } from '../../design/tokens';

export const waterMaterial = new THREE.ShaderMaterial({
  name: 'eau',
  fog: true,
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      time: { value: 0 },
      deep: { value: new THREE.Color('#78afbf') },
      shallow: { value: new THREE.Color('#a9d6dd') },
      sky: { value: new THREE.Color(scene.sky.horizon) },
      /** Éclaboussure : x, z (monde), âge en secondes. */
      splash: { value: new THREE.Vector3(0, 0, 99) },
    },
  ]),
  vertexShader: /* glsl */ `
    #include <common>
    #include <fog_pars_vertex>
    varying vec3 vWorld;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorld = world.xyz;
      vec4 mvPosition = viewMatrix * world;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }
  `,
  fragmentShader: /* glsl */ `
    #include <common>
    #include <fog_pars_fragment>
    uniform float time;
    uniform vec3 deep;
    uniform vec3 shallow;
    uniform vec3 sky;
    uniform vec3 splash;
    varying vec3 vWorld;
    void main() {
      vec2 p = vWorld.xz;
      float w = sin(p.x * 3.1 + time * 1.7) * sin(p.y * 2.7 - time * 1.3) + 0.5 * sin((p.x + p.y) * 5.0 + time * 2.4);
      float d = length(p - splash.xy);
      float ring = splash.z < 2.5 ? sin(d * 9.0 - splash.z * 12.0) * exp(-d * 1.2) * (1.0 - splash.z / 2.5) : 0.0;
      float crest = smoothstep(0.6, 1.3, w + ring * 2.0);
      vec3 color = mix(deep, shallow, 0.5 + 0.25 * w) + sky * crest * 0.25;
      gl_FragColor = vec4(color, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }
  `,
});
