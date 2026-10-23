// Champ de distance signé à partir d'un masque binaire (terre = 1, mer = 0).
// Transformée de chanfrein 3-4 en deux passes : rapide, et assez précise pour placer
// le trait de côte, le contour « de graveur » et la pente douce des rivages.

const INF = 1e9;

/** Distance (en pixels) de chaque pixel au pixel le plus proche où `mask` vaut `target`. */
function chamfer(mask, w, h, target) {
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] === target ? 0 : INF;
  const A = 1; // voisin orthogonal
  const B = Math.SQRT2; // voisin diagonal

  // Passe avant : haut-gauche → bas-droite.
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      if (x > 0) v = Math.min(v, d[i - 1] + A);
      if (y > 0) {
        v = Math.min(v, d[i - w] + A);
        if (x > 0) v = Math.min(v, d[i - w - 1] + B);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + B);
      }
      d[i] = v;
    }
  }
  // Passe arrière : bas-droite → haut-gauche.
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      if (x < w - 1) v = Math.min(v, d[i + 1] + A);
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + A);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + B);
        if (x > 0) v = Math.min(v, d[i + w - 1] + B);
      }
      d[i] = v;
    }
  }
  return d;
}

/**
 * Distance signée : négative sur terre (profondeur dans les terres), positive en mer
 * (distance au rivage). Le rivage est à 0 (à ±0,5 px près).
 */
export function signedDistance(mask, w, h) {
  const toLand = chamfer(mask, w, h, 1); // > 0 en mer
  const toSea = chamfer(mask, w, h, 0); // > 0 sur terre
  const sd = new Float32Array(w * h);
  for (let i = 0; i < sd.length; i++) {
    sd[i] = mask[i] ? -(toSea[i] - 0.5) : toLand[i] - 0.5;
  }
  return sd;
}
