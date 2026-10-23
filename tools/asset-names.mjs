// Correspondance « nom de fichier de l'ancien site » → nom clair dans public/images/.
// Partagée par tools/copy-assets.mjs (copie) et tools/extract-content.mjs (chemins des fiches).
export const IMAGE_NAMES = {
  'andals-scene': 'andals',
  braavos: 'braavos',
  'brotherhood-scene': 'fraternite-sans-bannieres',
  'childrenforest-scene': 'enfants-de-la-foret',
  'crown-hd': 'couronne',
  'dornish-scene': 'dorniens',
  dothraki: 'dothraki',
  'dragon-hd': 'dragon',
  'drownedgod-scene': 'dieu-noye',
  'faceless-scene': 'sans-visage',
  'faithmilitant-scene': 'foi-militante',
  'firstmen-scene': 'premiers-hommes',
  freefolk: 'peuple-libre',
  'ghiscari-scene': 'ghiscari',
  'giants-scene': 'geants',
  'goldencompany-scene': 'compagnie-doree',
  'harpy-scene': 'fils-de-la-harpie',
  'ironborn-scene': 'fer-nes',
  'kingsguard-scene': 'garde-royale',
  'lhazareen-scene': 'lhazareens',
  'maesters-scene': 'mestres',
  'nightwatch-scene': 'garde-de-nuit',
  'north-hd': 'nord',
  'redpriest-scene': 'maitre-de-la-lumiere',
  'rhoynar-scene': 'rhoynar',
  'secondsons-scene': 'puines',
  'sevenfaith-scene': 'foi-des-sept',
  'thenns-scene': 'thenns',
  'throne-hd': 'trone-de-fer',
  unsullied: 'immacules',
  'valyrians-scene': 'valyriens',
  'wall-hd': 'mur',
  'weirwood-scene': 'barral',
  'wolf-hd': 'loup-geant',
};

/** Chemin public d'une illustration à partir de sa clé dans l'ancien site. */
export function imagePath(oldKey) {
  const name = IMAGE_NAMES[oldKey];
  if (!name) throw new Error(`Image inconnue dans IMAGE_NAMES : ${oldKey}`);
  return `images/${name}.webp`;
}
