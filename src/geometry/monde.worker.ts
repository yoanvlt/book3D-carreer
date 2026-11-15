/**
 * Worker du monde (V8) : construit la géométrie et précalcule la lumière hors du fil principal,
 * puis renvoie les tableaux (transférés, sans copie). La page de chargement reste fluide.
 */
import { buildWorld, setSun, type Lit } from './monde';

self.onmessage = (event: MessageEvent<{ sun: [number, number, number] }>) => {
  setSun(event.data.sun);
  const world = buildWorld((step, fraction) => self.postMessage({ type: 'progress', step, fraction }));
  const transfer: Transferable[] = [];
  const add = (lit: Lit) => {
    const d = lit.data;
    transfer.push(d.positions.buffer, d.normals.buffer, d.uvs.buffer, d.indices.buffer, lit.light.buffer);
  };
  add(world.island);
  add(world.fountain);
  world.buildings.forEach(add);
  const t = world.terrain;
  transfer.push(
    t.positions.buffer,
    t.normals.buffer,
    t.uvs.buffer,
    t.indices.buffer,
    world.ground.data.buffer,
  );
  self.postMessage({ type: 'done', world }, { transfer });
};
