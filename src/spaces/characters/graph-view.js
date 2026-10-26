// Onglet « Liens » (§7.2) : graphe radial centré sur le personnage — la famille au premier
// cercle, alliés, ennemis, amours et mentors au second — et sa liste textuelle accessible.
import { esc } from '../../ui/dom.js';
import { TYPE_GROUP, TYPE_LABELS } from '../../core/graph.js';

export const GROUPS = {
  famille: { label: 'Famille', color: '#c9b27c' },
  amour: { label: 'Amour', color: '#c46d7a' },
  allie: { label: 'Alliés et serviteurs', color: '#7fa6b8' },
  mentor: { label: 'Mentors et élèves', color: '#9db07e' },
  ennemi: { label: 'Ennemis', color: '#b0473e' },
  autre: { label: 'Autres liens', color: '#8a877f' },
};

const initials = (name) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

function node(c, x, y, r, { center = false, color } = {}) {
  const id = `clip-${c.slug}`;
  const img = c.portrait
    ? `<image href="/${c.portrait}" x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="${x}" cy="${y}" r="${r}" fill="#161b1e"/><text x="${x}" y="${y + r * 0.18}" text-anchor="middle" class="g-initials" font-size="${r * 0.7}">${esc(initials(c.name))}</text>`;
  const label = `<text x="${x}" y="${y + r + 18}" text-anchor="middle" class="g-name${center ? ' is-center' : ''}">${esc(c.short ?? c.name)}</text>`;
  const ring = `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${color ?? '#c9b27c'}" stroke-width="${center ? 1.5 : 1}"/>`;
  const body = `<clipPath id="${id}"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>${img}${ring}${label}`;
  return center
    ? `<g class="g-node is-center">${body}</g>`
    : `<a class="g-node" href="/personnages/${c.slug}" aria-label="${esc(c.name)}">${body}</a>`;
}

/**
 * @param {object} c personnage central (index)
 * @param {Array} rels relations visibles [{ to, type, label }]
 * @param {Map} chars personnages de l'index
 */
export function renderLinks(c, rels, chars, hidden) {
  const W = 760;
  const H = 640;
  const cx = W / 2;
  const cy = H / 2;
  const fam = rels.filter((r) => TYPE_GROUP[r.type] === 'famille');
  const others = rels.filter((r) => TYPE_GROUP[r.type] !== 'famille');
  const place = (list, radius, offset) =>
    list.map((r, i) => {
      const a = offset + (i / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2;
      return { r, x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius * 0.86 };
    });
  const p1 = place(fam, 150, 0);
  const p2 = place(others, 268, Math.PI / Math.max(2, others.length));
  const all = [...p1, ...p2];
  const edges = all
    .map(({ r, x, y }) => {
      const g = GROUPS[TYPE_GROUP[r.type]] ?? GROUPS.autre;
      return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${g.color}" stroke-opacity=".55" stroke-width="1"/>`;
    })
    .join('');
  const nodes = all
    .map(({ r, x, y }) => {
      const o = chars.get(r.to);
      const g = GROUPS[TYPE_GROUP[r.type]] ?? GROUPS.autre;
      return o ? node(o, x, y, 30, { color: g.color }) : '';
    })
    .join('');
  const usedGroups = [...new Set(rels.map((r) => TYPE_GROUP[r.type] ?? 'autre'))];
  const legend = usedGroups
    .map(
      (g) =>
        `<li><span class="swatch" style="--c:${GROUPS[g].color}"></span>${esc(GROUPS[g].label)}</li>`,
    )
    .join('');
  const byGroup = Object.keys(GROUPS)
    .map((g) => {
      const items = rels.filter((r) => (TYPE_GROUP[r.type] ?? 'autre') === g);
      if (!items.length) return '';
      return `<div class="links-group"><h3 class="label">${esc(GROUPS[g].label)}</h3><ul>${items
        .map((r) => {
          const o = chars.get(r.to);
          return o
            ? `<li><a href="/personnages/${o.slug}">${esc(o.name)}</a> <span>${esc(r.label ?? TYPE_LABELS[r.type])}</span></li>`
            : '';
        })
        .join('')}</ul></div>`;
    })
    .join('');
  const trace = hidden.count
    ? `<p class="masked">${hidden.count} relation${hidden.count > 1 ? 's' : ''} masquée${hidden.count > 1 ? 's' : ''}${
        hidden.next ? ` · saison ${hidden.next}` : ''
      }. <button type="button" class="link-btn" data-open-season>Changer de saison</button></p>`
    : '';
  return `
    <figure class="links-graph">
      <svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Graphe des liens de ${esc(c.name)}">
        <ellipse cx="${cx}" cy="${cy}" rx="150" ry="129" fill="none" stroke="#e8e4da" stroke-opacity=".08"/>
        <ellipse cx="${cx}" cy="${cy}" rx="268" ry="230" fill="none" stroke="#e8e4da" stroke-opacity=".06"/>
        ${edges}${nodes}${node(c, cx, cy, 46, { center: true })}
      </svg>
      <figcaption><ul class="legend">${legend}</ul></figcaption>
    </figure>
    ${trace}
    <section class="links-list" aria-label="Liste des liens">${byGroup || '<p>Aucun lien connu à cette saison.</p>'}</section>`;
}
