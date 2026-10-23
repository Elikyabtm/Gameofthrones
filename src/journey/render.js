// Génère le HTML du voyage depuis journey.js et src/content/, au chargement, avant WebGL
// (PROJET.md §6) : le texte est lisible même sans JavaScript graphique.
import { INTRO, STEPS, panelSide } from '../data/journey.js';
import { getFiche, TYPE_LABELS } from '../content/index.js';
import { TYPE_ICONS } from '../ui/icons.js';

const MAX_VISIBLE_LINKS = 6; // au-delà : 4 visibles + « + N autres »
const SHOWN_WHEN_FOLDED = 4;

export const escapeHtml = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

function linkItem(link, hidden) {
  const f = getFiche(link.type, link.id);
  const lineage = link.lineage
    ? `<button type="button" class="lineage" data-lineage="${link.id}">Voir la lignée</button>`
    : '';
  return `<li${hidden ? ' class="is-extra" hidden' : ''}>
    <button type="button" class="stop-link" data-archive="${link.type}:${link.id}"
      aria-label="${escapeHtml(`${f.title} — ${TYPE_LABELS[link.type]}`)}">
      ${TYPE_ICONS[link.type]}<span>${escapeHtml(f.title)}</span>
    </button>${lineage}
  </li>`;
}

function stepArticle(step, index) {
  const folded = step.links.length > MAX_VISIBLE_LINKS;
  const items = step.links.map((l, i) => linkItem(l, folded && i >= SHOWN_WHEN_FOLDED)).join('');
  const more = folded
    ? `<li><button type="button" class="stop-more" aria-expanded="false">+ ${
        step.links.length - SHOWN_WHEN_FOLDED
      } autres</button></li>`
    : '';
  return `<article class="stop" id="etape-${step.id}" data-step="${step.id}" data-side="${panelSide(step, index)}">
    <div class="stop-sticky">
    <div class="stop-panel">
      <p class="stop-region">${escapeHtml(step.region)}</p>
      <p class="stop-num" aria-hidden="true">${step.num}</p>
      <h2>${escapeHtml(step.place)}</h2>
      <p class="stop-hook">${escapeHtml(step.hook)}</p>
      <figure class="stop-figure">
        <img src="${step.image}" alt="${escapeHtml(step.alt)}" width="1280" height="720" loading="lazy" decoding="async" />
      </figure>
      <h3 class="visually-hidden">À découvrir</h3>
      <ul class="stop-links">${items}${more}</ul>
      <p class="stop-transition">${escapeHtml(step.transition)}</p>
    </div>
    </div>
  </article>`;
}

/** Remplit l'intro et la section #voyage. Renvoie la liste des articles. */
export function renderJourney(root = document) {
  const intro = root.getElementById('intro');
  intro.innerHTML = `
    <div class="intro-inner">
      <p class="label intro-kicker">${escapeHtml(INTRO.kicker)}</p>
      <h1>${escapeHtml(INTRO.title)}</h1>
      <p class="intro-hook">${escapeHtml(INTRO.hook)}</p>
      <a class="intro-cta" href="#etape-${STEPS[0].id}">${escapeHtml(INTRO.cta)} <span aria-hidden="true">↓</span></a>
      <div class="intro-loading" role="status" aria-live="polite"><span class="bar"></span><span class="visually-hidden">Préparation de la carte…</span></div>
    </div>`;
  const voyage = root.getElementById('voyage');
  voyage.innerHTML = STEPS.map(stepArticle).join('');

  // « + N autres » : déplie les liens masqués.
  voyage.addEventListener('click', (e) => {
    const more = e.target.closest('.stop-more');
    if (!more) return;
    const list = more.closest('.stop-links');
    list.querySelectorAll('.is-extra').forEach((li) => (li.hidden = false));
    more.closest('li').remove();
    list.querySelector('.is-extra .stop-link')?.focus();
  });
  return [...voyage.querySelectorAll('.stop')];
}
