# Suivi des contenus

## Conventions de rédaction

- **Relations déclarées d’un seul côté** (§5.2) : `graph.js` calcule l’inverse.
  - Parent → enfant : c’est le **parent** qui déclare (`type: "enfant"`, avec un `inverseLabel` « Son père » ou « Sa mère »).
  - Frères et sœurs : c’est **l’aîné** qui déclare.
  - Conjoints : celui ou celle qui apparaît dans le **lot le plus ancien**.
  - Autres liens : le personnage du **lot le plus ancien** (ordre des lots du §11.4).
  - Le `type` décrit ce que la cible est pour le déclarant : `{ "to": "eddard-stark", "type": "parent" }` chez Arya signifie qu’Eddard est son parent.
- **Liens révélés tardivement** : `s` = saison de la révélation. Un lien « officiel » qui cesse d’être vrai porte `until` (exemple : Eddard → Jon, `enfant` jusqu’à la saison 7, puis `autre`, « Son neveu »).
- **Statuts** : une liste chronologique, dont on affiche la dernière valeur visible. Une mort survenue pendant la saison N porte `s: N`.
- **Citations** : seulement des répliques réellement prononcées, de moins de 15 mots, traduites, au plus une par fiche. Dans le doute, aucune citation.
- **Lieux** : `places[].seasons` liste les saisons où le personnage est présent dans ce lieu. Chaque saison listée doit avoir son bloc de biographie (vérifié par `check:data`).
- **Résumé** (`summary`) : 2 phrases, sans rien révéler au-delà de la première saison du personnage.
- **Doutes** : un champ `_doute` est listé par `check:data`, mais jamais affiché.

## Lots

| Lot | Contenu | État |
|---|---|---|
| 1 | Stark (11) | Rédigé, à relire |
| 2 | Lannister et Baratheon (15) | Rédigé, à relire |
| 3 | Targaryen et Essos (20) | Rédigé, à relire |
| 4 | Garde de Nuit et au-delà du Mur (12) | Rédigé, à relire |
| 5 | Tyrell, Martell, Greyjoy (15) | Rédigé, à relire |
| 6 | Tully, Arryn, Frey, Bolton, Mormont, Tarly, Reed (15) | Rédigé, à relire |
| 7 | Cour, épées, foi (le reste) | Rédigé, à relire |

## Spoilers relus

Pour chaque fiche, on a vérifié trois points :
- le résumé et le bloc de la première saison ne disent rien de la suite ;
- chaque relation porte la saison où elle devient connue ;
- les alias et titres tardifs (« Personne », « Aegon Targaryen », « Reine du Nord »…) portent leur saison.

Les chaînes témoins sont dans `tools/spoiler-witnesses.json` et contrôlées par `npm run check`.

<!-- DÉBUT RAPPORT GÉNÉRÉ (npm run check:data) -->
## Rapport de complétude (généré)

108 personnages · 17 maisons · 46 lieux · 46 entrées du Codex · 19 étapes.

### Personnages

| Slug | Rang | Mots (bio) | Moments | Relations | Portrait | Champs vides |
|---|---|---|---|---|---|---|
| aemon-targaryen | secondaire | 160 | 2 | 5 | non | quote, booksVsShow |
| aerys-targaryen | secondaire | 181 | 1 | 5 | oui | quote, booksVsShow |
| alliser-thorne | secondaire | 171 | 2 | 3 | non | quote, booksVsShow |
| arya-stark | principal | 760 | 8 | 21 | oui | — |
| balon-greyjoy | secondaire | 184 | 2 | 4 | oui | quote, booksVsShow |
| barristan-selmy | secondaire | 171 | 3 | 7 | non | quote, booksVsShow |
| benjen-stark | secondaire | 182 | 3 | 6 | oui | quote, booksVsShow |
| beric-dondarrion | secondaire | 179 | 2 | 5 | non | quote, booksVsShow |
| bran-stark | principal | 613 | 6 | 20 | oui | quote |
| brienne-de-torth | principal | 620 | 5 | 11 | non | quote |
| bronn | principal | 610 | 5 | 6 | non | quote, codex |
| brynden-tully | secondaire | 168 | 2 | 7 | non | quote, booksVsShow, codex |
| catelyn-stark | principal | 633 | 5 | 16 | oui | quote |
| cersei-lannister | principal | 777 | 7 | 27 | oui | — |
| corneille-a-trois-yeux | secondaire | 160 | 2 | 3 | non | quote, booksVsShow |
| craster | secondaire | 158 | 1 | 3 | non | quote, booksVsShow |
| daario-naharis | secondaire | 182 | 3 | 5 | non | quote, booksVsShow |
| daenerys-targaryen | principal | 690 | 7 | 28 | oui | quote |
| davos-mervault | principal | 604 | 4 | 9 | non | quote |
| doran-martell | secondaire | 167 | 2 | 4 | oui | quote, booksVsShow |
| eddard-stark | principal | 628 | 6 | 19 | oui | — |
| eddison-tollett | secondaire | 162 | 2 | 4 | non | quote, booksVsShow |
| edmure-tully | secondaire | 177 | 3 | 6 | oui | quote, booksVsShow |
| ellaria-sand | secondaire | 179 | 3 | 10 | oui | quote, booksVsShow |
| euron-greyjoy | secondaire | 159 | 3 | 9 | oui | quote, booksVsShow |
| gendry | secondaire | 225 | 4 | 7 | oui | quote, booksVsShow |
| gilly | secondaire | 195 | 2 | 5 | non | quote, booksVsShow |
| grand-moineau | secondaire | 169 | 3 | 6 | non | quote, booksVsShow |
| gregor-clegane | secondaire | 172 | 2 | 7 | non | quote, booksVsShow |
| hizdahr-zo-loraq | secondaire | 159 | 2 | 4 | non | quote, booksVsShow |
| hodor | secondaire | 171 | 2 | 5 | non | quote, booksVsShow, codex |
| hoster-tully | secondaire | 161 | 1 | 4 | oui | quote, booksVsShow |
| illyrio-mopatis | secondaire | 152 | 2 | 3 | non | quote, booksVsShow |
| jaime-lannister | principal | 774 | 6 | 21 | oui | quote |
| janos-slynt | secondaire | 160 | 2 | 4 | non | quote, booksVsShow |
| jaqen-hghar | secondaire | 163 | 2 | 3 | non | quote, booksVsShow |
| jeor-mormont | secondaire | 152 | 2 | 7 | non | quote, booksVsShow |
| joffrey-baratheon | principal | 609 | 4 | 15 | oui | quote, booksVsShow |
| jojen-reed | secondaire | 150 | 2 | 4 | non | quote, booksVsShow |
| jon-snow | principal | 677 | 8 | 32 | oui | quote |
| jorah-mormont | principal | 624 | 5 | 14 | non | quote |
| kevan-lannister | secondaire | 151 | 2 | 5 | non | quote, booksVsShow, codex |
| khal-drogo | principal | 602 | 5 | 5 | non | quote |
| kinvara | secondaire | 157 | 1 | 4 | non | quote, booksVsShow |
| kraznys-mo-nakloz | secondaire | 151 | 1 | 3 | non | quote, booksVsShow |
| la-gamine | secondaire | 163 | 1 | 2 | non | quote, booksVsShow |
| lancel-lannister | secondaire | 169 | 3 | 5 | non | quote, booksVsShow |
| loras-tyrell | secondaire | 202 | 2 | 7 | oui | quote, booksVsShow |
| lyanna-mormont | secondaire | 175 | 3 | 4 | non | quote, booksVsShow, codex |
| lyanna-stark | secondaire | 225 | 2 | 7 | oui | quote, booksVsShow |
| lysa-arryn | secondaire | 175 | 3 | 7 | oui | quote, booksVsShow, codex |
| mace-tyrell | secondaire | 160 | 2 | 5 | oui | quote, booksVsShow, codex |
| mance-rayder | secondaire | 199 | 3 | 4 | non | quote, booksVsShow |
| margaery-tyrell | principal | 606 | 4 | 11 | oui | quote |
| meera-reed | secondaire | 196 | 2 | 4 | non | quote, booksVsShow |
| melisandre | principal | 621 | 5 | 11 | non | — |
| mirri-maz-duur | secondaire | 168 | 2 | 3 | non | quote, booksVsShow |
| missandei | principal | 607 | 5 | 9 | non | — |
| myrcella-baratheon | secondaire | 161 | 2 | 7 | oui | quote, booksVsShow, codex |
| nymeria-sand | secondaire | 157 | 1 | 6 | oui | quote, booksVsShow |
| obara-sand | secondaire | 152 | 2 | 6 | oui | quote, booksVsShow |
| oberyn-martell | principal | 601 | 3 | 9 | oui | quote |
| olenna-tyrell | principal | 603 | 5 | 13 | oui | codex |
| osha | secondaire | 153 | 2 | 7 | non | quote, booksVsShow |
| petyr-baelish | principal | 607 | 5 | 11 | non | codex |
| podrick-payne | secondaire | 161 | 2 | 3 | non | quote, booksVsShow |
| pyat-pree | secondaire | 155 | 2 | 2 | non | quote, booksVsShow, codex |
| pycelle | secondaire | 165 | 2 | 3 | non | quote, booksVsShow |
| qhorin-mimain | secondaire | 161 | 1 | 3 | non | quote, booksVsShow |
| qyburn | secondaire | 178 | 2 | 4 | non | quote, booksVsShow |
| rakharo | secondaire | 153 | 2 | 3 | non | quote, booksVsShow |
| ramsay-bolton | principal | 607 | 5 | 8 | oui | quote, codex |
| randyll-tarly | secondaire | 171 | 2 | 4 | non | quote, booksVsShow, codex |
| renly-baratheon | secondaire | 175 | 3 | 6 | oui | quote, booksVsShow, codex |
| rhaegar-targaryen | secondaire | 168 | 2 | 6 | oui | quote, booksVsShow |
| rickon-stark | secondaire | 166 | 3 | 9 | oui | quote, booksVsShow |
| robb-stark | principal | 618 | 6 | 17 | oui | quote |
| robert-baratheon | principal | 600 | 3 | 14 | oui | quote |
| robin-arryn | secondaire | 177 | 2 | 3 | oui | quote, booksVsShow, codex |
| roi-de-la-nuit | principal | 607 | 5 | 6 | non | quote |
| roose-bolton | secondaire | 181 | 3 | 6 | oui | quote, booksVsShow, codex |
| samwell-tarly | principal | 663 | 6 | 9 | non | quote |
| sandor-clegane | principal | 616 | 5 | 9 | non | quote |
| sansa-stark | principal | 665 | 8 | 21 | oui | quote |
| selyse-baratheon | secondaire | 153 | 1 | 3 | oui | quote, booksVsShow |
| septa-unella | secondaire | 161 | 2 | 3 | non | quote, booksVsShow |
| ser-arthur-dayne | secondaire | 165 | 1 | 3 | non | quote, booksVsShow |
| shae | secondaire | 164 | 2 | 4 | non | quote, booksVsShow, codex |
| shireen-baratheon | secondaire | 164 | 3 | 5 | oui | quote, booksVsShow |
| stannis-baratheon | principal | 622 | 5 | 13 | oui | quote |
| syrio-forel | secondaire | 168 | 2 | 3 | non | quote, booksVsShow |
| talisa-stark | secondaire | 153 | 2 | 4 | non | quote, booksVsShow |
| theon-greyjoy | principal | 647 | 5 | 10 | oui | quote |
| thoros-de-myr | secondaire | 168 | 2 | 4 | non | quote, booksVsShow |
| tommen-baratheon | secondaire | 176 | 2 | 10 | oui | quote, booksVsShow |
| tormund | principal | 608 | 5 | 6 | non | quote |
| trystane-martell | secondaire | 156 | 1 | 4 | oui | quote, booksVsShow |
| tycho-nestoris | secondaire | 151 | 2 | 4 | non | quote, booksVsShow |
| tyene-sand | secondaire | 151 | 2 | 6 | oui | quote, booksVsShow |
| tyrion-lannister | principal | 773 | 6 | 23 | oui | — |
| tywin-lannister | principal | 628 | 6 | 18 | oui | quote, codex |
| varys | principal | 622 | 5 | 9 | non | — |
| ver-gris | principal | 608 | 5 | 6 | non | quote |
| viserys-targaryen | secondaire | 171 | 2 | 6 | oui | quote, booksVsShow |
| walder-frey | secondaire | 155 | 3 | 9 | oui | quote, booksVsShow, codex |
| xaro-xhoan-daxos | secondaire | 153 | 2 | 2 | non | quote, booksVsShow |
| yara-greyjoy | principal | 609 | 5 | 6 | oui | quote |
| ygritte | secondaire | 164 | 3 | 4 | non | booksVsShow |

### Lieux

| Slug | Mots (description) | Mots (histoire) | Événements | Image |
|---|---|---|---|---|
| accalmie | 105 | 80 | 2 | non |
| astapor | 95 | 42 | 2 | oui |
| au-dela-du-mur | 133 | 110 | 6 | oui |
| blancport | 104 | 65 | 2 | non |
| braavos | 139 | 87 | 3 | oui |
| castral-roc | 88 | 81 | 1 | non |
| chateaunoir | 124 | 106 | 5 | oui |
| corcolline | 72 | 54 | 1 | non |
| desert-rouge | 74 | 33 | 2 | non |
| dorne | 115 | 73 | 3 | oui |
| durlieu | 96 | 65 | 2 | non |
| fort-terreur | 115 | 92 | 3 | non |
| griseaux | 113 | 56 | 2 | non |
| harrenhal | 99 | 72 | 3 | non |
| hautjardin | 104 | 69 | 3 | non |
| ile-aux-ours | 112 | 78 | 2 | non |
| ile-de-torth | 73 | 49 | 1 | non |
| jardins-aquatiques | 81 | 47 | 2 | non |
| lancehelion | 117 | 69 | 3 | oui |
| le-conflans | 108 | 65 | 4 | oui |
| les-eyrie | 113 | 86 | 3 | non |
| les-jumeaux | 100 | 101 | 3 | non |
| lhazar | 91 | 32 | 2 | oui |
| lorath | 70 | 37 | 1 | non |
| lys | 86 | 54 | 1 | non |
| meereen | 104 | 49 | 5 | oui |
| mer-dothrak | 96 | 60 | 3 | oui |
| myr | 83 | 42 | 2 | non |
| naath | 68 | 33 | 2 | non |
| norvos | 75 | 37 | 0 | non |
| pentos | 101 | 65 | 2 | non |
| peyredragon | 93 | 88 | 5 | oui |
| port-real | 141 | 114 | 7 | oui |
| pyk | 116 | 78 | 3 | oui |
| qarth | 114 | 50 | 3 | non |
| qohor | 86 | 41 | 1 | non |
| terres-de-l-ouest | 93 | 67 | 2 | non |
| tour-de-la-joie | 83 | 63 | 2 | non |
| tyrosh | 70 | 37 | 0 | non |
| vaes-dothrak | 114 | 55 | 3 | oui |
| valyria | 85 | 112 | 2 | oui |
| villevieille | 103 | 71 | 2 | oui |
| vivesaigues | 119 | 73 | 3 | non |
| volantis | 115 | 61 | 2 | oui |
| winterfell | 156 | 145 | 7 | oui |
| yunkai | 66 | 29 | 3 | non |

### Maisons

| Slug | Mots (histoire) | Blocs « dans la série » | Membres |
|---|---|---|---|
| arryn | 283 | 4 | 2 |
| baratheon | 282 | 6 | 9 |
| bolton | 285 | 4 | 2 |
| clegane | 272 | 5 | 2 |
| frey | 315 | 4 | 1 |
| greyjoy | 298 | 5 | 4 |
| lannister | 260 | 8 | 6 |
| martell | 295 | 4 | 7 |
| mervault | 285 | 4 | 1 |
| mormont | 291 | 4 | 3 |
| reed | 267 | 4 | 2 |
| stark | 266 | 7 | 11 |
| targaryen | 283 | 6 | 5 |
| tarly | 267 | 4 | 2 |
| torth | 258 | 4 | 1 |
| tully | 291 | 4 | 5 |
| tyrell | 288 | 6 | 4 |

### Codex

| Slug | Rubrique | Mots | Termes | Image |
|---|---|---|---|---|
| age-des-heros | peuples | 167 | 0 | non |
| ancienne-langue | langues | 153 | 0 | non |
| anciens-dieux | croyances | 246 | 2 | oui |
| andals | peuples | 194 | 3 | oui |
| bas-valyrien | langues | 160 | 0 | non |
| braaviens | peuples | 153 | 2 | oui |
| compagnie-doree | ordres | 140 | 3 | oui |
| conquete | peuples | 138 | 0 | non |
| debut-de-la-serie | peuples | 142 | 0 | non |
| dieu-multiface | croyances | 233 | 2 | oui |
| dieu-noye | croyances | 216 | 2 | oui |
| dorniens | peuples | 190 | 4 | oui |
| dothrakis | peuples | 176 | 3 | oui |
| dragons | creatures | 303 | 2 | oui |
| enfants-de-la-foret | creatures | 268 | 2 | oui |
| fer-nes | peuples | 182 | 2 | oui |
| fils-de-la-harpie | ordres | 143 | 3 | oui |
| foi-des-sept | croyances | 243 | 3 | oui |
| foi-militante | ordres | 150 | 2 | oui |
| fraternite-sans-bannieres | ordres | 175 | 3 | oui |
| garde-de-nuit | ordres | 218 | 3 | oui |
| garde-royale | ordres | 207 | 3 | oui |
| geants | creatures | 207 | 0 | oui |
| ghiscaris | peuples | 125 | 1 | oui |
| grand-etalon | croyances | 193 | 2 | oui |
| haut-valyrien | langues | 190 | 2 | non |
| immacules | ordres | 196 | 4 | oui |
| langue-commune | langues | 205 | 0 | non |
| langue-dothrakie | langues | 160 | 3 | non |
| langue-ghiscarie | langues | 146 | 0 | non |
| langue-lhazareenne | langues | 114 | 0 | non |
| langue-qartheenne | langues | 135 | 0 | non |
| langue-rhoynienne | langues | 123 | 0 | non |
| lhazareens | peuples | 102 | 3 | oui |
| loups-geants | creatures | 219 | 1 | oui |
| maitre-de-la-lumiere | croyances | 222 | 2 | oui |
| marcheurs-blancs | creatures | 228 | 2 | oui |
| mestres | ordres | 178 | 2 | oui |
| peuple-libre | peuples | 199 | 2 | oui |
| premiers-hommes | peuples | 208 | 2 | oui |
| puines | ordres | 115 | 3 | oui |
| rebellion | peuples | 208 | 0 | non |
| rhoynar | peuples | 173 | 3 | oui |
| sans-visage | ordres | 208 | 2 | oui |
| thenns | peuples | 126 | 3 | oui |
| valyriens | peuples | 207 | 2 | oui |

### Doutes (`_doute`, jamais affichés)

- `characters/aemon-targaryen` : Présence d’Aemon à l’écran en saison 2 à vérifier (le mestre reste à Châteaunoir).
- `characters/kevan-lannister` : Présence de Kevan dans les saisons 2 à 4 à vérifier (rôle muet ou absent).
- `characters/la-gamine` : Nom français du personnage (« the Waif ») : « la Gamine » retenu, à confirmer avec la VF. Peu de relations : Arya et Jaqen seulement à l’écran.
- `characters/loras-tyrell` : Présence de Loras à la Néra (saison 2) : il apparaît à Port-Réal après la bataille.
- `characters/pyat-pree` : Peu de relations : Daenerys et Xaro seulement.
- `characters/rhaegar-targaryen` : Lieu exact du mariage de Rhaegar et Lyanna dans la série : « Dorne », sans plus de précision à l’écran.
- `characters/xaro-xhoan-daxos` : Peu de relations : Daenerys et Pyat Pree à l’écran (Jorah se méfie de lui sans échange notable).
- `houses/clegane` : Prénom et date de mort du père inconnus dans la série. Incendie du château familial : détail des romans, non montré dans la série.
- `houses/frey` : Devise et blason absents de la série ; Walda présentée comme petite-fille de Walder (à vérifier).
- `houses/mervault` : Marya n’apparaît pas à l’écran ; nom des terres de Davos.
- `houses/mormont` : Mort de Maege Mormont avant la saison 6 : la série ne la montre pas.
- `houses/torth` : Paysage de l’île (falaises, oiseaux) : description libre, non montrée dans la série.
- `places/blancport` : Blancport n’apparaît presque pas à l’écran ; fiche gardée pour la carte.
- `places/lorath` : Lorath n’apparaît pas à l’écran ; on la connaît par Jaqen H’ghar.
- `places/lys` : Lys n’est jamais montrée à l’écran ; fiche gardée pour la carte. Origine lysienne de Varys reprise des romans, à confirmer pour la série.
- `places/norvos` : Norvos n’apparaît pas à l’écran : aucun événement de la série n’y est situé.
- `places/qohor` : Qohor n’apparaît pas à l’écran ; l’épisode des trois mille Immaculés est évoqué en saison 3, à vérifier.
- `places/tyrosh` : Tyrosh n’apparaît pas à l’écran : aucun événement de la série n’y est situé.
- `codex/langue-lhazareenne` : La série n’en fait pas entendre de phrases identifiables.
- `codex/langue-qartheenne` : Langue à peine évoquée dans la série.
- `codex/langue-rhoynienne` : Langue non représentée dans la série.
<!-- FIN RAPPORT GÉNÉRÉ -->
