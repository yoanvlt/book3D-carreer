// Pipeline des kits 3D (V8) : KayKit City Builder Bits, Medieval Hexagon Pack (nature) et
// Furniture Bits, de Kay Lousberg, sous licence CC0 (public/LICENCES.md).
//   npm run kits
// 1. Sources : .cache/kaykit/<dépôt>, clonées depuis GitHub si absentes.
// 2. Seuls les modèles listés ci-dessous (ceux que le site utilise) sont gardés.
// 3. Recoloration : la couleur de l'atlas d'origine sous chaque sommet est remplacée par la case
//    la plus proche de la palette « diorama doux » (src/world/palette.ts), adoucie (saturation
//    réduite, clarté remontée) ; la position dans le dégradé de la case est gardée. Aucune texture
//    n'est exportée : l'atlas est généré au chargement à partir de la palette.
// 4. Chaque modèle devient un seul maillage (primitives fusionnées, nœuds aplatis), à l'échelle
//    du site (mètres), puis soudure, quantification et compression meshopt.
// 5. Sorties : public/modeles/ville.glb (monde), public/modeles/meubles.glb (intérieurs, chargés à
//    la demande) et src/world/catalogue.json (emprise de chaque modèle, pour le placeur).
// Les répétitions (arbres, lampadaires, bancs…) sont instanciées au rendu (InstancedMesh) : le GLB
// ne contient qu'un exemplaire de chaque modèle.
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NodeIO, Document } from '@gltf-transform/core';
import { EXTMeshoptCompression, KHRMeshQuantization } from '@gltf-transform/extensions';
import { weld, quantize, meshopt, prune, dedup } from '@gltf-transform/functions';
import { MeshoptEncoder } from 'meshoptimizer';
import { PNG } from 'pngjs';
import { loadSource } from '../tests/load-source.mjs';

const ROOT = '.cache/kaykit';
const PACKS = {
  city: {
    repo: 'KayKit-City-Builder-Bits-1.0',
    dir: 'addons/kaykit_city_builder_bits/Assets/gltf',
    atlas: 'citybits_texture.png',
    scale: 4,
  },
  nature: {
    repo: 'KayKit-Medieval-Hexagon-Pack-1.0',
    dir: 'addons/kaykit_medieval_hexagon_pack/Assets/gltf/decoration/nature',
    atlas: 'hexagons_medieval.png',
    scale: 4,
    sparse: true,
  },
  furniture: {
    repo: 'KayKit-Furniture-Bits-1.0',
    dir: 'addons/kaykit_furniture_bits/Assets/gltf',
    atlas: 'furniturebits_texture.png',
    scale: 1,
  },
};

/** Modèles gardés : [pack, nom d'origine, nom dans le site]. */
const WORLD_MODELS = [
  ['city', 'road_straight', 'route'],
  ['city', 'road_straight_crossing', 'route-passage'],
  ['city', 'road_corner_curved', 'route-courbe'],
  ['city', 'base', 'dalle', { grey: ['bordure', 'dalle'] }],
  ['city', 'streetlight', 'lampadaire', { grey: ['metal-sombre', 'gris-fonce'] }],
  ['city', 'bench', 'banc', { grey: ['metal-sombre', 'gris-fonce'] }],
  ['city', 'bush', 'buisson', { wood: ['terre-cuite-profonde', 'terre-cuite'] }],
  ['city', 'car_sedan', 'voiture', { blue: ['carrosserie-bleue'] }],
  ['city', 'car_hatchback', 'citadine', { red: ['carrosserie-rouge'] }],
  ['city', 'dumpster', 'benne', { green: ['carrosserie-verte'] }],
  ['city', 'firehydrant', 'borne-incendie', { red: ['carrosserie-rouge'] }],
  ['city', 'trash_A', 'corbeille', { wood: ['gris-fonce'] }],
  ['city', 'box_A', 'caisse'],
  ['nature', 'tree_single_A', 'pin', { wood: ['tronc'], green: ['feuillage', 'feuillage-clair'] }],
  ['nature', 'tree_single_B', 'sapin', { wood: ['tronc'], green: ['feuillage', 'feuillage-clair'] }],
  ['nature', 'rock_single_A', 'rocher-a', { grey: ['roche-profonde', 'roche', 'roche-claire'] }],
  ['nature', 'rock_single_C', 'rocher-c', { grey: ['roche-profonde', 'roche', 'roche-claire'] }],
  ['nature', 'rock_single_E', 'rocher-e', { grey: ['roche-profonde', 'roche', 'roche-claire'] }],
];
const FURNITURE_MODELS = [
  'armchair',
  'couch_pillows',
  'book_set',
  'cabinet_medium_decorated',
  'cabinet_small',
  'cactus_medium_A',
  'cactus_small_A',
  'chair_C',
  'chair_stool',
  'lamp_standing',
  'lamp_table',
  'pictureframe_large_A',
  'pictureframe_large_B',
  'pictureframe_medium',
  'pictureframe_standing_A',
  'rug_oval_A',
  'rug_rectangle_stripes_A',
  'shelf_B_large_decorated',
  'shelf_B_small_decorated',
  'table_low',
  'table_medium_long',
  'table_small',
].map((name) => [
  'furniture',
  name,
  name.replaceAll('_', '-').toLowerCase(),
  // Tissus : bleu et jaune KayKit vers les tissus adoucis de la palette.
  { blue: ['tissu-bleu'], yellow: ['tissu-ocre'], red: ['tissu-rouge'] },
]);

/**
 * Familles de couleurs des kits et gamme de la palette pour chacune, du plus sombre au plus clair :
 * la clarté d'origine choisit la case dans la gamme. Un modèle peut remplacer une gamme (rochers,
 * métal, carrosseries…). Les accents des six lieux ne sont jamais utilisés par les kits.
 */
const RAMPS = {
  dark: ['encre', 'gris-fonce'],
  grey: ['enrobe', 'enrobe-clair', 'beton-profond', 'beton'],
  white: ['marquage'],
  green: ['feuillage-profond', 'feuillage', 'feuillage-clair'],
  wood: ['bois-profond', 'bois', 'bois-clair'],
  red: ['tissu-rouge'],
  yellow: ['marquage-ocre'],
  beige: ['bois-clair', 'creme'],
  blue: ['verre-profond', 'verre'],
  other: [],
};

/** Famille d'une couleur d'origine (sRGB 0-255), d'après sa teinte, sa saturation et sa clarté. */
function family([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 510;
  const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  if (max < 72) return 'dark';
  if (sat < 0.22) return l > 0.8 ? 'white' : 'grey';
  const h =
    max === r
      ? ((g - b) / (max - min) + 6) % 6
      : max === g
        ? (b - r) / (max - min) + 2
        : (r - g) / (max - min) + 4;
  const hue = h * 60;
  if (hue >= 90 && hue < 190) return 'green';
  if (hue >= 190 && hue < 260) return 'blue';
  if ((hue < 12 || hue >= 330) && sat > 0.55 && g < 70) return 'red';
  if (hue < 15 || hue >= 330) return 'wood';
  if (hue < 38) return l > 0.62 ? 'beige' : 'wood';
  if (hue < 62) return 'yellow';
  return 'other';
}

/** Plage de luminance d'origine couverte par la gamme de chaque famille. */
const RANGE = { grey: [0.33, 0.62], green: [0.3, 0.52], wood: [0.3, 0.62], beige: [0.6, 0.85] };

/** Case de la palette pour une couleur d'origine : gamme de sa famille, ou case la plus proche. */
function swatchFor(rgb, ramps) {
  const name = family(rgb);
  const ramp = ramps[name];
  if (!ramp?.length) return palette.nearestSwatch(rgb.map((v) => v / 255));
  const y = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const [lo, hi] = RANGE[name] ?? [0.2, 0.8];
  const t = Math.max(0, Math.min(0.999, (y - lo) / (hi - lo)));
  return palette.swatchIndex(ramp[Math.floor(t * ramp.length)]);
}

function ensureSources() {
  for (const pack of Object.values(PACKS)) {
    const path = `${ROOT}/${pack.repo}`;
    if (existsSync(path)) continue;
    mkdirSync(ROOT, { recursive: true });
    const url = `https://github.com/KayKit-Game-Assets/${pack.repo}.git`;
    const sparse = pack.sparse ? ['--filter=blob:none', '--sparse'] : [];
    execFileSync('git', ['clone', '--depth', '1', ...sparse, url, path], { stdio: 'inherit' });
    if (pack.sparse)
      execFileSync('git', ['-C', path, 'sparse-checkout', 'set', pack.dir], { stdio: 'inherit' });
  }
}

const source = await loadSource('kits');
const palette = await source.import('world/palette');
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions([EXTMeshoptCompression, KHRMeshQuantization])
  .registerDependencies({
    'meshopt.encoder': MeshoptEncoder,
  });

ensureSources();
const atlases = {};
function atlasOf(pack) {
  if (!atlases[pack]) {
    const p = PACKS[pack];
    atlases[pack] = PNG.sync.read(readFileSync(`${ROOT}/${p.repo}/${p.dir}/${p.atlas}`));
  }
  return atlases[pack];
}

/** Lit un modèle, l'aplatit en un seul jeu de sommets recolorés, à l'échelle du site. */
async function bake(pack, name, ramps) {
  const p = PACKS[pack];
  const doc = await io.read(`${ROOT}/${p.repo}/${p.dir}/${name}.gltf`);
  const atlas = atlasOf(pack);
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  const used = new Set();
  for (const node of doc.getRoot().listNodes()) {
    const mesh = node.getMesh();
    if (!mesh) continue;
    const m = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      const pos = prim.getAttribute('POSITION');
      const nor = prim.getAttribute('NORMAL');
      const tex = prim.getAttribute('TEXCOORD_0');
      const base = positions.length / 3;
      const v = [0, 0, 0];
      for (let i = 0; i < pos.getCount(); i++) {
        pos.getElement(i, v);
        positions.push(
          (m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12]) * p.scale,
          (m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13]) * p.scale,
          (m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]) * p.scale,
        );
        nor.getElement(i, v);
        const n = [
          m[0] * v[0] + m[4] * v[1] + m[8] * v[2],
          m[1] * v[0] + m[5] * v[1] + m[9] * v[2],
          m[2] * v[0] + m[6] * v[1] + m[10] * v[2],
        ];
        const l = Math.hypot(...n) || 1;
        normals.push(n[0] / l, n[1] / l, n[2] / l);
        const uv = [0, 0];
        tex.getElement(i, uv);
        const x = Math.min(atlas.width - 1, Math.max(0, Math.floor(uv[0] * atlas.width)));
        const y = Math.min(atlas.height - 1, Math.max(0, Math.floor(uv[1] * atlas.height)));
        const o = (y * atlas.width + x) * 4;
        const swatch = swatchFor([atlas.data[o], atlas.data[o + 1], atlas.data[o + 2]], ramps);
        used.add(palette.SWATCHES[swatch][0]);
        // Position dans le dégradé : les atlas KayKit ont 4 bandes de dégradés verticaux.
        const shade = (((uv[1] * 4) % 1) + 1) % 1;
        uvs.push(...palette.swatchUV(swatch, 0.15 + shade * 0.7));
      }
      const idx = prim.getIndices();
      const count = idx ? idx.getCount() : pos.getCount();
      for (let i = 0; i < count; i++) indices.push(base + (idx ? idx.getScalar(i) : i));
    }
  }
  return { positions, normals, uvs, indices, used };
}

async function build(models, file) {
  const out = new Document();
  const buffer = out.createBuffer();
  const material = out.createMaterial('diorama').setRoughnessFactor(1).setMetallicFactor(0);
  const scene = out.createScene('kits');
  const catalogue = {};
  for (const [pack, name, id, ramps = {}] of models) {
    const b = await bake(pack, name, { ...RAMPS, ...ramps });
    const prim = out
      .createPrimitive()
      .setMaterial(material)
      .setAttribute(
        'POSITION',
        out.createAccessor().setType('VEC3').setArray(new Float32Array(b.positions)).setBuffer(buffer),
      )
      .setAttribute(
        'NORMAL',
        out.createAccessor().setType('VEC3').setArray(new Float32Array(b.normals)).setBuffer(buffer),
      )
      .setAttribute(
        'TEXCOORD_0',
        out.createAccessor().setType('VEC2').setArray(new Float32Array(b.uvs)).setBuffer(buffer),
      )
      .setIndices(
        out.createAccessor().setType('SCALAR').setArray(new Uint32Array(b.indices)).setBuffer(buffer),
      );
    scene.addChild(out.createNode(id).setMesh(out.createMesh(id).addPrimitive(prim)));
    const min = [0, 1, 2].map((k) => Math.min(...b.positions.filter((_, i) => i % 3 === k)));
    const max = [0, 1, 2].map((k) => Math.max(...b.positions.filter((_, i) => i % 3 === k)));
    catalogue[id] = {
      min: min.map((v) => +v.toFixed(3)),
      max: max.map((v) => +v.toFixed(3)),
      triangles: b.indices.length / 3,
      cases: [...b.used].sort(),
    };
  }
  await out.transform(
    dedup(),
    weld(),
    prune({ keepAttributes: true }),
    quantize({ quantizeNormal: 8, quantizeTexcoord: 12 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  );
  mkdirSync('public/modeles', { recursive: true });
  await io.write(file, out);
  console.log(`${file} : ${models.length} modèles, ${(statSync(file).size / 1024).toFixed(1)} Ko`);
  return catalogue;
}

const world = await build(WORLD_MODELS, 'public/modeles/ville.glb');
const furniture = await build(FURNITURE_MODELS, 'public/modeles/meubles.glb');
writeFileSync(
  'src/world/catalogue.json',
  JSON.stringify({ ville: world, meubles: furniture }, null, 1) + '\n',
);
await source.cleanup();
