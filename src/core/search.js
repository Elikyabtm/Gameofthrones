// Recherche globale (§8.5) : tolérante aux accents et aux fautes légères, et respectueuse de
// la saison choisie (aucun résultat sur un alias encore secret ni un personnage à venir).
import { characterVisible, visible } from './spoilers.js';
import { norm } from './graph.js';

/** Distance de Levenshtein bornée (abandon au-delà de `max`). */
function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

/** Score d'un nom pour une requête normalisée (plus petit = meilleur ; Infinity = rejet). */
function score(name, q) {
  const n = norm(name);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  const words = n.split(/[\s'’-]+/);
  if (words.some((w) => w.startsWith(q))) return 2;
  if (n.includes(q)) return 3;
  if (q.length >= 4) {
    // Fautes légères : un mot proche (1 faute jusqu'à 6 lettres, 2 au-delà).
    const max = q.length > 6 ? 2 : 1;
    const qw = q.split(/\s+/);
    const ok = qw.every((w) =>
      words.some((x) => lev(w, x.slice(0, w.length + 1), max) <= max || lev(w, x, max) <= max),
    );
    if (ok) return 4;
  }
  return Infinity;
}

/**
 * @returns {{ characters, houses, places, codex }} listes de { slug, name, sub, score, href }
 */
export function search(index, graph, q, season, limit = 8) {
  const nq = norm(q.trim());
  const out = { characters: [], houses: [], places: [], codex: [] };
  if (!nq) return out;
  const best = (names) => Math.min(...names.filter(Boolean).map((n) => score(n, nq)));
  for (const c of index.characters) {
    if (!characterVisible(c, season)) continue;
    const s = best([
      c.name,
      c.short,
      ...(c.aliases ?? []).filter((a) => visible(a, season)).map((a) => a.text),
    ]);
    if (s < Infinity)
      out.characters.push({
        slug: c.slug,
        name: c.name,
        sub: graph.houses.get(c.house)?.name ?? '',
        score: s,
        href: `/personnages/${c.slug}`,
        item: c,
      });
  }
  for (const h of index.houses) {
    const s = best([h.name, h.name.replace(/^Maison /, ''), h.words]);
    if (s < Infinity)
      out.houses.push({
        slug: h.slug,
        name: h.name,
        sub: `« ${h.words} »`,
        score: s,
        href: `/maisons/${h.slug}`,
        item: h,
      });
  }
  for (const p of index.places) {
    const s = best([p.name]);
    if (s < Infinity)
      out.places.push({ slug: p.slug, name: p.name, sub: p.region, score: s, href: null, item: p });
  }
  for (const e of index.codex) {
    const s = best([e.name, e.name.replace(/^(Le |La |Les |L’)/, '')]);
    if (s < Infinity)
      out.codex.push({
        slug: e.slug,
        name: e.name,
        sub: e.kicker,
        score: s,
        href: `/codex/${e.rubric}/${e.slug}`,
        item: e,
      });
  }
  for (const k of Object.keys(out))
    out[k] = out[k]
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'fr'))
      .slice(0, limit);
  return out;
}
