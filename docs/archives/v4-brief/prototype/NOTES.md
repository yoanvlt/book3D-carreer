# Prototype des directions artistiques

`direction-a-prototype.patch` s'applique sur `main` (commit `89198c3` ou suivant) avec :

```bash
git apply docs/v4-brief/prototype/direction-a-prototype.patch
npm install
```

Le patch ajoute les polices à `package.json` ; `package-lock.json` en est exclu et `npm install` le régénère (`npm ci` échouerait tant que le lock n'est pas à jour). Vérifié sur une copie neuve de `main` : build OK, 32 tests sur 32.

## Ce que fait le patch

- `src/theme.ts` : trois thèmes (`?theme=a|b|c`), le rendu actuel sans paramètre. Contient ciel, brouillard, terrain, lumières, tone mapping, palette de remplacement et réglages caméra (distance 21, élévation 0,56, zoom max 27).
- `src/scene/Atmosphere.tsx` : `SkyDome` (ciel en dégradé) et `ThemeApplier`, qui recolore à la volée tous les matériaux de la scène.
- `src/theme.css` : interface des trois thèmes (variables `--t-*`), suppression des ornements, nouvel accueil `.hero4`, HUD unifié.
- `src/App.tsx` : nouvel accueil quand un thème est actif.
- `src/main.tsx` : polices auto-hébergées (fontsource) chargées avant le premier rendu, car les panneaux 3D sont dessinés sur canvas.
- `src/style.css` : suppression de l'`@import` Google Fonts.
- `Terrain`, `Interior`, `World`, `Primitives`, `Controller` : lecture des valeurs du thème.

## Raccourcis de prototype à ne pas garder

- `ThemeApplier` recolore les matériaux en parcourant la scène toutes les 250 ms. C'est un raccourci pour comparer vite ; la version finale définit les couleurs à la source via des design tokens.
- Les thèmes B et C et la commutation par URL sont à supprimer une fois A appliqué.
- Les polices Instrument Serif, JetBrains Mono, Manrope et DM Sans ne servent qu'à B, C et au rendu actuel.
