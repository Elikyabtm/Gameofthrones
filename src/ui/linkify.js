// Liens automatiques (§8.3) : dans un paragraphe, la première occurrence du nom (ou d'un
// alias visible) de chaque entité devient un lien qui ouvre un aperçu latéral.
// Le texte est échappé avant d'être enrichi : aucune injection possible.
import { esc } from './dom.js';

const LETTER = /[\p{L}\p{N}]/u;

/** URL canonique d'une entité. */
export function hrefOf(graph, kind, slug) {
  if (kind === 'character') return `/personnages/${slug}`;
  if (kind === 'house') return `/maisons/${slug}`;
  if (kind === 'codex') return `/codex/${graph.codex.get(slug)?.rubric}/${slug}`;
  return `/carte`;
}

/**
 * Prépare un « lieur » pour une saison : renvoie (texte, slugÀExclure) → HTML.
 * La table est triée du nom le plus long au plus court (« Jon Snow » avant « Jon »).
 */
export function createLinker(graph, season) {
  const table = graph.nameTable(season).filter((n) => n.text.length >= 3);
  return function linkify(text, self = null) {
    const used = new Set(self ? [self] : []);
    const taken = []; // intervalles déjà liés [début, fin)
    const hits = [];
    for (const n of table) {
      if (used.has(n.slug)) continue;
      let from = 0;
      while (from < text.length) {
        const i = text.indexOf(n.text, from);
        if (i < 0) break;
        const j = i + n.text.length;
        const okLeft = i === 0 || !LETTER.test(text[i - 1]);
        const okRight = j >= text.length || !LETTER.test(text[j]);
        const free = !taken.some(([a, b]) => i < b && j > a);
        if (okLeft && okRight && free) {
          taken.push([i, j]);
          hits.push({ i, j, n });
          used.add(n.slug);
          break;
        }
        from = j;
      }
    }
    hits.sort((a, b) => a.i - b.i);
    let out = '';
    let pos = 0;
    for (const { i, j, n } of hits) {
      out += esc(text.slice(pos, i));
      out += `<a class="xref" href="${hrefOf(graph, n.kind, n.slug)}" data-preview data-kind="${n.kind}" data-slug="${n.slug}">${esc(text.slice(i, j))}</a>`;
      pos = j;
    }
    return out + esc(text.slice(pos));
  };
}
