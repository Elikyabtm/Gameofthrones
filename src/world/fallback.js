// Repli sans WebGL (§12) : la carte devient une texture 2D générée (mêmes biomes), qui
// zoome et se déplace en CSS au fil du voyage. Même interface que world.js.
import map from '../data/map.json';
import journey from '../data/journey.json';
import { generateTextures } from './textures.js';

export function initFallback(container) {
  const { color } = generateTextures(map, { width: 1600 });
  const canvas = document.createElement('canvas');
  canvas.width = color.width;
  canvas.height = color.height;
  canvas.getContext('2d').drawImage(color, 0, 0);
  canvas.className = 'world-2d';
  container.querySelector('#world')?.remove();
  container.prepend(canvas);

  let state = { phase: 'intro', index: -1, ready: true, mode: 'map', fallback: true };
  const place = (x, y, zoom) => {
    // Centre le point (x, y) de la carte à l'écran, avec le facteur de zoom donné.
    const tx = 50 - (x / map.bounds.w) * 100;
    const ty = 50 - (y / map.bounds.h) * 100;
    canvas.style.transform = `translate(-50%, -50%) scale(${zoom}) translate(${tx}%, ${ty}%)`;
  };
  place(map.bounds.w / 2, map.bounds.h / 2, 1);

  return {
    fallback: true,
    get state() {
      return state;
    },
    setJourney({ kind, index, u }) {
      const step = journey.steps[index];
      if (kind === 'step' && step) place(step.focus.x, step.focus.y, u > 0.3 ? 4 : 2.5);
      else place(map.bounds.w / 2, map.bounds.h / 2, 1);
      state = { ...state, phase: kind, index, mode: 'map' };
    },
    setMode(mode, { place: p } = {}) {
      if (mode !== 'map' && p) place(p.x, p.y, 2.5);
      state = { ...state, mode };
    },
    setCovered() {},
    refreshMotion() {},
  };
}
