# CareerVerse V4 — suivi et vérifications

Date : 14 novembre 2026. Base : `main` au commit `037923e` (brief V4). Branches de travail : `feature/careerverse-v4` (demandée) et `claude/careerverse-v4-refactor-7f688a` (imposée par l'environnement de session), au même commit. Aucun merge dans `main`, aucun déploiement.

## Déroulé

| Phase | Commits              | Résumé                                                                                                                               |
| ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 0     | `37d09d3`            | Patch du prototype appliqué tel quel, polices installées, `?theme=a` comparé aux captures `a-*.jpg` (`docs/screenshots/v4/phase0/`). |
| 1     | `5a17f3a`            | Prettier et ESLint, `App.tsx` découpé, contenu dans `src/content/` validé au build, `CONTENT.md`.                                    |
| 2a    | `d9be3a1`            | Design tokens uniques, suppression des thèmes et des polices inutiles, nouvel accueil et HUD.                                        |
| 2b    | `236c3c9`            | Six bâtiments détaillés, mêmes silhouettes et collisions.                                                                            |
| 2c-2d | `f0d3d14`            | Panneaux 3D dans la police de l'interface, poteau indicateur, arbres translucides.                                                   |
| 2e    | `5cdfef3`            | Intérieurs : ambiance, mobilier, écrans lisibles, titre visible.                                                                     |
| 2f    | `e47859f`, `c698404` | Description de la page, bouton principal en grand texte (AA), README.                                                                |
| 3     | `74c5f85`            | Découpage du bundle, fusion par finition, relevé de draw calls complet, repli de qualité.                                            |

## Choix faits sans te consulter

Aucun n'est irréversible ; tous se changent en quelques lignes.

1. **Format du contenu : Markdown avec en-tête YAML**, un fichier par bâtiment. Chaque titre `##` est une station. J'ai choisi ce format parce qu'il s'écrit plus facilement que du JSON pour des textes longs. `zod` et `yaml` sont des dépendances de développement : ils tournent dans le plugin Vite au build et n'ajoutent aucun octet au site.
2. **Brouillons jamais publiés.** Un bâtiment `brouillon` est visible avec `npm run dev`, et n'apparaît pas dans `npm run build` sauf avec `CAREERVERSE_BROUILLONS=1`. Les quatre textes Profil de la V3 sont repris en `brouillon`, sans les phrases adressées au développeur. **En ligne, les six lieux affichent donc « Bientôt »** tant que tu ne passes pas un fichier à `publié`.
3. **Titres provisoires** : « Projet 1 », « Projet 2 », « Projet 3 », « Autres missions », « Profil », « Veolia ». Les noms de lieux V3 (« Le Pavillon de verre »…) sont devenus des sous-titres modifiables.
4. **Navigation rapide numérotée et compteur « 00 / 06 lieux découverts » retirés.** Le plan (bouton ou M) fait la même chose avec les noms des lieux. Le libellé « Vous explorez / La place des possibles » est retiré aussi (audit, ville n° 5).
5. **Aide clavier** affichée seulement avant le premier pas, puis remplacée par la carte du lieu proche.
6. **Version texte** (`?lecture`), générée depuis le contenu. Accessible depuis l'aide et quand WebGL ne démarre pas. CV et contact y apparaissent dès qu'ils sont renseignés dans `site.md`.
7. **Arrivée dans un intérieur** déplacée de z = 14 à z = 8,5 (`ROOM.arrival`). Depuis le seuil, la caméra ne pouvait se placer que devant le robot et montrait la porte de sortie ; elle voit maintenant la salle.
8. **Mobilier intérieur avec collisions** (`FURNITURE` dans `narrative.ts`), placé hors des points de départ testés. Les itinéraires vers les 44 stations restent valides.
9. **Écrans des stations masqués quand l'emplacement n'a pas de contenu** : un lieu « Bientôt » montre ses socles et objets, sans écran noir.
10. **Repli automatique en qualité Légère** quand la qualité Soignée reste sous 28 FPS pendant 4 s. Un message l'indique au visiteur. Le repli n'a pas lieu si le visiteur a choisi lui-même la qualité dans l'aide.
11. **Bouton principal à 19 px gras** : blanc sur orange vif fait 3,1:1, conforme AA uniquement en grand texte. Les autres boutons orange utilisent `accentStrong` (5,1:1).
12. **Caméra** : distance 21, élévation 0,56 et vue aérienne reprises du prototype.

### Tests modifiés

Le nombre passe de 32 à 37 ; aucun test V3 n'est supprimé ni désactivé.

- `world.test.mjs` charge les modules via `load-source.mjs`. Le test « stations futures » vérifiait `config.interior` (supprimé). Il vérifie maintenant le nombre d'emplacements par bâtiment : 4 pour Profil, 8 pour les autres.
- `v3.test.mjs` : la position d'arrivée attendue est `ROOM.arrival` au lieu de `[0, 14]` (choix 7).
- `content.test.mjs`, nouveau (5 tests) : contenu du dépôt valide, brouillon masqué hors développement, contenu d'essai complet, syntaxe Markdown, et 11 erreurs de contenu qui doivent arrêter le build avec un message lisible.

### Dépendances ajoutées

- Production : `@fontsource-variable/bricolage-grotesque` (police auto-hébergée, nécessaire avant le dessin des panneaux 3D).
- Développement uniquement : `prettier`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `globals`, `@types/node`, `zod`, `yaml`.
- Retirées : `@fontsource-variable/dm-sans`, `@fontsource-variable/manrope`, `@fontsource-variable/jetbrains-mono`, `@fontsource/instrument-serif`.

## Méthode de vérification

Navigateur : Chromium (Playwright) headless, WebGL rendu **par le processeur (SwiftShader)**. Les captures et les draw calls sont fiables. **Les FPS mesurés ici (1 à 12) ne disent rien d'un vrai GPU** et ne sont pas retenus.

Scripts versionnés, rejouables par toi :

- `npm run capture -- scenes <dossier>` : accueil, exploration, arrivée devant le Profil, intérieur du Profil, aux quatre tailles.
- `npm run capture -- portes <dossier>` : pour chaque bâtiment, trajet, entrée, déplacement vers la station 1, lecture, sortie.
- `node scripts/capture-interface.mjs <dossier>` : plan, aide, présentation, lecture, fiche mobile, version texte.

Les scripts pilotent l'application par les mêmes actions que l'interface (`window.__careerverse`, exposé seulement avec `?debug=1`), en mouvement réduit pour aller vite. Le contenu d'essai (`tests/fixtures/contenu-essai/`, construit avec `CAREERVERSE_CONTENU=…`) remplit toutes les stations. Il sert uniquement aux contrôles et n'est jamais publié.

## Vu à l'écran

### Captures (`docs/screenshots/v4/`)

| Scène                                          | 1920×1080                   | 1440×900                   | 1366×768                   | 390×844                   |
| ---------------------------------------------- | --------------------------- | -------------------------- | -------------------------- | ------------------------- |
| Accueil                                        | `accueil-1920x1080.png`     | `accueil-1440x900.png`     | `accueil-1366x768.png`     | `accueil-390x844.png`     |
| Exploration                                    | `exploration-1920x1080.png` | `exploration-1440x900.png` | `exploration-1366x768.png` | `exploration-390x844.png` |
| Devant un bâtiment                             | `porte-1920x1080.png`       | `porte-1440x900.png`       | `porte-1366x768.png`       | `porte-390x844.png`       |
| Intérieur (Profil, contenu réel : « Bientôt ») | `interieur-1920x1080.png`   | `interieur-1440x900.png`   | `interieur-1366x768.png`   | `interieur-390x844.png`   |

Compléments :

- `contenu-essai/` : les mêmes scènes en 1440×900 et 390×844 avec un contenu dans chaque station, plus `lecture-*.png` (station ouverte).
- `portes/` : intérieur et lecture d'une station pour chacun des six bâtiments, avec `rapport-portes.json`.
- `interface/` : plan, aide, présentation, lecture (bureau), plan et fiche (mobile), version texte (bureau et mobile).
- `phase0/` : prototype `?theme=a` avant les travaux.

### Résultats

- **Console** : aucune erreur ni exception sur l'ensemble des parcours, aux quatre tailles, en contenu réel comme en contenu d'essai (`erreurs` vides dans les rapports).
- **Six portes** : entrée, lecture d'une station et sortie réussies pour Profil, Projet 1, Projet 2, Projet 3, Autres missions et Veolia. Le robot ressort chaque fois sur le point d'arrivée extérieur du bâtiment (`portes/rapport-portes.json`).
- **Une station lue par bâtiment** : la station 1 de chaque lieu (contenu d'essai), avec texte, liste et gras rendus dans le dialogue.
- **Écrans des stations** : titre et première phrase lisibles depuis l'allée dans les six intérieurs (`portes/interieur-*.png`).
- **Arbre devant la porte du Profil** : translucide (`porte-*.png`) ; il masquait un tiers de l'écran avant.
- **Comparaison avec `a-*.jpg`** : même direction (ciel, herbe franche, allées claires, panneaux blancs arrondis, bouton orange en pilule). Les écarts sont voulus : bâtiments redessinés, plus de navigation numérotée ni de compteur, aide clavier contextuelle, intérieurs colorés au lieu du blanc et gris du prototype.

### Draw calls (`?debug=1`, 1440×900, toutes passes d'une image)

| Scène                           | V3 (passe principale seule) | V4 Soignée (avec ombres) | V4 Légère (sans ombres) |
| ------------------------------- | --------------------------: | -----------------------: | ----------------------: |
| Accueil                         |                         447 |                      211 |                     134 |
| Exploration                     |                           — |                      164 |                      88 |
| Devant le Profil                |                           — |                      169 |                      92 |
| Intérieur du Profil (vide)      |                           — |                       89 |                      46 |
| Intérieurs avec contenu d'essai |                           — |                        — |                 65 à 77 |

Avant la V4, `gl.info` était remis à zéro après la passe d'ombre : le relevé V3 ne comptait que la passe principale. Pour comparer à périmètre égal, la colonne Légère est la bonne (la passe principale y est seule) : 447 → 134 sur l'accueil, alors que les bâtiments ont bien plus de pièces. Triangles : environ 288 000 sur l'accueil en Soignée, 210 000 en Légère.

### Bundle (build de production)

| Fichier             |   Taille (gzip) | Chargé        |
| ------------------- | --------------: | ------------- |
| `index` (interface) |   38 ko (14 ko) | à l'ouverture |
| `react`             |  225 ko (70 ko) | à l'ouverture |
| `World` (scène)     |   68 ko (23 ko) | à la demande  |
| `r3f`               |  175 ko (55 ko) | à la demande  |
| `three`             | 722 ko (190 ko) | à la demande  |
| `drei`              |     2 ko (1 ko) | à la demande  |

En V3, l'interface (248 ko) et un chunk React incluant React Three Fiber (193 ko) étaient chargés ensemble. Maintenant `index.html` ne précharge plus que `react`.

### Points de l'audit

| Image     | N°  | Point                        | État                                                                         |
| --------- | --- | ---------------------------- | ---------------------------------------------------------------------------- |
| Accueil   | 1   | Libellé décoratif            | Retiré, vu                                                                   |
|           | 2   | Slogan                       | Nom, rôle, une phrase, vu                                                    |
|           | 3   | Pied de page de remplissage  | Retiré, vu                                                                   |
|           | 4   | « Le campus des possibles »  | Retiré, vu                                                                   |
|           | 5   | Île coupée                   | Entière à 1920, 1440 et 1366, vu                                             |
|           | 6   | Flèches ↗, étoile            | Retirées partout, vu                                                         |
|           | 7   | Boîtes primitives            | Bâtiments détaillés, vu                                                      |
|           | 8   | Fond beige sans ciel         | Ciel en dégradé et mer, vu                                                   |
| Ville     | 1   | Caméra basse                 | Distance 21, élévation 0,56, vu                                              |
|           | 2   | Panneaux en Arial flous      | Police de l'interface, texture filtrée, vu                                   |
|           | 3   | Aide en 9–10 px              | 14 px, une seule ligne, vu                                                   |
|           | 4   | Sol sans contraste           | Herbe, allées et bordures contrastées, vu                                    |
|           | 5   | Libellé et nom inventé       | Retirés, vu                                                                  |
| Porte     | 1   | Arbre qui masque             | Translucide, vu                                                              |
|           | 2   | Panneau « 01 Entrée » coupé  | Totem au nom du lieu, plus de navigation à droite, vu                        |
|           | 3   | Socle bleu nuit massif       | Rez-de-chaussée bleu vitré, socle ardoise clair, vu                          |
|           | 4   | Barres empilées              | Une seule carte d'action, vu                                                 |
| Intérieur | 1   | Titre derrière une poutre    | Titre à hauteur de regard, rien devant, vu                                   |
|           | 2   | Écrans illisibles            | Écrans agrandis, tournés vers l'allée, vu (contenu d'essai)                  |
|           | 3   | Libellé presque invisible    | Texte encre sur blanc, 14 px, vu                                             |
|           | 4   | Murs gris, plafond bleu nuit | Ambiance par lieu, éclairage d'appoint, vu                                   |
|           | 5   | Disques orange au sol        | Retirés, vu                                                                  |
|           | 6   | Salle presque vide           | Mobilier, tapis, suspensions ; la salle reste grande (dimensions V3 testées) |
| Mobile    | 1   | Bande sous l'en-tête         | Absente, vu                                                                  |
|           | 2   | Titre posé sur l'île         | Carte en bas d'écran, vu                                                     |
|           | 3   | Encadré crème parasite       | Retiré, vu                                                                   |
|           | 4   | Pied de page coupé           | Retiré, vu                                                                   |

Textes de l'interface : 13 px minimum ; contrastes calculés dans `tokens.ts` (encre sur blanc 14,5:1, texte secondaire 6,5:1).

## Non vérifié

- **FPS sur un vrai GPU**, et donc la fluidité de la qualité Légère sur un portable milieu de gamme. Le rendu logiciel de la session ne le permet pas. À relever avec `?debug=1`, en Soignée et en Légère.
- **Interactions manuelles** : marche au clavier, course, cliquer-glisser, molette, touches C, R, V et Échap pendant un trajet, clics répétés. Les scripts passent par les mêmes actions, mais pas par le clavier ni la souris réels. La logique reste couverte par les 32 tests V3.
- **Animations à vitesse réelle** : trajets, présentations de 7,5 à 9 s, descente de caméra, fondu de porte. Les captures sont prises en mouvement réduit. Seules les poses finales sont vues.
- **2560×1440**, prioritaire dans le cahier des charges : non capturé (absent de la liste du brief). Les règles CSS prévues au-delà de 2 200 px n'ont pas été vues à l'écran.
- **Navigateurs autres que Chromium** (Firefox, Safari) et tactile réel sur téléphone.
- **Lecteurs d'écran** : la structure (dialogues `aria-modal`, annonces `aria-live`, focus) est en place mais n'a pas été écoutée.
- **Brouillon avec `npm run dev`** : le chargement par le plugin et le masquage en production sont testés, mais le rendu en développement (mention « brouillon ») n'a pas été capturé.
- **Ambiances des intérieurs** : jugées sur captures, pas en déplacement.

## Reste à faire

1. Écrire le contenu : un fichier par bâtiment dans `src/content/batiments/`, puis `statut: publié` (voir `CONTENT.md`).
2. Renseigner CV et contact dans `src/content/site.md`.
3. Relever les FPS sur ton portable en Soignée et en Légère, et ajuster le seuil de repli si besoin.
4. Faire une passe manuelle complète au clavier et à la souris, puis valider la direction artistique.
5. Capturer en 2560×1440 si tu veux valider le QHD.
6. Merger `feature/careerverse-v4` dans `main` pour déployer, quand tu l'auras validée.
