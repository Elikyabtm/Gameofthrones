# Prompts d’images — A Realm Divided

Toutes les images du site sont générées (§10). Aucune photo de la série, aucun acteur, aucun visuel officiel. Ce fichier liste un prompt par image manquante ou à refaire, et sert de suivi.

## Règles communes

- **Ressemblance** : ne jamais demander, ni accepter, un visage qui rappelle un acteur de la série. Décrire le personnage d’après son rôle (âge, carrure, vêtements, accessoires), jamais d’après l’interprète. Refaire toute image où la ressemblance est frappante.
- **Style commun (à préfixer)** : « peinture numérique mate, lumière naturelle douce, palette sourde (gris-bleu, ocre, sépia), grain léger, fond sombre légèrement brumeux, rendu éditorial sobre, pas de texte, pas de logo ».
- **Portraits** : 3:4, 1200 × 1600 px minimum, buste cadré à hauteur d’épaules, visage dans le tiers supérieur (le site recadre avec `portraitFocus`).
- **Scènes et lieux** : 16:9, 2400 × 1350 px minimum, aucun personnage reconnaissable au premier plan.
- Exporter en `.webp` (qualité 80) dans `public/images/…`, puis lancer `npm run images` (variantes 480/960/1600 et manifeste).

## Suivi

- Portraits manquants : **59** (placeholder affiché).
- Portraits existants à refaire : **49** fiches + 19 portraits d’arbres — tous carrés (1:1 au lieu de 3:4) et à vérifier pour la ressemblance avec les acteurs (décision en attente, voir `docs/audit.md`).

## Portraits manquants

| Fichier | Personnage | Prompt (après le préfixe commun) | État |
|---|---|---|---|
| `images/personnages/aemon-targaryen.webp` | Aemon Targaryen | Portrait 3:4 : très vieil homme aveugle aux yeux laiteux, chaîne de mestre, robe noire de la Garde, visage doux. | manquant |
| `images/personnages/alliser-thorne.webp` | Alliser Thorne | Portrait 3:4 : homme maigre d’âge mûr, barbe grise taillée court, regard dur, cape noire. | manquant |
| `images/personnages/barristan-selmy.webp` | Barristan Selmy | Portrait 3:4 : vieux chevalier droit et sec, cheveux blancs courts, armure blanche ternie. | manquant |
| `images/personnages/beric-dondarrion.webp` | Beric Dondarrion | Portrait 3:4 : chevalier balafré, un œil couvert d’un bandeau, cheveux roux sales, cape délavée. | manquant |
| `images/personnages/brienne-de-torth.webp` | Brienne de Torth | Portrait 3:4 : femme très grande et large d’épaules, cheveux blond paille courts, armure bleue simple, visage franc. | manquant |
| `images/personnages/bronn.webp` | Bronn | Portrait 3:4 : mercenaire brun mal rasé, sourire en coin, cuir usé, arbalète à l’épaule. | manquant |
| `images/personnages/brynden-tully.webp` | Brynden Tully | Portrait 3:4 : homme âgé, barbe grise, visage buriné, armure de mailles, broche en forme de poisson noir. | manquant |
| `images/personnages/corneille-a-trois-yeux.webp` | La Corneille à trois yeux | Portrait 3:4 : vieillard pris dans des racines blanches de barral, dans une grotte, peau parcheminée. | manquant |
| `images/personnages/craster.webp` | Craster | Portrait 3:4 : sauvageon massif et sale, fourrures, barbe hirsute, fort de bois en arrière-plan. | manquant |
| `images/personnages/daario-naharis.webp` | Daario Naharis | Portrait 3:4 : mercenaire tyroshi élégant, barbe soignée, cheveux bruns mi-longs, veste brodée. | manquant |
| `images/personnages/davos-mervault.webp` | Davos Mervault | Portrait 3:4 : marin d’âge mûr, barbe poivre et sel, gants usés, petite bourse autour du cou. | manquant |
| `images/personnages/eddison-tollett.webp` | Eddison Tollett | Portrait 3:4 : frère de la Garde de Nuit, visage las et triste, barbe noire courte, cape noire. | manquant |
| `images/personnages/gilly.webp` | Gilly | Portrait 3:4 : jeune femme pâle aux cheveux bruns, fourrures, regard timide, nourrisson dans les bras. | manquant |
| `images/personnages/grand-moineau.webp` | Le Grand Moineau | Portrait 3:4 : vieil homme pieds nus, robe de toile grossière, cheveux gris courts, regard calme. | manquant |
| `images/personnages/gregor-clegane.webp` | Gregor Clegane | Portrait 3:4 : colosse en armure sombre, heaume à visière, carrure démesurée. | manquant |
| `images/personnages/hizdahr-zo-loraq.webp` | Hizdahr zo Loraq | Portrait 3:4 : noble ghiscari, tokar de soie claire, cheveux bruns, barbe fine. | manquant |
| `images/personnages/hodor.webp` | Hodor | Portrait 3:4 : géant doux aux épaules immenses, cheveux en bataille, panier sur le dos. | manquant |
| `images/personnages/illyrio-mopatis.webp` | Illyrio Mopatis | Portrait 3:4 : marchand obèse de Pentos, barbe huilée à fourche, bagues, soie brodée. | manquant |
| `images/personnages/janos-slynt.webp` | Janos Slynt | Portrait 3:4 : homme chauve et bajoues, cape dorée du Guet, air suffisant. | manquant |
| `images/personnages/jaqen-hghar.webp` | Jaqen H’ghar | Portrait 3:4 : homme aux cheveux mi-roux mi-blancs, visage calme et énigmatique. | manquant |
| `images/personnages/jeor-mormont.webp` | Jeor Mormont | Portrait 3:4 : vieil homme corpulent, crâne dégarni, barbe grise, corbeau sur l’épaule. | manquant |
| `images/personnages/jojen-reed.webp` | Jojen Reed | Portrait 3:4 : adolescent pâle aux yeux verts, tenue verte des marais. | manquant |
| `images/personnages/jorah-mormont.webp` | Jorah Mormont | Portrait 3:4 : chevalier d’âge mûr, barbe courte grisonnante, cuir et maille, regard loyal. | manquant |
| `images/personnages/kevan-lannister.webp` | Kevan Lannister | Portrait 3:4 : homme d’âge mûr, barbe blonde courte grisonnante, pourpoint rouge sobre. | manquant |
| `images/personnages/khal-drogo.webp` | Khal Drogo | Portrait 3:4 : guerrier dothraki massif, longue tresse noire ornée de clochettes, torse peint. | manquant |
| `images/personnages/kinvara.webp` | Kinvara | Portrait 3:4 : prêtresse rouge aux cheveux roux, robe écarlate, collier de rubis, regard serein. | manquant |
| `images/personnages/kraznys-mo-nakloz.webp` | Kraznys mo Nakloz | Portrait 3:4 : maître esclavagiste ghiscari, cheveux huilés en pointe, tokar ourlé, fouet. | manquant |
| `images/personnages/la-gamine.webp` | La Gamine | Portrait 3:4 : jeune femme maigre aux cheveux courts, robe grise de servante, regard froid. | manquant |
| `images/personnages/lancel-lannister.webp` | Lancel Lannister | Portrait 3:4 : jeune homme blond, d’abord en écuyer rouge, puis crâne rasé et robe de pénitent. | manquant |
| `images/personnages/lyanna-mormont.webp` | Lyanna Mormont | Portrait 3:4 : fillette d’une dizaine d’années, fourrure et cuir, ours brodé, regard sévère. | manquant |
| `images/personnages/mance-rayder.webp` | Mance Rayder | Portrait 3:4 : homme d’âge mûr, cape rapiécée de noir et de rouge, cheveux bruns grisonnants. | manquant |
| `images/personnages/meera-reed.webp` | Meera Reed | Portrait 3:4 : jeune femme brune, tenue des marais, lance de chasse et filet. | manquant |
| `images/personnages/melisandre.webp` | Melisandre | Portrait 3:4 : femme aux longs cheveux roux, robe rouge, collier au rubis, peau pâle. | manquant |
| `images/personnages/mirri-maz-duur.webp` | Mirri Maz Duur | Portrait 3:4 : prêtresse lhazaréenne d’âge mûr, tunique de laine, peau brune, regard grave. | manquant |
| `images/personnages/missandei.webp` | Missandei | Portrait 3:4 : jeune femme aux cheveux bouclés relevés, robe bleue simple, regard attentif. | manquant |
| `images/personnages/osha.webp` | Osha | Portrait 3:4 : sauvageonne aux cheveux bruns tressés, vêtements de servante usés, regard méfiant. | manquant |
| `images/personnages/petyr-baelish.webp` | Petyr Baelish | Portrait 3:4 : homme mince à la barbiche, pourpoint sombre, broche en oiseau moqueur. | manquant |
| `images/personnages/podrick-payne.webp` | Podrick Payne | Portrait 3:4 : jeune écuyer timide, cheveux bruns, pourpoint simple, épée trop grande. | manquant |
| `images/personnages/pyat-pree.webp` | Pyat Pree | Portrait 3:4 : sorcier qarthien maigre aux lèvres bleues, crâne rasé, robe sombre. | manquant |
| `images/personnages/pycelle.webp` | Pycelle | Portrait 3:4 : vieillard à longue barbe blanche, chaîne de Grand Mestre lourde. | manquant |
| `images/personnages/qhorin-mimain.webp` | Qhorin Mimain | Portrait 3:4 : patrouilleur aguerri, main mutilée, cape noire, barbe hirsute. | manquant |
| `images/personnages/qyburn.webp` | Qyburn | Portrait 3:4 : homme âgé, cheveux gris clairsemés, robe sombre de savant. | manquant |
| `images/personnages/rakharo.webp` | Rakharo | Portrait 3:4 : jeune guerrier dothraki, tresse courte, arakh à la ceinture. | manquant |
| `images/personnages/randyll-tarly.webp` | Randyll Tarly | Portrait 3:4 : seigneur d’âge mûr, crâne dégarni, barbe grise taillée, armure verte. | manquant |
| `images/personnages/roi-de-la-nuit.webp` | Le Roi de la Nuit | Portrait 3:4 : créature de glace à la peau bleutée, couronne de pointes de glace, yeux bleus brillants. | manquant |
| `images/personnages/samwell-tarly.webp` | Samwell Tarly | Portrait 3:4 : jeune homme rond aux joues douces, cheveux bruns, cape noire, livres sous le bras. | manquant |
| `images/personnages/sandor-clegane.webp` | Sandor Clegane | Portrait 3:4 : guerrier massif, moitié du visage brûlée, cheveux bruns longs, armure de cuir. | manquant |
| `images/personnages/septa-unella.webp` | Septa Unella | Portrait 3:4 : femme austère d’âge mûr, voile gris de septa, visage fermé. | manquant |
| `images/personnages/ser-arthur-dayne.webp` | Arthur Dayne | Portrait 3:4 : chevalier de la Garde royale en armure blanche, deux épées, cheveux sombres. | manquant |
| `images/personnages/shae.webp` | Shae | Portrait 3:4 : jeune femme brune vive, robe simple de servante, sourire moqueur. | manquant |
| `images/personnages/syrio-forel.webp` | Syrio Forel | Portrait 3:4 : maître d’armes braavien, crâne rasé, moustache fine, épée de bois. | manquant |
| `images/personnages/talisa-stark.webp` | Talisa Stark | Portrait 3:4 : jeune femme brune, tablier de guérisseuse, sacoche de remèdes. | manquant |
| `images/personnages/thoros-de-myr.webp` | Thoros de Myr | Portrait 3:4 : prêtre rouge au crâne rasé, robe délavée, gourde à la ceinture. | manquant |
| `images/personnages/tormund.webp` | Tormund | Portrait 3:4 : sauvageon roux à la barbe immense, fourrures épaisses, sourire tonitruant. | manquant |
| `images/personnages/tycho-nestoris.webp` | Tycho Nestoris | Portrait 3:4 : banquier braavien au chapeau noir, col blanc, visage impassible. | manquant |
| `images/personnages/varys.webp` | Varys | Portrait 3:4 : eunuque chauve et rond, robe de soie, mains jointes. | manquant |
| `images/personnages/ver-gris.webp` | Ver Gris | Portrait 3:4 : soldat immaculé, crâne rasé, armure de cuir, lance et bouclier. | manquant |
| `images/personnages/xaro-xhoan-daxos.webp` | Xaro Xhoan Daxos | Portrait 3:4 : marchand des îles d’Été, robe d’or, bijoux, sourire affable. | manquant |
| `images/personnages/ygritte.webp` | Ygritte | Portrait 3:4 : jeune sauvageonne rousse aux cheveux bouclés, fourrures, arc à la main. | manquant |

## Portraits existants à refaire (3:4, sans ressemblance)

| Fichier | Personnage | Prompt | État |
|---|---|---|---|
| `images/personnages/aerys-targaryen.webp` | Aerys Targaryen | Portrait 3:4 : roi âgé aux cheveux d’argent emmêlés, ongles longs, couronne, regard halluciné. | à refaire |
| `images/personnages/arya-stark.webp` | Arya Stark | Portrait 3:4 : fillette maigre aux cheveux bruns en désordre, tunique grise, petite épée fine. | à refaire |
| `images/personnages/balon-greyjoy.webp` | Balon Greyjoy | Portrait 3:4 : seigneur fer-né âgé, visage dur, cheveux gris, manteau noir et or. | à refaire |
| `images/personnages/benjen-stark.webp` | Benjen Stark | Portrait 3:4 : homme brun d’âge mûr, cape noire de patrouilleur, barbe courte. | à refaire |
| `images/personnages/bran-stark.webp` | Bran Stark | Portrait 3:4 : garçon brun aux yeux graves, cape grise, plus tard assis dans un fauteuil de bois. | à refaire |
| `images/personnages/catelyn-stark.webp` | Catelyn Stark | Portrait 3:4 : femme d’âge mûr aux cheveux auburn, robe bleu-gris et fourrure, regard inquiet. | à refaire |
| `images/personnages/cersei-lannister.webp` | Cersei Lannister | Portrait 3:4 : femme blonde altière, robe rouge et or, bijoux de lion, regard froid. | à refaire |
| `images/personnages/daenerys-targaryen.webp` | Daenerys Targaryen | Portrait 3:4 : jeune femme aux longs cheveux d’argent tressés, robe claire, petit dragon sur l’épaule. | à refaire |
| `images/personnages/doran-martell.webp` | Doran Martell | Portrait 3:4 : homme âgé au teint mat, barbe grise, robe orangée, assis dans un fauteuil. | à refaire |
| `images/personnages/eddard-stark.webp` | Eddard Stark | Portrait 3:4 : homme brun d’âge mûr, barbe courte, cape de fourrure grise, épée longue à l’épaule. | à refaire |
| `images/personnages/edmure-tully.webp` | Edmure Tully | Portrait 3:4 : jeune seigneur aux cheveux auburn, pourpoint bleu et rouge, truite brodée. | à refaire |
| `images/personnages/ellaria-sand.webp` | Ellaria Sand | Portrait 3:4 : femme dornienne brune aux cheveux bouclés, robe ocre légère, bijoux d’or. | à refaire |
| `images/personnages/euron-greyjoy.webp` | Euron Greyjoy | Portrait 3:4 : homme brun à la barbe courte, cuir noir, sourire inquiétant, mer en arrière-plan. | à refaire |
| `images/personnages/gendry.webp` | Gendry | Portrait 3:4 : jeune forgeron brun aux bras puissants, tablier de cuir, marteau. | à refaire |
| `images/personnages/hoster-tully.webp` | Hoster Tully | Portrait 3:4 : vieillard alité, cheveux blancs, couverture bleue et rouge. | à refaire |
| `images/personnages/jaime-lannister.webp` | Jaime Lannister | Portrait 3:4 : chevalier blond, armure dorée, plus tard main droite en or. | à refaire |
| `images/personnages/joffrey-baratheon.webp` | Joffrey Baratheon | Portrait 3:4 : adolescent blond au visage poupin, couronne, pourpoint rouge et or. | à refaire |
| `images/personnages/jon-snow.webp` | Jon Snow | Portrait 3:4 : jeune homme brun aux cheveux bouclés, cape noire de fourrure, épée au pommeau de loup. | à refaire |
| `images/personnages/loras-tyrell.webp` | Loras Tyrell | Portrait 3:4 : jeune chevalier aux cheveux bruns bouclés, armure ornée de roses. | à refaire |
| `images/personnages/lyanna-stark.webp` | Lyanna Stark | Portrait 3:4 : jeune femme brune aux cheveux longs, robe grise simple, couronne de roses bleues. | à refaire |
| `images/personnages/lysa-arryn.webp` | Lysa Arryn | Portrait 3:4 : femme aux cheveux auburn, robe bleu ciel, visage anxieux. | à refaire |
| `images/personnages/mace-tyrell.webp` | Mace Tyrell | Portrait 3:4 : seigneur corpulent et jovial, pourpoint vert et or, chaîne lourde. | à refaire |
| `images/personnages/margaery-tyrell.webp` | Margaery Tyrell | Portrait 3:4 : jeune femme brune aux cheveux ondulés, robe verte élégante, sourire mesuré. | à refaire |
| `images/personnages/myrcella-baratheon.webp` | Myrcella Baratheon | Portrait 3:4 : fillette blonde aux boucles, robe rose pâle, sourire doux. | à refaire |
| `images/personnages/nymeria-sand.webp` | Nymeria Sand | Portrait 3:4 : jeune femme brune élégante, fouet enroulé à la ceinture, robe ocre. | à refaire |
| `images/personnages/obara-sand.webp` | Obara Sand | Portrait 3:4 : guerrière brune au regard dur, lance, cuir et soie orangée. | à refaire |
| `images/personnages/oberyn-martell.webp` | Oberyn Martell | Portrait 3:4 : homme mince au teint mat, cheveux noirs, tenue orange et brune, lance. | à refaire |
| `images/personnages/olenna-tyrell.webp` | Olenna Tyrell | Portrait 3:4 : vieille dame vive au regard malicieux, coiffe et voile verts. | à refaire |
| `images/personnages/ramsay-bolton.webp` | Ramsay Bolton | Portrait 3:4 : jeune homme brun au sourire inquiétant, cuir sombre, chiens en arrière-plan. | à refaire |
| `images/personnages/renly-baratheon.webp` | Renly Baratheon | Portrait 3:4 : jeune seigneur brun élégant, pourpoint vert et noir, couronne d’or. | à refaire |
| `images/personnages/rhaegar-targaryen.webp` | Rhaegar Targaryen | Portrait 3:4 : prince aux cheveux d’argent, armure noire ornée de rubis, harpe. | à refaire |
| `images/personnages/rickon-stark.webp` | Rickon Stark | Portrait 3:4 : petit garçon aux cheveux auburn en désordre, fourrures. | à refaire |
| `images/personnages/robb-stark.webp` | Robb Stark | Portrait 3:4 : jeune homme aux cheveux auburn bouclés, barbe naissante, cape de fourrure, couronne de bronze. | à refaire |
| `images/personnages/robert-baratheon.webp` | Robert Baratheon | Portrait 3:4 : homme massif et barbu, ventre lourd, pourpoint jaune et noir, marteau de guerre. | à refaire |
| `images/personnages/robin-arryn.webp` | Robin Arryn | Portrait 3:4 : garçon pâle et frêle, vêtements bleu ciel, regard capricieux. | à refaire |
| `images/personnages/roose-bolton.webp` | Roose Bolton | Portrait 3:4 : homme pâle aux yeux clairs, cheveux noirs courts, manteau rose sombre. | à refaire |
| `images/personnages/sansa-stark.webp` | Sansa Stark | Portrait 3:4 : jeune fille aux cheveux auburn, robe brodée, plus tard robe sombre et chaîne. | à refaire |
| `images/personnages/selyse-baratheon.webp` | Selyse Baratheon | Portrait 3:4 : femme austère au visage creusé, robe grise, médaillon au cœur ardent. | à refaire |
| `images/personnages/shireen-baratheon.webp` | Shireen Baratheon | Portrait 3:4 : fillette aux cheveux bruns, joue marquée de cicatrices grises, livre. | à refaire |
| `images/personnages/stannis-baratheon.webp` | Stannis Baratheon | Portrait 3:4 : homme d’âge mûr au crâne dégarni, barbe courte, armure sombre. | à refaire |
| `images/personnages/theon-greyjoy.webp` | Theon Greyjoy | Portrait 3:4 : jeune homme brun à la barbe courte, cuir noir, seiche brodée. | à refaire |
| `images/personnages/tommen-baratheon.webp` | Tommen Baratheon | Portrait 3:4 : jeune garçon blond au visage doux, couronne, pourpoint rouge. | à refaire |
| `images/personnages/trystane-martell.webp` | Trystane Martell | Portrait 3:4 : jeune homme dornien brun, tunique orange légère. | à refaire |
| `images/personnages/tyene-sand.webp` | Tyene Sand | Portrait 3:4 : jeune femme blonde au sourire doux, robe jaune, dagues cachées. | à refaire |
| `images/personnages/tyrion-lannister.webp` | Tyrion Lannister | Portrait 3:4 : homme de petite taille, cheveux blonds, cicatrice au visage, pourpoint rouge. | à refaire |
| `images/personnages/tywin-lannister.webp` | Tywin Lannister | Portrait 3:4 : homme âgé chauve, favoris blonds grisonnants, manteau rouge et lion d’or. | à refaire |
| `images/personnages/viserys-targaryen.webp` | Viserys Targaryen | Portrait 3:4 : jeune homme maigre aux cheveux d’argent, robe pourpre, air arrogant. | à refaire |
| `images/personnages/walder-frey.webp` | Walder Frey | Portrait 3:4 : vieillard voûté et chauve, sourire édenté, manteau gris. | à refaire |
| `images/personnages/yara-greyjoy.webp` | Yara Greyjoy | Portrait 3:4 : femme brune aux cheveux courts, cuir noir de marin, hache à la ceinture. | à refaire |

## Portraits des arbres (nœuds sans fiche) — à refaire

| Fichier | Prompt | État |
|---|---|---|
| `images/personnages/aegon-targaryen.webp` | Portrait 3:4 : nourrisson aux cheveux d’argent dans un linge sombre. | à refaire |
| `images/personnages/aeron-greyjoy.webp` | Portrait 3:4 : prêtre fer-né aux longs cheveux trempés, robe en peau de phoque. | à refaire |
| `images/personnages/alannys-greyjoy.webp` | Portrait 3:4 : femme âgée fer-née, châle noir, regard absent. | à refaire |
| `images/personnages/alerie-tyrell.webp` | Portrait 3:4 : dame d’âge mûr, robe verte, cheveux tressés. | à refaire |
| `images/personnages/brandon-stark.webp` | Portrait 3:4 : jeune homme brun fougueux, cape grise, sourire. | à refaire |
| `images/personnages/cassana-baratheon.webp` | Portrait 3:4 : dame brune, robe jaune, collier. | à refaire |
| `images/personnages/elia-martell.webp` | Portrait 3:4 : femme dornienne fine et brune, robe orangée. | à refaire |
| `images/personnages/joanna-lannister.webp` | Portrait 3:4 : femme blonde douce, robe rouge pâle. | à refaire |
| `images/personnages/jon-arryn.webp` | Portrait 3:4 : vieil homme digne, cheveux blancs, manteau bleu ciel. | à refaire |
| `images/personnages/luthor-tyrell.webp` | Portrait 3:4 : seigneur jovial, pourpoint vert, chapeau de chasse. | à refaire |
| `images/personnages/lyarra-stark.webp` | Portrait 3:4 : dame du Nord, robe grise, fourrure. | à refaire |
| `images/personnages/minisa-tully.webp` | Portrait 3:4 : dame aux cheveux auburn, robe bleue. | à refaire |
| `images/personnages/quellon-greyjoy.webp` | Portrait 3:4 : vieux seigneur fer-né, barbe blanche, manteau noir. | à refaire |
| `images/personnages/rhaella-targaryen.webp` | Portrait 3:4 : reine aux cheveux d’argent, regard triste, robe noire et rouge. | à refaire |
| `images/personnages/rhaenys-targaryen.webp` | Portrait 3:4 : fillette brune, robe orangée. | à refaire |
| `images/personnages/rickard-stark.webp` | Portrait 3:4 : seigneur âgé, barbe grise, cape de fourrure. | à refaire |
| `images/personnages/roslin-frey.webp` | Portrait 3:4 : jeune femme brune, robe de mariée grise. | à refaire |
| `images/personnages/steffon-baratheon.webp` | Portrait 3:4 : seigneur brun, barbe, manteau jaune. | à refaire |
| `images/personnages/walda-bolton.webp` | Portrait 3:4 : jeune femme ronde et souriante, robe rose. | à refaire |
| `images/personnages/maege-mormont.webp` | Portrait 3:4 de maege mormont (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/howland-reed.webp` | Portrait 3:4 de howland reed (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/selwyn-torth.webp` | Portrait 3:4 de selwyn torth (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/melessa-tarly.webp` | Portrait 3:4 de melessa tarly (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/dickon-tarly.webp` | Portrait 3:4 de dickon tarly (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/talla-tarly.webp` | Portrait 3:4 de talla tarly (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/marya-mervault.webp` | Portrait 3:4 de marya mervault (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/matthos-mervault.webp` | Portrait 3:4 de matthos mervault (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/pere-clegane.webp` | Portrait 3:4 de pere clegane (à préciser d’après la fiche de maison). | manquant |
| `images/personnages/princesse-de-dorne.webp` | Portrait 3:4 de princesse de dorne (à préciser d’après la fiche de maison). | manquant |

## Lieux sans illustration

| Fichier proposé | Lieu | Prompt (paysage 16:9) | État |
|---|---|---|---|
| `images/lieux/accalmie.webp` | Accalmie | Vue lointaine de Accalmie (château, Les Terres de l’Orage) : Forteresse colossale des Baratheon, bâtie face à la baie des Naufrageurs pour résister aux tempêtes. Brume, lumière de fin de journée. | manquant |
| `images/lieux/blancport.webp` | Blancport | Vue lointaine de Blancport (cité, Le Nord) : Seule véritable cité du Nord, port de la maison Manderly sur l’estuaire du Couteau Blanc. Brume, lumière de fin de journée. | manquant |
| `images/lieux/castral-roc.webp` | Castral Roc | Vue lointaine de Castral Roc (château, L’Ouest) : Forteresse creusée dans une montagne au bord de la mer, siège et coffre-fort des Lannister. Brume, lumière de fin de journée. | manquant |
| `images/lieux/corcolline.webp` | Corcolline | Vue lointaine de Corcolline (château, Le Bief) : Siège de la maison Tarly, dans les collines boisées du Bief. Brume, lumière de fin de journée. | manquant |
| `images/lieux/desert-rouge.webp` | Le désert Rouge | Vue lointaine de Le désert Rouge (région, L’Est) : Désert de poussière rouge et de puits empoisonnés entre Lhazar et Qarth. Brume, lumière de fin de journée. | manquant |
| `images/lieux/durlieu.webp` | Durlieu | Vue lointaine de Durlieu (ruine, Au-delà du Mur) : Village de pêcheurs du Peuple libre sur la côte nord-est, au-delà du Mur. Brume, lumière de fin de journée. | manquant |
| `images/lieux/fort-terreur.webp` | Fort-Terreur | Vue lointaine de Fort-Terreur (château, Le Nord) : Siège de la maison Bolton, sur une colline de l’est du Nord. Brume, lumière de fin de journée. | manquant |
| `images/lieux/griseaux.webp` | Griseaux | Vue lointaine de Griseaux (château, Le Neck) : Château flottant des Reed, caché dans les marais du Neck. Brume, lumière de fin de journée. | manquant |
| `images/lieux/harrenhal.webp` | Harrenhal | Vue lointaine de Harrenhal (ruine, Le Conflans) : Le plus grand château de Westeros, fondu par le feu des dragons, au bord de l’Œil-de-Dieu. Brume, lumière de fin de journée. | manquant |
| `images/lieux/hautjardin.webp` | Hautjardin | Vue lointaine de Hautjardin (château, Le Bief) : Château des Tyrell au bord de la Mander, entouré de jardins, de vergers et de labyrinthes. Brume, lumière de fin de journée. | manquant |
| `images/lieux/ile-aux-ours.webp` | L’île aux Ours | Vue lointaine de L’île aux Ours (île, Le Nord) : Île boisée de la baie des Glaces, siège de la maison Mormont. Brume, lumière de fin de journée. | manquant |
| `images/lieux/ile-de-torth.webp` | Torth | Vue lointaine de Torth (île, Les Terres de l’Orage) : Île des Terres de l’Orage surnommée l’île Saphir, siège de la maison de Torth. Brume, lumière de fin de journée. | manquant |
| `images/lieux/jardins-aquatiques.webp` | Les Jardins Aquatiques | Vue lointaine de Les Jardins Aquatiques (château, Dorne) : Palais d’été des princes de Dorne, aux bassins de marbre et aux orangers, près de Lancehélion. Brume, lumière de fin de journée. | manquant |
| `images/lieux/les-eyrie.webp` | Les Eyrié | Vue lointaine de Les Eyrié (château, Le Val) : Château imprenable des Arryn, perché au sommet d’une montagne du Val. Brume, lumière de fin de journée. | manquant |
| `images/lieux/les-jumeaux.webp` | Les Jumeaux | Vue lointaine de Les Jumeaux (château, Le Conflans) : Deux tours reliées par un pont fortifié sur la Verfurque, siège de la maison Frey. Brume, lumière de fin de journée. | manquant |
| `images/lieux/lorath.webp` | Lorath | Vue lointaine de Lorath (île, Les cités libres) : La plus petite et la plus pauvre des cités libres, sur un archipel de la baie de la Frissonnante. Brume, lumière de fin de journée. | manquant |
| `images/lieux/lys.webp` | Lys | Vue lointaine de Lys (île, Les cités libres) : Cité libre insulaire réputée pour sa beauté, ses jardins de plaisir et ses poisons. Brume, lumière de fin de journée. | manquant |
| `images/lieux/myr.webp` | Myr | Vue lointaine de Myr (cité, Les cités libres) : Cité libre d’artisans et de marchands, célèbre pour ses lentilles, ses tapis et ses dentelles. Brume, lumière de fin de journée. | manquant |
| `images/lieux/naath.webp` | Naath | Vue lointaine de Naath (île, La mer d’Été) : Île paisible de la mer d’Été, patrie de Missandei, protégée par des papillons et des fièvres. Brume, lumière de fin de journée. | manquant |
| `images/lieux/norvos.webp` | Norvos | Vue lointaine de Norvos (cité, Les cités libres) : Cité libre des collines, gouvernée par des prêtres barbus et rythmée par ses cloches. Brume, lumière de fin de journée. | manquant |
| `images/lieux/pentos.webp` | Pentos | Vue lointaine de Pentos (cité, Les cités libres) : Cité libre marchande face à Westeros, gouvernée par un prince et ses magistres. Brume, lumière de fin de journée. | manquant |
| `images/lieux/qarth.webp` | Qarth | Vue lointaine de Qarth (cité, L’Est) : Cité marchande aux triples murailles sur le détroit qui relie la mer d’Été à la mer de Jade. Brume, lumière de fin de journée. | manquant |
| `images/lieux/qohor.webp` | Qohor | Vue lointaine de Qohor (cité, Les cités libres) : Cité libre de la forêt de Qohor, aux forgerons capables de retravailler l’acier valyrien. Brume, lumière de fin de journée. | manquant |
| `images/lieux/terres-de-l-ouest.webp` | Les Terres de l’Ouest | Vue lointaine de Les Terres de l’Ouest (région, L’Ouest) : Collines riches en or entre le Conflans et la mer du Crépuscule, domaine des Lannister. Brume, lumière de fin de journée. | manquant |
| `images/lieux/tour-de-la-joie.webp` | La tour de la Joie | Vue lointaine de La tour de la Joie (ruine, Dorne) : Tour isolée des montagnes Rouges, où s’est achevée la Rébellion pour Eddard Stark. Brume, lumière de fin de journée. | manquant |
| `images/lieux/tyrosh.webp` | Tyrosh | Vue lointaine de Tyrosh (île, Les cités libres) : Cité libre insulaire des Degrés de Pierre, connue pour ses teintures et ses mercenaires. Brume, lumière de fin de journée. | manquant |
| `images/lieux/vivesaigues.webp` | Vivesaigues | Vue lointaine de Vivesaigues (château, Le Conflans) : Siège des Tully, au confluent de deux rivières, qu’un fossé d’eau transforme en île. Brume, lumière de fin de journée. | manquant |
| `images/lieux/yunkai.webp` | Yunkaï | Vue lointaine de Yunkaï (cité, La baie des Serfs) : La cité jaune de la baie des Serfs, qui forme des esclaves d’agrément. Brume, lumière de fin de journée. | manquant |

## Étapes du voyage sans image

| Étape | Prompt (16:9, image du palier) | État |
|---|---|---|
| 06 · Le Val d’Arryn | Paysage de Le Val d’Arryn (Le Val) vu à hauteur d’homme, en accord avec l’accroche : « Une vallée fermée par les montagnes de la Lune, et tout en haut, un château que nulle armée n’a jamais pris. ». | manquant |
| 07 · Les Terres de l’Ouest | Paysage de Les Terres de l’Ouest (L’Ouest) vu à hauteur d’homme, en accord avec l’accroche : « Un château taillé dans le roc veille sur les mines les plus riches du royaume. Ici, l’or fait la politique autant que l’épée. ». | manquant |
| 13 · Pentos | Paysage de Pentos (Les cités libres) vu à hauteur d’homme, en accord avec l’accroche : « Une ville de marchands où les fortunes se négocient à l’ombre des jardins, et les couronnes aussi. ». | manquant |
| 15 · Qarth et le désert Rouge | Paysage de Qarth et le désert Rouge (L’Est) vu à hauteur d’homme, en accord avec l’accroche : « Après des jours de sable rouge, une cité aux triples murailles promet tout ce qu’un voyageur peut désirer, à condition de savoir payer. ». | manquant |

## Codex sans illustration

| Entrée | Prompt (16:9) | État |
|---|---|---|
| Âge des Héros | Illustration évocatrice, sans personnage identifiable : Période légendaire où furent fondées les grandes maisons, bâtis le Mur et Winterfell, et vaincue la Longue Nuit. | manquant |
| Ancienne langue | Illustration évocatrice, sans personnage identifiable : Langue des Premiers Hommes, oubliée au sud du Mur, mais encore parlée par les géants et certains peuples libres. | manquant |
| Bas valyrien | Illustration évocatrice, sans personnage identifiable : Ensemble de dialectes nés du haut valyrien, parlés différemment dans chaque cité libre et dans la baie des Serfs. | manquant |
| La Conquête | Illustration évocatrice, sans personnage identifiable : L’invasion de Westeros par Aegon Targaryen et ses sœurs, qui unifia six des sept royaumes sous le Trône de Fer. | manquant |
| Le début de la série | Illustration évocatrice, sans personnage identifiable : La situation du royaume au moment où l’histoire commence : un été qui dure depuis neuf ans, et un roi qui vient de perdre sa Main. | manquant |
| Haut valyrien | Illustration évocatrice, sans personnage identifiable : Langue de l’ancien empire de Valyria, devenue langue savante, comme le latin pour Westeros et Essos. | manquant |
| Langue commune | Illustration évocatrice, sans personnage identifiable : Langue parlée dans presque tout Westeros, héritée des Andals, et comprise dans les ports d’Essos. | manquant |
| Langue dothrakie | Illustration évocatrice, sans personnage identifiable : Langue des khalasars, sans écriture, riche en mots pour les chevaux et pauvre en mots pour la politesse. | manquant |
| Langue ghiscarie | Illustration évocatrice, sans personnage identifiable : Langue de l’empire de Ghis, détruit par Valyria, dont il ne reste que des mots dans les dialectes de la baie des Serfs. | manquant |
| Langue lhazaréenne | Illustration évocatrice, sans personnage identifiable : Langue des Lhazaréens, peuple de bergers pacifiques que les Dothrakis appellent avec mépris les « hommes-agneaux ». | manquant |
| Langue qarthéenne | Illustration évocatrice, sans personnage identifiable : Langue de la cité de Qarth, porte des mers de l’Orient, entre le désert Rouge et la mer de Jade. | manquant |
| Langue rhoynienne | Illustration évocatrice, sans personnage identifiable : Langue des Rhoynar, peuple du grand fleuve, dont l’héritage s’est fondu dans la culture de Dorne. | manquant |
| La Rébellion | Illustration évocatrice, sans personnage identifiable : La guerre qui renversa le roi Aerys et mit Robert Baratheon sur le Trône de Fer, dix-sept ans avant le début de l’histoire. | manquant |

## Images en place à conserver

Les illustrations de scènes du dossier `public/images/` (Mur, Nord, Braavos, peuples, ordres…) sont des créations générées, sans visage reconnaissable. Elles restent en place ; `images/trone-de-fer.webp` n’est utilisée nulle part pour l’instant.
