/**
 * Contours façon dessin animé, qualité Soignée uniquement. Chargé à la demande (import dynamique
 * dans World.tsx) : la bibliothèque postprocessing n'est téléchargée qu'en qualité Soignée.
 *
 * Le contour est tiré de la seule profondeur : une passe plein écran, sans passe de normales ni
 * draw call supplémentaire. Il souligne les silhouettes (bâtiments, arbres, robot) sur le sol et
 * le ciel, ce qui détache les volumes comme sur une maquette dessinée.
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  BlendFunction,
  Effect,
  EffectAttribute,
  EffectComposer,
  EffectPass,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';
import { ui } from '../design/tokens';

const fragment = /* glsl */ `
uniform vec3 lineColor;
uniform float strength;
uniform float thickness;

float linearDepth(const in vec2 uv) {
  float d = readDepth(uv);
  return d >= 0.9999 ? 1e4 : -getViewZ(d);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  vec2 o = texelSize * thickness;
  float c = linearDepth(uv);
  float n = max(
    max(abs(linearDepth(uv + vec2(o.x, 0.0)) - c), abs(linearDepth(uv - vec2(o.x, 0.0)) - c)),
    max(abs(linearDepth(uv + vec2(0.0, o.y)) - c), abs(linearDepth(uv - vec2(0.0, o.y)) - c))
  );
  // Écart relatif à la distance : même finesse de trait de près et de loin.
  float edge = smoothstep(0.035, 0.09, n / min(c, 400.0));
  // Les contours s'estompent au loin pour ne pas salir la vue aérienne.
  edge *= 1.0 - smoothstep(90.0, 220.0, min(c, 1e3));
  outputColor = vec4(mix(inputColor.rgb, lineColor, edge * strength), inputColor.a);
}
`;

class OutlineEffect extends Effect {
  constructor() {
    super('OutlineEffect', fragment, {
      attributes: EffectAttribute.DEPTH,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, THREE.Uniform>([
        ['lineColor', new THREE.Uniform(new THREE.Color(ui.ink).convertSRGBToLinear())],
        ['strength', new THREE.Uniform(0.65)],
        ['thickness', new THREE.Uniform(1.2)],
      ]),
    });
  }
}

export default function Effects() {
  const { gl, scene, camera, size, viewport } = useThree();
  const composer = useMemo(() => {
    // Tampons en demi-flottant : les valeurs supérieures à 1 restent intactes jusqu'au mappage tonal.
    const c = new EffectComposer(gl, {
      multisampling: Math.min(4, gl.capabilities.maxSamples),
      frameBufferType: THREE.HalfFloatType,
    });
    c.addPass(new RenderPass(scene, camera));
    // Le rendu passe par des cibles intermédiaires : le mappage tonal est fait ici, en dernier.
    c.addPass(
      new EffectPass(camera, new OutlineEffect(), new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL })),
    );
    return c;
  }, [gl, scene, camera]);
  useEffect(() => {
    const previous = gl.toneMapping;
    gl.toneMapping = THREE.NoToneMapping;
    return () => {
      gl.toneMapping = previous;
      composer.dispose();
    };
  }, [gl, composer]);
  useEffect(() => composer.setSize(size.width, size.height), [composer, size, viewport.dpr]);
  // Priorité positive : R3F laisse le rendu à cette boucle tant que le composant est monté.
  useFrame((_, delta) => composer.render(delta), 1);
  return null;
}
