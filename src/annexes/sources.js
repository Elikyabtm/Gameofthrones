// Sources et crédits : sources générales, notes, crédits des armoiries (credits-svg.json),
// polices et bibliothèques, avertissement de site de fan (PROJET.md §1.4-1.5).
import { DISCLAIMER, GENERAL_SOURCES, loadSigilCredits, NOTES } from '../content/sources.js';
import { escapeHtml } from '../journey/render.js';

const link = (l) =>
  `<li><a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.label)} <span aria-hidden="true">↗</span></a></li>`;

export function renderSources(section) {
  section.innerHTML = `
    <header class="annexe-head">
      <p class="label">Annexe</p>
      <h2>Sources &amp; crédits</h2>
      <p class="annexe-lead">${escapeHtml(DISCLAIMER)}</p>
    </header>
    <div class="sources-grid">
      <div>
        <h3>L’univers</h3>
        <ul>${GENERAL_SOURCES.univers.map(link).join('')}</ul>
      </div>
      <div>
        <h3>Les langues</h3>
        <ul>${GENERAL_SOURCES.langues.map(link).join('')}</ul>
        <p>${escapeHtml(NOTES.langues)}</p>
      </div>
      <div>
        <h3>Les images</h3>
        ${NOTES.images.map((n) => `<p>${escapeHtml(n)}</p>`).join('')}
        <p>La carte, ses reliefs, ses forêts et ses maquettes de châteaux sont générés par le code de ce site.</p>
      </div>
    </div>
    <div class="sources-credits">
      <h3>Crédits des armoiries</h3>
      <ul class="sigil-credits"><li>Chargement des crédits…</li></ul>
      <p><a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">Licence CC BY-SA 3.0 <span aria-hidden="true">↗</span></a> · images reproduites sans modification du dessin.</p>
      <h3>Polices et bibliothèques</h3>
      <ul>
        <li>Cormorant Garamond et Manrope — SIL Open Font License 1.1, auto-hébergées.</li>
        <li>three.js — licence MIT.</li>
      </ul>
      <p class="sources-scope">${escapeHtml(NOTES.perimetre)}</p>
    </div>`;

  const list = section.querySelector('.sigil-credits');
  loadSigilCredits()
    .then((credits) => {
      list.innerHTML = credits
        .map(
          (c) =>
            `<li><a href="${c.page}" target="_blank" rel="noopener">Maison ${escapeHtml(c.house)}</a> — ${escapeHtml(
              c.author || 'auteur indiqué sur la page source',
            )} · ${escapeHtml(c.license)}</li>`,
        )
        .join('');
    })
    .catch(() => {
      list.innerHTML =
        '<li>Crédits consultables sur A Wiki of Ice and Fire (pages des fichiers).</li>';
    });
}
