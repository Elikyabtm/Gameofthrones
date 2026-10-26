// Petits utilitaires DOM partagés : échappement, gabarits, annonces, ornements.
import fleuron from '../assets/ornaments/fleuron.svg?raw';
import arrowLeft from '../assets/ornaments/arrow-left.svg?raw';
import arrowRight from '../assets/ornaments/arrow-right.svg?raw';
import corner from '../assets/ornaments/corner.svg?raw';
import ruleEnd from '../assets/ornaments/rule-end.svg?raw';
import crest from '../assets/ornaments/crest.svg?raw';

export const ORNAMENTS = {
  fleuron,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  corner,
  'rule-end': ruleEnd,
  crest,
};

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

/** Remplit les éléments [data-ornament] d'un conteneur avec le SVG correspondant. */
export function hydrateOrnaments(root = document) {
  root.querySelectorAll('[data-ornament]:empty').forEach((el) => {
    el.innerHTML = ORNAMENTS[el.dataset.ornament] ?? '';
  });
}

export const ornament = (name, cls = '') =>
  `<span class="orn ${cls}" aria-hidden="true">${ORNAMENTS[name]}</span>`;

/** Filet « ─◆ ─── ◆─ » avec un libellé facultatif au centre. */
export const rule = (label = '') =>
  `<div class="rule">${label ? `<span class="label">${esc(label)}</span>` : '<span class="diamond"></span>'}</div>`;

const announcer = () => document.getElementById('announcer');
/** Annonce pour les lecteurs d'écran (région aria-live, §12). */
export function announce(text) {
  const el = announcer();
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => (el.textContent = text));
}

let toastTimer = 0;
/** Notification discrète en bas d'écran. */
export function toast(text) {
  const el = document.querySelector('.toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3200);
}

/** Pied de page commun à chaque espace (§1.4). */
export const footer = () => `
  <footer class="site-footer">
    ${rule()}
    <p>Guide de fan non officiel, sans affiliation avec HBO ni George R. R. Martin.</p>
    <p><a href="/a-propos">À propos, sources et crédits</a></p>
  </footer>`;

/** Piège du focus pour une boîte de dialogue ; renvoie la fonction de nettoyage. */
export function trapFocus(container, onEscape) {
  const sel =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = [...container.querySelectorAll(sel)].filter((n) => n.offsetParent !== null);
    if (!items.length) return;
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
  container.addEventListener('keydown', onKey);
  return () => container.removeEventListener('keydown', onKey);
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
