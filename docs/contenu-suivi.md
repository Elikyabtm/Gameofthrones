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
