// Séquence d'une étape (§6.2), pilotée par la progression locale u ∈ [0, 1] :
// vol → approche → plongée (fondu 3D → illustration) → dans le lieu → remontée.
import { SEQ } from '../../world/seq.js';

const clamp = (x) => Math.min(1, Math.max(0, x));
const ramp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);

/**
 * Applique l'état visuel d'une étape. Renvoie l'opacité de l'illustration (1 = la 3D est
 * entièrement couverte, on peut cesser de la dessiner).
 */
export function applyStep(el, u, { reduced = false, vertical = false } = {}) {
  const media = (el._media ??= el.querySelector('.step-media'));
  const inner = (el._inner ??= el.querySelector('.step-media-inner'));
  const halo = (el._halo ??= el.querySelector('.step-halo'));
  const content = (el._content ??= el.querySelector('.step-content'));
  const transition = (el._transition ??= el.querySelector('.step-transition'));

  // Illustration : entrée pendant la plongée, sortie pendant la remontée.
  const fadeIn = smooth(ramp(SEQ.approach, SEQ.plunge, u));
  const fadeOut = 1 - smooth(ramp(SEQ.ascent, SEQ.ascent + 0.07, u));
  const opacity = fadeIn * fadeOut;
  media.style.opacity = opacity.toFixed(3);
  media.style.visibility = opacity > 0 ? 'visible' : 'hidden';
  if (reduced) {
    inner.style.transform = '';
    inner.style.filter = '';
  } else {
    // Plongée : échelle 1,15 → 1,0 et flou 8 px → 0 ; puis parallaxe lente 1,0 → 1,06 (±2 %).
    const inPlace = ramp(SEQ.plunge, SEQ.ascent, u);
    const scale = u < SEQ.plunge ? 1.15 - 0.15 * fadeIn : 1 + 0.06 * inPlace;
    const blur = u < SEQ.plunge ? 8 * (1 - fadeIn) : 0;
    const shift = (inPlace - 0.5) * 4 * (el.dataset.side === 'right' ? 1 : -1);
    inner.style.transform = `translate3d(${shift.toFixed(2)}%, 0, 0) scale(${scale.toFixed(4)})`;
    inner.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
    // Halo lumineux au passage dans l'image.
    const h = Math.sin(Math.PI * ramp(SEQ.approach, SEQ.plunge + 0.04, u));
    halo.style.opacity = (h * 0.6).toFixed(3);
  }
  // Texte : posé sur l'image une fois la plongée terminée.
  const textIn = smooth(ramp(SEQ.plunge, SEQ.plunge + 0.05, u));
  const textOut = 1 - smooth(ramp(SEQ.ascent - 0.04, SEQ.ascent, u));
  const t = textIn * textOut;
  content.style.opacity = t.toFixed(3);
  content.style.visibility = t > 0.01 ? 'visible' : 'hidden';
  content.style.transform =
    reduced || vertical ? '' : `translate3d(0, ${((1 - textIn) * 16).toFixed(1)}px, 0)`;
  content.inert = t < 0.5;
  // Phrase de transition : brièvement, pendant la remontée.
  const tr = Math.sin(Math.PI * ramp(SEQ.ascent + 0.02, 1, u));
  transition.style.opacity = tr.toFixed(3);
  return opacity;
}

/** Traversée de la mer Étroite : la mention apparaît au centre pour u ∈ [0,35 ; 0,65]. */
export function applyCrossing(el, u) {
  const label = (el._label ??= el.querySelector('.crossing-label'));
  const t = Math.sin(Math.PI * ramp(0.3, 0.7, u));
  label.style.opacity = t.toFixed(3);
  label.style.letterSpacing = `${(0.42 + 0.12 * ramp(0.3, 0.7, u)).toFixed(3)}em`;
}
