// Index de toutes les fiches : recherche plein texte et filtres par étiquette (tags).
import { allFiches, TYPE_LABELS } from '../content/index.js';
import { escapeHtml } from '../journey/render.js';
import { TYPE_ICONS } from '../ui/icons.js';

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function renderIndex(section) {
  const fiches = allFiches();
  const tags = [...new Set(fiches.flatMap((f) => f.tags ?? []))];
  section.innerHTML = `
    <header class="annexe-head">
      <p class="label">Annexe</p>
      <h2>Toutes les fiches</h2>
      <p class="annexe-lead">${fiches.length} fiches : peuples, armées et ordres, maisons, langues, croyances, créatures et lieux.</p>
    </header>
    <div class="index-tools">
      <label class="index-search"><span>Rechercher une fiche</span><input type="search" placeholder="Dothraki, Hautjardin, dragons…" autocomplete="off" /></label>
      <div class="index-filters" role="group" aria-label="Filtrer par catégorie">
        <button type="button" data-tag="" aria-pressed="true">Tout</button>
        ${tags.map((t) => `<button type="button" data-tag="${escapeHtml(t)}" aria-pressed="false">${escapeHtml(t)}</button>`).join('')}
      </div>
      <p class="index-count" aria-live="polite"></p>
    </div>
    <ul class="index-grid">${fiches
      .map(
        (f) => `<li data-tags="${escapeHtml((f.tags ?? []).join('|'))}" data-text="${escapeHtml(
          norm(`${f.title} ${f.kicker} ${f.body.join(' ')}`),
        )}">
        <button type="button" class="index-card" data-archive="${f.type}:${f.id}">
          ${f.image ? `<img src="${f.image}" alt="" loading="lazy" decoding="async" width="320" height="180" />` : `<span class="index-noimg">${TYPE_ICONS[f.type]}</span>`}
          <span class="index-kicker">${escapeHtml(f.type === 'group' ? f.tags[0] : TYPE_LABELS[f.type])}</span>
          <span class="index-title">${escapeHtml(f.title)}</span>
          <span class="index-sub">${escapeHtml(f.kicker)}</span>
        </button>
      </li>`,
      )
      .join('')}</ul>`;

  const items = [...section.querySelectorAll('.index-grid li')];
  const count = section.querySelector('.index-count');
  let tag = '';
  let query = '';
  function filter() {
    let n = 0;
    for (const li of items) {
      const ok =
        (!tag || li.dataset.tags.split('|').includes(tag)) &&
        (!query || li.dataset.text.includes(query));
      li.hidden = !ok;
      if (ok) n++;
    }
    count.textContent = `${n} fiche${n > 1 ? 's' : ''}`;
  }
  section.querySelector('.index-filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tag]');
    if (!b) return;
    tag = b.dataset.tag;
    section
      .querySelectorAll('[data-tag]')
      .forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    filter();
  });
  section.querySelector('.index-search input').addEventListener('input', (e) => {
    query = norm(e.target.value.trim());
    filter();
  });
  filter();
}
