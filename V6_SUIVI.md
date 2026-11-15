# CareerVerse V6 — suivi et vérifications

Date : 15 novembre 2026. Base : `main` au commit `f4b60ed` (V5 en ligne, workflow de publication réparé, non modifié ici). Une seule branche de travail, celle qu'impose l'environnement de session : `claude/careerverse-v4-refactor-7f688a`, repartie de `main`. Aucun merge dans `main`.

Le contenu reste vide : aucun texte de projet n'a été écrit. Seuls des textes d'ambiance techniques apparaissent dans la scène (plaques de rue, « BASSIN 1 », « CLARIFICATEUR »).

## Déroulé

| Phase         | Commits (du plus ancien au plus récent)   | Résumé                                                                           |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| 1. Nettoyage  | `6ea9e1e` → `3a782f1`                     | Archives, captures V4 retirées, dépendances, code mort, découpage des fichiers.  |
| Outil         | `31ef3a2`, `d941eeb`                      | Mode photo (`?debug=1`) et vues de détail avant/après.                           |
| 2. Kit        | `6439271` → `48bcbb6`                     | Matières procédurales, niveau de détail fin, pièces du kit, planche de contrôle. |
| 3. Bâtiments  | `2da7a05` → `631c1bc`                     | Couleurs désaturées, porte commune, un commit par bâtiment.                      |
| 4. Le monde   | commits « Île flottante » à « Vie »       | Île, sol, végétation, mobilier, place, animations.                               |
| 5. Intérieurs | commits « Intérieurs » et « Intérieur … » | Coque par lieu, emprises, un commit par intérieur.                               |
| Vérification  | voir l'historique                         | Test de budget, captures, comparaisons, ce document.                             |

## Phase 1 — Nettoyage

### Rangement

- `careerverse-v5-brief/`, `docs/v4-brief/`, `V3_SUIVI.md`, `V4_SUIVI.md`, `V5_SUIVI.md` et le cahier des charges sont dans `docs/archives/`, avec un index (`docs/archives/README.md`). À la racine, il ne reste comme documents que `README.md`, `CONTENT.md` et ce fichier.
- `docs/screenshots/v4/` (53 PNG, 12 Mo) est retiré de l'arbre. À la fin de la V6, `docs/screenshots/v5/` l'est aussi : seules les captures de la version en cours restent, en WebP (`docs/screenshots/v6/`). L'index des archives explique comment ressortir une ancienne capture de l'historique.

### Dépendances

- **Playwright** déclaré en dépendance de développement, épinglé en `1.63.0` : c'est la version du Chromium préinstallé dans l'environnement, une autre version ne le trouverait pas. Les scripts l'importent normalement (`import { chromium } from 'playwright'`).
- **Une commande npm par script** : `capture`, `capture:details`, `capture:interface`, `capture:tactile`, `capture:visite`, `capture:apercu`, `capture:comparaisons`, `temps-morts`, `sons`, et `knip`.
- **`npm audit fix`** sans `--force` : la faille haute de zod a disparu avec zod 4. Il reste 7 alertes modérées, toutes dans la chaîne de développement `typescript-eslint` → `minimatch` ; leur correctif proposé est un retour à une version antérieure de `typescript-eslint` (changement majeur), donc non appliqué. Rien de cela n'est livré au navigateur.
- **zod 4** : coût faible, deux lignes. `.default({})` devient `.prefault({})` pour le bloc contact (zod 4 ne repasse plus la valeur par défaut dans le schéma), et `z.string().email()` devient `z.string().pipe(z.email())`. Les messages d’erreur du contenu sont inchangés et ses tests passent.

### Code mort (knip)

`knip.json` voit `src/`, `tests/` et `scripts/`. Les 42 exports et 3 types signalés ont été vérifiés un par un :

- **14 servent aux tests ou aux scripts**, qui chargent le TypeScript par chemin (`tests/load-source.mjs`) et que knip ne peut donc pas suivre : ils restent exportés, marqués `@public` (`ContentError`, `parseInline`, `parseStations`, `leaveBuilding`, `clearIndoorSegment`, `terrainSlope`, `clearSegment`, `obstacles`, `PASSPORT_KEY`, `compositions`, `clearCameraSegment`, `INTERIOR_CAMERA`, `cloudConflicts`, `CHECKED_SCREENS`).
- **27 ne servaient que dans leur propre fichier** : le mot-clé `export` est retiré (par exemple `space`, `shadow`, `isIdle`, `contactNormal`, `smoothRoute`, `homeCamera`).
- **4 étaient vraiment inutilisés** et sont supprimés : `isSoundOn`, `MATTE`, `Parapet` (refait dans le kit), le type `Status`.

`npm run knip` est vide à la fin de la V6.

### Découpage

- `src/scene/buildings/` : un fichier par bâtiment. `Buildings.tsx` garde le socle, la porte, le totem, le fondu et le niveau de détail.
- `src/scene/interiors/` : un fichier par intérieur, plus la coque (`Room.tsx`), les stations (`Exhibit.tsx`) et le mobilier commun (`parts.tsx`).
- `Environment.tsx` est séparé en `Vegetation.tsx`, `Furniture.tsx` et `Plaza.tsx`.
- `style.css` est découpé en douze feuilles par zone d'interface (`src/styles/`), importées dans l'ordre de la cascade. **Le CSS construit est identique à l'octet près** (même empreinte de fichier).
- **`state.ts` n'est pas découpé** : 420 lignes cohérentes, un seul magasin d'état et ses actions gardées, qui partagent les mêmes objets mutables (`player`, `journey`, `passage`, `presentation`). Les séparer aurait dispersé ces objets sans rien simplifier.

### Captures identiques

Comparaison des quatre scènes aux quatre tailles entre la référence (build juste avant le découpage) et la fin de phase 1 (`3a782f1`), image par image. Les seules différences sont des liserés d'arêtes d'un pixel, dus à la caméra amortie qui s'arrête à une fraction de pixel près selon le cadencement du rendu logiciel : pixels différant de plus de 24/255 : 0,02 % à l'accueil, 0,03 à 0,05 % devant la porte, 0,1 à 0,3 % à l'intérieur, 0,9 à 4,7 % en exploration (uniquement des contours). Draw calls et triangles identiques, console sans erreur.

## Phase 2 — Kit de construction

### Matières procédurales

`src/scene/surface.ts` : brique, bardage bois, bac acier, panneaux de béton, enduit, tuiles, dallage, gravier, pavés, parquet, lames, pierre. **Choix : le motif est calculé dans le shader, pas sur une texture de canvas.** Raisons :

- zéro octet de texture (le brief en tolérait quelques dizaines de ko) ;
- le motif suit la position dans le repère du bâtiment regroupé : il reste aligné sur les murs d'un bâtiment tourné, sans coordonnées de texture à calculer pour chaque pièce ;
- il s'efface quand il devient plus fin qu'un pixel (pas de moirage vu de l'accueil).

Le regroupement (`StaticBatch.tsx`) recopie sur chaque sommet la couleur, le motif, la rugosité, le métal et la lumière émise : **toutes les matières d'un bâtiment partagent un seul matériau**. Un bâtiment de plusieurs milliers de pièces fait deux à quatre draw calls (face simple ou double, ombre portée, détail fin). En V5, chaque rugosité ou émission distincte coûtait un draw call ; varier les matières ne coûte plus rien.

Le verre clair des vitrines (prototypes du Projet 1, vitrines de la galerie) est le seul matériau transparent : il n'est pas regroupé.

### Trois niveaux de lecture

1. **Silhouette** depuis l'accueil : volumes et toitures.
2. **Matières et rythmes** depuis l'allée : fenêtres, bandeaux, bardages, garde-corps.
3. **Petits détails** devant une porte : poignées, colliers de descente, barreaux, fleurs, boulons. Ils sont placés sous `<Fine>` : en qualité Soignée, ils forment des maillages à part, masqués quand la caméra est à plus de 48 unités du bâtiment ; en qualité Légère, ils ne sont pas construits du tout. C'est l'équivalent de `Detailed` de drei adapté au regroupement : `Detailed` change de maillage, alors qu'ici un bâtiment entier est déjà fusionné.

### Pièces

`src/scene/kit/` : `openings` (fenêtre en retrait avec embrasure, appui, petits-bois, linteau ; stores, volets, jardinière, vitrage éclairé ; rangées ; murs-rideaux ; auvent ; porte complète), `facade` (volume avec soubassement, bandeaux, corniche, acrotère et couvertine, chaînes d'angle ; gouttière, descente d'eau, ventilation, climatiseur, coffret technique, applique), `structures` (garde-corps, balcon, escalier, échelle à crinoline, passerelle), `roofs` (terrasse gravillonnée avec lanterneaux et équipements, deux pans en tuiles, sheds, dôme à lamelles avec fente, verrière, panneaux solaires), `props` (jardinière, caisse, palette, fût, vélo, boîte aux lettres, vanne, bride).

La planche `?debug=1&kit` montre toutes les pièces et les matières (`docs/screenshots/v6/kit/`).

## Phase 3 — Six bâtiments

Emplacements, portes et volumes de collision inchangés (`config.ts` n'a pas bougé).

- **Profil** : maison d'architecte. Atelier vitré en avancée, corps blanc, étage orange en porte-à-faux portant une **fresque-portrait** et le nom, toit de tuiles et cheminée, tour-belvédère en brique avec lanterne et **girouette animée**, jardin clos en brique avec **buste**, banc et arbre, boîte aux lettres, vélo. C'est toujours la silhouette la plus haute et la plus singulière de l'île.
- **Projet 1** : pavillon de verre et d'acier. Ossature apparente, plateaux décalés, contreventement en croix, tour orange coiffée d'antennes, grand auvent en porte-à-faux tenu par des tirants, **prototypes visibles derrière le verre clair** (bras robotisé, drone, rover, imprimante).
- **Projet 2** : manufacture. Halle de brique couverte de quatre sheds jaunes, cheminée baguée, quai couvert avec palettes, caisses et fûts, **chariot élévateur**, **potence** avec caisse suspendue, bureau en annexe, **deux engrenages en prise** sur leur platine au-dessus de l'entrée.
- **Projet 3** : observatoire. Tambour violet à fentes vitrées, terrasse circulaire, **coupole à lamelles, fente ouverte et télescope qui en sort**, **escalier hélicoïdal extérieur**, **station météo** (anémomètre, girouette, abri, panneau solaire).
- **Autres missions** : galerie. Hall de pierre, toit vert d'eau à lanterneau, **colonnade** et entablement, **bannières**, deux **vitrines** éclairées, deux **jardins de sculptures**, **drapeau animé**.
- **Veolia** : station de traitement d'eau. Bâtiment technique à bandeau rouge, deux cuves avec **échelles à crinoline**, garde-corps et **passerelle**, **bassin** rectangulaire et **clarificateur** circulaire à l'**eau animée**, canalisations rouges et bleues à **vannes** et brides, bandes de danger, signalétique technique.

Commun : porte détaillée (embrasure, marquise à la couleur du lieu, filet lumineux, seuil de pierre, paillasson, numéro du lieu), totem sur socle, socle dallé.

## Phase 4 — Le monde

- **Île flottante** : le plan d'eau sous l'île est remplacé par un vrai dessous. Falaise à strates en ressaut, cône rocheux jusqu'à la pointe, 56 rochers saillants, 16 racines pendantes, deux sources qui tombent en cascade avec brume. L'île flotte désormais dans la mer de nuages, qui était masquée par le plan d'eau en V5. La forme est partagée avec le filtre des nuages (`world/island.ts`) : aucun nuage ne cache le dessous de l'île vu de l'accueil (test existant, adapté).
- **Sol** : rues et allées dallées, bordures de pierre, place pavée avec bordure, rose des vents et carrés d'angle, plaques d'égout, bandes podotactiles là où les allées rejoignent la rue, plates-bandes bordées de pierres, herbe à grandes taches de teinte, gravier, cailloux.
- **Végétation** : feuillus à couronne de six volumes inégaux et deux branches maîtresses, bouleaux à tronc clair marqué de tirets sombres (souvent à deux troncs), conifères à quatre étages de cônes, quelques feuillus d'automne aux teintes adoucies (il n'y a plus d'arbres jaune vif), haies taillées à la place des « chenilles », herbes hautes et fleurs instanciées. Le masquage des arbres gênants de la V5 est conservé et généralisé à toutes les essences.
- **Mobilier** : bancs à lattes sur piètements de fonte, lampadaires à crosse et lanterne, poubelles, bornes, deux supports à vélos avec vélos, deux clôtures basses, trois plaques de rue, pergola fleurie. Bornes, supports et clôtures ont un volume de collision.
- **Place** : fontaine-sculpture moulurée (bassin, vasque sur colonne, trois anneaux), poteau indicateur à socle, bagues et embouts.
- **Vie** : fontaine, oiseaux et petits robots gardés ; trois éléments ajoutés, tous figés en mouvement réduit : drapeau, girouette, eau des bassins de Veolia.
- **Couleurs** : les aplats vifs du monde 3D sont désaturés de 12 % (`muted` dans `tokens.ts`). L'interface garde ses couleurs : `placeColor` (plan, passeport, cartes) est inchangé, la scène utilise `scenePlaceColor`. La rugosité varie avec la matière (0,1 pour le verre clair à 1 pour le gravier).

## Phase 5 — Six intérieurs

Coque propre à chaque lieu : sol (parquet, résine, béton, dallage, faux plancher), murs (enduit, peinture, brique peinte, béton), lambris, plinthes partout, encadrement intérieur de la porte, appuis de fenêtres. Le nombre de stations et `CONTENT.md` sont intacts ; les stations restent dégagées. Le nouveau mobilier est au fond des salles et dans les coins ; ses emprises sont dans `FURNITURE` (`narrative.ts`) et les tests d'itinéraires intérieurs passent sans modification.

- **Profil** : salon-bibliothèque. Parquet, lambris, poutres, bibliothèques garnies, canapé et fauteuil, table basse avec livres et vase, grand tapis, lampadaire de lecture, guéridon et globe, cadres, appliques.
- **Projet 1** : laboratoire et showroom. Dalles de résine, plafond de dalles lumineuses, chemins de câbles, paillasse avec écrans, microscope et flacons, bras robotisé dans une zone balisée, baie de serveurs à voyants, cloisons vitrées, tableau blanc, marquages au sol.
- **Projet 2** : atelier. Béton, brique peinte, portiques et pont roulant avec palan, établi à étau et tiroirs, panneau à outils, tour à métaux, perceuse à colonne, panneaux perforés, caisses, air comprimé, bandes de sécurité.
- **Projet 3** : observatoire. Lambris violet, plafond nervuré semé d'étoiles, estrade du télescope avec garde-corps et escalier, télescope sur pilier, sphère armillaire, cartes du ciel encadrées, tapis.
- **Autres missions** : galerie. Parquet clair, cimaises, six cadres de formats différents avec cartels, rails de spots, sculptures sur socles, banc de galerie.
- **Veolia** : salle de contrôle. Faux plancher, trois pupitres en arc avec écrans et fauteuils, écran synoptique (cuves, bassins, réseaux), colonnes techniques, tuyauteries, descentes et vannes, gaines au plafond.

## Budget de rendu

Draw calls de toutes les passes d'une image (ombres et contours compris) et triangles, relevés par `?debug=1`. Avant : V5 (build de référence de la phase 1). Après : V6. Rapports : `docs/screenshots/v6/rapport-scenes.json`, `legere/`, `apres/`, `avant/`.

### Qualité Soignée (budget : 300 draw calls, 700 000 triangles)

| Scène              | Taille    | Avant : draw calls | Avant : triangles | Après : draw calls | Après : triangles |
| ------------------ | --------- | -----------------: | ----------------: | -----------------: | ----------------: |
| Accueil            | toutes    |                223 |           321 871 |                246 |           431 663 |
| Exploration        | 1920×1080 |                197 |           319 937 |               246* |          431 663* |
| Exploration        | 1440×900  |                191 |           319 795 |                226 |           442 543 |
| Exploration        | 1366×768  |                197 |           319 937 |                228 |           442 567 |
| Exploration        | 390×844   |                155 |           306 531 |                189 |           429 573 |
| Porte              | 1920×1080 |                180 |           313 235 |                205 |           423 993 |
| Porte              | 1440×900  |                179 |           305 959 |                203 |           407 805 |
| Porte              | 1366×768  |                180 |           313 235 |                205 |           423 993 |
| Porte              | 390×844   |                149 |           289 581 |                161 |           388 657 |
| Intérieur (Profil) | 1920×1080 |                 91 |            39 395 |                 91 |            56 879 |
| Intérieur (Profil) | 1440×900  |                 89 |            39 303 |                 87 |            56 063 |
| Intérieur (Profil) | 1366×768  |                 88 |            38 581 |                 91 |            56 879 |
| Intérieur (Profil) | 390×844   |                 80 |            38 217 |                 80 |            53 157 |

\* À 1920×1080, le relevé d'exploration a été pris pendant la descente de la caméra depuis l'accueil : il reprend la vue d'accueil.

Vues de détail (`apres/rapport-details.json`) : dessous de l'île 246 draw calls ; galerie 190 à 224 ; Veolia 153 à 220 ; Profil 140 à 208 ; Projets 1 à 3, 127 à 135 ; intérieurs 87 à 119 ; 434 635 triangles au plus. **Le plus cher reste à 82 % du budget en draw calls et à 63 % en triangles.**

La hausse des triangles (+35 %) vient surtout des herbes, fleurs et cailloux instanciés et des couronnes d'arbres ; la hausse des draw calls est faible (+10 à +25) parce que les bâtiments, malgré des milliers de pièces, restent à deux à quatre draw calls chacun.

### Qualité Légère (budget : 180 draw calls)

| Scène       | 1920×1080 | 1440×900 | 1366×768 | 390×844 |
| ----------- | --------: | -------: | -------: | ------: |
| Accueil     |       147 |      147 |      147 |     147 |
| Exploration |       124 |      122 |      124 |      89 |
| Porte       |       124 |      105 |      106 |      63 |
| Intérieur   |        42 |       41 |       42 |      35 |

Six portes en qualité Légère, contenu d'essai : 51 à 67 draw calls à l'intérieur, 56 à 116 à l'extérieur (V5 : 53 à 70 et 57 à 106).

### Test

`tests/budget.test.mjs` vérifie ces trois rapports : chaque scène sous 300 draw calls et 700 000 triangles en Soignée, sous 180 en Légère, et une console vide. Le décompte demande un vrai rendu WebGL, impossible sous Node : le test lit les relevés versionnés, à refaire après chaque changement de scène (commandes en tête du fichier).

## Vu à l'écran

Chromium sans écran, rendu WebGL par le processeur (SwiftShader). **Les FPS relevés (1 à 12) ne comptent pas.** Aucune erreur de console dans aucune campagne.

- **Scènes habituelles** (`docs/screenshots/v6/`) : accueil, exploration, porte, intérieur, aux tailles 1920×1080, 1440×900, 1366×768 et 390×844, en qualité Soignée ; les mêmes en qualité Légère (`legere/`). Vu : l'île flotte au-dessus de la mer de nuages, la falaise et les deux cascades sont visibles depuis l'accueil, le titre n'est pas couvert ; sur téléphone, la place pavée, les plaques d'égout, les bornes, le support à vélos et la fontaine se lisent.
- **Avant / après** (`comparaisons/`, 32 images, V5 à gauche, V6 à droite ; sources dans `avant/` et `apres/`) : pour chaque bâtiment, la silhouette vue de l'accueil, la façade depuis l'allée, le gros plan devant la porte ; les six intérieurs vus depuis la porte et depuis le fond ; le dessous de l'île. Chaque bâtiment reste reconnaissable depuis l'accueil (couleur et silhouette gardées : tour orange du Profil, plateaux vitrés du Projet 1, sheds jaunes, coupole blanche sur tambour violet, toit vert d'eau, deux cuves cerclées de rouge).
- **Planche du kit** (`kit/`) : matières, fenêtres et porte, façades, toitures, structures et accessoires.
- **Six portes** (`portes/`, contenu d'essai, qualité Légère) : entrée, lecture de la première station et sortie réussies dans les six lieux ; passeport complet ; carte de fin ouverte. Les stations restent lisibles et dégagées dans les nouveaux intérieurs.
- **Phase 1** : captures identiques avant et après le nettoyage (voir plus haut).
- **Tests** : 53 tests passent (50 de la V5, 3 de budget). Typecheck, lint, Prettier, knip et build sont verts.

Défauts vus et corrigés pendant la vérification : bordures d'allées qui traversaient la chaussée aux croisements (passées sous le dallage), panneau à outils de l'atelier qui masquait le panneau « Bientôt », plaque de numéro sous une applique, acrotère de la tour du Profil mal placé, salle précédente restée affichée quand on passe directement d'un intérieur à l'autre (cas des scripts de capture ; en jeu on passe toujours par l'extérieur), mais aussi présent dans la V5 : les premières vues « avant » des intérieurs en étaient faussées et ont été refaites.

## Non vérifié

- **Fluidité sur un vrai GPU.** Tout est rendu ici par le processeur (SwiftShader) : **les FPS relevés (1 à 12) ne comptent pas**. Les draw calls et les triangles, eux, sont exacts. À mesurer sur un portable moyen en qualité Légère et sur un téléphone récent.
- **Coût réel des matières procédurales** : quelques opérations de plus par pixel sur les bâtiments. Négligeable sur un GPU de bureau, à vérifier sur un téléphone d'entrée de gamme.
- **Animations en mouvement** : drapeau, girouette, eau des bassins, ondulation des herbes. Vues sur des images fixes seulement.
- **Densité de pixels adaptative** et passage automatique en qualité Légère sur un vrai appareil.
- **Firefox et Safari** : seul Chromium a été lancé.
- **Tactile sur un vrai téléphone**, son audible : rien n'a changé depuis la V5, mais rien n'a été revérifié sur appareil.

## Alléger l'historique Git (proposition, rien n'est fait)

Au départ de la V6, le dépôt pesait 20 Mo. **Avec les captures de la V6, il pèse 32 Mo** (`.git` compacté : 31 Mo) : les vues avant/après, leurs comparaisons et les deux qualités font 11,8 Mo de WebP. Mesure objet par objet :

| Type                                                              | Taille compressée | Fichiers |
| ----------------------------------------------------------------- | ----------------: | -------: |
| PNG (captures V3 et V4)                                           |           13,5 Mo |       53 |
| WebP V6 (scènes, Légère, avant, après, comparaisons, kit, portes) |           11,8 Mo |      158 |
| WebP V5                                                           |            3,6 Mo |       62 |
| JPEG (briefs, aperçu de partage)                                  |            2,6 Mo |       29 |
| tout le reste (code, sons, polices)                               |            0,6 Mo |      497 |

**Sans réécrire l'historique** (ce qui est fait) : captures en WebP seulement, et une seule version de captures dans l'arbre. Le clone reste lourd, mais il cesse de grossir de plus d'un ou deux Mo par version.

**Pour cette PR, sans réécriture** : la fusionner en « Squash and merge » puis supprimer la branche. `main` ne recevra alors que l'état final des captures V6, sans les états intermédiaires de la campagne. On peut aussi, avant la fusion, retirer de l'arbre `avant/` et `apres/` (4,4 Mo, déjà contenus dans `comparaisons/`) en gardant leurs rapports JSON, que lit le test de budget.

**Pour la suite, sans réécriture** : ne plus versionner les captures. Les publier en pièce jointe d'une Release GitHub par version (`v6-captures.zip`), ou sur une branche orpheline `captures` qu'on ne clone pas par défaut. Le README pointerait vers elles.

**En réécrivant l'historique** (seulement avec ton accord : irréversible pour les copies existantes, force-push sur toutes les branches, identifiants de commits changés, liens vers d'anciennes captures cassés) :

```bash
pip install git-filter-repo
git clone --mirror https://github.com/yoanvlt/book3D-carreer.git book3d-mirror
cd book3d-mirror
git filter-repo --path-glob 'docs/screenshots/**/*.png' --path-glob 'docs/screenshots/v5/**' --invert-paths
git push --force --mirror
```

Gain attendu : environ 15 Mo (PNG et WebP V5), plus 11 Mo si l'on retire aussi les WebP V6 de l'historique après les avoir publiés ailleurs. Les briefs archivés (JPEG) sont gardés : ils documentent les décisions.

## Choix faits sans te consulter

1. **Matières dans le shader plutôt que sur canvas** (voir phase 2) : zéro texture, alignées sur les murs, un seul matériau par bâtiment.
2. **Niveau de détail par regroupement plutôt que `Detailed`** : les petits détails forment un maillage à part, masqué au-delà de 48 unités, absent en qualité Légère.
3. **Verre clair** pour voir les prototypes du Projet 1 et les objets des vitrines : seul matériau transparent de la scène, non regroupé.
4. **L'île flotte** : le plan d'eau de la V5 disparaît au profit d'un dessous rocheux et de la mer de nuages, qui existait déjà mais était cachée par le plan d'eau.
5. **Personnage géant du Profil remplacé** par une maison d'architecte ; l'idée de portrait passe par la fresque en façade et le buste du jardin. La tour-belvédère garde la silhouette la plus haute de l'île.
6. **Bouleaux à la place des arbres jaunes** (ancienne essence « automne ») ; une poignée de feuillus d'automne aux teintes adoucies reste pour la variété.
7. **Désaturation de 12 %** sur les aplats vifs du monde seulement ; l'interface et ses contrastes ne changent pas.
8. **Trois animations ajoutées** (le maximum demandé) : drapeau, girouette, eau des bassins. Les engrenages du Projet 2 restent fixes.
9. **Textes d'ambiance** dans la scène (plaques de rue, signalétique de Veolia) : génériques, sans rapport avec le contenu des projets.
10. **Budget vérifié sur les relevés versionnés** : le test lit les rapports des campagnes de capture, parce que Node ne peut pas rendre la scène.
11. **Captures V5 retirées de l'arbre** à la fin de la V6 (« seulement les captures de la version en cours ») ; les comparaisons avant/après utilisent des vues V5 refaites avec le mode photo (`docs/screenshots/v6/avant/`).
12. **`state.ts` non découpé** (voir phase 1).
13. **Mode photo et entrée directe dans un intérieur** ajoutés aux commandes de `?debug=1`, pour les captures.

## Reste à faire

- **Écrire le contenu** des stations, le CV et le contact (`src/content/`, voir `CONTENT.md`).
- **Mesurer sur de vrais appareils** (voir « Non vérifié ») et ajuster `FINE_DISTANCE` (`Buildings.tsx`) ou le nombre d'herbes si un téléphone peine.
- **Décider pour l'historique Git** (proposition ci-dessus) et pour l'endroit où ranger les captures des versions suivantes.
- **Relire la PR, puis merger** : rien n'est mergé dans `main`.
