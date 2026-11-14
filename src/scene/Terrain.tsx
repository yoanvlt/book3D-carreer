import { streets, approaches } from '../world/urban';
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { heightAt } from '../world/terrain';
import { COLORS as C, type Point } from '../world/config';
import { material, Box } from './Primitives';

function TerrainMesh(){
  const geometry=useMemo(()=>{
    const g=new THREE.BufferGeometry(),vertices:number[]=[],indices:number[]=[],colors:number[]=[];const color=new THREE.Color();
    const segments=192,rings=120;
    for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
      const a=j/segments*Math.PI*2,edgeRadius=66+4*Math.sin(3*a+.5)+2*Math.cos(5*a);
      const d=edgeRadius*i/rings,x=Math.cos(a)*d,z=Math.sin(a)*d;
      let h=heightAt(x,z);const edge=Math.max(0,Math.min(1,(d-60)/(edgeRadius-60)));h=h*(1-edge)-6.6*edge;
      vertices.push(x,h,z);
      color.set(d>60?'#c78354':(h>4.4?'#d99453':'#edb978'));
      const noise=Math.sin(x*1.31+z*.7)*Math.cos(z*1.53)*.012;color.offsetHSL(0,0,noise);colors.push(color.r,color.g,color.b);
      if(i<rings&&j<segments){const k=i*(segments+1)+j;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
  },[]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial vertexColors roughness={1} flatShading/></mesh>;
}
export function Path({points,width=3.5,color=C.path,offset=.15}:{points:Point[];width?:number;color?:string;offset?:number}){
  const geometry=useMemo(()=>{
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
    const vertices:number[]=[],indices:number[]=[];
    const lengthSegments=240,widthSegments=8;
    for(let i=0;i<=lengthSegments;i++){
      const p=curve.getPoint(i/lengthSegments),t=curve.getTangent(i/lengthSegments);const dx=-t.z*width/2,dz=t.x*width/2;
      for(let j=0;j<=widthSegments;j++){const side=2*j/widthSegments-1;const x=p.x+dx*side,z=p.z+dz*side;vertices.push(x,heightAt(x,z)+offset,z);
        if(i<lengthSegments&&j<widthSegments){const a=i*(widthSegments+1)+j;indices.push(a,a+1,a+widthSegments+1,a+1,a+widthSegments+2,a+widthSegments+1);}
      }
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[points,width,offset]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} material={material(color)} receiveShadow dispose={null}/>;
}
function Garden({x,z,rx,rz,angle=0}:{x:number;z:number;rx:number;rz:number;angle?:number}){
  const geometry=useMemo(()=>{const vertices:number[]=[],indices:number[]=[];const n=48,rings=8;
    for(let i=0;i<=rings;i++)for(let j=0;j<=n;j++){
      const a=j/n*Math.PI*2,r=i/rings*(1+.07*Math.sin(a*3));const dx=Math.cos(a)*rx*r,dz=Math.sin(a)*rz*r;
      const px=x+dx*Math.cos(angle)-dz*Math.sin(angle),pz=z+dx*Math.sin(angle)+dz*Math.cos(angle);vertices.push(px,heightAt(px,pz)+.055,pz);
      if(i<rings&&j<n){const k=i*(n+1)+j;indices.push(k,k+1,k+n+1,k+1,k+n+2,k+n+1);}
    }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
  },[x,z,rx,rz,angle]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh geometry={geometry} receiveShadow material={material('#91aa5e')} dispose={null}/>;
}
const gardens=[[-41,39,9,5,-.4],[-25,44,13,4,0],[4,45,13,4,.1],[46,18,4,15,-.1],[-48,20,5,13,0],[5,-47,12,4,.2],[-41,-23,4,11,-.3],[-25,-37,11,3,.05],[23,-35,11,4,.3],[43,-5,4,12,0],[38,28,4,7,-.55],[24,39,9,3.6,0],[-23,37,8,4,-.5],[-42,12,3.5,10,0],[-16,-5,3.2,4.4,-.2],[16,3,3.3,4,.3],[-13,-17,2.5,3,0]];
export default function Terrain(){return <>
  <mesh rotation={[-Math.PI/2,0,0]} position={[0,-6.6,0]} receiveShadow><planeGeometry args={[1200,1200]}/><meshStandardMaterial color='#e6c4a0' roughness={1}/></mesh>
  <TerrainMesh/>
  {gardens.map(([x,z,rx,rz,angle],i)=><Garden key={i} {...{x,z,rx,rz,angle}}/>)}
  {streets.map((points,i)=><group key={i}><Path points={points} width={6.5} color='#c58d63' offset={.09}/><Path points={points} width={5.7}/></group>)}
  {approaches.map((points,i)=><Path key={i} points={points} width={3.6}/>)}
  <Box p={[0,.69,0]} s={[16,.12,12]} color={C.path}/>
  {[-5,0,5].map(x=><Box key={x} p={[x,.76,0]} s={[.06,.02,12]} color='#d3af87'/>)}
</>;}
