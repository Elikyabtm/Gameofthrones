// Renderer, scène, caméra, lumières, brouillard et boucle de rendu (PROJET.md §4.4).
// toWorld() est LA conversion carte → monde 3D, à utiliser partout.
import {
  ACESFilmicToneMapping,
  Color,
  DirectionalLight,
  FogExp2,
  HemisphereLight,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

export const BG = 0x0a1012;

// Les intensités du cahier (soleil 2,2, ciel 0,35) suivent l'ancienne convention de Three.js,
// qui multipliait les lumières par π. Depuis r155, l'éclairage est physique : on applique ce
// facteur pour retrouver le rendu prévu (sans lui, la carte est quasi noire).
export const LIGHT_SCALE = Math.PI;

/** Coordonnées carte (x, y) → monde (X, 0, Z). X = (x − 410) / 80, Z = (y − 590) / 80. */
export function toWorld(x, y, out = new Vector3()) {
  return out.set((x - 410) / 80, 0, (y - 590) / 80);
}

/** Profil « mobile » (§4.2) : petit écran ou peu de cœurs → textures et maillage réduits. */
export function isLowEnd() {
  return window.innerWidth < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;
}

/** Direction du soleil : élévation en degrés, venant du sud-ouest (azimut 225°). */
export function setSunDirection(sun, elevationDeg, azimuthDeg = 225) {
  const el = (elevationDeg * Math.PI) / 180;
  const az = (azimuthDeg * Math.PI) / 180;
  // Azimut compté depuis le nord (−Z), dans le sens horaire : 225° = sud-ouest (−X, +Z).
  sun.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.position.multiplyScalar(30);
}

/**
 * Crée le renderer et la scène. Lève une erreur si WebGL est indisponible
 * (le repli 2D de fallback.js prendra le relais en phase 7).
 */
export function createScene(canvas, { lowEnd = isLowEnd() } = {}) {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowEnd ? 1.5 : 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.background = new Color(BG);
  scene.fog = new FogExp2(BG, 0.045);

  const camera = new PerspectiveCamera(35, 1, 0.1, 80);

  // Lumière chaude très rasante venant du sud-ouest, ciel froid discret, sans ombres portées.
  const sun = new DirectionalLight(0xffd9a0, 2.2 * LIGHT_SCALE);
  setSunDirection(sun, 18);
  scene.add(sun, sun.target);
  const hemi = new HemisphereLight(0x8fb3c0, BG, 0.35 * LIGHT_SCALE);
  scene.add(hemi);

  // Boucle de rendu. `continuous` : rendu à chaque image ; sinon seulement sur demande.
  const frameCallbacks = new Set();
  let continuous = false;
  let pending = false;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    for (const cb of frameCallbacks) cb(dt, now / 1000);
    renderer.render(scene, camera);
    pending = false;
    if (!continuous) renderer.setAnimationLoop(null);
  }

  const api = {
    renderer,
    scene,
    camera,
    sun,
    hemi,
    lowEnd,
    onFrame(cb) {
      frameCallbacks.add(cb);
      return () => frameCallbacks.delete(cb);
    },
    requestRender() {
      if (pending || continuous) return;
      pending = true;
      last = performance.now();
      renderer.setAnimationLoop(frame);
    },
    setContinuous(on) {
      continuous = on;
      if (on) {
        last = performance.now();
        renderer.setAnimationLoop(frame);
      }
    },
    resize() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      api.requestRender();
    },
  };

  window.addEventListener('resize', api.resize);
  // Onglet caché : la boucle s'arrête ; elle reprend au retour (§9).
  let wasContinuous = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      wasContinuous = continuous;
      continuous = false;
      renderer.setAnimationLoop(null);
    } else if (wasContinuous) {
      api.setContinuous(true);
    } else {
      api.requestRender();
    }
  });
  api.resize();
  return api;
}
