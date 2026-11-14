import CinematicCamera from './CinematicCamera';
import Interior from './Interior';
import Transitions from './Transitions';
import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Terrain from './Terrain';
import Buildings from './Buildings';
import Environment from './Environment';
import Robot from './Robot';
import Controller from './Controller';
import CameraRig from './CameraRig';
import { SkyDome, ThemeApplier } from './Atmosphere';
import { theme } from '../theme';
import { useGame, setState, getState, player, cameraMode, passage } from '../state';

function Runtime(){
  const sample=useRef({elapsed:0,frames:0});
  useEffect(()=>{setState({ready:true});const media=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setState({reducedMotion:media.matches});media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useFrame(({gl,camera},dt)=>{
    if(document.hidden)return;
    sample.current.elapsed+=dt;sample.current.frames++;
    if(sample.current.elapsed>2){
      const fps=Math.round(sample.current.frames/sample.current.elapsed);setState({fps});sample.current={elapsed:0,frames:0};
      // Opt-in, visible QA readout. No analytics or network transmission.
      const output=document.getElementById('diagnostics');
      if(output)output.textContent=JSON.stringify({fps,drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,position:[+player.x.toFixed(2),+player.y.toFixed(2),+player.z.toFixed(2)],camera:camera.position.toArray().map(n=>+n.toFixed(2)),mode:cameraMode(),doorStage:getState().phase==='doorway'?passage.stage:null,quality:getState().quality,phase:getState().phase,interior:getState().interior,station:getState().station});
    }
  });
  return null;
}
export default function World(){const {quality,interior}=useGame();return <Canvas shadows={quality==='high'?'soft':false} dpr={quality==='high'?[1,1.5]:1} camera={{position:[78,86,100],fov:41,near:.1,far:theme.sky?1400:420}} gl={{antialias:true,powerPreference:'high-performance',toneMapping:theme.toneMapping,toneMappingExposure:theme.exposure}} onCreated={({gl})=>{gl.setClearColor(theme.sky?theme.sky.horizon:'#e8cdaa');}}>
  <hemisphereLight args={[theme.hemi.sky,theme.hemi.ground,theme.hemi.intensity]}/>
  <directionalLight position={theme.sun.position} intensity={theme.sun.intensity} color={theme.sun.color} castShadow={quality==='high'} shadow-mapSize={[2048,2048]} shadow-camera-left={-65} shadow-camera-right={65} shadow-camera-top={65} shadow-camera-bottom={-65} shadow-camera-near={1} shadow-camera-far={180} shadow-normalBias={.045} shadow-bias={-.00015} shadow-radius={3}/>
  {interior?<Interior/>:<>{theme.sky?<SkyDome/>:<color attach='background' args={['#e8cdaa']}/>}{theme.fog&&<fog attach='fog' args={[theme.fog.color,theme.fog.near,theme.fog.far]}/>}<Terrain/><Buildings/><Environment/></>}<Robot/><Transitions/><Controller/><CameraRig/><CinematicCamera/><Runtime/><ThemeApplier/>
</Canvas>;}

