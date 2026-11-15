/**
 * Le robot (V8) : marche, actions (s'asseoir sur un banc, saluer, regarder autour de lui à
 * l'arrêt), attente sur l'îlot d'accueil, vols d'entrée et de retour. Le vol suit la timeline de
 * world/flight.ts ; ce composant l'avance (avant la caméra) et conclut l'arrivée ou le retour.
 */
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { finishArrival, getState, player, presentation, robotUi, setState, skip } from '../state';
import {
  FLIGHT,
  flightPath,
  flightPose,
  homePosition,
  landingPoint,
  type Path,
  type V3,
} from '../world/flight';
import { homeCamera } from '../world/clouds';
import { buildings, WORLD } from '../world/config';
import { angleDifference } from '../world/motion';
import { play } from '../audio/sound';
import { photo } from './photo';
import { RobotModel, useRig } from './robot/Model';
import { Puffs, SoftShadow, TapMarker, dustRing, puff, useIslet } from './robot/Fx';

type Mode = typeof robotUi.flight.mode;
/** Mode du robot : accueil, vol aller (entrée, visite guidée), vol retour, ou marche (''). */
function modeOf(s: ReturnType<typeof getState>, previous: Mode): Mode {
  if (photo.active) return '';
  if (s.phase === 'entering') return 'entering';
  if (s.phase === 'homing') return 'homing';
  if (s.tour !== null && presentation.fromHome) return 'tour';
  if (s.phase === 'home') return previous === 'tour' || previous === 'back' ? 'back' : 'home';
  return '';
}

const damp = THREE.MathUtils.damp;

export default function Robot() {
  const rig = useRig();
  const islet = useIslet();
  const { camera, size } = useThree();
  const gait = useRef(0);
  const motion = useRef(0);
  const still = useRef(0);
  const airborne = useRef(false);
  const previous = useRef({ speed: 0, angle: player.angle });
  const trail = useRef(0);
  const home = useRef<V3>([0, 0, 0]);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      robotUi.pointer = [(e.clientX / window.innerWidth) * 2 - 1, 1 - (e.clientY / window.innerHeight) * 2];
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);

  /** Accueil et vols. Renvoie vrai quand le robot ne suit pas le joueur. */
  const homeAndFlight = (dt: number, t: number) => {
    const s = getState();
    const f = robotUi.flight;
    const mode = modeOf(s, f.mode);
    const [root, body, head, armL, armR, flames] = [
      rig.root.current,
      rig.body.current,
      rig.head.current,
      rig.armL.current,
      rig.armR.current,
      rig.flames.current,
    ];
    // Îlot : devant la caméra d'accueil (réelle à l'accueil, calculée pendant les vols).
    const real = s.phase === 'home' && mode === 'home';
    home.current = homePosition(
      real ? (camera as THREE.PerspectiveCamera) : homeCamera(size.width, size.height),
      size.width,
    );
    const bob = s.reducedMotion ? 0 : Math.sin(t * 0.9) * 0.12;
    islet.position.set(home.current[0], home.current[1] + bob, home.current[2]);
    islet.updateMatrix();
    islet.visible = mode !== '' || s.phase === 'home';
    if (!mode) {
      f.mode = '';
      return false;
    }
    if (mode === 'home') {
      f.mode = 'home';
      flames.visible = false;
      root.position.set(home.current[0], home.current[1] + bob, home.current[2]);
      root.scale.set(1, 1, 1);
      const towardCamera = Math.atan2(
        camera.position.x - root.position.x,
        camera.position.z - root.position.z,
      );
      root.rotation.set(0, towardCamera - 0.45, 0);
      body.rotation.set(0, 0, 0);
      body.position.y = 0;
      // Il vit : regarde le curseur s'il bouge, sinon balaie l'île du regard.
      const [px, py] = robotUi.pointer;
      const scan = Math.sin(t * 0.45) * 0.55 + 0.25;
      const look = Math.abs(px) + Math.abs(py) > 0.01 ? px * 0.6 + 0.3 : scan;
      head.rotation.y = damp(head.rotation.y, look, 4, dt);
      head.rotation.x = damp(head.rotation.x, -py * 0.3 + 0.08, 4, dt);
      const greet = (robotUi.wave || performance.now() < robotUi.waveUntil) && !s.reducedMotion;
      armR.rotation.z = damp(armR.rotation.z, greet ? 2.5 + Math.sin(t * 9) * 0.35 : 0.2, 8, dt);
      armR.rotation.x = damp(armR.rotation.x, 0, 8, dt);
      armL.rotation.z = damp(armL.rotation.z, -0.2, 8, dt);
      rig.left.current.rotation.x = rig.right.current.rotation.x = 0;
      return true;
    }
    if (f.mode !== mode) {
      const going = mode === 'entering' || mode === 'tour';
      const from = root.position.toArray() as V3;
      const to = going ? landingPoint() : home.current;
      // Retour : il se retourne vers la ville avant de se poser.
      const back = Math.atan2(0 - to[0], 0 - to[2]);
      Object.assign(f, {
        mode,
        path: flightPath(from, to),
        time: 0,
        startYaw: root.rotation.y,
        endYaw: going ? WORLD.spawnAngle : back,
        skip: skip.serial,
      });
      if (!s.reducedMotion) play('saut', { volume: 0.35 });
    }
    if (skip.serial !== f.skip || s.reducedMotion) f.time = FLIGHT.total;
    const before = f.time;
    f.time = Math.min(FLIGHT.total, f.time + dt);
    if (robotUi.hold !== null) f.time = robotUi.hold * FLIGHT.total;
    const pose = flightPose(f.path as Path, f.time, f.startYaw, f.endYaw);
    root.position.set(...pose.p);
    root.rotation.set(0, pose.yaw, 0);
    root.scale.set(1 + (1 - pose.squash) * 0.5, pose.squash, 1 + (1 - pose.squash) * 0.5);
    body.rotation.set(pose.pitch, 0, pose.roll);
    body.position.y = -pose.crouch * 0.3;
    rig.left.current.rotation.x = rig.right.current.rotation.x = -pose.crouch * 0.5 + pose.pitch * 0.4;
    armL.rotation.z = damp(armL.rotation.z, -0.35 - pose.thrust * 0.35, 8, dt);
    armR.rotation.z = damp(armR.rotation.z, 0.35 + pose.thrust * 0.35, 8, dt);
    armL.rotation.x = armR.rotation.x = damp(armR.rotation.x, pose.crouch * 0.8 + pose.thrust * 0.25, 8, dt);
    head.rotation.x = damp(head.rotation.x, -pose.pitch * 0.5, 6, dt);
    head.rotation.y = damp(head.rotation.y, 0, 6, dt);
    // Propulseurs : flamme bruitée, fumée au décollage, traînée légère en croisière.
    flames.visible = pose.thrust > 0.02 && !s.reducedMotion;
    flames.scale.set(1, pose.thrust * (0.85 + Math.sin(t * 43) * 0.1 + Math.sin(t * 27) * 0.08), 1);
    if (!s.reducedMotion) {
      if (pose.step === 'launch' && Math.random() < 0.6)
        puff(pose.p[0] + (Math.random() - 0.5), pose.p[1] - 0.2, pose.p[2] + (Math.random() - 0.5), 0.45, {
          color: '#e8ecee',
          life: 0.9,
        });
      trail.current += dt;
      if (pose.step === 'cruise' && trail.current > 0.035) {
        trail.current = 0;
        puff(pose.p[0], pose.p[1] - 0.3, pose.p[2], 0.22, { color: '#f4f6f6', life: 0.8, rise: 0.05 });
      }
    }
    const landing = FLIGHT.total - 0.3;
    if (before < landing && f.time >= landing) {
      dustRing(pose.p[0], pose.p[1], pose.p[2]);
      if (!s.reducedMotion) play('pas', { volume: 0.6, rate: 0.8 });
    }
    robotUi.position = pose.p;
    robotUi.heading = Math.atan2(f.path![3][0] - f.path![0][0], f.path![3][2] - f.path![0][2]);
    if (f.time >= FLIGHT.total) {
      if (mode === 'entering') finishArrival();
      else if (mode === 'homing') setState({ phase: 'home' });
      else if (mode === 'back') f.mode = 'home';
    }
    return true;
  };

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime;
    const [root, body, head, armL, armR] = [
      rig.root.current,
      rig.body.current,
      rig.head.current,
      rig.armL.current,
      rig.armR.current,
    ];
    // Clignement des yeux : un battement bref toutes les 3,6 s environ.
    rig.eyes.current.scale.y = t % 3.6 < 0.12 ? 0.15 : 1;
    if (homeAndFlight(dt, t)) return;
    rig.flames.current.visible = false;
    root.scale.set(1, 1, 1);
    const state = getState();
    const active = !state.map && !state.detail && !state.reading && !state.help;
    // Assis sur un banc : jambes vers l'avant, mains sur les genoux.
    const sit = robotUi.sit;
    if (sit) {
      root.position.set(sit.x, player.y - 0.32, sit.z);
      root.rotation.set(0, sit.ry, 0);
      rig.left.current.rotation.x = rig.right.current.rotation.x = damp(
        rig.left.current.rotation.x,
        -1.45,
        8,
        dt,
      );
      armL.rotation.x = armR.rotation.x = damp(armR.rotation.x, -0.9, 8, dt);
      body.rotation.x = damp(body.rotation.x, -0.08, 6, dt);
      head.rotation.y = damp(head.rotation.y, Math.sin(t * 0.4) * 0.5, 3, dt);
      return;
    }
    root.position.set(player.x, player.y + 0.14 + player.jump.height, player.z);
    root.rotation.set(0, player.angle, 0);
    motion.current = damp(motion.current, active ? player.speed : 0, 9, dt);
    const speed = motion.current;
    const run = Math.max(0, Math.min(1, (speed - 6) / 3));
    const stride = Math.sign(Math.sin(gait.current));
    gait.current += dt * (speed * 2.5);
    if (speed > 1.2 && player.jump.height === 0 && Math.sign(Math.sin(gait.current)) !== stride)
      play('pas', { rate: 0.9 + Math.random() * 0.25, volume: state.interior ? 0.35 : 0.45 });
    if (player.jump.velocity > 0 && !airborne.current) play('saut', { volume: 0.5 });
    airborne.current = player.jump.velocity > 0 || player.jump.height > 0;
    const swing = Math.sin(gait.current) * Math.min(1, speed / 3) * (0.55 + run * 0.35);
    rig.left.current.rotation.x = swing;
    rig.right.current.rotation.x = -swing;
    player.reaction = Math.max(0, player.reaction - dt * 0.8);
    const acceleration = Math.max(-8, Math.min(8, (speed - previous.current.speed) / Math.max(0.001, dt)));
    const turning = Math.max(
      -2,
      Math.min(2, angleDifference(player.angle, previous.current.angle) / Math.max(0.001, dt)),
    );
    previous.current = { speed, angle: player.angle };
    still.current = speed < 0.2 ? still.current + dt : 0;
    // Salut (H) : bras droit levé qui s'agite.
    const greet = performance.now() < robotUi.waveUntil && !state.reducedMotion;
    armL.rotation.x = damp(armL.rotation.x, -swing * 0.8, 14, dt);
    armR.rotation.x = damp(armR.rotation.x, greet ? 0 : swing * 0.8 - player.reaction * 0.65, 10, dt);
    armR.rotation.z = damp(
      armR.rotation.z,
      greet ? 2.5 + Math.sin(t * 9) * 0.35 : -player.reaction * 0.3,
      10,
      dt,
    );
    body.rotation.x = damp(body.rotation.x, run * 0.14 + acceleration * 0.008, 6, dt);
    body.rotation.z = damp(
      body.rotation.z,
      Math.sin(gait.current) * Math.min(speed / 6, 1) * 0.045 - turning * Math.min(speed / 6, 1) * 0.06,
      8,
      dt,
    );
    // Attentes variées à l'arrêt : il regarde autour de lui, penche la tête, s'étire.
    const idle = still.current > 2.5 && !state.reducedMotion;
    const cycle = Math.floor(t / 6) % 3;
    body.rotation.y = damp(body.rotation.y, idle && cycle === 2 ? Math.sin(t * 1.2) * 0.12 : 0, 5, dt);
    if (idle && cycle === 2) armL.rotation.z = damp(armL.rotation.z, -0.9, 3, dt);
    else armL.rotation.z = damp(armL.rotation.z, 0, 6, dt);
    const b = buildings.find((x) => x.id === (state.showcase ?? (state.interior ? null : state.nearby)));
    const gaze = b
      ? Math.max(
          -0.6,
          Math.min(
            0.6,
            angleDifference(Math.atan2(b.position[0] - player.x, b.position[1] - player.z), player.angle),
          ),
        )
      : idle && cycle === 0
        ? Math.sin(t * 0.8) * 0.75
        : turning * 0.12;
    head.rotation.y = damp(head.rotation.y, gaze, 4, dt);
    head.rotation.x = damp(
      head.rotation.x,
      state.showcase ? -0.1 : b ? -0.05 : idle && cycle === 1 ? 0.25 : 0,
      4,
      dt,
    );
    head.rotation.z = damp(head.rotation.z, idle && cycle === 1 ? 0.2 : 0, 4, dt);
    body.position.y =
      (state.reducedMotion ? 0 : Math.sin(t * 2) * 0.018) +
      Math.abs(Math.sin(gait.current)) * Math.min(speed / 6, 1) * (0.07 + run * 0.08);
  }, -2);
  return (
    <>
      <Puffs />
      <TapMarker />
      <primitive object={islet} />
      <RobotModel rig={rig} />
      <SoftShadow target={rig.root} />
    </>
  );
}
