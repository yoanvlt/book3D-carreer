# CareerVerse — V8

Portfolio 3D de Yoan Viollet : une petite ville en React Three Fiber où chaque bâtiment raconte un projet. La V8 reconstruit le monde sur une base pro, en style « diorama doux », et garde le jeu (clavier, joystick, toucher pour aller, saut, passeport, visite guidée, son, version texte, réduction des animations) :

- décor en kits 3D d'artiste sous licence CC0 (KayKit, Kay Lousberg), recolorés à une palette unique et compressés (179 Ko en tout) ;
- implantation sur une grille de 4 m : rues, trottoirs, place, parcelles ; un placeur à règles pose le décor, des tests vérifient ces règles ;
- six bâtiments sur mesure, une écriture architecturale chacun, une fiche par bâtiment (`docs/batiments/`) ;
- lumière précalculée une fois (ombres douces, occlusion), herbe vivante, personnages au travail, voitures et oiseaux ;
- le robot attend sur un îlot, vole jusqu'à la place et revient, filmé en travelling ; page de chargement dans la marque.

Suivi détaillé et vérifications : [V8_SUIVI.md](V8_SUIVI.md) (versions précédentes : [V7_SUIVI.md](V7_SUIVI.md), [V6_SUIVI.md](V6_SUIVI.md)). Licences des ressources tierces : [public/LICENCES.md](public/LICENCES.md). Versions précédentes, briefs et cahier des charges : [docs/archives/](docs/archives/README.md). Ajouter un projet : [CONTENT.md](CONTENT.md).

## Installation et lancement

Node.js 22.12+ et npm :

```bash
npm ci
npm run dev
```

Ouvrir l’URL affichée par Vite, avec le chemin **/book3D-carreer/**. En développement, les bâtiments au statut `brouillon` sont visibles.

| Commande                                  | Rôle                                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm run typecheck`                       | TypeScript                                                                                   |
| `npm run lint`                            | ESLint                                                                                       |
| `npm run format` / `npm run format:check` | Prettier                                                                                     |
| `npm run knip`                            | code mort : fichiers, exports et dépendances inutilisés                                      |
| `npm test`                                | tests Node (monde, contenu, V3, V5, grille et placeur, kits, vols, budget, emprises)         |
| `npm run build` puis `npm run preview`    | build de production dans `dist/`                                                             |
| `npm run capture -- scenes <dossier>`     | captures aux quatre tailles (serveur `preview` lancé)                                        |
| `npm run capture -- portes <dossier>`     | entrée, lecture d’une station et sortie des six bâtiments                                    |
| `npm run capture:comparaisons`            | vues avant et après côte à côte (deux dossiers de `capture:details`)                         |
| `npm run kits`                            | pipeline des kits : sources KayKit, recoloration, compression (`public/modeles/`, catalogue) |
| `npm run capture:da -- <dossier>`         | planche de direction artistique (`?debug=1&da`)                                              |
| `npm run capture:inspection -- <dossier>` | tour d'inspection : 8 angles par bâtiment, dessus et dessous de l'île, relevé des emprises   |
| `npm run capture:actions -- <dossier>`    | robot assis, robot qui salue, chaque personnage au travail                                   |
| `npm run capture:robot -- <dossier>`      | robot sur son îlot, vols d'entrée et de retour à 0, 20, 40, 60, 80 et 100 %                  |
| `npm run capture:chargement -- <dossier>` | page de chargement à quatre étapes                                                           |
| `npm run mesure:chargement -- [n]`        | première image, plus longue tâche (dont pendant le chargement), poids transféré              |
| `npm run capture:details -- <dossier>`    | pour chaque bâtiment : vue d’accueil, façade, porte ; intérieurs ; dessous de l’île          |
| `npm run capture:interface -- <dossier>`  | plan, aide, présentation, lecture, fiche mobile, version texte                               |
| `npm run capture:tactile -- <dossier>`    | parcours tactile 390×844 : joystick, saut, toucher pour aller                                |
| `npm run capture:visite -- <dossier>`     | visite guidée de bout en bout                                                                |
| `npm run capture:apercu`                  | image de partage `public/apercu.jpg` et icône Apple                                          |
| `npm run temps-morts`                     | durées de trajet, entrée, sortie, présentation et vols du robot (60 Hz)                      |
| `npm run sons`                            | régénère les sons (`public/sons/`, Python, numpy et ffmpeg)                                  |

Les scripts de capture utilisent Playwright (déclaré en dépendance de développement) et le Chromium installé avec lui.

La base Vite `/book3D-carreer/` et le workflow GitHub Pages (`.github/workflows/deploy.yml`, déploiement depuis `main`) sont inchangés.

## Adresses utiles

| Adresse                       | Effet                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ |
| `/book3D-carreer/`            | la ville 3D                                                              |
| `/book3D-carreer/?lecture`    | version texte du portfolio, générée depuis le même contenu               |
| `/book3D-carreer/?debug=1`    | relevé FPS, draw calls (ombres comprises), triangles, phase, position    |
| `/book3D-carreer/?debug=1&da` | planche de direction artistique (palette, matières, arbres, maison, rue) |

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

| Dossier ou fichier                                                | Rôle                                                                                                              |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/content/`                                                    | contenu éditorial : `site.md`, un fichier par bâtiment, schéma zod, lecture au build                              |
| `src/design/tokens.ts`                                            | couleurs, typographie, espacements, rayons, ombres, ciel et ambiances intérieures                                 |
| `src/state.ts`                                                    | phases exclusives et actions gardées (V3)                                                                         |
| `src/world/`                                                      | logique pure et testée : plan sur grille, placeur, palette, relief, collisions, navigation, stations, caméra, vol |
| `src/geometry/`                                                   | géométrie pure (worker) : formes chanfreinées, éléments d'architecture, six bâtiments, île, lumière précalculée   |
| `src/scene/Monde.tsx`, `diorama/`                                 | monde monté depuis le worker ; matière diorama, atlas, kits, eau                                                  |
| `src/scene/Herbe.tsx`, `Vie.tsx`, `Sky.tsx`, `Effects.tsx`        | herbe animée, personnages, voitures, oiseaux, nuages, effet miniature (Soignée)                                   |
| `src/scene/Robot.tsx`, `robot/`                                   | robot : marche, actions, îlot, vols ; modèle et effets                                                            |
| `src/scene/Interior.tsx`, `interiors/`                            | salle commune, stations, mobilier Furniture Bits par lieu                                                         |
| `public/modeles/`, `src/world/catalogue.json`, `scripts/kits.mjs` | modèles des kits compressés, leurs emprises, le pipeline qui les produit                                          |
| `src/audio/sound.ts`, `public/sons/`                              | son (Web Audio), sons de synthèse sous CC0                                                                        |
| `src/scene/StaticBatch.tsx`, `surface.ts`                         | coque des intérieurs : fusion des pièces par finition, matières procédurales                                      |
| `src/ui/`                                                         | interface : en-tête, accueil, HUD, dialogues, version texte                                                       |
| `tests/`                                                          | tests Node des vrais modules TypeScript, contenu d’essai dans `tests/fixtures/`                                   |
| `scripts/`                                                        | captures Playwright de contrôle visuel                                                                            |
| `docs/archives/`                                                  | suivis V3 à V5, briefs, cahier des charges                                                                        |
| `docs/batiments/`                                                 | fiches des six bâtiments (façades, coupe, matériaux, cotes, porte)                                                |
| `docs/screenshots/v8/`                                            | captures de la version en cours (WebP), relevés de rendu, tour d'inspection                                       |
