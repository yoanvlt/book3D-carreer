# CareerVerse — itération V3

Portfolio 3D de Yoan Viollet. Cette itération conserve la ville, les six architectures et les contenus V2 ; elle porte sur les présentations, les transitions et la fiabilité des interactions.

Branche : `feature/careerverse-v3-cinematics`. Le [CDC V4](CareerVerse_Cahier_des_Charges_V4.md) est conservé. La validation graphique de Yoan reste nécessaire.

## Installation et lancement

Node.js 22.12+ et npm :

```powershell
npm ci
npm run dev
```

Ouvrir l’URL affichée par Vite, avec le chemin **/book3D-carreer/**. Ne pas ouvrir directement index.html.

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

Le build est généré dans `dist/`. La base Vite et le workflow GitHub Pages existants sont préservés. Aucun backend, nouvelle dépendance, merge dans main ou déploiement n’est nécessaire pour tester cette version.

## V3 implémentée

- Deux actions devant chaque porte : **Découvrir le bâtiment** et **Entrer**.
- Six présentations architecturales configurées individuellement, de 7,5 à 9 secondes, suivies d’un retour de caméra. Possibilité de passer, revenir ou enchaîner sur l’entrée.
- Présentation statique en réduction des mouvements ; cadrage adapté au rapport largeur/hauteur. Prévisualisation 3D depuis les fiches mobiles et retour aux contenus sans clavier.
- Transitions de porte explicites : approche, ouverture, franchissement, raccord de 280 ms, émergence, fermeture. Les deux côtés de la porte partagent la même progression.
- Actions concurrentes verrouillées pendant les transitions. Échap interrompt un trajet ou termine une présentation ; le franchissement d’une porte reste atomique.
- Stations détectées dans de larges zones de circulation, avec une seule station active. Les quatre stations Profil sont accessibles depuis l’allée centrale.
- Navigation intérieure calculée autour des socles, plantes et structures. Collisions des socles augmentées du rayon du robot.
- Trajets guidés avec accélération, freinage final, ralentissement aux virages, orientation d’arrivée progressive et annulation.
- Caméra intérieure : contournement du robot lors des demi-tours plutôt qu’interpolation directe à travers sa position. Commandes clavier orientées selon la caméra effective.
- Robot : inclinaison liée à l’accélération, transfert de poids en virage, gestes amortis et regard vers le bâtiment présenté.
- Retour aérien animé conservant la position du robot ; sélection d’une destination depuis l’accueil après la descente de caméra.

## Commandes

| Action                                                            | Commande                     |
| ----------------------------------------------------------------- | ---------------------------- |
| Marcher                                                           | ZQSD, WASD ou flèches        |
| Courir                                                            | Maj                          |
| Regarder                                                          | Cliquer-glisser sur la scène |
| Zoom extérieur                                                    | Molette                      |
| Présenter le bâtiment proche                                      | V ou Découvrir le bâtiment   |
| Entrer / lire une station / sortir au seuil                       | E                            |
| Plan                                                              | M                            |
| Recentrer la caméra                                               | C                            |
| Revenir à la place ; dans un intérieur, rejoindre la sortie       | R                            |
| Fermer un panneau / terminer une présentation / annuler un trajet | Échap                        |
| Parcours intérieur guidé                                          | Numéros des stations         |
| Sortie depuis une station                                         | Rejoindre la sortie          |

Les trajets peuvent être passés explicitement. Le mode de réduction des mouvements les passe automatiquement. Sur mobile, utiliser le plan et les fiches ; la marche au clavier n’est pas exigée.

## Organisation

| Module                                    | Responsabilité                                                                         |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `src/state.ts`                            | Actions gardées, phase exclusive, progression et demande d’entrée après présentation   |
| `src/world/motion.ts`                     | Unique contrôleur de déplacement automatique et séquence des portes                    |
| `src/world/cinematics.ts`                 | Plans architecturaux locaux, adaptation au format, interpolation et liaisons de caméra |
| `src/world/camera.ts`                     | Recherche de cadrages, balayage extérieur, déplacements intérieurs                     |
| `src/world/narrative.ts`                  | Textes existants, zones narratives, collisions et routes intérieures                   |
| `src/world/navigation.ts`                 | Itinéraires extérieurs A* existants                                                    |
| `src/scene/CameraRig.tsx`                 | Accueil, suivi, descente, retour aérien et raccords de scènes                          |
| `src/scene/CinematicCamera.tsx`           | Présentation et retour à la pose sauvegardée                                           |
| `src/scene/Transitions.tsx`               | Exécution du contrôleur automatique avant le clavier et la caméra                      |
| `src/scene/SlidingDoor.tsx`               | Porte commune aux scènes extérieure et intérieure                                      |
| `src/scene/Buildings.tsx`, `Interior.tsx` | Architectures préservées et scénographie des stations                                  |
| `src/ui/BuildingPresentation.tsx`         | Commandes et légende architecturale                                                    |
| `tests/*.test.mjs`                        | Tests des vrais modules TypeScript, transpilés temporairement dans .cache              |

Les bâtiments se configurent dans `config.ts`, les trajectoires dans `cinematics.ts`, les contenus dans `narrative.ts`. Aucun contenu professionnel n’a été ajouté ou inventé.

## Vérification et limites

Voir [V3_SUIVI.md](V3_SUIVI.md) pour le diagnostic, les modes de caméra, les transitions, les tests et la campagne visuelle restante.

Les tests automatisés, TypeScript et le build doivent passer. Le démarrage et la réponse HTTP du serveur Vite ont été vérifiés. **Aucune validation visuelle V3 dans un navigateur, capture Full HD/QHD, mesure FPS ou inspection de console WebGL n’a été possible dans cette session : l’outil navigateur était indisponible.** Les contrôles géométriques aux quatre rapports d’écran ne remplacent pas cette validation.

Les cinq parcours hors Profil restent provisoires. Les intérieurs sont des espaces scénographiques séparés, agrandis pour la lecture. Les collisions extérieures utilisent des enveloppes conservatrices ; leur vérification ne prouve pas l’absence d’occultation par chaque feuille ou détail décoratif. Un bref raccord coloré couvre le changement de scène au seuil.

Les polices Google ont une police système de secours. La qualité graphique reste réglable manuellement. Le build signale le poids du chunk Three.js ; aucune performance de 60 FPS n’est revendiquée.
