// Menu ≡ (§8.2) : espaces, étapes de la carte, À propos et réglages.
// Piège du focus, fermeture avec Échap, retour du focus sur le bouton d'ouverture.
import journey from '../data/journey.json';
import { esc, trapFocus } from './dom.js';
import { store } from '../core/store.js';

export function initMenu({ onSeason, onSound, onSearch }) {
  const menu = document.getElementById('menu');
  const opener = document.querySelector('.menu-btn');
  menu.setAttribute('role', 'dialog');
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-label', 'Menu');
  menu.innerHTML = `
    <div class="menu-inner">
      <button type="button" class="menu-close icon-btn" aria-label="Fermer le menu">×</button>
      <div class="menu-col">
        <p class="label label-accent">Espaces</p>
        <ul class="menu-spaces">
          <li><a href="/">Carte</a></li>
          <li><a href="/personnages">Personnages</a></li>
          <li><a href="/maisons">Maisons</a></li>
          <li><a href="/codex">Codex</a></li>
          <li><a href="/a-propos">À propos</a></li>
        </ul>
        <p class="label label-accent">Réglages</p>
        <ul class="menu-settings">
          <li><button type="button" data-set="search">Rechercher</button></li>
          <li><button type="button" data-set="season">Saison choisie : <span class="v-season"></span></button></li>
          <li><button type="button" data-set="sound" aria-pressed="false">Son d’ambiance : <span class="v-sound">coupé</span></button></li>
          <li><button type="button" data-set="motion" aria-pressed="false">Réduire les animations : <span class="v-motion">non</span></button></li>
        </ul>
      </div>
      <div class="menu-col">
        <p class="label label-accent">Le voyage</p>
        <ol class="menu-steps">${journey.steps
          .map(
            (s) =>
              `<li><a href="/carte/${s.slug}" data-step="${s.slug}"><span class="n">${s.num}</span>${esc(s.title)}</a></li>`,
          )
          .join('')}</ol>
      </div>
    </div>`;

  let release = null;
  const refresh = () => {
    menu.querySelector('.v-season').textContent = `saison ${store.season}`;
    menu.querySelector('.v-sound').textContent = store.get('sound') ? 'activé' : 'coupé';
    menu
      .querySelector('[data-set="sound"]')
      .setAttribute('aria-pressed', String(store.get('sound')));
    menu.querySelector('.v-motion').textContent = store.get('reducedMotion') ? 'oui' : 'non';
    menu
      .querySelector('[data-set="motion"]')
      .setAttribute('aria-pressed', String(store.get('reducedMotion')));
  };

  function open() {
    refresh();
    menu.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('has-modal');
    release = trapFocus(menu, close);
    menu.querySelector('a, button:not(.menu-close)').focus();
  }
  function close({ restoreFocus = true } = {}) {
    if (menu.hidden) return;
    menu.hidden = true;
    release?.();
    opener.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('has-modal');
    if (restoreFocus) opener.focus();
  }

  opener.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.menu-close') || e.target === menu) return close();
    if (e.target.closest('a[href]')) return close({ restoreFocus: false });
    const set = e.target.closest('[data-set]')?.dataset.set;
    if (set === 'search') {
      close({ restoreFocus: false });
      onSearch();
    } else if (set === 'season') {
      close({ restoreFocus: false });
      onSeason();
    } else if (set === 'sound') {
      onSound();
      refresh();
    } else if (set === 'motion') {
      store.set({ reducedMotion: !store.get('reducedMotion') });
      refresh();
    }
  });

  return {
    close,
    setStep(slug) {
      menu.querySelectorAll('[data-step]').forEach((a) => {
        if (a.dataset.step === slug) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
