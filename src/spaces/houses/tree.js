// Arbre d'une maison (§7.3) : 3 à 4 générations, conjoints venus d'autres maisons avec leur
// blason, filiations secrètes visibles seulement à partir de leur saison de révélation,
// morts grisés selon la saison choisie, zoom et déplacement (souris et toucher).
import { characterVisible, lastVisible } from '../../core/spoilers.js';
import { esc } from '../../ui/dom.js';
import { portraitPlaceholder, srcAttrs } from '../../ui/media.js';

const CARD_W = 128;
const CARD_H = 176;
const GAP_X = 26;
const ROW_H = 250;
const TOP = 30;

/** Unions visibles à la saison (filiations secrètes et versions officielles). */
export function visibleUnions(tree, season) {
  return tree.unions.filter(
    (u) => (u.s ?? 1) <= season && (u.hideFrom == null || season < u.hideFrom),
  );
}

/** Personnes visibles : nœuds libres, ou personnages déjà apparus à la saison choisie. */
function visiblePeople(tree, graph, season, unions) {
  const linked = new Set(unions.flatMap((u) => [u.a, u.b, ...u.children]).filter(Boolean));
  return tree.people.filter((p) => {
    if ((p.s ?? 1) > season) return false;
    if (p.character) {
      const c = graph.chars.get(p.character);
      if (!c || !characterVisible(c, season)) return false;
    }
    return linked.has(p.id) || !tree.unions.length;
  });
}

function generations(people, unions) {
  const gen = Object.fromEntries(people.map((p) => [p.id, 0]));
  for (let pass = 0; pass < 12; pass++) {
    let changed = false;
    for (const u of unions) {
      if (!(u.a in gen)) continue;
      const g = Math.max(gen[u.a], u.b in gen ? gen[u.b] : 0);
      for (const id of [u.a, u.b])
        if (id in gen && gen[id] < g) {
          gen[id] = g;
          changed = true;
        }
      for (const c of u.children)
        if (c in gen && gen[c] < g + 1) {
          gen[c] = g + 1;
          changed = true;
        }
    }
    if (!changed) break;
  }
  return gen;
}

/** Calcule positions et liens. */
export function layoutHouseTree(tree, graph, season) {
  const unions = visibleUnions(tree, season);
  const people = visiblePeople(tree, graph, season, unions);
  const ids = new Set(people.map((p) => p.id));
  const us = unions
    .map((u) => ({ ...u, children: u.children.filter((c) => ids.has(c)) }))
    .filter((u) => ids.has(u.a) && (!u.b || ids.has(u.b)));
  const gen = generations(people, us);
  const rows = new Map();
  // Ordre : on place les conjoints côte à côte, puis les enfants sous leurs parents.
  const order = [];
  const seen = new Set();
  const push = (id) => {
    if (!id || seen.has(id) || !ids.has(id)) return;
    seen.add(id);
    order.push(id);
  };
  for (const u of us) {
    push(u.a);
    push(u.b);
  }
  for (const u of us) u.children.forEach(push);
  people.forEach((p) => push(p.id));
  for (const id of order) {
    const g = gen[id];
    if (!rows.has(g)) rows.set(g, []);
    rows.get(g).push(id);
  }
  const width = Math.max(...[...rows.values()].map((r) => r.length)) * (CARD_W + GAP_X) + 60;
  const pos = {};
  for (const [g, row] of rows) {
    const rowW = row.length * (CARD_W + GAP_X) - GAP_X;
    row.forEach(
      (id, i) => (pos[id] = { x: (width - rowW) / 2 + i * (CARD_W + GAP_X), y: TOP + g * ROW_H }),
    );
  }
  const height = TOP + rows.size * ROW_H;
  const lines = [];
  for (const u of us) {
    const a = pos[u.a];
    const b = u.b ? pos[u.b] : null;
    const cls = u.secret ? 'secret' : '';
    let from = [a.x + CARD_W / 2, a.y + CARD_H];
    if (b) {
      const dip = Math.max(a.y, b.y) + CARD_H + 22;
      lines.push({
        d: `M${a.x + CARD_W / 2} ${a.y + CARD_H}V${dip}H${b.x + CARD_W / 2}V${b.y + CARD_H}`,
        cls: `union ${cls}`,
      });
      from = [(a.x + b.x + CARD_W) / 2, dip];
    }
    for (const c of u.children) {
      const p = pos[c];
      const mid = p.y - 26;
      lines.push({
        d: `M${from[0]} ${from[1]}V${mid}H${p.x + CARD_W / 2}V${p.y}`,
        cls: `child ${cls}`,
      });
    }
  }
  return { people, pos, lines, width, height };
}

function personCard(p, houseSlug, graph, season, at) {
  const c = p.character ? graph.chars.get(p.character) : null;
  const name = c?.name ?? p.name;
  const foreign = p.house && p.house !== houseSlug ? graph.houses.get(p.house) : null;
  let dead = !!p.deadBefore || (p.dead != null && p.dead <= season);
  if (c) dead = lastVisible(c.status, season)?.value === 'mort';
  const src = c?.portrait ?? p.portrait;
  const media = src
    ? `<img ${srcAttrs(src, '128px')} alt="" loading="lazy" decoding="async" />`
    : portraitPlaceholder(name, graph.houses.get(p.house ?? houseSlug)?.sigil);
  const tag = c ? 'a' : 'div';
  const href = c ? ` href="/personnages/${c.slug}"` : '';
  return `<${tag} class="tree-card${dead ? ' is-dead' : ''}${c ? '' : ' is-static'}"${href} style="left:${at.x}px;top:${at.y}px" aria-label="${esc(
    `${name}${dead ? ', mort' : ''}`,
  )}">
    <span class="tree-portrait">${media}${dead ? '<span class="tree-cross" aria-hidden="true">✝</span>' : ''}</span>
    <span class="tree-name">${esc(name)}</span>
    ${p.note ? `<span class="tree-note">${esc(p.note)}</span>` : ''}
    ${
      foreign
        ? `<button type="button" class="tree-foreign" data-house="${foreign.slug}" title="${esc(foreign.name)}" aria-label="${esc(
            `Voir l’arbre de la ${foreign.name}`,
          )}"><img src="/${foreign.sigil}" alt="" width="22" height="22" /></button>`
        : ''
    }
  </${tag}>`;
}

/** Rend l'arbre dans `el` et branche zoom, déplacement et vue d'ensemble. */
export function renderHouseTree(el, house, graph, season, { onHouse } = {}) {
  if (!house.tree) {
    el.innerHTML = '<p class="tree-empty">L’arbre de cette maison n’est pas encore établi.</p>';
    return;
  }
  const L = layoutHouseTree(house.tree, graph, season);
  const hiddenSecrets = house.tree.unions.filter((u) => u.secret && (u.s ?? 1) > season).length;
  el.innerHTML = `
    <div class="tree-tools" role="group" aria-label="Zoom de l’arbre">
      <button type="button" class="btn" data-zoom="-1" aria-label="Dézoomer">−</button>
      <button type="button" class="btn" data-zoom="1" aria-label="Zoomer">+</button>
      <button type="button" class="btn" data-zoom="fit">Vue d’ensemble</button>
      ${hiddenSecrets ? `<span class="tree-masked">${hiddenSecrets} filiation${hiddenSecrets > 1 ? 's' : ''} masquée${hiddenSecrets > 1 ? 's' : ''} à cette saison</span>` : ''}
    </div>
    <div class="tree-viewport" tabindex="0" aria-label="Arbre de la ${esc(house.name)}, déplaçable">
      <div class="tree-board" style="width:${L.width}px;height:${L.height}px">
        <svg class="tree-lines" width="${L.width}" height="${L.height}" aria-hidden="true">${L.lines
          .map((l) => `<path d="${l.d}" class="${l.cls}"/>`)
          .join('')}</svg>
        ${L.people.map((p) => personCard(p, house.slug, graph, season, L.pos[p.id])).join('')}
      </div>
    </div>`;

  const vp = el.querySelector('.tree-viewport');
  const board = el.querySelector('.tree-board');
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const apply = () => (board.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`);
  const fit = () => {
    scale = Math.min(1, (vp.clientWidth - 20) / L.width, (vp.clientHeight - 20) / L.height);
    // Noms lisibles (≥ 11 px) : on ne descend pas sous 0,75.
    scale = Math.max(0.75, scale);
    tx = Math.max(10, (vp.clientWidth - L.width * scale) / 2);
    ty = 10;
    apply();
  };
  const zoom = (f, cx = vp.clientWidth / 2, cy = vp.clientHeight / 2) => {
    const ns = Math.min(1.6, Math.max(0.75, scale * f));
    tx = cx - ((cx - tx) * ns) / scale;
    ty = cy - ((cy - ty) * ns) / scale;
    scale = ns;
    apply();
  };
  el.querySelector('.tree-tools').addEventListener('click', (e) => {
    const z = e.target.closest('[data-zoom]')?.dataset.zoom;
    if (z === 'fit') fit();
    else if (z) zoom(z === '1' ? 1.2 : 1 / 1.2);
  });
  vp.addEventListener(
    'wheel',
    (e) => {
      if (!e.ctrlKey && Math.abs(e.deltaY) < 40) return;
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - r.left, e.clientY - r.top);
    },
    { passive: false },
  );
  // Déplacement : glisser à la souris ou au doigt (pointeurs), pincer pour zoomer.
  const pts = new Map();
  let moved = false;
  vp.addEventListener('pointerdown', (e) => {
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
  });
  vp.addEventListener('pointermove', (e) => {
    const p = pts.get(e.pointerId);
    if (!p) return;
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d0 = Math.hypot(a.x - b.x, a.y - b.y);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [c, d] = [...pts.values()];
      const d1 = Math.hypot(c.x - d.x, c.y - d.y);
      if (d0 > 0) zoom(d1 / d0);
    } else {
      tx += e.clientX - p.x;
      ty += e.clientY - p.y;
      if (Math.abs(e.clientX - p.x) + Math.abs(e.clientY - p.y) > 2) moved = true;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      apply();
    }
  });
  const up = (e) => pts.delete(e.pointerId);
  vp.addEventListener('pointerup', up);
  vp.addEventListener('pointercancel', up);
  vp.addEventListener(
    'click',
    (e) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
        return;
      }
      const b = e.target.closest('.tree-foreign');
      if (b) {
        e.preventDefault();
        e.stopPropagation();
        onHouse?.(b.dataset.house);
      }
    },
    true,
  );
  vp.addEventListener('keydown', (e) => {
    const step = 40;
    if (e.key === 'ArrowLeft') tx += step;
    else if (e.key === 'ArrowRight') tx -= step;
    else if (e.key === 'ArrowUp') ty += step;
    else if (e.key === 'ArrowDown') ty -= step;
    else if (e.key === '+') zoom(1.2);
    else if (e.key === '-') zoom(1 / 1.2);
    else return;
    e.preventDefault();
    e.stopPropagation();
    apply();
  });
  requestAnimationFrame(fit);
}
