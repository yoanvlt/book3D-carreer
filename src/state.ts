import { useSyncExternalStore } from 'react';
import { WORLD, CAMERA, entrance, buildings, type BuildingId } from './world/config';
import { heightAt } from './world/terrain';

export type Phase='home'|'entering'|'explore';
type State={phase:Phase; map:boolean; help:boolean; detail:BuildingId|null; nearby:BuildingId|null; quality:'high'|'low'; visited:BuildingId[]; ready:boolean; reducedMotion:boolean; fps:number;};
let state:State={phase:'home',map:false,help:false,detail:null,nearby:null,quality:'high',visited:[],ready:false,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches,fps:0};
const listeners=new Set<()=>void>();
export const getState=()=>state;
export const setState=(patch:Partial<State>)=>{state={...state,...patch};listeners.forEach(fn=>fn());};
export const useGame=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},getState);
export const player={x:WORLD.spawn[0],z:WORLD.spawn[1],y:heightAt(...WORLD.spawn),angle:Math.PI,speed:0,teleport:0};
export const view={yaw:0,pitch:CAMERA.elevation,distance:CAMERA.distance,reset:0};
export function enter(){setState({phase:'entering',map:false});}
export function travel(id:BuildingId){
  const b=buildings.find(b=>b.id===id)!;const [x,z]=entrance(b);
  player.x=x;player.z=z;player.y=heightAt(x,z);player.angle=b.rotation+Math.PI;player.speed=0;player.teleport++;
  view.yaw=b.rotation;view.pitch=CAMERA.elevation;
  setState({map:false,detail:null,nearby:id,phase:'entering'});
}
export function openBuilding(id:BuildingId){setState({detail:id,visited:state.visited.includes(id)?state.visited:[...state.visited,id]});}
export function resetPlayer(){player.x=WORLD.spawn[0];player.z=WORLD.spawn[1];player.y=heightAt(...WORLD.spawn);player.teleport++;view.yaw=0;setState({phase:'entering',map:false,detail:null,help:false});}
