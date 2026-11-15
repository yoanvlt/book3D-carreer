# CareerVerse — V6

Portfolio 3D de Yoan Viollet : une petite ville en React Three Fiber où chaque bâtiment raconte un projet. La V6 garde le jeu de la V5 (joystick, toucher pour aller, saut, passeport, visite guidée, son) et donne du détail à tout le monde :

- un kit de construction paramétrable (fenêtres, portes, façades, toitures, structures) et des matières procédurales calculées dans le shader, sans aucune texture ;
- six bâtiments qui racontent leur lieu : maison d'architecte, pavillon de verre, atelier à sheds, observatoire, galerie, station de traitement d'eau ;
- une île flottante à falaise de strates et cascades, des rues dallées, quatre essences d'arbres, du mobilier urbain ;
- six intérieurs différents : salon-bibliothèque, laboratoire, atelier, observatoire, galerie, salle de contrôle ;
- trois niveaux de lecture et un budget de rendu tenu : 300 draw calls au plus en qualité Soignée, 180 en Légère.

Suivi détaillé et vérifications : [V6_SUIVI.md](V6_SUIVI.md). Versions précédentes, briefs et cahier des charges : [docs/archives/](docs/archives/README.md). Ajouter un projet : [CONTENT.md](CONTENT.md).

## Installation et lancement

Node.js 22.12+ et npm :

```bash
npm ci
npm run dev
```

Ouvrir l’URL affichée par Vite, avec le chemin **/book3D-carreer/**. En développement, les bâtiments au statut `brouillon` sont visibles.

| Commande                                  | Rôle                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run typecheck`                       | TypeScript                                                                          |
| `npm run lint`                            | ESLint                                                                              |
| `npm run format` / `npm run format:check` | Prettier                                                                            |
| `npm run knip`                            | code mort : fichiers, exports et dépendances inutilisés                             |
| `npm test`                                | tests Node (monde, V3, contenu, V5, budget de rendu V6)                             |
| `npm run build` puis `npm run preview`    | build de production dans `dist/`                                                    |
| `npm run capture -- scenes <dossier>`     | captures aux quatre tailles (serveur `preview` lancé)                               |
| `npm run capture -- portes <dossier>`     | entrée, lecture d’une station et sortie des six bâtiments                           |
| `npm run capture:comparaisons`            | vues avant et après côte à côte (`docs/screenshots/v6/comparaisons/`)               |
| `npm run capture:details -- <dossier>`    | pour chaque bâtiment : vue d’accueil, façade, porte ; intérieurs ; dessous de l’île |
| `npm run capture:interface -- <dossier>`  | plan, aide, présentation, lecture, fiche mobile, version texte                      |
| `npm run capture:tactile -- <dossier>`    | parcours tactile 390×844 : joystick, saut, toucher pour aller                       |
| `npm run capture:visite -- <dossier>`     | visite guidée de bout en bout                                                       |
| `npm run capture:apercu`                  | image de partage `public/apercu.jpg` et icône Apple                                 |
| `npm run temps-morts`                     | durées de trajet, entrée, sortie et présentation (60 Hz)                            |
| `npm run sons`                            | régénère les sons (`public/sons/`, Python, numpy et ffmpeg)                         |

Les scripts de capture utilisent Playwright (déclaré en dépendance de développement) et le Chromium installé avec lui.

La base Vite `/book3D-carreer/` et le workflow GitHub Pages (`.github/workflows/deploy.yml`, déploiement depuis `main`) sont inchangés.

## Adresses utiles

| Adresse                        | Effet                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| `/book3D-carreer/`             | la ville 3D                                                           |
| `/book3D-carreer/?lecture`     | version texte du portfolio, générée depuis le même contenu            |
| `/book3D-carreer/?debug=1`     | relevé FPS, draw calls (ombres comprises), triangles, phase, position |
| `/book3D-carreer/?debug=1&kit` | planche du kit de construction et des matières                        |

## Commandes

| Action                                               | Commande               |
| ---------------------------------------------------- | ---------------------- |
| Marcher                                              | ZQSD, WASD ou flèches  |
| Courir                                               | Maj                    |
| Regarder                                             | cliquer-glisser        |
| Distance de la caméra                                | molette                |
| Présentation du bâtiment proche                      | V                      |
| Entrer, lire une station, sortir au seuil            | E                      |
| Plan                                                 | M                      |
| Recentrer la caméra                                  | C                      |
| Revenir sur la place ; dans un intérieur, sortir     | R                      |
| Fermer, terminer une présentation, annuler un trajet | Échap                  |
| Sauter                                               | Espace                 |
| Passer une séquence (trajet, porte, présentation)    | Espace, Entrée, clic   |
| Aller à un point                                     | clic ou toucher au sol |

Sur téléphone : joystick en bas à gauche, bouton de saut à droite, toucher le sol pour y aller, toucher un bâtiment pour s'y rendre. Le bouton son de l'en-tête active l'ambiance (coupée par défaut, choix mémorisé).

## Organisation

| Dossier ou fichier                                                          | Rôle                                                                                    |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/content/`                                                              | contenu éditorial : `site.md`, un fichier par bâtiment, schéma zod, lecture au build    |
| `src/design/tokens.ts`                                                      | couleurs, typographie, espacements, rayons, ombres, ciel et ambiances intérieures       |
| `src/state.ts`                                                              | phases exclusives et actions gardées (V3)                                               |
| `src/world/`                                                                | géométrie pure et testée : bâtiments, terrain, collisions, navigation, stations, caméra |
| `src/scene/Buildings.tsx`, `buildings/`, `kit/`                             | socle, porte et totem communs ; un fichier par bâtiment ; kit de construction           |
| `src/scene/Interior.tsx`, `interiors/`                                      | salle commune, stations, un fichier par intérieur                                       |
| `src/scene/Environment.tsx`, `Vegetation.tsx`, `Furniture.tsx`, `Plaza.tsx` | décor : végétation, mobilier urbain, place centrale                                     |
| `src/world/timing.ts`, `controls.ts`, `passport.ts`, `clouds.ts`            | durées, entrées, passeport, nuages (logique pure, testée)                               |
| `src/scene/Life.tsx`, `Sky.tsx`, `Effects.tsx`                              | vie du monde, nuages, contours (qualité Soignée, à la demande)                          |
| `src/scene/surface.ts`, `StaticBatch.tsx`                                   | matières procédurales ; regroupement des pièces, niveau de détail fin (Fine)            |
| `src/scene/Island.tsx`, `src/world/island.ts`                               | dessous de l’île : falaise, rochers, racines, cascades                                  |
| `src/scene/KitShowcase.tsx`                                                 | planche du kit (`?debug=1&kit`), pour le contrôle visuel                                |
| `src/audio/sound.ts`, `public/sons/`                                        | son (Web Audio), sons de synthèse sous CC0                                              |
| `src/scene/StaticBatch.tsx`                                                 | fusion des pièces statiques par finition (draw calls)                                   |
| `src/ui/`                                                                   | interface : en-tête, accueil, HUD, dialogues, version texte                             |
| `tests/`                                                                    | tests Node des vrais modules TypeScript, contenu d’essai dans `tests/fixtures/`         |
| `scripts/`                                                                  | captures Playwright de contrôle visuel                                                  |
| `docs/archives/`                                                            | suivis V3 à V5, briefs, cahier des charges                                              |
| `docs/screenshots/v6/`                                                      | captures de la version en cours (WebP), relevés de rendu                                |
