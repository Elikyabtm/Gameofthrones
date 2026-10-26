// Accès aux contenus (§12 « Données ») : l'index léger est un bloc chargé à la demande, et
// chaque fiche complète est un JSON séparé (un fichier = un bloc au build).
import { createGraph } from './graph.js';

const loaders = {
  characters: import.meta.glob('../data/characters/*.json', { import: 'default' }),
  houses: import.meta.glob('../data/houses/*.json', { import: 'default' }),
  places: import.meta.glob('../data/places/*.json', { import: 'default' }),
  codex: import.meta.glob('../data/codex/*.json', { import: 'default' }),
};

let indexPromise = null;

/** Index + graphe, chargés une seule fois. */
export function loadIndex() {
  indexPromise ??= import('virtual:content-index').then(({ default: index }) => ({
    index,
    graph: createGraph(index),
  }));
  return indexPromise;
}

const cache = new Map();

/** Fiche complète d'une entité, ou null si elle n'existe pas. */
export function loadEntity(kind, slug) {
  const key = `../data/${kind}/${slug}.json`;
  const load = loaders[kind]?.[key];
  if (!load) return Promise.resolve(null);
  if (!cache.has(key)) cache.set(key, load());
  return cache.get(key);
}

export const RUBRICS = [
  { slug: 'peuples', name: 'Peuples et civilisations', image: 'images/premiers-hommes.webp' },
  { slug: 'ordres', name: 'Ordres et armées', image: 'images/garde-royale.webp' },
  { slug: 'croyances', name: 'Croyances', image: 'images/barral.webp' },
  { slug: 'langues', name: 'Langues', image: 'images/valyriens.webp' },
  { slug: 'creatures', name: 'Créatures', image: 'images/dragon.webp' },
];
