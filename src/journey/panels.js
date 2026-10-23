// Animation des panneaux d'étape en fonction de la progression locale u (PROJET.md §5.3).
//   u ∈ [0,32 ; 0,48] : apparition (opacité 0 → 1, translateY 24 px → 0)
//   u ∈ [0,48 ; 0,90] : pleinement visible
//   u ∈ [0,90 ; 1]    : fondu de sortie

const clamp01 = (x) => Math.min(1, Math.max(0, x));

/** Opacité et translation verticale (px) d'un panneau à la progression u. */
export function panelVisibility(u, { reducedMotion = false } = {}) {
  const enter = clamp01((u - 0.32) / 0.16);
  const exit = clamp01((u - 0.9) / 0.1);
  const opacity = enter * (1 - exit);
  const translateY = reducedMotion ? 0 : 24 * (1 - enter);
  return { opacity, translateY };
}

/** Applique panelVisibility() à un élément panneau. */
export function applyPanel(panel, u, opts) {
  const { opacity, translateY } = panelVisibility(u, opts);
  panel.style.opacity = opacity.toFixed(3);
  panel.style.transform = translateY ? `translateY(${translateY.toFixed(1)}px)` : '';
  panel.style.visibility = opacity > 0 ? 'visible' : 'hidden';
}
