// Cadrages, interpolation, arcs et paliers de la caméra (PROJET.md §5.1-5.2).
// Pur calcul (Three.js seulement pour les vecteurs) : aucune lecture du DOM ni du scroll.
import { MathUtils, Vector3 } from 'three';
import { toWorld } from './scene.js';

export const DEFAULT_CAMERA = { dist: 3.6, height: 3.2, azimuth: 0 };
export const FLIGHT_END = 0.4; // u ∈ [0, 0.40] : vol ; u ∈ [0.40, 1] : palier (§5.3)
export const OFFSET = 0.18; // décalage du centre optique : ±18 % de la largeur (§5.1)
const DRIFT_DEG = 3; // dérive d'azimut en palier : ±3°
const DRIFT_PERIOD = 18; // secondes pour un aller-retour complet

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Point visé d'une étape : { city: 'Winterfell' } ou { x, y } en coordonnées carte. */
export function focusPoint(focus, map) {
  if (focus.city) {
    const c = map.cities.find((city) => city.name === focus.city);
    if (!c) throw new Error(`Cité inconnue dans focus : ${focus.city}`);
    return { x: c.x, y: c.y };
  }
  return { x: focus.x, y: focus.y };
}

/**
 * Cadrage d'une étape : cible à y = 0,2, caméra au sud du lieu, regard vers le nord.
 * `side` : côté du panneau ('left' | 'right' | null) → décalage optique horizontal.
 */
export function stepFrame(step, map, { side = null, vertical = false } = {}) {
  const cam = { ...DEFAULT_CAMERA, ...step.camera };
  // Écran étroit (mobile, portrait) : champ horizontal réduit, on recule la caméra de 30 %.
  const k = vertical ? 1.3 : 1;
  const [dist, height, azimuth] = [cam.dist * k, cam.height * k, cam.azimuth];
  const { x, y } = focusPoint(step.focus, map);
  const target = toWorld(x, y);
  target.y = 0.2;
  const position = new Vector3(
    target.x + Math.sin(azimuth) * dist,
    target.y + height,
    target.z + Math.cos(azimuth) * dist,
  );
  return {
    id: step.id,
    target,
    position,
    arc: step.arc ?? 'normal',
    offset: viewOffset(side, vertical),
  };
}

/**
 * Décalage du lieu visé à l'écran, en fractions de la vue (+x vers la droite, +y vers le bas).
 * Panneau à gauche → lieu dans le tiers droit (+18 % de la largeur), et inversement.
 * Sur mobile (`vertical`), le panneau est en bas : le lieu remonte dans le tiers supérieur.
 */
export function viewOffset(side, vertical = false) {
  if (vertical) return { x: 0, y: side ? -0.17 : 0 };
  if (side === 'left') return { x: OFFSET, y: 0 };
  if (side === 'right') return { x: -OFFSET, y: 0 };
  return { x: 0, y: 0 };
}

/** Intro : tout le monde visible sous les nuages (§5.1). */
export function introFrame(map) {
  const target = toWorld(map.bounds.w / 2, map.bounds.h / 2);
  return {
    id: 'intro',
    target,
    position: new Vector3(target.x, 22, target.z + 10),
    arc: 'normal',
    offset: { x: 0, y: 0 },
  };
}

/**
 * Vol de A vers B à t ∈ [0, 1] (§5.2) : positions et cibles en easeInOutCubic, plus un arc
 * position.y += sin(π t) × hArc, avec hArc = clamp(0,35 × distance(A, B), 1, 6), au moins 6,5
 * pour une traversée (arc 'high' : la caméra passe au-dessus des nuages).
 */
export function flight(a, b, t, out = { position: new Vector3(), target: new Vector3() }) {
  const e = easeInOutCubic(t);
  out.position.lerpVectors(a.position, b.position, e);
  out.target.lerpVectors(a.target, b.target, e);
  let hArc = MathUtils.clamp(0.35 * a.target.distanceTo(b.target), 1.0, 6.0);
  if (b.arc === 'high') hArc = Math.max(6.5, hArc);
  out.position.y += Math.sin(Math.PI * t) * hArc;
  out.offset = {
    x: MathUtils.lerp(a.offset.x, b.offset.x, e),
    y: MathUtils.lerp(a.offset.y, b.offset.y, e),
  };
  out.arcHeight = hArc;
  return out;
}

/**
 * Pose la caméra pour une étape `index` (−1 = intro) à la progression locale `u`.
 * Renvoie l'état (vol ou palier) pour l'interface et les vérifications.
 */
export function createCameraRig(camera, frames, intro, { reducedMotion = false } = {}) {
  const pose = { position: new Vector3(), target: new Vector3(), offset: { x: 0, y: 0 } };
  const tmp = new Vector3();

  function applyOffset({ x, y }) {
    const w = camera.userData.viewWidth ?? 1;
    const h = camera.userData.viewHeight ?? 1;
    if (x === 0 && y === 0) camera.clearViewOffset();
    // La fenêtre de rendu glisse de −x × largeur : le point visé apparaît décalé de +x.
    // La caméra reste orientée droit vers sa cible (§5.1).
    else camera.setViewOffset(w, h, -x * w, -y * h, w, h);
  }

  function update(index, u, time = 0) {
    const to = index < 0 ? intro : frames[index];
    const from = index <= 0 ? intro : frames[index - 1];
    let state;
    if (index < 0) {
      pose.position.copy(intro.position);
      pose.target.copy(intro.target);
      pose.offset = intro.offset;
      state = { phase: 'intro', t: 0 };
    } else if (!reducedMotion && u < FLIGHT_END) {
      // Vol : t = u / 0,40.
      const t = u / FLIGHT_END;
      flight(from, to, t, pose);
      state = { phase: 'vol', t, arcHeight: pose.arcHeight };
    } else {
      // Palier (ou coupe directe en reduced-motion) : légère dérive d'azimut autour de la cible.
      pose.position.copy(to.position);
      pose.target.copy(to.target);
      pose.offset = to.offset;
      if (!reducedMotion) {
        const ramp = MathUtils.smoothstep(u, FLIGHT_END, FLIGHT_END + 0.1);
        const angle = MathUtils.degToRad(DRIFT_DEG) * Math.sin((time / DRIFT_PERIOD) * Math.PI * 2);
        tmp.subVectors(pose.position, pose.target).applyAxisAngle(camera.up, angle * ramp);
        pose.position.copy(pose.target).add(tmp);
      }
      state = { phase: 'palier', t: 1 };
    }
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    applyOffset(pose.offset);
    return { index, u, id: to.id, ...state, cameraY: pose.position.y };
  }

  return { update };
}
