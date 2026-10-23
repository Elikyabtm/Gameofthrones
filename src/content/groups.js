// Généré par tools/extract-content.mjs depuis reference/ancien-site/. Textes non corrigés.
// Peuples, armées, ordres et civilisations (22 fiches).
import westeros from './groups/westeros.js';
import essos from './groups/essos.js';

// Ordre de l'ancien site conservé.
const ORDER = [
  'dothraki',
  'unsullied',
  'freefolk',
  'nightwatch',
  'ironborn',
  'dornish',
  'firstmen',
  'andals',
  'rhoynar',
  'valyrians',
  'ghiscari',
  'braavosi',
  'lhazareen',
  'faceless',
  'secondsons',
  'goldencompany',
  'brotherhood',
  'kingsguard',
  'maesters',
  'faithmilitant',
  'harpy',
  'thenns',
];
const all = [...westeros, ...essos];
export default ORDER.map((id) => all.find((g) => g.id === id));
