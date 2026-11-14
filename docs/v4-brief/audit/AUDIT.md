# Audit visuel CareerVerse (14 novembre 2026)

Rendu observé sur https://yoanvlt.github.io/book3D-carreer/ et sur un build local de `main`.
Les numéros renvoient aux repères roses des images `img/ann-*.jpg`.

## Diagnostic général : pourquoi le site fait « IA »

- Une seule palette sable (crème, corail, bleu ardoise) pour la 3D et l'interface : rien ne ressort.
- Polices DM Sans + Manrope : combinaison par défaut des interfaces générées.
- Micro-libellés décoratifs en capitales espacées, sans information.
- Slogans interchangeables (« Un parcours. Tout un monde. », « Les idées prennent vie… »).
- Tics visuels : flèche ↗ sur chaque bouton, étoile ✳, numérotation « 01 / » partout.
- Textes provisoires qui s'adressent au développeur (« Aucun client… n'a été inventé », « Contenu à documenter »).
- 3D en boîtes primitives, lumière plate, ACES + exposition 1.15 qui délave, fond uni sans ciel.

## img/ann-home-desktop.jpg — Accueil 1440×900

1. Libellé décoratif en capitales espacées, sans information.
2. Slogan générique : on ne sait ni qui est Yoan, ni ce qu'il fait.
3. Pied de page de remplissage (« Édition 03 / 2026 », « Ouvert à la curiosité »).
4. « Le campus des possibles » posé sur l'île.
5. L'île est coupée à droite et en bas.
6. Flèche ↗ sur chaque bouton, étoile ✳.
7. Bâtiments en boîtes primitives, matières mates identiques.
8. Fond beige uni, sans ciel : 3D et interface se confondent.

## img/ann-city.jpg — Exploration

1. Un bâtiment occupe un tiers de l'écran : caméra trop basse et trop proche.
2. Panneaux 3D en Arial, petits et flous.
3. Barre d'aide en 9–10 px, à peine lisible.
4. Sol, allées et pelouses sans contraste.
5. Libellé décoratif et nom de lieu inventé.

## img/ann-door.jpg — Devant un bâtiment

1. Un arbre masque un tiers de l'écran : seuls les bâtiments deviennent transparents, pas la végétation.
2. Le panneau « 01 Entrée » est coupé et chevauche la navigation.
3. Socle bleu nuit massif : la façade ne se lit pas.
4. Barre d'aide et boutons d'action empilés en bas de l'écran.

## img/ann-interior.jpg — Intérieur (Maison portrait)

1. Le titre du mur passe derrière une poutre.
2. Écrans des stations illisibles depuis l'allée.
3. Libellé presque invisible.
4. Murs gris, plafond bleu nuit : aucune ambiance propre au lieu.
5. Disques orange au sol sans fonction visible.
6. Grande salle presque vide : 4 stations pour toute la surface.

## img/ann-home-mobile.jpg — Accueil mobile 390×844

1. Bande de couleur différente sous l'en-tête.
2. Le titre est posé sur l'île : il cache la 3D et reste peu lisible.
3. Encadré crème parasite derrière le paragraphe.
4. Pied de page en boîte, coupé en bas de l'écran.

## Direction retenue : A « Diorama »

Images de référence du prototype : `img/a-home-desktop.jpg`, `img/a-city.jpg`, `img/a-door.jpg`, `img/a-interior.jpg`, `img/a-home-mobile.jpg`.

- Plein jour : ciel bleu en dégradé, herbe franche, allées presque blanches, mer autour de l'île.
- Couleurs primaires adoucies et saturées pour les bâtiments (orange vif, bleu, jaune, violet).
- Rendu `NeutralToneMapping`, exposition 1.0.
- Interface : Bricolage Grotesque, panneaux blancs arrondis (16 px), ombre douce, bouton principal orange en pilule avec relief « jouet ».
- Accueil : nom, une ligne de rôle, une phrase, deux boutons. Aucun slogan, aucun ornement.

Ce que le prototype ne fait pas encore : bâtiments et intérieurs seulement recolorés (pas redessinés), végétation qui masque toujours le robot, textes provisoires encore visibles dans la 3D, aucune mesure de FPS sur vrai GPU.
