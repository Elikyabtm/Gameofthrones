// Routeur maison (§4.2) : API History, URLs propres, liens interceptés.
// Une route donne { space, view, params } ; l'application monte l'espace correspondant.

const ROUTES = [
  ['/', 'map', 'intro'],
  ['/carte/:step', 'map', 'step'],
  ['/personnages', 'characters', 'gallery'],
  ['/personnages/:slug', 'characters', 'fiche'],
  ['/personnages/:slug/:tab', 'characters', 'fiche'],
  ['/maisons', 'houses', 'list'],
  ['/maisons/toutes-les-lignees', 'houses', 'lineages'],
  ['/maisons/:slug', 'houses', 'page'],
  ['/codex', 'codex', 'home'],
  ['/codex/:rubric', 'codex', 'rubric'],
  ['/codex/:rubric/:slug', 'codex', 'entry'],
  ['/a-propos', 'about', 'about'],
].map(([pattern, space, view]) => {
  const keys = [];
  const re = new RegExp(
    '^' +
      pattern.replace(/:(\w+)/g, (_, k) => {
        keys.push(k);
        return '([^/]+)';
      }) +
      '/?$',
  );
  return { re, keys, space, view };
});

/** Analyse une URL (chemin + requête). Route inconnue → espace « notfound ». */
export function match(url) {
  const u = new URL(url, location.origin);
  const path = decodeURIComponent(u.pathname).replace(/\/index\.html$/, '/');
  for (const r of ROUTES) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, m[i + 1]]));
    if (r.view === 'fiche' && params.tab && !['liens', 'lieux'].includes(params.tab)) continue;
    return { space: r.space, view: r.view, params, query: u.searchParams, path, hash: u.hash };
  }
  return { space: 'notfound', view: 'notfound', params: {}, query: u.searchParams, path };
}

let handler = () => {};
let current = null;

export const router = {
  get current() {
    return current;
  },
  /** Démarre l'écoute. `onRoute(route, { pop })` est appelé à chaque changement. */
  start(onRoute) {
    handler = onRoute;
    addEventListener('popstate', () => go(location.href, { pop: true }));
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = e.target.closest('a[href]');
      if (!a || a.target || a.hasAttribute('download') || a.dataset.external !== undefined) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // ancre interne : comportement natif
      e.preventDefault();
      router.navigate(url.pathname + url.search + url.hash);
    });
    go(location.href, { pop: true, initial: true });
  },
  navigate(url, { replace = false } = {}) {
    const full = new URL(url, location.href);
    if (full.href === location.href && !replace) return;
    history[replace ? 'replaceState' : 'pushState'](
      null,
      '',
      full.pathname + full.search + full.hash,
    );
    go(full.href, { pop: false });
  },
  /** Met à jour l'URL sans recharger l'espace (étapes du voyage, onglets). */
  replace(url) {
    history.replaceState(null, '', url);
    current = match(location.href);
  },
};

function go(url, opts) {
  current = match(url);
  handler(current, opts);
}

/** Met à jour le titre et la description de la page (§4.2). */
export function setMeta(title, description) {
  document.title = title
    ? `${title} · A Realm Divided`
    : 'A Realm Divided — Guide de fan non officiel';
  if (description)
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
}
