// Une lumière qui suit le voyage (§6.4) : chaque étape définit soleil, ciel, brouillard et
// exposition ; on interpole entre deux étapes pendant les vols.
import { Color, MathUtils, Vector3 } from 'three';
import { LIGHT_SCALE, setSunDirection } from './scene.js';

/** Préréglage JSON → valeurs prêtes à interpoler. */
export function parseLight(l) {
  return {
    sunColor: new Color(l.sunColor),
    sunElevation: l.sunElevation,
    sunAzimuth: l.sunAzimuth,
    skyTop: new Color(l.skyTop),
    skyHorizon: new Color(l.skyHorizon),
    fogColor: new Color(l.fogColor),
    fogDensity: l.fogDensity,
    exposure: l.exposure,
  };
}

const tmp = {
  sunColor: new Color(),
  skyTop: new Color(),
  skyHorizon: new Color(),
  fogColor: new Color(),
};

/** Mélange de deux préréglages (t ∈ [0, 1]), angle d'azimut pris au plus court. */
export function mixLight(a, b, t, out = { ...tmp }) {
  out.sunColor.copy(a.sunColor).lerp(b.sunColor, t);
  out.skyTop.copy(a.skyTop).lerp(b.skyTop, t);
  out.skyHorizon.copy(a.skyHorizon).lerp(b.skyHorizon, t);
  out.fogColor.copy(a.fogColor).lerp(b.fogColor, t);
  out.sunElevation = MathUtils.lerp(a.sunElevation, b.sunElevation, t);
  let dAz = ((b.sunAzimuth - a.sunAzimuth + 540) % 360) - 180;
  out.sunAzimuth = a.sunAzimuth + dAz * t;
  out.fogDensity = MathUtils.lerp(a.fogDensity, b.fogDensity, t);
  out.exposure = MathUtils.lerp(a.exposure, b.exposure, t);
  return out;
}

const sunDir = new Vector3();

/** Applique un éclairage à la scène, au ciel et aux nuages. */
export function applyLight(world, sky, clouds, l) {
  const { sun, hemi, scene, renderer } = world;
  sun.color.copy(l.sunColor);
  // Soleil bas = lumière plus faible et plus chaude ; jamais tout à fait éteint.
  const elev = Math.max(2, l.sunElevation);
  sun.intensity = (1.5 + 0.5 * Math.min(1, elev / 35)) * LIGHT_SCALE;
  setSunDirection(sun, elev, l.sunAzimuth);
  hemi.color.copy(l.skyTop).lerp(l.skyHorizon, 0.5);
  hemi.groundColor.copy(l.fogColor).multiplyScalar(0.35);
  hemi.intensity = (0.75 + 0.35 * Math.max(0, 1 - elev / 20)) * LIGHT_SCALE;
  scene.fog.color.copy(l.fogColor);
  scene.fog.density = l.fogDensity;
  // Exposition du cahier ×0,88 : l'ACES délave vite les étapes très lumineuses.
  renderer.toneMappingExposure = l.exposure * 0.88;
  const u = sky.userData.uniforms;
  u.uTop.value.copy(l.skyTop);
  u.uHorizon.value.copy(l.skyHorizon);
  u.uSunColor.value.copy(l.sunColor);
  u.uSunDir.value.copy(sunDir.copy(sun.position).normalize());
  // Étoiles quand le haut du ciel est presque noir.
  const lum = l.skyTop.r + l.skyTop.g + l.skyTop.b;
  u.uStars.value = MathUtils.clamp((0.25 - lum) / 0.18, 0, 1);
  clouds.setTint(l.skyHorizon);
}
