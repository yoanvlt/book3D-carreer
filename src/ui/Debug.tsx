import { useEffect } from 'react';
import * as THREE from 'three';
import * as game from '../state';
import { photo, measureFootprints, probe } from '../scene/photo';
import { buildings, type BuildingId } from '../world/config';
import { ROOM } from '../world/narrative';

/** `?debug=1` : relevé de rendu (FPS, draw calls) et commandes pour les captures automatiques. */
export const debugEnabled = new URLSearchParams(window.location.search).has('debug');

declare global {
  interface Window {
    __careerverse?: typeof hooks;
  }
}
const hooks = {
  state: () => game.getState(),
  player: () => ({ ...game.player }),
  enter: game.enter,
  travel: game.travel,
  openBuilding: game.openBuilding,
  discover: game.discover,
  guideToStation: game.guideToStation,
  interact: game.interact,
  leave: game.guideExit,
  goHome: game.goHome,
  setState: game.setState,
  /** Place le robot (captures des actions), assis sur le banc le plus proche, ou qui salue. */
  place: (x: number, z: number, angle = game.player.angle) => {
    Object.assign(game.player, { x, z, angle, speed: 0 });
    game.player.teleport++;
  },
  sit: () => game.interact(),
  wave: game.wave,
  /** Fige les vols du robot (entrée, retour) à une fraction de leur durée, pour les captures. */
  holdFlight: (t: number | null) => {
    game.robotUi.hold = t;
  },
  /** Robot en vol et caméra : positions, pour contrôler le cadrage des vols. */
  flight: () => ({
    robot: game.robotUi.position,
    heading: game.robotUi.heading,
    camera: probe.camera?.position.toArray(),
    look: probe.camera?.getWorldDirection(new THREE.Vector3()).toArray(),
  }),
  /** Caméra fixe pour les captures de détail ; `photo(null)` rend la caméra au robot. */
  photo: (
    shot: { position: [number, number, number]; target: [number, number, number]; fov?: number } | null,
  ) => {
    if (!shot) photo.active = false;
    else Object.assign(photo, { active: true, fov: 40, ...shot });
  },
  /** Géométrie des bâtiments, pour placer les caméras de capture. */
  layout: () =>
    buildings.map(({ id, position, rotation, size, height, elevation }) => ({
      id,
      position,
      rotation,
      size,
      height,
      elevation,
    })),
  /** Emprise réelle de chaque bâtiment, comparée à la taille prévue (tests/coherence.test.mjs). */
  footprints: () => {
    const measured = measureFootprints(buildings.map((b) => b.id));
    return measured.map((m) => ({ ...m, size: buildings.find((b) => b.id === m.id)!.size }));
  },
  /** Programmes de shaders compilés (mesure du chargement). */
  programs: () => probe.renderer?.info.programs?.map((p) => p.name) ?? [],
  /** Entre directement dans un intérieur, sans la séquence de porte. */
  visit: (id: BuildingId | null) => {
    game.player.x = id ? ROOM.spawn[0] : game.player.x;
    game.player.z = id ? ROOM.spawn[1] : game.player.z;
    game.player.y = 0;
    game.player.teleport++;
    game.setState({ interior: id, phase: 'explore', nearby: null, station: null });
  },
};

export default function Debug() {
  useEffect(() => {
    window.__careerverse = hooks;
    return () => {
      delete window.__careerverse;
    };
  }, []);
  return <output id='diagnostics' className='diagnostics' aria-label='Diagnostic de rendu' />;
}
