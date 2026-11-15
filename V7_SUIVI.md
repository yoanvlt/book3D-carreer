# CareerVerse V7 — suivi et vérifications

Date : 15 novembre 2026. Base : `main` au commit `8f5d96c` (V6 en ligne). Travail fait **directement sur `main`**, à ta demande, en petits commits poussés un par un (le site se republie à chaque poussée ; les tests passent avant chaque poussée). Le contenu reste vide.

Les quatre anciennes branches (`claude/careerverse-v4-refactor-7f688a` et les trois autres déjà fusionnées) **n'ont pas pu être supprimées** : le proxy git de la session refuse la suppression de branches distantes. À supprimer depuis GitHub (onglet _Branches_, icône corbeille) ; elles sont toutes fusionnées, rien ne se perd.

## Déroulé

| Phase                 | Commits                                                          | Résumé                                                                                                      |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1. Outil de contrôle  | `55261c1`, `080e835`                                             | Tour d'inspection (8 angles par bâtiment, vue de dessus), relevé des emprises, tests de cohérence du décor. |
| 2. Incohérences       | `9054152` → `d5756b7`                                            | Décor, portes encastrées, un commit par bâtiment, sol.                                                      |
| 3. Détail             | `3f78da9` (et les commits de la phase 2, qui refont les façades) | Parvis, pieds d'arbres, massifs, arbres d'alignement ; appareils, linteaux, arrières.                       |
| 4. Page de chargement | `9f287d2`, `768a615`                                             | Écran statique en CSS, étapes réelles, construction par tranches compilées.                                 |
| 5. Robot              | `299b497`, `d625cc2`, `ca07bd5`                                  | Vol stationnaire à l'accueil, vols d'entrée et de retour, caméra en poursuite.                              |
| Vérification          | voir l'historique                                                | Campagne de captures V7, budget, ce document ; captures V6 retirées.                                        |

## Phase 1 — Outil de contrôle

- **Tour d'inspection** (`npm run capture:inspection -- <dossier>`) : pour chaque bâtiment, 8 vues en orbite tous les 45° à partir de la porte (avant, trois-quarts, côtés, arrière), alternativement à hauteur d'œil (1,8 m) et en plongée ; une planche 4×2 par bâtiment, plus une vue de dessus de l'île. Le mode photo de `?debug=1` fixe la caméra, l'interface est masquée.
- **Relevé des emprises** : l'emprise réelle de chaque bâtiment est mesurée sur la géométrie rendue (union des boîtes des maillages, dans le repère du bâtiment) et comparée à l'emprise prévue (`config.ts`). Test : `tests/emprises.test.mjs` (tolérance d'un auvent : 1,2 m sur les côtés et l'arrière, 3 m à l'avant).
- **Tests de cohérence du décor** (`tests/coherence.test.mjs`, sans navigateur) : aucun objet sur une chaussée, une allée ou la place sans y être destiné (bancs, lampadaires, poubelles, haies, arbres, bornes…) ; plaques d'égout entières sur la chaussée d'une rue (6 au plus) ; rien hors du terrain ni à plus de 5 cm au-dessus du sol. Le tracé des rues est partagé entre le rendu et les tests (`src/world/roads.ts`).
- **Référence « avant »** : le tour a été lancé sur la V6 (`docs/screenshots/v7/inspection/avant/`).

## Phase 2 — Incohérences trouvées et corrigées

Les points de ta liste, puis ceux que le tour et les tests ont trouvés en plus.

| Où         | Incohérence (V6)                                                                                                                                     | Correction (V7)                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Veolia     | Cuves posées sur rien, entrée et marquise plaquées, deux enseignes                                                                                   | Cuves sur socle dans une cour de service, raccordées au bâtiment (tuyaux, vanne), passerelle et échelles à crinoline ; hall d'entrée intégré ; une enseigne.      |
| Veolia     | Arrière nu                                                                                                                                           | Porte de service, rideau métallique, local poubelles, ventilations, groupe froid.                                                                                 |
| Projet 1   | Toit qui débordait, contreventement orange qui traversait dalles et vitrages                                                                         | Auvent limité aux façades ; contreventement dans un plan extérieur, hors des dalles ; escalier de secours et accès de service à l'arrière.                        |
| Projet 3   | Fenêtres plates sur un tambour cylindrique                                                                                                           | Fenêtres courbes (segments de cylindre : vitre, traverses, appuis) sur les deux tambours.                                                                         |
| Projet 3   | Escalier qui traversait le mur ; pointe de pelouse sur le pavage devant la porte                                                                     | Escalier repris ; l'herbe ne perce plus aucun dallage (terrain abaissé sous les allées).                                                                          |
| Profil     | Volume de brique et terrasse qui dépassaient sur le côté ; marquise orange sans appui ; fresque pixel                                                | Volumes empilés cohérents, terrasse sur le toit du rez-de-chaussée ; médaillon-portrait de profil en relief, sans pixel art ; arrière soigné.                     |
| Galerie    | Porte et marquise qui chevauchaient les colonnes ; arrière nu                                                                                        | Portique sur stylobate, colonnes écartées de la porte ; quai de manutention avec rampe, hautes fenêtres et local technique à l'arrière.                           |
| Six portes | Porte commune plaquée sur la façade                                                                                                                  | Porte encastrée : piédroits et linteau du matériau du mur, seuil de pierre, fond sombre ; déclinée par lieu (bois, verre, sectionnelle, hublot, galerie, rideau). |
| Sol        | Plaques d'égout hors chaussée, trop nombreuses                                                                                                       | Une par rue, sur la chaussée (5).                                                                                                                                 |
| Sol        | Bandes podotactiles de travers                                                                                                                       | Retirées.                                                                                                                                                         |
| Sol        | Haies en travers des allées                                                                                                                          | Replacées le long des allées (test).                                                                                                                              |
| Sol        | Plaque de rue bleue qui flottait                                                                                                                     | Fixée sur un mât, deux équerres.                                                                                                                                  |
| _En plus_  | Trois lampadaires et un banc posés sur la chaussée, poubelles au bord du dallage                                                                     | Déplacés (test de cohérence : 23 objets mal posés en V6, 0 en V7).                                                                                                |
| _En plus_  | Bordures de plates-bandes qui traversaient les allées                                                                                                | Arrêtées aux allées.                                                                                                                                              |
| _En plus_  | Mobilier posé à la hauteur d'un seul point (pieds dans le vide sur les pentes)                                                                       | Posé au plus bas des points d'appui.                                                                                                                              |
| _En plus_  | Pendant la reconstruction : tapis de porte et poubelles qui sortaient de l'emprise (Profil, Galerie, Veolia), auvent de porte de la tour du Projet 1 | Repris jusqu'à ce que le test d'emprise passe.                                                                                                                    |

## Phase 3 — Plus de détail, sans fouillis

- **Façades** : appareils de brique et linteaux (Profil, atelier), bardage à lames (tour du Profil), joints de banches (Veolia, socles), soubassement de pierre (Galerie), fenêtres différentes selon l'étage, une enseigne propre à chaque lieu.
- **Toits** : plus aucun toit plat nu (gravier, toiture végétalisée partielle, panneaux solaires, édicules, garde-corps, ventilations).
- **Quatre faces** : chaque bâtiment a un arrière (porte de service, locaux, escaliers ou quai).
- **Abords** : parvis dallés devant chaque entrée, avec bordures ; pieds d'arbres paillés, ou grillés le long des rues ; massifs d'arbustes composés ; arbres d'alignement.
- Les petits détails passent dans `<Fine>` (masqués au-delà de 48 unités, absents en qualité Légère).

## Phase 4 — Page de chargement

- **Écran** : statique dans `index.html`, donc affiché avant le moindre JavaScript. Couleurs et typographie tirées des tokens (`src/design/tokens.ts`, injectés au build par un petit plugin Vite) : ciel, nuages, monogramme YV, nom, petite île et robot dont la flamme bat, phrase sobre (« La ville se construit, un bâtiment après l'autre. »). Animations en CSS seulement, sur `transform` et `opacity` : elles tournent sur le compositeur même quand le fil principal est occupé. Avec « réduire les animations », tout est fixe.
- **Barre de progression** sur les étapes réelles : code, polices, scène, construction de la ville (une avancée par tranche), préparation des matières, première image. Chaque étape pose une marque de performance (`careerverse:<étape>`).
- **Moins de blocage** : la ville est montée par tranches (terrain en 3, bâtiments un par un, décor en 4, ciel), chaque tranche est compilée avec `renderer.compileAsync` (compilation parallèle des shaders quand le pilote la propose), rendu à la demande pendant le chargement, contours (post-traitement) seulement après la première image.
- **Fondu** quand la première image complète est rendue, puis retrait de l'écran.

Mesures (`npm run mesure:chargement`, Chromium sans écran, rendu logiciel SwiftShader, 1440×900, qualité Soignée, médiane de 3) :

| Version | Prête (première image) | Plus longue tâche | Tâches > 200 ms | Transféré |
| ------- | ---------------------: | ----------------: | --------------: | --------: |
| V6      |                  4,4 s |            742 ms |               3 |    441 Ko |
| V7      |                  7,6 s |          1 671 ms |               2 |    450 Ko |

Relevés bruts : `docs/screenshots/v7/chargement/mesure-v6.json` et `mesure-v7.json`. Le premier essai V7, à froid, a été bien plus lent (13,9 s, une tâche de 7,4 s) ; les deux suivants donnent 5,9 s et 7,6 s. En qualité Légère (mesure faite pendant la phase 4), la V7 est prête en 3,8 s avec une plus longue tâche de 0,55 s.

**Lecture honnête** : en rendu logiciel, la V7 met plus de temps que la V6 à afficher sa première image et garde une tâche longue de plus de 200 ms. La cause mesurée est l'édition des liens des programmes de shaders, qui se fait sur le processeur en SwiftShader (46 programmes) et que `compileAsync` ne peut pas rendre parallèle sans l'extension `KHR_parallel_shader_compile`. La page de chargement, elle, reste animée (CSS sur le compositeur) et la barre avance par tranches. Sur un vrai GPU (non vérifié ici), la compilation est bien plus rapide et parallèle. Captures de la page à trois étapes : `docs/screenshots/v7/chargement/`.

## Phase 5 — Le robot, fil conducteur

- **Accueil** : le robot que l'on contrôle plane à côté du titre, en grand, propulseurs allumés sous les pieds (flamme stylisée, petites particules lumineuses), léger balancement. Il cligne des yeux, suit le curseur du regard et fait signe de la main au survol (ou au focus clavier) d'« Explorer la ville ». C'est le même objet 3D qu'en ville, placé devant la caméra d'accueil (`src/world/flight.ts`, `homePosition`). Sur téléphone, il plane au-dessus de la carte d'accueil sans la masquer.
- **Entrée** (« Explorer la ville », ou départ de la visite guidée) : il se retourne, vole en courbe (Bézier cubique) au-dessus des toits jusqu'à la place, la caméra plonge et le suit de dos, puis il atterrit au départ avec une bouffée de poussière et un son court. 2,4 s en tout ; un clic, un toucher, Espace ou Entrée passent la séquence.
- **Retour à l'accueil** : il décolle là où il est, remonte en courbe et reprend son vol stationnaire à côté du titre pendant que la caméra remonte. Même durée, passable. À la fin d'une visite guidée, il remonte de la même façon.
- **Trajets** : jamais à travers un bâtiment ni sous l'île (test sur l'aller depuis les quatre formats d'écran et sur le retour depuis la place et le seuil des six bâtiments).
- **Réduire les animations** : pas de vol, un fondu simple.
- **Tests** (`tests/v7.test.mjs`) : position à l'accueil (devant la caméra, entière à l'écran, assez grande, sans masquer le titre ni la carte) aux quatre formats ; trajets sans collision ; durée ≤ 2,5 s ; phases home → entering → explore → homing, passables. Durées ajoutées à `npm run temps-morts`.
- **Captures** : `docs/screenshots/v7/robot/` — accueil, signe de la main, aller et retour figés à 0, 33, 66 et 100 % (crochet `holdFlight` de `?debug=1`), au bureau et sur téléphone.

Défauts vus sur les captures et corrigés : à 33 % de l'aller, le robot sortait du cadre (caméra trop loin, regard vers le centre de l'île) → caméra en poursuite derrière lui ; à 66 % du retour, la caméra regardait les nuages (mélange d'un point lointain et du robot) → mélange des directions de regard, qui garde le robot cadré.

## Budget de rendu

Relevés de la campagne V7 (`docs/screenshots/v7/`), lus par `tests/budget.test.mjs`. Ombres comprises.

| Qualité Soignée (budget 300 / 700 000) | 1920×1080 | 1440×900 | 1366×768 |  390×844 | V6 (max) |
| -------------------------------------- | --------: | -------: | -------: | -------: | -------: |
| Accueil (robot compris)                |  194/415k | 194/415k | 194/415k | 194/415k | 246/432k |
| Exploration                            |  205/432k | 201/432k | 205/432k | 172/417k | 246/443k |
| Porte                                  |  183/413k | 182/401k | 183/413k | 138/384k | 205/424k |
| Intérieur                              |    84/56k |   83/56k |   84/56k |   75/53k |   91/57k |

| Qualité Légère (budget 180) | 1920×1080 | 1440×900 | 1366×768 | 390×844 | V6 (max) |
| --------------------------- | --------: | -------: | -------: | ------: | -------: |
| Accueil                     |       137 |      137 |      137 |     137 |      147 |
| Exploration                 |       122 |      120 |      123 |      92 |      124 |
| Porte                       |       104 |      103 |      104 |      61 |      124 |
| Intérieur                   |        42 |       41 |       42 |      34 |       42 |

Vues de détail (31 vues, de l'accueil au pas de la porte et dans les six intérieurs) : 218 draw calls et 420 695 triangles au plus. Plus de détail, mais moins de draw calls qu'en V6 : les nouvelles pièces passent dans les regroupements statiques, et les portes sont un seul maillage par vantail. Le robot et la page de chargement ne coûtent presque rien : le robot était déjà dans la scène, ses propulseurs ajoutent 10 petits maillages visibles seulement en vol ; la page est du HTML et du CSS.

## Vu à l'écran

Chromium sans écran, rendu WebGL par le processeur (SwiftShader). **Les FPS relevés ne comptent pas** : ils mesurent le processeur de la machine de capture, pas un GPU.

- **Scènes habituelles** (`docs/screenshots/v7/`) : accueil, exploration, porte, intérieur, aux quatre tailles, en Soignée et en Légère (`legere/`). Vu : le robot plane à côté du titre sans le couvrir, au-dessus de la carte sur téléphone ; le Profil avec son médaillon et sa porte en bois encastrée ; la place et la fontaine.
- **Tour d'inspection, avant et après** (`inspection/avant/` = V6, `inspection/apres/` = V7) : six planches de 8 vues et la vue de dessus de l'île. Vu : cuves de Veolia sur leur socle et arrière traité, fenêtres courbes du Projet 3, contreventement du Projet 1 hors des dalles, portique de la Galerie, arrière de chaque bâtiment ; vue de dessus : allées dégagées, parvis devant chaque entrée. La vue à 270° du Profil est masquée par un sapin et la pergola du jardin (placement de la caméra, pas un défaut du bâtiment).
- **Vues de détail** (`details/`) : pour chaque bâtiment, la silhouette depuis l'accueil, la façade depuis l'allée, la porte de près ; les six intérieurs ; le dessous de l'île. Les six portes encastrées se lisent (bois, verre, sectionnelle, hublots, galerie, rideau).
- **Robot** (`robot/`) : voir la phase 5.
- **Page de chargement** (`chargement/`) : trois étapes au bureau et sur téléphone. La légende sous la barre est celle du moment de la capture (souvent l'étape suivante : la capture elle-même prend du temps en rendu logiciel).
- **Console** : aucune erreur dans aucune campagne.
- **Contrôles** : 61 tests passent (dont cohérence du décor, emprises, budget, vols du robot) ; typecheck, lint, Prettier, knip et build sont verts.

Défaut vu pendant la vérification et corrigé : en mode photo (captures de détail et d'inspection), le robot de l'accueil se plaçait devant la caméra photo et flottait dans le ciel ; il reste maintenant au sol à sa place. Les vues concernées ont été refaites.

## Non vérifié

- **Fluidité et temps de chargement sur un vrai GPU** : tout est rendu ici par le processeur. Les draw calls et les triangles, eux, sont exacts.
- **Les vols en mouvement** : vus sur des images figées (0, 33, 66, 100 %) et dans les tests ; la fluidité réelle à 60 Hz n'a pas été vue.
- **Le son d'atterrissage** : joué par le code, pas entendu (navigateur sans sortie audio).
- **Le signe de la main au toucher** : pas de survol sur un écran tactile ; sur téléphone, le robot ne fait pas signe.
- **Firefox et Safari** : seul Chromium a été lancé. Tactile sur un vrai téléphone : non vérifié.
- **`compileAsync` en parallèle** : dépend de l'extension `KHR_parallel_shader_compile`, absente de SwiftShader.

## Choix faits sans te consulter

1. **Visite guidée** : le robot vole vers la place au premier lieu, y reste pendant les présentations, et remonte à l'accueil à la fin.
2. **Le robot atterrit toujours au départ** de la place, même si on avait quitté la ville ailleurs : l'entrée est la même pour tout le monde.
3. **Caméra en poursuite** pendant les vols plutôt qu'une caméra fixe qui regarde passer le robot : sinon il est trop petit à l'écran.
4. **Bandes podotactiles retirées** plutôt qu'alignées : elles n'apportaient rien à cette échelle.
5. **Portrait du Profil** : médaillon en relief (silhouette de profil, lunettes) à la place de la fresque pixel.
6. **Chargement** : ville montée par tranches dans le fil principal plutôt que dans un worker (les géométries sont des composants React, un worker aurait demandé de tout réécrire).
7. **Captures V6 retirées** de l'arbre (seules les captures de la version en cours restent), comme convenu ; la référence V6 utile est dans `docs/screenshots/v7/inspection/avant/`.

## Reste à faire

- **Supprimer les anciennes branches** depuis GitHub (le proxy de la session ne le permet pas).
- **Écrire le contenu** (`src/content/`, voir `CONTENT.md`).
- **Mesurer sur de vrais appareils** : temps de chargement, fluidité des vols, qualité Légère sur téléphone.
