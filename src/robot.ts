/**
 * Le robot hors déplacement (V8) : interface de l'accueil (curseur, signe), vol en cours (lu par
 * la caméra), actions (s'asseoir sur un banc avec E, se relever en bougeant, saluer avec H).
 */
import { player } from './state';
import { decor } from './world/placer';

/** Robot de l'accueil : position du curseur (écran normalisé) et signe de la main au survol. */
export const robotUi = {
  pointer: [0, 0] as [number, number],
  wave: false,
  /** Captures : vol figé à cette fraction (0 à 1) de sa durée totale ; null en jeu. */
  hold: null as number | null,
  /** Position et cap du robot pendant les vols, suivis par la caméra. */
  position: [0, 0, 0] as [number, number, number],
  heading: 0,
  /** Assis sur un banc (position, orientation) ; null debout. */
  sit: null as { x: number; z: number; ry: number } | null,
  /** Salut en cours jusqu'à cet instant (performance.now). */
  waveUntil: 0,
  /** Vol en cours (Robot.tsx l'avance, CameraRig.tsx le suit). */
  flight: {
    mode: '' as '' | 'home' | 'entering' | 'homing' | 'tour' | 'back',
    path: null as [number, number, number][] | null,
    time: 0,
    startYaw: 0,
    endYaw: 0,
    skip: 0,
  },
};

/** Bancs du décor (position, orientation), pour s'asseoir avec E. */
const benches = decor.filter((d) => d.model === 'banc');
/** S'asseoir sur le banc le plus proche (à moins de 2 m), face à son côté le plus proche. @public */
export function sitOnBench() {
  const near = benches
    .map((b) => ({ b, d: Math.hypot(b.x - player.x, b.z - player.z) }))
    .filter((x) => x.d < 2.2)
    .sort((a, c) => a.d - c.d)[0];
  if (!near) return false;
  const { b } = near;
  // Le banc est symétrique : le robot s'assoit du côté où il se trouve, dos au dossier absent.
  const nx = Math.sin(b.ry);
  const nz = Math.cos(b.ry);
  const side = (player.x - b.x) * nx + (player.z - b.z) * nz >= 0 ? 1 : -1;
  robotUi.sit = {
    x: b.x + nx * side * 0.05,
    z: b.z + nz * side * 0.05,
    ry: side > 0 ? b.ry : b.ry + Math.PI,
  };
  player.speed = 0;
  return true;
}
/** Se relever (au premier mouvement) et saluer (H). */
export function standUp() {
  if (!robotUi.sit) return;
  const { ry } = robotUi.sit;
  player.x = robotUi.sit.x + Math.sin(ry) * 0.9;
  player.z = robotUi.sit.z + Math.cos(ry) * 0.9;
  player.angle = ry;
  robotUi.sit = null;
}
export function wave() {
  robotUi.waveUntil = performance.now() + 1800;
}
