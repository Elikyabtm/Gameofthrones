// En-tête et barre du bas (§8.2). Leur contenu dépend de l'espace courant.
import { esc, hydrateOrnaments } from './dom.js';
import { store } from '../core/store.js';

const SEASON_LABEL = (s) => (s >= 8 && store.get('season') === 8 ? 'Saison 8' : `Saison ${s}`);

export function initChrome() {
  hydrateOrnaments();
  const header = document.querySelector('.site-header');
  const seasonText = header.querySelector('.season-btn-text');
  const bar = document.querySelector('.bottom-bar');
  const prev = bar.querySelector('.bar-prev');
  const next = bar.querySelector('.bar-next');
  const title = bar.querySelector('.bar-title');
  const count = bar.querySelector('.bar-count');

  const updateSeason = () => (seasonText.textContent = SEASON_LABEL(store.season));
  updateSeason();
  store.on((keys) => keys.includes('season') && updateSeason());

  function side(a, item, word) {
    a.hidden = !item;
    if (!item) return;
    a.href = item.href;
    a.setAttribute('aria-label', `${word} : ${item.label}`);
    a.querySelector('.bar-side-label').textContent = item.label;
  }

  return {
    setSpace(space) {
      document.documentElement.dataset.space = space;
      header.querySelectorAll('[data-space]').forEach((a) => {
        if (a.dataset.space === space) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    },
    /** { prev: {href,label}|null, title, next, count } */
    setBar({ prev: p = null, title: t = '', next: n = null, count: c = '' } = {}) {
      side(prev, p, 'Précédent');
      side(next, n, 'Suivant');
      title.innerHTML = t ? esc(t) : '';
      count.textContent = c;
      bar.classList.toggle('is-empty', !p && !n && !t);
    },
  };
}
