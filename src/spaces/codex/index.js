// Espace Codex (§8.1) : 5 portes, rubriques (introduction, 2 entrées mises en avant, grille)
// et entrées (image à droite, texte à gauche, faits, lexique, lieux et personnages liés).
import './codex.css';
import { loadEntity, loadIndex, RUBRICS } from '../../core/content.js';
import { characterVisible, split } from '../../core/spoilers.js';
import { placeCoords, placeLight, stepForPlace } from '../../core/places.js';
import { esc, footer, hydrateOrnaments, ornament } from '../../ui/dom.js';
import { portrait, scene } from '../../ui/media.js';
import { createLinker } from '../../ui/linkify.js';

export const RUBRIC_INTRO = {
  peuples: [
    'Avant les rois et les maisons, il y a des peuples : ceux qui sont arrivés les premiers, ceux qui ont traversé la mer, ceux qui ont bâti des empires et ceux qui les ont fuis. Leurs migrations expliquent les langues, les dieux et les rancunes de tout un monde.',
    'Cette rubrique réunit aussi les grandes époques qui servent de repères aux chroniqueurs.',
  ],
  ordres: [
    'Certains hommes et femmes ne se définissent ni par leur sang ni par leur terre, mais par un serment. Gardes, mestres, mercenaires, soldats-esclaves ou assassins : chaque ordre a ses règles, ses vœux et sa manière de survivre aux rois.',
  ],
  croyances: [
    'Arbres au visage sculpté, septuors aux sept autels, feux nocturnes, prières noyées : on ne prie pas les mêmes dieux d’une rive à l’autre de la mer Étroite. Ces croyances façonnent les lois, les mariages et les guerres autant que les âmes.',
  ],
  langues: [
    'La langue commune permet de traverser Westeros, mais il suffit de franchir la mer pour que tout change. Ces langues racontent l’histoire de ceux qui les parlent : conquêtes, exils et mélanges.',
  ],
  creatures: [
    'Dragons, loups géants, géants et choses plus anciennes encore : au début de l’histoire, la plupart des gens du Sud les croient disparus ou imaginaires. Ils se trompent.',
  ],
};

const rubricOf = (slug) => RUBRICS.find((r) => r.slug === slug);

function homeView(root, { index }, ctx) {
  root.innerHTML = `
  <section class="page codex-home" aria-labelledby="codex-title">
    <header class="page-head"><p class="label label-accent">Le savoir des mestres</p><h1 id="codex-title">Codex</h1></header>
    <ul class="codex-doors">${RUBRICS.map((r) => {
      const n = index.codex.filter((e) => e.rubric === r.slug).length;
      return `<li><a class="codex-door" href="/codex/${r.slug}">
        ${scene(r.image, r.name, { alt: '', sizes: '(max-width: 700px) 100vw, 20vw', cls: 'door-img' })}
        <span class="door-label">${esc(r.name)}</span>
        <span class="label">${n} entrée${n > 1 ? 's' : ''}</span>
      </a></li>`;
    }).join('')}</ul>
    ${footer()}
  </section>`;
  ctx.setMeta(
    'Codex',
    'Peuples, ordres, croyances, langues et créatures du monde de Game of Thrones.',
  );
  ctx.chrome.setBar({ title: 'Codex', count: `${index.codex.length}` });
}

function rubricView(root, rubric, { index }, ctx) {
  const entries = index.codex.filter((e) => e.rubric === rubric.slug);
  const featured = [
    ...entries.filter((e) => e.featured),
    ...entries.filter((e) => !e.featured),
  ].slice(0, 2);
  const rest = entries.filter((e) => !featured.includes(e));
  const card = (
    e,
    big,
  ) => `<li><a class="codex-card${big ? ' is-big' : ''}" href="/codex/${rubric.slug}/${e.slug}">
      <span class="codex-card-media">${scene(e.image, e.name, { alt: '', sizes: big ? '(max-width: 700px) 100vw, 50vw' : '280px' })}</span>
      <span class="label">${esc(e.kicker)}</span>
      <span class="codex-card-name">${esc(e.name)}</span>
      ${big ? `<span class="codex-card-lead">${esc(e.lead)}</span>` : ''}
    </a></li>`;
  root.innerHTML = `
  <section class="page codex-rubric" aria-labelledby="rubric-title">
    <a class="back" href="/codex">${ornament('arrow-left')}<span>Codex</span></a>
    <header class="page-head"><h1 id="rubric-title">${esc(rubric.name)}</h1>${RUBRIC_INTRO[
      rubric.slug
    ]
      .map((p) => `<p class="page-lead">${esc(p)}</p>`)
      .join('')}</header>
    <ul class="codex-featured">${featured.map((e) => card(e, true)).join('')}</ul>
    <ul class="codex-grid">${rest.map((e) => card(e, false)).join('')}</ul>
    ${footer()}
  </section>`;
  const i = RUBRICS.indexOf(rubric);
  ctx.setMeta(rubric.name, RUBRIC_INTRO[rubric.slug][0]);
  ctx.chrome.setBar({
    prev: RUBRICS[i - 1]
      ? { href: `/codex/${RUBRICS[i - 1].slug}`, label: RUBRICS[i - 1].name }
      : null,
    title: rubric.name,
    next: RUBRICS[i + 1]
      ? { href: `/codex/${RUBRICS[i + 1].slug}`, label: RUBRICS[i + 1].name }
      : null,
    count: `${entries.length} entrées`,
  });
}

function entryView(root, e, rubric, data, ctx) {
  const { index, graph } = data;
  const season = ctx.store.season;
  const link = createLinker(graph, season);
  const chars = graph.charactersOfCodex(e.slug, season);
  const hiddenChars = [...new Set([...(e.characters ?? [])])].filter((s) => {
    const c = graph.chars.get(s);
    return c && !characterVisible(c, season);
  }).length;
  const series = split(e.inTheSeries ?? [], season);
  const siblings = index.codex.filter((x) => x.rubric === rubric.slug);
  const i = siblings.findIndex((x) => x.slug === e.slug);
  root.innerHTML = `
  <article class="codex-entry" aria-labelledby="entry-title">
    <div class="fiche-media codex-media">${scene(e.image, e.name, { alt: e.image ? `Illustration : ${e.name}` : undefined, sizes: '(max-width: 700px) 100vw, 58vw', eager: true })}<div class="fiche-media-shade"></div></div>
    <div class="fiche-body">
      <a class="back" href="/codex/${rubric.slug}">${ornament('arrow-left')}<span>${esc(rubric.name)}</span></a>
      <p class="label label-accent entry-kicker">${esc(e.kicker)}</p>
      <h1 id="entry-title" class="entry-title">${esc(e.name)}</h1>
      <p class="fiche-summary">${link(e.lead, e.slug)}</p>
      <div class="entry-body">${e.body.map((p) => `<p>${link(p, e.slug)}</p>`).join('')}</div>
      ${
        series.items.length || series.hidden
          ? `<h2 class="section-title">Dans la série</h2>${series.items
              .map(
                (b) =>
                  `<div class="bio-block"><h3>${esc(b.title ?? `Saison ${b.s}`)}</h3>${b.paragraphs.map((p) => `<p>${link(p, e.slug)}</p>`).join('')}</div>`,
              )
              .join('')}${series.hidden ? `<p class="masked">${series.hidden} passage${series.hidden > 1 ? 's' : ''} masqué${series.hidden > 1 ? 's' : ''} · saison ${series.next ?? ''}</p>` : ''}`
          : ''
      }
      ${e.facts?.length ? `<h2 class="section-title">Repères</h2><dl class="identity">${e.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : ''}
      ${e.terms?.length ? `<h2 class="section-title">Lexique</h2><dl class="lexicon">${e.terms.map((t) => `<div><dt>${esc(t.term)}</dt><dd>${esc(t.def)}</dd></div>`).join('')}</dl>` : ''}
      ${
        e.places?.length
          ? `<h2 class="section-title">Lieux</h2><ul class="entry-places">${e.places
              .map((s) => {
                const p = graph.places.get(s);
                const step = stepForPlace(s);
                return p
                  ? `<li><span>${esc(p.name)}</span>${step ? `<a class="btn" href="/carte/${step.slug}">Voir sur la carte</a>` : `<a class="btn" href="/carte" data-preview data-kind="place" data-slug="${s}">Aperçu</a>`}</li>`
                  : '';
              })
              .join('')}</ul>`
          : ''
      }
      ${
        chars.length
          ? `<h2 class="section-title">Personnages liés</h2><ul class="members-row">${chars
              .map(
                (c) =>
                  `<li><a class="who-card" href="/personnages/${c.slug}"><span class="who-portrait">${portrait(c, { sigil: graph.houses.get(c.house)?.sigil, sizes: '90px', alt: '' })}</span><span class="who-name">${esc(c.short ?? c.name)}</span></a></li>`,
              )
              .join('')}</ul>`
          : ''
      }
      ${hiddenChars ? `<p class="masked">${hiddenChars} personnage${hiddenChars > 1 ? 's' : ''} lié${hiddenChars > 1 ? 's' : ''} apparai${hiddenChars > 1 ? 'ssent' : 't'} plus tard.</p>` : ''}
      ${e.sources?.length ? `<section class="further"><h2 class="section-title">Pour aller plus loin</h2><ul>${e.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('')}</ul></section>` : ''}
      ${footer()}
    </div>
  </article>`;
  ctx.setMeta(e.name, e.lead);
  ctx.chrome.setBar({
    prev: siblings[i - 1]
      ? { href: `/codex/${rubric.slug}/${siblings[i - 1].slug}`, label: siblings[i - 1].name }
      : null,
    title: e.name,
    next: siblings[i + 1]
      ? { href: `/codex/${rubric.slug}/${siblings[i + 1].slug}`, label: siblings[i + 1].name }
      : null,
    count: `${String(i + 1).padStart(2, '0')} / ${siblings.length}`,
  });
  const place = e.places?.[0];
  const coords = place && placeCoords(graph, place);
  if (coords) ctx.world?.setMode('ambient', { place: coords, light: placeLight(place) });
}

export async function mount(root, route, ctx) {
  const data = await loadIndex();
  root.classList.add('space-codex');
  let current = route;
  async function show(r) {
    ctx.world?.setMode('ambient', { place: { x: 1000, y: 800 } });
    if (r.view === 'home') homeView(root, data, ctx);
    else {
      const rubric = rubricOf(r.params.rubric);
      if (!rubric) return (await import('../notfound.js')).mount(root, r, ctx);
      if (r.view === 'rubric') rubricView(root, rubric, data, ctx);
      else {
        const e = await loadEntity('codex', r.params.slug);
        if (!e || e.rubric !== rubric.slug)
          return (await import('../notfound.js')).mount(root, r, ctx);
        entryView(root, e, rubric, data, ctx);
      }
    }
    hydrateOrnaments(root);
  }
  await show(route);
  return {
    async update(r) {
      current = r;
      await show(r);
      scrollTo(0, 0);
    },
    refresh: () => show(current),
    unmount() {
      root.classList.remove('space-codex');
    },
  };
}
