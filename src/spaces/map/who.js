// « Qui vit ici » (§6.1) : portraits filtrés par saison, dans l'ordre de l'étape,
// et ligne de liens vers les maisons, le Codex et les lieux.
import { loadIndex } from '../../core/content.js';
import { esc } from '../../ui/dom.js';
import { portrait } from '../../ui/media.js';
import { STEPS } from './render.js';

/** URL et attributs d'aperçu d'une entité, selon son type. */
export function entityLink(graph, slug) {
  const kind = graph.kindOf(slug);
  if (kind === 'house')
    return { href: `/maisons/${slug}`, name: graph.houses.get(slug).name, kind };
  if (kind === 'codex') {
    const e = graph.codex.get(slug);
    return { href: `/codex/${e.rubric}/${slug}`, name: e.name, kind };
  }
  if (kind === 'character')
    return { href: `/personnages/${slug}`, name: graph.chars.get(slug).name, kind };
  if (kind === 'place')
    return { href: `/carte`, name: graph.places.get(slug).name, kind, preview: true };
  return null;
}

export async function renderWho(root, season) {
  const { graph } = await loadIndex();
  root.querySelectorAll('.who-list').forEach((ul) => {
    const step = STEPS[Number(ul.dataset.step)];
    const people = graph.residents(step.place, season, step.characters, { origin: true });
    const section = ul.closest('.who');
    section.hidden = !people.length;
    ul.classList.toggle('is-scrolling', people.length > 8);
    ul.innerHTML = people
      .map((c) => {
        const sigil = graph.houses.get(c.house)?.sigil;
        return `<li><a class="who-card" href="/personnages/${c.slug}" data-summary="${esc(c.summary)}">
          <span class="who-portrait">${portrait(c, { sigil, sizes: '90px', alt: '' })}</span>
          <span class="who-name">${esc(c.short ?? c.name)}</span>
        </a></li>`;
      })
      .join('');
  });
  root.querySelectorAll('.step-links').forEach((nav) => {
    const step = STEPS[Number(nav.dataset.step)];
    nav.innerHTML = step.links
      .map((slug) => {
        const l = entityLink(graph, slug);
        if (!l) return '';
        return l.preview
          ? `<a href="/carte/${step.slug}" data-preview data-kind="place" data-slug="${slug}">${esc(l.name)}</a>`
          : `<a href="${l.href}">${esc(l.name)}</a>`;
      })
      .join('<span class="sep" aria-hidden="true">·</span>');
  });
}

/** Survol d'un portrait : il s'éclaire et un résumé d'une ligne apparaît. */
export function bindWhoHover(root) {
  const show = (e) => {
    const card = e.target.closest('.who-card');
    if (!card) return;
    const out = card.closest('.who').querySelector('.who-summary');
    out.textContent = e.type === 'pointerover' || e.type === 'focusin' ? card.dataset.summary : '';
  };
  root.addEventListener('pointerover', show);
  root.addEventListener('pointerout', show);
  root.addEventListener('focusin', show);
  root.addEventListener('focusout', show);
}
