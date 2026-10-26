// Sélecteur de saison (§9) : « Jusqu'où avez-vous regardé ? ». Aucun résumé révélateur :
// numéro, titre de la saison (titre du premier épisode) et année seulement.
import seasons from '../data/seasons.json';
import { esc, trapFocus } from './dom.js';
import { store } from '../core/store.js';

export function initSeasonPicker() {
  const root = document.getElementById('season-picker');
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'season-title');
  const choices = [
    {
      value: 1,
      key: 'discover',
      num: '—',
      title: 'Je découvre',
      note: 'Rien au-delà du tout début',
    },
    ...seasons.map((s) => ({
      value: s.s,
      key: `s${s.s}`,
      num: String(s.s),
      title: s.title,
      note: String(s.year),
    })),
    { value: 8, key: 'all', num: '∞', title: 'Tout', note: 'J’ai tout vu' },
  ];
  root.innerHTML = `
    <div class="picker-inner">
      <p class="label label-accent">Avant le voyage</p>
      <h2 id="season-title">Jusqu’où avez-vous regardé ?</h2>
      <p class="picker-lead">Le guide s’adapte à votre choix : rien de ce qui se passe après la saison choisie ne sera affiché. Vous pourrez la changer à tout moment, en haut de l’écran.</p>
      <ul class="picker-grid">${choices
        .map(
          (
            c,
          ) => `<li><button type="button" class="season-card" data-value="${c.value}" data-key="${c.key}">
            <span class="season-num">${esc(c.num)}</span>
            <span class="season-name">${esc(c.title)}</span>
            <span class="season-note">${esc(c.note)}</span>
          </button></li>`,
        )
        .join('')}</ul>
      <button type="button" class="picker-cancel btn">Fermer</button>
    </div>`;

  let release = null;
  let resolver = null;
  let opener = null;

  function close(value = null) {
    root.hidden = true;
    release?.();
    document.documentElement.classList.remove('has-modal');
    opener?.focus?.();
    resolver?.(value);
    resolver = null;
  }

  root.addEventListener('click', (e) => {
    const card = e.target.closest('.season-card');
    if (card) {
      const value = Number(card.dataset.value);
      store.set({ season: value });
      close(value);
    } else if (e.target.closest('.picker-cancel')) close(null);
  });

  return {
    /** Ouvre le sélecteur ; résout avec la saison choisie (ou null si fermé). */
    open({ first = false } = {}) {
      opener = document.activeElement;
      root.hidden = false;
      root.classList.toggle('is-first', first);
      root.querySelector('.picker-cancel').hidden = first && !store.hasChosenSeason;
      root.querySelectorAll('.season-card').forEach((b) => {
        const cur =
          store.hasChosenSeason &&
          Number(b.dataset.value) === store.season &&
          b.dataset.key !== 'discover' &&
          b.dataset.key !== 'all';
        b.setAttribute('aria-pressed', String(cur));
      });
      document.documentElement.classList.add('has-modal');
      release = trapFocus(root, () => (first && !store.hasChosenSeason ? null : close(null)));
      (root.querySelector('[aria-pressed="true"]') ?? root.querySelector('.season-card')).focus();
      return new Promise((r) => (resolver = r));
    },
  };
}
