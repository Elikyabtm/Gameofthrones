// Caméra du voyage (§6.2, §6.3) : inclinée de 30 à 40° au-dessus de l'horizon, jamais à la
// verticale. Chaque étape a un cadrage haut (vol, horizon visible) et un cadrage rapproché
// (arrivée). Pur calcul : aucune lecture du DOM ni du scroll.
import { MathUtils, Vector3 } from 'three';
import { toWorld } from './scene.js';
import { SEQ } from './seq.js';

export { SEQ };

export const DEFAULT_CAMERA = { dist: 3.6, height: 2.6, azimuth: 0 }; // ≈ 36° d'inclinaison
const DRIFT_DEG = 3; // dérive d'azimut en palier : ±3°
const DRIFT_PERIOD = 18; // secondes pour un aller-retour complet

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ease = (a, b, x) => easeInOutCubic(MathUtils.clamp((x - a) / (b - a), 0, 1));

function frameAt(x, y, { dist, height, azimuth }, id) {
  const target = toWorld(x, y);
  target.y = 0.05;
  const position = new Vector3(
    target.x + Math.sin(azimuth) * dist,
    target.y + height,
    target.z + Math.cos(azimuth) * dist,
  );
  return { id, target, position };
}

/**
 * Cadrages d'une étape : `high` (vol) et `close` (arrivée : hauteur divisée par 3).
 * `vertical` (mobile, portrait) : on recule de 30 % pour garder le lieu dans le cadre.
 */
export function stepFrames(step, { vertical = false } = {}) {
  const cam = { ...DEFAULT_CAMERA, ...step.camera };
  const k = vertical ? 1.3 : 1;
  const high = frameAt(
    step.focus.x,
    step.focus.y,
    { ...cam, dist: cam.dist * k, height: cam.height * k },
    step.slug,
  );
  const close = frameAt(
    step.focus.x,
    step.focus.y,
    { ...cam, dist: (cam.dist * k) / 3, height: (cam.height * k) / 3 },
    step.slug,
  );
  const closest = frameAt(
    step.focus.x,
    step.focus.y,
    { ...cam, dist: (cam.dist * k) / 4, height: (cam.height * k) / 4.2 },
    step.slug,
  );
  return { id: step.slug, high, close, closest, arc: step.arc ?? 'normal' };
}

/** Intro : le monde entier sous les nuages, vu de très haut (horizon juste visible). */
export function introFrame(map, { vertical = false } = {}) {
  const target = toWorld(map.bounds.w * 0.47, map.bounds.h * 0.5);
  const k = vertical ? 1.5 : 1;
  return {
    id: 'intro',
    target,
    position: new Vector3(target.x, 21 * k, target.z + 19 * k),
  };
}

/** Vol de A vers B (t ∈ [0, 1]) : easeInOutCubic et arc sin(πt) × hArc. */
export function flight(a, b, t, arc, out) {
  const e = easeInOutCubic(t);
  out.position.lerpVectors(a.position, b.position, e);
  out.target.lerpVectors(a.target, b.target, e);
  let hArc = MathUtils.clamp(0.3 * a.target.distanceTo(b.target), 0.8, 6);
  if (arc === 'high') hArc = Math.max(7.5, hArc); // au-dessus de la couche haute des nuages
  out.position.y += Math.sin(Math.PI * t) * hArc;
  return hArc;
}

function lerpFrame(a, b, t, out) {
  out.position.lerpVectors(a.position, b.position, t);
  out.target.lerpVectors(a.target, b.target, t);
}

/**
 * Pose la caméra.
 * @param {object} p { kind: 'intro'|'step'|'crossing'|'end', from, to, u }
 *   from/to : cadrages d'étape (stepFrames) ; pour 'crossing', vol complet de from vers to.
 */
export function createCameraRig(camera, intro) {
  const pose = { position: new Vector3(), target: new Vector3() };
  const tmp = new Vector3();

  function update({ kind, from, to, u = 0, reduced = false }, time = 0) {
    let phase = kind;
    let t = 0;
    if (kind === 'intro' || !to) {
      lerpFrame(intro, intro, 0, pose);
      phase = 'intro';
    } else if (kind === 'crossing') {
      const a = from?.high ?? intro;
      if (reduced) lerpFrame(u < 0.5 ? a : to.high, to.high, 0, pose);
      else flight(a, to.high, u, 'high', pose);
      t = u;
    } else if (kind === 'end') {
      // Conclusion : la caméra remonte lentement au-dessus des ruines.
      lerpFrame(to.high, intro, ease(0, 1, u) * 0.35, pose);
    } else if (reduced) {
      // Mouvement réduit : coupe directe sur le cadrage rapproché (fondu géré par l'interface).
      lerpFrame(to.close, to.close, 0, pose);
      phase = u < SEQ.ascent ? 'palier' : 'remontee';
    } else if (u < SEQ.flight) {
      const a = from?.high ?? intro;
      t = u / SEQ.flight;
      if (from && from.id === to.id) lerpFrame(a, to.high, 1, pose);
      else flight(a, to.high, t, to.arc, pose);
      phase = 'vol';
    } else if (u < SEQ.approach) {
      lerpFrame(to.high, to.close, ease(SEQ.flight, SEQ.approach, u), pose);
      phase = 'approche';
    } else if (u < SEQ.ascent) {
      lerpFrame(to.close, to.closest, ease(SEQ.approach, SEQ.ascent - 0.1, u), pose);
      phase = u < SEQ.plunge ? 'plongee' : 'palier';
    } else {
      lerpFrame(to.closest, to.high, ease(SEQ.ascent, 1, u), pose);
      phase = 'remontee';
    }
    // Légère dérive d'azimut autour de la cible, hors vol (sauf mouvement réduit).
    if (!reduced && kind === 'step' && u >= SEQ.flight) {
      const angle = MathUtils.degToRad(DRIFT_DEG) * Math.sin((time / DRIFT_PERIOD) * Math.PI * 2);
      tmp.subVectors(pose.position, pose.target).applyAxisAngle(camera.up, angle);
      pose.position.copy(pose.target).add(tmp);
    }
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    return { phase, t, cameraY: pose.position.y };
  }

  /** Dérive lente au-dessus d'un point (espaces assombris, §4.3). */
  function ambient(target, time, reduced) {
    const a = reduced ? 0.4 : 0.4 + time * 0.012;
    pose.target.copy(target);
    pose.position.set(target.x + Math.sin(a) * 3.2, target.y + 2.3, target.z + Math.cos(a) * 3.2);
    camera.position.lerp(pose.position, reduced ? 1 : 0.02);
    tmp.copy(camera.userData.lookAt ?? target).lerp(target, reduced ? 1 : 0.02);
    camera.userData.lookAt = tmp.clone();
    camera.lookAt(tmp);
  }

  return { update, ambient };
}
