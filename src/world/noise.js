// Bruit déterministe en JS pur (aucune dépendance au DOM : utilisable dans un Worker).
// Value noise lissé + fBm, avec une seed fixe pour que la carte soit identique à chaque chargement.

/** Générateur pseudo-aléatoire mulberry32 : renvoie une fonction () → [0, 1). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Crée une fonction noise2(x, y) → [-1, 1], continue, période 256. */
export function createNoise(seed) {
  const rand = rng(seed);
  const perm = new Uint8Array(512);
  const values = new Float32Array(256);
  for (let i = 0; i < 256; i++) {
    perm[i] = i;
    values[i] = rand() * 2 - 1;
  }
  // Mélange de Fisher-Yates.
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const at = (ix, iy) => values[perm[(perm[ix & 255] + iy) & 511]];

  return (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fade(fx);
    const v = fade(fy);
    const a = at(ix, iy);
    const b = at(ix + 1, iy);
    const c = at(ix, iy + 1);
    const d = at(ix + 1, iy + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

/** fBm : somme de `octaves` couches de bruit, normalisée dans [-1, 1]. */
export function fbm(noise, x, y, octaves = 5, lacunarity = 2, gain = 0.5) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += noise(x, y) * amp;
    norm += amp;
    amp *= gain;
    x *= lacunarity;
    y *= lacunarity;
  }
  return sum / norm;
}

/**
 * Grille de fBm de taille w × h, pour une fréquence de base `scale` (cycles sur la largeur).
 * Échantillonnée ensuite par interpolation bilinéaire : bien moins coûteux que 8 M d'appels.
 */
export function fbmGrid(noise, w, h, scale, octaves = 5) {
  const grid = new Float32Array(w * h);
  const k = scale / w;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) grid[y * w + x] = fbm(noise, x * k, y * k, octaves);
  }
  return grid;
}

/** Lecture bilinéaire d'une grille w × h aux coordonnées normalisées (u, v) ∈ [0, 1]. */
export function sampleGrid(grid, w, h, u, v) {
  const x = Math.min(u * (w - 1), w - 1.001);
  const y = Math.min(v * (h - 1), h - 1.001);
  const ix = x | 0;
  const iy = y | 0;
  const fx = x - ix;
  const fy = y - iy;
  const i = iy * w + ix;
  const a = grid[i];
  const b = grid[i + 1];
  const c = grid[i + w];
  const d = grid[i + w + 1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
