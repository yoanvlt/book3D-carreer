/**
 * Accès au contenu éditorial depuis l'interface et la scène.
 * Les fichiers de src/content/ sont lus et validés au build (voir vite.config.ts).
 */
import content from 'virtual:careerverse-content';
import type { BuildingId } from '../world/config';
import { stationAvailability } from '../world/narrative';
import type { PlaceContent, StationContent } from './schema';

export type { Block, Inline, Media, PlaceContent, SiteContent, StationContent } from './schema';

export const site = content.site;
const places = new Map(content.places.map((place) => [place.id, place]));

export function place(id: BuildingId): PlaceContent {
  return places.get(id)!;
}

/** Un lieu « vide » affiche un état sobre « Bientôt » au lieu de ses stations. */
export function isOpen(id: BuildingId): boolean {
  return place(id).statut !== 'vide';
}

/** Contenu de la station n° index (dans l'ordre des titres « ## »), ou null. */
export function stationContent(id: BuildingId, index: number): StationContent | null {
  return isOpen(id) ? (place(id).stations[index] ?? null) : null;
}

/** Contenu correspondant à un identifiant de station (step-0, step-1…). */
export function stationContentById(id: BuildingId, stationId: string | null): StationContent | null {
  if (!stationId) return null;
  return stationContent(id, Number(stationId.replace('step-', '')));
}

/** Adresse finale d'un média de public/medias/ ou d'une adresse externe. */
export function mediaUrl(address: string): string {
  return /^https?:/.test(address) ? address : import.meta.env.BASE_URL + address;
}

stationAvailability.test = (id, stationId) => stationContentById(id, stationId) !== null;
