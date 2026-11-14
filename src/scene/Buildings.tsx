import { RoundedBox } from '@react-three/drei';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Box, Cylinder, Ball, Beam, Sign, Vault, material } from './Primitives';
import { buildings, COLORS as C, type Building } from '../world/config';
import { getState, player } from '../state';

function Portrait(){return <>
  {[-1,1].map(side=><group key={side}>
    <Box p={[side*2.5,.45,.5]} s={[4.1,.9,9.5]} color={C.ink}/>
    <Box p={[side*2.5,2.2,-.1]} s={[3.5,3.6,7.8]} color='#4b7080'/>
    {[1.2,2.2,3.2].map(y=><Box key={y} p={[side*2.5,y,3.88]} s={[2.8,.35,.12]} color={C.glass}/>)}
    <Box p={[side*6.05,7.8,-.3]} s={[2.2,8.7,5]} r={[0,0,side*.14]} color={C.coral}/>
    <Box p={[side*6.6,3.7,.2]} s={[2.2,1.4,4.5]} color='#eabb91'/>
    <Box p={[side*4.3,9.8,4.15]} s={[.4,6.2,.25]} r={[0,0,side*.23]} color={C.cream}/>
  </group>)}
  <RoundedBox position={[0,8.8,-.5]} args={[10.5,9.6,8.2]} radius={.65} smoothness={2} material={material('#df7852')} castShadow receiveShadow/>
  <Box p={[0,8.2,3.68]} s={[4.5,6.4,.12]} color={C.glass} metal={.3}/>
  {[-1.5,0,1.5].map(x=><Box key={x} p={[x,8.2,3.82]} s={[.12,6.4,.18]} color={C.cream}/>)}
  <Box p={[0,4.9,4.2]} s={[7,.4,2]} color={C.cream}/>
  <Cylinder p={[0,14,0]} s={[2,1.4,2]} color='#eabb91'/>
  <RoundedBox position={[0,18.1,0]} args={[7.6,6.9,6.8]} radius={.65} smoothness={2} material={material('#efc59e')} castShadow receiveShadow/>
  <RoundedBox position={[0,21.8,-.35]} args={[8.2,1.2,7.5]} radius={.3} smoothness={2} material={material('#705443')} castShadow/>
  <Box p={[-2.7,20.9,3.2]} s={[2.4,1.8,.65]} color='#705443'/>
  {[-2,2].map(x=><group key={x}><Box p={[x,18.8,3.48]} s={[2.5,1.5,.32]} color={C.ink}/><Box p={[x,18.8,3.67]} s={[2.1,1.1,.1]} color='#90bfcb'/><Box p={[x,18.8,3.74]} s={[.14,1.1,.1]} color={C.cream}/></group>)}
  <Box p={[0,18.8,3.65]} s={[1.7,.18,.15]} color={C.ink}/><Box p={[0,17.6,3.55]} s={[.8,1.1,.9]} color='#d79c76'/><Box p={[0,16.15,3.48]} s={[3,.35,.12]} color={C.ink}/>
  <Sign text='YOAN VIOLLET' p={[0,12.55,3.69]} s={[7.5,.8]} color={C.cream} bg='#df7852'/><Sign text='PROFIL' p={[0,5.4,4.46]} s={[4.4,.8]}/>
</>;}
function Innovation(){return <>
  <Box p={[-4.9,6.9,-1.6]} s={[3.2,13.8,8]} color='#dc945f'/>
  {[0,1,2].map(i=><group key={i} position={[i===1?1.3:0,1+i*4.4,0]} rotation={[0,i===1?-.12:.08,0]}>
    <Box p={[0,1.8,0]} s={[12.4,3.6,9.4]} color={i===1?'#5193af':'#78b5ca'} metal={.35}/>
    <Box p={[0,0,0]} s={[13.2,.35,10.2]} color={C.cream}/><Box p={[0,3.7,0]} s={[13.2,.35,10.2]} color={C.cream}/>
    {[-5,-2.5,0,2.5,5].map(x=><Box key={x} p={[x,1.9,4.78]} s={[.12,3.6,.12]} color={C.cream}/>)}
    {[-3,0,3].map(z=><Box key={z} p={[6.28,1.9,z]} s={[.1,3.6,.12]} color={C.cream}/>)}
  </group>)}
  <Beam a={[-7,0,5.4]} b={[6,13.8,5.4]} width={.38} color={C.coral}/><Beam a={[6,0,5.4]} b={[-7,13.8,5.4]} width={.24} color={C.cream}/>
  <Box p={[0,14.7,-1]} s={[9,.25,7]} r={[0,0,-.12]} color={C.coral}/><Sign text='01 / LES POSSIBLES' p={[0,10.2,5.14]} s={[8,.9]}/>
</>;}
function Mechanism(){return <>
  <Box p={[0,2.8,-.2]} s={[16,5.6,11.5]} color='#ce904d'/><Vault p={[0,5.6,0]} s={[7.8,7.8,11.5]} color='#e8b05d'/>
  {[-5.5,-2.8,0,2.8,5.5].map(z=><mesh key={z} position={[0,5.6,z]}><torusGeometry args={[7.9,.17,6,32,Math.PI]}/><meshStandardMaterial color={C.cream}/></mesh>)}
  <Cylinder p={[0,7.1,5.85]} s={[3.5,.4,3.5]} r={[Math.PI/2,0,0]} color={C.ink}/><Cylinder p={[0,7.1,6.08]} s={[2.7,.2,2.7]} r={[Math.PI/2,0,0]} color={C.glass}/>
  {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <Box key={i} p={[Math.sin(a)*3.45,7.1+Math.cos(a)*3.45,6.1]} s={[.7,1,.5]} r={[0,0,-a]} color={C.cream}/>;})}
  <Beam a={[-2,5.1,6.25]} b={[2,9.1,6.25]} width={.2} color={C.cream}/><Beam a={[2,5.1,6.25]} b={[-2,9.1,6.25]} width={.2} color={C.cream}/>
  {[-6.5,6.5].map(x=><group key={x}><Box p={[x,4,6]} s={[.45,8,.5]} color={C.ink}/><Cylinder p={[x,9,-3]} s={[.65,4,.65]} color={C.coral}/></group>)}
  <Sign text='02 / LA FABRIQUE' p={[0,3.9,6.25]} s={[7,.75]}/>
</>;}
function Discovery(){return <>
  <Cylinder p={[0,2.5,0]} s={[6,5,6]} color='#9383b8'/><Cylinder p={[0,5.2,0]} s={[6.6,.45,6.6]} color={C.cream}/>
  <Cylinder p={[-1,8.7,-.6]} s={[3.1,7,3.1]} color={C.glass}/>
  {[6.2,8.5,10.8,13].map((y,i)=><group key={y} rotation={[0,i*.45,0]}><Box p={[0,y,0]} s={[11,.3,4.5]} color={i%2?C.cream:'#b5a2d2'}/><Box p={[5,y+.6,0]} s={[.1,1,4.5]} color={C.cream}/></group>)}
  <Cylinder p={[-1,14.6,-.6]} s={[4.3,3.3,4.3]} color='#b5a2d2'/>
  <mesh position={[-1,16.3,-.6]} castShadow><sphereGeometry args={[4.3,24,12,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={C.cream}/></mesh>
  <Cylinder p={[1.7,17.2,1.4]} s={[.7,5,.7]} r={[Math.PI/2-.4,0,-.5]} color={C.ink}/><Sign text='03 / OBSERVATOIRE' p={[0,4.1,6.12]} s={[8,.8]}/>
</>;}
function Atelier(){return <>
  {[-4.7,0,4.7].map((x,i)=><group key={x} position={[x,0,i===1?-1:0]}>
    <Box p={[0,2.5,0]} s={[4.3,5,8.2]} color={i===1?C.cream:'#edb08b'}/><Box p={[0,2.6,4.18]} s={[3.9,4.7,.13]} color={C.glass}/>
    <Box p={[0,5.8,0]} s={[5,.35,9]} r={[0,0,i%2?.27:-.27]} color={i===1?C.cream:C.coral}/>
    {[-2,2].map(s=><Box key={s} p={[s,2.9,4.35]} s={[.16,5.8,.2]} color={C.cream}/>)}
  </group>)}
  <Sign text='LA GALERIE DES IDEES' p={[0,6.6,4.65]} s={[10,.85]}/><Box p={[-5.4,.6,5.2]} s={[2,1.2,.6]} color={C.coral}/><Ball p={[-5.4,1.8,5.2]} s={[.65,.9,.65]} color={C.lavender}/>
</>;}
function Veolia(){return <>
  <Box p={[0,2.3,0]} s={[16.5,4.6,11.8]} color='#f0dfb9'/>
  {[-4.4,4.4].map((x,i)=><group key={x}>
    <Cylinder p={[x,7.8,-1]} s={[3.4,8,3.4]} color={i?'#e8d8b4':'#d2e1da'}/><Cylinder p={[x,11.9,-1]} s={[3.65,.3,3.65]} color={C.cream}/><Cylinder p={[x,8.4,-1]} s={[3.46,.55,3.46]} color='#d64b42'/>
    <mesh position={[x,12.05,-1]} castShadow><coneGeometry args={[3.5,1.5,16]}/><meshStandardMaterial color={C.cream}/></mesh><Beam a={[x,12,1.5]} b={[x,5.1,1.5]} width={.4} color='#d64b42'/>
  </group>)}
  <Beam a={[-4.4,9,2.6]} b={[4.4,9,2.6]} width={.5} color='#d64b42'/><Box p={[0,5.6,4.9]} s={[16.9,.3,3.4]} color={C.cream}/><Box p={[0,3.9,6.1]} s={[16,1.6,.3]} color={C.cream}/>
  <Sign text='Veolia' p={[0,4.05,6.28]} s={[7,1.5]} color='#d4313b'/><Sign text='Veolia' p={[0,9.4,-4.5]} s={[7,1.5]} rotation={[0,Math.PI,0]} color='#d4313b'/>
  {[-6.7,-4.6,4.6,6.7].map(x=><Box key={x} p={[x,1.8,6]} s={[1.7,2.3,.12]} color={C.glass}/>)}
  {[-5,0,5].map(x=><Box key={x} p={[x,6.05,5.2]} s={[3.7,.15,2.4]} r={[-.3,0,0]} color='#426b80'/>)}
</>;}
function Portal({b}:{b:Building}){
  const left=useRef<THREE.Group>(null!),right=useRef<THREE.Group>(null!);
  useFrame((_,dt)=>{const amount=THREE.MathUtils.damp(right.current.position.x,getState().door===b.id?1.25:0,8,dt);left.current.position.x=-amount;right.current.position.x=amount;});
  return <group position={[0,0,b.size[1]/2+.5]}>
    <Box p={[0,1.7,-.12]} s={[2.9,3.4,.22]} color={C.ink}/>
    {[-1,1].map(side=><Box key={side} p={[side*1.65,1.8,.2]} s={[.25,3.6,1]} color={C.cream}/>)}<Box p={[0,3.6,.25]} s={[3.55,.3,1.1]} color={b.color}/>
    <group ref={left}><Box p={[-.68,1.65,.07]} s={[1.3,3.25,.1]} color={C.glass}/><Box p={[-.09,1.6,.15]} s={[.06,.5,.08]} color={C.cream}/></group>
    <group ref={right}><Box p={[.68,1.65,.07]} s={[1.3,3.25,.1]} color={C.glass}/><Box p={[.09,1.6,.15]} s={[.06,.5,.08]} color={C.cream}/></group><Box p={[0,.05,1.25]} s={[4,.1,2.4]} color={C.cream}/>
  </group>;
}
const models={profile:Portrait,'project-1':Innovation,'project-2':Mechanism,'project-3':Discovery,missions:Atelier,veolia:Veolia};
function BuildingModel({b}:{b:Building}){
  const Model=models[b.id],root=useRef<THREE.Group>(null!),clones=useRef<THREE.MeshStandardMaterial[]>([]);
  const ray=useMemo(()=>new THREE.Ray(),[]),hit=useMemo(()=>new THREE.Vector3(),[]),target=useMemo(()=>new THREE.Vector3(),[]);
  const bounds=useMemo(()=>new THREE.Box3(new THREE.Vector3(-b.size[0]/2,-.2,-b.size[1]/2),new THREE.Vector3(b.size[0]/2,b.height,b.size[1]/2)),[b]);
  useEffect(()=>{
    const owned:THREE.MeshStandardMaterial[]=[];
    root.current.traverse(object=>{if(object instanceof THREE.Mesh&&object.material instanceof THREE.MeshStandardMaterial){const m=object.material.clone();object.material=m;owned.push(m);}});clones.current=owned;
    return()=>{owned.forEach(m=>m.dispose());clones.current=[];};
  },[]);
  useFrame(({camera},dt)=>{
    const s=getState();let obscured=false;
    if(s.phase==='explore'||s.phase==='travel'){
      ray.origin.set(player.x,player.y+1.6,player.z);root.current.worldToLocal(ray.origin);
      target.copy(camera.position);root.current.worldToLocal(target);
      const distance=ray.origin.distanceTo(target);ray.direction.subVectors(target,ray.origin).normalize();
      obscured=!!ray.intersectBox(bounds,hit)&&hit.distanceTo(ray.origin)<distance;
    }
    for(const m of clones.current){const alpha=THREE.MathUtils.damp(m.opacity,obscured?.24:1,7,dt);m.opacity=alpha;m.transparent=alpha<.99;m.depthWrite=alpha>=.99;}
  });
  return <group ref={root} position={[b.position[0],b.elevation,b.position[1]]} rotation={[0,b.rotation,0]}>
    <Box p={[0,-.21,0]} s={[b.size[0]+2,.4,b.size[1]+2]} color={C.stone}/><Model/><Portal b={b}/>
    <group position={[b.size[0]/2+.9,0,b.size[1]/2+1]}><Box p={[0,1,0]} s={[1.1,2,.3]} color={b.color}/><Sign text={b.number} p={[0,1.3,.16]} s={[.95,.65]} color={C.cream} bg={b.color}/><Sign text='ENTREE' p={[0,.6,.16]} s={[1,.27]}/></group>
  </group>;
}

export default function Buildings(){return <>{buildings.map(b=><BuildingModel key={b.id} b={b}/>)}</>;}
