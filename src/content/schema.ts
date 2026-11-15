/**
 * Schéma du contenu éditorial (src/content/).
 * Validé au build par le plugin Vite de vite.config.ts : une erreur arrête `npm run build` et `npm run dev`.
 * Ce module n'est jamais chargé par le navigateur ; seuls les types y sont importés.
 */
import { z } from 'zod';

export const BUILDING_IDS = ['profile', 'project-1', 'project-2', 'project-3', 'missions', 'veolia'] as const;
const STATUSES = ['vide', 'brouillon', 'publié'] as const;

/** Adresse web complète (https://…) ou fichier de public/medias/ (medias/…). */
const address = z
  .string()
  .trim()
  .refine((value) => /^https?:\/\/\S+$/.test(value) || /^medias\/[\w./-]+$/.test(value), {
    message: 'adresse attendue : https://… ou medias/nom-du-fichier',
  });

const linkSchema = z.object({
  texte: z.string().trim().min(1),
  url: address,
});

const mediaSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    src: address,
    alt: z.string().trim().min(1, 'une image doit avoir un texte alternatif : ![description](medias/…)'),
    legende: z.string().trim().optional(),
  }),
  z.object({ type: z.literal('video'), src: address, titre: z.string().trim().min(1) }),
  z.object({ type: z.literal('lien'), url: address, texte: z.string().trim().min(1) }),
]);

const inlineSchema = z.object({
  t: z.enum(['text', 'strong', 'em', 'link']),
  v: z.string(),
  href: z.string().optional(),
});
const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('p'), inline: z.array(inlineSchema) }),
  z.object({ type: z.literal('ul'), items: z.array(z.array(inlineSchema)) }),
]);

const stationSchema = z.object({
  titre: z.string().trim().min(1).max(60, 'titre de station trop long (60 caractères au plus)'),
  texte: z.array(blockSchema),
  medias: z.array(mediaSchema),
});

/** En-tête (frontmatter) d'un fichier src/content/batiments/*.md. */
export const placeFrontmatterSchema = z
  .object({
    id: z.enum(BUILDING_IDS),
    statut: z.enum(STATUSES),
    titre: z.string().trim().min(1).max(40),
    sous_titre: z.string().trim().min(1).max(60),
    enseigne: z.string().trim().min(1).max(24),
    resume: z.string().trim().max(400).default(''),
    tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
    liens: z.array(linkSchema).max(6).default([]),
  })
  .strict();

export const placeSchema = placeFrontmatterSchema.extend({
  stations: z.array(stationSchema),
  /** Vrai quand un brouillon est affiché (npm run dev). */
  apercu: z.boolean(),
});

/** En-tête de src/content/site.md. */
export const siteSchema = z
  .object({
    nom: z.string().trim().min(1),
    role: z.string().trim().min(1).max(80),
    accroche: z.string().trim().min(1).max(160),
    /** Fichier PDF dans public/medias/, ou vide. */
    cv: address.nullable().default(null),
    contact: z
      .object({
        email: z.string().trim().pipe(z.email()).nullable().default(null),
        linkedin: address.nullable().default(null),
        github: address.nullable().default(null),
      })
      .strict()
      // zod 4 : prefault fait passer {} par le schéma, pour obtenir les valeurs par défaut (null).
      .prefault({}),
  })
  .strict();

export const contentSchema = z.object({
  site: siteSchema,
  places: z.array(placeSchema).length(BUILDING_IDS.length),
});

export type Inline = z.infer<typeof inlineSchema>;
export type Block = z.infer<typeof blockSchema>;
export type Media = z.infer<typeof mediaSchema>;
export type StationContent = z.infer<typeof stationSchema>;
export type PlaceContent = z.infer<typeof placeSchema>;
export type SiteContent = z.infer<typeof siteSchema>;
export type Content = z.infer<typeof contentSchema>;
