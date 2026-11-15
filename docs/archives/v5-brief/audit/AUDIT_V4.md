# Audit de la V4 (14 novembre 2026, `main` @ 2351894)

Les numéros renvoient aux repères roses des images `img/ann-*.jpg`. Les images `avant-*` / `apres-*` comparent la V4 et le prototype V5.

## Mesures

### Code et taille

- Tests 37/37, ESLint, Prettier et TypeScript OK, build en 5 s.
- JS à l'ouverture : 263 ko (85 ko gzip). Scène 3D à la demande : 965 ko (268 ko gzip). Police latin : 41 ko.
- Historique Git : 15 Mo, dont 13 Mo de captures PNG dans `docs/screenshots/`.
- Aucune balise Open Graph ni image d'aperçu : le lien partagé sur LinkedIn n'a pas de vignette.

### Fluidité sur un vrai GPU

AMD Radeon intégrée (portable milieu de gamme), 1440×900, densité 1,5, navigateur de l'app Claude (panneau masqué : valeurs indicatives).

| Scène            | FPS        | Draw calls |
| ---------------- | ---------- | ---------- |
| Accueil          | 52         | 211        |
| Exploration      | 38 à 60    | 140 à 168  |
| Intérieur Veolia | 39 à 60    | 123        |
| Qualité Légère   | aucun gain | —          |

JavaScript : 2,3 ms par image. Écart entre deux images : 26,7 ms en moyenne, 80 ms au 95e centile. Les saccades ne viennent donc ni du code ni des ombres. À vérifier dans un Chrome normal (onglet visible) avant d'optimiser.

### Temps morts

| Action                            | Durée mesurée | Cible         |
| --------------------------------- | ------------- | ------------- |
| Trajet automatique place → Veolia | 16,3 s        | ≤ 6 s         |
| Entrer (E jusqu'à la main rendue) | 8,3 s         | 2,5 s         |
| Ressortir                         | 5,9 s         | 2 s           |
| Présentation (V)                  | 7,5 à 9 s     | 4 s, passable |

Vitesses : marche 6,2, course 9,5, trajet automatique plafonné à 9 (4,2 en intérieur).

## Points à corriger

### img/ann-accueil.jpg

1. « marcher » colle au badge `E` dans l'aide clavier.
2. Le titre touche l'île à 1440 px.

Le logo « careerverse. » reste générique : nom ou monogramme.

### img/ann-explo.jpg

1. Au point de départ, Autres missions occupe un tiers de l'écran. Démarrer face à la place et au poteau indicateur.

### img/ann-porte.jpg

1. L'arbre translucide forme une grosse tache jaune au premier plan. Le masquer complètement ou en fondu tramé.

### img/ann-veolia.jpg (contenu d'essai)

1. Écrans des stations qui se chevauchent et sortent du cadre.
2. Le robot traverse le socle de la station.
3. Plante en cubes empilés, trop « placeholder ».

### img/ann-profil.jpg (état réel en ligne)

1. et 2. Armoires en blocs bruns, on dirait des caisses.
2. Panneau « Bientôt » minuscule au mur.
3. Logo grisé à l'intérieur, il a l'air désactivé.
4. Salle de 22 × 36 pour 4 socles : trop de sol vide.

### img/ann-mob.jpg

1. Aucun contrôle tactile pour marcher sur téléphone.

## Prototype V5 (voir `../prototype/`)

- Mer de nuages sous l'île et nuages qui dérivent : `apres-accueil.jpg`, `apres-accueil-mobile.jpg`.
- Joystick tactile et caméra portrait plus haute : `apres-mobile.jpg`.
- Occlusion ambiante N8AO en qualité Soignée : effet à peine visible en rendu logiciel, +155 ko gzip.
