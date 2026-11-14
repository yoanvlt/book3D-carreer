# CareerVerse V3 — suivi technique et validation

Date : 14 novembre 2026. Base inspectée : `main`, commit `89198c3` (fusion V2). Travail sur `feature/careerverse-v3-cinematics`. Aucun merge ni déploiement.

## Diagnostic initial

Le CDC V4 a été lu intégralement. L’architecture V2, les composants de scène, les contrôles, les données narratives et la configuration de publication ont été inspectés avant modification.

Deux défauts ont été reproduits par exécution des modules V2 :

1. **Détection des stations** : à x = 0 dans l’allée, aucune des 4 stations Profil ni des 8 stations de chaque autre intérieur ne satisfait le rayon de 3,3 unités. Les écrans sont placés à x = ±5 ou ±6.
2. **Transition écrasée** : après le changement de scène au milieu d’une entrée, appeler guideExit fait passer la phase de doorway à travel. La commande ne vérifiait pas l’état de transition.

Autres corrections motivées par l’inspection du code : routes intérieures constituées de segments fixes non validés, socles sans marge de collision du robot, skipJourney sans garde de phase, caméra de déplacement et clavier pouvant utiliser des orientations différentes. Les tests V3 vérifient ces chemins d’exécution.

Les anomalies visuelles signalées de toiture, de textes ou d’occultation occasionnelle **n’ont pas été reproduites dans un navigateur**. Elles ne sont pas déclarées corrigées.

## Propriété des mouvements

Une seule phase possède le robot et la caméra à un instant donné. Les actions publiques contrôlent la phase avant de démarrer. Un deuxième clic pendant un franchissement, une présentation ou un trajet ne remplace pas son propriétaire.

| Phase              | Mode de caméra | Robot              | Fin                            |
| ------------------ | -------------- | ------------------ | ------------------------------ |
| home               | aerial         | immobile           | entrer ou destination          |
| entering           | arrival        | immobile           | finishArrival                  |
| explore, extérieur | exterior       | Controller         | action explicite               |
| explore, intérieur | interior       | Controller         | action explicite               |
| travel             | guided         | tickMotion         | arrivée, annulation ou passage |
| showcase           | presentation   | position conservée | fin, Échap ou bouton           |
| returning          | return         | position conservée | finishPresentation             |
| doorway            | door           | tickMotion         | fermeture après dégagement     |
| homing             | homeward       | position conservée | retour accueil                 |

Ordre des callbacks R3F : Transitions à -3, Controller à -2, caméra à -1. CameraRig rend la main à CinematicCamera pendant showcase et returning. Le mode diagnostique `?debug=1` indique phase, mode, étape de porte et positions.

Le retour aérien conserve le lieu du robot. Une destination sélectionnée depuis l’accueil attend la descente de caméra avant de commencer le trajet. R reste une action explicite de retour à la place ; depuis un intérieur, R rejoint la sortie.

## Présentations

Les compositions se configurent dans `src/world/cinematics.ts`, en coordonnées locales du bâtiment : déplacement latéral, altitude, recul frontal et hauteur visée. Les quatre poses diffèrent selon l’architecture.

| Lieu            | Durée de présentation | Intention                                      |
| --------------- | --------------------: | ---------------------------------------------- |
| Profil          |                 8,5 s | révéler la silhouette et prendre de la hauteur |
| Projet 1        |                   8 s | travelling sur les volumes décalés             |
| Projet 2        |                   8 s | structure voûtée et roue mécanique             |
| Projet 3        |                   9 s | ascension vers le dôme                         |
| Autres missions |                 7,5 s | parcourir les modules de galerie               |
| Veolia          |                 8,5 s | cuves, réseaux et façade rouge                 |

Le retour dure 1,6 s. Les interpolations quintiques s’arrêtent en douceur aux poses. Les liaisons sont vérifiées par échantillonnage contre les volumes de collision et le relief. Si une liaison directe est obstruée, le trajet passe au-dessus des enveloppes architecturales. La caméra sauvegarde position, orientation, champ de vision et décalage de projection ; un retour interrompant une présentation ne repart pas d’un champ de vision arbitraire.

Le cadrage s’élargit en portrait. Le mode de réduction des mouvements affiche une pose statique et attend une action, sans rotation prolongée. Depuis une fiche mobile, « Lire le parcours » retrouve les textes plutôt que d’exiger une marche au clavier.

## Séquence de porte

| Étape    | Comportement                                            |    Durée |
| -------- | ------------------------------------------------------- | -------: |
| approach | route vérifiée jusqu’au seuil ; orientation progressive | variable |
| opening  | ouverture commune aux deux scènes                       |   0,60 s |
| crossing | franchissement du couloir aligné                        |   1,35 s |
| handoff  | raccord coloré et changement de scène au milieu         |   0,28 s |
| emerging | déplacement visible vers une position dégagée           |   1,35 s |
| closing  | fermeture après dégagement complet                      |   0,55 s |

Le fondu coloré atteint son maximum pendant le changement de scène ; ce n’est pas une continuité géométrique entre les deux volumes. Les intérieurs V2 restent des scènes distinctes. Le franchissement ne peut pas être annulé à mi-seuil : les autres commandes sont suspendues jusqu’à sa fin.

Seul le couloir aligné de la porte contourne volontairement l’enveloppe solide du bâtiment. Les déplacements d’approche utilisent les collisions ordinaires. En sortie, le robot regarde selon la rotation de la façade et rejoint exactement l’arrivée extérieure sûre.

## Stations, caméra et robot

- Bandes narratives de ±2,5 unités dans le sens de circulation et portée transversale adaptée à l’allée. Un score et une petite hystérésis sélectionnent un seul écran.
- Pour les stations en vis-à-vis, le centre sélectionne un côté de manière déterministe ; un déplacement latéral ou le bouton numéroté permet de rejoindre l’autre.
- Les routes intérieures utilisent une grille et contrôlent chaque segment, puis suppriment les détours inutiles lorsque la ligne directe est libre.
- Les collisions incluent la marge du robot autour des socles, les plantes, les montants et les équipements Veolia.
- La caméra intérieure cherche une cible à neuf unités ; pendant certains demi-tours, elle utilise un arc de six à huit unités pour rester dans la salle sans passer sur le robot. Ses limites latérales gardent aussi une marge par rapport aux cuves Veolia.
- L’hystérésis extérieure préfère une position stable tout en autorisant une rotation manuelle volontaire. Le clavier utilise la direction effective de la caméra.
- Le contrôleur automatique accélère et ralentit, amortit les orientations et termine le trajet face à l’entrée. Les animations procédurales réagissent à l’accélération, au virage, aux écrans et aux présentations.

## Vérifications effectuées

- Tests existants : 16.
- Tests V3 : 16, sur les vrais modules TypeScript transpilés avec leurs dépendances.
- Total : **32 tests**, couvrant notamment :
  - correspondance des phases et modes ;
  - accès aux 44 stations et routes depuis plusieurs côtés de chaque salle ;
  - six présentations, interruptions, conservation de position et entrée demandée ;
  - 24 cycles entrée/sortie avec réentrée, modes normal et réduit, commandes répétées pendant la porte ;
  - ouverture complète pendant les franchissements, fermeture et orientation finale ;
  - trajet intérieur vers une destination extérieure après la sortie ;
  - 30 trajets orientés entre les bâtiments exécutés par le contrôleur de mouvement ;
  - annulation, passage et rejet d’un ancien passage après reprise manuelle ;
  - trajectoires de caméra et projection des enveloppes architecturales aux quatre rapports d’écran ;
  - demi-tours de caméra intérieure et dégagement des cuves Veolia.
- TypeScript et build de production exécutés ; base GitHub Pages préservée.
- Vite démarré : réponse HTTP 200 pour l’index, transformation des modules App, CinematicCamera, Interior et CameraRig vérifiée.
- Le build conserve un avertissement de taille du chunk Three.js, sans erreur de compilation.

Ces tests de logique ne simulent ni le clic DOM réel, ni le rendu WebGL, ni les performances GPU.

## Campagne visuelle restante — non exécutée

L’outil navigateur de la session était indisponible. Aucune capture V3 n’a été réalisée. Les anciennes captures V2, si présentes localement, ne constituent pas une validation de cette version.

| Vérification manuelle                                                | Statut      |
| -------------------------------------------------------------------- | ----------- |
| Accueil, présentation et plan à 1920 × 1080                          | À effectuer |
| Même vérification à 2560 × 1440                                      | À effectuer |
| Format 1366 × 768 et portrait 390 × 844                              | À effectuer |
| Six présentations : cadrages, passages anticipés, entrée directe     | À effectuer |
| Façades, angles, pentes, demi-tours rapides, course                  | À effectuer |
| Six portes : entrée, sortie, réentrée, observation du raccord        | À effectuer |
| 44 stations : activation, lecture, focus, fermeture, reprise clavier | À effectuer |
| Clics répétés, Échap, perte de focus et changement de taille         | À effectuer |
| Console navigateur, FPS et fluidité GPU                              | À effectuer |
| Validation artistique par Yoan                                       | En attente  |

La stabilité perceptive de la caméra extérieure en mouvement, les éventuelles occultations par le décor fin, le confort du raccord de porte, le rendu des toitures intérieures et la lisibilité réelle des superpositions restent à confirmer visuellement. Aucun objectif de 60 FPS n’est déclaré atteint.

Les cinq parcours professionnels provisoires et les textes Profil existants n’ont pas été remplacés. Il reste à fournir et valider les contenus des projets, leurs preuves et leurs résultats.
