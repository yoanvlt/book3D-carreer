import CinematicCamera from './CinematicCamera';
import Interior from './Interior';
import Transitions from './Transitions';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { probe } from './photo';
import Terrain, { TERRAIN_STAGES } from './Terrain';
import Buildings from './Buildings';
import { buildings } from '../world/config';
import { loadingDone, loadingStep } from '../loading';
import Environment, { ENVIRONMENT_STAGES } from './Environment';
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
// Planche du kit (`?debug=1&kit`), pour le contrôle visuel des pièces et des matières.
const KitShowcase = lazy(() => import('./KitShowcase'));
// Planche de direction artistique V8 (`?debug=1&da`).
const DirectionArtistique = lazy(() => import('./DirectionArtistique'));
const debugQuery = new URLSearchParams(window.location.search);
const artBoard = debugQuery.has('debug') && debugQuery.has('da');
const kitShowcase = (debugQuery.has('debug') && debugQuery.has('kit')) || artBoard;
import { useGame, setState, getState, player, cameraMode, passage } from '../state';

loadingStep('scene');

/**
 * Construction par tranches : une tranche (terrain, un bâtiment, une part du décor) à la fois,
 * chacune dans sa propre tâche. Pendant le chargement, le rendu est « à la demande » : chaque
 * tranche est d'abord compilée (compileAsync, en parallèle quand le GPU le permet), puis dessinée.
 * La page de chargement, animée en CSS, reste fluide entre deux tranches.
 */
const STAGES = {
  terrain: TERRAIN_STAGES,
  buildings: buildings.length,
  environment: ENVIRONMENT_STAGES,
  sky: 1,
};
const TOTAL_STAGES = STAGES.terrain + STAGES.buildings + STAGES.environment + STAGES.sky;
function Builder({ built, next }: { built: number; next: () => void }) {
  const { gl, scene, camera, invalidate } = useThree();
  useEffect(() => {
    if (built >= TOTAL_STAGES) return;
    let live = true;
    loadingStep('geometrie', built / TOTAL_STAGES);
    performance.mark(`careerverse:tranche-${built}`);
    gl.compileAsync(scene, camera)
      .catch(() => null)
      .finally(() => {
        if (!live) return;
        invalidate();
        setTimeout(next, 0);
      });
    return () => {
      live = false;
    };
  }, [built, gl, scene, camera, invalidate, next]);
  return null;
}
/** Une fois tout construit et compilé : première image, puis fondu de la page de chargement. */
function Warmup({ active }: { active: boolean }) {
  const { gl, scene, camera, invalidate } = useThree();
  const done = useRef(false);
  useEffect(() => {
    if (!active || done.current) return;
    done.current = true;
    loadingStep('geometrie');
    gl.compileAsync(scene, camera)
      .catch(() => null)
      .finally(() => {
        loadingStep('shaders');
        invalidate();
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            loadingStep('image');
            setState({ ready: true });
            loadingDone();
          }),
        );
      });
  }, [active, gl, scene, camera, invalidate]);
  return null;
}

function Runtime() {
  const sample = useRef({ elapsed: 0, frames: 0, slow: 0 });
  const { scene, gl, camera } = useThree();
  useEffect(() => {
    probe.scene = scene;
    probe.renderer = gl;
    probe.camera = camera;
    return () => {
      probe.scene = null;
      probe.renderer = null;
      probe.camera = null;
    };
  }, [scene, gl, camera]);
  useEffect(() => {
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
          dpr: gl.getPixelRatio(),
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
/**
 * Densité de pixels adaptative : PerformanceMonitor (drei) mesure la cadence et règle un facteur
 * entre 0 et 1, appliqué à une plage propre à chaque qualité (Soignée : 1 à 2, Légère : 0,75 à 1).
 */
function pixelRange(quality: 'high' | 'low'): [number, number] {
  const device = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  return quality === 'high' ? [1, Math.max(1, Math.min(2, device))] : [0.75, 1];
}
export default function World() {
  const { quality, interior, ready } = useGame();
  const [factor, setFactor] = useState(0.6);
  const [built, setBuilt] = useState(0);
  const next = useCallback(() => setBuilt((b) => b + 1), []);
  const stage = (offset: number, count: number) => Math.max(0, Math.min(count, built - offset));
  const [low, high] = pixelRange(quality);
  const dpr = Math.round((low + (high - low) * factor) * 20) / 20;
  return (
    <Canvas
      shadows={quality === 'high' ? 'soft' : false}
      dpr={dpr}
      frameloop={ready ? 'always' : 'demand'}
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
      <PerformanceMonitor
        factor={0.6}
        flipflops={4}
        onChange={({ factor }) => setFactor(factor)}
        onFallback={() => setFactor(0)}
      />
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
      {kitShowcase ? (
        <Suspense fallback={null}>{artBoard ? <DirectionArtistique /> : <KitShowcase />}</Suspense>
      ) : interior ? (
        <Interior />
      ) : (
        <>
          <SkyDome />
          <fog attach='fog' args={[scene.fog.color, scene.fog.near, scene.fog.far]} />
          <Terrain stage={stage(0, STAGES.terrain)} />
          <Buildings count={stage(STAGES.terrain, STAGES.buildings)} />
          <Environment stage={stage(STAGES.terrain + STAGES.buildings, STAGES.environment)} />
          {built >= TOTAL_STAGES && (
            <>
              <Clouds />
              <Life />
            </>
          )}
        </>
      )}
      <Robot />
      <Transitions />
      <Controller />
      <CameraRig />
      <CinematicCamera />
      <Runtime />
      <Builder built={built} next={next} />
      <Warmup active={built >= TOTAL_STAGES || kitShowcase} />
      {/* Contours (Soignée) : montés après la première image, pour ne pas allonger le chargement. */}
      {quality === 'high' && ready && (
        <Suspense fallback={null}>
          <Effects />
        </Suspense>
      )}
    </Canvas>
  );
}
