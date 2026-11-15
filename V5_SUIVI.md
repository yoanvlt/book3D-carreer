# CareerVerse V5 — suivi et vérifications

Date : 14 novembre 2026. Base : `main` au commit `66e9243` (V4 + brief V5). Une seule branche de travail, celle qu'impose l'environnement de session : `claude/careerverse-v4-refactor-7f688a`. Aucun merge dans `main`, aucun déploiement.

Le brief annonçait `docs/v5-brief/` ; il est en réalité à la racine, dans `careerverse-v5-brief/`. Je l'ai utilisé tel quel, sans le déplacer.

## Déroulé

| Étape        | Commit             | Résumé                                                                                          |
| ------------ | ------------------ | ----------------------------------------------------------------------------------------------- |
| 0            | `b524abc`          | Prototype appliqué, temps morts V4 mesurés (`scripts/temps-morts.mjs`).                         |
| 1a           | `20cef9e`          | Temps morts réduits, chaque séquence passable.                                                  |
| 1b-1c        | `43c2cff`          | Vecteur d'entrée, joystick analogique, toucher pour aller, caméra portrait, départ, glissement. |
| 1d           | `43c2cff`          | Saut, poussière, inclinaison, regard.                                                           |
| 2a + 2e      | `8e26a33`          | Nuages instanciés et filtrés ; contours chargés à la demande.                                   |
| 2b + 2d      | `b9c58bf`          | Fontaine, oiseaux, petits robots, feuillage ; arbres gênants tramés ou masqués.                 |
| 2c           | `e14dc44`          | Son.                                                                                            |
| 2g           | `b50abca`          | Intérieurs plus denses, socles et écrans corrigés.                                              |
| 2f           | `728ed77`          | Points de l'audit sur l'accueil, monogramme YV.                                                 |
| 3            | `f2ca66f`          | Passeport, visite guidée, carte de fin.                                                         |
| 4a           | `2e0bee1`          | Aperçu de partage, Open Graph, favicon.                                                         |
| 4b           | `a1a6dcf`          | Densité de pixels adaptative, captures en WebP.                                                 |
| Vérification | `d75c224` à la fin | README, temps morts, correctifs trouvés pendant la vérification, captures, ce document.         |

## Choix faits sans te consulter

1. **Contours plutôt qu'occlusion ambiante.** Le contour est tiré de la seule profondeur (`scene/Effects.tsx`) : une passe plein écran, sans passe de normales et sans draw call supplémentaire. L'effet est net à l'écran, même en rendu logiciel, et colle au style maquette dessinée. N8AO, mesuré dans l'audit, était à peine visible et pesait 155 ko gzip dans le chunk de la scène, même en qualité Légère. La bibliothèque `postprocessing` seule pèse 13 ko gzip et n'est chargée qu'en qualité Soignée. Les tampons sont en demi-flottant : en 8 bits, les couleurs claires viraient au jaune, ce que j'ai mesuré au pixel près (sol du Profil : 249,207,161 sans effet, 240,240,179 en 8 bits, 249,207,161 en demi-flottant). `@react-three/postprocessing` et `n8ao` sont désinstallés.
2. **Durées.** Le trajet automatique suit l'itinéraire en un temps fixé (5,2 s au plus), avec accélération et freinage. La porte dure 1,8 s pour entrer. Pour sortir de loin, un fondu au seuil remplace la marche : 1,97 s depuis la station la plus éloignée. La présentation enchaîne deux vues en 3,2 s puis un retour de 0,8 s. La visite guidée garde les quatre vues, 8 s par lieu.
3. **Passer une séquence** : Espace, Entrée, E, un clic ou un toucher sur la scène, ou le bouton « Passer ». Pendant une marche « toucher pour aller », un nouveau toucher redirige au lieu de passer. En mouvement réduit, les trajets restent instantanés, les présentations en pose fixe ; la visite guidée enchaîne alors les poses fixes toute seule.
4. **Départ en (-17, 6)**, face au poteau indicateur puis à la place. Autres missions occupe 7 % de l'écran au lieu de 29 % (mesure par projection, test).
5. **Toucher pour aller** aussi à la souris : un clic sans glisser fait marcher, un glisser tourne la caméra. Toucher un bâtiment y conduit. Une marche courte ne grise plus l'en-tête et n'affiche pas la barre « En route ».
6. **« Explorer la ville » aussi sur téléphone** maintenant que l'on peut y marcher. Le plan reste accessible.
7. **Salle intérieure raccourcie** : 22 × 26 au lieu de 22 × 36, stations adossées aux murs en rangées de 5 unités. Le nombre de stations ne change pas (4 et 8, `CONTENT.md` intact). L'emprise de collision d'une station couvre le socle et l'écran.
8. **Sons de synthèse** (`scripts/sons.py`) : création originale sous CC0 plutôt que des fichiers de banques en ligne. Sept fichiers, 92 ko.
9. **Nuages** : positions tirées une fois, puis filtrées avec la caméra d'accueil réelle sur les quatre écrans de contrôle. Ils ne font qu'osciller sur place (± 2,5 unités) pour que le filtre reste valable : la rotation d'ensemble du prototype est abandonnée.
10. **Arbres gênants** : transparence tramée (`alphaHash`) par instance pour un arbre sur la ligne de vue (35 %), disparition complète pour un arbre qui couvre l'écran au premier plan.
11. **Logo** : monogramme « YV » aux couleurs des tokens, puis le nom tiré de `site.md`. Le favicon reprend le monogramme.
12. **Passeport** : un tampon s'obtient en entrant dans un lieu. La visite guidée n'en donne pas : elle montre les lieux, elle ne les visite pas.
13. **Carte de fin** : elle s'ouvre une fois, quand le sixième tampon est obtenu. Elle reste masquée tant que `site.md` n'a ni CV ni contact, ce qui est le cas aujourd'hui. Le contenu d'essai a un e-mail fictif pour pouvoir la vérifier.

### Tests

50 tests (37 en V4).

- 13 nouveaux tests dans `tests/v5.test.mjs` :
  - durées maximales de trajet, d'entrée, de sortie et de présentation ;
  - passage des séquences ;
  - vecteur d'entrée et saut ;
  - toucher pour aller ;
  - caméra portrait ;
  - départ ;
  - glissement le long d'un bâtiment et des bancs tournés ;
  - nuages ;
  - passeport, avec un stockage bloqué ou corrompu ;
  - carte de fin ;
  - visite guidée.
- Tests V3 et V4 adaptés à la salle raccourcie. Les vérifications sont les mêmes ; seules les coordonnées dérivent maintenant de `ROOM` et de `INTERIOR_CAMERA`. Concrètement : points de départ des itinéraires intérieurs, bornes et rayon de la caméra intérieure (7,5 au lieu de 9), colonnes Veolia et première rangée de stations.

### Dépendances

- Ajoutée (production, chargée à la demande en qualité Soignée) : `postprocessing`.
- Retirées : `@react-three/postprocessing`, `n8ao` (apportées par le prototype).
- `PerformanceMonitor` vient de drei, déjà présent.

## Méthode de vérification

Chromium headless (Playwright), WebGL **rendu par le processeur (SwiftShader)**. Les captures, les draw calls et la logique sont fiables. **Les FPS relevés ici (1 à 12) ne comptent pas** : ils ne disent rien d'un vrai GPU.

Pour la même raison, les durées sont mesurées en temps simulé, à 60 images par seconde, avec le vrai code de déplacement (`scripts/temps-morts.mjs`). Dans le navigateur logiciel, le pas de temps plafonné ralentit le temps simulé : une mesure y serait fausse.

Scripts versionnés :

- `npm run capture -- scenes <dossier>` : accueil, exploration, porte, intérieur, aux quatre tailles.
- `npm run capture -- portes <dossier>` : six portes, une station lue par lieu, passeport et carte de fin.
- `node scripts/capture-interface.mjs <dossier>` : plan, aide, présentation, lecture, fiche mobile, version texte.
- `node scripts/capture-tactile.mjs <dossier>` : parcours tactile avec de vrais événements tactiles (CDP).
- `node scripts/capture-visite.mjs <dossier>` : visite guidée de bout en bout.
- `node scripts/capture-apercu.mjs` : image de partage.

## Temps morts, avant et après

Temps simulé à 60 Hz, depuis le départ de chaque version (`docs/screenshots/v5/temps-morts-*.md`).

| Action                                    |      V4 (avant) |       V5 (après) | Cible |
| ----------------------------------------- | --------------: | ---------------: | ----: |
| Trajet automatique, pire cas (Projet 3)   |         11,68 s |           5,22 s | ≤ 6 s |
| Trajet vers Veolia                        |         10,70 s |           5,22 s | ≤ 6 s |
| Entrer (E jusqu'à la main rendue)         |   5,08 à 5,45 s |           1,80 s | 2,5 s |
| Sortir depuis la station la plus éloignée | 11,43 à 11,65 s |           1,97 s |   2 s |
| Présentation                              |  9,10 à 10,60 s | 4,00 s, passable |   4 s |

L'audit relevait 16,3 s, 8,3 s et 5,9 s sur un vrai GPU, au-dessus de mes valeurs V4 : il partait d'un autre point, cadence plus basse, avec le temps de réaction. Le test `v5.test.mjs` vérifie aussi le trajet depuis chaque entrée vers chaque lieu (≤ 6 s) et la sortie depuis chacune des 44 stations (≤ 2 s).

## Vu à l'écran

Toutes les captures sont dans `docs/screenshots/v5/` (WebP). Chaque campagne écrit aussi son rapport (état du jeu, draw calls, erreurs de console). **Aucune erreur de console** dans aucune campagne.

### Scènes, contenu réel, qualité Soignée

`accueil`, `exploration`, `porte`, `interieur` aux tailles 1920×1080, 1440×900, 1366×768 et 390×844 (16 vues, `rapport-scenes.json`).

Draw calls, toutes passes comprises (ombres et contours) :

| Taille    | Accueil | Exploration | Porte | Intérieur |
| --------- | ------: | ----------: | ----: | --------: |
| 1920×1080 |     223 |         197 |   180 |        88 |
| 1440×900  |     223 |         191 |   179 |        87 |
| 1366×768  |     223 |         196 |   180 |        88 |
| 390×844   |     223 |         155 |   149 |        80 |

Vu : le titre de l'accueil ne touche plus l'île ; les nuages laissent libres le pied de l'île et le titre ; au départ, le robot fait face à la place et au poteau ; l'arbre devant la porte du Profil est masqué au lieu de faire une tache ; les contours dessinent les volumes sans changer les couleurs. Sur téléphone, joystick et bouton de saut ne recouvrent ni la carte du lieu ni le titre.

### Points de l'audit V4

| Point                                                | Correction                                                | Où le voir                                                                                |
| ---------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| « marcher » collé au badge `E`                       | marges des touches de l'aide clavier                      | `accueil-1440x900.webp`                                                                   |
| Titre qui touche l'île à 1440 px                     | titre plus petit, caméra d'accueil décalée                | `accueil-1440x900.webp`                                                                   |
| Autres missions couvre un tiers de l'écran au départ | départ face à la place, 7 % de l'écran                    | `exploration-*.webp`                                                                      |
| Tache jaune de l'arbre translucide                   | arbre masqué au premier plan, tramé sur la ligne de vue   | `porte-*.webp`                                                                            |
| Écrans des stations qui se chevauchent               | stations adossées aux murs, écrans tournés vers le centre | `contenu-essai/interieur-*.webp`                                                          |
| Robot qui traverse le socle                          | emprise de collision socle et écran                       | test `v5.test.mjs`, `contenu-essai/`                                                      |
| Plante en cubes                                      | feuillage en boules                                       | `contenu-essai/interieur-*.webp`                                                          |
| Armoires en blocs bruns                              | bibliothèques ouvertes avec livres                        | `interieur-*.webp`                                                                        |
| « Bientôt » minuscule                                | panneau 7 × 1,4 au mur du fond                            | vu pendant la mise au point ; le mur du fond est hors champ dans les captures versionnées |
| Logo grisé à l'intérieur                             | monogramme YV toujours à pleine opacité                   | `interieur-*.webp`                                                                        |
| Salle trop vide (22 × 36)                            | 22 × 26, mobilier et suspensions                          | `interieur-*.webp`                                                                        |
| Aucun contrôle tactile                               | joystick, saut, toucher pour aller                        | `tactile/`                                                                                |

### Contenu d'essai (`contenu-essai/`)

Mêmes scènes en 1440×900 et 390×844 avec le contenu de `tests/fixtures/contenu-essai/`, plus une lecture de station. Les écrans des stations sont adossés aux murs, lisibles et ne se chevauchent plus ; le robot reste devant le socle.

### Six portes (`portes/`, qualité Légère, contenu d'essai)

Pour chaque lieu : entrée, lecture de la première station (`step-0`), sortie. Les six réussissent. Le passeport finit avec six tampons, la carte de fin s'ouvre une fois, après la fermeture de la dernière lecture (`fin-de-visite-1440x900.webp`). Draw calls en qualité Légère : 53 à 70 à l'intérieur, 57 à 106 à l'extérieur.

| Lieu            | Intérieur | Extérieur |
| --------------- | --------: | --------: |
| Profil          |        53 |       100 |
| Projet 1        |        70 |        60 |
| Projet 2        |        69 |        57 |
| Projet 3        |        70 |        58 |
| Autres missions |        69 |       106 |
| Veolia          |        70 |        84 |

### Interface (`interface/`)

Plan et aide (1440×900), présentation de Veolia, lecture d'une station, plan et fiche d'un lieu sur téléphone, version texte aux deux tailles. Sur le vrai contenu, les stations sont vides : la lecture ne s'ouvre pas, ce qui est voulu. La lecture est donc capturée sur le contenu d'essai.

### Parcours tactile (`tactile/`, 390×844)

Vrais événements tactiles envoyés par le protocole Chrome (`hasTouch`), pas de clavier simulé :

- joystick tiré vers le haut : le robot avance de 15,45 unités ;
- bouton de saut : 0,25 unité de hauteur au moment du relevé ;
- toucher le sol : le robot y marche, 7,79 unités parcourues ;
- aucune erreur.

### Visite guidée (`visite/`)

Lancée depuis l'accueil, elle passe par les six lieux dans l'ordre et revient à l'exploration, sans erreur. En temps réel logiciel, elle a pris 406 s, parce que SwiftShader rend 1 à 12 images par seconde et que le pas de temps est plafonné. En temps simulé, elle dure 6 × (8 + 0,8) s, soit environ 53 s : la caméra passe d'un lieu à l'autre sans trajet du robot. C'est la minute annoncée.

## Non vérifié

- **Fluidité sur un vrai GPU** : aucune mesure de FPS n'est valable ici. À mesurer sur un portable moyen en qualité Légère et sur un téléphone récent.
- **Tactile sur un vrai téléphone** : la sensation du joystick, la zone morte et le bouton de saut sous le pouce.
- **Animations en temps réel** : balancement des arbres, oiseaux, jets de la fontaine, poussière des pas. Je les ai vues sur des images fixes, pas en mouvement fluide.
- **Son audible** : les fichiers se chargent et se jouent sans erreur, mais personne ne les a écoutés dans ce conteneur. Volume et équilibre à régler à l'oreille.
- **Firefox et Safari** : seul Chromium a été lancé.
- **Écrans 2560×1440 et plus**, et les tablettes en paysage.
- **Lecteurs d'écran** : les noms accessibles des boutons ont été vérifiés dans le code, pas avec NVDA ou VoiceOver.
- **Aperçu de partage** : les balises Open Graph et Twitter sont en place et l'image fait 1200×630, mais l'aperçu réel sur LinkedIn ou Slack dépend de l'adresse publique, donc du déploiement.
- **Densité de pixels adaptative** : `PerformanceMonitor` baisse bien la densité sous SwiftShader (0,75 en Légère). Son comportement sur un vrai GPU reste à observer.

## Alléger l'historique Git (proposition, rien n'est fait)

L'historique pèse 18 Mo, dont 13,3 Mo pour 53 captures PNG (`docs/screenshots/v4/`, 12 Mo dans l'arbre actuel). Les captures V5 sont en WebP : 1,2 Mo pour les 16 vues principales.

Sans réécrire l'historique :

1. Garder le WebP pour toutes les nouvelles captures (déjà en place).
2. Convertir `docs/screenshots/v4/*.png` en WebP et supprimer les PNG de l'arbre. Le dépôt cloné reste aussi lourd, mais l'arbre de travail s'allège.
3. Pour les campagnes suivantes, publier les captures en pièce jointe d'une Release GitHub, ou les garder dans un dossier ignoré par Git, plutôt que dans le dépôt.

En réécrivant l'historique (seulement avec ton accord : irréversible pour les copies existantes, force-push sur toutes les branches) :

```bash
pip install git-filter-repo
git clone --mirror https://github.com/yoanvlt/book3D-carreer.git book3d-mirror
cd book3d-mirror
git filter-repo --path-glob 'docs/screenshots/**/*.png' --invert-paths
git push --force --mirror
```

Gain attendu : environ 13 Mo sur 18. À prévoir : tout clone existant doit être recloné ; les anciens commits changent d'identifiant ; les liens vers d'anciennes captures cassent. Les références des pull requests fermées gardent les anciens objets jusqu'au nettoyage de GitHub.

## Reste à faire

- **Contenu** : écrire les stations dans `src/content/` (voir `CONTENT.md`). Tant qu'elles sont vides, les intérieurs affichent « Bientôt » et la lecture ne s'ouvre pas.
- **CV et contact dans `site.md`** : la carte de fin reste masquée sans eux.
- **Tester sur de vrais appareils** : un portable moyen, un téléphone Android et un iPhone. Voir la liste « Non vérifié ».
- **Écouter les sons** et ajuster leur volume si besoin (`scripts/sons.py`).
- **Décider pour l'historique Git** : voir la proposition ci-dessus. Rien n'est fait sans ton accord.
- **Merge et déploiement** : la branche `claude/careerverse-v4-refactor-7f688a` est prête à relire. Rien n'est mergé dans `main`, rien n'est déployé.
