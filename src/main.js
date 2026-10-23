// Point d'entrée : rend le voyage en HTML, branche le scroll et la modale, puis charge la
// scène 3D (import dynamique, après le premier affichage).
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/journey.css';
import './styles/archive.css';
import './styles/hud.css';
import './styles/menu.css';
import { STEPS, TOTAL_STEPS, panelSide } from './data/journey.js';
import { renderJourney } from './journey/render.js';
import { createScrollDriver } from './journey/scroll.js';
import { applyPanel } from './journey/panels.js';
import { initArchive } from './ui/archive.js';
import { initHud } from './journey/hud.js';
import { initMenu } from './ui/menu.js';
import { initAudio } from './ui/audio.js';
import { FICHES, getFiche } from './content/index.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const articles = renderJourney();
const panels = articles.map((a) => a.querySelector('.stop-panel'));
initArchive();

// « Voir la lignée » : l'arbre arrive en phase 5 ; en attendant, on mène à sa section.
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-lineage]')) document.getElementById('arbre').scrollIntoView();
});

const announcer = document.getElementById('announcer');
const fade = document.getElementById('cut-fade');
let world = null;

let hud = null;
let menu = null;
const driver = createScrollDriver(articles, {
  onUpdate(s) {
    panels.forEach((p, i) => applyPanel(p, i === s.index ? s.u : 0, { reducedMotion }));
    world?.setScroll(s);
  },
  onStepChange(i) {
    hud?.update(i);
    menu?.setCurrent(i);
    if (i >= 0) {
      const step = STEPS[i];
      announcer.textContent = `Étape ${step.num} sur ${TOTAL_STEPS} : ${step.place}`;
    }
    // Mouvement réduit : la caméra coupe, masquée par un fondu noir de 300 ms.
    if (reducedMotion && world) {
      fade.style.transition = 'none';
      fade.style.opacity = '1';
      requestAnimationFrame(() => {
        fade.style.transition = 'opacity 300ms linear';
        fade.style.opacity = '0';
      });
    }
  },
});

// Navigation : vol doux vers le palier d'une étape (coupe directe en mouvement réduit).
const goTo = (i) => driver.goTo(i, { smooth: !reducedMotion });
const toIntro = () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
hud = initHud({ steps: STEPS, total: TOTAL_STEPS, goTo, toIntro });
menu = initMenu({ steps: STEPS, goTo });
hud.update(driver.index);
menu.setCurrent(driver.index);
initAudio();

// Bouton « Commencer le voyage » : défile jusqu'au palier de l'étape 01.
document.querySelector('.intro-cta').addEventListener('click', (e) => {
  e.preventDefault();
  goTo(0);
});

// Scène 3D : après le premier affichage, pour que le texte soit là immédiatement.
requestAnimationFrame(() =>
  setTimeout(async () => {
    try {
      const { initWorld } = await import('./map/world.js');
      world = initWorld({
        canvas: document.getElementById('world'),
        labelsRoot: document.getElementById('world-labels'),
        steps: STEPS,
        sides: STEPS.map(panelSide),
        placeTitle: (id) => getFiche('place', id).title,
        reducedMotion,
      });
      driver.refresh();
      document.documentElement.classList.add('is-world-ready');
    } catch (err) {
      // Sans WebGL : le voyage reste lisible ; le repli 2D arrive en phase 7.
      console.warn('Carte 3D indisponible :', err.message);
      document.documentElement.classList.add('no-webgl', 'is-world-ready');
    }
  }, 0),
);

// Accès pour les vérifications automatiques (tools/check.mjs).
window.__realmContent = { FICHES };
window.realm = {
  get state() {
    return world?.state ?? null;
  },
  get ready() {
    return document.documentElement.classList.contains('is-world-ready');
  },
  goTo: (i, opts) => driver.goTo(i, opts),
};
