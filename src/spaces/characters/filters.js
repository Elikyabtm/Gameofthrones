// Filtres, tri et recherche de la galerie (§7.1), synchronisés avec l'URL (?maison=stark…).
import { characterVisible, lastVisible } from '../../core/spoilers.js';
import { norm } from '../../core/graph.js';

export const slugify = (s) =>
  norm(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const CAMPS = [
  { value: 'westeros', label: 'Westeros' },
  { value: 'essos', label: 'Essos' },
  { value: 'au-dela-du-mur', label: 'Au-delà du Mur' },
];
export const SORTS = [
  { value: 'maison', label: 'Par maison' },
  { value: 'alpha', label: 'Alphabétique' },
  { value: 'apparition', label: 'Première apparition' },
];

/** Lit les filtres depuis les paramètres d'URL. */
export function readFilters(query) {
  return {
    maison: query.get('maison') ?? '',
    region: query.get('region') ?? '',
    camp: query.get('camp') ?? '',
    statut: query.get('statut') ?? '',
    q: query.get('q') ?? '',
    tri: query.get('tri') ?? 'maison',
    vue: query.get('vue') ?? 'carrousel',
  };
}

export function toQuery(f) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (!v || (k === 'tri' && v === 'maison') || (k === 'vue' && v === 'carrousel')) continue;
    p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/** Personnages visibles à la saison, filtrés et triés. */
export function applyFilters(index, graph, season, f) {
  const houseOrder = new Map(index.houses.map((h, i) => [h.slug, i]));
  const q = norm(f.q.trim());
  const list = index.characters.filter((c) => {
    if (!characterVisible(c, season)) return false;
    if (f.maison && (c.house ?? 'sans-maison') !== f.maison) return false;
    if (f.region && slugify(c.region ?? '') !== f.region) return false;
    if (f.camp && c.camp !== f.camp) return false;
    if (f.statut) {
      const st = lastVisible(c.status, season)?.value;
      const alive = st === 'vivant' || st === 'ressuscite' || st === 'inconnu';
      if (f.statut === 'vivant' ? !alive : alive) return false;
    }
    if (q) {
      const names = [
        c.name,
        c.short,
        ...(c.aliases ?? [])
          .filter((a) => (a.s ?? 1) <= season && (a.until == null || season < a.until))
          .map((a) => a.text),
      ];
      if (!names.some((n) => n && norm(n).includes(q))) return false;
    }
    return true;
  });
  const byName = (a, b) => a.name.localeCompare(b.name, 'fr');
  if (f.tri === 'alpha') list.sort(byName);
  else if (f.tri === 'apparition')
    list.sort((a, b) => a.firstSeason - b.firstSeason || byName(a, b));
  else {
    // Par maison : ordre des maisons, puis ordre des membres déclaré par la maison.
    const memberRank = (c) => graph.houses.get(c.house)?.members?.indexOf(c.slug) ?? 999;
    list.sort(
      (a, b) =>
        (houseOrder.get(a.house) ?? 999) - (houseOrder.get(b.house) ?? 999) ||
        (memberRank(a) < 0 ? 999 : memberRank(a)) - (memberRank(b) < 0 ? 999 : memberRank(b)) ||
        byName(a, b),
    );
  }
  const later = index.characters.filter((c) => !characterVisible(c, season)).length;
  return { list, later };
}

/** Valeurs proposées dans les listes déroulantes. */
export function filterOptions(index, graph, season) {
  const visibleChars = index.characters.filter((c) => characterVisible(c, season));
  const houses = [...new Set(visibleChars.map((c) => c.house).filter(Boolean))]
    .map((s) => graph.houses.get(s))
    .filter(Boolean);
  const regions = [...new Set(visibleChars.map((c) => c.region).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr'),
  );
  return { houses, regions };
}
