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
export const buildings: Building[] = [
  {
    id: 'profile',
    number: '01',
    position: [-27, 21],
    rotation: 0.12,
    size: [15, 10],
    height: 23,
    elevation: 1.4,
    color: '#ec8057',
  },
  {
    id: 'project-1',
    number: '02',
    position: [-29, -10],
    rotation: 0.18,
    size: [15, 12],
    height: 16,
    elevation: 3.1,
    color: '#60a8c6',
  },
  {
    id: 'project-2',
    number: '03',
    position: [0, -32],
    rotation: -0.08,
    size: [17, 12],
    height: 14,
    elevation: 4.4,
    color: '#e9a24e',
  },
  {
    id: 'project-3',
    number: '04',
    position: [29, -25],
    rotation: -0.28,
    size: [13, 13],
    height: 20,
    elevation: 3.4,
    color: '#a39ac9',
  },
  {
    id: 'missions',
    number: '05',
    position: [3, 14],
    rotation: -0.18,
    size: [14, 9],
    height: 8,
    elevation: 1.7,
    color: '#df7355',
  },
  {
    id: 'veolia',
    number: '06',
    position: [32, 21],
    rotation: -0.28,
    size: [17, 12],
    height: 15,
    elevation: 0.8,
    color: '#d84141',
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
  spawn: [-9, 10] as Point,
};
export const CAMERA = {
  distance: 21,
  minDistance: 10,
  maxDistance: 27,
  elevation: 0.56,
  minElevation: 0.25,
  maxElevation: 1.14,
  stiffness: 6,
  targetHeight: 1.65,
  lookAhead: 0,
  clearance: 0.7,
  aerial: [92, 98, 122] as [number, number, number],
};
