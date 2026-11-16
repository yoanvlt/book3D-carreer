/**
 * Effet miniature très léger (V8), qualité Soignée uniquement : un flou de bascule (tilt-shift)
 * doux en haut et en bas de l'image, comme une photo de maquette. Pas de contours. Chargé à la
 * demande après la première image (import dynamique dans World.tsx).
 */
import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  KernelSize,
  RenderPass,
  TiltShiftEffect,
  ToneMappingEffect,
  ToneMappingMode,
} from 'postprocessing';

export default function Effects() {
  const { gl, scene, camera, size, viewport } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, {
      multisampling: Math.min(4, gl.capabilities.maxSamples),
      frameBufferType: THREE.HalfFloatType,
    });
    c.addPass(new RenderPass(scene, camera));
    const tilt = new TiltShiftEffect({
      focusArea: 0.82,
      feather: 0.22,
      kernelSize: KernelSize.VERY_SMALL,
      resolutionScale: 0.5,
    });
    c.addPass(new EffectPass(camera, tilt, new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL })));
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
