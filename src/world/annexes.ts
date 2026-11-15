/**
 * Volumes annexes des six lieux (V8), en repère local du bâtiment (façade vers +z) : boîtes
 * [x, z, demi-largeur, demi-profondeur, hauteur] qui gênent la marche et la caméra, en plus du
 * volume principal (config.ts). Tenus à jour avec la géométrie (src/geometry/buildings/).
 */
import type { BuildingId } from './config';

export type Annex = [number, number, number, number, number];

export const ANNEXES: Record<BuildingId, Annex[]> = {
  profile: [],
  'project-1': [],
  // Cour : murs nord et ouest, quai ; cheminée.
  'project-2': [
    [23.8, -2.75, 0.3, 9.4, 1.6],
    [16.75, -11.8, 7.5, 0.3, 1.6],
    [10.2, -2.5, 1.3, 3.1, 4.9],
    [12.5, 6.3, 3, 0.3, 1.6],
    [21.5, 6.3, 2.3, 0.3, 1.6],
    [-7.8, -7.6, 1, 1, 15],
  ],
  // Escalier de la terrasse, face est.
  'project-3': [[7.25, -0.5, 0.75, 5.0, 4.2]],
  // Colonnes du portique et sa marche ; entablement au-dessus (caméra).
  missions: [
    [-7.6, 5.2, 0.5, 0.5, 7.2],
    [-2.8, 5.2, 0.5, 0.5, 7.2],
    [2.8, 5.2, 0.5, 0.5, 7.2],
    [7.6, 5.2, 0.5, 0.5, 7.2],
  ],
  // Socle des cuves, bassin.
  veolia: [
    [16, 0, 6.1, 4.6, 9.4],
    [16, -9, 3.1, 3.1, 1],
  ],
};
