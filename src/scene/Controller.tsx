import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { getState, setState, player, view, openBuilding, resetPlayer } from '../state';
import { WORLD, CAMERA, buildings, entrance } from '../world/config';
import { heightAt } from '../world/terrain';
import { moveWithCollisions } from '../world/collision';

export default function Controller(){
  const keys=useRef(new Set<string>()),nearTimer=useRef(0);const {gl}=useThree();
  useEffect(()=>{
    const held=keys.current;
    function down(e:KeyboardEvent){
      if(e.target instanceof HTMLElement&&e.target.closest('select,input,textarea,[role="dialog"]'))return;
      if(e.key==='Enter'&&e.target instanceof HTMLElement&&e.target.closest('button'))return;
      const k=e.key.toLowerCase();
      if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
      if(e.repeat)return;
      const state=getState();
      if(k==='m'){if(!state.detail)setState({map:!state.map});held.clear();return;}
      if(k==='escape'){setState({map:false,help:false,detail:null});held.clear();return;}
      if(state.phase!=='explore'||state.map||state.detail||state.help)return;
      if(k==='e'||k==='enter'){if(state.nearby)openBuilding(state.nearby);return;}
      if(k==='r'){resetPlayer();return;}
      if(k==='c'){view.yaw=player.angle-Math.PI;view.pitch=CAMERA.elevation;return;}
      held.add(k);
    }
    const up=(e:KeyboardEvent)=>held.delete(e.key.toLowerCase());const clear=()=>{held.clear();player.speed=0;};
    let dragging=false,lastX=0,lastY=0;
    const start=(e:PointerEvent)=>{if(getState().phase!=='explore'||getState().map||getState().detail||getState().help)return;dragging=true;lastX=e.clientX;lastY=e.clientY;gl.domElement.setPointerCapture(e.pointerId);};
    const drag=(e:PointerEvent)=>{if(!dragging)return;view.yaw-=(e.clientX-lastX)*.005;view.pitch=Math.max(.25,Math.min(1.14,view.pitch+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;};
    const end=()=>{dragging=false;};
    const wheel=(e:WheelEvent)=>{if(getState().phase==='explore'){e.preventDefault();view.distance=Math.max(7,Math.min(19,view.distance+e.deltaY*.008));}};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
    gl.domElement.addEventListener('pointerdown',start);gl.domElement.addEventListener('pointermove',drag);gl.domElement.addEventListener('pointerup',end);gl.domElement.addEventListener('pointercancel',end);gl.domElement.addEventListener('wheel',wheel,{passive:false});
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);gl.domElement.removeEventListener('pointerdown',start);gl.domElement.removeEventListener('pointermove',drag);gl.domElement.removeEventListener('pointerup',end);gl.domElement.removeEventListener('pointercancel',end);gl.domElement.removeEventListener('wheel',wheel);};
  },[gl]);
  useFrame((_,delta)=>{
    const dt=Math.min(delta,.05),state=getState();
    if(state.phase!=='explore'||state.map||state.detail||state.help){keys.current.clear();player.speed=0;return;}
    const has=(...ks:string[])=>ks.some(k=>keys.current.has(k));
    let forward=Number(has('w','z','arrowup'))-Number(has('s','arrowdown'));
    let right=Number(has('d','arrowright'))-Number(has('a','q','arrowleft'));
    const len=Math.hypot(forward,right);
    if(len){forward/=len;right/=len;}
    const speed=has('shift')?WORLD.runSpeed:WORLD.walkSpeed;
    const dx=(right*Math.cos(view.yaw)-forward*Math.sin(view.yaw))*speed*dt;
    const dz=(-right*Math.sin(view.yaw)-forward*Math.cos(view.yaw))*speed*dt;
    const [x,z]=moveWithCollisions([player.x,player.z],[dx,dz]);
    player.speed=Math.hypot(x-player.x,z-player.z)/Math.max(dt,.001);player.x=x;player.z=z;
    player.y=heightAt(x,z);
    if(len){const target=Math.atan2(dx,dz);const diff=Math.atan2(Math.sin(target-player.angle),Math.cos(target-player.angle));player.angle+=diff*(1-Math.exp(-14*dt));}
    nearTimer.current+=dt;
    if(nearTimer.current>.15){nearTimer.current=0;const found=buildings.find(b=>{const [ex,ez]=entrance(b);return Math.hypot(x-ex,z-ez)<3.7;});if(state.nearby!== (found?.id??null))setState({nearby:found?.id??null});}
  },-2);
  return null;
}
