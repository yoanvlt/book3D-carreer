/**
 * Assemblage du monde statique (V8), pur : terrain, île, six bâtiments, fontaine, placements du
 * décor, puis lumière précalculée (par sommet, par exemplaire et texture du sol). Exécuté une
 * fois au chargement, dans un worker (monde.worker.ts) : le fil principal reste libre.
 */
import { buildings, type BuildingId } from '../world/config';
import { decor, type Item, type Model } from '../world/placer';
import { heightAt } from '../world/terrain';
import { edgeRadius } from '../world/island';
import { FOUNTAIN, FOUNTAIN_RADIUS } from '../world/plan';
import catalogue from '../world/catalogue.json';
import { Builder, type MeshData } from './mesh';
import { HeightField, Light, FIELD } from './bake';
import { terrain, underside } from './island';
import { feuillu, fountain } from './props';
import { profile } from './buildings/profile';
import { project1 } from './buildings/project1';
import { project2 } from './buildings/project2';
import { project3 } from './buildings/project3';
import { missions } from './buildings/missions';
import { veolia } from './buildings/veolia';

const BUILDERS: Record<BuildingId, (b: Builder) => void> = {
  profile,
  'project-1': project1,
  'project-2': project2,
  'project-3': project3,
  missions,
  veolia,
};

export interface Lit {
  data: MeshData;
  light: Float32Array;
}
export interface Placed {
  x: number;
  y: number;
  z: number;
  ry: number;
  scale: number | [number, number, number];
  light: [number, number];
}
export interface WorldBuild {
  terrain: MeshData;
  island: Lit;
  fountain: Lit;
  buildings: (Lit & { id: BuildingId })[];
  feuillu: MeshData;
  instances: Partial<Record<Model, Placed[]>>;
  ground: { data: Uint8Array; size: number; min: number; extent: number };
}

type Progress = (step: 'monde' | 'lumiere', fraction: number) => void;

/** Hauteur d'un modèle des kits (catalogue), pour son ombre. */
function modelTop(model: Model): number {
  if (model === 'feuillu') return 5.2;
  const entry = (catalogue.ville as Record<string, { max: number[] }>)[model];
  return entry ? entry.max[1] : 0;
}

export function buildWorld(progress: Progress = () => {}): WorldBuild {
  const ground = terrain();
  progress('monde', 0.15);
  const island = underside();
  progress('monde', 0.3);
  const built = buildings.map((b, i) => {
    const builder = new Builder();
    builder.within({ x: b.position[0], z: b.position[1], ry: b.rotation }, () => BUILDERS[b.id](builder));
    progress('monde', 0.3 + (0.6 * (i + 1)) / buildings.length);
    return { id: b.id, data: builder.finish() };
  });
  const basin = fountain(FOUNTAIN[0], FOUNTAIN[1], FOUNTAIN_RADIUS);
  progress('monde', 1);

  // Champ de hauteurs : sol de l'île, bâtiments, fontaine, volumes des arbres et du mobilier.
  const field = new HeightField();
  field.ground(heightAt, (x, z) => Math.hypot(x, z) < edgeRadius(Math.atan2(z, x)));
  for (const b of built) field.rasterize(b.data);
  field.rasterize(basin);
  const tree = /^(pin|sapin|feuillu)$/;
  for (const d of decor) {
    const top = modelTop(d.model);
    if (top < 0.8) continue;
    const k = typeof d.scale === 'number' ? d.scale : 1;
    field.disc(
      d.x,
      d.z,
      tree.test(d.model) ? 1.3 * k : 0.3,
      d.y + top * k * (tree.test(d.model) ? 0.95 : 0.8),
    );
  }
  const light = new Light(field, sunDirection);
  progress('lumiere', 0.1);
  const lit = (data: MeshData): Lit => ({ data, light: light.bake(data) });
  const islandLit = lit(island);
  progress('lumiere', 0.3);
  const buildingsLit = built.map((b, i) => {
    const out = { id: b.id, ...lit(b.data) };
    progress('lumiere', 0.3 + (0.4 * (i + 1)) / built.length);
    return out;
  });
  const fountainLit = lit(basin);
  const size = 256;
  const groundData = light.ground(heightAt, size);
  progress('lumiere', 0.9);
  // Lumière par exemplaire : au-dessus de l'objet (seuls les volumes plus hauts l'ombragent).
  const instances: Partial<Record<Model, Placed[]>> = {};
  for (const d of decor as Item[]) {
    const k = typeof d.scale === 'number' ? d.scale : 1;
    const top = d.y + modelTop(d.model) * k + 0.3;
    const sun = light.sun(d.x, top, d.z, 0, 1, 0);
    const ao = light.ambient(d.x, d.y + 0.2, d.z, 0, 1, 0);
    (instances[d.model] ??= []).push({
      x: d.x,
      y: d.y,
      z: d.z,
      ry: d.ry,
      scale: d.scale,
      light: [sun, 0.55 + 0.45 * ao],
    });
  }
  progress('lumiere', 1);
  return {
    terrain: ground,
    island: islandLit,
    fountain: fountainLit,
    buildings: buildingsLit,
    feuillu: feuillu(),
    instances,
    ground: { data: groundData, size, min: FIELD.min, extent: FIELD.extent },
  };
}

/** Direction du soleil (vers le soleil), la même que la matière (tokens). */
let sunDirection: [number, number, number] = [0, 1, 0];
export function setSun(direction: [number, number, number]) {
  sunDirection = direction;
}
