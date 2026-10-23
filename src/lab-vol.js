// Lab, phase 2 : vol de caméra piloté par le scroll sur 3 étapes de test.
// Vérifie les arcs (dont une traversée 'high'), les paliers, le décalage optique selon le côté
// du panneau et le comportement en prefers-reduced-motion (coupe + fondu noir de 300 ms).
import { createCameraRig, introFrame, stepFrame } from './map/camera-path.js';
import { createScrollDriver } from './journey/scroll.js';
import { applyPanel } from './journey/panels.js';

// Étapes de test (les vraies étapes viendront de src/data/journey.js en phase 3).
const TEST_STEPS = [
  {
    id: 'mur',
    num: '01',
    place: 'Le Mur',
    region: 'Le Grand Nord',
    focus: { city: 'Châteaunoir' },
  },
  {
    id: 'winterfell',
    num: '02',
    place: 'Winterfell',
    region: 'Le Nord',
    focus: { city: 'Winterfell' },
  },
  {
    id: 'port-real',
    num: '03',
    place: 'Port-Réal',
    region: 'Les Terres de la Couronne',
    focus: { city: 'Port-Réal' },
    arc: 'high', // traversée de test : la caméra monte au-dessus de y = 5,5
  },
];

export function setupFlight({ world, map, reducedMotion, info, timingText }) {
  const vertical = window.innerWidth < 700;
  const main = document.createElement('main');
  main.id = 'lab-journey';
  main.innerHTML = `
    <section class="intro"><p>Lab · phase 2 — faites défiler pour voler</p></section>
    ${TEST_STEPS.map(
      (s, i) => `
      <article class="stop" id="etape-${s.id}" data-side="${i % 2 ? 'right' : 'left'}">
        <div class="stop-panel">
          <p class="stop-region">${s.region}</p>
          <p class="stop-num" aria-hidden="true">${s.num}</p>
          <h2>${s.place}</h2>
          <p>Panneau de test (${i % 2 ? 'droite' : 'gauche'}).
          ${s.arc === 'high' ? 'Vol d’arrivée en arc haut (traversée).' : ''}</p>
        </div>
      </article>`,
    ).join('')}
    <section class="outro"><p>Fin du vol de test.</p></section>`;
  document.body.append(main);
  const fade = document.createElement('div');
  fade.id = 'lab-fade';
  document.body.append(fade);

  const articles = [...main.querySelectorAll('.stop')];
  const panels = articles.map((a) => a.querySelector('.stop-panel'));
  const frames = TEST_STEPS.map((s, i) =>
    stepFrame(s, map, { side: articles[i].dataset.side, vertical }),
  );
  const rig = createCameraRig(world.camera, frames, introFrame(map), { reducedMotion });

  let scroll = { index: -1, u: 0 };
  let state = null;
  let lastChange = 0;

  const driver = createScrollDriver(articles, {
    onUpdate(s) {
      scroll = s;
      panels.forEach((p, i) => applyPanel(p, i === s.index ? s.u : 0, { reducedMotion }));
      world.requestRender();
    },
    onStepChange(i) {
      lastChange = performance.now();
      // Mouvement réduit : la caméra coupe d'une étape à l'autre, masquée par un fondu noir.
      if (reducedMotion) {
        fade.style.transition = 'none';
        fade.style.opacity = '1';
        requestAnimationFrame(() => {
          fade.style.transition = 'opacity 300ms linear';
          fade.style.opacity = '0';
        });
      }
      return i;
    },
  });

  world.onFrame((dt, time) => {
    state = rig.update(scroll.index, scroll.u, time);
    const step = state.index < 0 ? 'intro' : `${TEST_STEPS[state.index].num} ${state.id}`;
    info.textContent =
      `${step} · ${state.phase} · u = ${scroll.u.toFixed(2)} · caméra y = ${state.cameraY.toFixed(2)}` +
      `${reducedMotion ? ' · mouvement réduit' : ''}\n${timingText}`;
  });

  return {
    steps: TEST_STEPS.map((s) => s.id),
    /** Dernier état de la caméra, tel que rendu à la dernière image. */
    get state() {
      if (!state) return null;
      // Position du lieu visé à l'écran (0–1), décalage optique compris.
      const f = state.index >= 0 ? frames[state.index] : null;
      const p = f ? f.target.clone().project(world.camera) : null;
      return {
        ...state,
        screen: p ? { x: (p.x + 1) / 2, y: (1 - p.y) / 2 } : null,
        side: state.index >= 0 ? articles[state.index].dataset.side : null,
        sinceChange: performance.now() - lastChange,
      };
    },
    goTo: (i, opts) => driver.goTo(i, opts),
  };
}
