// Espace Maisons (§7.3) : liste des blasons, page de chaque maison, arbre par maison et
// vue « Toutes les lignées ».
import './houses.css';
import { loadEntity, loadIndex } from '../../core/content.js';
import { split } from '../../core/spoilers.js';
import { esc, footer, hydrateOrnaments } from '../../ui/dom.js';
import { portrait } from '../../ui/media.js';
import { createLinker } from '../../ui/linkify.js';
import { renderHouseTree } from './tree.js';
import { placeCoords, placeLight, stepForPlace } from '../../core/places.js';

function listView(root, { index, graph }, ctx) {
  root.innerHTML = `
  <section class="page houses" aria-labelledby="houses-title">
    <header class="page-head">
      <p class="label label-accent">Les grandes familles</p>
      <h1 id="houses-title">Maisons</h1>
      <p class="page-lead">Des devises, des sièges, des alliances et des rancunes. Survolez un blason pour lire sa devise.</p>
    </header>
    <ul class="sigil-row">${index.houses
      .map(
        (h) => `<li><a class="sigil-card" href="/maisons/${h.slug}">
          <img src="/${h.sigil}" alt="" width="200" height="200" />
          <span class="sigil-name">${esc(h.name)}</span>
          <span class="sigil-words">« ${esc(h.words)} »</span>
          <span class="sigil-seat label">${esc(graph.places.get(h.seat)?.name ?? '')}</span>
        </a></li>`,
      )
      .join('')}</ul>
    <p class="lineages-link"><a href="/maisons/toutes-les-lignees">Toutes les lignées</a></p>
    ${footer()}
  </section>`;
  ctx.setMeta(
    'Maisons',
    'Les grandes maisons de Westeros : devises, sièges, histoire et arbres généalogiques.',
  );
  ctx.chrome.setBar({ title: 'Maisons', count: `${index.houses.length}` });
}

function pageView(root, house, data, ctx) {
  const { index, graph } = data;
  const season = ctx.store.season;
  const link = createLinker(graph, season);
  const seat = graph.places.get(house.seat);
  const step = stepForPlace(house.seat);
  const overlord = split(house.overlord ?? [], season).items.at(-1);
  const members = graph.membersOf(house.slug, season);
  const series = split(house.inTheSeries ?? [], season);
  const i = index.houses.findIndex((h) => h.slug === house.slug);
  const prev = index.houses[i - 1];
  const next = index.houses[i + 1];
  root.innerHTML = `
  <article class="page house-page" aria-labelledby="house-title">
    <header class="house-banner">
      <img class="house-sigil" src="/${house.sigil}" alt="Blason : ${esc(house.sigilDescription ?? house.name)}" width="220" height="220" />
      <div>
        <p class="label label-accent">${esc(house.region)}</p>
        <h1 id="house-title">${esc(house.name)}</h1>
        <p class="house-words">« ${esc(house.words)} »</p>
        <dl class="house-facts">
          <div><dt>Siège</dt><dd>${seat ? (step ? `<a href="/carte/${step.slug}">${esc(seat.name)}</a>` : esc(seat.name)) : '—'}</dd></div>
          <div><dt>Région</dt><dd>${esc(house.region)}</dd></div>
          <div><dt>Suzerain</dt><dd>${overlord ? `<a href="/maisons/${overlord.to}">${esc(graph.houses.get(overlord.to)?.name ?? overlord.to)}</a>` : 'Aucun'}</dd></div>
          ${house.founded ? `<div><dt>Fondation</dt><dd>${esc(house.founded)}</dd></div>` : ''}
        </dl>
      </div>
    </header>
    <div class="house-columns">
      <section class="house-history">
        <h2 class="section-title">Histoire</h2>
        ${house.history.map((p) => `<p>${link(p, house.slug)}</p>`).join('')}
        ${house.figures?.length ? `<h3 class="label">Figures historiques</h3><p class="figures">${house.figures.map(esc).join(' · ')}</p>` : ''}
      </section>
      <section class="house-series">
        <h2 class="section-title">Dans la série</h2>
        ${series.items
          .map(
            (b) =>
              `<div class="bio-block"><h3>${esc(b.title ?? `Saison ${b.s}`)}</h3>${b.paragraphs.map((p) => `<p>${link(p, house.slug)}</p>`).join('')}</div>`,
          )
          .join('')}
        ${series.hidden ? `<p class="masked">La suite est masquée à votre saison. <button type="button" class="link-btn" data-open-season>Changer de saison</button></p>` : ''}
      </section>
    </div>
    ${
      members.length
        ? `<section class="house-members" aria-labelledby="members-title"><h2 id="members-title" class="section-title">Membres</h2><ul class="members-row">${members
            .map(
              (c) =>
                `<li><a class="who-card" href="/personnages/${c.slug}"><span class="who-portrait">${portrait(
                  c,
                  {
                    sigil: house.sigil,
                    sizes: '90px',
                    alt: '',
                  },
                )}</span><span class="who-name">${esc(c.short ?? c.name)}</span></a></li>`,
            )
            .join('')}</ul></section>`
        : ''
    }
    ${
      house.vassals?.length
        ? `<section><h2 class="section-title">Vassaux</h2><ul class="vassals">${house.vassals
            .map((v) => {
              const h = graph.houses.get(v);
              return h
                ? `<li><a href="/maisons/${h.slug}"><img src="/${h.sigil}" alt="" width="40" height="40" />${esc(h.name)}</a></li>`
                : `<li>${esc(v)}</li>`;
            })
            .join('')}</ul></section>`
        : ''
    }
    <section id="arbre" class="house-tree" aria-labelledby="tree-title">
      <h2 id="tree-title" class="section-title">Arbre de la maison</h2>
      <div class="tree-host"></div>
    </section>
    ${house.sources?.length ? `<section class="further"><h2 class="section-title">Pour aller plus loin</h2><ul>${house.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ul></section>` : ''}
    ${house.sigilCredit ? `<p class="credit">Blason : ${esc(house.sigilCredit)}</p>` : ''}
    ${footer()}
  </article>`;
  renderHouseTree(root.querySelector('.tree-host'), house, graph, season, {
    onHouse: (slug) => ctx.navigate(`/maisons/${slug}#arbre`),
  });
  ctx.setMeta(
    house.name,
    `${house.name} : « ${house.words} ». Histoire, membres et arbre généalogique.`,
  );
  ctx.chrome.setBar({
    prev: prev ? { href: `/maisons/${prev.slug}`, label: prev.name } : null,
    title: house.name,
    next: next ? { href: `/maisons/${next.slug}`, label: next.name } : null,
    count: `${String(i + 1).padStart(2, '0')} / ${index.houses.length}`,
  });
  const coords = placeCoords(graph, house.seat);
  if (coords) ctx.world?.setMode('ambient', { place: coords, light: placeLight(house.seat) });
}

async function lineagesView(root, data, ctx) {
  const season = ctx.store.season;
  const houses = (
    await Promise.all(data.index.houses.map((h) => loadEntity('houses', h.slug)))
  ).filter((h) => h?.tree);
  root.innerHTML = `
  <section class="page lineages" aria-labelledby="lin-title">
    <header class="page-head"><p class="label label-accent">Pour les curieux</p><h1 id="lin-title">Toutes les lignées</h1></header>
    ${houses.map((h) => `<section class="house-tree"><h2 class="section-title"><a href="/maisons/${h.slug}">${esc(h.name)}</a></h2><div class="tree-host" data-house="${h.slug}"></div></section>`).join('')}
    ${footer()}
  </section>`;
  for (const h of houses)
    renderHouseTree(root.querySelector(`[data-house="${h.slug}"]`), h, data.graph, season, {
      onHouse: (slug) => ctx.navigate(`/maisons/${slug}#arbre`),
    });
  ctx.setMeta('Toutes les lignées');
  ctx.chrome.setBar({ title: 'Toutes les lignées' });
}

export async function mount(root, route, ctx) {
  const data = await loadIndex();
  root.classList.add('space-houses');
  const onClick = (e) => e.target.closest('[data-open-season]') && ctx.picker.open();
  root.addEventListener('click', onClick);
  let current = route;
  async function show(r) {
    if (r.view === 'list') listView(root, data, ctx);
    else if (r.view === 'lineages') await lineagesView(root, data, ctx);
    else {
      const house = await loadEntity('houses', r.params.slug);
      if (!house) return (await import('../notfound.js')).mount(root, r, ctx);
      pageView(root, house, data, ctx);
      if (r.hash === '#arbre')
        requestAnimationFrame(() => root.querySelector('#arbre')?.scrollIntoView());
    }
    hydrateOrnaments(root);
    if (r.view !== 'page') ctx.world?.setMode('ambient', { place: { x: 420, y: 640 } });
  }
  await show(route);
  return {
    async update(r) {
      const samePage = current.view === r.view && current.params.slug === r.params.slug;
      current = r;
      await show(r);
      if (!samePage && r.hash !== '#arbre') scrollTo(0, 0);
    },
    refresh: () => show(current),
    unmount() {
      root.removeEventListener('click', onClick);
      root.classList.remove('space-houses');
    },
  };
}
