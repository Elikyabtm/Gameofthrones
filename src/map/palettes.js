// Palettes de la texture parchemin. `parchemin` reprend exactement PROJET.md §4.2-B ;
// les deux autres sont les variantes de la phase 1. Palette retenue (validation phase 1) : sépia.
export const DEFAULT_PALETTE = 'sepia';

export const PALETTES = {
  parchemin: {
    label: 'Parchemin (cahier des charges, première version)',
    sea: '#0d1a1f',
    seaEdge: '#060d10',
    land: '#8a7a5a',
    peak: '#b5a47c',
    valley: '#6d6046',
    ink: '#1a1510',
    hatch: '#2a2218',
    river: '#1d2a2c',
    wall: '#d9d6cc',
  },
  sepia: {
    label: 'Sépia chaud (retenue)',
    sea: '#101a1c',
    seaEdge: '#070c0d',
    land: '#94784c',
    peak: '#c4a877',
    valley: '#64502f',
    ink: '#1c130a',
    hatch: '#2e2112',
    river: '#1f2b2a',
    wall: '#e2dccb',
  },
  encre: {
    label: 'Variante B — encre froide',
    sea: '#0a171c',
    seaEdge: '#050b0e',
    land: '#7b7860',
    peak: '#a8a488',
    valley: '#56553f',
    ink: '#14161a',
    hatch: '#22231d',
    river: '#1a2830',
    wall: '#dfe3df',
  },
};

/** '#rrggbb' → [r, g, b] (0–255). */
export function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
