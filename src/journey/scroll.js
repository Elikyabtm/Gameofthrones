// Étape courante et progression locale depuis le scroll (PROJET.md §5.3).
// Une seule écoute de scroll, passive ; le calcul est fait dans requestAnimationFrame.

export const PALIER_START = 0.48; // début du palier « lisible » : panneau pleinement visible

/**
 * Progression locale d'un article :
 *   u = clamp((scrollY + innerHeight − article.offsetTop) / article.offsetHeight, 0, 1)
 * u = 0 quand le haut de l'article atteint le bas de l'écran, u = 1 quand son bas l'atteint.
 * Formule du cahier conservée telle quelle : les articles étant contigus, le bas de l'un
 * coïncide avec le haut du suivant, donc à tout instant un seul article a u ∈ ]0, 1[ et
 * les étapes se relaient sans chevauchement ni trou.
 */
export function localProgress(article, scrollY = window.scrollY, vh = window.innerHeight) {
  const u = (scrollY + vh - article.offsetTop) / article.offsetHeight;
  return Math.min(1, Math.max(0, u));
}

/** Position de scroll qui place un article à la progression `u`. */
export function scrollYFor(article, u, vh = window.innerHeight) {
  return article.offsetTop + u * article.offsetHeight - vh;
}

/** Défile jusqu'au palier d'un article (u = 0,48), avec ou sans animation. */
export function scrollToStep(article, { smooth = true, u = PALIER_START } = {}) {
  window.scrollTo({ top: scrollYFor(article, u), behavior: smooth ? 'smooth' : 'instant' });
}

/**
 * Suit le scroll et appelle `onUpdate({ index, u, article })` à chaque image où il change.
 * index = −1 tant que le premier article n'a pas commencé (intro).
 * `onStepChange(index, previous)` est appelé quand l'étape courante change.
 */
export function createScrollDriver(articles, { onUpdate, onStepChange, updateUrl = true } = {}) {
  let index = -2;
  let frame = 0;

  function compute() {
    frame = 0;
    const y = window.scrollY;
    const vh = window.innerHeight;
    // Dernier article déjà entamé (u > 0), sinon l'intro.
    let i = -1;
    for (let k = 0; k < articles.length; k++) {
      if (y + vh > articles[k].offsetTop) i = k;
    }
    const u = i < 0 ? 0 : localProgress(articles[i], y, vh);
    if (i !== index) {
      const previous = index;
      index = i;
      if (updateUrl) {
        const id = i < 0 ? '' : articles[i].id;
        history.replaceState(null, '', id ? `#${id}` : location.pathname + location.search);
      }
      onStepChange?.(i, previous);
    }
    onUpdate?.({ index: i, u, article: articles[i] ?? null });
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(compute);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);

  // Au chargement : #etape-xxx → début du palier de cette étape, sans animation.
  // Le navigateur saute lui-même à l'ancre (haut de l'article en haut de l'écran, soit
  // u ≈ 0,62) et peut restaurer un ancien scroll : on reprend la main, puis on repositionne
  // une fois la page chargée, au cas où ce saut natif arriverait après nous.
  const fromHash = articles.find((a) => `#${a.id}` === location.hash);
  if (fromHash) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const place = () => scrollToStep(fromHash, { smooth: false });
    place();
    if (document.readyState !== 'complete') window.addEventListener('load', place, { once: true });
    requestAnimationFrame(place);
  }
  compute();

  return {
    get index() {
      return index;
    },
    refresh: compute,
    goTo(i, opts) {
      const a = articles[Math.max(0, Math.min(articles.length - 1, i))];
      if (a) scrollToStep(a, opts);
    },
  };
}
