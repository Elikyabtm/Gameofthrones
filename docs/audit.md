# Audit du code existant (avant la v2)

> État audité : commit `d42aaf0` (« Phase 5 — Annexes » de la v1). Le site v1 tient sur une
> seule page : voyage au scroll de 9 étapes en Westeros, puis quatre annexes (arbre, index,
> chronologie, sources). Vite 8, JavaScript vanilla, three 0.186, polices auto-hébergées.

## 1. Modules

| Module | Ce qu'il fait | Qualité | Décision |
|---|---|---|---|
| `vite.config.js` | Build statique, `base: './'` | Bon | **Adapter** : `base: '/'` (URLs propres, §4.2), module virtuel d'index des contenus |
| `index.html` | Page unique : voyage, annexes, HUD, modale | Correct mais monolithique | **Réécrire** : coquille d'application (cadre, en-tête, barre du bas, conteneur d'espace) |
| `src/main.js` | Branche voyage, annexes, HUD, monde 3D | Lisible | **Réécrire** autour du routeur |
| `src/map/scene.js` | Renderer, caméra, lumières ×π, boucle de rendu, pause onglet caché | Bon | **Garder** → `src/world/scene.js`, ajout ciel, exposition et rendu à la demande |
| `src/map/noise.js`, `distance.js`, `draw.js` | Bruit, distance signée par chanfrein, tracés | Bon, sans dépendance | **Garder** → `src/world/` |
| `src/map/textures.js` | Relief, distance au rivage, rivières, Mur, lacs, montagnes, normales | Bon, coûteux (~1,6 s) | **Adapter** : Essos, massifs plus marqués, exécution dans un Worker |
| `src/map/parchment.js`, `palettes.js` | Couleur « parchemin » sépia, hachures, routes en pointillés | Soigné mais hors cible (§2.3, §6.3) | **Supprimer** → remplacés par `world/biomes.js` (peinture par biomes) |
| `src/map/terrain.js` | Plan déplacé 1024 × 512 | Bon | **Garder** (élargi : Westeros et Essos sont déjà dans les bornes 2600 × 1300) |
| `src/map/sea.js` | Mer à vagues légères, transparence des hauts-fonds | Bon | **Adapter** : mer jusqu'à l'horizon, spéculaire, écume côtière |
| `src/map/camera-path.js` | Cadrages, vols en arc, dérive de palier, décalage optique | Bon | **Adapter** : inclinaison 30 à 40°, séquence en 5 temps du §6.2 |
| `src/map/markers.js` | Losange, colonne de lumière, étiquettes projetées | Bon | **Garder** (étiquettes 22/16 px, noms de mers) |
| `src/map/miniatures/*`, `forests.js` | Maquettes de châteaux, hameaux, forêts instanciées | Joli mais « plateau de jeu » (§2.3) | **Supprimer** → silhouettes à l'échelle avec lumières (`world/cities.js`), forêts peintes dans les biomes |
| `src/map/world.js` | Assemble la scène | Bon | **Réécrire** : monde persistant (mode carte net / mode assombri) |
| `src/journey/*` | Rendu des étapes, pilote de scroll, panneaux, HUD | Bon pilote de scroll | **Adapter** : `scroll.js` gardé, panneaux remplacés par la plongée (§6.2) |
| `src/ui/archive.js` | Modale de fiche | Correct | **Supprimer** → aperçu en panneau latéral (§8.3) et vraies pages |
| `src/ui/menu.js` | Menu avec piège du focus | Bon | **Adapter** au nouveau menu |
| `src/ui/audio.js` | Nappe WebAudio, coupée par défaut | Bon | **Adapter** : couleur sonore par zone (§8.4) |
| `src/annexes/tree*.js` | Arbre de toutes les familles | Bon algorithme de générations | **Adapter** : arbre d'une maison à la fois (§7.3), vue « Toutes les lignées » |
| `src/annexes/index.js`, `timeline.js`, `sources.js` | Index, frise, crédits | Correct | **Réécrire** dans Codex et À propos |
| `src/content/*` | Contenus extraits de l'ancien site | Textes courts | **Migrer** vers `src/data/**/*.json` (§5), puis supprimer |
| `src/styles/*` | Tokens, HUD, voyage, annexes | Correct | **Réécrire** selon la DA §3 (tokens gardés et complétés) |
| `tools/check.mjs` | Build, preview, Playwright SwiftShader, attentes par état | Robuste | **Adapter** aux routes v2 |
| `tools/extract-content.mjs`, `corrections.mjs`, `asset-names.mjs`, `copy-assets.mjs` | Migration v0 | Ponctuels, déjà joués | **Supprimer** (historique dans git) |
| `tools/lab-shots.mjs`, `lab-vol.mjs`, `lab.html` | Captures et vidéo de vol | Utile | **Adapter** au nouveau monde |
| `tools/images.mjs` | Coquille vide | — | **Réécrire** (§10.3) |

## 2. Contenus existants

| Type | Nombre | Remarques |
|---|---|---|
| Peuples, armées, ordres | 22 | 1 à 2 paragraphes chacun, image présente |
| Maisons | 10 | 1 paragraphe, devise, blason SVG, pas de source |
| Langues | 9 | Courtes, avec source |
| Croyances | 6 | Courtes |
| Créatures | 5 | Courtes |
| Périodes | 4 | Frise |
| Lieux | 28 (13 Westeros + 15 Essos) | 1 paragraphe |
| Personnages (arbre) | 67 | Biographie de 1 à 2 phrases (7 d'origine + 60 rédigées en v1) |
| Illustrations | 34 (16:9, 1672 × 941) | Générées |
| Portraits | 68 (carrés, 362 × 362) | Générés |
| Blasons | 10 SVG sous CC BY-SA 3.0, crédités | |

## 3. Écarts avec la v2

- **Personnages** : 109 à couvrir, avec un modèle riche (biographie par saison, relations, lieux). Il en existe 67 dans l'arbre, avec 1 à 2 phrases chacun. 23 des 67 sont des figures d'arbre (Rickard, Joanna, Elia…) hors liste : elles deviennent des **nœuds d'arbre** dans les maisons, pas des fiches.
- **Essos** : absent de la carte 3D, avec 15 lieux en texte seulement.
- **Routage, anti-spoilers, recherche, graphe de relations** : inexistants.
- **Maisons** : 10, il en faut au moins 17 (Frey, Bolton, Mormont, Tarly, Reed, Clegane, Torth, Mervault).
- **Codex** : existe, mais avec des entrées de 60 à 150 mots, contre 300 à 600 attendus.

## 4. Points de droits relevés (§1.4)

- **Ressemblance avec les acteurs** : une partie des portraits générés (Arya, Tyrion, Daenerys, Jon, etc.) et quelques illustrations (`garde-de-nuit`, `peuple-libre`, `maitre-de-la-lumiere`) évoquent nettement les interprètes de la série. La bible visuelle (§10.1) l'interdit. Ils sont conservés provisoirement et marqués **« à refaire »** dans `docs/images-prompts.md`. Décision à prendre : les garder jusqu'à leur remplacement, ou afficher les placeholders dès maintenant.
- Les blasons SVG gardent leurs crédits (page À propos).
- Les blasons des maisons ajoutées (Frey, Mormont…) sont des **SVG originaux simples**, dessinés pour le projet.

## 5. Choix par défaut pris sans validation (à confirmer)

1. **Branche** : la session impose la branche `claude/confident-carson-zwh7kw`. C'est elle qui joue le rôle de `v2` ; `main` n'est pas touchée.
2. **Enfants de la forêt** : traités dans le Codex (rubrique Créatures), pas comme un personnage.
3. **Qhorin Mimain** est déplacé de « Foi et magie » vers la Garde de Nuit.
4. **Graphie** :
   - « Edd-la-Douleur » est gardé en alias d'Eddison Tollett ;
   - « la Gamine » est conservé pour le Waif (doute noté dans le JSON) ;
   - « Littlefinger » et « le Limier » sont repris de la VF.
5. **Personnages majeurs absents de la liste** (proposés, **non intégrés**) :
   - Jon Arryn, Elia Martell et Roslin Frey existent comme nœuds d'arbre ;
   - à ajouter comme fiches si tu le veux : mestre Luwin, Yoren, Ilyn Payne, Grenn, Olly, Wun Wun, Irri, Doreah, Myranda, Lady Crane.
6. **Saisons** : leurs titres sont ceux des premiers épisodes en VF.
7. **Périodes historiques** : elles rejoignent la rubrique « Peuples et civilisations » du Codex (kicker « Époque »).
8. **Images des étapes** : les illustrations existantes sont réutilisées quand elles conviennent. Sinon, un placeholder s'affiche et un prompt est écrit.
