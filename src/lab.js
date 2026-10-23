// Page de test de la carte (phases 1-2), hors du build final.
// Modes (paramètres d'URL) :
//   (aucun)  vol piloté par le scroll sur 3 étapes de test (phase 2, src/lab-vol.js) ;
//   ?vues    vues fixes de la phase 1 — touches 0 = ensemble, 1 = le Mur, 2 = Winterfell,
//            3 = Port-Réal ;
//   ?shots   masque l'interface (captures automatiques) ; ?mobile force le profil mobile.
import GUI from 'lil-gui';
import map from './data/map.json';
import { createScene, LIGHT_SCALE, setSunDirection } from './map/scene.js';
import { generateTextures, NORMAL_STRENGTH, paintColor, paintNormals } from './map/textures.js';
import { DEFAULT_PALETTE, PALETTES } from './map/palettes.js';
import { createTerrain } from './map/terrain.js';
import { createSea } from './map/sea.js';
import { createMiniatures } from './map/miniatures/index.js';
import { createForests } from './map/forests.js';
import { stepFrame } from './map/camera-path.js';
import { setupFlight } from './lab-vol.js';

const query = new URLSearchParams(location.search);
const shots = query.has('shots');
const viewsMode = query.has('vues');
const lowEnd = query.has('mobile');
const timeScale = Number(query.get('temps') ?? 1); // ?temps=0.1 : animations ralenties (vidéo)
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('shots', shots);
document.documentElement.classList.toggle('vues', viewsMode);

const info = document.getElementById('lab-info');
const world = createScene(document.getElementById('world'), { lowEnd });
world.timeScale = timeScale;

const params = {
  palette: DEFAULT_PALETTE,
  relief: 1.1,
  fog: 0.045,
  sunIntensity: 2.2,
  sunElevation: 18,
  hemiIntensity: 0.35,
  exposure: 1.0,
  normalStrength: NORMAL_STRENGTH,
  animateSea: !shots,
  miniatures: true,
  forests: true,
};

const t0 = performance.now();
const width = lowEnd ? 2048 : 4096;
const tex = generateTextures(map, { width, palette: PALETTES[params.palette] });
const genMs = performance.now() - t0;
const t = tex.fields.timings;
const timingText =
  `Textures ${width}×${width / 2} : ${Math.round(genMs)} ms ` +
  `(masques ${Math.round(t.masks)}, bruit ${Math.round(t.noise)}, relief ${Math.round(t.relief)}, ` +
  `relief+normales ${Math.round(t.heightNormal)}, couleur ${Math.round(t.color)})`;

const terrain = createTerrain(map, tex, world.renderer, { lowEnd });
const sea = createSea(map, { reducedMotion, heightTexture: terrain.material.displacementMap });
const miniatures = createMiniatures(map, tex.fields);
const forests = createForests(map, tex.fields);
world.scene.add(terrain, sea, miniatures, forests);
world.onFrame((dt) => sea.userData.update(dt));

// Panneau de réglages en direct.
const gui = new GUI({ title: 'Réglages du terrain' });
gui
  .add(
    params,
    'palette',
    Object.fromEntries(Object.entries(PALETTES).map(([k, p]) => [p.label, k])),
  )
  .name('Palette')
  .onChange(setPalette);
gui.add(params, 'relief', 0.3, 2.5, 0.05).name('Hauteur du relief').onChange(apply);
gui
  .add(params, 'normalStrength', 0.2, 4, 0.1)
  .name('Normales (× pente réelle)')
  .onFinishChange(() => {
    terrain.userData.replaceTexture('normalMap', paintNormals(tex.fields, params.normalStrength));
    world.requestRender();
  });
gui.add(params, 'fog', 0, 0.12, 0.001).name('Densité du brouillard').onChange(apply);
gui.add(params, 'sunIntensity', 0, 5, 0.05).name('Soleil : intensité').onChange(apply);
gui.add(params, 'sunElevation', 3, 80, 1).name('Soleil : élévation (°)').onChange(apply);
gui.add(params, 'hemiIntensity', 0, 2, 0.01).name('Ciel : intensité').onChange(apply);
gui.add(params, 'exposure', 0.3, 2, 0.01).name('Exposition').onChange(apply);
gui
  .add(params, 'animateSea')
  .name('Animer la mer')
  .onChange((on) => world.setContinuous(on));

gui.add(params, 'miniatures').name('Maquettes').onChange(apply);
gui.add(params, 'forests').name('Forêts').onChange(apply);

function apply() {
  miniatures.visible = params.miniatures;
  forests.visible = params.forests;
  terrain.material.displacementScale = params.relief;
  terrain.material.displacementBias = -0.25 * (params.relief / 1.1);
  sea.userData.uniforms.uRelief.value.set(params.relief, terrain.material.displacementBias);
  world.scene.fog.density = params.fog;
  world.sun.intensity = params.sunIntensity * LIGHT_SCALE;
  setSunDirection(world.sun, params.sunElevation);
  world.hemi.intensity = params.hemiIntensity * LIGHT_SCALE;
  world.renderer.toneMappingExposure = params.exposure;
  world.requestRender();
}

function setPalette(key) {
  params.palette = key;
  terrain.userData.replaceTexture('map', paintColor(map, tex.fields, PALETTES[key]));
  world.requestRender();
}

// Attend qu'une image soit réellement rendue (captures automatiques).
const afterRender = () =>
  new Promise((resolve) => {
    world.requestRender();
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

window.lab = {
  timings: { total: genMs, ...t },
  async palette(key) {
    setPalette(key);
    await afterRender();
  },
};

if (viewsMode) {
  // --- Phase 1 : vues fixes ------------------------------------------------------
  const VIEWS = {
    0: {
      label: 'Vue d’ensemble — Westeros',
      ...stepFrame({ focus: { x: 410, y: 600 }, camera: { dist: 7, height: 12.5 } }, map),
    },
    1: { label: 'Le Mur', ...stepFrame({ focus: { city: 'Châteaunoir' } }, map) },
    2: { label: 'Winterfell', ...stepFrame({ focus: { city: 'Winterfell' } }, map) },
    3: { label: 'Port-Réal', ...stepFrame({ focus: { city: 'Port-Réal' } }, map) },
  };
  const view = (n) => {
    const v = VIEWS[n];
    if (!v) return;
    world.camera.position.copy(v.position);
    world.camera.lookAt(v.target);
    world.requestRender();
    info.textContent = `${v.label}  ·  touches 0–3\n${timingText}`;
  };
  addEventListener('keydown', (e) => {
    if (e.key in VIEWS) view(Number(e.key));
  });
  gui
    .add({ vue: 0 }, 'vue', { Ensemble: 0, 'Le Mur': 1, Winterfell: 2, 'Port-Réal': 3 })
    .name('Vue')
    .onChange(view);
  view(0);
  window.lab.view = async (n) => {
    view(n);
    await afterRender();
  };
} else {
  // --- Phase 2 : vol piloté par le scroll ------------------------------------------
  const flight = setupFlight({ world, map, reducedMotion, info, timingText });
  window.lab.flight = flight;
}

apply();
world.setContinuous(params.animateSea || !viewsMode);
window.lab.ready = true;
console.info('[lab] textures générées en', Math.round(genMs), 'ms', t);
