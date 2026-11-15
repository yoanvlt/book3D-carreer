export type BuildingId = 'profile' | 'project-1' | 'project-2' | 'project-3' | 'missions' | 'veolia';
export type Point = [number, number];
/** Géométrie et identité visuelle d'un bâtiment. Les textes sont dans src/content/batiments/. */
export interface Building {
  id: BuildingId;
  /** Ordre de visite, utilisé par la navigation rapide. */
  number: string;
  position: Point;
  rotation: number;
  size: Point;
  height: number;
  elevation: number;
  color: string;
}
/**
 * Implantation V8 (voir world/plan.ts) : rotation par quarts de tour, sol plat (elevation 0).
 * La façade d'entrée est la face locale +z.
 */
export const buildings: Building[] = [
  {
    id: 'profile',
    number: '01',
    position: [-24, -38],
    rotation: 0,
    size: [14, 10],
    height: 12.5,
    elevation: 0,
    color: '#d98a67',
  },
  {
    id: 'project-1',
    number: '02',
    position: [0, 29],
    rotation: Math.PI,
    size: [15, 11],
    height: 8.5,
    elevation: 0,
    color: '#6aa3b7',
  },
  {
    id: 'project-2',
    number: '03',
    position: [-46, 0],
    rotation: Math.PI / 2,
    size: [18, 13],
    height: 8.5,
    elevation: 0,
    color: '#d6a557',
  },
  {
    id: 'project-3',
    number: '04',
    position: [24, -40],
    rotation: 0,
    size: [13, 13],
    height: 15,
    elevation: 0,
    color: '#9890c4',
  },
  {
    id: 'missions',
    number: '05',
    position: [0, -38],
    rotation: 0,
    size: [18, 12],
    height: 9.5,
    elevation: 0,
    color: '#6aa392',
  },
  {
    id: 'veolia',
    number: '06',
    position: [46, 0],
    rotation: -Math.PI / 2,
    size: [18, 12],
    height: 10.5,
    elevation: 0,
    color: '#c8645a',
  },
];
export function localToWorld(b: Building, x: number, z: number): Point {
  return [
    b.position[0] + x * Math.cos(b.rotation) + z * Math.sin(b.rotation),
    b.position[1] - x * Math.sin(b.rotation) + z * Math.cos(b.rotation),
  ];
}
export function entrance(b: Building): Point {
  return localToWorld(b, 0, b.size[1] / 2 + 3.4);
}
export const WORLD = {
  radius: 59,
  walkSpeed: 6.2,
  runSpeed: 9.5,
  robotRadius: 0.53,
  /** Départ au sud de la place, face à la fontaine et à la galerie (nord). */
  spawn: [0, 3] as Point,
  spawnAngle: Math.PI,
};
export const CAMERA = {
  distance: 21,
  minDistance: 10,
  maxDistance: 27,
  /** Écran portrait (téléphone) : caméra plus haute et plus loin pour voir devant le robot. */
  portrait: { distance: 26, elevation: 0.74, below: 0.8 },
  /** Accueil sur écran large : décalage de l'image vers la droite, en part de la largeur (titre à gauche). */
  homeOffset: 0.2,
  elevation: 0.56,
  minElevation: 0.25,
  maxElevation: 1.14,
  stiffness: 6,
  targetHeight: 1.65,
  lookAhead: 0,
  clearance: 0.7,
  aerial: [92, 98, 122] as [number, number, number],
};
