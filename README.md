# CareerVerse — première version extérieure

Portfolio 3D de Yoan Viollet. Le cahier des charges V4 présent dans ce dossier a été lu intégralement. Cette version constitue une proposition fonctionnelle à valider visuellement par Yoan ; le monde n'est pas figé.

## Lancer le projet

Prérequis : Node.js 22.12+ et npm. Dans ce dossier :

```powershell
npm ci
npm run dev
```

Ouvrir l'adresse locale affichée par Vite (normalement http://127.0.0.1:5173). Les dépendances sont déjà installées dans le dossier de travail livré ; `npm ci` sert sur une nouvelle machine ou après extraction de l'archive. Ne pas ouvrir `index.html` par double-clic.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

Le build statique se trouve dans `dist/`. Aucun serveur applicatif, compte, clé API ou base de données n'est nécessaire. Aucun déploiement ni push Git n'a été effectué.

## Fonctionnalités réalisées

- Terrain continu avec collines, plateformes nivelées, pentes et terrasses. Boucle piétonne et chemins reliant les six entrées.
- Six architectures originales en géométrie procédurale : maison du Profil avec avatar humain ; pavillon vitré ; manufacture à sheds ; observatoire circulaire ; galerie voûtée ; bâtiment technique Veolia avec enseignes rouges et panneaux solaires.
- Arbres de plusieurs silhouettes, massifs, jardins, bancs, lampadaires, pergola, signalétique et sculpture centrale.
- Robot articulé, animation de marche, déplacement relatif à la caméra et collisions avec bâtiments, troncs, bancs, lampadaires et fontaine.
- Accueil montrant la vraie scène ; descente de caméra ; suivi amorti, orbite à la souris, zoom, évitement des volumes et du terrain.
- Plan illustré, panneaux cliquables et raccourcis vers les six parvis. Présentations provisoires et compteur de lieux découverts.
- Sur mobile : sélection des lieux et ouverture directe de leurs présentations depuis le plan.
- Qualité graphique manuelle, préférence de réduction des mouvements, gestion du focus dans les dialogues, fermeture par Échap.

## Commandes

| Action | Commande |
| --- | --- |
| Marcher | ZQSD, WASD ou flèches |
| Accélérer | Maj |
| Orienter la caméra | Cliquer-glisser dans le monde |
| Zoomer | Molette |
| Découvrir un lieu | E, près de l'entrée |
| Plan | M |
| Recentrer derrière le robot | C |
| Revenir sur la place | R |
| Fermer un dialogue | Échap |

## Organisation

| Fichier / dossier | Rôle |
| --- | --- |
| `src/world/config.ts` | Destinations, palette, points d'entrée, paramètres caméra et déplacements, futurs parcours |
| `src/world/terrain.ts` | Fonction de hauteur partagée par terrain et robot |
| `src/world/collision.ts` | Collisions, glissement, sous-pas et balayage caméra |
| `src/world/landscape.ts` | Placement intentionnel de la végétation et du mobilier |
| `src/scene/Terrain.tsx` | Sol, chemins et jardins |
| `src/scene/Buildings.tsx` | Les six modèles architecturaux |
| `src/scene/Environment.tsx` | Décor, végétation instanciée et mobilier |
| `src/scene/Robot.tsx` | Modèle et animation du robot |
| `src/scene/CameraRig.tsx` | Caméra aérienne, transitions et exploration |
| `src/scene/Controller.tsx` | Clavier, souris, déplacement et proximité |
| `src/scene/World.tsx` | Rendu, lumière, qualité et mesure FPS |
| `src/scene/Primitives.tsx` | Géométries et matériaux réutilisés, enseignes canvas |
| `src/state.ts` | État de la visite et navigation |
| `src/ui/` | Plan et dialogues accessibles au clavier |
| `src/App.tsx`, `src/style.css` | Interface et responsive |
| `tests/world.test.mjs` | Tests sur les véritables modules de calcul |

Pour modifier un projet, éditer sa fiche dans `config.ts`. Les huit stations narratives sont définies, avec contenu nul et statut `planned` : aucun résultat professionnel fictif n'est présenté. Un futur intérieur peut être chargé à partir de `interior.scene` lors de l'interaction, en remplaçant la présentation provisoire.

## Validation du 13 novembre 2026

- TypeScript et build de production : réussis.
- 10 tests automatisés réussis : entrées sûres, plateformes, continuité du relief, collisions et glissement, limite du monde, évitement caméra incluant le contact très proche d'un mur.
- Navigateur : accueil, transition, déplacement Z, collision avec fontaine et façade Veolia, rotation devant un bâtiment, plan, six destinations et six présentations vérifiés. Interaction E vérifiée au Profil.
- Inspection visuelle à 1920 × 1080, 2560 × 1440 et 1366 × 768. Navigation mobile testée à 390 × 844, notamment sélection Veolia et présentation.
- Bascule qualité légère / soignée vérifiée. Aucune erreur ou alerte dans les journaux console consultés.
- Corrections après inspection : bord du terrain, maillage des chemins sur les pentes, façade arrière Veolia, cadrage de suivi, lumière, contraste des éléments d'interface.
- Mesures instantanées observées dans le navigateur de test : environ 94–120 FPS sur plusieurs vues desktop. Ce sont des échantillons sur cet environnement, pas un benchmark soutenu ni une garantie sur d'autres appareils. Le mode `?debug` expose FPS, appels de rendu, triangles et coordonnées ; le panneau `?` montre également les FPS.

## Limites connues et prochaine phase

- Intérieurs volontairement absents. Projets majeurs et missions encore provisoires ; CV et coordonnées non intégrés.
- Collision du robot fondée sur des emprises conservatrices : on ne peut pas circuler dans les renfoncements des bâtiments. Le feuillage et les petits éléments décoratifs ne sont pas tous des volumes physiques.
- Très près d'un mur, la caméra peut se rapprocher jusqu'à une vue presque subjective pour éviter de traverser la façade. Le confort dans ces cas extrêmes reste à affiner avec les retours utilisateur.
- Relief exprimé par une surface continue : pas de saut, de pont franchissable ni d'escalier doté d'une physique distincte.
- Les vérifications ne constituent pas un parcours exhaustif de chaque recoin ni des tests sur un vrai téléphone. Pas de validation Safari/Firefox ou GPU d'entrée de gamme.
- Réduction de qualité manuelle, pas d'adaptation automatique ni de LOD des bâtiments. La végétation est instanciée et les matériaux sont partagés.
- Vite signale un chunk Three.js supérieur à 500 ko (environ 719 ko brut / 189 ko gzip). Le moteur 3D est chargé séparément ; l'avertissement n'empêche pas le build.
- Les polices DM Sans et Manrope sont chargées via Google Fonts, avec repli sans-serif en absence de réseau. Les modèles et les enseignes n'exigent aucun téléchargement externe.
- En cas d'échec WebGL, le plan et les présentations restent accessibles. L'écran de chargement mériterait une gestion de progression plus fine pour une publication finale.

## Références et ressources

Bruno Simon a été observé dans le navigateur, notamment pour les volumes et l'exploration. SIT, Henry Heffernan et Jesse Zhou ont été consultés, avec accès textuel limité à leurs scènes interactives. Landfall et Foliofarer n'étaient pas accessibles à la consultation. Aucun code, modèle ou texture de ces références n'a été copié. Le nom Veolia est une enseigne textuelle, sans logo officiel.

Les captures de validation accompagnent l'archive. La validation artistique finale appartient à Yoan.
