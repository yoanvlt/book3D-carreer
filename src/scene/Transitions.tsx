import { useFrame } from '@react-three/fiber';
import { getState,setState,player,view,journey,passage,travel,leaveBuilding } from '../state';
import { buildings,entrance, type Point } from '../world/config';
import { heightAt } from '../world/terrain';
import { moveWithCollisions } from '../world/collision';
import { moveIndoors,ROOM } from '../world/narrative';
export default function Transitions(){
  useFrame((_,delta)=>{
    const dt=Math.min(delta,.05),s=getState();
    if(s.phase==='travel'){
      const p=journey.points[journey.index];if(!p){player.speed=0;if(s.interior){view.yaw=0;}else if(journey.destination){const dest=buildings.find(b=>b.id===journey.destination)!;view.yaw=dest.rotation;player.angle=dest.rotation+Math.PI;}setState({phase:'explore',nearby:journey.destination});if(journey.exit){journey.exit=false;leaveBuilding();}return;}
      const dx=p[0]-player.x,dz=p[1]-player.z,dist=Math.hypot(dx,dz),speed=journey.index===journey.points.length-1?Math.min(10,3+dist*4):10,step=Math.min(dist,speed*dt);
      if(dist<.08){journey.index++;return;}
      const delta:Point=[dx/dist*step,dz/dist*step];
      const next=s.interior?moveIndoors([player.x,player.z],delta,s.interior):moveWithCollisions([player.x,player.z],delta);
      const moved=Math.hypot(next[0]-player.x,next[1]-player.z);
      if(moved<.001){player.speed=0;setState({phase:'explore',notice:'Trajet interrompu par un obstacle. Vous pouvez reprendre la marche.'});return;}
      player.x=next[0];player.z=next[1];player.y=s.interior?0:heightAt(...next);player.speed=moved/dt;
      const angle=Math.atan2(dx,dz);player.angle+=Math.atan2(Math.sin(angle-player.angle),Math.cos(angle-player.angle))*(1-Math.exp(-9*dt));
      // Keep the travel camera looking along the street; no sudden heading snaps at waypoints.
      const yaw=player.angle-Math.PI;view.yaw+=Math.atan2(Math.sin(yaw-view.yaw),Math.cos(yaw-view.yaw))*(1-Math.exp(-1.2*dt));
    }
    if(s.phase!=='doorway')return;
    passage.time+=dt*(s.reducedMotion?5:1);const t=passage.time;
    const curtain=document.getElementById('scene-curtain');if(curtain)curtain.style.opacity=String(t<1.3?0:t<1.65?(t-1.3)/.35:t<1.85?1:Math.max(0,1-(t-1.85)/.45));
    const b=buildings.find(b=>b.id===s.door)!;
    if(t<1.65){const amount=Math.min(1,Math.max(0,(t-.35)/1));player.x=passage.from[0]+(passage.to[0]-passage.from[0])*amount;player.z=passage.from[1]+(passage.to[1]-passage.from[1])*amount;player.y=s.interior?0:heightAt(player.x,player.z);player.angle=passage.leaving?0:b.rotation+Math.PI;player.speed=t>.35?2.2:0;}
    else if(!passage.swapped){
      passage.swapped=true;const p=passage.leaving?entrance(b):ROOM.spawn;player.x=p[0];player.z=p[1];player.y=passage.leaving?heightAt(...p):0;player.angle=passage.leaving?b.rotation:Math.PI;view.yaw=passage.leaving?b.rotation:0;player.teleport++;player.speed=0;
      setState({interior:passage.leaving?null:b.id,nearby:passage.leaving?b.id:null,station:null,visited:s.visited.includes(b.id)?s.visited:[...s.visited,b.id]});
    }
    if(t>2.35){if(curtain)curtain.style.opacity='0';setState({phase:'explore',door:null});const pending=passage.pending;passage.pending=null;if(pending)travel(pending);}
  },-3);return null;
}
