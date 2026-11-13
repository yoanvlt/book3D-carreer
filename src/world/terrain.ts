import { buildings, type Point } from './config';
const smooth = (x: number) => { const t=Math.max(0,Math.min(1,x)); return t*t*(3-2*t); };
/** The same continuous height field drives the mesh, paths and controller. */
export function heightAt(x:number,z:number):number {
  let h=0.45 + 3.3*Math.exp(-((x+10)**2+(z+30)**2)/700) + 1.8*Math.exp(-((x-33)**2+(z+7)**2)/300) + 0.55*Math.sin(x*0.09)*Math.cos(z*0.08);
  h+=3.8*Math.exp(-((x+42)**2+(z+31)**2)/100)+3.3*Math.exp(-((x-37)**2+(z+36)**2)/95);
  // A quiet, flat civic square; smoothstep terraces avoid steps in walkable paths.
  h=h*(1-smooth((12-Math.hypot(x,z))/5))+0.65*smooth((12-Math.hypot(x,z))/5);
  for(const b of buildings){
    const dx=x-b.position[0],dz=z-b.position[1];
    const lx=dx*Math.cos(b.rotation)-dz*Math.sin(b.rotation), lz=dx*Math.sin(b.rotation)+dz*Math.cos(b.rotation);
    const d=Math.max(Math.abs(lx)-b.size[0]/2-1.4, Math.abs(lz)-b.size[1]/2-2.7);
    const blend=1-smooth(d/5);
    h=h*(1-blend)+b.elevation*blend;
  }
  return h;
}
export const ring:Point[]=[[-2,21],[-18,20],[-33,7],[-33,-12],[-24,-25],[-7,-22],[10,-22],[23,-23],[35,-8],[36,9],[22,27],[8,23],[-2,21]];
export function terrainSlope(x:number,z:number){return Math.hypot(heightAt(x+.2,z)-heightAt(x-.2,z),heightAt(x,z+.2)-heightAt(x,z-.2))/.4;}
