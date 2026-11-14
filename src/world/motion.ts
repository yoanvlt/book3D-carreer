import {
  getState,
  setState,
  player,
  view,
  journey,
  passage,
  travel,
  finishJourney,
  type DoorStage,
} from '../state';
import { buildings, entrance, localToWorld, type Point } from './config';
import { heightAt } from './terrain';
import { moveWithCollisions } from './collision';
import { moveIndoors } from './narrative';
import { ease } from './cinematics';

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
function walk(to: Point, speed: number, dt: number) {
  const dx = to[0] - player.x,
    dz = to[1] - player.z,
    d = Math.hypot(dx, dz);
  if (d < 0.035) return true;
  const step = Math.min(d, speed * dt),
    delta: Point = [(dx / d) * step, (dz / d) * step],
    id = getState().interior;
  const next = id
    ? moveIndoors([player.x, player.z], delta, id)
    : moveWithCollisions([player.x, player.z], delta);
  position(next, dt);
  turn(Math.atan2(dx, dz), dt);
  return Math.hypot(to[0] - player.x, to[1] - player.z) < 0.035;
}
function stage(next: DoorStage) {
  passage.stage = next;
  passage.time = 0;
  passage.from = [player.x, player.z];
}
/** The sole owner of automatic robot motion. Runs before input and camera. */
export function tickMotion(delta: number) {
  const dt = Math.max(0.001, Math.min(delta, 0.05)),
    s = getState();
  if (s.phase === 'showcase' || s.phase === 'returning') {
    player.speed *= Math.exp(-12 * dt);
    return;
  }
  if (s.phase === 'travel') {
    const p = journey.points[journey.index];
    if (!p) {
      if (journey.destination) {
        const b = buildings.find((b) => b.id === journey.destination)!;
        turn(b.rotation + Math.PI, dt, 5);
        player.speed *= Math.exp(-10 * dt);
        view.yaw += angleDifference(b.rotation, view.yaw) * (1 - Math.exp(-2 * dt));
        if (Math.abs(angleDifference(b.rotation + Math.PI, player.angle)) > 0.025) return;
      }
      finishJourney();
      return;
    }
    let remaining = Math.hypot(p[0] - player.x, p[1] - player.z);
    for (let i = journey.index; i < journey.points.length - 1; i++)
      remaining += Math.hypot(
        journey.points[i + 1][0] - journey.points[i][0],
        journey.points[i + 1][1] - journey.points[i][1],
      );
    const next = journey.points[journey.index + 1],
      heading = Math.atan2(p[0] - player.x, p[1] - player.z);
    const corner = next ? Math.abs(angleDifference(Math.atan2(next[0] - p[0], next[1] - p[1]), heading)) : 0;
    const limit = s.interior ? 4.2 : 9,
      desired = Math.min(limit, Math.sqrt(remaining * 7) + 0.25) * (1 - Math.min(0.5, corner * 0.22));
    journey.speed += Math.max(-dt * 9, Math.min(dt * 5, desired - journey.speed));
    if (walk(p, journey.speed, dt)) {
      journey.index++;
      journey.stalled = 0;
    } else if (player.speed < 0.02) journey.stalled += dt;
    else journey.stalled = 0;
    if (journey.stalled > 0.8) {
      player.speed = 0;
      journey.exit = false;
      passage.pending = null;
      setState({
        phase: 'explore',
        notice: 'Trajet interrompu par un obstacle. Vous pouvez reprendre la marche.',
      });
    }
    if (!s.interior) {
      const yaw = player.angle - Math.PI;
      view.yaw += angleDifference(yaw, view.yaw) * (1 - Math.exp(-0.85 * dt));
    }
    return;
  }
  if (s.phase !== 'doorway') return;
  const b = buildings.find((b) => b.id === s.door)!;
  passage.time += dt;
  const t = passage.time;
  const direction = passage.leaving ? 0 : b.rotation + Math.PI;
  if (passage.stage === 'approach') {
    const p = passage.route[passage.index];
    if (p) {
      if (walk(p, Math.min(3.2, 0.5 + t * 4), dt)) passage.index++;
    } else {
      player.speed *= Math.exp(-10 * dt);
      turn(direction, dt);
      if (Math.abs(angleDifference(direction, player.angle)) < 0.035) stage('opening');
    }
    if (t > 25) {
      passage.openness = 0;
      passage.pending = null;
      player.speed = 0;
      setState({
        phase: 'explore',
        door: null,
        notice: 'Approche interrompue. Replacez le robot face à la porte.',
      });
    }
  } else if (passage.stage === 'opening') {
    player.speed *= Math.exp(-10 * dt);
    turn(direction, dt);
    passage.openness = ease(t / 0.6);
    if (t >= 0.6) stage('crossing');
  } else if (passage.stage === 'crossing') {
    // Only this aligned doorway corridor bypasses the exterior building footprint.
    const amount = ease(t / 1.35);
    position(
      [
        passage.from[0] + (passage.to[0] - passage.from[0]) * amount,
        passage.from[1] + (passage.to[1] - passage.from[1]) * amount,
      ],
      dt,
    );
    if (t >= 1.35) stage('handoff');
  } else if (passage.stage === 'handoff') {
    player.speed = 0;
    passage.fade = t < 0.14 ? ease(t / 0.14) : 1 - ease((t - 0.14) / 0.14);
    if (t >= 0.14 && !passage.swapped) {
      passage.swapped = true;
      const p: Point = passage.leaving ? localToWorld(b, 0, b.size[1] / 2 + 0.1) : [0, 17.55];
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
    if (t >= 0.28) {
      passage.fade = 0;
      passage.to = passage.leaving ? entrance(b) : [0, 14];
      stage('emerging');
    }
  } else if (passage.stage === 'emerging') {
    const amount = ease(t / 1.35);
    position(
      [
        passage.from[0] + (passage.to[0] - passage.from[0]) * amount,
        passage.from[1] + (passage.to[1] - passage.from[1]) * amount,
      ],
      dt,
    );
    if (t >= 1.35) {
      player.speed = 0;
      stage('closing');
    }
  } else {
    passage.openness = 1 - ease(t / 0.55);
    if (t >= 0.55) {
      passage.openness = 0;
      passage.fade = 0;
      setState({ phase: 'explore', door: null });
      const pending = passage.pending;
      passage.pending = null;
      if (pending) travel(pending);
    }
  }
}
