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
  return stationsFor(id).some(s=>Math.abs(x-s.position[0])<1.7&&Math.abs(z-(s.position[1]-1.3))<.8);
}
export function moveIndoors(p:Point,d:Point,id:BuildingId):Point{
  let [x,z]=p;const n=Math.max(1,Math.ceil(Math.hypot(...d)/.15));
  for(let i=0;i<n;i++){if(!indoorBlocked(x+d[0]/n,z,id))x+=d[0]/n;if(!indoorBlocked(x,z+d[1]/n,id))z+=d[1]/n;}return [x,z];
}
