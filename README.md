# CareerVerse — itération V2

Portfolio 3D de Yoan Viollet, développé sur le dépôt existant. Branche de travail : `feature/careerverse-v2`. Le CDC V4 est conservé ; les nouvelles exigences V2 priment pour la caméra, la ville, le bâtiment-avatar et les intérieurs. La direction artistique reste soumise à la validation de Yoan.

## Lancer

Node.js 22.12+ et npm :

```powershell
npm ci
npm run dev
```

Ouvrir l’URL Vite avec le chemin `/book3D-carreer/`. Les dépendances sont déjà installées dans le dossier de travail. Ne pas ouvrir `index.html` directement.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

Le build statique se trouve dans `dist/`. La base Vite `/book3D-carreer/` et le workflow GitHub Pages sont conservés. Aucun backend ni compte requis. Aucun push, déploiement ou merge automatique dans `main`.

## Ce qui change

- Caméra extérieure : recherche de positions à distance confortable autour du robot, élévation de secours, amortissement et balayage du corps de caméra avec glissement contre les obstacles. Le rayon de visibilité ne sert plus à rabattre la caméra sur le personnage. Distance cible minimale : 9 unités ; zoom manuel entre 10 et 19.
- Suppression des deux dégradés blancs de la barre supérieure et du brouillard Three.js. Petits fonds locaux sous les commandes.
- Urbanisme asymétrique : deux rues sinueuses, montée vers les ateliers, traverses, parvis, placette rectangulaire, relief continu et plantations par groupes. Le plan utilise le même réseau de chemins que la scène.
- Six silhouettes refaites : maison-portrait humaine monumentale, pavillon de verre à étages décalés, fabrique voûtée et roue mécanique, observatoire à plateformes, galerie à toitures pliées, installation Veolia à deux cuves et tuyauteries rouges.
- Robot : accélération/freinage, transfert de poids, course inclinée, balancement, attente et réaction gestuelle aux stations/portes.
- Navigation : A* favorisant les rues, trajet visible du robot, suivi de caméra, possibilité de passer et préférence de réduction des mouvements. Les 30 liaisons orientées entre les bâtiments font l’objet de tests de collision.
- Six portes animées et six scènes intérieures réellement explorables. Franchissement du seuil, bref fondu de raccord, reprise du contrôle et retour au parvis.
- Profil : quatre stations scénographiées, sculptures, écrans, éclairage d’activation, progression mémorisée durant la session et lecture à la demande.
- Autres lieux : huit stations provisoires chacun, intérieurs thématiques partageant la même logique. Aucun résultat ou projet professionnel inventé.
- Sur mobile : plan, fiches et lecture des stations sans clavier. Dans les intérieurs, les boutons de stations et de sortie permettent également une visite guidée.

## Commandes

| Action | Commande |
|---|---|
| Marcher | ZQSD, WASD ou flèches |
| Courir | Maj |
| Regarder | Glisser sur la scène |
| Zoom extérieur | Molette |
| Entrer / lire une station / sortir près du seuil | E |
| Plan | M |
| Recentrer | C |
| Revenir à la place | R |
| Fermer une lecture ou un panneau | Échap |
| Trajet guidé | Plan ou destinations latérales |
| Parcours intérieur guidé | Numéros des stations / Rejoindre la sortie |

Le retour par R et le bouton de vue aérienne sont des réinitialisations explicites. Le saut d’un trajet est réservé au bouton « Passer » et au mode de réduction des mouvements.

## Organisation du code

- `src/world/config.ts` : destinations, dimensions, palette et réglages généraux.
- `src/world/terrain.ts`, `urban.ts`, `landscape.ts` : relief, rues et plantations.
- `src/world/collision.ts`, `camera.ts`, `navigation.ts` : obstacles, caméra physique et itinéraires.
- `src/world/narrative.ts` : contenu des stations, positions et collisions intérieures.
- `src/scene/Buildings.tsx` : six architectures et portes coulissantes.
- `src/scene/Interior.tsx` : scénographie, objets exposés et écrans réactifs.
- `src/scene/Transitions.tsx` : trajets et raccords extérieur/intérieur.
- `src/scene/Controller.tsx`, `Robot.tsx`, `CameraRig.tsx` : commandes, animation procédurale et cadrage.
- `src/state.ts` : état de visite, progression, actions et transitions.
- `src/ui/` : plan, dialogues accessibles et navigation intérieure.
- `tests/world.test.mjs` : tests exécutés sur les vrais modules TypeScript transpiles temporairement.

Pour ajouter du contenu, modifier `stationsFor()` dans `narrative.ts`. Les titres des projets, leurs descriptions et leur signalétique restent configurables dans `config.ts`. Les huit étapes projet sont prêtes à recevoir des contenus validés.

## Limites assumées

Les cinq parcours hors Profil sont des bases visitables, pas des études de cas finalisées. Le Profil présente une introduction éditoriale : les détails du CV, documents téléchargeables, dates et preuves doivent encore être fournis ou validés.

Les intérieurs sont des espaces scénographiques séparés, agrandis pour la lecture ; ils ne reproduisent pas au centimètre le volume extérieur. Ils partagent un plan de circulation, avec des décors thématiques différents. Le fondu au seuil masque le changement de scène.

Les collisions extérieures utilisent des volumes conservateurs ; certains renfoncements visuels ne sont pas praticables. Le champ de caméra peut temporairement être masqué pendant un contournement. La validation visuelle humaine reste nécessaire, notamment pour les mouvements rapides près des angles.

Les trajets suivent une grille fine pondérée par les rues : leurs changements de direction sont amortis visuellement mais ce n’est pas une simulation de navigation de foule. Un trajet bloqué est interrompu proprement avec un message.

Les polices Google nécessitent une connexion ; une police système prend le relais hors ligne. Three.js produit un avertissement de taille de chunk au build. Qualité manuelle disponible dans les réglages. Les FPS affichés sont une mesure instantanée locale, pas une garantie de 60 FPS sur tous les appareils.

Voir `artifacts/VALIDATION_V2.md` pour les contrôles et captures effectués.
