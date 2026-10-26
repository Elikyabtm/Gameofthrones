// Espace Carte (§6) : le voyage au défilement. Calcule la progression de chaque segment,
// pilote le monde 3D, la plongée dans l'illustration, l'URL, la barre du bas et le clavier.
import journey from '../../data/journey.json';
import { router } from '../../core/router.js';
import { applyCrossing, applyStep } from './sequence.js';
import { renderJourney, SEGMENTS, STEPS } from './render.js';
import { bindWhoHover, renderWho } from './who.js';
import { SEQ } from '../../world/seq.js';

const PALIER = SEQ.plunge + 0.08; // palier « dans le lieu », texte entièrement apparu
const SOUND_ZONE = {
  'au-dela-du-mur': 'vent',
  'le-mur': 'vent',
  winterfell: 'vent',
  'iles-de-fer': 'ressac',
  'port-real': 'ville',
  braavos: 'ressac',
  valyria: 'grondement',
};

export async function mount(root, route, ctx) {
  const { store, chrome, menu, announce, setMeta } = ctx;
  root.classList.add('space-map');
  const els = renderJourney(root);
  bindWhoHover(root);
  renderWho(root, store.season);

  let metrics = [];
  const measure = () => {
    const y = scrollY;
    metrics = els.segments.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + y, height: el.offsetHeight };
    });
  };
  const reduced = () => store.get('reducedMotion');
  const vertical = () => innerWidth < 700;

  /** Position de défilement de l'étape i à la progression u. */
  function scrollYFor(i, u = PALIER) {
    const segIdx = SEGMENTS.findIndex((s) => s.kind === 'step' && s.index === i);
    const m = metrics[segIdx];
    return Math.round(m.top + u * (m.height - innerHeight));
  }

  let current = -1; // étape courante (index dans STEPS)
  let state = { kind: 'intro', index: -1, u: 0 };

  function compute() {
    const y = scrollY;
    const vh = innerHeight;
    let seg = null;
    let u = 0;
    for (let k = 0; k < metrics.length; k++) {
      const m = metrics[k];
      const range = m.height - vh;
      if (y >= m.top - vh * 0.001 && y < m.top + range) {
        seg = SEGMENTS[k];
        u = Math.min(1, Math.max(0, (y - m.top) / range));
        break;
      }
      if (y >= m.top + range && k === metrics.length - 1) {
        seg = { kind: 'end', index: STEPS.length - 1 };
        u = Math.min(1, (y - m.top - range) / vh);
      }
    }
    if (!seg) return { kind: y < (metrics[0]?.top ?? 0) ? 'intro' : 'step', index: -1, u: 0 };
    return { ...seg, u };
  }

  function apply() {
    const s = compute();
    state = s;
    const opts = { reduced: reduced(), vertical: vertical() };
    let covered = false;
    els.segments.forEach((el, k) => {
      const seg = SEGMENTS[k];
      const active = seg.kind === s.kind && seg.index === s.index;
      if (seg.kind === 'crossing') applyCrossing(el, active ? s.u : 0);
      else if (active) covered = applyStep(el, s.u, opts) > 0.999;
      else if (el._lastU !== 0) applyStep(el, 0, opts);
      el._lastU = active ? s.u : 0;
    });
    const w = ctx.world;
    if (w) {
      w.setJourney({
        kind: s.kind,
        index: s.index,
        u: s.u,
        afterCrossing:
          SEGMENTS[SEGMENTS.findIndex((g) => g.kind === s.kind && g.index === s.index) - 1]
            ?.kind === 'crossing' && s.kind === 'step',
      });
      w.setCovered(covered);
    }
    const step =
      s.kind === 'step' || s.kind === 'end' ? s.index : s.kind === 'crossing' ? s.index : -1;
    if (step !== current) setStep(step, s.kind);
  }

  function setStep(i, kind) {
    current = i;
    const s = STEPS[i];
    if (i < 0 || !s) {
      chrome.setBar({
        title: 'Introduction',
        next: { href: `/carte/${STEPS[0].slug}`, label: STEPS[0].title },
        count: `00 / ${STEPS.length}`,
      });
      router.replace('/');
      setMeta(null, null);
      ctx.audio.setZone('nappe');
      return;
    }
    const prev = STEPS[i - 1];
    const next = STEPS[i + 1];
    chrome.setBar({
      prev: prev
        ? { href: `/carte/${prev.slug}`, label: prev.title }
        : { href: '/', label: 'Introduction' },
      title: kind === 'crossing' ? journey.crossing.label : s.title,
      next: next ? { href: `/carte/${next.slug}`, label: next.title } : null,
      count: `${s.num} / ${STEPS.length}`,
    });
    menu.setStep(s.slug);
    if (location.pathname !== `/carte/${s.slug}`) router.replace(`/carte/${s.slug}`);
    setMeta(`${s.title} · Carte`, s.hook);
    announce(`Étape ${s.num} sur ${STEPS.length} : ${s.title}`);
    ctx.audio.setZone(SOUND_ZONE[s.slug] ?? 'nappe');
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      apply();
    });
  };
  const onResize = () => {
    measure();
    apply();
  };

  /** Va au palier « dans le lieu » d'une étape (clavier, liens, URL directe). */
  function goTo(i, { smooth = !reduced() } = {}) {
    if (i < 0) return scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'instant' });
    const k = Math.max(0, Math.min(STEPS.length - 1, i));
    scrollTo({ top: scrollYFor(k), behavior: smooth ? 'smooth' : 'instant' });
  }

  // Clavier (§6.2) : → / PageDown / Espace et ← / PageUp, sauf dans un champ ou une modale.
  const onKey = (e) => {
    if (document.documentElement.classList.contains('has-modal')) return;
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(document.activeElement?.tagName) && e.key === ' ')
      return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName)) return;
    const fwd = ['ArrowRight', 'PageDown', ' '].includes(e.key);
    const back = ['ArrowLeft', 'PageUp'].includes(e.key);
    if (!fwd && !back) return;
    if (state.kind === 'end' && fwd) return;
    e.preventDefault();
    let base = current;
    // Avant le palier de l'étape courante, « suivant » mène d'abord à ce palier.
    if (fwd && state.kind === 'step' && state.u < PALIER - 0.01 && current >= 0)
      return goTo(current);
    if (state.kind === 'crossing') base = fwd ? current - 1 : current;
    goTo(fwd ? base + 1 : base - 1);
  };

  // Liens internes vers /carte/... : on défile plutôt que de recharger l'espace.
  root.querySelector('.intro-cta').addEventListener('click', async () => {
    if (!store.hasChosenSeason) {
      const v = await ctx.picker.open({ first: true });
      if (v == null) return;
    }
    goTo(0);
  });

  measure();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onResize);
  addEventListener('keydown', onKey);
  // Les images chargées tardivement ne changent pas la hauteur (sections en vh) ; on remesure
  // tout de même après le chargement des polices.
  document.fonts?.ready.then(onResize);

  function jumpTo(r) {
    if (r.view === 'step') {
      const i = STEPS.findIndex((s) => s.slug === r.params.step);
      if (i >= 0) goTo(i, { smooth: false });
      else return false;
    } else scrollTo({ top: 0, behavior: 'instant' });
    return true;
  }
  history.scrollRestoration = 'manual';
  if (!jumpTo(route)) router.replace('/');
  apply();
  ctx.worldReady.then((w) => {
    w.setMode('map');
    apply();
  });
  ctx.world?.setMode('map');

  return {
    get state() {
      return {
        ...state,
        step: current,
        slug: STEPS[current]?.slug ?? null,
        world: ctx.world?.state ?? null,
      };
    },
    goTo,
    update(r) {
      // Nouveau lien /carte/... alors que la carte est déjà affichée.
      if (r.view === 'step') {
        const i = STEPS.findIndex((s) => s.slug === r.params.step);
        if (i >= 0 && i !== current) goTo(i);
      } else if (r.view === 'intro' && current !== -1) goTo(-1);
    },
    refresh() {
      return renderWho(root, store.season);
    },
    unmount() {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      removeEventListener('keydown', onKey);
      root.classList.remove('space-map');
      ctx.world?.setCovered(false);
    },
  };
}
