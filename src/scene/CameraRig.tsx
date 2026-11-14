import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA } from '../world/config';
import { chooseCamera, moveCamera, chooseInteriorCamera } from '../world/camera';
import { heightAt } from '../world/terrain';
import { getState, setState, player, view } from '../state';

export default function CameraRig(){
  const {camera,size}=useThree();const perspective=camera as THREE.PerspectiveCamera;
  const runtime=useRef({phase:'',interior:null as string|null,chosenYaw:0,teleport:0,t:0,offset:0,from:new THREE.Vector3(),lookFrom:new THREE.Vector3(),look:new THREE.Vector3(),aim:new THREE.Vector3(),desired:new THREE.Vector3(),target:new THREE.Vector3(),safe:new THREE.Vector3()});
  useFrame(({clock},delta)=>{
    const dt=Math.min(delta,.05),r=runtime.current,s=getState();const narrow=size.width<760;
    if(s.interior){
      const candidate=chooseInteriorCamera(player.x,player.z,view.yaw,r.chosenYaw);r.chosenYaw=candidate.yaw;
      r.target.set(player.x-Math.sin(candidate.yaw)*1.5,1.65,player.z-Math.cos(candidate.yaw)*1.5);
      r.desired.set(candidate.x,candidate.y,candidate.z);
      if(r.interior!==s.interior||r.teleport!==player.teleport){camera.position.copy(r.desired);r.look.copy(r.target);}else{camera.position.lerp(r.desired,1-Math.exp(-5*dt));r.look.lerp(r.target,1-Math.exp(-6*dt));}
      camera.lookAt(r.look);perspective.clearViewOffset();perspective.fov=narrow?64:60;perspective.updateProjectionMatrix();r.interior=s.interior;r.teleport=player.teleport;r.phase=s.phase;return;
    }
    if(r.interior){r.interior=null;r.target.set(player.x,player.y+1.65,player.z);const c=chooseCamera(r.target,view.yaw,view.pitch,view.distance,view.yaw);camera.position.set(c.point.x,c.point.y,c.point.z);r.look.copy(r.target);}
    if(s.phase==='home'){
      const drift=s.reducedMotion?0:Math.sin(clock.elapsedTime*.065)*2;
      const distance=narrow?1.36:1;
      camera.position.set((CAMERA.aerial[0]+drift)*distance,CAMERA.aerial[1]*distance,CAMERA.aerial[2]*distance);
      r.look.set(0,1,0);camera.lookAt(r.look);r.offset=narrow?0:-size.width*.16;
      perspective.fov=narrow?48:41;
    } else {
      r.target.set(player.x,player.y+CAMERA.targetHeight,player.z);
      r.aim.set(r.target.x-Math.sin(view.yaw)*CAMERA.lookAhead,r.target.y,r.target.z-Math.cos(view.yaw)*CAMERA.lookAhead);
      r.desired.set(player.x+Math.sin(view.yaw)*view.distance*Math.cos(view.pitch),r.target.y+Math.sin(view.pitch)*view.distance,player.z+Math.cos(view.yaw)*view.distance*Math.cos(view.pitch));
      const candidate=chooseCamera(r.target,view.yaw,view.pitch,view.distance,r.chosenYaw);
      r.chosenYaw=candidate.yaw;r.safe.set(candidate.point.x,candidate.point.y,candidate.point.z);
      if(s.phase==='explore'&&r.teleport!==player.teleport){camera.position.copy(r.safe);r.look.copy(r.target);}
      if(s.phase==='entering'){
        if(r.phase!=='entering'||r.teleport!==player.teleport){
          r.t=0;r.from.copy(camera.position);r.lookFrom.copy(r.look);
          if(r.teleport!==player.teleport){r.from.copy(r.safe).add(new THREE.Vector3(0,23,0));r.lookFrom.copy(r.aim);r.offset=0;}
        }
        r.t+=dt/(s.reducedMotion?.18:2.7);const t=Math.min(1,r.t),e=t*t*(3-2*t);
        camera.position.lerpVectors(r.from,r.safe,e);r.look.lerpVectors(r.lookFrom,r.aim,e);
        // An elevated arc clears roofs during descent and destination transitions.
        camera.position.y+=Math.sin(t*Math.PI)*12;
        camera.position.y=Math.max(camera.position.y,heightAt(camera.position.x,camera.position.z)+CAMERA.clearance);
        r.offset*=1-Math.min(.3,dt*3);
        if(t>=1){r.offset=0;setState({phase:'explore'});}
      }else{
        const smooth=1-Math.exp(-CAMERA.stiffness*dt);
        r.look.lerp(r.target,smooth);r.desired.copy(camera.position).lerp(r.safe,smooth);const moved=moveCamera(camera.position,r.desired);camera.position.set(moved.x,moved.y,moved.z);
        // Resolve after interpolation too: smoothing must never pull the camera through a wall.
        r.offset=0;
      }
      camera.lookAt(r.look);perspective.fov=THREE.MathUtils.damp(perspective.fov,narrow?53:48,3,dt);
    }
    perspective.setViewOffset(size.width,size.height,r.offset,0,size.width,size.height);perspective.updateProjectionMatrix();
    r.phase=s.phase;r.teleport=player.teleport;
  },-1);
  return null;
}
