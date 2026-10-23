// Page de test de la carte (phases 1-2), hors du build final.
// Touches : 0 = vue d'ensemble, 1 = le Mur, 2 = Winterfell, 3 = Port-Réal.
// Paramètre d'URL ?shots : masque l'interface (captures automatiques, tools/lab-shots.mjs).
import GUI from 'lil-gui';
import { Vector3 } from 'three';
import map from './data/map.json';
import { createScene, LIGHT_SCALE, setSunDirection, toWorld } from './map/scene.js';
import { generateTextures, NORMAL_STRENGTH, paintColor, paintNormals } from './map/textures.js';
import { PALETTES } from './map/palettes.js';
import { createTerrain } from './map/terrain.js';
import { createSea } from './map/sea.js';

const info = document.getElementById('lab-info');
const shots = new URLSearchParams(location.search).has('shots');
if (shots) document.documentElement.classList.add('shots');

const city = (name) => map.cities.find((c) => c.name === name);

// Cadrage d'une étape (§5.1) : caméra au sud du lieu, regard vers le nord.
function framing({ x, y }, { dist = 3.6, height = 3.2, azimuth = 0 } = {}) {
  const target = toWorld(x, y);
  target.y = 0.2;
  const position = target
    .clone()
    .add(new Vector3(Math.sin(azimuth) * dist, height, Math.cos(azimuth) * dist));
  return { target, position };
}

const VIEWS = {
  0: {
    label: 'Vue d’ensemble — Westeros',
    ...framing({ x: 410, y: 600 }, { dist: 7, height: 12.5 }),
  },
  1: { label: 'Le Mur', ...framing(city('Châteaunoir')) },
  2: { label: 'Winterfell', ...framing(city('Winterfell')) },
  3: { label: 'Port-Réal', ...framing(city('Port-Réal')) },
};

const lowEnd = new URLSearchParams(location.search).has('mobile');
const world = createScene(document.getElementById('world'), { lowEnd });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const params = {
  palette: 'parchemin',
  relief: 1.1,
  fog: 0.045,
  sunIntensity: 2.2,
  sunElevation: 18,
  hemiIntensity: 0.35,
  exposure: 1.0,
  normalStrength: NORMAL_STRENGTH,
  animateSea: !shots,
};

const t0 = performance.now();
const width = lowEnd ? 2048 : 4096;
const tex = generateTextures(map, { width, palette: PALETTES[params.palette] });
const genMs = performance.now() - t0;

const terrain = createTerrain(map, tex, world.renderer, { lowEnd });
const sea = createSea(map, { reducedMotion, heightTexture: terrain.material.displacementMap });
world.scene.add(terrain, sea);
world.onFrame((dt) => sea.userData.update(dt));

let current = 0;
function view(n) {
  const v = VIEWS[n];
  if (!v) return;
  current = n;
  world.camera.position.copy(v.position);
  world.camera.lookAt(v.target);
  world.requestRender();
  showInfo();
}

function showInfo() {
  const t = tex.fields.timings;
  info.textContent =
    `${VIEWS[current].label}  ·  touches 0–3\n` +
    `Textures ${width}×${width / 2} : ${Math.round(genMs)} ms ` +
    `(masques ${Math.round(t.masks)}, bruit ${Math.round(t.noise)}, relief ${Math.round(t.relief)}, ` +
    `relief+normales ${Math.round(t.heightNormal)}, couleur ${Math.round(t.color)})`;
}

addEventListener('keydown', (e) => {
  if (e.key in VIEWS) view(Number(e.key));
});

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
  .add(params, 'normalStrength', 0.5, 6, 0.1)
  .name('Intensité des normales')
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
gui
  .add({ vue: 0 }, 'vue', { Ensemble: 0, 'Le Mur': 1, Winterfell: 2, 'Port-Réal': 3 })
  .name('Vue')
  .onChange(view);

function apply() {
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

view(0);
apply();
world.setContinuous(params.animateSea && !reducedMotion);

// API pour les captures automatiques : attend qu'une image soit réellement rendue.
const afterRender = () =>
  new Promise((resolve) => {
    world.requestRender();
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
window.lab = {
  ready: true,
  timings: { total: genMs, ...tex.fields.timings },
  async view(n) {
    view(n);
    await afterRender();
  },
  async palette(key) {
    setPalette(key);
    await afterRender();
  },
};
console.info('[lab] textures générées en', Math.round(genMs), 'ms', tex.fields.timings);
