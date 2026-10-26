// Modale de recherche globale (§8.5) : champ plein écran, résultats groupés, navigation au
// clavier (↑ ↓ Entrée), fermeture par Échap.
import { loadIndex } from '../core/content.js';
import { search } from '../core/search.js';
import { stepForPlace } from '../core/places.js';
import { store } from '../core/store.js';
import { router } from '../core/router.js';
import { esc, trapFocus } from './dom.js';
import { portrait, scene } from './media.js';

const GROUPS = [
  ['characters', 'Personnages'],
  ['houses', 'Maisons'],
  ['places', 'Lieux'],
  ['codex', 'Codex'],
];

export function initSearch() {
  const root = document.getElementById('search');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Recherche');
  root.innerHTML = `
    <div class="search-inner">
      <button type="button" class="menu-close icon-btn search-close" aria-label="Fermer la recherche">×</button>
      <label class="search-field">
        <span class="visually-hidden">Rechercher un personnage, une maison, un lieu ou une entrée du Codex</span>
        <input type="search" placeholder="Un nom, une maison, un lieu…" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="search-results" aria-autocomplete="list" />
      </label>
      <div id="search-results" class="search-results" role="listbox" aria-label="Résultats"></div>
    </div>`;
  const input = root.querySelector('input');
  const results = root.querySelector('.search-results');
  let release = null;
  let opener = null;
  let hits = [];
  let sel = -1;
  let data = null;

  function close() {
    root.hidden = true;
    release?.();
    document.documentElement.classList.remove('has-modal');
    opener?.focus?.();
  }

  function select(i) {
    sel = i;
    results.querySelectorAll('.search-hit').forEach((a, k) => {
      a.setAttribute('aria-selected', String(k === sel));
      if (k === sel) {
        a.scrollIntoView({ block: 'nearest' });
        input.setAttribute('aria-activedescendant', a.id);
      }
    });
  }

  function render() {
    if (!data) return;
    const { index, graph } = data;
    const res = search(index, graph, input.value, store.season);
    hits = [];
    const html = GROUPS.map(([k, label]) => {
      if (!res[k].length) return '';
      return `<div class="search-group" role="group" aria-label="${label}"><p class="label">${label}</p>${res[
        k
      ]
        .map((h) => {
          const i = hits.length;
          const step = k === 'places' ? stepForPlace(h.slug) : null;
          const href = h.href ?? (step ? `/carte/${step.slug}` : '/');
          hits.push({ ...h, href });
          const media =
            k === 'characters'
              ? portrait(h.item, {
                  sigil: graph.houses.get(h.item.house)?.sigil,
                  sizes: '42px',
                  alt: '',
                })
              : k === 'houses'
                ? `<img src="/${h.item.sigil}" alt="" />`
                : scene(h.item.image, h.name, { sizes: '42px', alt: '' });
          return `<a class="search-hit" id="hit-${i}" role="option" aria-selected="false" href="${href}">
            <span class="search-hit-media">${media}</span>
            <span><span class="search-hit-name">${esc(h.name)}</span><span class="search-hit-sub">${esc(h.sub ?? '')}</span></span>
          </a>`;
        })
        .join('')}</div>`;
    }).join('');
    results.innerHTML =
      html ||
      (input.value.trim()
        ? `<p class="search-empty">Aucun résultat pour « ${esc(input.value)} ».</p>`
        : '');
    select(hits.length ? 0 : -1);
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') select(Math.min(hits.length - 1, sel + 1));
    else if (e.key === 'ArrowUp') select(Math.max(0, sel - 1));
    else if (e.key === 'Enter' && hits[sel]) {
      close();
      router.navigate(hits[sel].href);
    } else return;
    e.preventDefault();
  });
  root.addEventListener('click', (e) => {
    if (e.target.closest('.search-close')) return close();
    if (e.target.closest('.search-hit')) close();
  });

  return {
    async open() {
      opener = document.activeElement;
      root.hidden = false;
      document.documentElement.classList.add('has-modal');
      release = trapFocus(root, close);
      input.value = '';
      results.innerHTML = '';
      input.focus();
      data ??= await loadIndex();
      render();
    },
  };
}
