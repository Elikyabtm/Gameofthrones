// Monde 3D du voyage : scène, terrain, mer, maquettes, forêts, caméra et marqueurs.
// Chargé à part (import dynamique) : le texte du voyage s'affiche avant Three.js.
import map from '../data/map.json';
import { createScene, isLowEnd } from './scene.js';
import { generateTextures } from './textures.js';
import { createTerrain } from './terrain.js';
import { createSea } from './sea.js';
import { createMiniatures } from './miniatures/index.js';
import { createForests } from './forests.js';
import { createCameraRig, introFrame, stepFrame } from './camera-path.js';
import { createMarkers } from './markers.js';

/**
 * @param {object} o { canvas, labelsRoot, steps, sides, placeTitle, reducedMotion }
 * @returns {{ setScroll(s), state, world }}
 */
export function initWorld({ canvas, labelsRoot, steps, sides, placeTitle, reducedMotion }) {
  const lowEnd = isLowEnd();
  const vertical = window.innerWidth < 700;
  const world = createScene(canvas, { lowEnd });

  const t0 = performance.now();
  const tex = generateTextures(map, { width: lowEnd ? 2048 : 4096 });
  const terrain = createTerrain(map, tex, world.renderer, { lowEnd });
  const sea = createSea(map, { reducedMotion, heightTexture: terrain.material.displacementMap });
  world.scene.add(terrain, sea, createMiniatures(map, tex.fields), createForests(map, tex.fields));
  const initMs = performance.now() - t0;

  const frames = steps.map((s, i) => stepFrame(s, map, { side: sides[i], vertical }));
  const rig = createCameraRig(world.camera, frames, introFrame(map), { reducedMotion });
  const markers = createMarkers({
    scene: world.scene,
    map,
    fields: tex.fields,
    steps,
    labelsRoot,
    placeTitle,
    reducedMotion,
  });

  let scroll = { index: -1, u: 0 };
  let state = null;
  world.onFrame((dt, time) => {
    sea.userData.update(dt);
    state = rig.update(scroll.index, scroll.u, time);
    markers.update({
      index: scroll.index,
      u: scroll.u,
      time,
      camera: world.camera,
      width: world.camera.userData.viewWidth,
      height: world.camera.userData.viewHeight,
    });
  });
  // Phase 7 : rendu à la demande. Pour l'instant, rendu continu (mer, dérive, pulsation).
  world.setContinuous(true);

  return {
    world,
    initMs,
    setScroll(s) {
      scroll = s;
    },
    get state() {
      return state;
    },
  };
}
