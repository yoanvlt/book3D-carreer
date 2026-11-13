import { Box, Cylinder, Ball, Beam, Sign, Vault } from './Primitives';
import { buildings, COLORS as C, type Building } from '../world/config';

function Windows({width=10,y=3,z=4.07,count=5}:{width?:number;y?:number;z?:number;count?:number}){
  return <>{Array.from({length:count},(_,i)=>{const x=(i-(count-1)/2)*width/count;return <group key={i}><Box p={[x,y,z]} s={[width/count-.25,2.2,.16]} color={C.glass} metal={.3}/><Box p={[x,y-1.16,z+.05]} s={[width/count,.13,.35]} color={C.cream}/><Box p={[x+.12,y,z+.11]} s={[.07,2.2,.05]} color={C.cream}/></group>;})}</>;
}
function Door({z,width=1.8}:{z:number;width?:number}){return <><Box p={[0,1.5,z]} s={[width+.35,3.15,.28]} color={C.ink}/><Box p={[0,1.42,z+.16]} s={[width,2.8,.13]} color={C.glass} metal={.4}/><Box p={[0,1.42,z+.25]} s={[.07,2.8,.07]} color={C.cream}/><Box p={[.22,1.2,z+.29]} s={[.06,.42,.08]} color={C.cream}/><Box p={[0,.05,z+.8]} s={[width+1.8,.1,1.6]} color={C.cream}/></>;}
function Human(){return <group position={[-3.8,.18,5.7]} rotation={[0,.2,0]}>
  <Cylinder p={[0,.12,0]} s={[.8,.24,.8]} color={C.coral}/>
  <Box p={[-.2,.75,0]} s={[.28,1.1,.34]} color={C.ink}/><Box p={[.2,.75,0]} s={[.28,1.1,.34]} color={C.ink}/>
  <Box p={[-.2,.25,.13]} s={[.34,.22,.55]} color={C.cream}/><Box p={[.2,.25,.13]} s={[.34,.22,.55]} color={C.cream}/>
  <Box p={[0,1.54,0]} s={[.85,.86,.46]} color='#f1a64b'/><Ball p={[0,2.32,0]} s={[.37,.43,.34]} color='#dca47d'/>
  <Ball p={[0,2.57,-.07]} s={[.38,.23,.33]} color='#65483d'/>
  <Beam a={[-.45,1.82,0]} b={[-.57,1.1,.1]} width={.23} color='#f1a64b'/><Beam a={[.46,1.8,0]} b={[.68,2.27,.08]} width={.23} color='#f1a64b'/>
  <Ball p={[.7,2.37,.08]} s={[.14,.17,.14]} color='#dca47d'/>
  <Sign text='YOAN' p={[0,.38,.82]} s={[1.25,.35]}/>
</group>;}
function Profile(){return <>
  <Box p={[-1.8,3.1,0]} s={[7.4,6.2,8]} color='#efac7b'/><Box p={[3.7,2.15,.5]} s={[3.6,4.3,7]} color={C.cream}/>
  <Box p={[-1.8,6.25,0]} s={[8.2,.3,8.8]} color={C.cream}/>
  <Box p={[-1.8,7.1,-1.25]} s={[6.5,1.8,5.4]} color={C.coral}/>
  <Box p={[-1.8,8.12,-1.25]} s={[7.1,.28,5.9]} color={C.cream}/>
  <Box p={[3.7,4.4,.5]} s={[4.1,.24,7.8]} color={C.coral}/>
  <Windows width={6.3} y={4.55} z={4.1} count={3}/>
  <Door z={4.13}/><Box p={[0,3.35,4.85]} s={[3.4,.22,2]} color={C.coral}/>
  {[-1.5,1.5].map(x=><Box key={x} p={[x,1.6,5.65]} s={[.16,3.2,.16]} color={C.cream}/>)}
  <Sign text='PROFIL' p={[-1.8,7.13,1.49]} s={[4.4,1.05]} color={C.cream} bg={C.coral}/>
  <Sign text='01 / LA MAISON' p={[3.72,3.3,4.08]} s={[3,.58]}/>
  {[-4.3,-2.8,-1.3].map(x=><Box key={x} p={[x,6.7,3.72]} s={[.08,.8,.08]} color={C.cream}/>)}
  <Beam a={[-5,7.1,3.72]} b={[1.2,7.1,3.72]} color={C.cream}/><Human/>
  <Box p={[4.15,1.75,4.13]} s={[1.8,1.8,.12]} color={C.glass}/>
  {[0,1,2,3,4].map(i=><Box key={i} p={[2.7,5.25,-2.5+i*1.2]} s={[.18,1.5,.18]} color={C.cream}/>)}
</>;}
function GlassPavilion(){return <>
  <Box p={[0,.3,0]} s={[12.8,.6,10.8]} color={C.cream}/>
  <Box p={[0,5.5,0]} s={[11.5,10.5,9.4]} color='#6aafc5' metal={.35}/>
  {[.6,4.2,7.8,11.2].map(y=><Box key={y} p={[0,y,0]} s={[12.6,.26,10.6]} color={C.cream}/>)}
  {[-5.7,-3.8,-1.9,0,1.9,3.8,5.7].map(x=><Box key={x} p={[x,5.8,4.82]} s={[.16,10.6,.2]} color={C.cream}/>)}
  {[-4.6,-2.3,0,2.3,4.6].map(z=><Box key={z} p={[5.84,5.8,z]} s={[.18,10.6,.16]} color={C.cream}/>)}
  <Box p={[-4.5,6.1,-1]} s={[3,12.2,8.2]} color='#e9a46c'/>
  <Box p={[1.2,11.65,0]} s={[10.1,.45,11.5]} color={C.cream}/>
  {[-3.6,-2.4,-1.2,0,1.2,2.4,3.6,4.8].map(x=><Box key={x} p={[x,12.05,0]} s={[.18,.2,10.5]} color={C.stone}/>)}
  <Door z={5.08}/><Box p={[.5,3.65,5.65]} s={[6.6,.22,2.5]} color='#e9a46c'/>
  <Sign text='PROJET 01' p={[.6,9.5,4.96]} s={[7.5,1.35]} color={C.ink} bg='#c6e3e9'/>
  <Sign text='02 / LE PAVILLON DE VERRE' p={[.7,2.25,5.85]} s={[4.4,.55]}/>
  {[0,1,2].map(i=><Box key={i} p={[-6.1,.13+i*.07,5.7+i*.65]} s={[4-i*.4,.15,.65]} color={C.stone}/>)}
</>;}
function Manufacture(){return <>
  <Box p={[0,3.1,0]} s={[13,6.2,9]} color='#e9a64f'/>
  <Box p={[0,.4,0]} s={[13.5,.8,9.5]} color={C.stone}/>
  {[0,1,2].map(i=><group key={i} position={[-4.3+i*4.3,0,0]}>
    <Box p={[0,7.2,0]} s={[4.5,.28,10]} r={[0,0,.38]} color={C.cream}/>
    <Box p={[1.95,7.38,0]} s={[.16,1.9,9.1]} color={C.glass}/>
    <Box p={[-1.9,3.2,4.65]} s={[.26,6.4,.35]} color={C.cream}/>
    <Beam a={[-1.8,1,4.83]} b={[1.8,5.8,4.83]} width={.16} color={C.cream}/>
  </group>)}
  <Box p={[0,3.1,4.53]} s={[11.8,4,.08]} color={C.glass}/>
  {[-5.7,-1.9,1.9,5.7].map(x=><Box key={x} p={[x,3.1,4.71]} s={[.22,6.2,.28]} color={C.cream}/>)}
  <Door z={4.92}/><Box p={[0,5.65,4.93]} s={[7.7,1.2,.25]} color={C.ink}/>
  <Sign text='PROJET 02' p={[0,5.65,5.08]} s={[7.2,.95]} color={C.cream} bg={C.ink}/>
  <Cylinder p={[5.15,7.4,-3]} s={[.55,3.6,.55]} color='#c57549'/><Cylinder p={[5.15,9.25,-3]} s={[.7,.18,.7]} color={C.cream}/>
  <Sign text='03 / LA MANUFACTURE' p={[-4.3,1.2,4.85]} s={[3.8,.5]}/>
</>;}
function Observatory(){return <>
  <Cylinder p={[0,.28,0]} s={[5.7,.56,5.7]} color={C.cream}/>
  <Cylinder p={[0,4.1,0]} s={[4.95,7.6,4.95]} color={C.lavender}/>
  {[1,4.4,8].map(y=><Cylinder key={y} p={[0,y,0]} s={[5.25,.22,5.25]} color={C.cream}/>)}
  {Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <group key={i} rotation={[0,a,0]}><Box p={[0,5.9,4.87]} s={[1.72,2.65,.15]} color={C.glass}/><Box p={[.92,5.9,4.96]} s={[.13,2.9,.16]} color={C.cream}/></group>;})}
  <Cylinder p={[-1.1,9.8,-.7]} s={[3.1,3.5,3.1]} color={C.cream}/>
  <Cylinder p={[-1.1,11.65,-.7]} s={[3.55,.28,3.55]} color={C.lavender}/>
  <mesh position={[-1.1,11.68,-.7]} castShadow><sphereGeometry args={[2.7,20,8,0,Math.PI*2,0,Math.PI/2]}/><meshStandardMaterial color={C.lavender} roughness={.58}/></mesh>
  <Door z={5.15}/><Box p={[0,3.8,5.3]} s={[5.1,.22,2]} color={C.cream}/>
  <Sign text='PROJET 03' p={[0,3.15,5.25]} s={[4.3,.9]} color={C.cream} bg='#8172ab'/>
  <Sign text='04 / L’OBSERVATOIRE' p={[0,8.43,4.3]} s={[4.8,.65]}/>
  <Beam a={[2.7,8.2,0]} b={[2.7,11.2,0]} width={.12} color={C.ink}/>
  <Box p={[3.25,10.7,0]} s={[1.1,.7,.06]} color={C.coral}/>
</>;}
function Gallery(){return <>
  <Box p={[0,.3,0]} s={[15.8,.6,8.3]} color={C.cream}/>
  {[-5,0,5].map((x,i)=><group key={x} position={[x,0,0]}>
    <Box p={[0,2.1,0]} s={[4.8,4.2,7]} color={i===1?C.cream:'#e59572'}/>
    <Vault p={[0,4.2,0]} s={[2.5,2.5,7.6]} color={i===1?'#f3c193':C.coral}/>
    <Box p={[0,2.2,3.56]} s={[3.8,3.9,.14]} color={C.glass}/>
    <Box p={[0,2.2,3.7]} s={[.15,3.9,.12]} color={C.cream}/>
    <Cylinder p={[-2.35,2.2,3.8]} s={[.16,4.4,.16]} color={C.cream}/><Cylinder p={[2.35,2.2,3.8]} s={[.16,4.4,.16]} color={C.cream}/>
  </group>)}
  <Door z={3.79}/><Sign text='LES MISSIONS' p={[0,4.25,3.92]} s={[7.4,1.05]} color={C.cream} bg={C.coral}/>
  <Sign text='05 / GALERIE DES IDÉES' p={[5,1.6,3.85]} s={[3.7,.52]}/>
  <Box p={[-6.5,.7,5]} s={[1.7,1.4,.35]} color={C.cream}/><Sign text='EXPLORER' p={[-6.5,.85,5.2]} s={[1.5,.5]}/>
</>;}
function Veolia(){return <>
  <Box p={[-1.5,3,0]} s={[11,6,9]} color={C.cream}/><Box p={[5,2.1,0]} s={[4,4.2,9]} color='#dcceaf'/>
  <Box p={[-1.5,6.12,0]} s={[11.6,.26,9.6]} color={C.cream}/><Box p={[5,4.32,0]} s={[4.4,.24,9.5]} color='#c74540'/>
  <Box p={[0,4.7,4.62]} s={[14,1.5,.32]} color={C.cream}/>
  <Sign text='Veolia' p={[0,4.7,4.8]} s={[7.3,1.4]} color='#dc343d'/>
  <Sign text='Veolia' p={[-1.5,4.65,-4.58]} s={[7.8,1.55]} rotation={[0,Math.PI,0]} color='#dc343d'/>
  <Box p={[-1.5,3.63,-4.6]} s={[11.4,.16,.35]} color='#dc343d'/>
  {[-5,-2.7,-.4,1.9].map(x=><group key={x}><Box p={[x,2.25,-4.57]} s={[1.8,1.6,.15]} color={C.glass}/><Box p={[x,2.25,-4.68]} s={[.1,1.6,.12]} color={C.cream}/></group>)}
  <Box p={[5,1.6,-4.58]} s={[2.6,2.9,.16]} color='#c5b499'/>
  {[.5,.9,1.3,1.7,2.1,2.5].map(y=><Box key={y} p={[5,y,-4.69]} s={[2.5,.055,.04]} color={C.cream}/>)}
  <Box p={[0,3.72,4.8]} s={[14.4,.16,.9]} color='#dc343d'/>
  <Windows width={9.5} y={2.1} z={4.58} count={5}/><Door z={4.83}/>
  <Box p={[-5.4,3.2,4.8]} s={[.65,6.4,.55]} color='#d53f3f'/>
  {[-4.7,-1.2,2.3].map(x=><group key={x}><Box p={[x,6.65,-1.7]} s={[2.7,.18,3.2]} r={[-.3,0,0]} color='#426b80'/>{[-.85,0,.85].map(z=><Box key={z} p={[x,6.67+z*.3,-1.7+z]} s={[2.7,.04,.03]} color='#a8c9d2'/>)}</group>)}
  {[4,6].map(x=><group key={x}><Cylinder p={[x,5.85,-2.5]} s={[.8,3,.8]} color='#c4c8bc'/><Cylinder p={[x,7.42,-2.5]} s={[.9,.15,.9]} color={C.cream}/><Cylinder p={[x,6.2,-2.5]} s={[.83,.22,.83]} color='#dc343d'/></group>)}
  <Beam a={[6,6.9,-2.5]} b={[6,6.9,1.8]} width={.27} color={C.cream}/>
  <Sign text='06 / EXPÉRIENCE & IMPACT' p={[4.9,2,4.83]} s={[3.6,.58]}/>
</>;}
const models={profile:Profile,'project-1':GlassPavilion,'project-2':Manufacture,'project-3':Observatory,missions:Gallery,veolia:Veolia};
function BuildingModel({building:b}:{building:Building}){const Model=models[b.id];return <group position={[b.position[0],b.elevation,b.position[1]]} rotation={[0,b.rotation,0]}>
  <Box p={[0,-.21,0]} s={[b.size[0]+2,.4,b.size[1]+2]} color={C.stone}/>
  <Model/>
  <group position={[b.size[0]/2+1.05,0,b.size[1]/2+1]}>
    <Box p={[0,.88,0]} s={[1.15,1.76,.38]} color={b.color}/>
    <Sign text={b.number} p={[0,1.17,.2]} s={[1,.65]} color={C.cream} bg={b.color}/>
    <Sign text='ENTRÉE' p={[0,.55,.2]} s={[1,.26]} color={C.cream} bg={b.color}/>
  </group>
</group>;}
export default function Buildings(){return <>{buildings.map(b=><BuildingModel key={b.id} building={b}/>)}</>;}
