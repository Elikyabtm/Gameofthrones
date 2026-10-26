// Lieux ↔ carte : coordonnées, étape du voyage qui montre un lieu, lumière associée.
import journey from '../data/journey.json';
import map from '../data/map.json';

/** Étape du voyage qui montre un lieu (par le lieu principal ou un lien). */
export function stepForPlace(place) {
  return (
    journey.steps.find((s) => s.place === place) ??
    journey.steps.find((s) => s.links.includes(place))
  );
}

/** Coordonnées carte d'un lieu (cité de map.json, ou coordonnées de la fiche Lieu). */
export function placeCoords(graph, slug) {
  const city = map.cities.find((c) => c.slug === slug);
  if (city) return { x: city.x, y: city.y };
  return graph?.places.get(slug)?.coords ?? null;
}

/** Lumière de l'étape liée au lieu (ou null : lumière d'intro). */
export function placeLight(slug) {
  return stepForPlace(slug)?.light ?? null;
}
