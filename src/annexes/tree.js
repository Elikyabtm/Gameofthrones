// Arbre généalogique (PROJET.md §12, phase 5) : familles en colonnes, liens en SVG,
// recherche, zoom et vue d'ensemble, révélations désactivées par défaut (anti-spoilers).
import { families, people, special, unions } from '../content/people.js';
import BIOS from '../content/bios.js';
import { escapeHtml } from '../journey/render.js';
import { CARD_H, CARD_W, layoutTree } from './tree-layout.js';

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.4;
const READABLE = 0.92; // en dessous, noms et rôles passeraient sous 11 px : on les masque
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const byId = Object.fromEntries(
  people.map((p) => [p.id, { ...p, bio: p.bio || BIOS[p.id] || '' }]),
);
const familyName = Object.fromEntries(families.map((f) => [f.id, f.name]));
const layout = layoutTree({ families, people, unions, special });

// Visibilité des liens selon les options : 'public' = version officielle (masquée quand on
// révèle les secrets), 'secret' = filiation cachée, 'spoiler' = union tardive dans le récit.
const opts = { secrets: false, spoilers: false };
const visibleMode = (mode) =>
  mode === 'normal' ||
  (mode === 'public' && !opts.secrets) ||
  (mode === 'secret' && opts.secrets) ||
  (mode === 'spoiler' && opts.spoilers);

function linkPaths() {
  const out = [];
  const anchor = (id, side) => {
    const p = layout.pos[id];
    return side === 'top' ? [p.x + CARD_W / 2, p.y] : [p.x + CARD_W / 2, p.y + CARD_H];
  };
  for (const u of unions) {
    const ids = [u.a, u.b].filter(Boolean);
    let from;
    if (u.b) {
      const [ax, ay] = anchor(u.a, 'bottom');
      const [bx, by] = anchor(u.b, 'bottom');
      const dip = Math.max(ay, by) + 34;
      out.push({
        d: `M${ax} ${ay}C${ax} ${dip},${bx} ${dip},${bx} ${by}`,
        cls: 'union',
        ids,
        mode: u.mode,
      });
      from = [(ax + bx) / 2, dip - 8];
    } else {
      from = anchor(u.a, 'bottom');
    }
    for (const c of u.children) {
      const [cx, cy] = anchor(c, 'top');
      const mid = cy - 40;
      out.push({
        d: `M${from[0]} ${from[1]}V${mid}H${cx}V${cy}`,
        cls: u.mode === 'secret' ? 'parent secret' : 'parent',
        ids: [...ids, c],
        mode: u.mode,
      });
    }
  }
  for (const s of special) {
    const [ax, ay] = anchor(s.a, 'bottom');
    const [bx, by] = anchor(s.b, 'top');
    out.push({
      d: `M${ax} ${ay}C${ax} ${ay + 90},${bx} ${by - 90},${bx} ${by}`,
      cls: `special ${s.type}`,
      ids: [s.a, s.b],
      mode: 'normal',
    });
  }
  return out;
}

/** Relations d'une personne, selon les options de révélation. */
function relations(id) {
  const list = [];
  for (const u of unions) {
    if (!visibleMode(u.mode)) continue;
    if (u.a === id || u.b === id) {
      const other = u.a === id ? u.b : u.a;
      if (other) list.push([other, u.mode === 'secret' ? 'Lien révélé' : 'Union']);
      for (const c of u.children) list.push([c, u.mode === 'public' ? 'Enfant reconnu' : 'Enfant']);
    }
    if (u.children.includes(id)) {
      list.push([u.a, u.mode === 'public' ? 'Parent reconnu' : 'Parent']);
      if (u.b) list.push([u.b, 'Parent']);
    }
  }
  for (const s of special)
    if (s.a === id || s.b === id) list.push([s.a === id ? s.b : s.a, s.label]);
  const seen = new Set();
  return list.filter(([o, t]) => !seen.has(o + t) && seen.add(o + t));
}

export function renderTree(section) {
  section.innerHTML = `
    <header class="annexe-head">
      <p class="label">Annexe</p>
      <h2>L’arbre des familles</h2>
      <p class="annexe-lead">Dix grandes maisons, leurs alliances et leurs héritiers. Sélectionnez un personnage pour suivre ses liens.</p>
    </header>
    <div class="tree-tools">
      <label class="tree-search"><span>Rechercher</span><input type="search" placeholder="Un nom…" autocomplete="off" /></label>
      <div class="tree-zoom" role="group" aria-label="Zoom">
        <button type="button" data-zoom="-1" aria-label="Dézoomer">−</button>
        <output class="tree-scale" aria-live="polite">100 %</output>
        <button type="button" data-zoom="1" aria-label="Zoomer">+</button>
        <button type="button" data-zoom="fit">Vue d’ensemble</button>
      </div>
      <label class="tree-toggle"><input type="checkbox" data-opt="secrets" /> Révéler les filiations secrètes</label>
      <label class="tree-toggle"><input type="checkbox" data-opt="spoilers" /> Montrer les unions tardives</label>
    </div>
    <nav class="tree-families" aria-label="Familles">${families
      .map(
        (f) =>
          `<button type="button" data-family="${f.id}" style="--family:${f.color}">${escapeHtml(f.name)}</button>`,
      )
      .join('')}</nav>
    <div class="tree-wrap">
      <div class="tree-viewport" tabindex="0" aria-label="Arbre généalogique, défilable">
        <div class="tree-sizer"><div class="tree-board" style="width:${layout.width}px;height:${layout.height}px">
          <svg class="tree-lines" width="${layout.width}" height="${layout.height}" aria-hidden="true">${linkPaths()
            .map(
              (l) =>
                `<path d="${l.d}" class="${l.cls}" data-ids="${l.ids.join(',')}" data-mode="${l.mode}"/>`,
            )
            .join('')}</svg>
          ${layout.families
            .map(
              (f) =>
                `<p class="tree-family" style="left:${f.x}px;width:${f.width}px;color:${f.color}">${escapeHtml(f.name)}</p>`,
            )
            .join('')}
          ${people
            .map((p) => {
              const { x, y } = layout.pos[p.id];
              const f = families.find((x) => x.id === p.house);
              return `<button type="button" class="person" id="person-${p.id}" data-person="${p.id}"
                style="left:${x}px;top:${y}px;--family:${f.color}" aria-label="${escapeHtml(`${p.name}, ${p.title}`)}">
                <img src="${p.portrait}" alt="" loading="lazy" decoding="async" width="88" height="88" />
                <strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.title)}</small></button>`;
            })
            .join('')}
        </div></div>
      </div>
      <aside class="tree-person" aria-live="polite" hidden></aside>
    </div>`;

  const viewport = section.querySelector('.tree-viewport');
  const sizer = section.querySelector('.tree-sizer');
  const board = section.querySelector('.tree-board');
  const svg = section.querySelector('.tree-lines');
  const aside = section.querySelector('.tree-person');
  const scaleOut = section.querySelector('.tree-scale');
  let scale = 1;
  let chosen = null;

  function applyModes() {
    svg
      .querySelectorAll('path')
      .forEach((p) => (p.style.display = visibleMode(p.dataset.mode) ? '' : 'none'));
  }

  function setScale(s, center = true) {
    const cx = (viewport.scrollLeft + viewport.clientWidth / 2) / scale;
    const cy = (viewport.scrollTop + viewport.clientHeight / 2) / scale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
    board.style.transform = `scale(${scale})`;
    board.style.setProperty('--s', scale);
    board.classList.toggle('is-far', scale < READABLE);
    sizer.style.width = `${layout.width * scale}px`;
    sizer.style.height = `${layout.height * scale}px`;
    scaleOut.textContent = `${Math.round(scale * 100)} %`;
    if (center) {
      viewport.scrollLeft = cx * scale - viewport.clientWidth / 2;
      viewport.scrollTop = cy * scale - viewport.clientHeight / 2;
    }
  }

  function centerOn(x, y, smooth = true) {
    viewport.scrollTo({
      left: Math.max(0, x * scale - viewport.clientWidth / 2),
      top: Math.max(0, y * scale - viewport.clientHeight / 3),
      behavior: smooth ? 'smooth' : 'instant',
    });
  }

  function select(id) {
    chosen = id;
    const p = byId[id];
    const rels = relations(id);
    const related = new Set([id, ...rels.map((r) => r[0])]);
    board.classList.add('has-selection');
    board.querySelectorAll('.person').forEach((n) => {
      n.classList.toggle('is-selected', n.dataset.person === id);
      n.classList.toggle('is-related', related.has(n.dataset.person));
    });
    svg
      .querySelectorAll('path')
      .forEach((l) => l.classList.toggle('is-lit', l.dataset.ids.split(',').includes(id)));
    aside.hidden = false;
    aside.innerHTML = `
      <button type="button" class="tree-person-close" aria-label="Fermer la fiche personnage">×</button>
      <p class="label">Maison ${escapeHtml(familyName[p.house])}</p>
      <img src="${p.portrait}" alt="Portrait illustré de ${escapeHtml(p.name)}" width="120" height="120" />
      <h3>${escapeHtml(p.name)}</h3>
      <p class="tree-role">${escapeHtml(p.title)}</p>
      <p>${escapeHtml(p.bio)}</p>
      <h4 class="label">Liens</h4>
      <ul>${rels
        .map(
          ([o, t]) =>
            `<li><button type="button" data-person="${o}">${escapeHtml(byId[o].name)}</button> <span>${escapeHtml(t)}</span></li>`,
        )
        .join('')}</ul>`;
  }

  function clearSelection() {
    chosen = null;
    aside.hidden = true;
    board.classList.remove('has-selection');
    board
      .querySelectorAll('.is-selected, .is-related')
      .forEach((n) => n.classList.remove('is-selected', 'is-related'));
    svg.querySelectorAll('.is-lit').forEach((l) => l.classList.remove('is-lit'));
  }

  section.addEventListener('click', (e) => {
    const person = e.target.closest('[data-person]');
    if (person) {
      select(person.dataset.person);
      if (person.closest('.tree-person')) {
        const { x, y } = layout.pos[person.dataset.person];
        centerOn(x + CARD_W / 2, y);
      }
      return;
    }
    if (e.target.closest('.tree-person-close')) return clearSelection();
    const fam = e.target.closest('[data-family]');
    if (fam) return showFamily(fam.dataset.family);
    const z = e.target.closest('[data-zoom]');
    if (z) {
      if (z.dataset.zoom === 'fit') {
        setScale((viewport.clientWidth - 20) / layout.width, false);
        viewport.scrollTo({ left: 0, top: 0 });
      } else setScale(scale + Number(z.dataset.zoom) * 0.15);
    }
  });

  section.querySelectorAll('[data-opt]').forEach((box) =>
    box.addEventListener('change', () => {
      opts[box.dataset.opt] = box.checked;
      applyModes();
      if (chosen) select(chosen);
    }),
  );

  // Recherche : surligne les correspondances et centre la première.
  section.querySelector('.tree-search input').addEventListener('input', (e) => {
    const q = norm(e.target.value.trim());
    const matches = q ? people.filter((p) => norm(p.name).includes(q)) : [];
    board.querySelectorAll('.person').forEach((n) =>
      n.classList.toggle(
        'is-match',
        matches.some((m) => m.id === n.dataset.person),
      ),
    );
    if (matches[0]) {
      const { x, y } = layout.pos[matches[0].id];
      centerOn(x + CARD_W / 2, y);
    }
  });

  function showFamily(id) {
    const f = layout.families.find((x) => x.id === id);
    if (!f) return;
    if (scale < READABLE) setScale(1, false);
    centerOn(f.x + f.width / 2, 0);
  }

  applyModes();
  setScale(1, false);
  return { showFamily };
}
