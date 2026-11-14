/**
 * Lecture et validation du contenu, exécutées dans Node (plugin Vite et tests), jamais dans le navigateur.
 * Format d'un fichier : voir CONTENT.md à la racine du dépôt.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ZodError } from 'zod';
import { stationsFor } from '../world/narrative';
import {
  BUILDING_IDS,
  contentSchema,
  placeFrontmatterSchema,
  placeSchema,
  siteSchema,
  type Content,
  type Inline,
  type Media,
  type PlaceContent,
  type StationContent,
} from './schema';

export class ContentError extends Error {
  constructor(
    readonly file: string,
    readonly problems: string[],
  ) {
    super(`Contenu invalide dans ${file} :\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}

export interface LoadOptions {
  /** Afficher les bâtiments au statut « brouillon » (npm run dev). */
  drafts: boolean;
  /** Dossier public/ du site, pour vérifier que les médias existent. */
  publicDir?: string;
}

function describe(error: unknown): string[] {
  if (error instanceof ZodError)
    return error.issues.map((issue) => `${issue.path.join('.') || 'en-tête'} : ${issue.message}`);
  return [error instanceof Error ? error.message : String(error)];
}

function splitFrontmatter(source: string, file: string) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(source);
  if (!match)
    throw new ContentError(file, ['le fichier doit commencer par un en-tête entre deux lignes ---']);
  let data: unknown;
  try {
    data = parseYaml(match[1]) ?? {};
  } catch (error) {
    throw new ContentError(file, [`en-tête YAML illisible : ${describe(error)[0]}`]);
  }
  return { data, body: match[2] };
}

/** Gras, italique et liens dans une ligne de texte. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;
  let last = 0;
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index > last) out.push({ t: 'text', v: text.slice(last, match.index) });
    if (match[1] !== undefined) out.push({ t: 'link', v: match[1], href: match[2] });
    else if (match[3] !== undefined) out.push({ t: 'strong', v: match[3] });
    else out.push({ t: 'em', v: match[4] ?? match[5] });
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

const VIDEO = /\.(mp4|webm|mov)$/i;

/** Corps Markdown → stations. Chaque titre « ## » ouvre une station. */
export function parseStations(body: string, file: string): StationContent[] {
  const problems: string[] = [];
  const stations: StationContent[] = [];
  const lines = body.replace(/<!--[\s\S]*?-->/g, '').split(/\r?\n/);
  let current: StationContent | null = null;
  let paragraph: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!current) return;
    if (paragraph.length) current.texte.push({ type: 'p', inline: parseInline(paragraph.join(' ')) });
    if (list.length) current.texte.push({ type: 'ul', items: list.map(parseInline) });
    paragraph = [];
    list = [];
  };
  lines.forEach((raw, index) => {
    const line = raw.trim();
    const where = `ligne ${index + 1}`;
    if (/^##\s+/.test(line)) {
      flush();
      current = { titre: line.replace(/^##\s+/, ''), texte: [], medias: [] };
      stations.push(current);
      return;
    }
    if (/^#/.test(line)) {
      problems.push(`${where} : seuls les titres « ## » sont acceptés (un titre = une station)`);
      return;
    }
    if (!line) {
      flush();
      return;
    }
    if (!current) {
      problems.push(`${where} : texte placé avant le premier titre « ## »`);
      return;
    }
    const image = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(line);
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(line);
    if (image || link) {
      flush();
      const media: Media = image
        ? VIDEO.test(image[2])
          ? { type: 'video', src: image[2], titre: image[1] }
          : { type: 'image', src: image[2], alt: image[1], legende: image[3] }
        : { type: 'lien', url: link![2], texte: link![1] };
      (current as StationContent).medias.push(media);
      return;
    }
    if (/^[-*]\s+/.test(line)) {
      if (paragraph.length) flush();
      list.push(line.replace(/^[-*]\s+/, ''));
      return;
    }
    if (list.length) flush();
    paragraph.push(line);
  });
  flush();
  if (problems.length) throw new ContentError(file, problems);
  return stations;
}

function checkMedia(place: PlaceContent, publicDir: string | undefined, file: string) {
  if (!publicDir) return;
  const missing: string[] = [];
  const check = (address: string) => {
    if (address.startsWith('medias/') && !existsSync(join(publicDir, address)))
      missing.push(`fichier introuvable : public/${address}`);
  };
  for (const link of place.liens) check(link.url);
  for (const station of place.stations)
    for (const media of station.medias) check(media.type === 'lien' ? media.url : media.src);
  if (missing.length) throw new ContentError(file, missing);
}

function loadPlace(path: string, root: string, options: LoadOptions): PlaceContent {
  const file = relative(root, path);
  const { data, body } = splitFrontmatter(readFileSync(path, 'utf8'), file);
  let head;
  try {
    head = placeFrontmatterSchema.parse(data);
  } catch (error) {
    throw new ContentError(file, describe(error));
  }
  const stations = parseStations(body, file);
  const slots = stationsFor(head.id).length;
  if (stations.length > slots)
    throw new ContentError(file, [`${stations.length} stations écrites, ce bâtiment en accueille ${slots}`]);
  if (head.statut === 'publié' && !stations.some((s) => s.texte.length || s.medias.length))
    throw new ContentError(file, ['un bâtiment « publié » doit avoir au moins une station avec du texte']);
  const visible = head.statut === 'publié' || (head.statut === 'brouillon' && options.drafts);
  const place: PlaceContent = visible
    ? { ...head, stations, apercu: head.statut === 'brouillon' }
    : // Un brouillon n'est jamais publié : seul le nom du lieu reste visible.
      { ...head, statut: 'vide', resume: '', tags: [], liens: [], stations: [], apercu: false };
  try {
    placeSchema.parse(place);
  } catch (error) {
    throw new ContentError(file, describe(error));
  }
  checkMedia(place, options.publicDir, file);
  return place;
}

/** Lit src/content (ou un autre dossier), valide tout et renvoie un objet sérialisable. */
export function loadContent(root: string, options: LoadOptions): Content {
  const siteFile = join(root, 'site.md');
  if (!existsSync(siteFile)) throw new ContentError('site.md', ['fichier manquant']);
  const { data } = splitFrontmatter(readFileSync(siteFile, 'utf8'), 'site.md');
  let site;
  try {
    site = siteSchema.parse(data);
  } catch (error) {
    throw new ContentError('site.md', describe(error));
  }
  const folder = join(root, 'batiments');
  const files = existsSync(folder) ? readdirSync(folder).filter((name) => name.endsWith('.md')) : [];
  const places = files.map((name) => loadPlace(join(folder, name), root, options));
  const ids = places.map((p) => p.id);
  const problems = [
    ...BUILDING_IDS.filter((id) => !ids.includes(id)).map((id) => `aucun fichier pour le bâtiment « ${id} »`),
    ...ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `bâtiment « ${id} » décrit deux fois`),
  ];
  if (problems.length) throw new ContentError('batiments/', problems);
  places.sort((a, b) => BUILDING_IDS.indexOf(a.id) - BUILDING_IDS.indexOf(b.id));
  if (site.cv?.startsWith('medias/') && options.publicDir && !existsSync(join(options.publicDir, site.cv)))
    throw new ContentError('site.md', [`fichier introuvable : public/${site.cv}`]);
  return contentSchema.parse({ site, places });
}
