import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSource } from './load-source.mjs';

const source = await loadSource('content');
const { loadContent, ContentError, parseStations, parseInline } = await source.import('content/parse');
const { BUILDING_IDS } = await source.import('content/schema');
const content = fileURLToPath(new URL('../src/content', import.meta.url));
const fixture = fileURLToPath(new URL('./fixtures/contenu-essai', import.meta.url));
const publicDir = fileURLToPath(new URL('../public', import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), 'careerverse-content-'));
after(async () => {
  await source.cleanup();
  await rm(scratch, { recursive: true, force: true });
});

/** Copie le contenu d'essai et remplace un fichier de bâtiment. */
async function variant(name, file, text) {
  const dir = join(scratch, name);
  await cp(fixture, dir, { recursive: true });
  if (file) await writeFile(join(dir, 'batiments', file), text);
  return dir;
}
const header = (fields = {}) =>
  '---\n' +
  Object.entries({
    id: 'project-1',
    statut: 'publié',
    titre: 'Projet',
    sous_titre: 'Lieu',
    enseigne: 'P1',
    ...fields,
  })
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n') +
  '\n---\n';

test('Le contenu du dépôt est valide et décrit les six bâtiments', () => {
  const data = loadContent(content, { drafts: false, publicDir });
  assert.deepEqual(
    data.places.map((p) => p.id),
    [...BUILDING_IDS],
  );
  for (const place of data.places) assert.ok(['vide', 'publié'].includes(place.statut));
});

test('Un brouillon reste invisible hors développement', () => {
  const dev = loadContent(content, { drafts: true, publicDir });
  const prod = loadContent(content, { drafts: false, publicDir });
  for (const [i, place] of dev.places.entries()) {
    if (place.statut !== 'brouillon') continue;
    assert.equal(place.apercu, true);
    assert.equal(prod.places[i].statut, 'vide');
    assert.equal(prod.places[i].stations.length, 0);
    assert.equal(prod.places[i].resume, '');
  }
});

test('Le contenu d’essai remplit toutes les stations', () => {
  const data = loadContent(fixture, { drafts: false, publicDir });
  for (const place of data.places) {
    assert.equal(place.statut, 'publié');
    assert.equal(place.stations.length, place.id === 'profile' ? 4 : 8);
    assert.equal(place.stations[0].texte[1].type, 'ul');
  }
  assert.deepEqual(data.places[0].stations.at(-1).medias, [
    { type: 'lien', url: 'https://example.org', texte: 'Lien d’essai' },
  ]);
});

test('Markdown : paragraphes, listes, mise en forme et médias', () => {
  const [station] = parseStations(
    '## Titre\n\nUne **phrase** avec un [lien](https://a.fr)\net *suite*.\n\n- a\n- b\n\n![Une capture](https://a.fr/x.png "Légende")\n![Démo](medias/demo.mp4)\n',
    'essai.md',
  );
  assert.equal(station.titre, 'Titre');
  assert.deepEqual(
    station.texte[0].inline,
    parseInline('Une **phrase** avec un [lien](https://a.fr) et *suite*.'),
  );
  assert.deepEqual(
    station.texte[0].inline.map((i) => i.t),
    ['text', 'strong', 'text', 'link', 'text', 'em', 'text'],
  );
  assert.equal(station.texte[1].items.length, 2);
  assert.deepEqual(
    station.medias.map((m) => m.type),
    ['image', 'video'],
  );
  assert.equal(station.medias[0].legende, 'Légende');
});

test('Les erreurs de contenu arrêtent le build avec un message lisible', async () => {
  const cases = [
    ['texte avant titre', header() + 'Texte orphelin\n', /avant le premier titre/],
    ['titre de niveau 3', header() + '## A\n\n### B\n', /seuls les titres « ## »/],
    ['statut inconnu', header({ statut: 'fini' }) + '## A\n\nB\n', /statut/],
    ['champ inconnu', header({ couleur: 'rouge' }) + '## A\n\nB\n', /couleur|Unrecognized/],
    ['publié sans texte', header() + '## A\n', /au moins une station/],
    [
      'trop de stations',
      header() + Array.from({ length: 9 }, (_, i) => `## S${i}\n\nT\n`).join('\n'),
      /9 stations/,
    ],
    ['image sans texte alternatif', header() + '## A\n\nB\n\n![](https://a.fr/x.png)\n', /texte alternatif/],
    ['média absent', header() + '## A\n\nB\n\n![Plan](medias/absent.png)\n', /introuvable/],
    ['adresse invalide', header() + '## A\n\nB\n\n[Site](www.exemple.fr)\n', /adresse attendue/],
  ];
  for (const [name, text, pattern] of cases) {
    const dir = await variant(name.replace(/\W+/g, '-'), 'projet-1.md', text);
    assert.throws(
      () => loadContent(dir, { drafts: false, publicDir }),
      (error) => error instanceof ContentError && pattern.test(error.message),
      name,
    );
  }
  const missing = await variant('manquant');
  await rm(join(missing, 'batiments', 'veolia.md'));
  assert.throws(
    () => loadContent(missing, { drafts: false, publicDir }),
    /aucun fichier pour le bâtiment « veolia »/,
  );
  const empty = join(scratch, 'vide');
  await mkdir(empty);
  assert.throws(() => loadContent(empty, { drafts: false, publicDir }), /site\.md/);
});
