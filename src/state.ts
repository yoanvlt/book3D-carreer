import { useSyncExternalStore } from 'react';
import { WORLD, CAMERA, entrance, localToWorld, buildings, type BuildingId, type Point } from './world/config';
import { heightAt } from './world/terrain';
import { findRoute } from './world/navigation';
import { ROOM, stationsFor } from './world/narrative';
export type Phase='home'|'entering'|'explore'|'travel'|'doorway';
type State={phase:Phase;map:boolean;help:boolean;detail:BuildingId|null;nearby:BuildingId|null;quality:'high'|'low';visited:BuildingId[];ready:boolean;reducedMotion:boolean;fps:number;interior:BuildingId|null;door:BuildingId|null;station:string|null;reading:string|null;seen:string[];notice:string;};
let state:State={phase:'home',map:false,help:false,detail:null,nearby:null,quality:'high',visited:[],ready:false,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,fps:0,interior:null,door:null,station:null,reading:null,seen:[],notice:''};
const listeners=new Set<()=>void>();
export const getState=()=>state;
export const setState=(patch:Partial<State>)=>{state={...state,...patch};listeners.forEach(fn=>fn());};
export const useGame=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},getState);
export const player={x:WORLD.spawn[0],z:WORLD.spawn[1],y:heightAt(...WORLD.spawn),angle:Math.PI,speed:0,teleport:0,reaction:0};
export const view={yaw:0,pitch:CAMERA.elevation,distance:CAMERA.distance,reset:0};
export const journey={points:[] as Point[],index:1,destination:null as BuildingId|null,exit:false};
export const passage={time:0,swapped:false,leaving:false,from:[0,0] as Point,to:[0,0] as Point,pending:null as BuildingId|null};
export function enter(){setState({phase:'entering',map:false,interior:null});}
export function travel(id:BuildingId){
  if(state.phase==='doorway')return;
  if(state.interior){passage.pending=id;guideExit();return;}
  const b=buildings.find(b=>b.id===id)!,route=findRoute([player.x,player.z],entrance(b));
  if(!route.length){setState({notice:'Le trajet est indisponible depuis ce point. Avancez de quelques pas et réessayez.',map:false});return;}
  journey.exit=false;journey.points=route;journey.index=1;journey.destination=id;
  setState({map:false,detail:null,nearby:null,notice:'',phase:'travel'});
  if(state.reducedMotion)skipJourney();
}
export function skipJourney(){
  const p=journey.points.at(-1);if(!p)return;
  player.x=p[0];player.z=p[1];player.y=state.interior?0:heightAt(...p);player.speed=0;player.teleport++;
  if(journey.destination){const b=buildings.find(b=>b.id===journey.destination)!;view.yaw=b.rotation;player.angle=b.rotation+Math.PI;}
  setState({phase:'explore',nearby:state.interior?null:journey.destination});if(state.interior)view.yaw=0;if(journey.exit){journey.exit=false;leaveBuilding();}
}
export function openBuilding(id:BuildingId){
  if(state.phase!=='explore'||state.interior)return;
  const b=buildings.find(b=>b.id===id)!;
  if(Math.hypot(player.x-entrance(b)[0],player.z-entrance(b)[1])>4)return;
  passage.time=0;passage.swapped=false;passage.leaving=false;passage.from=[player.x,player.z];passage.to=localToWorld(b,0,b.size[1]/2+.65);
  player.reaction=1;setState({phase:'doorway',door:id,detail:null});
}
export function leaveBuilding(){
  if(!state.interior||state.phase==='doorway')return;
  passage.time=0;passage.swapped=false;passage.leaving=true;passage.from=[player.x,player.z];passage.to=[0,17];player.reaction=1;
  setState({phase:'doorway',door:state.interior,map:false,reading:null});
}
export function interact(){
  if(state.interior){if(state.station){player.reaction=1;setState({reading:state.station});}else if(Math.hypot(player.x,player.z-16)<3)leaveBuilding();}
  else if(state.nearby)openBuilding(state.nearby);
}
export function guideToStation(index:number){
  if(!state.interior||state.phase==='doorway')return;
  const s=stationsFor(state.interior)[index];if(!s)return;
  journey.exit=false;journey.points=[[player.x,player.z],[0,player.z],[0,s.position[1]+1],[s.position[0],s.position[1]+1]];journey.index=1;journey.destination=null;
  setState({phase:'travel',reading:null});if(state.reducedMotion)skipJourney();
}
export function goHome(){
  journey.points=[];passage.pending=null;player.x=WORLD.spawn[0];player.z=WORLD.spawn[1];player.y=heightAt(...WORLD.spawn);player.speed=0;player.teleport++;view.yaw=0;
  setState({phase:'home',interior:null,door:null,station:null,reading:null,nearby:null,map:false,detail:null,help:false});
}
export function resetPlayer(){goHome();setState({phase:'entering'});}

export function guideExit(){
  if(!state.interior)return;
  if(Math.hypot(player.x,player.z-16)<3){leaveBuilding();return;}
  journey.points=[[player.x,player.z],[0,player.z],[0,16]];journey.index=1;journey.destination=null;journey.exit=true;
  setState({phase:'travel',reading:null,map:false});
  if(state.reducedMotion){skipJourney();journey.exit=false;leaveBuilding();}
}
