// Menu « Explorer » plein écran : étapes numérotées et annexes (PROJET.md §8.5).
// Piège du focus, fermeture avec Échap, retour du focus sur le bouton d'ouverture.
import { escapeHtml } from '../journey/render.js';

export function initMenu({ steps, goTo }) {
  const menu = document.getElementById('menu');
  const opener = document.querySelector('.hud-explore');
  const list = menu.querySelector('.menu-steps');
  list.innerHTML = steps
    .map(
      (s, i) =>
        `<li><a href="#etape-${s.id}" data-index="${i}"><span class="n">${s.num}</span>${escapeHtml(
          s.place,
        )}</a></li>`,
    )
    .join('');

  const focusables = () => [...menu.querySelectorAll('a[href], button')];

  function open() {
    menu.hidden = false;
    opener.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('has-modal');
    focusables()[0].focus();
  }
  function close({ restoreFocus = true } = {}) {
    if (menu.hidden) return;
    menu.hidden = true;
    opener.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('has-modal');
    if (restoreFocus) opener.focus();
  }

  opener.addEventListener('click', () => (menu.hidden ? open() : close()));
  menu.querySelector('.menu-close').addEventListener('click', () => close());
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    close({ restoreFocus: false });
    if (a.dataset.index !== undefined) {
      e.preventDefault();
      goTo(Number(a.dataset.index));
    }
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  return {
    setCurrent(index) {
      list.querySelectorAll('a').forEach((a) => {
        if (Number(a.dataset.index) === index) a.setAttribute('aria-current', 'step');
        else a.removeAttribute('aria-current');
      });
    },
  };
}
