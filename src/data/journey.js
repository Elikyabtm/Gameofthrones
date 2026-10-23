// Les étapes du voyage (PROJET.md §3). Phase 3 : Westeros, étapes 00 à 09.
// Les phrases `hook`, `transition` et l'accroche de l'intro sont des PROPOSITIONS
// originales, à valider (§3.2).

export const INTRO = {
  id: 'intro',
  num: '00',
  kicker: 'Guide non officiel · Westeros & Essos',
  title: 'A Realm Divided',
  hook: 'Du Mur jusqu’aux ruines de Valyria, un voyage à travers les terres, les peuples et les mémoires d’un monde divisé.',
  cta: 'Commencer le voyage',
};

// Nombre total d'étapes du voyage complet (Essos compris, phase 6).
export const TOTAL_STEPS = 13;

export const STEPS = [
  {
    id: 'au-dela-du-mur',
    num: '01',
    place: 'Au-delà du Mur',
    region: 'Le Grand Nord',
    hook: 'Au nord de la glace commence un pays sans seigneurs, où chaque hiver se compte en vies et où chaque clan garde sa propre loi.',
    transition:
      'Vers le sud, une muraille de glace barre l’horizon : c’est là que veillent les frères en noir.',
    focus: { x: 470, y: 70 },
    image: 'images/peuple-libre.webp',
    alt: 'Illustration : un campement du Peuple libre dans la neige, au-delà du Mur.',
    links: [
      { type: 'group', id: 'freefolk' },
      { type: 'group', id: 'thenns' },
      { type: 'creature', id: 'geants' },
      { type: 'creature', id: 'marcheurs-blancs' },
      { type: 'creature', id: 'enfants-de-la-foret' },
      { type: 'lang', id: 'old' },
    ],
  },
  {
    id: 'mur',
    num: '02',
    place: 'Le Mur',
    region: 'Le Don',
    hook: 'Une muraille de glace sépare deux mondes. Ceux qui la gardent ont renoncé à tout pour ne plus servir qu’elle.',
    transition: 'Plus au sud, au cœur des forêts, une vieille forteresse garde la mémoire du Nord.',
    focus: { city: 'Châteaunoir' },
    image: 'images/mur.webp',
    alt: 'Illustration : la muraille de glace du Mur sous un ciel gris.',
    links: [
      { type: 'place', id: 'chateaunoir' },
      { type: 'group', id: 'nightwatch' },
    ],
  },
  {
    id: 'winterfell',
    num: '03',
    place: 'Winterfell',
    region: 'Le Nord',
    hook: 'Des murs gris, des sources chaudes et un arbre au visage sculpté : le Nord se gouverne ici, au rythme lent des hivers.',
    transition:
      'À l’ouest, au-delà des côtes, des îles battues par le vent vivent tournées vers la mer.',
    focus: { city: 'Winterfell' },
    image: 'images/nord.webp',
    alt: 'Illustration : les terres du Nord, forêts sombres et collines sous la brume.',
    links: [
      { type: 'place', id: 'winterfell' },
      { type: 'house', id: 'stark', lineage: true },
      { type: 'house', id: 'bolton' },
      { type: 'faith', id: 'anciens-dieux' },
      { type: 'creature', id: 'loups-geants' },
      { type: 'group', id: 'firstmen' },
    ],
  },
  {
    id: 'iles-de-fer',
    num: '04',
    place: 'Les Îles de Fer',
    region: 'Les Îles de Fer',
    hook: 'Sur ces rochers, la richesse ne pousse pas : elle se prend en mer. Les tours de Pyk regardent les vagues plutôt que les champs.',
    transition:
      'Retour sur le continent : entre fleuves et montagnes, deux maisons alliées tiennent le cœur du royaume.',
    focus: { city: 'Pyk' },
    image: 'images/fer-nes.webp',
    alt: 'Illustration : un drakkar des Fer-nés approchant des côtes rocheuses.',
    links: [
      { type: 'place', id: 'pyk' },
      { type: 'group', id: 'ironborn' },
      { type: 'house', id: 'greyjoy' },
      { type: 'faith', id: 'dieu-noye' },
    ],
  },
  {
    id: 'conflans-val',
    num: '05',
    place: 'Le Conflans et le Val',
    region: 'Le Conflans · Le Val',
    hook: 'Ici les rivières se rejoignent et les armées se croisent. Plus à l’est, une forteresse imprenable guette depuis les sommets.',
    transition:
      'Vers l’ouest, les collines cachent de l’or, et une famille qui ne l’oublie jamais.',
    focus: { x: 426, y: 640 },
    camera: { dist: 4.6, height: 4 },
    image: 'images/fraternite-sans-bannieres.webp',
    alt: 'Illustration : une troupe sans bannière traversant les terres dévastées du Conflans.',
    links: [
      { type: 'place', id: 'vivesaigues' },
      { type: 'place', id: 'les-eyrie' },
      { type: 'house', id: 'tully', lineage: true },
      { type: 'house', id: 'arryn', lineage: true },
      { type: 'group', id: 'brotherhood' },
      { type: 'group', id: 'andals' },
    ],
  },
  {
    id: 'ouest',
    num: '06',
    place: 'L’Ouest',
    region: 'Les Terres de l’Ouest',
    hook: 'Un château taillé dans le roc veille sur les mines les plus riches du royaume. Ici, l’or fait la politique autant que l’épée.',
    transition: 'Toutes les routes mènent vers l’est, à la ville où siège le trône.',
    focus: { city: 'Castral Roc' },
    image: 'images/couronne.webp',
    alt: 'Illustration : une couronne d’or posée sur un velours rouge.',
    links: [
      { type: 'place', id: 'castral-roc' },
      { type: 'house', id: 'lannister', lineage: true },
    ],
  },
  {
    id: 'port-real',
    num: '07',
    place: 'Port-Réal',
    region: 'Les Terres de la Couronne',
    hook: 'Une ville immense et serrée, dominée par un donjon rouge : chaque intrigue du royaume finit un jour par passer ses portes.',
    transition: 'Au large de la baie, une île de pierre noire garde le souvenir des dragons.',
    focus: { city: 'Port-Réal' },
    image: 'images/trone-de-fer.webp',
    alt: 'Illustration : un trône hérissé de lames dans une salle sombre.',
    links: [
      { type: 'place', id: 'port-real' },
      { type: 'house', id: 'baratheon', lineage: true },
      { type: 'faith', id: 'foi-des-sept' },
      { type: 'group', id: 'kingsguard' },
      { type: 'group', id: 'faithmilitant' },
      { type: 'lang', id: 'common' },
    ],
  },
  {
    id: 'peyredragon',
    num: '08',
    place: 'Peyredragon',
    region: 'L’héritage de Valyria',
    hook: 'Sur cette île volcanique, les premiers conquérants ont laissé des murs sculptés en forme de dragons, et une ambition intacte.',
    transition:
      'Cap au sud, vers les jardins, la plus vieille cité du royaume et les sables de Dorne.',
    focus: { city: 'Peyredragon' },
    image: 'images/dragon.webp',
    alt: 'Illustration : un dragon aux ailes déployées au-dessus des falaises.',
    links: [
      { type: 'place', id: 'peyredragon' },
      { type: 'house', id: 'targaryen', lineage: true },
      { type: 'creature', id: 'dragons' },
      { type: 'lang', id: 'highvalyrian' },
    ],
  },
  {
    id: 'sud',
    num: '09',
    place: 'Le Sud',
    region: 'Le Bief · Dorne',
    hook: 'Champs fertiles, savants à chaîne et princes du désert : le Sud déploie trois façons de durer, de la Citadelle au soleil de Dorne.',
    transition: 'Au-delà de la mer Étroite, un autre continent attend : Essos et ses cités libres.',
    focus: { x: 395, y: 985 },
    camera: { dist: 6, height: 5.6 },
    image: 'images/dorniens.webp',
    alt: 'Illustration : une cour dornienne en grès, ombragée, avec des bassins.',
    links: [
      { type: 'place', id: 'hautjardin' },
      { type: 'place', id: 'villevieille' },
      { type: 'place', id: 'lancehelion' },
      { type: 'house', id: 'tyrell', lineage: true },
      { type: 'house', id: 'martell', lineage: true },
      { type: 'group', id: 'maesters' },
      { type: 'group', id: 'dornish' },
      { type: 'group', id: 'rhoynar' },
      { type: 'lang', id: 'rhoynish' },
    ],
  },
];

/** Côté du panneau : à gauche par défaut, puis en alternance, sauf `panelSide` explicite. */
export const panelSide = (step, index) => step.panelSide ?? (index % 2 ? 'right' : 'left');
