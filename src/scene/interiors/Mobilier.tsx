/**
 * Mobilier des six intérieurs (V8) : modèles KayKit Furniture Bits recolorés à la palette
 * (public/modeles/meubles.glb), chargés à la demande à l'entrée du premier lieu. Chaque meuble
 * occupe une emprise de world/narrative.ts (FURNITURE) : les stations restent dégagées et la
 * marche, les collisions et les tests sont inchangés. Une ambiance par lieu.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BuildingId } from '../../world/config';
import { ROOM, ROWS, VEOLIA_COLUMNS } from '../../world/narrative';
import { kitGeometry, loadKits, type KitModel } from '../diorama/kits';
import { instances, type Placement } from '../diorama/geometry';

/** [modèle, x, z, rotation, hauteur de pose, échelle] dans le repère de la salle. */
type Piece = [KitModel, number, number, number, number?, Placement['scale']?];
const BACK = -ROOM.halfDepth + 1.3;
const WALL = -ROOM.halfDepth + 0.15;
const Q = Math.PI / 2;

const LAYOUT: Record<BuildingId, Piece[]> = {
  // Salon-bibliothèque : bibliothèques, canapé, fauteuil, table basse, tapis, lampadaire, tableaux.
  profile: [
    ['cabinet-medium-decorated', 9.75, ROWS[0], -Q, 0, [1.6, 1.15, 1]],
    ['cabinet-medium-decorated', -9.75, ROWS[1], Q, 0, [1.6, 1.15, 1]],
    ['cabinet-medium-decorated', 9.75, ROWS[2], -Q, 0, [1.6, 1.15, 1]],
    ['cabinet-medium-decorated', -9.75, ROWS[3], Q, 0, [1.6, 1.15, 1]],
    ['rug-rectangle-stripes-a', -1, BACK + 1.9, 0, 0, 1.3],
    ['couch-pillows', -2.2, BACK, 0, 0, [1.45, 1, 0.75]],
    ['armchair', 3.4, BACK, -0.3, 0, 0.85],
    ['table-low', -2.2, BACK + 1.7, 0, 0, [0.65, 1, 0.5]],
    ['cactus-small-a', -2.6, BACK + 1.7, 0, 0.5, 0.8],
    ['lamp-standing', 8.6, -12, 0, 0, 1],
    ['pictureframe-large-b', -2.2, WALL, 0, 2.4, 1],
    ['pictureframe-medium', 3.4, WALL, 0, 2.3, 1],
  ],
  // Laboratoire : grande paillasse, chaises, lampes, plantes, armoire.
  'project-1': [
    ['table-medium-long', 0, BACK, 0, 0, [1.7, 1, 0.7]],
    ['lamp-table', -1.8, BACK, 0, 1, 0.6],
    ['book-set', 1.4, BACK, 0.3, 1, 1],
    ['chair-c', -1.2, BACK + 1.25, Math.PI, 0, 1],
    ['chair-c', 1.4, BACK + 1.25, Math.PI, 0, 1],
    ['table-small', -8.6, -12, 0, 0, [1.4, 1, 1.1]],
    ['cactus-medium-a', -8.6, -12, 0, 1, 0.9],
    ['cabinet-medium-decorated', 8.9, -12, 0, 0, [0.7, 1, 0.6]],
    ['pictureframe-large-a', 0, WALL, 0, 2.7, 1],
  ],
  // Atelier : long établi, étagère chargée, armoire basse, tabourets.
  'project-2': [
    ['table-medium-long', 0, BACK + 0.2, 0, 0, [2.1, 1, 0.55]],
    ['book-set', -1.6, BACK + 0.2, 0, 1, 1],
    ['lamp-table', 2.2, BACK + 0.2, 0, 1, 0.6],
    ['chair-stool', -1.5, BACK + 1.4, 0, 0, 1],
    ['chair-stool', 1.5, BACK + 1.4, 0, 0, 1],
    ['shelf-b-large-decorated', -8.4, -12.1, 0, 0, [1.2, 1.4, 1]],
    ['cabinet-small', 8.6, -12, 0, 0, [1.2, 1, 1.2]],
    ['pictureframe-large-b', 0, WALL, 0, 3, 1],
  ],
  // Observatoire : estrade, fauteuil d'observation, étagère, plante, tapis rond, cartes du ciel.
  'project-3': [
    ['table-low', 6.6, -11.6, 0, 0, [2.4, 1, 1.3]],
    ['armchair', 6.6, -11.6, Math.PI, 0.5, 0.85],
    ['shelf-b-small-decorated', 2.6, -12.1, 0, 0, [2.1, 1.3, 1]],
    ['table-small', -9.2, -12, 0, 0, 1.1],
    ['cactus-medium-a', -9.2, -12, 0, 1.1, 0.9],
    ['rug-oval-a', 0, -5.5, 0, 0, 1.4],
    ['pictureframe-large-a', -4, WALL, 0, 2.6, 1],
    ['pictureframe-standing-a', 6.6, -12.1, 0, 0.5, 1.2],
  ],
  // Galerie : socles portant des cadres, banc, grands tableaux au fond.
  missions: [
    ['table-small', -3, BACK, 0, 0, [1.1, 1.1, 1.1]],
    ['pictureframe-standing-a', -3, BACK, 0, 1.1, 1.3],
    ['table-small', 3, BACK, 0, 0, [1.1, 1.1, 1.1]],
    ['pictureframe-standing-a', 3, BACK, 0, 1.1, 1.3],
    ['table-low', 0, BACK + 2.3, 0, 0, [1.25, 0.9, 0.5]],
    ['pictureframe-large-b', -6.5, WALL, 0, 2.8, 1.3],
    ['pictureframe-large-b', 6.5, WALL, 0, 2.8, 1.3],
    ['pictureframe-large-a', 0, WALL, 0, 3.1, 1.2],
  ],
  // Salle de contrôle : pupitre long, chaises, lampes, armoires techniques dans les coins.
  veolia: [
    ['table-medium-long', 0, BACK, 0, 0, [2.4, 1, 0.7]],
    ['lamp-table', -2.8, BACK, 0, 1, 0.6],
    ['lamp-table', 2.8, BACK, 0, 1, 0.6],
    ['book-set', 0, BACK, 0, 1, 1],
    ['chair-c', -2.5, BACK + 1.3, Math.PI, 0, 1],
    ['chair-c', 0, BACK + 1.3, Math.PI, 0, 1],
    ['chair-c', 2.5, BACK + 1.3, Math.PI, 0, 1],
    ...VEOLIA_COLUMNS.map(([x, z]): Piece => [
      'cabinet-medium-decorated',
      x,
      z,
      Math.sign(-x) * Q,
      0,
      [0.9, 1.2, 0.9],
    ]),
    ['pictureframe-large-b', 0, WALL, 0, 3, 1.4],
  ],
};

export default function Mobilier({ id }: { id: BuildingId }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    loadKits('meubles').then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  const meshes = useMemo(() => {
    if (!ready) return [];
    const byModel = new Map<KitModel, Placement[]>();
    for (const [model, x, z, ry, y = 0, scale = 1] of LAYOUT[id]) {
      const list = byModel.get(model) ?? [];
      list.push({ x, y, z, ry, scale, light: [1, 1] });
      byModel.set(model, list);
    }
    return [...byModel].map(([model, list]) => instances(kitGeometry(model), list));
  }, [ready, id]);
  return (
    <>
      {meshes.map((m, i) => (
        <primitive key={i} object={m} />
      ))}
    </>
  );
}
