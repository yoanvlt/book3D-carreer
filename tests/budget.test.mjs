// Budget de rendu (V6, inchangé en V7), vérifié sur les relevés des campagnes de capture versionnées
// (le décompte des draw calls et des triangles demande un vrai rendu WebGL, impossible sous Node).
// Après une modification de la scène, refaire les relevés :
//   npm run build && npm run preview
//   npm run capture -- scenes docs/screenshots/v7
//   QUALITE=low npm run capture -- scenes docs/screenshots/v7/legere
//   npm run capture:details -- docs/screenshots/v7/details
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export const BUDGET = {
  high: { drawCalls: 300, triangles: 700000 },
  low: { drawCalls: 180 },
};

const read = async (path) =>
  JSON.parse(await readFile(new URL(`../docs/screenshots/v7/${path}`, import.meta.url)));

test('Qualité Soignée : au plus 300 draw calls et 700 000 triangles par scène, aux quatre tailles', async () => {
  const report = await read('rapport-scenes.json');
  assert.equal(report.length, 4);
  for (const { taille, qualite, scenes, erreurs } of report) {
    assert.equal(qualite, 'high');
    assert.deepEqual(erreurs, [], `${taille} : console`);
    for (const [name, s] of Object.entries(scenes)) {
      assert.ok(
        s.drawCalls > 0 && s.drawCalls <= BUDGET.high.drawCalls,
        `${taille} ${name} : ${s.drawCalls} draw calls`,
      );
      assert.ok(s.triangles <= BUDGET.high.triangles, `${taille} ${name} : ${s.triangles} triangles`);
    }
  }
});

test('Qualité Légère : au plus 180 draw calls par scène, aux quatre tailles', async () => {
  const report = await read('legere/rapport-scenes.json');
  assert.equal(report.length, 4);
  for (const { taille, qualite, scenes, erreurs } of report) {
    assert.equal(qualite, 'low');
    assert.deepEqual(erreurs, [], `${taille} : console`);
    for (const [name, s] of Object.entries(scenes))
      assert.ok(
        s.drawCalls > 0 && s.drawCalls <= BUDGET.low.drawCalls,
        `${taille} ${name} : ${s.drawCalls} draw calls`,
      );
  }
});

test('Vues de détail (Soignée) : même budget, de l’accueil au pas de la porte et dans les six intérieurs', async () => {
  const report = await read('details/rapport-details.json');
  assert.deepEqual(report.erreurs, []);
  assert.ok(Object.keys(report.vues).length >= 31);
  for (const [name, s] of Object.entries(report.vues)) {
    assert.ok(s.drawCalls <= BUDGET.high.drawCalls, `${name} : ${s.drawCalls} draw calls`);
    assert.ok(s.triangles <= BUDGET.high.triangles, `${name} : ${s.triangles} triangles`);
  }
});
