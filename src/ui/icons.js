// Petits symboles SVG originaux, un par type de fiche (16 × 16, trait doré via currentColor).
const svg = (body) =>
  `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">${body}</svg>`;

export const TYPE_ICONS = {
  // Peuple : trois silhouettes.
  group: svg(
    '<circle cx="5" cy="5" r="2"/><circle cx="11" cy="5" r="2"/><path d="M1.5 13c0-2.5 1.6-4 3.5-4s3.5 1.5 3.5 4M7.5 13c0-2.5 1.6-4 3.5-4s3.5 1.5 3.5 4"/>',
  ),
  // Maison : écu.
  house: svg('<path d="M3 2.5h10v5c0 3-2.2 5-5 6.2C5.2 12.5 3 10.5 3 7.5z"/><path d="M8 4.5v7"/>'),
  // Langue : bulle de parole.
  lang: svg('<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/><path d="M5 6h6M5 8h4"/>'),
  // Croyance : flamme.
  faith: svg(
    '<path d="M8 1.8c2.6 2.6 4 4.8 4 7.2a4 4 0 0 1-8 0c0-1.5.7-2.6 1.6-3.6.2 1.3.8 2 1.6 2.3C7 6 7.2 3.8 8 1.8z"/>',
  ),
  // Créature : griffe.
  creature: svg('<path d="M3 13c1-4 1.5-7 1-10M7 13.5c.5-4 .8-7.5.5-11M11 13c-.3-3.5.3-6.5 2-9"/>'),
  // Lieu : tour.
  place: svg('<path d="M4 14V6h8v8M4 6V3h2v1.5h1.2V3h1.6v1.5H10V3h2v3M7 14v-3h2v3"/>'),
};
