import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { player, getState } from '../state';
import { Box, Cylinder, Ball, material } from './Primitives';
import { COLORS as C } from '../world/config';

export default function Robot(){
  const root=useRef<THREE.Group>(null!),body=useRef<THREE.Group>(null!),left=useRef<THREE.Group>(null!),right=useRef<THREE.Group>(null!),armL=useRef<THREE.Group>(null!),armR=useRef<THREE.Group>(null!);
  const gait=useRef(0),motion=useRef(0);
  useFrame((_,dt)=>{
    root.current.position.set(player.x,player.y+.14,player.z);root.current.rotation.y=player.angle;
    const state=getState(),active=!state.map&&!state.detail&&!state.reading&&!state.help;
    motion.current=THREE.MathUtils.damp(motion.current,active?player.speed:0,9,dt);
    const speed=motion.current,run=Math.max(0,Math.min(1,(speed-6)/3));gait.current+=dt*(speed*2.5);
    const swing=Math.sin(gait.current)*Math.min(1,speed/3)*(.55+run*.35);
    left.current.rotation.x=swing;right.current.rotation.x=-swing;
    player.reaction=Math.max(0,player.reaction-dt*.8);
    armL.current.rotation.x=-swing*.8;
    armR.current.rotation.x=swing*.8-player.reaction*.8;
    armR.current.rotation.z=-player.reaction*.35;
    body.current.rotation.x=THREE.MathUtils.damp(body.current.rotation.x,run*.16,6,dt);
    body.current.rotation.z=Math.sin(gait.current)*Math.min(speed/6,1)*.055;
    body.current.rotation.y=speed<.3?Math.sin(_.clock.elapsedTime*.7)*.1:0;
    body.current.position.y=Math.sin(_.clock.elapsedTime*2)*.018+Math.abs(Math.sin(gait.current))*Math.min(speed/6,1)*(.07+run*.08);

  });
  return <group ref={root}>
    <group ref={body}>
      <RoundedBox args={[.84,.8,.64]} radius={.17} smoothness={2} position={[0,1.04,0]} material={material(C.cream)} castShadow/>
      <Box p={[0,1.08,.34]} s={[.49,.36,.035]} color={C.coral}/><Box p={[0,1.09,.365]} s={[.25,.06,.02]} color={C.cream}/>
      <Box p={[0,1,-.4]} s={[.61,.6,.25]} color={C.coral}/><Box p={[0,1.04,-.54]} s={[.39,.3,.05]} color={C.ink}/>
      <Cylinder p={[0,1.53,0]} s={[.19,.2,.19]} color={C.ink}/>
      <RoundedBox args={[1.13,.73,.8]} radius={.2} smoothness={3} position={[0,1.94,.02]} material={material(C.cream)} castShadow/>
      <RoundedBox args={[.93,.44,.14]} radius={.13} smoothness={2} position={[0,1.96,.42]} material={material(C.ink)} castShadow/>
      {[-.21,.21].map(x=><RoundedBox key={x} args={[.105,.19,.035]} radius={.045} smoothness={2} position={[x,1.98,.5]} material={material('#bce0e3')}/>)}
      {[-.6,.6].map(x=><Cylinder key={x} p={[x,1.94,0]} s={[.18,.17,.18]} r={[0,0,Math.PI/2]} color={C.coral}/>)}
      <Cylinder p={[.33,2.43,-.08]} s={[.035,.32,.035]} color={C.ink}/><Ball p={[.33,2.62,-.08]} s={[.1,.1,.1]} color={C.coral}/>
      {[-1,1].map(side=><group key={side} ref={side<0?armL:armR} position={[side*.52,1.3,0]}>
        <Ball s={[.16,.16,.16]} color={C.ink}/><Box p={[0,-.25,0]} s={[.2,.43,.24]} color={C.cream}/><Ball p={[0,-.51,.03]} s={[.15,.15,.16]} color={C.coral}/>
      </group>)}
    </group>
    {[-1,1].map(side=><group key={side} ref={side<0?left:right} position={[side*.24,.7,0]}>
      <Cylinder p={[0,-.19,0]} s={[.105,.39,.105]} color={C.ink}/>
      <RoundedBox args={[.33,.28,.52]} radius={.09} smoothness={2} position={[0,-.49,.09]} material={material(C.coral)} castShadow/>
      <Box p={[0,-.62,.09]} s={[.34,.06,.54]} color={C.ink}/>
    </group>)}
  </group>;
}
