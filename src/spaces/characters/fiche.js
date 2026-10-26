// Fiche personnage (§7.2) : portrait plein cadre à droite, colonne de texte à gauche,
// onglets Biographie · Liens · Lieux. Tout est filtré par saison AVANT le rendu (§9).
import { stepForPlace } from '../../core/places.js';
import { esc, footer, ornament } from '../../ui/dom.js';
import { portrait } from '../../ui/media.js';
import { characterVisible, filterCharacter, lastVisible } from '../../core/spoilers.js';
import { createLinker } from '../../ui/linkify.js';
import { renderLinks } from './graph-view.js';

const STATUS = {
  vivant: 'Vivant',
  mort: 'Mort',
  inconnu: 'Sort inconnu',
  ressuscite: 'Revenu à la vie',
};
const TABS = [
  { id: '', label: 'Biographie' },
  { id: 'liens', label: 'Liens' },
  { id: 'lieux', label: 'Lieux' },
];
const seasonsText = (list) =>
  list.length === 1
    ? `Saison ${list[0]}`
    : `Saisons ${list.slice(0, -1).join(', ')} et ${list.at(-1)}`;

function identity(c, graph, season) {
  const house = graph.houses.get(c.house);
  const origin = graph.places.get(c.origin);
  const st = c.status;
  const rows = [
    ['Maison', house ? `<a href="/maisons/${house.slug}">${esc(house.name)}</a>` : 'Aucune'],
    c.titles.length ? ['Titres', c.titles.map((t) => esc(t.text)).join(' · ')] : null,
    origin
      ? [
          'Origine',
          `<a href="/carte" data-preview data-kind="place" data-slug="${origin.slug}">${esc(origin.name)}</a>`,
        ]
      : null,
    c.allegiances.length
      ? [
          'Allégeance',
          c.allegiances.map((a) => esc(graph.houses.get(a.to)?.name ?? a.to)).join(' · '),
        ]
      : null,
    st
      ? [
          `Statut · saison ${season}`,
          `<span class="status status-${st.value}">${esc(STATUS[st.value])}</span>${st.note ? `<span class="status-note">${esc(st.note)}</span>` : ''}`,
        ]
      : null,
    ['Première saison', `Saison ${c.firstSeason}`],
    c.actor ? ['Interprète', esc(c.actor)] : null,
  ].filter(Boolean);
  return `<dl class="identity">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

function bioTab(c, link) {
  const blocks = c.bio
    .map(
      (b) =>
        `<section class="bio-block"><h3>${esc(b.title ?? `Saison ${b.s}`)}</h3>${b.paragraphs
          .map((p) => `<p>${link(p, c.slug)}</p>`)
          .join('')}</section>`,
    )
    .join('');
  const masked = c.bioHidden
    ? `<p class="masked">La suite de son histoire est masquée. <button type="button" class="link-btn" data-open-season>Changer de saison</button></p>`
    : '';
  const moments = c.keyMoments.length
    ? `<section class="moments"><h2 class="section-title">Moments clés</h2><ol class="moments-list">${c.keyMoments
        .map(
          (m) =>
            `<li><span class="moment-season label">Saison ${m.s}</span><h3>${esc(m.title)}</h3><p>${link(m.text, c.slug)}</p></li>`,
        )
        .join('')}</ol></section>`
    : '';
  const books = c.booksVsShow
    ? `<aside class="books"><h2 class="section-title">Livres et série</h2>${c.booksVsShow.paragraphs
        .map((p) => `<p>${esc(p)}</p>`)
        .join('')}</aside>`
    : '';
  const sources = c.sources.length
    ? `<section class="further"><h2 class="section-title">Pour aller plus loin</h2><ul>${c.sources
        .map(
          (s) =>
            `<li><a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank">${esc(s.label)}</a></li>`,
        )
        .join('')}</ul></section>`
    : '';
  return `${blocks}${masked}${moments}${books}${sources}`;
}

function placesTab(c, graph) {
  if (!c.places.length) return '<p>Aucun lieu connu à cette saison.</p>';
  return `<ul class="places-list">${c.places
    .map((p) => {
      const pl = graph.places.get(p.place);
      if (!pl) return '';
      const step = stepForPlace(p.place);
      return `<li class="place-row">
        <div><h3>${esc(pl.name)}</h3><p class="label">${esc(pl.region)} · ${seasonsText(p.seasons)}</p>${pl.summary ? `<p>${esc(pl.summary)}</p>` : ''}</div>
        <div class="place-actions">
          ${step ? `<a class="btn" href="/carte/${step.slug}">Voir sur la carte</a>` : ''}
          <a class="btn" href="/carte" data-preview data-kind="place" data-slug="${pl.slug}">Aperçu</a>
        </div>
      </li>`;
    })
    .join('')}</ul>`;
}

/**
 * Rend la fiche. `full` : JSON complet du personnage ; `data` : { index, graph }.
 * Renvoie les infos utiles à l'espace (lieu à survoler pour le monde).
 */
export function renderFiche(root, { full, tab, season, data, order, query }) {
  const { graph } = data;
  const base = graph.chars.get(full.slug);
  const visibleNow = characterVisible(full, season);
  const c = filterCharacter(full, season, (s) => {
    const o = graph.chars.get(s);
    return o && characterVisible(o, season);
  });
  const house = graph.houses.get(c.house);
  const back = `/personnages${query ?? ''}`;
  const link = createLinker(graph, season);

  let panel;
  if (!visibleNow) {
    panel = `<p class="masked">Ce personnage apparaît à partir de la saison ${full.firstSeason}. Sa fiche est masquée pour ne rien vous révéler. <button type="button" class="link-btn" data-open-season>Changer de saison</button></p>`;
  } else if (tab === 'liens') {
    const rels = graph.relationsOf(c.slug, season);
    panel = renderLinks(base, rels.items, graph.chars, { count: rels.hidden, next: rels.next });
  } else if (tab === 'lieux') panel = placesTab(c, graph);
  else panel = bioTab(c, link);

  const idx = order.indexOf(c.slug);
  root.innerHTML = `
  <article class="fiche" aria-labelledby="fiche-name">
    <div class="fiche-media">
      ${visibleNow ? portrait(base, { sigil: house?.sigil, sizes: '(max-width: 700px) 100vw, 58vw', eager: true }) : ''}
      <div class="fiche-media-shade"></div>
      <nav class="fiche-tabs" aria-label="Sections de la fiche">${TABS.map(
        (t) =>
          `<a href="/personnages/${c.slug}${t.id ? `/${t.id}` : ''}" ${(tab ?? '') === t.id ? 'aria-current="page"' : ''}>${t.label}</a>`,
      ).join('<span class="dot" aria-hidden="true">·</span>')}</nav>
      ${visibleNow && c.quote ? `<blockquote class="fiche-quote"><p>« ${esc(c.quote.text)} »</p><cite>${esc(c.name)}</cite></blockquote>` : ''}
    </div>
    <div class="fiche-body">
      <a class="back" href="${back}">${ornament('arrow-left')}<span>Retour</span></a>
      <header class="fiche-head">
        ${house ? `<img class="fiche-sigil" src="/${house.sigil}" alt="" width="36" height="36" />` : ''}
        <h1 id="fiche-name">${esc(c.name)}</h1>
      </header>
      ${visibleNow ? `${identity(c, graph, season)}<p class="fiche-summary">${link(c.summary, c.slug)}</p>` : ''}
      <div class="fiche-panel" data-tab="${tab || 'bio'}">${panel}</div>
      ${footer()}
    </div>
  </article>`;

  const last = visibleNow
    ? [...c.places].sort((a, b) => Math.max(...b.seasons) - Math.max(...a.seasons))[0]?.place
    : full.origin;
  return {
    name: c.name,
    summary: c.summary,
    place: last,
    prev: idx > 0 ? graph.chars.get(order[idx - 1]) : null,
    next: idx >= 0 && idx < order.length - 1 ? graph.chars.get(order[idx + 1]) : null,
    pos: idx,
    status: lastVisible(full.status, season)?.value,
  };
}
