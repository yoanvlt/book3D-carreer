import { buildings, entrance, localToWorld, type Point } from './config';
/** Two meandering streets, a hill climb and individual front courts; no radial ring. */
export const streets:Point[][]=[
  [[-44,7],[-30,5],[-17,5],[-10,-2],[-12,-17],[2,-20],[17,-14],[20,1],[23,9],[45,10]],
  [[-42,34],[-28,33],[-16,33],[-9,26],[5,27],[20,34],[35,34],[46,29]],
  [[-9,26],[-10,13],[-10,-2]],
  [[17,-14],[24,-13],[33,-14],[43,-21]],
  [[20,1],[21,18],[20,34]],
];
const junctions:Point[]=[[-27,33],[-27,5],[0,-20],[29,-14],[5,27],[34,34]];
export const approaches=buildings.map((b,i)=>[junctions[i],entrance(b),localToWorld(b,0,b.size[1]/2+.7)]);
export const roads=[...streets,...approaches];
export function distanceToRoad(x:number,z:number){
  let best=Infinity;
  for(const points of roads)for(let i=1;i<points.length;i++){
    const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1)));
    best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));
  }return best;
}
