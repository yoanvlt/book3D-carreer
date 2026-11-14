export type BuildingId = 'profile' | 'project-1' | 'project-2' | 'project-3' | 'missions' | 'veolia';
export type Point = [number, number];
export type NarrativeStep = 'demande' | 'besoin' | 'problematique' | 'contraintes' | 'solution' | 'realisation' | 'resultats' | 'competences';
export interface Building {
  id: BuildingId; number: string; name: string; subtitle: string; sign: string;
  position: Point; rotation: number; size: Point; height: number; elevation: number;
  color: string; description: string; tags: string[];
  interior: { scene: string; status: 'reference' | 'draft'; stations: { id: NarrativeStep; content: string | null }[] };
}
const steps: NarrativeStep[] = ['demande','besoin','problematique','contraintes','solution','realisation','resultats','competences'];
const interior = (scene: string): Building['interior'] => ({scene, status:scene==='profile'?'reference':'draft', stations:steps.map(id => ({id,content:null}))});
export const buildings: Building[] = [
  { id:'profile', number:'01', name:'Profil', subtitle:'La Maison portrait', sign:'PROFIL', position:[-27,21], rotation:0.12, size:[15,10], height:23, elevation:1.4, color:'#ec8057', description:'Yoan Viollet. De la cybersécurité à la data et à l’intelligence artificielle, un parcours guidé par l’envie de comprendre, de construire et de rendre les outils utiles.', tags:['Parcours','Data & IA','Savoir-faire'], interior:interior('profile') },
  { id:'project-1', number:'02', name:'Projet majeur 01', subtitle:'Le Pavillon de verre', sign:'PROJET 01', position:[-29,-10], rotation:0.18, size:[15,12], height:16, elevation:3.1, color:'#60a8c6', description:'Un pavillon ouvert sur de nouvelles perspectives. Ce lieu accueillera le premier projet majeur et son parcours : du besoin initial à la réalisation.', tags:['Projet à venir','Parcours en préparation'], interior:interior('project-1') },
  { id:'project-2', number:'03', name:'Projet majeur 02', subtitle:'La Manufacture', sign:'PROJET 02', position:[0,-32], rotation:-0.08, size:[17,12], height:14, elevation:4.4, color:'#e9a24e', description:'Une architecture de fabrication et d’expérimentation. Ce lieu est réservé au deuxième projet majeur ; son contenu sera intégré lors de la prochaine phase.', tags:['Projet à venir','Parcours en préparation'], interior:interior('project-2') },
  { id:'project-3', number:'04', name:'Projet majeur 03', subtitle:'L’Observatoire', sign:'PROJET 03', position:[29,-25], rotation:-0.28, size:[13,13], height:20, elevation:3.4, color:'#a39ac9', description:'Prendre de la hauteur, relier les idées. L’Observatoire accueillera le troisième projet majeur dans un futur parcours immersif.', tags:['Projet à venir','Parcours en préparation'], interior:interior('project-3') },
  { id:'missions', number:'05', name:'Autres missions', subtitle:'La Galerie des idées', sign:'LES MISSIONS', position:[3,14], rotation:-0.18, size:[14,9], height:8, elevation:1.7, color:'#df7355', description:'Un espace pour les contributions, les outils du quotidien et les réalisations plus courtes. Une collection qui s’enrichira au fil du parcours.', tags:['Contributions','Automatisation','Exploration'], interior:interior('missions') },
  { id:'veolia', number:'06', name:'Veolia', subtitle:'L’expérience professionnelle', sign:'Veolia', position:[32,21], rotation:-0.28, size:[17,12], height:15, elevation:0.8, color:'#d84141', description:'Une expérience professionnelle au croisement des systèmes d’information, du reporting et de la donnée. Le futur parcours présentera les missions réalisées chez Veolia.', tags:['Systèmes d’information','Reporting','Data'], interior:interior('veolia') },
];
export function localToWorld(b: Building, x: number, z: number): Point {
  return [b.position[0]+x*Math.cos(b.rotation)+z*Math.sin(b.rotation), b.position[1]-x*Math.sin(b.rotation)+z*Math.cos(b.rotation)];
}
export function entrance(b: Building): Point { return localToWorld(b,0,b.size[1]/2+3.4); }
export const WORLD = { radius:59, walkSpeed:6.2, runSpeed:9.5, robotRadius:0.53, spawn:[-9,10] as Point };
export const CAMERA = { distance:16.5, elevation:0.47, minElevation:0.25, maxElevation:1.14, stiffness:6, targetHeight:1.65, lookAhead:0, clearance:0.7, aerial:[83,90,110] as [number,number,number] };
export const COLORS = { cream:'#fff1d8', stone:'#e6c5a0', sand:'#e8bd84', coral:'#ed8159', ink:'#273f49', glass:'#659faf', roof:'#f7deb8', lavender:'#a89bc8', green:'#659451', leaf:'#89ab57', darkLeaf:'#3f7858', path:'#f5dfb8' };
