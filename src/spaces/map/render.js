// Rendu HTML du voyage (§6.1, §6.2) : intro, 19 étapes, traversée et conclusion.
import journey from '../../data/journey.json';
import { esc, footer, ornament } from '../../ui/dom.js';
import { scene } from '../../ui/media.js';

export const STEPS = journey.steps;
const CROSSING_AFTER = STEPS.findIndex((s) => s.slug === journey.crossing.after);

/** Segments de défilement dans l'ordre : étapes et traversée. */
export const SEGMENTS = STEPS.flatMap((s, i) =>
  i === CROSSING_AFTER
    ? [
        { kind: 'step', index: i },
        { kind: 'crossing', index: i + 1 },
      ]
    : [{ kind: 'step', index: i }],
);

function stepArticle(s, i) {
  return `
  <article class="step" id="etape-${s.slug}" data-index="${i}" data-side="${s.textSide ?? 'left'}" aria-labelledby="t-${s.slug}">
    <div class="step-sticky">
      <div class="step-media" aria-hidden="true">
        <div class="step-media-inner">${scene(s.image, s.title, { alt: s.imageAlt, sizes: '100vw' })}</div>
        <div class="step-shade"></div>
        <div class="step-halo"></div>
      </div>
      <div class="step-content">
        <div class="step-text">
          <p class="label step-kicker"><span class="step-num">${esc(s.num)}</span><span class="diamond" aria-hidden="true"></span>${esc(s.region)}</p>
          <h2 id="t-${s.slug}" class="step-title">${esc(s.title)}</h2>
          <p class="step-hook">${esc(s.hook)}</p>
          <div class="step-story">${s.text.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        </div>
        <div class="step-bottom">
          <section class="who" aria-label="Qui vit ici">
            <p class="label">Qui vit ici</p>
            <ul class="who-list" data-step="${i}"></ul>
            <p class="who-summary" aria-live="polite"></p>
          </section>
          <nav class="step-links" aria-label="Pour aller plus loin" data-step="${i}"></nav>
        </div>
      </div>
      <p class="step-transition">${esc(s.transition)}</p>
    </div>
  </article>`;
}

export function renderJourney(root) {
  const { intro, end, crossing } = journey;
  root.innerHTML = `
  <section class="intro" id="intro" aria-labelledby="intro-title">
    <div class="intro-inner">
      <p class="label label-accent">${esc(intro.kicker)}</p>
      ${ornament('fleuron', 'intro-fleuron')}
      <h1 id="intro-title" class="intro-title">${esc(intro.title)}</h1>
      <p class="intro-hook">${esc(intro.hook)}</p>
      <button type="button" class="btn btn-accent intro-cta">${esc(intro.cta)}</button>
      <p class="intro-scroll label" aria-hidden="true">Faites défiler</p>
    </div>
  </section>
  <h2 class="visually-hidden">Les étapes du voyage</h2>
  ${SEGMENTS.map((seg) =>
    seg.kind === 'crossing'
      ? `<section class="crossing" aria-label="${esc(crossing.label)}"><div class="crossing-sticky"><p class="crossing-label">${esc(
          crossing.label,
        )}</p></div></section>`
      : stepArticle(STEPS[seg.index], seg.index),
  ).join('')}
  <section class="journey-end" id="fin" aria-labelledby="end-title">
    <div class="end-inner">
      <p class="label label-accent">${esc(end.kicker)}</p>
      ${ornament('fleuron', 'intro-fleuron')}
      <h2 id="end-title" class="end-title">${esc(end.title)}</h2>
      <p class="end-text">${esc(end.text)}</p>
      <ul class="doors">${end.doors
        .map(
          (d) => `<li><a class="door" href="${d.href}">
            ${scene(d.image, d.label, { alt: '', sizes: '(max-width: 700px) 100vw, 33vw', cls: 'door-img' })}
            <span class="door-label">${esc(d.label)}</span>
            <span class="door-text">${esc(d.text)}</span>
          </a></li>`,
        )
        .join('')}</ul>
    </div>
    ${footer()}
  </section>`;
  return {
    intro: root.querySelector('.intro'),
    segments: [...root.querySelectorAll('.step, .crossing')],
    end: root.querySelector('.journey-end'),
  };
}
