import { type Building, type BuildingId, localToWorld } from './config';
import { allObstacles, type Vec3 } from './collision';
import { cameraBodyBlocked } from './camera';

export type Shot={position:Vec3;target:Vec3};
type Composition={duration:number;description:string;frames:[number,number,number,number][]};
// Local architectural coordinates: x, height, front distance, target height.
// Front-quarter reveals keep the entrance visible; no generic full-circle orbit.
export const compositions:Record<BuildingId,Composition>={
  profile:{duration:8.5,description:'Une silhouette habitée. Le portrait devient architecture.',frames:[[-18,12,30,10],[-20,29,34,12],[12,24,35,11],[7,13,30,9]]},
  'project-1':{duration:8,description:'Des volumes décalés, reliés par la lumière.',frames:[[-23,17,25,8],[-12,22,30,9],[18,18,29,8],[9,12,26,7]]},
  'project-2':{duration:8,description:'Un atelier où la structure devient mouvement.',frames:[[-23,12,25,6],[-16,19,29,8],[18,21,28,7],[8,11,27,6]]},
  'project-3':{duration:9,description:'Des plateformes au dôme, une invitation à prendre du recul.',frames:[[-17,12,28,8],[-20,24,29,11],[8,30,31,12],[14,18,31,9]]},
  missions:{duration:7.5,description:'Une galerie ouverte, plusieurs espaces pour expérimenter.',frames:[[-24,11,24,4],[-9,15,28,4],[19,13,28,4],[9,10,25,4]]},
  veolia:{duration:8.5,description:'Cuves, réseaux et passerelles : un paysage industriel.',frames:[[23,15,29,7],[18,24,30,9],[-18,22,32,8],[-9,13,30,7]]},
};
export const ease=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
export const mix3=(a:Vec3,b:Vec3,t:number):Vec3=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
export const distance3=(a:Vec3,b:Vec3)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export function clearCameraSegment(a:Vec3,b:Vec3){
  const n=Math.max(1,Math.ceil(distance3(a,b)/.2));
  for(let i=0;i<=n;i++)if(cameraBodyBlocked(mix3(a,b,i/n)))return false;
  return true;
}
export function safeCameraRoute(a:Vec3,b:Vec3):Vec3[]{
  if(clearCameraSegment(a,b))return [a,b];
  // Above the tallest collision volume; ascent/descent stay at safe endpoints.
  const top=Math.max(a.y,b.y,...allObstacles.map(o=>o.top))+5;
  const up={...a,y:top},down={...b,y:top};
  return [a,up,down,b];
}
export function sampleRoute(points:Vec3[],t:number):Vec3{
  const lengths=points.slice(1).map((p,i)=>distance3(points[i],p));
  let distance=Math.max(0,Math.min(1,t))*lengths.reduce((a,b)=>a+b,0);
  for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]||i===lengths.length-1)return mix3(points[i],points[i+1],lengths[i]?ease(distance/lengths[i]):1);distance-=lengths[i];}
  return points.at(-1)!;
}
export function buildingShots(b:Building,aspect:number):Shot[]{
  const scale=Math.max(1,1.5/Math.max(.4,aspect));
  return compositions[b.id].frames.map(([x,y,z,aim])=>{
    const target={x:b.position[0],y:b.elevation+aim,z:b.position[1]};
    const p=localToWorld(b,x*scale,z*scale);
    const position={x:p[0],y:b.elevation+aim+(y-aim)*scale,z:p[1]};
    // Wider framing on portrait screens can put a viewpoint over a neighbour.
    while(cameraBodyBlocked(position))position.y+=1;
    return {position,target};
  });
}
