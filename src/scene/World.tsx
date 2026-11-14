import CinematicCamera from './CinematicCamera';
import Interior from './Interior';
import Transitions from './Transitions';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import Terrain from './Terrain';
import Buildings from './Buildings';
import Environment from './Environment';
import Robot from './Robot';
import Controller from './Controller';
import CameraRig from './CameraRig';
import { SkyDome } from './Atmosphere';
import { scene } from '../design/tokens';
import * as THREE from 'three';
import { Clouds } from './Sky';
import Life from './Life';

// Contours (postprocessing) : téléchargés seulement en qualité Soignée.
const Effects = lazy(() => import('./Effects'));
import { useGame, setState, getState, player, cameraMode, passage } from '../state';

function Runtime() {
  const sample = useRef({ elapsed: 0, frames: 0, slow: 0 });
  useEffect(() => {
    setState({ ready: true });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setState({ reducedMotion: media.matches });
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const totals = useRef({ calls: 0, triangles: 0 });
  useFrame(({ gl, camera }, dt) => {
    // Compte toutes les passes d'une image (ombres comprises) : Three remet sinon le compteur
    // à zéro après la passe d'ombre.
    gl.info.autoReset = false;
    totals.current = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
    gl.info.reset();
    if (document.hidden) return;
    sample.current.elapsed += dt;
    sample.current.frames++;
    if (sample.current.elapsed > 2) {
      const fps = Math.round(sample.current.frames / sample.current.elapsed);
      // Repli automatique : deux relevés lents d'affilée en qualité soignée, sauf choix explicite.
      const s = getState();
      const slow =
        s.quality === 'high' && s.qualityAuto && s.phase !== 'home' && fps < 28 ? sample.current.slow + 1 : 0;
      if (slow >= 2)
        setState({
          fps,
          quality: 'low',
          notice: 'Qualité légère activée pour garder la visite fluide. Vous pouvez la changer dans l’aide.',
        });
      else setState({ fps });
      sample.current = { elapsed: 0, frames: 0, slow: slow >= 2 ? 0 : slow };
      // Opt-in, visible QA readout. No analytics or network transmission.
      const output = document.getElementById('diagnostics');
      if (output)
        output.textContent = JSON.stringify({
          fps,
          drawCalls: totals.current.calls,
          triangles: totals.current.triangles,
          position: [+player.x.toFixed(2), +player.y.toFixed(2), +player.z.toFixed(2)],
          camera: camera.position.toArray().map((n) => +n.toFixed(2)),
          mode: cameraMode(),
          doorStage: getState().phase === 'doorway' ? passage.stage : null,
          quality: getState().quality,
          phase: getState().phase,
          interior: getState().interior,
          station: getState().station,
          nearby: getState().nearby,
          reading: getState().reading,
        });
    }
  });
  return null;
}
export default function World() {
  const { quality, interior } = useGame();
  return (
    <Canvas
      shadows={quality === 'high' ? 'soft' : false}
      dpr={quality === 'high' ? [1, 1.5] : 1}
      camera={{ position: [78, 86, 100], fov: 41, near: 0.1, far: 1400 }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.NeutralToneMapping,
        toneMappingExposure: scene.exposure,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(scene.sky.horizon);
      }}
    >
      <hemisphereLight args={[scene.hemisphere.sky, scene.hemisphere.ground, scene.hemisphere.intensity]} />
      <directionalLight
        position={scene.sun.position}
        intensity={scene.sun.intensity}
        color={scene.sun.color}
        castShadow={quality === 'high'}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-65}
        shadow-camera-right={65}
        shadow-camera-top={65}
        shadow-camera-bottom={-65}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-normalBias={0.045}
        shadow-bias={-0.00015}
        shadow-radius={3}
      />
      {interior ? (
        <Interior />
      ) : (
        <>
          <SkyDome />
          <fog attach='fog' args={[scene.fog.color, scene.fog.near, scene.fog.far]} />
          <Terrain />
          <Buildings />
          <Environment />
          <Clouds />
          <Life />
        </>
      )}
      <Robot />
      <Transitions />
      <Controller />
      <CameraRig />
      <CinematicCamera />
      <Runtime />
      {quality === 'high' && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
    </Canvas>
  );
}
