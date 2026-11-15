# CareerVerse — V5

Portfolio 3D de Yoan Viollet : une petite ville en React Three Fiber où chaque bâtiment raconte un projet. La V5 garde la structure de la V4 (contenu séparé du code, design tokens, tests, scripts de capture) et rend la visite agréable à jouer :

- jouable au clavier, à la souris et au doigt (joystick analogique, toucher le sol pour y aller, saut) ;
- temps morts réduits : trajet ≤ 6 s, entrée 1,8 s, sortie < 2 s, présentation 4 s, tout se passe d'un clic ;
- un monde vivant : nuages, fontaine, oiseaux, petits robots, feuillage, sons (coupés par défaut) ;
- un but : passeport de visite, visite guidée d'une minute, carte de fin.

Suivi détaillé et vérifications : [V5_SUIVI.md](V5_SUIVI.md) (V4 : [V4_SUIVI.md](V4_SUIVI.md)). Ajouter un projet : [CONTENT.md](CONTENT.md). Cahier des charges : [CareerVerse_Cahier_des_Charges_V4.md](CareerVerse_Cahier_des_Charges_V4.md).

## Installation et lancement

Node.js 22.12+ et npm :

```bash
npm ci
npm run dev
```

Ouvrir l’URL affichée par Vite, avec le chemin **/book3D-carreer/**. En développement, les bâtiments au statut `brouillon` sont visibles.

| Commande                                       | Rôle                                                           |
| ---------------------------------------------- | -------------------------------------------------------------- |
| `npm run typecheck`                            | TypeScript                                                     |
| `npm run lint`                                 | ESLint                                                         |
| `npm run format` / `npm run format:check`      | Prettier                                                       |
| `npm test`                                     | 50 tests (monde, V3, contenu, V5)                              |
| `npm run build` puis `npm run preview`         | build de production dans `dist/`                               |
| `npm run capture -- scenes <dossier>`          | captures aux quatre tailles (serveur `preview` lancé)          |
| `npm run capture -- portes <dossier>`          | entrée, lecture d’une station et sortie des six bâtiments      |
| `node scripts/capture-interface.mjs <dossier>` | plan, aide, présentation, lecture, fiche mobile, version texte |
| `node scripts/capture-tactile.mjs <dossier>`   | parcours tactile 390×844 : joystick, saut, toucher pour aller  |
| `node scripts/capture-visite.mjs <dossier>`    | visite guidée de bout en bout                                  |
| `node scripts/capture-apercu.mjs`              | image de partage `public/apercu.jpg` et icône Apple            |
| `node scripts/temps-morts.mjs`                 | durées de trajet, entrée, sortie et présentation (60 Hz)       |
| `python3 scripts/sons.py`                      | régénère les sons (`public/sons/`, numpy et ffmpeg)            |

La base Vite `/book3D-carreer/` et le workflow GitHub Pages (`.github/workflows/deploy.yml`, déploiement depuis `main`) sont inchangés.

## Adresses utiles

| Adresse                    | Effet                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| `/book3D-carreer/`         | la ville 3D                                                           |
| `/book3D-carreer/?lecture` | version texte du portfolio, générée depuis le même contenu            |
| `/book3D-carreer/?debug=1` | relevé FPS, draw calls (ombres comprises), triangles, phase, position |

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

| Dossier ou fichier                                               | Rôle                                                                                    |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/content/`                                                   | contenu éditorial : `site.md`, un fichier par bâtiment, schéma zod, lecture au build    |
| `src/design/tokens.ts`                                           | couleurs, typographie, espacements, rayons, ombres, ciel et ambiances intérieures       |
| `src/state.ts`                                                   | phases exclusives et actions gardées (V3)                                               |
| `src/world/`                                                     | géométrie pure et testée : bâtiments, terrain, collisions, navigation, stations, caméra |
| `src/scene/Buildings.tsx`, `kit.tsx`                             | six bâtiments et éléments d’architecture réutilisables                                  |
| `src/scene/Interior.tsx`                                         | intérieurs, mobilier et écrans des stations                                             |
| `src/scene/Environment.tsx`                                      | arbres (translucides quand ils gênent la vue), mobilier urbain, signalétique            |
| `src/world/timing.ts`, `controls.ts`, `passport.ts`, `clouds.ts` | durées, entrées, passeport, nuages (logique pure, testée)                               |
| `src/scene/Life.tsx`, `Sky.tsx`, `Effects.tsx`                   | vie du monde, nuages, contours (qualité Soignée, à la demande)                          |
| `src/audio/sound.ts`, `public/sons/`                             | son (Web Audio), sons de synthèse sous CC0                                              |
| `src/scene/StaticBatch.tsx`                                      | fusion des pièces statiques par finition (draw calls)                                   |
| `src/ui/`                                                        | interface : en-tête, accueil, HUD, dialogues, version texte                             |
| `tests/`                                                         | tests Node des vrais modules TypeScript, contenu d’essai dans `tests/fixtures/`         |
| `scripts/`                                                       | captures Playwright de contrôle visuel                                                  |
| `docs/screenshots/v4/`                                           | captures de la V4                                                                       |
| `docs/v4-brief/`                                                 | audit visuel et prototype de la direction A                                             |
