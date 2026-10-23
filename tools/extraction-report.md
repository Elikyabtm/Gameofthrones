# Rapport d'extraction — phase 0

Source : `reference/ancien-site/` (`encyclopedia.js`, `atlas.js`, `atlas-data.json`, `genealogy.js`).
Script : `node tools/extract-content.mjs` (relançable). Les textes sont repris **mot pour mot** : rien n'a été corrigé.

## 1. Nombre de fiches par type

| Type               | Fichier                                                 | Nombre | Attendu (PROJET.md) |
| ------------------ | ------------------------------------------------------- | -----: | ------------------: |
| `group`            | `groups.js` (+ `groups/westeros.js`, `groups/essos.js`) |     22 |                  22 |
| `house`            | `houses.js`                                             |     10 |                  10 |
| `lang`             | `languages.js`                                          |      9 |                   9 |
| `faith`            | `faiths.js`                                             |      6 |                   6 |
| `creature`         | `creatures.js`                                          |      5 |                   5 |
| `era`              | `eras.js`                                               |      4 |                   4 |
| `place` (Westeros) | `places/westeros.js`                                    |     13 |                  13 |
| `place` (Essos)    | `places/essos.js`                                       |     15 |                  15 |
| Personnages        | `people.js` (+ `people/*.js`)                           |     67 |                   — |
| Unions / liens     | `people/links.js`                                       | 29 / 4 |                   — |

Tous les titres cités dans le tableau §3.2 existent dans l'ancien site : aucun contenu manquant.

## 2. Correspondance titre → `id`

| Type          | Titre → id                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Groupes (22)  | Dothraki → `dothraki` · Immaculés → `unsullied` · Peuple libre → `freefolk` · Garde de Nuit → `nightwatch` · Fer-nés → `ironborn` · Dorniens → `dornish` · Premiers Hommes → `firstmen` · Andals → `andals` · Rhoynar → `rhoynar` · Valyriens → `valyrians` · Ghiscari → `ghiscari` · Braaviens → `braavosi` · Lhazaréens → `lhazareen` · Sans-Visage → `faceless` · Puînés → `secondsons` · Compagnie Dorée → `goldencompany` · Fraternité sans Bannières → `brotherhood` · Garde Royale → `kingsguard` · Mestres → `maesters` · Foi Militante → `faithmilitant` · Fils de la Harpie → `harpy` · Thenns → `thenns`                                                                 |
| Maisons (10)  | Stark → `stark` · Lannister → `lannister` · Targaryen → `targaryen` · Baratheon → `baratheon` · Greyjoy → `greyjoy` · Tyrell → `tyrell` · Martell → `martell` · Tully → `tully` · Arryn → `arryn` · Bolton → `bolton`                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Langues (9)   | Langue commune → `common` · Dothraki → `dothraki` · Haut valyrien → `highvalyrian` · Valyriens d'Essos → `lowvalyrian` · Ancienne langue → `old` · Rhoynais → `rhoynish` · Ancien ghiscari → `ghiscari` · Qarthien → `qartheen` · Lhazaréen → `lhazareen`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Croyances (6) | Les anciens dieux → `anciens-dieux` · La Foi des Sept → `foi-des-sept` · Le Maître de la Lumière → `maitre-de-la-lumiere` · Le Dieu Noyé → `dieu-noye` · Le Dieu Multiface → `dieu-multiface` · Le Grand Étalon → `grand-etalon`                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Créatures (5) | Dragons → `dragons` · Loups géants → `loups-geants` · Géants → `geants` · Marcheurs blancs & morts animés → `marcheurs-blancs` · Enfants de la Forêt → `enfants-de-la-foret`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Lieux (28)    | Châteaunoir → `chateaunoir` · Winterfell → `winterfell` · Blancport → `blancport` · Vivesaigues → `vivesaigues` · Les Eyrié → `les-eyrie` · Pyk → `pyk` · Castral Roc → `castral-roc` · Port-Réal → `port-real` · Peyredragon → `peyredragon` · Hautjardin → `hautjardin` · Villevieille → `villevieille` · Accalmie → `accalmie` · Lancehélion → `lancehelion` · Braavos → `braavos` · Pentos → `pentos` · Volantis → `volantis` · Lys → `lys` · Myr → `myr` · Tyrosh → `tyrosh` · Qohor → `qohor` · Norvos → `norvos` · Lorath → `lorath` · Vaes Dothrak → `vaes-dothrak` · Astapor → `astapor` · Yunkaï → `yunkai` · Meereen → `meereen` · Qarth → `qarth` · Valyria → `valyria` |
| Périodes (4)  | L'Âge des Héros → `age-des-heros` · La Conquête → `conquete` · La Rébellion → `rebellion` · Au début de la série → `debut-de-la-serie`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

Les `id` des groupes et des langues sont ceux de l'ancien site (en anglais) : PROJET.md §3.2 les cite déjà sous cette forme (`freefolk`, `nightwatch`, `old`, `common`…). Les autres `id` sont créés en français.

## 3. Fiches sans image

- **9 langues** : aucune illustration dans l'ancien site.
- **13 cités de Westeros** : l'ancien site n'affichait qu'un texte sur la carte.
- Les périodes n'ont pas d'image (ce n'est pas prévu par le schéma).

**Images partagées** entre plusieurs fiches (illustrations « d'ambiance » réutilisées) :

- `braavos.webp` : Braaviens + 9 destinations (Braavos, Pentos, Volantis, Lys, Myr, Tyrosh, Norvos, Lorath, Qarth) ;
- `immacules.webp` : Immaculés + Qohor, Astapor, Yunkaï, Meereen ;
- `nord.webp` : maisons Stark, Tully, Arryn, Bolton ;
- `couronne.webp` : maisons Lannister, Baratheon, Tyrell, Martell ;
- `dragon.webp` : maison Targaryen, Dragons, Valyria ;
- `dothraki.webp` : Dothraki, Grand Étalon, Vaes Dothrak ;
- `mur.webp` : maison Greyjoy (!), Marcheurs blancs ;
- `sans-visage.webp` : Sans-Visage, Dieu Multiface.

**Médias non utilisés** : l'illustration `trone-de-fer.webp` n'est rattachée à aucune fiche, et le portrait `walder.webp` ne correspond à aucun personnage de l'arbre (Walder Frey en est absent).

## 4. Fiches sans source

- Seuls les **22 groupes** et les **9 langues** ont un lien source.
- Sans source : les 10 maisons, les 6 croyances, les 5 créatures et les 28 lieux.

## 5. Incohérences et fautes repérées

**Typographie** : aucune apostrophe droite, aucun guillemet droit, aucune double espace. La ponctuation haute est bien précédée d'une espace partout.

**Fond**

1. **Stark** : les armoiries décrivent « un **loup-garou** gris », alors que la fiche créature parle de « **Loups géants** ». Il faut choisir un seul terme (la série en français dit « loup géant »).
2. **Greyjoy** : l'illustration de la maison est `mur.webp` (le Mur), sans rapport avec les Îles de Fer.
3. **Arbre, mode `secret`** : il mélange deux choses différentes.
   - De vraies filiations cachées : Cersei + Jaime → enfants, Rhaegar + Lyanna → Jon.
   - Des mariages publics, mais tardifs dans l'intrigue : Margaery avec Renly, Joffrey et Tommen ; Sansa avec Tyrion et Ramsay.

   L'ancien site les étiquetait tous « Lien révélé ». Je propose de distinguer `secret` et `spoiler` en phase 5.

4. **Bio de Jon Snow** : elle contient une consigne d'interface de l'ancien site (« Activez les révélations pour explorer sa filiation… »).
5. Seuls **7 personnages sur 67** ont une biographie. Les autres n'ont qu'un rôle d'une ligne.
6. **Fils de la Harpie**, champ « Visages & repères » : « Un réseau clandestin de Meereen » n'est pas un nom de figure.

**Forme**

7. **Casse des surtitres** : les langues sont en capitales (« ESSOS · LA MER DOTHRAK »), toutes les autres fiches en casse normale.
8. **« Mer Dothrak » / « mer Dothrak »** : on trouve les deux casses (surtitre du groupe Dothraki contre texte des Lhazaréens).
9. **« Les Terres de l'Ouest »** (maison Lannister) contre **« L'Ouest »** (carte et cité de Castral Roc).
10. **« Westeros · La couronne »** (Garde Royale) contre « Les Terres de la Couronne » (carte).
11. **Langues des destinations** en minuscule (« valyrien braavien ») contre une majuscule dans les fiches de groupes (« Valyrien braavien »).
12. **Accroches** : les croyances, créatures, lieux et périodes n'en ont pas (`lead` vide), alors que la modale prévoit l'accroche juste après le titre.

### Suite donnée (après validation « fais tout »)

Les corrections sont dans `tools/corrections.mjs`. L'extracteur les applique **après** la reprise mot pour mot, et chacune échoue si le texte d'origine a changé.

| #   | Décision                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Corrigé : « loup géant » dans les armoiries Stark.                                                                               |
| 2   | Corrigé : la maison Greyjoy utilise `fer-nes.webp`.                                                                              |
| 3   | Corrigé : nouveau mode `spoiler` pour les 5 mariages tardifs. `secret` est réservé aux filiations cachées.                       |
| 4   | Corrigé : la consigne d'interface est retirée de la bio de Jon.                                                                  |
| 5   | Reporté en phase 5 : les biographies manquantes sont des textes nouveaux, à faire valider avec l'arbre.                          |
| 6   | Corrigé : « Aucune figure nommée : des anonymes masqués ».                                                                       |
| 7   | Corrigé : surtitres des langues en casse normale.                                                                                |
| 8   | Conservé : « Mer Dothrak » en début de segment de surtitre et « mer Dothrak » dans une phrase sont tous deux corrects.           |
| 9   | Corrigé : « Les Terres de l'Ouest » partout.                                                                                     |
| 10  | Corrigé : « La Couronne ».                                                                                                       |
| 11  | Corrigé : majuscule initiale pour les langues des destinations.                                                                  |
| 12  | Reporté en phase 3 : la modale omettra l'accroche quand elle est vide. Les accroches nouvelles seront proposées avec les `hook`. |

## 6. Choix de mise en forme faits à l'extraction (sans toucher aux textes)

- **Maisons** :
  - titre « Maison X » (l'ancien site affichait « X » seul) ;
  - accroche = la devise entre guillemets ;
  - siège, région, devise, armoiries et figures placés dans `facts` ;
  - ajout d'un champ `sigil` qui pointe vers l'armoirie SVG.
- **Groupes** :
  - `kind` devient `tags` ;
  - la langue et les « Visages & repères » sont placés dans `facts`.
- **Langues** : « Où la retrouver » est placé dans `facts`, et les repères sont mis en forme « terme : définition » dans `terms`.
- **Destinations d'Essos** : la ligne « Langue : … » est découpée en un fait, et le groupe associé dans l'ancien site est conservé dans `related`.
- **Cités de Westeros** :
  - régions en casse normale (« Le Nord » au lieu de « LE NORD ») ;
  - coordonnées de carte gardées dans `map`.
- **Arbre** : les coordonnées x/y de l'ancien arbre ne sont pas reprises (nouvelle implémentation en phase 5).
- **Découpage** : `groups.js`, `places.js` et `people.js` assemblent des sous-fichiers, pour respecter la règle des 400 lignes maximum par fichier.

## 7. Médias copiés dans `public/`

- **34 illustrations** dans `public/images/`, renommées en français (la table est dans `tools/asset-names.mjs`). Les 5 doublons `.jpg` en basse définition ne sont pas copiés.
- **68 portraits** dans `public/images/portraits/`.
- **10 armoiries SVG** et les deux fichiers de crédits (`credits.json`, `credits-svg.json`) dans `public/sigils/`. Les 7 `.png` en double ne sont pas copiés.
  - `credits-svg.json` couvre les 10 SVG (CC BY-SA 3.0, A Wiki of Ice and Fire).
  - `credits.json` concerne les PNG non utilisés ; son entrée Lannister est en erreur 404.
