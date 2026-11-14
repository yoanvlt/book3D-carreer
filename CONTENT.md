# Ajouter un projet en cinq minutes

Tout le texte du site est dans `src/content/`. Pour modifier un lieu, on n’a besoin d’ouvrir aucun fichier de code.

```
src/content/
  site.md              nom, rôle, phrase d’accueil, CV, contact
  batiments/
    profil.md          Profil (La Maison portrait)
    projet-1.md        Projet 1 (Le Pavillon de verre)
    projet-2.md        Projet 2 (La Manufacture)
    projet-3.md        Projet 3 (L’Observatoire)
    missions.md        Autres missions (La Galerie)
    veolia.md          Veolia
public/medias/         images, vidéos et PDF cités dans le contenu
```

## 1. Ouvrir le fichier du bâtiment

Exemple : `src/content/batiments/projet-1.md`. Le haut du fichier, entre les deux lignes `---`, est l’en-tête :

```yaml
---
id: project-1 # ne pas modifier
statut: brouillon # vide, brouillon ou publié
titre: Tableau de bord énergie # nom affiché dans le plan et devant la porte (40 caractères au plus)
sous_titre: Le Pavillon de verre # nom du lieu, sous le titre (60 caractères au plus)
enseigne: ÉNERGIE # texte peint sur la façade (24 caractères au plus)
resume: Un tableau de bord pour suivre la consommation de douze sites.
tags: [Power BI, SQL, Data]
liens:
  - texte: Code source
    url: https://github.com/…
---
```

## 2. Écrire les stations

Sous l’en-tête, chaque titre `##` crée une station dans le bâtiment, dans l’ordre de visite. Profil accueille 4 stations, les autres bâtiments 8. Les stations restantes sont des socles vides.

```markdown
## La demande initiale

Le service achats voulait suivre sa consommation **site par site**.

- douze sites
- des relevés mensuels dans des fichiers Excel

![Le tableau de bord final](medias/projet-1-dashboard.png 'Vue d’ensemble')

## Les résultats

Le rapport mensuel prend maintenant dix minutes au lieu d’une journée.

[Voir la démonstration](https://exemple.fr/demo)
```

Syntaxe acceptée :

| Écrire                                 | Résultat                                                  |
| -------------------------------------- | --------------------------------------------------------- |
| `## Titre`                             | nouvelle station (60 caractères au plus)                  |
| ligne vide                             | nouveau paragraphe                                        |
| `- élément`                            | liste à puces                                             |
| `**gras**`, `*italique*`               | mise en forme                                             |
| `[texte](https://…)` dans une phrase   | lien dans le texte                                        |
| `[texte](https://…)` seul sur sa ligne | bouton de lien sous le texte                              |
| `![description](medias/image.png)`     | image ; la description est obligatoire (lecteurs d’écran) |
| `![titre](medias/demo.mp4)`            | vidéo (`.mp4`, `.webm`, `.mov`)                           |
| `<!-- note -->`                        | commentaire, jamais affiché                               |

Les fichiers cités par `medias/…` doivent exister dans `public/medias/`. Une adresse externe commence par `https://`.

## 3. Choisir le statut

| Statut      | Ce que voit le visiteur                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `vide`      | le lieu affiche « Bientôt » ; ses stations ne sont pas proposées                                      |
| `brouillon` | rien de plus que `vide` en ligne ; avec `npm run dev`, le contenu s’affiche avec la mention brouillon |
| `publié`    | le contenu est en ligne au prochain déploiement                                                       |

Un brouillon n’est jamais inclus dans le site construit par `npm run build`. Pour le voir quand même dans un build : `CAREERVERSE_BROUILLONS=1 npm run build`.

## 4. Vérifier

```bash
npm run dev
```

Le site se recharge à chaque enregistrement. Si le contenu est invalide (statut inconnu, image sans description, fichier introuvable, trop de stations…), le terminal et la page indiquent le fichier et la ligne en cause. `npm run build` échoue de la même façon : rien d’invalide ne peut être mis en ligne.

```bash
npm test
```

## CV, contact et version texte

Dans `src/content/site.md` :

```yaml
cv: medias/cv-yoan-viollet.pdf # fichier déposé dans public/medias/
contact:
  email: prenom.nom@exemple.fr
  linkedin: https://www.linkedin.com/in/…
  github: https://github.com/…
```

Tant qu’une valeur vaut `null`, elle n’apparaît nulle part. La version texte du portfolio (`…/book3D-carreer/?lecture`) est générée à partir des mêmes fichiers : nom, CV, contact et toutes les stations publiées. Elle est accessible depuis l’aide et quand la 3D ne démarre pas.

## Ce qui reste dans le code

`src/world/config.ts` (position, taille et couleur des bâtiments) et `src/world/narrative.ts` (emplacement des stations dans les salles) ne contiennent que de la géométrie. On n’y touche que pour changer l’architecture.
