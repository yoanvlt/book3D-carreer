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

_Mesures en cours (campagne de vérification)._

**Lecture honnête** : en rendu logiciel, la V7 met plus de temps que la V6 à afficher sa première image et garde une tâche longue de plus de 200 ms. La cause mesurée est la vérification d'édition des liens des programmes de shaders, qui se fait sur le processeur en SwiftShader (46 programmes) et que `compileAsync` ne peut pas rendre parallèle sans l'extension `KHR_parallel_shader_compile`. La page de chargement, elle, reste animée (CSS sur le compositeur) et la barre avance par tranches. Sur un vrai GPU (non vérifié ici), la compilation est bien plus rapide et parallèle. Captures de la page à trois étapes : `docs/screenshots/v7/chargement/`.

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

_Relevés en cours (campagne de vérification)._

## Vu à l'écran

Chromium sans écran, rendu WebGL par le processeur (SwiftShader). **Les FPS relevés ne comptent pas** : ils mesurent le processeur de la machine de capture, pas un GPU.

_Campagne de captures en cours._

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
