// Le monde persistant (§4.3) : créé une fois, jamais retiré. En mode « carte », il est net et
// piloté par le voyage ; en mode « ambiance » (autres espaces), la caméra dérive lentement
// au-dessus du lieu lié au contenu affiché (l'assombrissement et le flou sont en CSS).
import { Vector3 } from 'three';
import map from '../data/map.json';
import journey from '../data/journey.json';
import { createScene, isLowEnd, toWorld } from './scene.js';
import { createTerrain } from './terrain.js';
import { createSea } from './sea.js';
import { createSky } from './sky.js';
import { createClouds } from './clouds.js';
import { createCities } from './cities.js';
import { createMarkers } from './markers.js';
import { createCameraRig, introFrame, SEQ, stepFrames } from './camera-path.js';
import { applyLight, mixLight, parseLight } from './lights.js';

/** Textures : dans un Worker si possible (OffscreenCanvas), sinon sur le fil principal. */
async function buildTextures(width) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(new URL('./textures.worker.js', import.meta.url), {
        type: 'module',
      });
      const res = await new Promise((resolve, reject) => {
        worker.onmessage = (e) => (e.data.ok ? resolve(e.data) : reject(new Error(e.data.error)));
        worker.onerror = (e) => reject(new Error(e.message || 'Worker des textures en échec'));
        worker.postMessage({ map, width });
      });
      worker.terminate();
      return { src: res.bitmaps, fields: res.fields, timings: res.timings, worker: true };
    } catch (e) {
      console.info('Textures sur le fil principal :', e.message);
    }
  }
  const { generateTextures } = await import('./textures.js');
  const t = generateTextures(map, { width });
  return { src: t, fields: t.fields, timings: t.fields.timings, worker: false };
}

export async function initWorld({ canvas, labelsRoot, reducedMotion = () => false }) {
  const lowEnd = isLowEnd();
  const vertical = () => window.innerWidth < 700;
  const world = createScene(canvas, { lowEnd });
  const t0 = performance.now();
  const tex = await buildTextures(lowEnd ? 2048 : 4096);

  const terrain = createTerrain(map, tex.src, world.renderer, { lowEnd, reducedMotion });
  const sea = createSea(map, { heightTexture: terrain.material.displacementMap, reducedMotion });
  const sky = createSky();
  const clouds = createClouds(map, { count: lowEnd ? 18 : 36, reducedMotion });
  const cities = createCities(map, tex.fields, { lowEnd });
  world.scene.add(sky, terrain, sea, clouds.group, cities.group);
  const steps = journey.steps;
  const markers = createMarkers({ scene: world.scene, map, fields: tex.fields, steps, labelsRoot });

  let frames = steps.map((s) => stepFrames(s, { vertical: vertical() }));
  let intro = introFrame(map, { vertical: vertical() });
  addEventListener('resize', () => {
    frames = steps.map((s) => stepFrames(s, { vertical: vertical() }));
    intro = introFrame(map, { vertical: vertical() });
  });
  const rig = createCameraRig(world.camera, intro);
  const lights = {
    intro: parseLight(journey.intro.light),
    crossing: parseLight(journey.crossing.light),
    steps: steps.map((s) => parseLight(s.light)),
  };
  const light = mixLight(lights.intro, lights.intro, 0);

  // État piloté de l'extérieur.
  let mode = 'map';
  let pose = { kind: 'intro', index: -1, u: 0 };
  let ambientTarget = toWorld(map.bounds.w * 0.3, map.bounds.h * 0.5);
  let ambientLight = lights.intro;
  let covered = false;
  let state = { phase: 'intro', index: -1, ready: true };

  /** Lumière du moment selon la position dans le voyage. */
  function currentLight() {
    const { kind, index, u } = pose;
    if (kind === 'intro' || index < 0) return mixLight(lights.intro, lights.intro, 0, light);
    if (kind === 'crossing') {
      const a = lights.steps[index - 1] ?? lights.intro;
      return u < 0.5
        ? mixLight(a, lights.crossing, u * 2, light)
        : mixLight(lights.crossing, lights.steps[index], (u - 0.5) * 2, light);
    }
    const cur = lights.steps[index];
    if (kind === 'step' && u < SEQ.flight && !pose.afterCrossing) {
      const prev = index > 0 ? lights.steps[index - 1] : lights.intro;
      return mixLight(prev, cur, u / SEQ.flight, light);
    }
    return mixLight(cur, cur, 0, light);
  }

  world.onFrame((dt, time) => {
    const reduced = reducedMotion();
    sea.userData.update(dt);
    terrain.userData.update(time);
    if (mode === 'map') {
      const { kind, index, u } = pose;
      const to = index >= 0 ? frames[index] : null;
      const from = pose.afterCrossing ? to : index > 0 ? frames[index - 1] : null;
      const r = rig.update({ kind, from, to, u, reduced }, time);
      state = { ...r, index, kind, ready: true, mode };
      applyLight(world, sky, clouds, currentLight());
      clouds.setAmount(1);
    } else {
      rig.ambient(ambientTarget, time, reduced);
      applyLight(world, sky, clouds, mixLight(ambientLight, ambientLight, 0, light));
      clouds.setAmount(0.6);
      state = { phase: 'ambient', index: -1, ready: true, mode };
    }
    clouds.update(world.camera, time);
    markers.update({
      index: mode === 'map' && pose.kind === 'step' ? pose.index : -1,
      u: pose.u,
      time,
      camera: world.camera,
      width: world.camera.userData.viewWidth,
      height: world.camera.userData.viewHeight,
      mode,
      reduced,
      showSeas:
        mode === 'map' &&
        (pose.kind === 'intro' ||
          pose.kind === 'crossing' ||
          (pose.kind === 'step' && pose.u < SEQ.flight)),
    });
  });

  // Rendu : continu tant que quelque chose bouge et que la 3D est visible ; à la demande sinon
  // (illustration plein cadre par-dessus, mouvement réduit, §12).
  function schedule() {
    const animate = !covered && !reducedMotion();
    world.setContinuous(animate);
    if (!animate) world.requestRender();
  }
  schedule();

  return {
    initMs: performance.now() - t0,
    timings: tex.timings,
    usedWorker: tex.worker,
    world,
    map,
    get state() {
      return state;
    },
    /** Position dans le voyage : { kind: 'intro'|'step'|'crossing'|'end', index, u, afterCrossing } */
    setJourney(p) {
      pose = p;
      if (!world.continuous) world.requestRender();
    },
    /** Mode 'map' (net) ou 'ambient' (dérive au-dessus de `place` {x, y}). */
    setMode(m, { place, light } = {}) {
      mode = m;
      if (place) ambientTarget = toWorld(place.x, place.y, new Vector3()).setY(0.1);
      ambientLight = light ? parseLight(light) : lights.intro;
      if (m !== 'map') covered = false;
      schedule();
    },
    /** Illustration plein cadre par-dessus : inutile de redessiner la 3D. */
    setCovered(c) {
      if (c === covered) return;
      covered = c;
      schedule();
    },
    refreshMotion: schedule,
    stepLight: (i) => steps[i]?.light,
  };
}
