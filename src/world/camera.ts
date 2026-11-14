import { cameraFraction, allObstacles, type Vec3 } from './collision';
import { heightAt } from './terrain';

export const cameraSettings = { minimumDistance:9, clearance:.65 };
export function cameraPoint(target:Vec3,yaw:number,pitch:number,distance:number):Vec3 {
  return {x:target.x+Math.sin(yaw)*Math.cos(pitch)*distance,y:target.y+Math.sin(pitch)*distance,z:target.z+Math.cos(yaw)*Math.cos(pitch)*distance};
}
const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
/** Prefer a full boom at a nearby azimuth, then an elevated view. Never a first-person retraction. */
export function chooseCamera(target:Vec3,yaw:number,pitch:number,distance:number,previousYaw:number){
  let best={point:cameraPoint(target,previousYaw,1.35,distance),yaw:previousYaw,pitch:1.35,score:Infinity};
  for(const p of [pitch,Math.max(pitch,.85),1.16,1.4])for(const offset of [0,.35,-.35,.7,-.7,1.15,-1.15,1.6,-1.6,2.2,-2.2,Math.PI]){
    const a=yaw+offset,point=cameraPoint(target,a,p,Math.max(cameraSettings.minimumDistance,distance));
    if(cameraFraction(target,point,cameraSettings.clearance)<.995)continue;
    const score=Math.abs(offset)*1.2+Math.abs(angleDelta(a,previousYaw))*.8+(p-pitch)*3;
    if(score<best.score)best={point,yaw:a,pitch:p,score};
  }
  return best;
}
/** Sweep the camera body itself, not only its line of sight. Slide rather than snap to the robot. */
export function moveCamera(from:Vec3,to:Vec3):Vec3 {
  const out={...from};
  const n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y,to.z-from.z)/.15));
  for(let i=0;i<n;i++)for(const axis of ['y','x','z'] as const){
    const candidate={...out,[axis]:out[axis]+(to[axis]-from[axis])/n};
    if(!cameraBodyBlocked(candidate))out[axis]=candidate[axis];
  }
  out.y=Math.max(out.y,heightAt(out.x,out.z)+cameraSettings.clearance);
  return out;
}
export function cameraBodyBlocked(p:Vec3){
  if(p.y<heightAt(p.x,p.z)+cameraSettings.clearance)return true;
  return allObstacles.some(o=>{
    const c=Math.cos(o.angle),s=Math.sin(o.angle),dx=p.x-o.x,dz=p.z-o.z;
    return Math.hypot(Math.max(0,Math.abs(dx*c-dz*s)-o.halfX),Math.max(0,o.bottom-p.y,p.y-o.top),Math.max(0,Math.abs(dx*s+dz*c)-o.halfZ))<cameraSettings.clearance;
  });
}
/** The room is convex: full-distance orbit candidates and interpolation stay inside its walls. */
export function chooseInteriorCamera(x:number,z:number,yaw:number,previousYaw:number){
  let best={x:0,y:6.2,z:0,yaw,score:Infinity};
  for(let i=0;i<32;i++){
    const a=yaw+i*Math.PI/16,px=x+Math.sin(a)*9,pz=z+Math.cos(a)*9;
    if(Math.abs(px)>9.7||Math.abs(pz)>16.6)continue;
    const score=Math.abs(angleDelta(a,yaw))+Math.abs(angleDelta(a,previousYaw))*.7;
    if(score<best.score)best={x:px,y:6.2,z:pz,yaw:a,score};
  }return best;
}
