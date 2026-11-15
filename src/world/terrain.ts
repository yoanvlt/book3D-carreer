/**
 * Relief de l'île (V8) : un sol de maquette, plat partout où l'on construit et circule (rues,
 * trottoirs, place, parcelles), avec quelques buttes douces dans les pelouses, à distance des
 * rues et des parcelles. La même fonction sert au maillage, au déplacement et au placeur.
 */
import { OUTER, PARCELS, rectDistance } from './plan';

/** Buttes des parcs : centre, hauteur, rayon. */
const MOUNDS: [number, number, number, number][] = [
  [-27, 37, 1.0, 7],
  [27, 38, 0.9, 7],
  [-48, -38, 1.3, 7],
  [0, -57, 1.0, 6],
  [50, -32, 1.3, 7],
  [-50, 30, 0.9, 6],
  [52, 40, 0.8, 6],
];

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Hauteur du sol en (x, z). */
export function heightAt(x: number, z: number): number {
  let h = 0;
  for (const [mx, mz, amp, r] of MOUNDS) {
    const d2 = (x - mx) ** 2 + (z - mz) ** 2;
    if (d2 < r * r * 4) h += amp * Math.exp(-d2 / (r * r * 0.5));
  }
  if (h < 1e-3) return 0;
  // Plat garanti à moins de 2 m de la ville et des parcelles, raccord doux jusqu'à 6 m.
  let d = rectDistance(OUTER, x, z);
  for (const p of PARCELS) d = Math.min(d, rectDistance(p.bounds, x, z));
  return h * smooth(2, 6, d);
}

/** @public Utilisé par les tests ou les scripts. */
export function terrainSlope(x: number, z: number) {
  return (
    Math.hypot(heightAt(x + 0.2, z) - heightAt(x - 0.2, z), heightAt(x, z + 0.2) - heightAt(x, z - 0.2)) / 0.4
  );
}
