import type { BuildingId, Point } from './config';
export interface Station {id:string;title:string;kicker:string;body:string;position:Point;object:'portrait'|'network'|'data'|'craft';draft?:boolean;}
const profile:Station[]=[
  {id:'identity',title:'Yoan Viollet',kicker:'01 / FAIRE CONNAISSANCE',body:'Bienvenue dans ma Maison portrait. Ce portfolio relie mon parcours, mes projets et mes expériences professionnelles. L’architecture extérieure incarne cette idée : entrer dans un lieu, c’est découvrir la personne qui le construit.',position:[-5,7],object:'portrait'},
  {id:'systems',title:'Comprendre les systèmes',kicker:'02 / LES FONDATIONS',body:'Mon parcours passe par les systèmes d’information et la cybersécurité. Comprendre les outils, leurs usages et leurs contraintes constitue le point de départ de mon approche technique. Les dates, formations et références détaillées du CV seront ajoutées après validation.',position:[5,1],object:'network'},
  {id:'data',title:'Relier les données',kicker:'03 / DATA & INTELLIGENCE ARTIFICIELLE',body:'La data et l’intelligence artificielle prolongent cette curiosité : organiser l’information, explorer les relations et construire des outils utiles. Les trois pavillons de projets accueilleront des cas concrets documentés, sans résultats ni réalisations inventés.',position:[-5,-6],object:'data'},
  {id:'practice',title:'Construire pour l’usage',kicker:'04 / DE L’IDÉE À L’OUTIL',body:'Ce portfolio est conçu comme une visite progressive. Les expériences professionnelles, notamment chez Veolia, y trouvent leur propre lieu. Les futurs parcours présenteront le besoin, les contraintes, la réalisation et les résultats vérifiés de chaque mission.',position:[5,-12],object:'craft'},
];
const labels=['La demande initiale','Le besoin','La problématique','Les contraintes','La solution','La réalisation','Les résultats','Les compétences'];
export function stationsFor(id:BuildingId):Station[]{
  if(id==='profile')return profile;
  return labels.map((title,i)=>({id:`step-${i}`,title,kicker:`${String(i+1).padStart(2,'0')} / CONTENU À DOCUMENTer`.toUpperCase(),body:'Cette station est prête à recevoir le contenu validé de ce projet. Aucun client, résultat, indicateur ou réalisation professionnelle n’a été inventé. Le parcours 3D, l’activation de proximité et la consultation sont déjà fonctionnels.',position:[i%2?6:-6,10-Math.floor(i/2)*7] as Point,object:(['network','data','craft','portrait'] as const)[i%4],draft:true}));
}
export const ROOM={halfWidth:11,halfDepth:18,spawn:[0,11] as Point,exit:[0,16] as Point};
export function indoorBlocked(x:number,z:number,id:BuildingId){
  if(Math.abs(x)>ROOM.halfWidth-.7||Math.abs(z)>ROOM.halfDepth-.8)return true;
  if([-9,9].some(px=>Math.hypot(x-px,z-14.8)<1.65))return true;
  if(id==='veolia'&&[-9.7,9.7].some(px=>Math.hypot(x-px,z+13)<1.3))return true;
  if((id==='profile'||id==='project-2')&&[-11,-3,5,13].some(pz=>Math.abs(z-pz)<.8&&Math.abs(x)>9.5))return true;
  // Include the robot's radius around plinths, not only their centre footprint.
  return stationsFor(id).some(s=>Math.hypot(Math.max(0,Math.abs(x-s.position[0])-1.8),Math.max(0,Math.abs(z-(s.position[1]-1.3))-.8))<.55);
}

/** Broad circulation bands; one screen owns a zone, with hysteresis at boundaries. */
export function stationAt(id:BuildingId,x:number,z:number,current:string|null=null):Station|null{
  const candidates=stationsFor(id).filter(s=>Math.abs(z-s.position[1])<2.5&&Math.abs(x-s.position[0])<7.5);
  const score=(s:Station)=>Math.abs(z-s.position[1])*2+Math.abs(x-s.position[0])*.3-(s.id===current?.35:0);
  return candidates.sort((a,b)=>score(a)-score(b))[0]??null;
}
export const stationApproach=(s:Station):Point=>[Math.sign(s.position[0])*2.7,s.position[1]+.4];
export function clearIndoorSegment(a:Point,b:Point,id:BuildingId){
  const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.15));
  for(let i=0;i<=n;i++)if(indoorBlocked(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n,id))return false;
  return true;
}
/** Small room grid; every segment, including off-grid endpoints, is validated. */
export function indoorRoute(from:Point,to:Point,id:BuildingId):Point[]{
  if(clearIndoorSegment(from,to,id))return [from,to];
  const nodes:Point[]=[];
  for(let x=-10;x<=10;x++)for(let z=-17;z<=17;z++)if(!indoorBlocked(x,z,id))nodes.push([x,z]);
  const anchor=(p:Point)=>nodes.filter(n=>Math.hypot(n[0]-p[0],n[1]-p[1])<2&&clearIndoorSegment(p,n,id)).sort((a,b)=>Math.hypot(a[0]-p[0],a[1]-p[1])-Math.hypot(b[0]-p[0],b[1]-p[1]))[0];
  const start=anchor(from),end=anchor(to);if(!start||!end)return [];
  const key=(p:Point)=>p.join(','),valid=new Set(nodes.map(key)),open=[key(start)],prev=new Map<string,string>(),cost=new Map([[key(start),0]]);
  const point=(s:string)=>s.split(',').map(Number) as Point;
  while(open.length){
    open.sort((a,b)=>cost.get(a)!+Math.hypot(point(a)[0]-end[0],point(a)[1]-end[1])-cost.get(b)!-Math.hypot(point(b)[0]-end[0],point(b)[1]-end[1]));
    const cur=open.shift()!,p=point(cur);
    if(cur===key(end)){const route=[to,p];let k=cur;while(prev.has(k)){k=prev.get(k)!;route.push(point(k));}route.push(from);route.reverse();
      const smooth=[route[0]];for(let i=0;i<route.length-1;){let j=route.length-1;while(j>i+1&&!clearIndoorSegment(route[i],route[j],id))j--;smooth.push(route[j]);i=j;}return smooth;
    }
    for(const d of [[1,0],[-1,0],[0,1],[0,-1]]){const next:Point=[p[0]+d[0],p[1]+d[1]],k=key(next),g=cost.get(cur)!+1;
      if(!valid.has(k)||g>=(cost.get(k)??Infinity)||!clearIndoorSegment(p,next,id))continue;
      cost.set(k,g);prev.set(k,cur);if(!open.includes(k))open.push(k);
    }
  }return [];
}
export function moveIndoors(p:Point,d:Point,id:BuildingId):Point{
  let [x,z]=p;const n=Math.max(1,Math.ceil(Math.hypot(...d)/.15));
  for(let i=0;i<n;i++){if(!indoorBlocked(x+d[0]/n,z,id))x+=d[0]/n;if(!indoorBlocked(x,z+d[1]/n,id))z+=d[1]/n;}return [x,z];
}
