// Aperçus en surimpression (§8.3) : un clic sur un nom ouvre un panneau latéral avec l'image,
// le nom, le résumé et trois faits, sans quitter la page. Filtré par saison comme le reste.
import journey from '../data/journey.json';
import { loadEntity, loadIndex } from '../core/content.js';
import { store } from '../core/store.js';
import { characterVisible, lastVisible, split } from '../core/spoilers.js';
import { esc, trapFocus } from './dom.js';
import { portrait, scene } from './media.js';

const panel = () => document.getElementById('preview');
let release = null;
let opener = null;

export function closePreview() {
  const el = panel();
  if (el.hidden) return;
  el.hidden = true;
  release?.();
  opener?.focus?.();
}

async function content(kind, slug, graph) {
  const season = store.season;
  if (kind === 'character') {
    const c = graph.chars.get(slug);
    if (!c || !characterVisible(c, season))
      return {
        title: 'Personnage à venir',
        text: 'Ce personnage apparaît dans une saison que vous n’avez pas encore choisie.',
        facts: [],
      };
    const st = lastVisible(c.status, season);
    return {
      media: portrait(c, { sigil: graph.houses.get(c.house)?.sigil, sizes: '420px' }),
      portrait: true,
      kicker: graph.houses.get(c.house)?.name ?? 'Sans maison',
      title: c.name,
      text: c.summary,
      facts: [
        ['Origine', graph.places.get(c.origin)?.name ?? '—'],
        ['Première saison', `Saison ${c.firstSeason}`],
        [
          'Statut',
          st
            ? {
                vivant: 'Vivant',
                mort: 'Mort',
                inconnu: 'Sort inconnu',
                ressuscite: 'Revenu à la vie',
              }[st.value]
            : '—',
        ],
      ],
      href: `/personnages/${slug}`,
      cta: 'Ouvrir la fiche',
    };
  }
  if (kind === 'house') {
    const h = graph.houses.get(slug);
    return {
      media: `<img src="/${h.sigil}" alt="" class="preview-sigil" />`,
      kicker: h.region,
      title: h.name,
      text: h.summary ?? '',
      facts: [
        ['Devise', `« ${h.words} »`],
        ['Siège', graph.places.get(h.seat)?.name ?? '—'],
        ['Membres', String(graph.membersOf(slug, season).length)],
      ],
      href: `/maisons/${slug}`,
      cta: 'Ouvrir la page de la maison',
    };
  }
  if (kind === 'codex') {
    const e = graph.codex.get(slug);
    const full = await loadEntity('codex', slug);
    return {
      media: scene(e.image, e.name, { sizes: '420px', alt: '' }),
      kicker: e.kicker,
      title: e.name,
      text: e.lead,
      facts: (full?.facts ?? []).slice(0, 3).map((f) => [f.label, f.value]),
      href: `/codex/${e.rubric}/${slug}`,
      cta: 'Ouvrir l’entrée',
    };
  }
  // Lieu : pas de page dédiée, l'aperçu renvoie vers l'étape de la carte qui le montre.
  const p = graph.places.get(slug);
  const full = await loadEntity('places', slug);
  const step =
    journey.steps.find((s) => s.place === slug) ??
    journey.steps.find((s) => s.links.includes(slug));
  const events = split(full?.events ?? [], season).items;
  return {
    media: scene(p.image, p.name, { sizes: '420px', alt: '' }),
    kicker: `${p.region} · ${p.continent === 'essos' ? 'Essos' : 'Westeros'}`,
    title: p.name,
    text: p.summary ?? full?.description?.[0] ?? '',
    facts: [
      ['Nature', p.kind],
      ['Maison', graph.houses.get(p.house)?.name ?? '—'],
      ['Dernier événement vu', events.at(-1)?.text ?? '—'],
    ],
    href: step ? `/carte/${step.slug}` : null,
    cta: 'Voir sur la carte',
  };
}

export async function openPreview(kind, slug, from) {
  const { graph } = await loadIndex();
  const c = await content(kind, slug, graph);
  const el = panel();
  opener = from ?? document.activeElement;
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'false');
  el.setAttribute('aria-labelledby', 'preview-title');
  el.innerHTML = `
    <button type="button" class="preview-close icon-btn" aria-label="Fermer l’aperçu">×</button>
    <p class="label label-accent">${esc(c.kicker ?? '')}</p>
    ${c.media ? `<div class="preview-media${c.portrait ? ' is-portrait' : ''}">${c.media}</div>` : ''}
    <h2 id="preview-title">${esc(c.title)}</h2>
    <p>${esc(c.text)}</p>
    ${c.facts.length ? `<dl class="preview-facts">${c.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    ${c.href ? `<a class="btn btn-accent" href="${c.href}">${esc(c.cta)}</a>` : ''}`;
  el.hidden = false;
  release?.();
  release = trapFocus(el, closePreview);
  el.querySelector('.preview-close').focus();
}

document.addEventListener('click', (e) => {
  const el = panel();
  if (!el || el.hidden) return;
  if (e.target.closest('.preview-close')) return closePreview();
  if (e.target.closest('#preview a[href]')) return closePreview();
  if (!el.contains(e.target) && !e.target.closest('[data-preview]')) closePreview();
});
