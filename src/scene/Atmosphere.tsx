import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { theme, themed, remapHex } from '../theme';

/** Ciel en dégradé : zénith → horizon → dessous de l'île. */
export function SkyDome() {
  const sky = theme.sky;
  const material = useMemo(() => {
    if (!sky) return null;
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        top: { value: new THREE.Color(sky.top) },
        horizon: { value: new THREE.Color(sky.horizon) },
        bottom: { value: new THREE.Color(sky.bottom) },
      },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; varying vec3 vDir;
        void main(){ float y = vDir.y;
          vec3 c = y > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.85, y), 0.75)) : mix(horizon, bottom, smoothstep(0.0, 0.35, -y));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }, [sky]);
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ camera }) => { if (ref.current) ref.current.position.copy(camera.position); });
  if (!material) return null;
  return <mesh ref={ref} material={material} renderOrder={-1} frustumCulled={false}><sphereGeometry args={[600, 32, 16]} /></mesh>;
}

const linear = new THREE.Color();
function remapColor(color: THREE.Color) {
  color.set(remapHex('#' + color.getHexString(THREE.SRGBColorSpace)));
}

/**
 * Applique la palette de la direction choisie à tous les matériaux de la scène,
 * y compris ceux créés après coup (intérieurs, clones de transparence).
 */
export function ThemeApplier() {
  const { scene } = useThree();
  const clock = useRef(0);
  useFrame((_, dt) => {
    if (!themed) return;
    clock.current -= dt;
    if (clock.current > 0) return;
    clock.current = 0.25;
    scene.traverse(object => {
      if (object instanceof THREE.InstancedMesh) {
        if (!object.userData.themed && object.instanceColor) {
          for (let i = 0; i < object.count; i++) { object.getColorAt(i, linear); remapColor(linear); object.setColorAt(i, linear); }
          object.instanceColor.needsUpdate = true;
          object.userData.themed = true;
        }
        return;
      }
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const m of materials) {
        if (!(m instanceof THREE.MeshStandardMaterial) || m.userData.themed) continue;
        m.userData.themed = true;
        if (m.map) {
          if (theme.signGlow) { m.emissiveMap = m.map; m.emissive.set('#ffffff'); m.emissiveIntensity = theme.signGlow; m.needsUpdate = true; }
          continue;
        }
        if (m.vertexColors) continue;
        const source = '#' + m.color.getHexString(THREE.SRGBColorSpace);
        const glow = theme.glow[source];
        remapColor(m.color);
        if (glow) { m.emissive.set(glow.emissive); m.emissiveIntensity = glow.intensity; }
      }
    });
  });
  return null;
}
