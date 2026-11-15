// Durées des séquences automatiques, mesurées en temps simulé à 60 images par seconde avec le vrai
// code de déplacement (src/world/motion.ts, src/state.ts), sans navigateur ni GPU.
//   node scripts/temps-morts.mjs
// En rendu logiciel, le navigateur tourne à 1-5 images par seconde et le pas de temps est plafonné :
// une mesure dans le navigateur y serait faussée. Ces durées sont celles d'un écran à 60 Hz.
import { loadSource } from '../tests/load-source.mjs';

globalThis.window ??= { matchMedia: () => ({ matches: false }) };
const source = await loadSource('temps-morts');
const game = await source.import('state');
const { buildings, WORLD } = await source.import('world/config');
const { heightAt } = await source.import('world/terrain');
const { tickMotion } = await source.import('world/motion');
const cinema = await source.import('world/cinematics');
const narrative = await source.import('world/narrative');
// Absent de la V4 : la présentation y durait compositions[id].duration + 1,6 s de retour.
const TIMING = await source.import('world/timing').then(
  (m) => m.TIMING,
  () => null,
);

const DT = 1 / 60;
function run(until, limit = 60 * 120) {
  for (let i = 0; i < limit; i++) {
    if (until()) return i * DT;
    tickMotion(DT);
  }
  return Infinity;
}
function reset() {
  game.setState({
    phase: 'explore',
    interior: null,
    door: null,
    showcase: null,
    station: null,
    reading: null,
    nearby: null,
    map: false,
    help: false,
    detail: null,
    notice: '',
    reducedMotion: false,
  });
  const [x, z] = WORLD.spawn;
  Object.assign(game.player, { x, z, y: heightAt(x, z), angle: WORLD.spawnAngle ?? Math.PI, speed: 0 });
  game.journey.points = [];
}
const idle = () => game.getState().phase === 'explore';
const rows = [];
for (const b of buildings) {
  reset();
  game.travel(b.id);
  const travel = run(idle);
  game.openBuilding(b.id);
  const enter = run(() => idle() && game.getState().interior === b.id);
  // Sortie depuis la station la plus éloignée de la porte.
  const far = narrative.stationsFor(b.id).reduce((a, s) => (s.position[1] < a.position[1] ? s : a));
  const p = narrative.stationApproach(far);
  Object.assign(game.player, { x: p[0], z: p[1], y: 0 });
  game.guideExit();
  const exit = run(() => idle() && !game.getState().interior);
  const show = TIMING ? TIMING.showcase + TIMING.showcaseReturn : cinema.compositions[b.id].duration + 1.6;
  rows.push({ lieu: b.id, trajet: travel, entrer: enter, sortir: exit, presentation: show });
}
await source.cleanup();
const f = (n) => (Number.isFinite(n) ? n.toFixed(2) + ' s' : 'bloqué');
console.log('| Lieu | Trajet depuis le départ | Entrer | Sortir (station la plus loin) | Présentation |');
console.log('| --- | ---: | ---: | ---: | ---: |');
for (const r of rows)
  console.log(`| ${r.lieu} | ${f(r.trajet)} | ${f(r.entrer)} | ${f(r.sortir)} | ${f(r.presentation)} |`);
const max = (k) => Math.max(...rows.map((r) => r[k]));
console.log(
  `| **maximum** | ${f(max('trajet'))} | ${f(max('entrer'))} | ${f(max('sortir'))} | ${f(max('presentation'))} |`,
);
