// Espace Personnages (§7.1, §7.2) : galerie et fiches, chargé à la demande.
import './characters.css';
import { loadEntity, loadIndex } from '../../core/content.js';
import { hydrateOrnaments } from '../../ui/dom.js';
import { galleryOrder, renderGallery } from './gallery.js';
import { renderFiche } from './fiche.js';
import { placeCoords, placeLight } from '../../core/places.js';
import { applyFilters, readFilters, toQuery } from './filters.js';

let lastQuery = '';

export async function mount(root, route, ctx) {
  const data = await loadIndex();
  root.classList.add('space-characters');
  let view = null;

  async function show(r) {
    view?.unmount?.();
    view = null;
    const season = ctx.store.season;
    if (r.view === 'gallery') {
      lastQuery = toQuery(readFilters(r.query));
      // Le rendu remplace le formulaire : on rend le focus au champ qui l'avait.
      const focused = root.contains(document.activeElement) ? document.activeElement.name : null;
      view = renderGallery(root, r, ctx, data);
      hydrateOrnaments(root);
      const el = focused && root.querySelector(`.gallery-tools [name="${focused}"]`);
      if (el) {
        el.focus();
        if (el.type === 'search') el.setSelectionRange(el.value.length, el.value.length);
      }
      ctx.setMeta(
        'Personnages',
        'Une centaine de personnages de Westeros et d’Essos, sans spoiler au-delà de votre saison.',
      );
      ctx.world?.setMode('ambient', { place: { x: 1300, y: 650 } });
      return;
    }
    const full = await loadEntity('characters', r.params.slug);
    if (!full) {
      const nf = await import('../notfound.js');
      return nf.mount(root, r, ctx);
    }
    let order = galleryOrder();
    if (!order.includes(full.slug))
      order = applyFilters(
        data.index,
        data.graph,
        season,
        readFilters(new URLSearchParams()),
      ).list.map((c) => c.slug);
    const info = renderFiche(root, {
      full,
      tab: r.params.tab ?? '',
      season,
      data,
      order,
      query: lastQuery,
    });
    hydrateOrnaments(root);
    ctx.setMeta(info.name, info.summary);
    ctx.chrome.setBar({
      prev: info.prev ? { href: `/personnages/${info.prev.slug}`, label: info.prev.name } : null,
      title: info.name,
      next: info.next ? { href: `/personnages/${info.next.slug}`, label: info.next.name } : null,
      count: info.pos >= 0 ? `${String(info.pos + 1).padStart(2, '0')} / ${order.length}` : '',
    });
    ctx.announce(`Fiche : ${info.name}`);
    const coords = info.place && placeCoords(data.graph, info.place);
    ctx.world?.setMode('ambient', {
      place: coords ?? { x: 1300, y: 650 },
      light: placeLight(info.place),
    });
    ctx.worldReady.then((w) =>
      w.setMode('ambient', { place: coords ?? { x: 1300, y: 650 }, light: placeLight(info.place) }),
    );
  }

  const onClick = (e) => {
    if (e.target.closest('[data-open-season]')) ctx.picker.open();
  };
  root.addEventListener('click', onClick);
  await show(route);
  let current = route;

  return {
    async update(r) {
      const sameFiche =
        current.view === 'fiche' && r.view === 'fiche' && current.params.slug === r.params.slug;
      current = r;
      await show(r);
      if (!sameFiche) window.scrollTo(0, 0);
    },
    refresh: () => show(current),
    unmount() {
      view?.unmount?.();
      root.removeEventListener('click', onClick);
      root.classList.remove('space-characters');
    },
  };
}
