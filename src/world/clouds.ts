/**
 * Nuages : mer de nuages sous l'île et quelques nuages hauts. Les positions sont tirées une fois
 * (graine fixe) puis filtrées avec la caméra d'accueil réelle : aucun nuage ne passe devant l'île
 * ni derrière le titre, au bureau comme sur téléphone. Les nuages ne font qu'osciller sur place
 * (moins de DRIFT unités), le filtre reste donc valable.
 */
import { PerspectiveCamera, Vector3 } from 'three';
import { CAMERA } from './config';

export interface Cloud {
  x: number;
  y: number;
  z: number;
  size: number;
  /** Bulles qui composent le nuage : décalage et taille relatifs. */
  parts: [number, number, number, number][];
  phase: number;
}
export const DRIFT = 2.5;

/** Caméra d'accueil telle que la règle CameraRig (phase « home »). */
export function homeCamera(width: number, height: number) {
  const narrow = width < 760;
  const k = narrow ? 1.36 : 1;
  const camera = new PerspectiveCamera(narrow ? 48 : 41, width / height, 0.1, 1400);
  camera.position.set(CAMERA.aerial[0] * k, CAMERA.aerial[1] * k, CAMERA.aerial[2] * k);
  camera.lookAt(0, 1, 0);
  camera.setViewOffset(width, height, narrow ? 0 : -width * 0.16, 0, width, height);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

/** Zones d'écran (NDC) réservées : titre de l'accueil au bureau, carte d'accueil sur téléphone. */
export function reservedZones(width: number) {
  return width < 760 ? [{ x0: -1, x1: 1, y0: -1, y1: -0.05 }] : [{ x0: -1, x1: -0.12, y0: -0.55, y1: 0.6 }];
}

/** Rayon apparent (NDC vertical) d'une sphère de rayon r à la distance d. */
function apparent(camera: PerspectiveCamera, r: number, d: number) {
  return r / (d * Math.tan((camera.fov * Math.PI) / 180 / 2));
}

/** Vrai si le nuage masque l'île (devant elle à l'écran) ou une zone réservée. */
export function cloudConflicts(cloud: Cloud, width: number, height: number): boolean {
  const camera = homeCamera(width, height);
  const radius = cloud.size * 1.9 + DRIFT;
  const center = new Vector3(cloud.x, cloud.y, cloud.z);
  const distance = center.distanceTo(camera.position);
  const p = center.clone().project(camera);
  const r = apparent(camera, radius, distance);
  const rx = r / camera.aspect;
  if (p.z > 1) return false;
  for (const z of reservedZones(width))
    if (p.x + rx > z.x0 && p.x - rx < z.x1 && p.y + r > z.y0 && p.y - r < z.y1) return true;
  // L'île : bord du plateau et pied de terre. Un nuage plus proche que le bord et superposé masque.
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    for (const [rr, y] of [
      [64, 0],
      [60, -6.6],
      [40, -6.6],
    ]) {
      const q = new Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr);
      if (q.distanceTo(camera.position) < distance - radius) continue;
      const s = q.clone().project(camera);
      if (Math.abs(s.x - p.x) < rx && Math.abs(s.y - p.y) < r) return true;
    }
  }
  return false;
}

/** Écrans contrôlés : 16:9, 16:10, 1366×768 et téléphone portrait. */
export const CHECKED_SCREENS: [number, number][] = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [390, 844],
];

export function makeClouds(): Cloud[] {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const candidates: Cloud[] = [];
  const add = (x: number, y: number, z: number, size: number) => {
    const n = 4 + Math.floor(rnd() * 3);
    const parts: Cloud['parts'] = [];
    for (let k = 0; k < n; k++)
      parts.push([(k - n / 2) * 1.1 + rnd() * 0.6, rnd() * 0.6, (rnd() - 0.5) * 1.4, 0.7 + rnd() * 0.7]);
    candidates.push({ x, y, z, size, parts, phase: rnd() * Math.PI * 2 });
  };
  // Couronne basse : la mer de nuages où flotte l'île.
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2 + rnd() * 0.2;
    const r = 75 + rnd() * 80;
    add(Math.cos(a) * r, -16 - rnd() * 12, Math.sin(a) * r, 6 + rnd() * 6);
  }
  // Nuages hauts.
  for (let i = 0; i < 30; i++) {
    const a = rnd() * Math.PI * 2;
    const r = 55 + rnd() * 55;
    add(Math.cos(a) * r, 26 + rnd() * 18, Math.sin(a) * r, 3 + rnd() * 2.5);
  }
  return candidates.filter((c) => !CHECKED_SCREENS.some(([w, h]) => cloudConflicts(c, w, h)));
}
