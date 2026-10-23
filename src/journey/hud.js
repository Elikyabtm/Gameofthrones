// Barre du bas, frise de progression et navigation clavier (PROJET.md §8.4, §9).
import { escapeHtml } from './render.js';

const isTyping = (el) =>
  el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/**
 * @param {object} o { steps, total, goTo(index), toIntro() }
 * @returns {{ update(index) }}
 */
export function initHud({ steps, total, goTo, toIntro }) {
  const root = document.querySelector('.hud-bottom');
  const prev = root.querySelector('.hud-prev');
  const next = root.querySelector('.hud-next');
  const num = root.querySelector('.hud-num');
  root.querySelector('.hud-total').textContent = String(total).padStart(2, '0');

  // Frise : intro + une entrée par étape.
  const track = root.querySelector('.hud-track');
  const entries = [{ num: '00', place: 'Introduction' }, ...steps];
  track.innerHTML = entries
    .map(
      (s, k) => `<li><button type="button" data-goto="${k - 1}" data-name="${escapeHtml(s.place)}"
        aria-label="${k ? `Étape ${s.num} : ${escapeHtml(s.place)}` : 'Retour à l’introduction'}"></button></li>`,
    )
    .join('');
  const dots = [...track.querySelectorAll('button')];

  let current = -1;
  const go = (i) => (i < 0 ? toIntro() : goTo(Math.min(i, steps.length - 1)));
  track.addEventListener('click', (e) => {
    const b = e.target.closest('[data-goto]');
    if (b) go(Number(b.dataset.goto));
  });
  prev.addEventListener('click', () => go(current - 1));
  next.addEventListener('click', () => go(current + 1));

  // Clavier : → / PageDown = étape suivante, ← / PageUp = précédente, dans le voyage
  // seulement, et jamais quand le focus est dans un champ, la modale ou le menu.
  document.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
    if (document.getElementById('archive').open || !document.getElementById('menu').hidden) return;
    if (document.documentElement.classList.contains('is-in-annexes')) return;
    const forward = e.key === 'ArrowRight' || e.key === 'PageDown';
    const backward = e.key === 'ArrowLeft' || e.key === 'PageUp';
    if (!forward && !backward) return;
    if (forward && current >= steps.length - 1) return;
    if (backward && current < 0) return;
    e.preventDefault();
    go(current + (forward ? 1 : -1));
  });

  // Annexes à l'écran : barre masquée (§8.4).
  const annexes = document.getElementById('annexes');
  new IntersectionObserver(
    ([entry]) => document.documentElement.classList.toggle('is-in-annexes', entry.isIntersecting),
    { rootMargin: '0px 0px -40% 0px' },
  ).observe(annexes);

  function update(index) {
    current = index;
    document.documentElement.classList.toggle('is-past-intro', index >= 0);
    const step = steps[index];
    num.textContent = step ? step.num : '00';
    const before = index - 1 >= 0 ? steps[index - 1].place : 'Introduction';
    const after = steps[index + 1]?.place;
    prev.hidden = index < 0;
    prev.innerHTML = `<span aria-hidden="true" class="a-long">←</span><span aria-hidden="true" class="a-short">‹</span> <span class="hud-prev-name">${escapeHtml(before)}</span>`;
    prev.setAttribute('aria-label', `Étape précédente : ${before}`);
    next.hidden = !after;
    next.innerHTML = `<span class="hud-next-name">${escapeHtml(after ?? '')}</span> <span aria-hidden="true" class="a-long">→</span><span aria-hidden="true" class="a-short">›</span>`;
    next.setAttribute('aria-label', `Étape suivante : ${after ?? ''}`);
    dots.forEach((d, k) => {
      if (k - 1 === index) d.setAttribute('aria-current', 'step');
      else d.removeAttribute('aria-current');
    });
  }
  update(-1);
  return { update };
}
