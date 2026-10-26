// Point d'entrée : cadre, routeur, espaces chargés à la demande et monde 3D persistant.
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/chrome.css';
import './styles/overlays.css';
import './styles/journey.css';
import { router, setMeta } from './core/router.js';
import { store } from './core/store.js';
import { announce, toast, wait } from './ui/dom.js';
import { initChrome } from './ui/chrome.js';
import { initMenu } from './ui/menu.js';
import { initSeasonPicker } from './ui/season-picker.js';
import { audio } from './ui/audio.js';
import * as mapSpace from './spaces/map/index.js';

const SPACES = {
  map: () => Promise.resolve(mapSpace),
  characters: () => import('./spaces/characters/index.js'),
  houses: () => import('./spaces/houses/index.js'),
  codex: () => import('./spaces/codex/index.js'),
  about: () => import('./spaces/about/index.js'),
  notfound: () => import('./spaces/notfound.js'),
};

const root = document.documentElement;
const spaceEl = document.getElementById('space');
const chrome = initChrome();
const picker = initSeasonPicker();

const applyMotion = () => root.classList.toggle('reduced-motion', store.get('reducedMotion'));
applyMotion();

// Son : bouton de la barre du bas et réglage du menu.
const soundBtn = document.querySelector('.sound-btn');
function toggleSound() {
  audio.setEnabled(!audio.enabled);
  store.set({ sound: audio.enabled });
  soundBtn.setAttribute('aria-pressed', String(audio.enabled));
  soundBtn.setAttribute(
    'aria-label',
    audio.enabled ? 'Couper le son d’ambiance' : 'Activer le son d’ambiance',
  );
}
soundBtn.addEventListener('click', toggleSound);

const menu = initMenu({
  onSeason: () => picker.open(),
  onSound: toggleSound,
  onSearch: () => openSearch(),
});
document.querySelector('.season-btn').addEventListener('click', () => picker.open());

// Monde 3D : chargé après le premier affichage. Sans WebGL, repli 2D (§12).
let world = null;
const worldReady = new Promise((resolve) => {
  const start = async () => {
    try {
      const { initWorld } = await import('./world/world.js');
      world = await initWorld({
        canvas: document.getElementById('world'),
        labelsRoot: document.getElementById('world-labels'),
        reducedMotion: () => store.get('reducedMotion'),
      });
      root.classList.add('is-world-ready');
    } catch (e) {
      console.info('WebGL indisponible, repli 2D :', e.message);
      const { initFallback } = await import('./world/fallback.js');
      world = initFallback(document.querySelector('.world'));
      root.classList.add('no-webgl', 'is-world-ready');
    }
    window.realm.world = world;
    resolve(world);
  };
  requestAnimationFrame(() => setTimeout(start, 0));
});

// Recherche globale (§8.5) : bouton, Ctrl+K / Cmd+K et « / ».
let search = null;
async function openSearch() {
  search ??= (await import('./ui/search-modal.js')).initSearch();
  search.open();
}
document.querySelector('.search-btn').addEventListener('click', openSearch);
addEventListener('keydown', (e) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName);
  if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
    if (root.classList.contains('has-modal') && !document.getElementById('search').hidden) return;
    e.preventDefault();
    openSearch();
  }
});

// Aperçus en surimpression (§8.3) : tout lien [data-preview] d'un texte.
document.addEventListener('click', async (e) => {
  const a = e.target.closest('a[data-preview]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const { openPreview } = await import('./ui/preview.js');
  openPreview(a.dataset.kind, a.dataset.slug, a);
});

const ctx = {
  store,
  chrome,
  menu,
  picker,
  audio,
  announce,
  setMeta,
  get world() {
    return world;
  },
  worldReady,
  navigate: (url, o) => router.navigate(url, o),
};

let active = null; // { space, handle }
let seq = 0;

async function onRoute(route, { initial } = {}) {
  const token = ++seq;
  menu.close({ restoreFocus: false });
  if (active?.space === route.space && active.handle.update) {
    await active.handle.update(route);
    return;
  }
  const reduced = store.get('reducedMotion');
  if (!initial) {
    spaceEl.classList.add('is-leaving');
    await wait(reduced ? 150 : 600);
    if (token !== seq) return;
  }
  active?.handle.unmount?.();
  const mod = await SPACES[route.space]();
  if (token !== seq) return;
  spaceEl.innerHTML = '';
  spaceEl.dataset.space = route.space;
  store.set({ space: route.space });
  chrome.setSpace(route.space);
  root.dataset.worldMode = route.space === 'map' ? 'map' : 'ambient';
  if (route.space !== 'map') window.scrollTo(0, 0);
  const handle = (await mod.mount(spaceEl, route, ctx)) ?? {};
  if (token !== seq) return handle.unmount?.();
  active = { space: route.space, handle };
  spaceEl.classList.remove('is-leaving');
  if (!initial) spaceEl.focus({ preventScroll: true });
}

// Changement de saison : mise à jour en place, fondu de 300 ms et notification (§9).
store.on(async (keys) => {
  if (keys.includes('reducedMotion')) applyMotion();
  if (!keys.includes('season') || !active?.handle.refresh) return;
  spaceEl.classList.add('is-refreshing');
  await wait(300);
  await active.handle.refresh();
  spaceEl.classList.remove('is-refreshing');
  const msg = `Contenu affiché jusqu’à la saison ${store.season}`;
  toast(msg);
  announce(msg);
});

window.realm = {
  store,
  router,
  get space() {
    return active?.space ?? null;
  },
  get state() {
    return active?.handle.state ?? null;
  },
  world: null,
  worldReady,
};

router.start(onRoute);
