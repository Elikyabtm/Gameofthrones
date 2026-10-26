// Filtrage anti-spoilers (§9). Tout passe par ici AVANT le rendu : ce qui n'est pas visible
// à la saison choisie n'est jamais injecté dans le DOM.

/**
 * Un élément portant `s` est visible si s ≤ saison (sans `s` : visible dès la saison 1).
 * `until` : l'élément cesse d'être vrai à partir de cette saison (ex. un lien présenté comme
 * une filiation jusqu'à sa révélation).
 */
export const visible = (item, season) =>
  (item?.s ?? 1) <= season && (item?.until == null || season < item.until);

/**
 * Sépare une liste en éléments visibles et masqués.
 * @returns {{ items: any[], hidden: number, next: number|null }} next = saison du 1er masqué
 */
export function split(list = [], season) {
  const items = [];
  let hidden = 0;
  let next = null;
  for (const it of list) {
    if (visible(it, season)) items.push(it);
    else if (it.until != null && season >= it.until)
      continue; // périmé, pas « masqué »
    else {
      hidden++;
      next = next === null ? it.s : Math.min(next, it.s);
    }
  }
  return { items, hidden, next };
}

/** Dernière valeur visible d'une liste chronologique (statut, allégeance…). */
export function lastVisible(list = [], season) {
  let out = null;
  for (const it of list) if (visible(it, season)) out = it;
  return out;
}

/** Un personnage existe-t-il pour ce spectateur ? (première apparition ≤ saison) */
export const characterVisible = (c, season) => (c.firstSeason ?? 1) <= season;

/** Lieux d'un personnage limités aux saisons vues. */
export function visiblePlaces(places = [], season) {
  return places
    .map((p) => ({ ...p, seasons: (p.seasons ?? [1]).filter((s) => s <= season) }))
    .filter((p) => p.seasons.length);
}

/**
 * Personnage filtré. Les relations vers un personnage pas encore apparu sont aussi masquées.
 * `isKnown(slug)` dit si l'autre extrémité d'une relation est visible.
 */
export function filterCharacter(c, season, isKnown = () => true) {
  const rel = split(
    (c.relations ?? []).filter((r) => isKnown(r.to)),
    season,
  );
  const hiddenRelations = (c.relations ?? []).filter((r) => !isKnown(r.to)).length;
  const bio = split(c.bio, season);
  return {
    ...c,
    aliases: split(c.aliases, season).items,
    titles: split(c.titles, season).items,
    allegiances: split(c.allegiances, season).items,
    status: lastVisible(c.status, season),
    quote: c.quote && visible(c.quote, season) ? c.quote : null,
    bio: bio.items,
    bioHidden: bio.hidden,
    keyMoments: split(c.keyMoments, season).items,
    relations: rel.items,
    relationsHidden: rel.hidden + hiddenRelations,
    relationsNext: rel.next,
    places: visiblePlaces(c.places, season),
    booksVsShow: c.booksVsShow && visible(c.booksVsShow, season) ? c.booksVsShow : null,
  };
}

/** Champs à saison d'une maison, d'un lieu ou d'une entrée du Codex. */
export function filterSeasonal(entity, season, fields) {
  const out = { ...entity };
  for (const f of fields) {
    const v = entity[f];
    if (Array.isArray(v)) out[f] = split(v, season).items;
    else if (v && typeof v === 'object' && 's' in v) out[f] = visible(v, season) ? v : null;
  }
  return out;
}
