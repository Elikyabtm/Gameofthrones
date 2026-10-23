# PROJET — « A Realm Divided », un voyage à travers Westeros et Essos

> Cahier des charges pour Claude Code. À placer à la racine d'un **nouveau dossier de projet vide**.
> Ce document fait autorité. Quand une décision n'y est pas couverte et qu'elle change ce que l'utilisateur voit, **pose la question** au lieu de deviner.

---

## 0. Le projet en 5 lignes

1. Un guide de fan non officiel de Game of Thrones, en français, conçu comme **un voyage géographique** et non comme une encyclopédie : 14 étapes, du Mur jusqu'à Valyria.
2. Une **carte 3D en relief, façon parchemin sombre**, occupe l'écran en fond fixe. Le **scroll pilote un vol de caméra** d'étape en étape.
3. À chaque étape, un **panneau** raconte le lieu et donne accès aux contenus qui y vivent : peuples, maisons, croyances, langues, créatures.
4. Une **interface-cadre fixe (HUD)** accompagne tout le voyage : filets dorés, en-tête, barre du bas « ← précédent · 03 / 13 · suivant → », frise de progression.
5. En annexes, accessibles depuis le menu : un arbre généalogique, l'index de toutes les fiches, une chronologie, les sources et les crédits.

On part de zéro : **aucun code de l'ancien site n'est réutilisé**. L'ancien site sert uniquement de réserve de matériaux (§1.4).

---

## 1. Règles de travail

### 1.1 Avant d'écrire du code

- Lis entièrement ce document, puis parcours le dossier `reference/` (§1.4) pour connaître les matériaux disponibles.
- Présente ensuite un plan d'implémentation de la **phase 0 uniquement**, en mode plan, et attends ma validation.

### 1.2 Git

- Dès la phase 0 : `git init`, un `.gitignore` adapté (`node_modules/`, `dist/`, `tools/shots/`), puis un premier commit.
- Fais un commit par phase validée, avec un message en français : `Phase N — <titre>`. Pas de commit au milieu d'une phase sauf si je le demande.

### 1.3 Stack technique

- **Vite** (dernière version stable), en **JavaScript vanilla avec modules ES**. Pas de framework (ni React, ni Vue, ni Svelte) : le site est un seul écran narratif, un framework n'apporterait rien.
- Dépendances : `three`, `gsap` (ScrollTrigger est inclus). Rien d'autre côté site sans me le demander.
- Outils de développement : `playwright`, `@axe-core/playwright`, `sharp`, `prettier`.
- Scripts npm :
  - `dev` pour le serveur de dev ;
  - `build` pour générer le site statique dans `dist/` ;
  - `preview` pour servir le build ;
  - `check` pour les vérifications (§11) ;
  - `images` pour générer les variantes d'images (§10).
- Le résultat de `npm run build` doit être un **site 100 % statique** dans `dist/`, hébergeable n'importe où, chemins relatifs compris (`base: './'` dans Vite).
- Polices : Cormorant Garamond et Manrope, **auto-hébergées** dans `public/fonts/` en woff2. Pas de requête vers Google Fonts.
- Code lisible et commenté en français aux endroits non évidents. Formatage avec Prettier. Pas de fichier de plus de 400 lignes : découpe plutôt.

### 1.4 Matériaux de l'ancien site (`reference/`)

Je place l'ancien site dans `reference/ancien-site/`. On en reprend :

- **Textes** : les fiches (22 peuples, armées, ordres et civilisations ; 10 maisons ; 9 langues ; 6 croyances ; 5 créatures ; 4 périodes d'histoire ; 15 destinations d'Essos ; 13 descriptions de cités ; les personnages de l'arbre). Ils sont dans `encyclopedia.js`, `atlas.js` et `genealogy.js`.
  - Extrais-les en **données structurées** dans `src/content/` (JSON ou modules JS, voir §2).
  - Ce ne sont que des **premières versions** : tu peux proposer des améliorations (style, fautes, cohérence, liaison avec le voyage), mais **toujours en me montrant la différence avant de remplacer un texte**.
  - Les sources (liens) de chaque fiche sont conservées.
- **Illustrations** : `assets/*.webp` et `assets/portraits/`, à copier dans `public/images/` avec des noms clairs.
- **Armoiries** : `assets/sigils/*.svg` avec `credits.json` et `credits-svg.json`. Les crédits et licences doivent apparaître dans la page Sources.
- **Contours de la carte** : `atlas-data.json`, qui contient les régions et les 13 cités de Westeros (§4.1).
- **Rien d'autre** : ni le HTML, ni le CSS, ni le JS de l'ancien site ne doit être copié.

### 1.5 Droits (non négociable)

- Aucun asset officiel : ni logo HBO ou Game of Thrones, ni photo de la série ou d'acteur, ni carte officielle ou de fan, ni police « Trajan / Game of Thrones ».
- La carte est **générée par le code** à partir de nos propres contours (§4.2).
- Les ornements du cadre sont des SVG **originaux**, dessinés dans ce projet.
- Les nouveaux textes que tu écris sont originaux : aucune citation recopiée de la série, des livres ou de wikis. Les noms propres et les faits sont libres d'usage, les formulations non.
- Un avertissement de fan site figure dans le pied de page et la page Sources : « Guide de fan non officiel, sans affiliation avec HBO ni George R. R. Martin ».

### 1.6 Fin de chaque phase

Ton compte rendu doit contenir :

1. les fichiers créés, modifiés et supprimés ;
2. ce qui a été fait et ce qui ne l'a pas été ;
3. le résultat de `npm run check` (§11) et les captures produites ;
4. **ta propre lecture des captures** : ce qui est réussi, ce qui ne l'est pas encore ;
5. les points sur lesquels tu as besoin de ma décision.

Ensuite, **attends ma validation** avant de passer à la phase suivante.

---

## 2. Architecture

```
/
  PROJET.md                   ce document
  README.md                   à rédiger en phase 7
  package.json, vite.config.js, .prettierrc, .gitignore
  index.html                  point d'entrée Vite (structure sémantique, §6)
  lab.html                    page de test de la carte (phases 1-2), exclue du build final
  reference/ancien-site/      matériaux (lecture seule, jamais importé par le site)
  public/
    fonts/                    woff2 auto-hébergés
    images/                   illustrations, portraits (+ variantes générées en §10)
    sigils/                   armoiries SVG + credits.json
  src/
    main.js                   orchestre tout
    content/
      groups.js               22 fiches (peuples, armées, ordres, civilisations)
      houses.js               10 maisons
      languages.js            9 langues
      faiths.js               6 croyances
      creatures.js            5 créatures
      eras.js                 chronologie
      places.js               cités de Westeros et destinations d'Essos (descriptions)
      people.js               personnages et liens de l'arbre généalogique
      sources.js              sources générales + chargement des crédits d'armoiries
    data/
      journey.js              les 14 étapes (§3)
      map.json                données de carte v2 (§4.1)
    map/
      scene.js                renderer, scène, caméra, boucle de rendu à la demande, toWorld()
      textures.js             génération canvas : relief, parchemin, normales (dans un Worker, §10)
      textures.worker.js
      terrain.js              plan déformé + matériau
      sea.js                  mer animée
      clouds.js               nuages
      markers.js              losange actif, colonne de lumière, étiquettes HTML projetées
      camera-path.js          cadrages, interpolation, arcs, paliers
      fallback.js             repli sans WebGL
    journey/
      render.js               génère le HTML du voyage depuis journey.js + content/
      scroll.js               étape courante et progression locale depuis le scroll
      panels.js               animation des panneaux
      hud.js                  barre du bas, frise, navigation clavier, URL
    ui/
      archive.js              modale des fiches : openArchive(type, id)
      menu.js                 menu « Explorer »
      audio.js                son d'ambiance (WebAudio, généré, désactivé par défaut)
    annexes/
      tree.js                 arbre généalogique (nouvelle implémentation)
      index.js                index des fiches (recherche + filtres)
      timeline.js             chronologie
      sources.js              sources et crédits
    styles/
      tokens.css, base.css, hud.css, journey.css, archive.css, annexes.css, tree.css
tools/
  check.mjs                   vérifications automatiques (§11)
  images.mjs                  variantes d'images (§10)
  shots/                      captures générées
```

### Schéma commun des fiches (`src/content/*.js`)

```js
export default [
  {
    id: 'dothraki',                   // stable, en minuscules, sans accent
    type: 'group',                    // group | house | lang | faith | creature | place
    title: 'Les Dothraki',
    kicker: 'Essos · Mer Dothrak',    // petite ligne au-dessus du titre
    lead: '…',                        // accroche en italique
    body: ['…', '…'],                 // paragraphes
    facts: [{ label: 'Langue', value: 'Dothraki' }, …],
    terms: ['Khal : chef', …],        // facultatif
    image: 'images/dothraki.webp',
    source: { label: '…', url: 'https://…' },
    tags: ['Peuples'],                // filtres de l'index
  },
];
```

Toutes les fiches, quel que soit leur type, s'affichent avec **la même modale**, et l'index en annexe les liste toutes.

---

## 3. Le voyage : les 14 étapes

### 3.1 Schéma d'une étape (`src/data/journey.js`)

```js
export const STEPS = [
  {
    id: 'mur', // utilisé dans l'URL : #etape-mur
    num: '01',
    place: 'Au-delà du Mur', // grand titre du panneau
    region: 'LE GRAND NORD', // petites capitales au-dessus du titre
    hook: '…', // 1 phrase d'accroche, NOUVELLE (≤ 160 caractères)
    transition: '…', // 1 phrase vers l'étape suivante, NOUVELLE (≤ 140 caractères)
    focus: { city: 'Châteaunoir' } | { x: 470, y: 60 }, // point visé, en coordonnées carte
    camera: { dist: 4.2, height: 3.0, azimuth: 0 }, // facultatif : surcharge du cadrage par défaut (§5.1)
    arc: 'normal' | 'high', // 'high' = passe au-dessus des nuages (traversée)
    image: 'assets/wall-hd.webp', // illustration principale du panneau
    links: [
      // contenus ouverts depuis le panneau, dans cet ordre
      { type: 'group', id: 'freefolk' },
      { type: 'creature', id: 'geants' },
      { type: 'house', id: 'stark', lineage: true }, // lineage → bouton « Voir la lignée »
    ],
  },
  // …
];
```

Les `type` correspondent aux fichiers de `src/content/` : `group`, `house`, `lang`, `faith`, `creature`, `place` (cités de Westeros et destinations d'Essos).

### 3.2 Les étapes et leur contenu

Toutes les fiches doivent apparaître au moins une fois dans le voyage **ou** dans l'index en annexe. Les 22 fiches de type `group` restent toutes dans l'index.

Dans le tableau ci-dessous, les contenus sont désignés par leur **titre** dans l'ancien site (`reference/`). En phase 0, tu leur attribues des `id` stables, puis tu reportes ces `id` dans `journey.js`. Pour lire le tableau : « beast » désigne une créature (`creature`), et « city » ou « destination » désigne un lieu (`place`).

| #   | id               | Lieu (focus)                                  | Liens                                                                                                                                                                                                                                                    |
| --- | ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | `intro`          | Vue du monde entier, sous les nuages          | — (écran d'intro, §7.1)                                                                                                                                                                                                                                  |
| 01  | `au-dela-du-mur` | Au-delà du Mur (≈ x 470, y 60)                | group `freefolk`, group `thenns`, beast `Géants`, beast `Marcheurs blancs & morts animés`, beast `Enfants de la Forêt`, lang `old`                                                                                                                       |
| 02  | `mur`            | Châteaunoir                                   | city `Châteaunoir`, group `nightwatch`                                                                                                                                                                                                                   |
| 03  | `winterfell`     | Winterfell                                    | city `Winterfell`, house `Stark` (lineage), house `Bolton`, faith `Les anciens dieux`, beast `Loups géants`, group `firstmen`                                                                                                                            |
| 04  | `iles-de-fer`    | Pyk                                           | city `Pyk`, group `ironborn`, house `Greyjoy`, faith `Le Dieu Noyé`                                                                                                                                                                                      |
| 05  | `conflans-val`   | entre Vivesaigues et les Eyrié                | city `Vivesaigues`, city `Les Eyrié`, house `Tully` (lineage), house `Arryn` (lineage), group `brotherhood`, group `andals`                                                                                                                              |
| 06  | `ouest`          | Castral Roc                                   | city `Castral Roc`, house `Lannister` (lineage)                                                                                                                                                                                                          |
| 07  | `port-real`      | Port-Réal                                     | city `Port-Réal`, house `Baratheon` (lineage), faith `La Foi des Sept`, group `kingsguard`, group `faithmilitant`, lang `common`                                                                                                                         |
| 08  | `peyredragon`    | Peyredragon                                   | city `Peyredragon`, house `Targaryen` (lineage), beast `Dragons`, lang `highvalyrian`                                                                                                                                                                    |
| 09  | `sud`            | entre Hautjardin, Villevieille et Lancehélion | city `Hautjardin`, city `Villevieille`, city `Lancehélion`, house `Tyrell` (lineage), house `Martell` (lineage), group `maesters`, group `dornish`, group `rhoynar`, lang `rhoynish`                                                                     |
| 10  | `braavos`        | Braavos (traversée, `arc: 'high'`)            | destination `Braavos`, group `braavosi`, group `faceless`, faith `Le Dieu Multiface`, destinations `Pentos`, `Lys`, `Myr`, `Tyrosh`, `Lorath`, `Norvos`, `Qohor`, `Volantis`, lang `lowvalyrian`, group `goldencompany`, faith `Le Maître de la Lumière` |
| 11  | `mer-dothrak`    | Vaes Dothrak                                  | destination `Vaes Dothrak`, group `dothraki`, faith `Le Grand Étalon`, lang `dothraki`, group `lhazareen`, lang `lhazareen`                                                                                                                              |
| 12  | `baie-des-serfs` | Meereen                                       | destinations `Astapor`, `Yunkaï`, `Meereen`, group `unsullied`, group `harpy`, group `secondsons`, group `ghiscari`, lang `ghiscari`, destination `Qarth`, lang `qartheen`                                                                               |
| 13  | `valyria`        | Valyria                                       | destination `Valyria`, group `valyrians`, puis un bloc de conclusion et des liens vers les annexes                                                                                                                                                       |

- Si un titre de ce tableau ne correspond à aucun contenu de `reference/`, **signale-le** au lieu d'inventer.
- Au-delà de 6 liens, le panneau affiche les 4 premiers et un bouton « + N autres » qui déplie le reste.
- Les phrases `hook` et `transition` sont à écrire en français, avec un ton sobre, littéraire et sans spoiler majeur. Elles doivent être originales : aucune citation de la série ou des livres. Propose-les toutes en phase 3 pour validation.

---

## 4. Données de carte (`src/data/map.json`)

### 4.1 Schéma

```json
{
  "version": 2,
  "bounds": { "w": 2600, "h": 1300 },
  "regions":   { "gift": [[x,y],…], "north": …, …,  "essos-west": …, "dothraki-sea": …, "slavers-bay": …, "valyria": …, "lhazar": …, "red-waste": …, "qarth": … },
  "cities":    [ { "name": "Winterfell", "x": 384.75, "y": 318.89, "region": "north" }, … ],
  "mountains": [ { "x": 495, "y": 600, "rx": 70, "ry": 110, "h": 1.0, "name": "Montagnes de la Lune" }, … ],
  "rivers":    [ { "name": "Trident", "points": [[x,y],…], "width": 3 }, … ],
  "beyondWall":[[x,y],…]
}
```

- **Système de coordonnées** : on reprend celui de `reference/ancien-site/atlas-data.json` (Westeros sur environ x 180–625, y 95–1100), étendu vers l'est jusqu'à `w = 2600`. Les régions et les 13 cités de Westeros sont reprises telles quelles comme point de départ. Tu peux affiner les contours s'ils sont trop grossiers une fois en relief, en me montrant l'avant / après.
- **Passage carte → monde 3D**, valable partout : `X = (x - 410) / 80`, `Z = (y - 590) / 80`. Définis cette fonction dans `src/map/scene.js` sous le nom `toWorld(x, y)` et utilise-la partout.
- **Au-delà du Mur** (`beyondWall`) : une terre au nord de `gift`, qui va jusqu'au bord supérieur de la carte (y ≈ 0–150). C'est la zone de l'étape 01.
- **Essos** : dessine des contours **stylisés et simplifiés, de ta main**. Ne décalque aucune carte. Positions indicatives des cités, à ajuster pour que ce soit beau et lisible :

| Cité            | x    | y    |
| --------------- | ---- | ---- |
| Braavos         | 990  | 360  |
| Lorath          | 1080 | 230  |
| Pentos          | 1010 | 560  |
| Norvos          | 1180 | 470  |
| Qohor           | 1380 | 520  |
| Myr             | 1080 | 760  |
| Lys             | 1110 | 960  |
| Tyrosh          | 960  | 860  |
| Volantis        | 1290 | 960  |
| Valyria         | 1520 | 1170 |
| Vaes Dothrak    | 1900 | 480  |
| Lhazar (région) | 2000 | 820  |
| Astapor         | 1840 | 1090 |
| Yunkaï          | 1900 | 1020 |
| Meereen         | 1960 | 950  |
| Qarth           | 2430 | 1160 |

La mer Étroite fait environ 300 à 400 unités de large entre la côte est de Westeros (≈ x 620) et la côte ouest d'Essos (≈ x 940–1000).

- **Montagnes** (`mountains`, au minimum) : Croc de Givre (au-delà du Mur, ouest), montagnes du Nord ouest, Montagnes de la Lune (Val), Montagnes Rouges (Dorne nord), Mère des Montagnes (près de Vaes Dothrak), Montagnes Fumantes (Valyria). Champ `h` entre 0,4 et 1,0.
- **Rivières** (`rivers`) : Trident, Néra, Mander, Rhoyne (Essos). Ce sont des polylignes simples.

### 4.2 Textures générées (`map/textures.js`)

Génère les textures à l'exécution, dans des `<canvas>` (OffscreenCanvas dans un Worker si disponible), à partir de `map.json`.

**Résolution** : 4096 × 2048 sur ordinateur, 2048 × 1024 sur mobile (moins de 700 px ou `navigator.hardwareConcurrency <= 4`). Le ratio vaut `bounds.w / bounds.h` = 2. Pixels par unité de carte : `4096 / 2600`.

**A. Relief (`heightTex`)**, en niveaux de gris où 0 = fond marin et 255 = sommet :

1. Remplis tout le fond à 0.
2. Remplis toutes les terres (regions + beyondWall) à 70, puis applique `filter: blur(18px)` (pour 4096 px de large, à mettre à l'échelle sinon) pour obtenir des côtes douces.
3. Pour chaque montagne, dessine un dégradé radial elliptique jusqu'à `70 + 150 × h`, en mode `lighter`.
4. Ajoute un bruit fractal (fBm, 5 octaves, en JS pur, avec une seed fixe pour un résultat déterministe) d'amplitude ±18 sur les terres seulement, en utilisant le masque des terres.
5. Creuse les rivières : un trait de 3 px à valeur −20 sur les terres, légèrement flouté.

**B. Parchemin (`colorTex`)** :

- mer `#0d1a1f`, avec un dégradé radial plus sombre vers les bords ;
- terres `#8a7a5a`, modulées par le relief : sommets éclaircis vers `#b5a47c`, vallées assombries vers `#6d6046` ;
- côtes : un trait d'encre `#1a1510` de 2,5 px avec un léger tremblé (déplacement par bruit de ±1 px), puis un second trait à 30 % d'opacité, décalé de 4 px vers le large (contour « de graveur ») ;
- montagnes : des hachures courtes à 35°, `#2a2218` à 40 % d'opacité, dont la densité est proportionnelle à `h` ;
- rivières : un trait `#1d2a2c` de 1,5 px ;
- grain de papier : du bruit à 6 % d'opacité sur toute la texture, plus quelques taches irrégulières à 4 % ;
- **aucun texte dessiné dans la texture** : les noms sont des étiquettes HTML (§4.5).

**C. Normales (`normalTex`)** : calculées depuis le relief par différences finies (Sobel), avec une intensité de 2,5.

Toutes les textures : `colorSpace = SRGBColorSpace` pour la couleur uniquement, `anisotropy = renderer.capabilities.getMaxAnisotropy()`, mipmaps activées.

### 4.3 Terrain (`map/terrain.js`)

- `PlaneGeometry(bounds.w / 80, bounds.h / 80, segX, segY)`, puis `rotateX(-π/2)`. Le centre du plan correspond au centre de la carte, positionné avec `toWorld(bounds.w / 2, bounds.h / 2)`.
- Subdivisions : 1024 × 512 sur ordinateur, 512 × 256 sur mobile.
- Matériau `MeshStandardMaterial({ map: colorTex, displacementMap: heightTex, displacementScale: 1.1, displacementBias: -0.25, normalMap: normalTex, roughness: 1, metalness: 0 })`. Le niveau 0 du relief donne y = −0,25, sous la mer.

### 4.4 Mer, lumière, brouillard (`map/sea.js`, `map/scene.js`)

- **Mer** : un plan à y = 0 qui couvre toute la carte avec 20 % de marge. Couleur `#0b1a20`, opacité 0,92, `transparent: true`. Ondulation lente dans le shader : déplacement normal ±0,01 et reflet spéculaire très discret. Pas de vagues visibles en vue d'ensemble, seulement une vibration de lumière.
- **Brouillard** : `scene.fog = new THREE.FogExp2(0x0a1012, 0.045)` et `scene.background = new THREE.Color(0x0a1012)`. Les bords de la carte disparaissent dans le noir : **il n'y a plus de cadre de maquette ni de table**.
- **Lumières** :
  - une lumière directionnelle chaude `#ffd9a0`, intensité 2,2, très rasante (élévation d'environ 18°, venant du sud-ouest) ;
  - une lumière hémisphérique froide `#8fb3c0` / `#0a1012`, intensité 0,35 ;
  - pas d'ombres portées dynamiques (le coût est trop élevé).
- **Rendu** : `toneMapping = ACESFilmicToneMapping`, exposition 1,0, `pixelRatio = min(devicePixelRatio, 1.75)` sur ordinateur et 1,5 sur mobile.
- **Caméra** : `PerspectiveCamera(35, aspect, 0.1, 80)`.

### 4.5 Marqueurs et étiquettes (`map/markers.js`)

- **Lieu actif** : un losange doré à plat au sol (contour `#bba476`, 0,35 unité, double trait), une colonne de lumière verticale (cylindre ouvert, dégradé additif de `#bba476` 35 % à 0 %, hauteur 1,6), et une pulsation lente de l'échelle (×1 → ×1,08, période 2,4 s). Pas de pulsation en reduced-motion.
- **Étiquettes** : des `<span>` HTML positionnés par projection 3D → écran à chaque image. Police Cormorant Garamond 17 px (22 px pour le lieu actif), couleur `#e9e1c6`, `text-shadow: 0 1px 8px #000c`, **sans boîte ni fond**.
- **Visibilité** : seulement les cités de l'étape courante, de la précédente et de la suivante. Les autres sont à opacité 0, avec une transition de 400 ms. Une étiquette est masquée si elle est derrière la caméra ou hors du cadre, avec 8 % de marge.
- **Option** : des noms de mers en italique, très discrets (12 px, opacité 0,35) : « Mer Étroite », « Mer d'Été », « Mer Frissonnante ».

### 4.6 Nuages (`map/clouds.js`)

- Une texture de nuage de 256 px générée en canvas : plusieurs dégradés radiaux bruités, blanc cassé `#d9d6cc`.
- 18 sprites sur ordinateur, 8 sur mobile. Hauteur y entre 2,5 et 5,0, échelle entre 4 et 9, opacité entre 0,15 et 0,32, `depthWrite: false`. Dérive de 0,02 unité par seconde vers l'est. Les nuages se répartissent sur toute la carte, avec une concentration au-dessus de la mer Étroite.
- Fondu selon la distance à la caméra : un nuage à moins de 1,5 unité devient très transparent, pour éviter le « mur blanc ».
- Intro : 12 sprites supplémentaires couvrent toute la carte à y ≈ 6. Pendant les 40 premiers % de la sortie de l'intro (§7.1), ils s'écartent radialement depuis le centre et s'estompent.

---

## 5. Caméra et scroll

### 5.1 Cadrage d'une étape (`map/camera-path.js`)

- `target` = `toWorld(focus)`, à y = 0,2.
- `position` = `target + (sin(azimuth) × dist, height, cos(azimuth) × dist)`. Valeurs par défaut : `dist 3.6`, `height 3.2`, `azimuth 0`. La caméra est au sud du lieu et regarde vers le nord.
- **Panneau à gauche ou à droite** : quand le panneau est à gauche, le lieu doit apparaître dans le tiers droit de l'écran, et inversement. On obtient ce décalage avec `camera.setViewOffset`, en déplaçant le centre optique de ±18 % de la largeur. La caméra reste donc orientée droit vers sa cible.
- **Intro** : `target` au centre de la carte, `position` à `(centre.x, 22, centre.z + 10)`. Le monde entier est visible sous les nuages.

### 5.2 Trajet entre deux étapes

- Les positions et les cibles sont interpolées avec `easeInOutCubic(t)`.
- Arc : `position.y += sin(π × t) × hArc`, avec `hArc = clamp(0.35 × distance(A, B), 1.0, 6.0)`. Pour `arc: 'high'`, `hArc = max(6.5, …)` : la caméra passe au-dessus des nuages (y > 5,5).
- La cible suit le même easing. Pas de rotation brusque : `lookAt` est fait à chaque image sur la cible interpolée.

### 5.3 Pilotage par le scroll (`journey/scroll.js`)

- Chaque étape est un `<article class="stop">` dans le flux de la page, d'une hauteur de **160 vh** sur ordinateur et **140 vh** sur mobile. L'intro mesure 120 vh.
- Pour l'article courant, la **progression locale** `u` va de 0 à 1 entre le moment où le haut de l'article atteint le bas de l'écran et le moment où le bas de l'article atteint le haut de l'écran, ramené à la partie utile. Implémentation précise :

```
u = clamp((scrollY + innerHeight - article.offsetTop) / (article.offsetHeight), 0, 1)
```

Ajuste si nécessaire pour que les paliers tombent comme décrit ci-dessous, et documente la formule finale en commentaire.

- **Phases dans un article** :
  - `u ∈ [0, 0.40]` : **vol** de l'étape précédente vers celle-ci (`t = u / 0.40`) ;
  - `u ∈ [0.40, 1]` : **palier**, la caméra est posée. Elle fait une très légère dérive d'azimut (±3°) pour rester vivante, sauf en reduced-motion.
- **Panneau** :
  - opacité 0 → 1 et `translateY` 24px → 0 pendant `u ∈ [0.32, 0.48]` ;
  - pleinement visible de 0,48 à 0,90 ;
  - fondu de sortie sur `u ∈ [0.90, 1]`.
- Le panneau est `position: sticky` dans son article, centré verticalement, donc il reste à l'écran pendant le palier.
- **Rendu** : la scène 3D est fixe (`position: fixed; inset: 0; z-index: 0`), et le contenu passe au-dessus (`z-index: 1`).
- Une seule écoute de scroll passive, avec calcul dans `requestAnimationFrame`. GSAP ScrollTrigger (`scrub: true`) est autorisé, mais la logique `u` ci-dessus doit rester explicite dans le code.
- **URL** : à chaque changement d'étape, `history.replaceState(null, '', '#etape-' + id)`. Au chargement, si l'URL contient `#etape-xxx`, la page défile jusqu'au **début du palier** de cette étape (`u = 0.48`), sans animation.

---

## 6. Structure HTML (`index.html`)

L'ordre du DOM doit être lisible sans CSS ni JS. Tous les textes du voyage sont rendus en HTML **au chargement**, depuis `src/content/` et `journey.js` (par `journey/render.js`), avant toute initialisation WebGL.

```html
<body>
  <a class="skip-link" href="#etape-au-dela-du-mur">Aller au voyage</a>
  <canvas id="world" aria-hidden="true"></canvas>
  <!-- scène 3D fixe -->
  <div id="world-labels" aria-hidden="true"></div>
  <!-- étiquettes projetées -->
  <div class="hud-frame" aria-hidden="true">…ornements SVG…</div>
  <header class="hud-top">…logo · bouton son · bouton Explorer…</header>
  <nav id="menu" hidden>…étapes numérotées + annexes…</nav>
  <main>
    <section id="intro" class="intro">…h1, accroche, bouton Commencer…</section>
    <section id="voyage" aria-label="Le voyage">
      <article class="stop" id="etape-au-dela-du-mur" data-step="au-dela-du-mur">
        <div class="stop-panel">
          <p class="stop-region">LE GRAND NORD</p>
          <p class="stop-num" aria-hidden="true">01</p>
          <h2>Au-delà du Mur</h2>
          <p class="stop-hook">…</p>
          <figure>…</figure>
          <ul class="stop-links">
            …boutons qui ouvrent la modale…
          </ul>
          <p class="stop-transition">…</p>
        </div>
      </article>
      …
    </section>
    <section id="annexes">
      <section id="arbre">…arbre généalogique…</section>
      <section id="index">…22 fiches, recherche, filtres…</section>
      <section id="chronologie">…eras…</section>
      <section id="sources">…sources + crédits armoiries…</section>
    </section>
  </main>
  <nav class="hud-bottom" aria-label="Navigation du voyage">…</nav>
  <footer>…avertissement fan site…</footer>
  <dialog id="archive">…</dialog>
  <script type="module" src="/src/main.js"></script>
</body>
```

- Un seul `<h1>` (dans l'intro). Les étapes sont en `<h2>`, et les sous-parties des panneaux et des annexes en `<h3>`.
- Les liens du panneau sont des `<button>` qui ouvrent la modale `#archive` via `openArchive(type, id)`. La modale affiche, dans cet ordre : l'image, le kicker, le titre, l'accroche, les paragraphes, les faits, les termes et le lien source.
- Les annexes sont **après** le voyage dans le flux. Le canvas 3D s'estompe (opacité 0 en 600 ms) quand `#annexes` entre à l'écran, pour laisser un fond uni lisible.

---

## 7. Écrans

### 7.1 Intro

- Plein écran, le monde sous les nuages en fond.
- Au centre : le surtitre « GUIDE NON OFFICIEL · WESTEROS & ESSOS » en petites capitales, le `<h1>` « A Realm Divided » (Cormorant, `clamp(56px, 9vw, 132px)`), une phrase d'accroche (NOUVELLE, 1 ligne), et le bouton « Commencer le voyage ↓ ». Le bouton défile jusqu'au palier de l'étape 01.
- Le premier scroll écarte les nuages (§4.6) et la caméra plonge vers l'étape 01 avec un arc descendant.

### 7.2 Panneau d'étape

- Largeur : `min(460px, 38vw)` sur ordinateur. Côté : à gauche par défaut, puis en alternance, ou selon `panelSide` si l'étape le précise.
- Fond `#0a1112cc` avec `backdrop-filter: blur(12px)`, un filet doré de 1 px `#bba47666` du côté de la carte, et un padding de 40px 44px.
- Contenu, de haut en bas :
  - la région en petites capitales, 12 px, interlettrage 0,22 em, couleur or ;
  - le numéro, Cormorant 120 px, `#bba47633`, en arrière-plan du titre ;
  - le titre, en Cormorant `clamp(48px, 5.4vw, 88px)`, avec une interligne de 0,95 ;
  - l'accroche, en Cormorant italique 22 px ;
  - l'illustration au ratio 16/9, avec `loading="lazy"`, `decoding="async"` et un `alt` descriptif ;
  - les liens : des puces bordées, 14 px, avec une icône de type (petit symbole SVG) et le nom ;
  - la transition, en Cormorant italique 18 px, `#a9b3a8`, précédée d'un filet de 40 px.
- Le panneau doit tenir dans `100vh - 160px`. Si le contenu dépasse, le panneau défile en interne (`overflow: auto`, scrollbar fine dorée).

### 7.3 Moment « traversée » (étape 10)

- Pendant le vol 09 → 10 (`arc: 'high'`), un court texte centré apparaît au moment où la caméra est au-dessus des nuages : « LA MER ÉTROITE », en petites capitales, 14 px, interlettrage 0,4 em. Il apparaît sur `t ∈ [0.35, 0.65]` du vol.

### 7.4 Fin (étape 13 puis annexes)

- Le panneau de Valyria se termine par un bloc de conclusion (NOUVEAU, 2 à 3 phrases, à faire valider) et par trois boutons : « L'arbre des familles », « Toutes les fiches », « Chronologie ».

---

## 8. Interface-cadre (HUD) et typographie

### 8.1 Tokens (`src/styles/tokens.css`)

```css
:root {
  --bg: #0a1012;
  --bg-2: #0e1719;
  --panel: #0a1112cc;
  --ink: #ece6d2;
  --ink-2: #c9cbbd;
  --ink-3: #a9b3a8;
  --gold: #bba476;
  --gold-line: #bba47655;
  --gold-soft: #bba47622;
  --serif: 'Cormorant Garamond', Georgia, serif;
  --sans: 'Manrope', system-ui, sans-serif;
  --fs-label: 12px; /* petites capitales — jamais moins de 11px nulle part */
  --fs-small: 14px;
  --fs-body: 17px;
  --fs-lead: 22px;
  --lh-body: 1.65;
  --frame: 24px; /* 12px sous 700px */
  --hud-top: 64px;
  --hud-bottom: 60px;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}
```

Règle absolue : **aucun texte rendu en dessous de 11 px**, quelle que soit la taille d'écran. Elle s'applique aussi à l'arbre généalogique : les noms dans ses cartes font au moins 14 px, les rôles au moins 12 px.

### 8.2 Cadre

- Quatre filets de 1 px `var(--gold-line)` à `var(--frame)` des bords, en `position: fixed` et `pointer-events: none`.
- Des ornements SVG originaux de 18 px dans les quatre angles (motif de coin simple : deux traits et un losange), plus un ornement de 60 × 14 px centré en haut, sur le filet.
- Sous 700 px : filets seulement, sans ornements.

### 8.3 En-tête (`.hud-top`)

- Hauteur `--hud-top`, à l'intérieur du cadre. Logo « GoT · A REALM DIVIDED » à gauche, bouton son et bouton « EXPLORER » à droite.
- Fond transparent sur l'intro. Dès qu'on a quitté l'intro, fond `#0a1012d9` avec `backdrop-filter: blur(10px)`.

### 8.4 Barre du bas (`.hud-bottom`)

- Hauteur `--hud-bottom`, à l'intérieur du cadre, avec un filet doré en haut.
- **Centre** : `← Châteaunoir   ·   03 / 13   ·   Les Îles de Fer →`. Les deux noms sont des boutons qui volent vers l'étape (défilement doux vers son palier). Le numéro est en Cormorant 18 px.
- **Sous le centre** : la frise, avec un point de 5 px par étape (14 points, intro comprise) reliés par un filet. Le point courant est en or, de 8 px, avec un halo. Chaque point est un bouton avec `aria-label`, et le nom de l'étape s'affiche en infobulle au survol.
- **Gauche** : le bouton son (`ui/audio.js`). C'est un drone grave généré en WebAudio, désactivé par défaut, qui se coupe quand l'onglet est caché.
- **Droite** : un lien « Annexes ↓ ».
- La barre est masquée sur l'intro et dans les annexes.

### 8.5 Menu « Explorer »

- Plein écran, avec un fond `#0a1012f2`.
- Deux colonnes : « Le voyage », avec les 13 étapes numérotées, et « Annexes ».
- Navigation au clavier : piège du focus, fermeture avec Échap, retour du focus sur le bouton qui a ouvert le menu.

---

## 9. Navigation clavier et accessibilité

- `→` ou `PageDown` : étape suivante. `←` ou `PageUp` : étape précédente. Ces raccourcis sont actifs dans le voyage, sauf si le focus est dans un champ ou une modale.
- `Échap` ferme la modale et le menu.
- Le focus est toujours visible : `outline: 2px solid var(--gold); outline-offset: 3px`.
- Une région `aria-live="polite"` annonce « Étape 03 sur 13 : Winterfell » à chaque changement d'étape.
- Contraste : tout le texte atteint au moins AA sur `--bg` et sur `--panel`.
- **`prefers-reduced-motion: reduce`** :
  - pas de vol : la caméra **coupe** directement d'une étape à l'autre, avec un fondu noir de 300 ms au changement d'étape ;
  - pas de nuages animés, de pulsation, de dérive ni d'ondulation de la mer ;
  - les panneaux apparaissent sans translation.
- `document.visibilitychange` : la boucle de rendu et le son sont mis en pause quand l'onglet est caché.

---

## 10. Mobile, performance, replis

- **Sous 700 px** :
  - le panneau devient une feuille en bas d'écran, sur toute la largeur moins le cadre, d'une hauteur maximale de 48 vh, avec défilement interne ;
  - la carte reste visible au-dessus, et le décalage optique de la caméra est vertical (le lieu est dans le tiers supérieur) ;
  - la barre du bas se réduit à « ‹ · 03 / 13 · › » plus la frise ;
  - seule l'étiquette du lieu actif est affichée.
- **Budgets** :
  - initialisation de la scène (génération des textures comprise) en moins de 1,5 s sur un portable récent ;
  - 60 i/s en palier et plus de 45 i/s pendant les vols sur ordinateur ;
  - poids du JS de production (gzip) sous 250 Ko, Three.js compris : importe uniquement les modules utilisés ;
  - poids total de la première vue sous 1,5 Mo.
- **Textures** : générées dans `textures.worker.js` avec OffscreenCanvas. Repli sur le thread principal par tranches (`requestIdleCallback`) si OffscreenCanvas n'est pas disponible. Pendant la génération, un écran de chargement discret s'affiche dans l'intro (filet doré qui se remplit). Jamais d'écran blanc.
- **Rendu à la demande** : rendre en continu seulement pendant un vol, une animation de nuage ou une pulsation visible. En palier et en reduced-motion, rendre seulement quand quelque chose change.
- **Sans WebGL** (détection : échec de `WebGLRenderer` ou `--disable-3d-apis`) :
  - on garde le même voyage en HTML ;
  - le fond est la texture parchemin générée en 2D, affichée dans un `<canvas>` 2D fixe, avec un zoom CSS et une translation vers le lieu de l'étape ;
  - on garde aussi les étiquettes et le losange en SVG.
- **Images** : `tools/images.mjs` (avec `sharp`) génère des variantes de 640 px et 1280 px en `.webp` pour chaque illustration de `public/images/`. Toutes les `<img>` utilisent `srcset` et `sizes`, ainsi que `loading="lazy"` et `decoding="async"` hors de la première vue.

---

## 11. Vérifications automatiques (`npm run check` → `tools/check.mjs`)

Le script construit le site (`vite build`), le sert en local (`vite preview`, port 4173), puis vérifie avec Playwright :

1. **Console** : 0 erreur et 0 exception JS, sur ordinateur (1440×900) et sur mobile (390×844).
2. **Contenus** : chaque fiche de `src/content/` est accessible. Son titre est présent dans le DOM (voyage ou index), et sa modale s'ouvre en affichant tous ses paragraphes.
3. **Typographie** : aucun élément texte visible avec `font-size` calculée sous 11 px, testé à chaque étape, dans les annexes, et sur les deux tailles d'écran.
4. **Débordement** : pas de défilement horizontal (`scrollWidth <= innerWidth`).
5. **Étapes** : pour chaque étape, le script va au palier (`#etape-xxx`), attend 1,5 s et capture `tools/shots/{desktop|mobile}-{num}-{id}.png`. Il vérifie que l'étiquette du lieu actif est visible et qu'elle n'est pas masquée par le panneau (pas d'intersection de leurs rectangles).
6. **Reduced-motion** : même parcours avec `reducedMotion: 'reduce'`, pour vérifier qu'aucune caméra n'est en vol plus de 400 ms après le changement d'étape.
7. **Sans WebGL** : lancement avec `--disable-3d-apis`. La page s'affiche, le repli 2D est actif et le voyage reste navigable.
8. **Accessibilité** : `@axe-core/playwright` sur l'intro, une étape, la modale ouverte et chaque annexe, avec 0 violation `serious` ou `critical`.
9. **Navigation** : `→` fait passer de l'étape 03 à 04, un clic sur un point de la frise mène à la bonne étape, et `#etape-braavos` en URL directe ouvre la bonne étape.
10. **Poids** : le JS gzip et la première vue respectent les budgets du §10.
11. **Droits** : aucune requête réseau vers un domaine externe pendant tout le parcours.

Pour le rendu WebGL en headless, lance Chromium avec `--use-gl=swiftshader --enable-webgl --ignore-gpu-blocklist`.

**À chaque fin de phase, regarde toi-même les captures produites** et décris ce que tu vois dans ton compte rendu, y compris ce qui ne te paraît pas encore beau.

---

## 12. Phases

Chaque phase se termine par `npm run check` au vert (pour les points concernés), des captures et un compte rendu. Ensuite, attends ma validation.

### Phase 0 — Fondations

- Le projet Vite, git, Prettier, les polices auto-hébergées, `tokens.css` et `base.css`.
- `tools/check.mjs` en version minimale : build, serveur, console et capture de la page vide.
- **Extraction des contenus** depuis `reference/` vers `src/content/`, au schéma commun (§2), avec des `id` stables. Copie des illustrations, portraits et armoiries dans `public/`.
- Un rapport d'extraction : le nombre de fiches par type, les fiches sans image ou sans source, et les incohérences ou fautes repérées. Ne corrige rien sans mon accord.
- `src/data/map.json` initial avec les régions et cités de Westeros reprises de `reference/`.

### Phase 1 — Le terrain (validation du style, la plus importante)

- `map.json` pour **Westeros seulement** : `beyondWall`, montagnes, rivières.
- `textures.js`, `terrain.js`, `sea.js` et `scene.js`, avec le brouillard et les lumières.
- `lab.html` : caméra fixe en vue d'ensemble, plus trois vues rapprochées (le Mur, Winterfell, Port-Réal) accessibles par les touches 1, 2 et 3. Ajoute un petit panneau de réglages (lil-gui en devDependency, chargé seulement dans `lab.html`) pour ajuster en direct la palette, la hauteur du relief, la densité du brouillard et la lumière.
- Livre 4 captures et 2 variantes de palette parchemin. **Ne passe pas à la suite** tant que je n'ai pas validé le rendu.

### Phase 2 — Le vol

- `camera-path.js` et `scroll.js` sur 3 étapes de test dans `lab.html` : arcs, paliers, décalage optique, reduced-motion.
- Une vidéo courte du vol, enregistrée avec la capture vidéo de Playwright (`recordVideo`) et mise dans `tools/shots/`.

### Phase 3 — Le voyage (Westeros)

- `journey.js` pour les étapes 00 à 09. Propose les phrases `hook` et `transition` ainsi que l'accroche de l'intro, que je validerai.
- `index.html`, `journey/render.js`, les panneaux, la modale `openArchive`, et les marqueurs et étiquettes filtrées.

### Phase 4 — HUD et typographie

- Le cadre, l'en-tête, la barre du bas, la frise, le menu et la navigation clavier.
- La règle des 11 px minimum, vérifiée partout.

### Phase 5 — Annexes

- **L'arbre généalogique**, en nouvelle implémentation (`annexes/tree.js`) :
  - familles en colonnes, liens de mariage et de filiation en SVG ;
  - recherche, zoom et vue d'ensemble ;
  - option « Révéler les filiations secrètes », désactivée par défaut (anti-spoilers) ;
  - le bouton « Voir la lignée » d'un panneau centre l'arbre sur la maison.
- L'index des fiches avec recherche et filtres par `tags`, la chronologie, et la page Sources avec tous les crédits.

### Phase 6 — Atmosphère et Essos

- Les nuages, l'intro sous les nuages, la pulsation du losange, la dérive en palier et le son.
- Les contours, les montagnes et les rivières d'Essos, l'extension du terrain, les étapes 10 à 13, la traversée (`arc: 'high'`) avec le texte « LA MER ÉTROITE », et la conclusion de l'étape 13.

### Phase 7 — Finitions

- Le mobile, le repli sans WebGL, le rendu à la demande, le Worker de textures, les variantes d'images, axe-core et les budgets, avec `npm run check` complet au vert.
- Un `README.md` : lancer le projet, structure, comment ajouter ou modifier une étape ou une fiche, comment lancer les vérifications, comment déployer `dist/`.

---

## 13. Critères de réussite finaux

- Quand on fait défiler la page, on a l'impression de **survoler une carte ancienne en relief**, sombre et brumeuse, du Mur jusqu'à Valyria, et non de faire défiler une page.
- On sait toujours **où on est** (numéro, lieu, frise), **d'où on vient** et **où on va**.
- La traversée de la mer Étroite est le moment le plus spectaculaire du site.
- Toutes les fiches de l'ancien site sont présentes, dans le voyage ou dans l'index.
- Aucun texte n'est sous 11 px, et le texte courant fait au moins 16 px.
- `npm run check` passe entièrement, sur ordinateur et sur mobile.
- Aucun asset officiel, aucune requête externe, et tous les crédits des armoiries sont présents.
