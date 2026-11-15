import {
  getState,
  setState,
  player,
  view,
  journey,
  passage,
  skip,
  travel,
  finishJourney,
  skipJourney,
  endPresentation,
  type DoorStage,
} from '../state';
import { buildings, doorPoint, entrance, type Point } from './config';
import { heightAt } from './terrain';
import { ROOM } from './narrative';
import { ease } from './cinematics';
import { TIMING, pointAlong, trapezoid } from './timing';

export const angleDifference = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
function turn(angle: number, dt: number, rate = 7) {
  player.angle += angleDifference(angle, player.angle) * (1 - Math.exp(-rate * dt));
}
function position(p: Point, dt: number) {
  const old: Point = [player.x, player.z];
  player.x = p[0];
  player.z = p[1];
  player.y = getState().interior ? 0 : heightAt(...p);
  player.speed = Math.hypot(p[0] - old[0], p[1] - old[1]) / dt;
}
function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function stage(next: DoorStage) {
  passage.stage = next;
  passage.time = 0;
  passage.from = [player.x, player.z];
}

/**
 * Trajet automatique : la ligne brisée (validée par la navigation) est parcourue en un temps fixé,
 * profil de vitesse en trapèze. Le robot regarde devant lui puis s'oriente vers la porte d'arrivée.
 */
function tickJourney(dt: number) {
  const s = getState();
  journey.elapsed += dt;
  const u = Math.min(1, journey.elapsed / Math.max(0.001, journey.duration));
  const total = journey.lengths.at(-1) ?? 0;
  const { p, heading } = pointAlong(journey.points, journey.lengths, trapezoid(u) * total);
  position(p, dt);
  journey.speed = player.speed;
  const b = journey.destination ? buildings.find((b) => b.id === journey.destination)! : null;
  if (b && u > 0.7) turn(b.rotation + Math.PI, dt, 9);
  else if (total - trapezoid(u) * total > 0.05) turn(heading, dt, 10);
  if (!s.interior) {
    const yaw = player.angle - Math.PI;
    view.yaw += angleDifference(yaw, view.yaw) * (1 - Math.exp(-2.4 * dt));
  }
  if (u >= 1) {
    if (b) player.angle = b.rotation + Math.PI;
    finishJourney();
  }
}

/** Orientation de la porte, atteinte à la fin de l'ouverture. */
function faceDoor(direction: number) {
  const span = passage.approach + TIMING.opening;
  const elapsed = passage.stage === 'opening' ? passage.approach + passage.time : passage.time;
  const k = ease(Math.min(1, elapsed / span));
  player.angle = passage.startAngle + angleDifference(direction, passage.startAngle) * k;
}

/** Séquence de porte, identique dans les deux sens ; les deux faces de la porte suivent `openness`. */
function tickDoor(dt: number) {
  const s = getState();
  const b = buildings.find((b) => b.id === s.door)!;
  passage.time += dt;
  const t = passage.time;
  const direction = passage.leaving ? 0 : b.rotation + Math.PI;
  switch (passage.stage) {
    case 'cut': {
      // Fondu au blanc, robot replacé au seuil intérieur, puis fondu inverse.
      const half = TIMING.cut / 2;
      passage.fade = t < half ? ease(t / half) : 1 - ease((t - half) / half);
      if (t >= half && passage.index !== -1) {
        passage.index = -1;
        player.x = ROOM.exit[0];
        player.z = ROOM.exit[1];
        player.y = 0;
        player.angle = direction;
        passage.startAngle = direction;
        player.speed = 0;
        player.teleport++;
      }
      if (t >= TIMING.cut) {
        passage.fade = 0;
        passage.approach = 0;
        stage('opening');
      }
      return;
    }
    case 'approach': {
      const total = passage.lengths.at(-1) ?? 0;
      const k = Math.min(1, t / passage.approach);
      position(pointAlong(passage.route, passage.lengths, ease(k) * total).p, dt);
      faceDoor(direction);
      if (k >= 1) stage('opening');
      return;
    }
    case 'opening':
      player.speed = 0;
      faceDoor(direction);
      passage.openness = ease(t / TIMING.opening);
      if (t >= TIMING.opening) {
        passage.openness = 1;
        player.angle = direction;
        stage('crossing');
      }
      return;
    case 'crossing':
      // Seul ce couloir aligné sur la porte traverse l'emprise extérieure du bâtiment.
      position(lerp(passage.from, passage.to, ease(t / TIMING.crossing)), dt);
      if (t >= TIMING.crossing) stage('handoff');
      return;
    case 'handoff': {
      player.speed = 0;
      const half = TIMING.handoff / 2;
      passage.fade = t < half ? ease(t / half) : 1 - ease((t - half) / half);
      if (t >= half && !passage.swapped) {
        passage.swapped = true;
        // Le fondu couvre le changement de scène : le robot réapparaît déjà un peu engagé.
        const p: Point = passage.leaving ? doorPoint(b) : [ROOM.arrival[0], ROOM.arrival[1] + 2.5];
        setState({
          interior: passage.leaving ? null : b.id,
          nearby: passage.leaving ? b.id : null,
          station: null,
          visited: s.visited.includes(b.id) ? s.visited : [...s.visited, b.id],
        });
        player.x = p[0];
        player.z = p[1];
        player.y = passage.leaving ? heightAt(...p) : 0;
        player.angle = passage.leaving ? b.rotation : Math.PI;
        player.teleport++;
        view.yaw = passage.leaving ? b.rotation : 0;
      }
      if (t >= TIMING.handoff) {
        passage.fade = 0;
        passage.to = passage.leaving ? entrance(b) : ROOM.arrival;
        stage('emerging');
      }
      return;
    }
    case 'emerging':
      position(lerp(passage.from, passage.to, ease(t / TIMING.emerging)), dt);
      if (t >= TIMING.emerging) {
        player.x = passage.to[0];
        player.z = passage.to[1];
        player.speed = 0;
        stage('closing');
      }
      return;
    case 'closing': {
      passage.openness = 1 - ease(t / TIMING.closing);
      if (t >= TIMING.closing) {
        passage.openness = 0;
        passage.fade = 0;
        setState({ phase: 'explore', door: null });
        const pending = passage.pending;
        passage.pending = null;
        if (pending) travel(pending);
      }
      return;
    }
  }
}

/** Seul propriétaire du déplacement automatique du robot. Exécuté avant le clavier et la caméra. */
export function tickMotion(delta: number) {
  const dt = Math.max(0.001, Math.min(delta, 0.05)),
    s = getState();
  if (s.phase === 'showcase' || s.phase === 'returning') {
    player.speed *= Math.exp(-12 * dt);
    return;
  }
  if (s.phase === 'travel') {
    if (journey.points.length < 2) finishJourney();
    else tickJourney(dt);
    return;
  }
  if (s.phase === 'doorway') tickDoor(dt);
}

/** Termine immédiatement une séquence de porte en cours (même état final qu'en la laissant jouer). */
function skipDoor() {
  for (let i = 0; i < 400 && getState().phase === 'doorway'; i++) tickMotion(0.05);
  player.teleport++;
}

/**
 * Passer la séquence en cours : clic, toucher, Espace ou Entrée. Trajet → arrivée, porte → fin
 * de la porte, présentation → retour, descente ou retour de caméra → pose finale.
 */
export function skipCurrent(): boolean {
  const phase = getState().phase;
  if (phase === 'travel') skipJourney();
  else if (phase === 'doorway') skipDoor();
  else if (phase === 'showcase') endPresentation();
  else if (phase === 'entering' || phase === 'returning' || phase === 'homing') skip.serial++;
  else return false;
  return true;
}
