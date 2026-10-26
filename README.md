# A Realm Divided

Site de fans consacré au monde de _Game of Thrones_ : un voyage en 3D de l’au-delà du Mur jusqu’à Valyria, une centaine de personnages, les grandes maisons et leurs arbres, et un codex des peuples, ordres, croyances, langues et créatures. Le visiteur choisit d’abord jusqu’à quelle saison il a vu la série, et **rien de ce qui vient après n’est jamais mis dans la page**.

Site non officiel, sans lien avec HBO ni avec George R. R. Martin. Toutes les images sont générées, tous les textes sont originaux ; voir la page « À propos » et `docs/audit.md`.

## Commandes

| Commande                   | Rôle                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm install`              | Installe les dépendances (Node 20 ou plus).                                                                                                                                                                                                                                                                              |
| `npm run dev`              | Serveur de développement (http://localhost:5173, lab du paysage sur `/lab.html`).                                                                                                                                                                                                                                        |
| `npm run build`            | Build de production dans `dist/`.                                                                                                                                                                                                                                                                                        |
| `npm run preview`          | Sert `dist/` sur le port 4173.                                                                                                                                                                                                                                                                                           |
| `npm run check:data`       | Valide tous les contenus (schémas, références, règles anti-spoilers, longueurs) et met à jour le rapport de `docs/contenu-suivi.md`.                                                                                                                                                                                     |
| `npm run check`            | Build puis vérifications navigateur : console, typographie (≥ 11 px), débordements, axe-core, contraste, voyage étape par étape, recherche, témoins anti-spoilers, animations réduites, repli sans WebGL, aucune requête externe, budgets. Captures dans `tools/shots/check/`. `-- --quick` réduit les captures mobiles. |
| `npm run images`           | Variantes WebP 480/960/1600 px de `public/images/` et manifeste `src/data/images.json` (srcset).                                                                                                                                                                                                                         |
| `node tools/lab-shots.mjs` | Captures du paysage pour régler lumières et cadrages (`--steps=winterfell,braavos`, `--mobile`).                                                                                                                                                                                                                         |

Le déploiement vise Vercel : `vercel.json` renvoie toutes les routes vers `index.html` (routage par l’historique) et met en cache longue durée les fichiers de `assets/`.

## Organisation

```
index.html              coquille : monde 3D, en-tête, espace courant, barre du bas, modales
src/main.js             démarrage, routeur, transitions entre espaces, recherche, aperçus
src/core/               état (saison), routeur, moteur anti-spoilers, graphe des relations, recherche
src/world/              paysage 3D (three.js) : textures en Worker, terrain, mer, ciel, nuages, villes, caméra
src/spaces/             les espaces : map (voyage), characters, houses, codex, about
src/ui/                 chrome, menu, sélecteur de saison, recherche, aperçu, liens automatiques, images
src/data/               tous les contenus en JSON (un fichier par entité)
tools/                  scripts de vérification, schémas JSON, images
docs/                   audit, suivi des contenus, prompts d’images
```

Le contenu est lu à la compilation par `tools/content-load.mjs` : un **index léger** (module virtuel `virtual:content-index`) part avec la page, et chaque fiche complète est chargée à la demande.

## Règle anti-spoilers

Chaque information datée porte une saison `s` (apparition) et parfois `until` (fin de validité) : relations, titres, statuts, allégeances, paragraphes, événements, unions des arbres. `src/core/spoilers.js` filtre **avant** le rendu ; ce qui est masqué n’est jamais dans le DOM, seulement signalé par une trace discrète (« 2 relations masquées · saison 7 »). Les témoins de `tools/spoiler-witnesses.json` le vérifient à chaque `npm run check`.

## Ajouter un personnage

1. Créer `src/data/characters/{slug}.json` sur le modèle d’un personnage existant (schéma : `tools/schemas/character.schema.json`).
2. Renseigner `firstSeason` : il doit être égal à la plus petite saison de `places[].seasons`.
3. Écrire la biographie en blocs par saison (`bio: [{ s, title, paragraphs }]`) : un bloc pour chaque saison où le personnage est présent. Principaux : 600 à 1 200 mots ; secondaires : 150 à 400.
4. Déclarer les relations d’un seul côté (voir les conventions de `docs/contenu-suivi.md`) : l’inverse est calculé. Au moins trois relations.
5. Les faits incertains vont dans `_doute` (jamais affiché). Une seule citation par page, de moins de quinze mots.
6. Portrait : `public/images/personnages/{slug}.webp` en 3:4, puis `npm run images`. Sans portrait, un placeholder s’affiche.
7. `npm run check:data`.

## Ajouter une étape au voyage

Les 19 étapes sont dans `src/data/journey.json` (`steps`). Une étape contient : `slug`, `num`, `place` (slug d’un lieu), `title`, `region`, `hook`, `text` (paragraphes), `transition`, `focus` (coordonnées de carte, voir `src/data/map.json`), `camera` (`dist`, `height`, `azimuth`), `light` (soleil, ciel, brouillard, exposition), `arc` (`normal` ou `high`), `image`, `imageAlt`, `textSide`, `characters` et `links`. Le schéma impose exactement 19 étapes : en ajouter une demande de modifier aussi `tools/schemas/journey.schema.json`. La traversée de la mer Étroite (`crossing.after`) se place après l’étape indiquée. Le cadrage et la lumière se règlent dans `lab.html`.

## Ajouter une image

1. Générer l’image en suivant le style et le prompt de `docs/images-prompts.md` (jamais de photo de la série, jamais de visage d’acteur).
2. L’enregistrer en `.webp` dans `public/images/` (portraits dans `personnages/`).
3. La référencer dans le JSON concerné (`portrait`, `image`).
4. `npm run images` pour les variantes et le manifeste, puis mettre à jour le suivi dans `docs/images-prompts.md`.

## Maisons et codex

- Maisons : `src/data/houses/{slug}.json` — histoire, blocs « dans la série » par saison, suzerain avec `until`, vassaux, arbre (`tree.people`, `tree.unions` ; une union `secret` n’apparaît qu’à sa saison de révélation, `hideFrom` retire une version officielle).
- Codex : `src/data/codex/{slug}.json` — rubrique (`peuples`, `ordres`, `croyances`, `langues`, `creatures`), texte intemporel dans `body`, ce qui dépend de la série dans `inTheSeries` (filtré par saison).

## Documents

- `docs/audit.md` : état de chaque module, choix par défaut, droits, écarts restants.
- `docs/contenu-suivi.md` : conventions de rédaction, lots, rapport généré par `check:data`.
- `docs/images-prompts.md` : prompts et suivi des images manquantes ou à refaire.

## Crédits

Armoiries : SVG de _A Wiki of Ice and Fire_ (CC BY-SA 3.0, auteurs dans `src/data/sigil-credits.json`) pour les grandes maisons ; créations originales pour les maisons Frey, Mormont, Tarly, Reed, Clegane, Torth et Mervault. Polices Cormorant Garamond et Manrope (SIL OFL), auto-hébergées.
