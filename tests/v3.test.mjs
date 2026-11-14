import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {loadSource} from './load-source.mjs';
import {PerspectiveCamera,Vector3} from 'three';
globalThis.window={matchMedia:()=>({matches:false})};
const source=await loadSource('v3');
const game=await source.import('state');
const {buildings,entrance,WORLD}=await source.import('world/config');
const narrative=await source.import('world/narrative');
const cinema=await source.import('world/cinematics');
const camera=await source.import('world/camera');
const {blocked}=await source.import('world/collision');
const {heightAt}=await source.import('world/terrain');
const {tickMotion,angleDifference}=await source.import('world/motion');
after(()=>source.cleanup());
function reset(b=buildings[0],reduced=false){
  game.setState({phase:'explore',interior:null,door:null,showcase:null,station:null,reading:null,nearby:b.id,map:false,help:false,detail:null,notice:'',seen:[],visited:[],reducedMotion:reduced});
  const p=entrance(b);Object.assign(game.player,{x:p[0],z:p[1],y:heightAt(...p),angle:b.rotation+Math.PI,speed:0});
  Object.assign(game.passage,{pending:null,fade:0,openness:0});game.journey.points=[];game.journey.exit=false;
}
function untilIdle(limit=5000,inspect=()=>{}){
  for(let i=0;i<limit;i++){if(game.getState().phase==='explore')return;i%2?tickMotion(1/30):tickMotion(1/60);inspect();}
  assert.fail('Automatic motion did not release control: '+JSON.stringify({state:game.getState(),passage:game.passage,player:game.player}));
}

test('Camera modes have an explicit, exclusive mapping',()=>{
  reset();for(const [phase,expected] of Object.entries({home:'aerial',entering:'arrival',explore:'exterior',travel:'guided',doorway:'door',showcase:'presentation',returning:'return',homing:'homeward'}))assert.equal(game.cameraMode({...game.getState(),phase}),expected);
  assert.equal(game.cameraMode({...game.getState(),phase:'explore',interior:'profile'}),'interior');
});
test('Profile stations activate along the central circulation, with stable ownership',()=>{
  for(const st of narrative.stationsFor('profile'))assert.equal(narrative.stationAt('profile',0,st.position[1])?.id,st.id);
  for(const b of buildings){for(const st of narrative.stationsFor(b.id)){const p=narrative.stationApproach(st);assert.equal(narrative.stationAt(b.id,...p)?.id,st.id);assert.ok(!narrative.indoorBlocked(...p,b.id));}}
  assert.equal(narrative.stationAt('project-1',.02,10,'step-0')?.id,'step-0');
  assert.equal(narrative.stationAt('project-1',2,10,'step-0')?.id,'step-1');
  assert.equal(narrative.stationAt('profile',0,16),null);
});
test('Room paths reach every station and exit from both sides without cutting plinths',()=>{
  for(const b of buildings){const targets=[narrative.ROOM.exit,...narrative.stationsFor(b.id).map(narrative.stationApproach)];
    for(const from of [[0,14],[-8,5],[8,-15],[-8,-15]])for(const to of targets){const route=narrative.indoorRoute(from,to,b.id);assert.ok(route.length,b.id+' '+from+' → '+to);for(let i=1;i<route.length;i++)assert.ok(narrative.clearIndoorSegment(route[i-1],route[i],b.id));}
  }
});
test('Six presentations lock movement, reject repeated commands, return or queue entry',()=>{
  for(const b of buildings){reset(b);const before=[game.player.x,game.player.z];game.discover(b.id);const serial=game.presentation.serial;
    for(let i=0;i<100;i++){game.discover(b.id);game.travel(b.id);game.openBuilding(b.id);game.guideExit();game.goHome();game.interact();tickMotion(.016);}
    assert.equal(game.presentation.serial,serial);assert.equal(game.getState().phase,'showcase');assert.deepEqual([game.player.x,game.player.z],before);
    game.endPresentation();game.finishPresentation();assert.equal(game.getState().phase,'explore');assert.deepEqual([game.player.x,game.player.z],before);
    game.discover(b.id);game.endPresentation(true);game.endPresentation(false);game.finishPresentation();assert.equal(game.getState().phase,'doorway');
    untilIdle();assert.equal(game.getState().interior,b.id);
  }
});
test('Door lifecycle: six buildings, re-entry, repeated inputs, aligned positions and full opening while crossing',()=>{
  for(const reduced of [false,true])for(const b of buildings){reset(b,reduced);
    for(let cycle=0;cycle<2;cycle++){
      game.openBuilding(b.id);const stages=new Set();
      untilIdle(5000,()=>{const s=game.getState();stages.add(game.passage.stage);if(['crossing','handoff','emerging'].includes(game.passage.stage))assert.equal(game.passage.openness,1);
        if(s.phase==='doorway'){game.guideExit();game.travel(b.id);game.openBuilding(b.id);game.leaveBuilding();game.goHome();game.interact();assert.equal(game.getState().phase,'doorway');}
      });
      assert.equal(game.getState().interior,b.id);assert.equal(game.getState().door,null);assert.equal(game.passage.fade,0);assert.equal(game.passage.openness,0);assert.ok(stages.has('handoff'));
      assert.ok(Math.hypot(game.player.x,game.player.z-14)<.04);assert.ok(!narrative.indoorBlocked(game.player.x,game.player.z,b.id));
      game.guideExit();untilIdle();assert.equal(game.getState().interior,null);assert.equal(game.getState().door,null);
      assert.ok(Math.hypot(game.player.x-entrance(b)[0],game.player.z-entrance(b)[1])<.04);assert.ok(!blocked(game.player.x,game.player.z));assert.ok(Math.abs(angleDifference(game.player.angle,b.rotation))<.01);
    }
  }
});
test('All narrative navigation buttons use the real motion controller and release controls',()=>{
  for(const b of buildings){reset(b);game.openBuilding(b.id);untilIdle();
    for(let i=0;i<narrative.stationsFor(b.id).length;i++){
      game.guideToStation(i);untilIdle();assert.equal(game.getState().notice,'');
      assert.equal(game.getState().station,narrative.stationsFor(b.id)[i].id);
      game.interact();assert.equal(game.getState().reading,game.getState().station);game.setState({reading:null});
    }
    game.guideExit();untilIdle();assert.equal(game.getState().interior,null);
  }
});
test('Guided travel can be cancelled or skipped; stale skip cannot move an exploring robot',()=>{
  reset();game.travel('veolia');tickMotion(.03);game.cancelJourney();const p=[game.player.x,game.player.z];game.skipJourney();assert.deepEqual([game.player.x,game.player.z],p);assert.equal(game.getState().phase,'explore');
  game.travel('project-3');game.skipJourney();assert.equal(game.getState().nearby,'project-3');assert.ok(!blocked(game.player.x,game.player.z));
});
test('Real guided travel traverses each ordered building pair without blocking',()=>{
  for(const a of buildings)for(const b of buildings){if(a.id===b.id)continue;reset(a);game.travel(b.id);untilIdle(6000,()=>assert.ok(!blocked(game.player.x,game.player.z)));assert.equal(game.getState().notice,'');assert.equal(game.getState().nearby,b.id);}
});
test('Six authored cinematic paths clear collision volumes at desktop and portrait aspects',()=>{
  for(const aspect of [1920/1080,2560/1440,1366/768,390/844])for(const b of buildings){
    const shots=cinema.buildingShots(b,aspect);assert.equal(shots.length,4);
    const entrancePoint=entrance(b),target={x:entrancePoint[0],y:heightAt(...entrancePoint)+1.65,z:entrancePoint[1]};
    const follow=camera.chooseCamera(target,b.rotation,.47,16.5,b.rotation).point;
    for(const [a,c] of [[follow,shots[0].position],...shots.slice(1).map((s,i)=>[shots[i].position,s.position]),[shots.at(-1).position,follow]]){
      const path=cinema.safeCameraRoute(a,c);for(let i=1;i<path.length;i++)assert.ok(cinema.clearCameraSegment(path[i-1],path[i]),b.id+' '+aspect+' route');
      for(let t=0;t<=1;t+=.01)assert.ok(!camera.cameraBodyBlocked(cinema.sampleRoute(path,t)),b.id+' sample');
    }
  }
});
test('Reduced-motion previews preserve position and return to mobile content',()=>{
  reset();game.setState({phase:'home',reducedMotion:true});const p=[game.player.x,game.player.z];game.discover('veolia',true);game.endPresentation(true);game.finishPresentation();assert.equal(game.getState().phase,'home');assert.equal(game.getState().detail,'veolia');assert.deepEqual([game.player.x,game.player.z],p);
});
test('Camera hysteresis still allows deliberate manual rotation',()=>{
  const target={x:WORLD.spawn[0],y:heightAt(...WORLD.spawn)+1.65,z:WORLD.spawn[1]};
  const first=camera.chooseCamera(target,0,.47,16.5,0),turned=camera.chooseCamera(target,1.5,.47,16.5,first.yaw);
  assert.ok(Math.abs(angleDifference(turned.yaw,first.yaw))>.3);
  const inside=camera.chooseInteriorCamera(0,0,1.5,0);assert.ok(Math.abs(inside.yaw)>.3);
});
test('Interior camera reversals orbit the robot instead of crossing its position',()=>{
  for(const [x,z] of [[0,0],[0,15],[-8,0],[8,-15],[0,-15]]){
    const target={x,y:1.65,z};let previous=0,pos=camera.chooseInteriorCamera(x,z,0,0);
    for(let i=0;i<300;i++){
      const goal=camera.chooseInteriorCamera(x,z,Math.PI,previous);previous=goal.yaw;
      pos=camera.moveInteriorCamera(pos,goal,target,1/60);
      assert.ok(Math.abs(pos.x)<=8.201&&Math.abs(pos.z)<=16.601);
      assert.ok(Math.hypot(pos.x-x,pos.z-z)>=5.99,JSON.stringify({x,z,i,pos}));
    }
  }
});
test('An interior-to-exterior destination waits for the entire door sequence',()=>{
  reset();game.openBuilding('profile');untilIdle();game.travel('veolia');
  let foundDoor=false;untilIdle(7000,()=>{if(game.getState().phase==='doorway')foundDoor=true;});
  assert.ok(foundDoor);assert.equal(game.getState().interior,null);assert.equal(game.getState().nearby,'veolia');assert.equal(game.passage.pending,null);
});
test('Selecting a destination from home first completes the aerial descent',()=>{
  reset();game.setState({phase:'home'});const p=[game.player.x,game.player.z];game.travel('project-2');
  assert.equal(game.getState().phase,'entering');tickMotion(.03);assert.deepEqual([game.player.x,game.player.z],p);
  game.finishArrival();assert.equal(game.getState().phase,'travel');untilIdle();assert.equal(game.getState().nearby,'project-2');
});
test('The static showcase frame contains the architectural bounds at all four aspect ratios',()=>{
  for(const aspect of [1920/1080,2560/1440,1366/768,390/844])for(const b of buildings){
    const shot=cinema.buildingShots(b,aspect)[2],view=new PerspectiveCamera(48,aspect,.1,420);
    view.position.set(shot.position.x,shot.position.y,shot.position.z);view.lookAt(shot.target.x,shot.target.y,shot.target.z);view.updateMatrixWorld();
    for(const x of [-b.size[0]/2,b.size[0]/2])for(const z of [-b.size[1]/2,b.size[1]/2])for(const y of [0,b.height]){
      const wx=b.position[0]+x*Math.cos(b.rotation)+z*Math.sin(b.rotation),wz=b.position[1]-x*Math.sin(b.rotation)+z*Math.cos(b.rotation);
      const projected=new Vector3(wx,b.elevation+y,wz).project(view);
      assert.ok(Math.abs(projected.x)<.96&&Math.abs(projected.y)<.96,b.id+' at '+aspect+' '+projected.toArray());
    }
  }
});
test('Interior camera bounds clear the tops of the Veolia tanks with a body margin',()=>{
  for(let x=-10;x<=10;x+=2)for(let z=-16;z<=16;z+=2)for(const yaw of [0,1,2,3,4,5]){
    const p=camera.chooseInteriorCamera(x,z,yaw,yaw);
    for(const tankX of [-9.7,9.7]){
      const horizontal=Math.max(0,Math.hypot(p.x-tankX,p.z+13)-.75);
      assert.ok(Math.hypot(horizontal,Math.max(0,p.y-6))>=.65);
    }
  }
});
