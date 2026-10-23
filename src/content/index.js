// Registre de toutes les fiches, par type : getFiche('house', 'stark').
import groups from './groups.js';
import houses from './houses.js';
import languages from './languages.js';
import faiths from './faiths.js';
import creatures from './creatures.js';
import places from './places.js';

export const FICHES = {
  group: groups,
  house: houses,
  lang: languages,
  faith: faiths,
  creature: creatures,
  place: places,
};

export const TYPE_LABELS = {
  group: 'Peuple, armée ou ordre',
  house: 'Maison',
  lang: 'Langue',
  faith: 'Croyance',
  creature: 'Créature',
  place: 'Lieu',
};

const byKey = new Map(
  Object.entries(FICHES).flatMap(([type, list]) => list.map((f) => [`${type}:${f.id}`, f])),
);

export function getFiche(type, id) {
  const f = byKey.get(`${type}:${id}`);
  if (!f) throw new Error(`Fiche introuvable : ${type}:${id}`);
  return f;
}

export const allFiches = () => [...byKey.values()];
