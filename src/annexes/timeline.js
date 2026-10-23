// Chronologie : les grandes périodes, de l'Âge des Héros au début de la série.
import eras from '../content/eras.js';
import { escapeHtml } from '../journey/render.js';

export function renderTimeline(section) {
  section.innerHTML = `
    <header class="annexe-head">
      <p class="label">Annexe</p>
      <h2>Chronologie</h2>
      <p class="annexe-lead">Quatre moments pour situer le récit dans une histoire beaucoup plus longue.</p>
    </header>
    <ol class="timeline">${[...eras]
      .sort((a, b) => a.order - b.order)
      .map(
        (e, i) => `<li class="timeline-item">
          <span class="timeline-mark" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <div>
            <p class="label">${escapeHtml(e.kicker)}</p>
            <h3>${escapeHtml(e.title)}</h3>
            ${e.body.map((p) => `<p>${escapeHtml(p)}</p>`).join('')}
          </div>
        </li>`,
      )
      .join('')}</ol>`;
}
