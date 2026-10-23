// Génération des textures de la carte à partir de map.json (PROJET.md §4.2) :
//   heightTex (relief, gris 0–255), colorTex (parchemin), normalTex (Sobel).
// Aucune dépendance au DOM ni à Three.js : le même code tournera dans textures.worker.js
// (phase 7). Les canvas viennent de `createCanvas` (OffscreenCanvas si disponible).
import { createNoise, fbm, fbmGrid, sampleGrid } from './noise.js';
import { signedDistance } from './distance.js';
import { createCanvas, landPolygons, smoothstep, tracePolygon, traceSmooth } from './draw.js';
import { paintColor } from './parchment.js';

const SEED = 1789; // seed fixe : carte identique à chaque chargement

// Intensité des normales, en multiple de la pente réelle du relief déplacé. Le cahier donne
// 2,5 ; appliqué à la pente réelle, cela donnait un relief charbonneux (taches sombres
// partout). 1,0 fait coïncider l'ombrage avec la géométrie. À valider dans lab.html.
export const NORMAL_STRENGTH = 1.0;

/** Lit un canal (0 = R, 1 = G…) d'un canvas en tableau 0–255. */
function readChannel(canvas, channel) {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  const out = new Uint8Array(canvas.width * canvas.height);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4 + channel];
  return out;
}

/**
 * Calcule les champs de base (relief en flottants, distance au rivage), communs aux trois
 * textures. Coûteux : fait une seule fois ; changer de palette ne relance que paintColor().
 */
export function buildFields(map, { width = 4096, seed = SEED, params = {} } = {}) {
  const t0 = performance.now();
  const W = width;
  const H = Math.round((width * map.bounds.h) / map.bounds.w);
  const s = W / map.bounds.w; // pixels par unité de carte
  const k = W / 4096; // facteur d'échelle des valeurs données « pour 4096 px »
  const p = {
    noiseAmp: 18,
    mountainBreakup: 0.22,
    ridges: 0.6,
    coastJitter: 7,
    wallHeight: 1,
    ...params,
  };

  // Masque des terres et distance signée, calculés à demi-résolution (assez précis, 4× moins cher).
  const hw = W >> 1;
  const hh = H >> 1;
  // 1. Polygones bruts (+ un trait de 2 unités qui referme les joints entre régions voisines).
  const rawCanvas = createCanvas(hw, hh);
  const rctx = rawCanvas.getContext('2d');
  rctx.fillStyle = '#fff';
  rctx.strokeStyle = '#fff';
  rctx.lineJoin = 'round';
  rctx.lineWidth = 2 * (s / 2);
  // Un remplissage par polygone : réunis en un seul chemin, deux polygones qui se chevauchent
  // dans des sens opposés s'annuleraient (règle « nonzero ») et creuseraient un trou.
  for (const poly of landPolygons(map)) {
    rctx.beginPath();
    tracePolygon(rctx, poly, s / 2);
    rctx.fill();
    rctx.stroke();
  }
  // 2. Lissage morphologique (flou puis seuil) : arrondit les angles des polygones et
  //    comble les interstices étroits, sans déplacer le trait de côte en moyenne.
  const maskCanvas = createCanvas(hw, hh);
  const mctx = maskCanvas.getContext('2d');
  mctx.fillStyle = '#000';
  mctx.fillRect(0, 0, hw, hh);
  mctx.filter = `blur(${4 * (s / 2)}px)`;
  mctx.drawImage(rawCanvas, 0, 0);
  const mask = readChannel(maskCanvas, 0).map((v) => (v > 127 ? 1 : 0));
  const sdHalf = signedDistance(mask, hw, hh);

  // Rivières (R) et Mur (G), légèrement floutés, sur un second canvas à demi-résolution.
  const lineCanvas = createCanvas(hw, hh);
  const lctx = lineCanvas.getContext('2d');
  lctx.fillStyle = '#000';
  lctx.fillRect(0, 0, hw, hh);
  // Flou plus large que le « léger flou » du §4.2-A.5 : un sillon de 3 px est plus fin qu'une
  // maille du terrain (32,5 / 1024 unités ≈ 4 px) et produisait des dents de scie.
  lctx.filter = `blur(${3 * k}px)`; // ≈ 6 px pleine résolution : vallée douce
  lctx.lineCap = 'round';
  lctx.lineJoin = 'round';
  lctx.strokeStyle = '#f00';
  for (const r of map.rivers ?? []) {
    lctx.lineWidth = r.width * k * 0.5; // largeur donnée en px pleine résolution (§4.2-A.5)
    lctx.beginPath();
    traceSmooth(lctx, r.points, s / 2);
    lctx.stroke();
  }
  if (map.wall) {
    // Le Mur : arête continue, plus étroite que les vallées des rivières.
    lctx.globalCompositeOperation = 'lighter';
    // Au moins 2 mailles de large (une maille ≈ 4 px), sinon le maillage crée des dents de scie.
    lctx.filter = `blur(${2 * k}px)`;
    lctx.strokeStyle = '#0f0';
    lctx.lineWidth = 4 * k; // ≈ 8 px pleine résolution
    lctx.beginPath();
    traceSmooth(lctx, map.wall.points, s / 2);
    lctx.stroke();
  }
  const { data: lines } = lctx.getImageData(0, 0, hw, hh);
  // Le flou abaisse le pic des traits : on renormalise pour garder −20 au fond des rivières.
  let riverPeak = 1;
  let wallPeak = 1;
  for (let i = 0; i < lines.length; i += 4) {
    if (lines[i] > riverPeak) riverPeak = lines[i];
    if (lines[i + 1] > wallPeak) wallPeak = lines[i + 1];
  }
  const t1 = performance.now();

  // fBm à basse résolution (5 octaves, seed fixe), lu ensuite en bilinéaire.
  const noise = createNoise(seed);
  const GW = 1024;
  const GH = Math.round((GW * H) / W);
  const grid = fbmGrid(noise, GW, GH, 30, 5); // ≈ 87 unités de carte par cycle de base
  const t2 = performance.now();

  // Relief, pixel par pixel. La distance signée `d` est en pixels pleine résolution.
  const heights = new Float32Array(W * H);
  const sd = new Float32Array(W * H); // conservée pour paintColor()
  const coastIn = 30 * k; // largeur de la pente douce côté terre
  const coastOut = 40 * k; // côté mer
  // Tremblé fractal du rivage (± coastJitter unités de carte), calculé seulement près des côtes.
  const jitter = p.coastJitter * s;
  const coastFreq = 1 / (26 * s); // longueur d'onde de base ≈ 26 unités de carte
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const i = y * W + x;
      let d = sampleGrid(sdHalf, hw, hh, u, v) * 2;
      if (Math.abs(d) < jitter * 1.6)
        d += jitter * fbm(noise, x * coastFreq + 31.7, y * coastFreq, 4);
      sd[i] = d;
      // Rivage doux : on remplace « remplir à 70 puis flouter de 18 px » par une pente
      // calculée sur la distance, pour que le rivage visible (niveau 58 = y 0) tombe
      // exactement sous le trait d'encre de la texture couleur.
      let h = d < 0 ? 58 + 12 * smoothstep(0, coastIn, -d) : 58 * (1 - smoothstep(0, coastOut, d));
      const landF = smoothstep(0, coastIn, -d);
      if (landF > 0) {
        const n = sampleGrid(grid, GW, GH, u, v);
        h += p.noiseAmp * n * landF;
        const li = ((y >> 1) * hw + (x >> 1)) * 4;
        h -= 20 * (lines[li] / riverPeak) * landF; // rivières creusées
        h += 150 * (map.wall?.h ?? 0) * p.wallHeight * (lines[li + 1] / wallPeak) * landF; // Mur
        // Plancher doux : sous 64, les creux (bruit + rivières) sont comprimés vers 60 sans
        // jamais passer sous la mer (58), ni former de replat : pas de « lacs » parasites.
        const floor = 58 + 6 * landF;
        if (h < floor + 4) h = floor + 4 * Math.exp((h - floor - 4) / 4);
      }
      heights[i] = h;
    }
  }

  // Montagnes : dégradés radiaux elliptiques jusqu'à 70 + 150 × h (mode additif),
  // contour légèrement irrégulier grâce au bruit, et crêtes pour éviter l'effet « taupinière ».
  const ridgeFreq = 1 / (14 * s); // crêtes espacées d'environ 14 unités de carte
  const ridged = (x, y) => {
    let sum = 0;
    let amp = 0.5;
    let f = ridgeFreq;
    for (let o = 0; o < 4; o++) {
      const n = 1 - Math.abs(noise(x * f + 11.3, y * f - 7.1));
      sum += n * n * amp;
      amp *= 0.5;
      f *= 2.1;
    }
    return sum / 0.9375; // ∈ [0, 1]
  };
  for (const m of map.mountains ?? []) {
    const cx = m.x * s;
    const cy = m.y * s;
    const rx = m.rx * s;
    const ry = m.ry * s;
    const x0 = Math.max(0, Math.floor(cx - rx * 1.3));
    const x1 = Math.min(W - 1, Math.ceil(cx + rx * 1.3));
    const y0 = Math.max(0, Math.floor(cy - ry * 1.3));
    const y1 = Math.min(H - 1, Math.ceil(cy + ry * 1.3));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const n = sampleGrid(grid, GW, GH, x / (W - 1), y / (H - 1));
        const r = Math.sqrt(dx * dx + dy * dy) * (1 + p.mountainBreakup * n);
        if (r >= 1) continue;
        const i = y * W + x;
        const landF = smoothstep(0, coastIn, -sd[i]);
        const fall = 0.5 * (1 + Math.cos(Math.PI * r));
        heights[i] += 150 * m.h * fall * (1 - p.ridges * 0.45 + p.ridges * ridged(x, y)) * landF;
      }
    }
  }
  for (let i = 0; i < heights.length; i++) heights[i] = Math.min(255, Math.max(0, heights[i]));
  const t3 = performance.now();

  return {
    W,
    H,
    s,
    k,
    heights,
    sd,
    noise,
    timings: { masks: t1 - t0, noise: t2 - t1, relief: t3 - t2 },
  };
}

/** Texture de relief : niveaux de gris, 0 = fond marin, 255 = sommet. */
export function paintHeight({ W, H, heights }) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const px = img.data;
  for (let i = 0; i < heights.length; i++) {
    const v = heights[i];
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    px[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * Normales en espace tangent par différences finies (Sobel).
 * Convention Three.js (flipY) : la ligne 0 du canvas est le nord, +V pointe vers le nord.
 */
export function paintNormals(
  { W, H, heights },
  strength = NORMAL_STRENGTH,
  worldWidth = 32.5,
  relief = 1.1,
) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const px = img.data;
  // Pente réelle = Δniveau / 255 × relief / taille d'un pixel en unités monde.
  const scale = ((relief / 255) * strength) / (worldWidth / W) / 8;
  for (let y = 0; y < H; y++) {
    const ym = (y > 0 ? y - 1 : y) * W;
    const y0 = y * W;
    const yp = (y < H - 1 ? y + 1 : y) * W;
    for (let x = 0; x < W; x++) {
      const xm = x > 0 ? x - 1 : x;
      const xp = x < W - 1 ? x + 1 : x;
      const gx =
        heights[ym + xp] +
        2 * heights[y0 + xp] +
        heights[yp + xp] -
        (heights[ym + xm] + 2 * heights[y0 + xm] + heights[yp + xm]);
      const gy =
        heights[yp + xm] +
        2 * heights[yp + x] +
        heights[yp + xp] -
        (heights[ym + xm] + 2 * heights[ym + x] + heights[ym + xp]);
      const nx = -gx * scale;
      const ny = gy * scale; // canvas vers le bas = sud ; +V = nord
      const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      const i = (y0 + x) * 4;
      px[i] = (nx * inv * 0.5 + 0.5) * 255;
      px[i + 1] = (ny * inv * 0.5 + 0.5) * 255;
      px[i + 2] = (inv * 0.5 + 0.5) * 255;
      px[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

export { paintColor, createCanvas };

/** Génère les trois textures. Renvoie aussi les champs pour repeindre la couleur à la volée. */
export function generateTextures(map, { width = 4096, palette, params } = {}) {
  const fields = buildFields(map, { width, params });
  const t0 = performance.now();
  const height = paintHeight(fields);
  const normal = paintNormals(fields, params?.normalStrength ?? NORMAL_STRENGTH);
  const t1 = performance.now();
  const color = paintColor(map, fields, palette);
  const t2 = performance.now();
  fields.timings.heightNormal = t1 - t0;
  fields.timings.color = t2 - t1;
  return { fields, height, normal, color };
}
