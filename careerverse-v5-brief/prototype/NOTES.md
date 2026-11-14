# Prototype V5

`v5-prototype.patch` s'applique sur `main` @ `2351894` :

```bash
git apply docs/v5-brief/prototype/v5-prototype.patch
npm install
```

Le patch ajoute `@react-three/postprocessing`, `postprocessing` et `n8ao` à `package.json` ; `package-lock.json` en est exclu et `npm install` le régénère. Vérifié : lint, Prettier et 37 tests OK.

## Contenu

- `src/scene/V5Extras.tsx`
  - `Clouds` : 46 nuages bas en couronne (« mer de nuages ») et 9 nuages hauts, en icosaèdres facettés, rotation lente de l'ensemble.
  - `Effects` : `EffectComposer` avec N8AO (demi-résolution) et SMAA, actif en qualité Soignée.
- `src/ui/Joystick.tsx` : joystick tactile visible sur écran tactile ou de moins de 760 px. Il émet des événements clavier ZQSD (et Maj au bord) pour réutiliser le contrôleur. Il règle aussi la caméra portrait (distance 26, inclinaison 0,74).
- `World.tsx`, `App.tsx`, `style.css` : branchements et style du joystick.

## Raccourcis de prototype à ne pas garder

- Le joystick passe par de faux événements clavier : direction en 8 crans, pas analogique. La version finale lit un vecteur d'entrée partagé avec le contrôleur.
- Le réglage de caméra portrait est fait au chargement du module du joystick.
- `Effects` est importé statiquement : postprocessing alourdit le chunk `World` de 155 ko gzip même en qualité Légère.
- Les nuages bas masquent parfois le pied de l'île depuis la vue aérienne.
