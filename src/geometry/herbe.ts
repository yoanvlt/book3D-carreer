/**
 * Semis de l'herbe (V8), calculé dans le worker du monde : tirage régulier bruité dans les
 * pelouses, hors des objets posés. Chaque brin : x, z, deux tirages (hauteur, orientation) et la
 * hauteur du sol, soit 5 nombres.
 */
import { zoneAt } from '../world/plan';
import { heightAt } from '../world/terrain';
import { edgeRadius } from '../world/island';
import { solids } from '../world/placer';

export const BLADE = 5;

export function scatterGrass(density: number, seed = 11): Float32Array {
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const step = 1 / Math.sqrt(density);
  // Grille d'accès rapide aux objets posés (cases de 4 m).
  const cells = new Map<string, typeof solids>();
  for (const s of solids) {
    const key = `${Math.floor(s.x / 4)},${Math.floor(s.z / 4)}`;
    cells.set(key, [...(cells.get(key) ?? []), s]);
  }
  const near = (x: number, z: number) => {
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const s of cells.get(`${Math.floor(x / 4) + i},${Math.floor(z / 4) + j}`) ?? [])
          if (Math.hypot(s.x - x, s.z - z) < Math.min(1.2, s.radius * 0.6)) return true;
    return false;
  };
  const out: number[] = [];
  for (let x = -66; x < 66; x += step)
    for (let z = -66; z < 66; z += step) {
      const px = x + (rnd() - 0.5) * step;
      const pz = z + (rnd() - 0.5) * step;
      if (Math.hypot(px, pz) > edgeRadius(Math.atan2(pz, px)) - 1.2) continue;
      if (zoneAt(px, pz) !== 'pelouse' || near(px, pz)) continue;
      out.push(px, pz, rnd(), rnd(), heightAt(px, pz));
    }
  return new Float32Array(out);
}
