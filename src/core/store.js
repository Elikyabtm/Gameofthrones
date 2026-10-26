// État global (§4.1) : saison choisie, son, animations réduites, espace courant.
// Persistance en localStorage protégée par try/catch, avec repli en mémoire (navigation privée).

const KEY = 'realm-divided:v2';
const memory = {};

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return { ...memory };
  }
}

function save(data) {
  Object.assign(memory, data);
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* stockage indisponible : la mémoire suffit pour la session */
  }
}

const systemReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saved = load();

const state = {
  season: Number.isInteger(saved.season) ? saved.season : null, // null = jamais choisie
  sound: false, // toujours coupé au chargement (§8.4)
  reducedMotion: saved.reducedMotion ?? systemReduced,
  space: 'map',
};

const listeners = new Set();

export const store = {
  get: (k) => state[k],
  /** Saison effective : 1 tant que le visiteur n'a pas choisi. */
  get season() {
    return state.season ?? 1;
  },
  get hasChosenSeason() {
    return state.season !== null;
  },
  set(patch) {
    const changed = Object.keys(patch).filter((k) => state[k] !== patch[k]);
    if (!changed.length) return;
    Object.assign(state, patch);
    save({ season: state.season, reducedMotion: state.reducedMotion });
    for (const fn of listeners) fn(changed, state);
  },
  /** Abonnement : fn(clésModifiées, état). Renvoie la fonction de désabonnement. */
  on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
