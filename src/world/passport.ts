/**
 * Passeport de visite : un tampon par lieu où le visiteur est entré, gardé dans le navigateur.
 * Toutes les lectures et écritures sont protégées (navigation privée, stockage bloqué) :
 * sans stockage, le passeport vaut pour la session.
 */
import { buildings, type BuildingId } from './config';

export const PASSPORT_KEY = 'careerverse.passeport';
const IDS = buildings.map((b) => b.id);

type Store = Pick<Storage, 'getItem' | 'setItem'> | null | undefined;
function defaultStore(): Store {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadStamps(store: Store = defaultStore()): BuildingId[] {
  try {
    const raw = JSON.parse(store?.getItem(PASSPORT_KEY) ?? '[]');
    return Array.isArray(raw) ? IDS.filter((id) => raw.includes(id)) : [];
  } catch {
    return [];
  }
}

export function saveStamps(stamps: BuildingId[], store: Store = defaultStore()): boolean {
  try {
    store?.setItem(PASSPORT_KEY, JSON.stringify(IDS.filter((id) => stamps.includes(id))));
    return !!store;
  } catch {
    return false;
  }
}

export const visitComplete = (stamps: BuildingId[]) => IDS.every((id) => stamps.includes(id));

export interface EndCardSite {
  cv: string | null;
  contact: { email: string | null; linkedin: string | null; github: string | null };
}
/** Carte de fin de visite : null tant que site.md n'a ni CV ni contact. */
export function endCard(site: EndCardSite) {
  const links = [
    site.contact.email && { label: site.contact.email, href: `mailto:${site.contact.email}` },
    site.contact.linkedin && { label: 'LinkedIn', href: site.contact.linkedin },
    site.contact.github && { label: 'GitHub', href: site.contact.github },
  ].filter(Boolean) as { label: string; href: string }[];
  if (!site.cv && !links.length) return null;
  return { cv: site.cv, links };
}
