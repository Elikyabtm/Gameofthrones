// Modale des fiches : openArchive(type, id) (PROJET.md §6). Une seule <dialog> pour tous
// les types. Ordre : image, surtitre, titre, accroche, paragraphes, faits, termes, source.
import { getFiche, TYPE_LABELS } from '../content/index.js';
import { escapeHtml } from '../journey/render.js';

let dialog;
let opener = null;

export function initArchive() {
  dialog = document.getElementById('archive');
  dialog.addEventListener('click', (e) => {
    // Clic sur le fond (hors du contenu) ou sur le bouton de fermeture.
    if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('has-modal');
    opener?.focus();
    opener = null;
  });
  // Délégation : tout bouton [data-archive="type:id"] ouvre la fiche.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-archive]');
    if (!btn) return;
    const [type, id] = btn.dataset.archive.split(':');
    openArchive(type, id, btn);
  });
}

export function openArchive(type, id, from = document.activeElement) {
  const f = getFiche(type, id);
  opener = from;
  const facts = f.facts?.length
    ? `<dl class="archive-facts">${f.facts
        .map((x) => `<div><dt>${escapeHtml(x.label)}</dt><dd>${escapeHtml(x.value)}</dd></div>`)
        .join('')}</dl>`
    : '';
  const terms = f.terms?.length
    ? `<h3 class="archive-sub">Repères</h3><ul class="archive-terms">${f.terms
        .map((t) => `<li>${escapeHtml(t)}</li>`)
        .join('')}</ul>`
    : '';
  const source = f.source
    ? `<p class="archive-source"><a href="${f.source.url}" target="_blank" rel="noopener">Source : ${escapeHtml(
        f.source.label,
      )} <span aria-hidden="true">↗</span></a></p>`
    : '';
  const image = f.image
    ? `<figure class="archive-figure"><img src="${f.image}" alt="" decoding="async" /></figure>`
    : '';
  const sigil = f.sigil
    ? `<img class="archive-sigil" src="${f.sigil}" alt="Armoiries : ${escapeHtml(f.title)}" width="64" height="64" />`
    : '';
  dialog.querySelector('.archive-body').innerHTML = `
    ${image}
    <div class="archive-text">
      <p class="label archive-kicker">${escapeHtml(f.kicker || TYPE_LABELS[type])}</p>
      <div class="archive-head">${sigil}<h2 id="archive-title">${escapeHtml(f.title)}</h2></div>
      ${f.lead ? `<p class="archive-lead">${escapeHtml(f.lead)}</p>` : ''}
      ${f.body.map((p) => `<p class="archive-p">${escapeHtml(p)}</p>`).join('')}
      ${facts}${terms}${source}
    </div>`;
  dialog.scrollTop = 0;
  document.documentElement.classList.add('has-modal');
  dialog.showModal();
  dialog.querySelector('[data-close]').focus();
}
