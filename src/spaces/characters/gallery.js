// Galerie des personnages (§7.1) : carrousel de portraits plein écran ou grille,
// filtres (maison, région, camp, statut), recherche par nom et tri.
import { esc, footer } from '../../ui/dom.js';
import { portrait } from '../../ui/media.js';
import { lastVisible } from '../../core/spoilers.js';
import {
  applyFilters,
  CAMPS,
  filterOptions,
  readFilters,
  slugify,
  SORTS,
  toQuery,
} from './filters.js';

const opt = (value, label, cur) =>
  `<option value="${esc(value)}"${value === cur ? ' selected' : ''}>${esc(label)}</option>`;

let lastOrder = []; // ordre de la galerie filtrée, pour la barre du bas des fiches

export const galleryOrder = () => lastOrder;

export function renderGallery(root, route, ctx, data) {
  const { index, graph } = data;
  const season = ctx.store.season;
  const f = readFilters(route.query);
  const { list, later } = applyFilters(index, graph, season, f);
  lastOrder = list.map((c) => c.slug);
  const { houses, regions } = filterOptions(index, graph, season);
  const sigil = (c) => graph.houses.get(c.house)?.sigil;
  let current = Math.max(
    0,
    Math.min(list.length - 1, Number(sessionStorageGet('gallery-pos') ?? 0)),
  );

  root.innerHTML = `
  <section class="page gallery" aria-labelledby="gallery-title">
    <header class="gallery-head">
      <h1 id="gallery-title" class="visually-hidden">Personnages</h1>
      <form class="gallery-tools" role="search" aria-label="Filtrer les personnages">
        <label class="field"><span class="label">Nom</span><input type="search" name="q" value="${esc(f.q)}" placeholder="Rechercher…" autocomplete="off" /></label>
        <label class="field"><span class="label">Maison</span><select name="maison">${opt('', 'Toutes', f.maison)}${houses
          .map((h) => opt(h.slug, h.name, f.maison))
          .join('')}${opt('sans-maison', 'Sans maison', f.maison)}</select></label>
        <label class="field"><span class="label">Région</span><select name="region">${opt('', 'Toutes', f.region)}${regions
          .map((r) => opt(slugify(r), r, f.region))
          .join('')}</select></label>
        <label class="field"><span class="label">Camp</span><select name="camp">${opt('', 'Tous', f.camp)}${CAMPS.map(
          (c) => opt(c.value, c.label, f.camp),
        ).join('')}</select></label>
        <label class="field"><span class="label">Statut (saison ${season})</span><select name="statut">${opt('', 'Tous', f.statut)}${opt(
          'vivant',
          'Vivants',
          f.statut,
        )}${opt('mort', 'Morts', f.statut)}</select></label>
        <label class="field"><span class="label">Tri</span><select name="tri">${SORTS.map((s) => opt(s.value, s.label, f.tri)).join('')}</select></label>
        <div class="view-toggle" role="group" aria-label="Affichage">
          <button type="button" data-view="carrousel" aria-pressed="${f.vue !== 'grille'}">Carrousel</button>
          <button type="button" data-view="grille" aria-pressed="${f.vue === 'grille'}">Grille</button>
        </div>
      </form>
      <p class="gallery-count label" aria-live="polite">${list.length} personnage${list.length > 1 ? 's' : ''}${
        later ? ` · ${later} apparaissent dans des saisons ultérieures` : ''
      }</p>
    </header>
    ${
      !list.length
        ? '<p class="gallery-empty">Aucun personnage ne correspond à ces filtres.</p>'
        : f.vue === 'grille'
          ? `<ul class="grid">${list
              .map(
                (c) => `<li><a class="grid-card" href="/personnages/${c.slug}">
                  <span class="grid-portrait">${portrait(c, { sigil: sigil(c), sizes: '(max-width: 700px) 45vw, 220px', alt: '' })}</span>
                  <span class="grid-name">${esc(c.name)}</span>
                  <span class="grid-house">${esc(graph.houses.get(c.house)?.name ?? 'Sans maison')}${deadMark(c, season)}</span>
                </a></li>`,
              )
              .join('')}</ul>`
          : `<div class="carousel" tabindex="0" aria-roledescription="carrousel" aria-label="Portraits des personnages">
              <ul class="carousel-track"></ul>
              <button type="button" class="carousel-arrow prev" aria-label="Personnage précédent"><span data-ornament="arrow-left"></span></button>
              <button type="button" class="carousel-arrow next" aria-label="Personnage suivant"><span data-ornament="arrow-right"></span></button>
            </div>`
    }
    ${footer()}
  </section>`;

  // Filtres → URL (remplacement, pas d'entrée d'historique à chaque frappe).
  const form = root.querySelector('.gallery-tools');
  const update = (patch) => {
    sessionStorageSet('gallery-pos', 0);
    ctx.navigate(
      `/personnages${toQuery({ ...readFilters(new URLSearchParams(location.search)), ...patch })}`,
      {
        replace: true,
      },
    );
  };
  form.addEventListener(
    'change',
    (e) => e.target.name && e.target.name !== 'q' && update({ [e.target.name]: e.target.value }),
  );
  let t = 0;
  form.q?.addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => update({ q: e.target.value }), 350);
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  form
    .querySelectorAll('[data-view]')
    .forEach((b) => b.addEventListener('click', () => update({ vue: b.dataset.view })));

  const carousel = root.querySelector('.carousel');
  if (!carousel) {
    ctx.chrome.setBar({ title: 'Personnages', count: `${list.length}` });
    return { focusSearch: () => form.q.focus() };
  }

  const track = carousel.querySelector('.carousel-track');
  function draw() {
    // Seuls les voisins proches sont rendus : le carrousel reste léger à 100 portraits.
    const items = [];
    for (let k = -2; k <= 2; k++) {
      const i = current + k;
      if (i < 0 || i >= list.length) continue;
      const c = list[i];
      items.push(`<li class="slide" data-offset="${k}" style="--k:${k}">
        <a href="/personnages/${c.slug}" ${k === 0 ? '' : 'tabindex="-1" aria-hidden="true"'} aria-label="${esc(`Ouvrir la fiche de ${c.name}`)}">
          ${portrait(c, { sigil: sigil(c), sizes: '(max-width: 700px) 80vw, 46vh', eager: k === 0, alt: k === 0 ? `Portrait illustré de ${c.name}` : '' })}
        </a>
        ${k === 0 ? `<p class="slide-caption"><span class="slide-house label">${esc(graph.houses.get(c.house)?.name ?? '')}</span><span class="slide-summary">${esc(c.summary.split('. ')[0])}.</span></p>` : ''}
      </li>`);
    }
    track.innerHTML = items.join('');
    const c = list[current];
    ctx.chrome.setBar({
      prev:
        current > 0
          ? { href: `/personnages/${list[current - 1].slug}`, label: list[current - 1].name }
          : null,
      title: c.name,
      next:
        current < list.length - 1
          ? { href: `/personnages/${list[current + 1].slug}`, label: list[current + 1].name }
          : null,
      count: `${String(current + 1).padStart(2, '0')} / ${list.length}`,
    });
    // La barre du bas fait défiler le carrousel au lieu d'ouvrir les fiches.
    ctx.announce(`${c.name}, ${current + 1} sur ${list.length}`);
    sessionStorageSet('gallery-pos', current);
  }
  const go = (d) => {
    const n = Math.max(0, Math.min(list.length - 1, current + d));
    if (n === current) return;
    current = n;
    draw();
  };
  carousel.querySelector('.prev').addEventListener('click', () => go(-1));
  carousel.querySelector('.next').addEventListener('click', () => go(1));
  const bar = document.querySelector('.bottom-bar');
  const onBar = (e) => {
    const a = e.target.closest('.bar-prev, .bar-next');
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    go(a.classList.contains('bar-prev') ? -1 : 1);
  };
  bar.addEventListener('click', onBar, true);
  const onKey = (e) => {
    if (document.documentElement.classList.contains('has-modal')) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName)) return;
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  };
  addEventListener('keydown', onKey);
  // Molette horizontale et balayage tactile.
  let acc = 0;
  carousel.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      acc += e.deltaX;
      if (Math.abs(acc) > 60) {
        go(Math.sign(acc));
        acc = 0;
      }
    },
    { passive: false },
  );
  let x0 = null;
  carousel.addEventListener('pointerdown', (e) => (x0 = e.clientX));
  carousel.addEventListener('pointerup', (e) => {
    if (x0 !== null && Math.abs(e.clientX - x0) > 40) go(e.clientX < x0 ? 1 : -1);
    x0 = null;
  });
  draw();
  return {
    unmount() {
      removeEventListener('keydown', onKey);
      bar.removeEventListener('click', onBar, true);
    },
  };
}

function deadMark(c, season) {
  return lastVisible(c.status, season)?.value === 'mort' ? ' · <span class="dead">mort</span>' : '';
}

function sessionStorageGet(k) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function sessionStorageSet(k, v) {
  try {
    sessionStorage.setItem(k, String(v));
  } catch {
    /* indisponible */
  }
}
