/**
 * Kit de construction : pièces paramétrables partagées par les bâtiments, le décor et les intérieurs.
 * Toutes sont faites de primitives (Primitives.tsx) : elles se regroupent avec StaticBatch, et
 * leurs petits détails (Fine) disparaissent de loin et en qualité Légère.
 *
 * Trois niveaux de lecture : la silhouette (volumes, toitures) depuis l'accueil ; les matières et le
 * rythme des façades (fenêtres, bandeaux, bardages) depuis l'allée ; les petits détails (poignées,
 * colliers, barreaux, fleurs) devant une porte.
 */
export * from './openings';
export * from './facade';
export * from './structures';
export * from './roofs';
export * from './props';
