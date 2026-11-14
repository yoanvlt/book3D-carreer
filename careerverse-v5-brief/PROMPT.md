Tu reprends mon portfolio 3D CareerVerse (React Three Fiber, Vite, TypeScript), repo yoanvlt/book3D-carreer, en ligne sur https://yoanvlt.github.io/book3D-carreer/. La V4 est sur `main` (commit `2351894`).

J'ai placé un brief dans `docs/v5-brief/` :

- `audit/AUDIT_V4.md` et `audit/img/` : mesures de la V4 (GPU réel, durées, taille), captures annotées des points restants (`ann-*.jpg`), comparaison avec le prototype (`avant-*.jpg`, `apres-*.jpg`).
- `prototype/v5-prototype.patch` et `prototype/NOTES.md` : nuages, joystick tactile, occlusion ambiante.

Lis ce brief, puis `V4_SUIVI.md`, `CONTENT.md`, `README.md` et tout `src/` avant de modifier quoi que ce soit.

## Objectif

La V4 est saine et le design me plaît. La V5 doit rendre la visite agréable à jouer, sur ordinateur comme sur téléphone, et donner l'impression d'un petit monde vivant. Le contenu reste vide : ne remplis aucun texte de projet.

Garde tout ce qui marche : structure du contenu, design tokens, tests, scripts de capture, qualité Soignée/Légère, version texte.

## Phase 0 — Partir du prototype

Travaille sur une seule branche (celle que ton environnement impose, sinon `feature/careerverse-v5`). Applique le patch comme indiqué dans `prototype/NOTES.md`, vérifie le rendu face aux images `apres-*.jpg`, commit.

## Phase 1 — Jouable partout

- **Téléphone** : remplace le joystick du prototype par un joystick analogique qui alimente un vecteur d'entrée partagé avec le contrôleur (plus de faux événements clavier). Ajoute « toucher le sol pour y aller » (pathfinding existant de `navigation.ts`). Caméra portrait dédiée, réglée dans la logique caméra et non au chargement d'un module.
- **Temps morts** : trajet automatique ≤ 6 s quel que soit le lieu, entrée 2,5 s, sortie 2 s, présentation 4 s. Chaque séquence est passable par un clic, une touche ou un toucher. Respecte toujours « Réduire les mouvements de caméra ».
- **Départ** : le robot démarre face à la place et au poteau indicateur, pas face au mur d'Autres missions.
- **Contrôles** : collisions qui glissent le long des obstacles tournés (bancs, bâtiments) au lieu de bloquer net.
- **Robot** : petit saut sur Espace (et bouton tactile), poussière de pas, inclinaison en virage, tête tournée vers le lieu proche. Garde ces effets légers.
- Ajoute des tests pour les nouvelles règles : durées maximales, vecteur d'entrée, départ, glissement.

## Phase 2 — Un monde vivant et des détails soignés

- Nuages : garde l'idée du prototype, mais aucun nuage ne doit masquer le pied de l'île ni le titre de l'accueil. Les instancier.
- Vie : arbres qui ondulent légèrement, eau de la fontaine, quelques oiseaux, deux ou trois petits robots qui se promènent sur les allées sans gêner le joueur.
- Son : ambiance (vent, oiseaux), pas, clics d'interface, entrée et sortie de porte. Bouton son visible dans l'en-tête, coupé par défaut, choix mémorisé. Fichiers courts et légers (OGG/MP3, < 300 ko au total), libres de droits, avec leur licence notée dans `public/sons/LICENCES.md`.
- Arbres gênants : masqués proprement (fondu tramé ou disparition complète), plus de tache translucide au premier plan.
- Profondeur : occlusion ambiante ou contours façon dessin animé, uniquement en qualité Soignée, avec un effet visible. Choisis selon le rendu et le coût, et justifie le choix dans `V5_SUIVI.md`.
- Corrige tous les points de `AUDIT_V4.md` : aide clavier de l'accueil, titre qui touche l'île, armoires-caisses, plante en cubes, panneau « Bientôt » minuscule, logo grisé, robot qui traverse les socles, écrans qui se chevauchent.
- Intérieurs plus denses : salle plus courte ou stations en boucle, sans casser `CONTENT.md` (4 stations pour Profil, 8 ailleurs).
- Remplace le logo « careerverse. » par mon nom ou un monogramme « YV » cohérent avec les tokens.

## Phase 3 — Un but pour le visiteur

- **Passeport de visite** : un tampon par lieu visité, gardé dans le navigateur (avec try/catch), visible dans le plan et en petit dans le HUD.
- **Visite guidée de 60 s** depuis l'accueil, pour le recruteur pressé : elle enchaîne les six lieux avec leurs présentations courtes et se quitte à tout moment.
- **Fin de visite** : quand les six tampons sont obtenus, une carte avec CV et contact. Elle reste masquée tant que `site.md` n'a ni CV ni contact.

## Phase 4 — Partage et légèreté

- Image d'aperçu 1200×630 générée par le script de capture, balises Open Graph et Twitter, favicon vérifiée.
- `postprocessing` chargé à la demande, seulement en qualité Soignée.
- Densité de pixels adaptative (par exemple `PerformanceMonitor` de drei) plutôt que fixe.
- Captures de vérification en WebP ; propose dans `V5_SUIVI.md` comment alléger l'historique Git (13 Mo de PNG), sans réécrire l'historique sans mon accord.

## Vérification (obligatoire)

- Mêmes contrôles qu'en V4 : captures aux quatre tailles, six portes, une station par bâtiment, console sans erreur, draw calls.
- En plus : chaque durée du tableau « Temps morts » de l'audit, mesurée avant et après. Un parcours tactile Playwright (`hasTouch`) : joystick, toucher pour aller, saut. La visite guidée de bout en bout.
- `V5_SUIVI.md` sépare ce que tu as vu à l'écran de ce que tu n'as pas pu vérifier. Les FPS en rendu logiciel ne comptent pas : dis-le.

## Contraintes

- Pas de backend, pas de traqueur. Nouvelles dépendances seulement si elles sont justifiées.
- Garde la base Vite `/book3D-carreer/` et le workflow GitHub Pages.
- Ne merge pas dans `main` et ne déploie pas sans mon accord.
- Arrête-toi seulement si une décision est irréversible ou si le brief se contredit ; sinon avance et note tes choix dans `V5_SUIVI.md`.
- Commits petits, un par sous-étape. Réponds-moi en français. À la fin : résumé court, liste des captures, ce qui reste à faire.
