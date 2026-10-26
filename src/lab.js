// Lab du paysage (hors build) : le monde 3D seul, piloté par un petit panneau lil-gui.
// Choix de l'étape, position u dans la séquence (vol → palier → remontée), mode carte ou
// ambiance, animations réduites. Sert à régler la lumière et les cadrages de journey.json.
import GUI from 'lil-gui';
import journey from './data/journey.json';
import { initWorld } from './world/world.js';
import { SEQ } from './world/seq.js';

const info = document.getElementById('lab-info');
const params = {
  étape: journey.steps[0].slug,
  u: SEQ.plunge + 0.02,
  mode: 'map',
  réduit: false,
};

const world = await initWorld({
  canvas: document.getElementById('world'),
  labelsRoot: document.getElementById('world-labels'),
  reducedMotion: () => params.réduit,
});
window.lab = world;

function apply() {
  const index = journey.steps.findIndex((s) => s.slug === params.étape);
  world.setMode(
    params.mode,
    params.mode === 'ambient' ? { place: journey.steps[index].focus } : {},
  );
  world.setJourney({ kind: 'step', index, u: params.u, afterCrossing: index > 10 });
  info.textContent = `${params.étape} · u=${params.u.toFixed(2)} · ${params.mode} · init ${Math.round(world.initMs)} ms${world.usedWorker ? ' (worker)' : ''}`;
}

const gui = new GUI({ title: 'Paysage' });
gui
  .add(
    params,
    'étape',
    journey.steps.map((s) => s.slug),
  )
  .onChange(apply);
const uCtrl = gui.add(params, 'u', 0, 1, 0.01).onChange(apply);
gui.add(params, 'mode', ['map', 'ambient']).onChange(apply);
gui.add(params, 'réduit').onChange(() => {
  world.refreshMotion();
  apply();
});
const marks = { vol: 0.15, approche: 0.36, plongée: 0.47, palier: 0.7, remontée: 0.94 };
for (const [name, u] of Object.entries(marks)) gui.add({ [name]: () => uCtrl.setValue(u) }, name);
apply();
