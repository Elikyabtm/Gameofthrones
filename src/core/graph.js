// Index des relations entre entités (§4.1, §5.2) : liens inverses, rattachements
// personnage ↔ maison ↔ lieu ↔ Codex, et table des noms pour les liens automatiques (§8.3).
import { characterVisible, split, visible } from './spoilers.js';

/** Type inverse d'une relation déclarée d'un seul côté. */
export const INVERSE = {
  parent: 'enfant',
  enfant: 'parent',
  fratrie: 'fratrie',
  conjoint: 'conjoint',
  amour: 'amour',
  allie: 'allie',
  ennemi: 'ennemi',
  mentor: 'eleve',
  eleve: 'mentor',
  serviteur: 'maitre',
  maitre: 'serviteur',
  suzerain: 'vassal',
  vassal: 'suzerain',
  autre: 'autre',
};

/** Libellés neutres pour les liens calculés (le libellé déclaré est prioritaire). */
export const TYPE_LABELS = {
  parent: 'Parent',
  enfant: 'Enfant',
  fratrie: 'Fratrie',
  conjoint: 'Conjoint',
  amour: 'Amour',
  allie: 'Allié',
  ennemi: 'Ennemi',
  mentor: 'Mentor',
  eleve: 'Élève',
  serviteur: 'À son service',
  maitre: 'Sert ce personnage',
  suzerain: 'Suzerain',
  vassal: 'Vassal',
  autre: 'Lien',
};

/** Familles de types pour le graphe radial et ses couleurs. */
export const TYPE_GROUP = {
  parent: 'famille',
  enfant: 'famille',
  fratrie: 'famille',
  conjoint: 'famille',
  amour: 'amour',
  allie: 'allie',
  serviteur: 'allie',
  maitre: 'allie',
  suzerain: 'allie',
  vassal: 'allie',
  ennemi: 'ennemi',
  mentor: 'mentor',
  eleve: 'mentor',
  autre: 'autre',
};

export const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();

/**
 * Construit le graphe à partir de l'index des contenus.
 * @param {object} index { characters, houses, places, codex }
 */
export function createGraph(index) {
  const chars = new Map(index.characters.map((c) => [c.slug, c]));
  const houses = new Map(index.houses.map((h) => [h.slug, h]));
  const places = new Map(index.places.map((p) => [p.slug, p]));
  const codex = new Map(index.codex.map((e) => [e.slug, e]));

  // Relations des deux côtés : la déclarée et son inverse calculé.
  const rels = new Map([...chars.keys()].map((k) => [k, []]));
  for (const c of index.characters) {
    for (const r of c.relations ?? []) {
      rels.get(c.slug).push({ ...r, declared: true });
      rels.get(r.to)?.push({
        to: c.slug,
        type: INVERSE[r.type] ?? 'autre',
        label: r.inverseLabel ?? null,
        s: r.s,
        until: r.until,
        declared: false,
      });
    }
  }
  const kindOf = (slug) =>
    chars.has(slug)
      ? 'character'
      : houses.has(slug)
        ? 'house'
        : places.has(slug)
          ? 'place'
          : codex.has(slug)
            ? 'codex'
            : null;

  return {
    chars,
    houses,
    places,
    codex,
    kindOf,
    /** Relations d'un personnage (les deux sens), filtrées par saison et apparition. */
    relationsOf(slug, season) {
      const list = (rels.get(slug) ?? []).filter((r) => {
        const o = chars.get(r.to);
        return o && characterVisible(o, season);
      });
      const res = split(list, season);
      // Dédoublonnage après filtrage : un lien déclaré l'emporte sur l'inverse calculé.
      const seen = new Map();
      for (const r of res.items) {
        const prev = seen.get(r.to);
        if (!prev || (r.declared && !prev.declared)) seen.set(r.to, r);
      }
      res.items = [...seen.values()];
      return res;
    },
    /** Personnages présents dans un lieu à la saison choisie, dans l'ordre demandé. */
    residents(placeSlug, season, order = [], { origin = false } = {}) {
      const list = index.characters.filter(
        (c) =>
          characterVisible(c, season) &&
          ((origin && c.origin === placeSlug && order.includes(c.slug)) ||
            (c.places ?? []).some(
              (p) => p.place === placeSlug && p.seasons.some((s) => s <= season),
            )),
      );
      const rank = (s) => (order.includes(s) ? order.indexOf(s) : 999);
      return list.sort((a, b) => rank(a.slug) - rank(b.slug));
    },
    /** Membres d'une maison (ordre de la maison, puis ceux qui la déclarent). */
    membersOf(houseSlug, season) {
      const h = houses.get(houseSlug);
      const order = h?.members ?? [];
      const set = new Set(order);
      for (const c of index.characters) if (c.house === houseSlug) set.add(c.slug);
      return [...set].map((s) => chars.get(s)).filter((c) => c && characterVisible(c, season));
    },
    /** Entrées du Codex qui citent un personnage, et inversement. */
    codexOfCharacter(slug) {
      const own = chars.get(slug)?.codex ?? [];
      const back = index.codex.filter((e) => e.characters?.includes(slug)).map((e) => e.slug);
      return [...new Set([...own, ...back])].map((s) => codex.get(s)).filter(Boolean);
    },
    charactersOfCodex(slug, season) {
      const e = codex.get(slug);
      const set = new Set(e?.characters ?? []);
      for (const c of index.characters) if (c.codex?.includes(slug)) set.add(c.slug);
      return [...set].map((s) => chars.get(s)).filter((c) => c && characterVisible(c, season));
    },
    /**
     * Table des noms (§8.3) : nom, nom court et alias visibles → entité.
     * Triée du plus long au plus court pour que « Jon Snow » passe avant « Jon ».
     */
    nameTable(season) {
      const out = [];
      const add = (text, kind, slug) => text && out.push({ text, kind, slug });
      for (const c of index.characters) {
        if (!characterVisible(c, season)) continue;
        add(c.name, 'character', c.slug);
        add(c.short, 'character', c.slug);
        for (const a of c.aliases ?? []) if (visible(a, season)) add(a.text, 'character', c.slug);
      }
      // Noms d'institutions : aussi sans article ni « Maison » (« la Garde de Nuit »).
      const bare = (t) => t.replace(/^(Maison |Le |La |Les |L’|L')/, '');
      for (const h of index.houses) add(h.name, 'house', h.slug);
      for (const p of index.places) add(p.name, 'place', p.slug);
      for (const e of index.codex) {
        add(e.name, 'codex', e.slug);
        if (bare(e.name) !== e.name) add(bare(e.name), 'codex', e.slug);
      }
      return out.sort((a, b) => b.text.length - a.text.length);
    },
  };
}
