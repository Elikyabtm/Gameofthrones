// Texture couleur du paysage (§6.3) : biomes peints depuis map.json, mélangés à l'altitude
// et à la latitude, neige des sommets, forêts, rivières, rivages et veines de lave.
// Renvoie aussi un masque (R = mer d'herbe animée, G = lave émissive).
// Sans DOM : tourne dans le Worker des textures.
import { createCanvas, smoothstep, tracePolygon, traceSmooth } from './draw.js';
import { fbm, fbmGrid, sampleGrid } from './noise.js';

export const BIOMES = {
  glace: [0xd9, 0xe2, 0xe6],
  taiga: [0x6f, 0x7a, 0x6c],
  foret: [0x3f, 0x52, 0x36],
  plaines: [0x7c, 0x8a, 0x4a],
  roche: [0x4d, 0x52, 0x54],
  volcan: [0x24, 0x26, 0x2a],
  sable: [0xb4, 0x8a, 0x5a],
  'mer-herbe': [0x8f, 0x94, 0x59],
  desert: [0x8b, 0x4a, 0x36],
  mediterranee: [0xbf, 0xa7, 0x7f],
};

// Régions de Westeros → biome (§6.3).
const REGION_BIOME = {
  gift: 'taiga',
  north: 'taiga',
  riverlands: 'foret',
  vale: 'foret',
  islands: 'roche',
  west: 'foret',
  crown: 'foret',
  reach: 'plaines',
  storm: 'foret',
  dorne: 'sable',
};
const ISLAND_BIOME = {
  'Île aux Ours': 'taiga',
  Torth: 'foret',
  Lys: 'mediterranee',
  Tyrosh: 'mediterranee',
  Lorath: 'roche',
  'Îles de Valyria': 'volcan',
};

const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const ROCK = [0x6a, 0x68, 0x63];
const SNOW = [0xe4, 0xea, 0xee];
const BEACH = [0xa8, 0x9c, 0x80];
const CANOPY = [0x2a, 0x3a, 0x26];
const SEABED_SHALLOW = [0x3c, 0x55, 0x52];
const SEABED_DEEP = [0x0e, 0x1d, 0x24];
const LAVA = [0xff, 0x5a, 0x1f];

/** Canvas demi-résolution des teintes de biome, flouté pour des transitions douces. */
function biomeCanvas(map, W, H, s) {
  const hw = W >> 1;
  const hh = H >> 1;
  const raw = createCanvas(hw, hh);
  const ctx = raw.getContext('2d');
  ctx.lineJoin = 'round';
  const fill = (points, biome) => {
    ctx.fillStyle = rgb(BIOMES[biome]);
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 6 * (s / 2);
    ctx.beginPath();
    tracePolygon(ctx, points, s / 2);
    ctx.fill();
    ctx.stroke(); // déborde un peu sur la mer : pas de liseré sombre au rivage
  };
  for (const [id, pts] of Object.entries(map.regions)) fill(pts, REGION_BIOME[id] ?? 'foret');
  if (map.beyondWall) fill(map.beyondWall, 'glace');
  if (map.essos) fill(map.essos, 'mediterranee');
  for (const b of map.biomes ?? []) fill(b.points, b.biome);
  for (const i of map.islands ?? []) fill(i.points, ISLAND_BIOME[i.name] ?? 'roche');

  const out = createCanvas(hw, hh);
  const o = out.getContext('2d');
  o.filter = `blur(${28 * (s / 2)}px)`;
  o.drawImage(raw, 0, 0);
  // Masque séparé de la mer d'herbe et du volcan de Valyria (pour le shader et l'émissif).
  const mask = createCanvas(hw, hh);
  const m = mask.getContext('2d');
  m.fillStyle = '#000';
  m.fillRect(0, 0, hw, hh);
  m.filter = `blur(${8 * (s / 2)}px)`;
  for (const b of map.biomes ?? []) {
    if (b.biome !== 'mer-herbe' && !(b.biome === 'volcan' && b.points[0][0] > 1000)) continue;
    m.fillStyle = b.biome === 'mer-herbe' ? '#f00' : '#0f0';
    m.globalCompositeOperation = 'lighter';
    m.beginPath();
    tracePolygon(m, b.points, s / 2);
    m.fill();
  }
  const read = (c) => c.getContext('2d').getImageData(0, 0, hw, hh).data;
  return { colors: read(out), zones: read(mask), hw, hh };
}

/** Masque demi-résolution des forêts (map.forests), flouté. */
function forestMask(map, W, H, s) {
  const hw = W >> 1;
  const hh = H >> 1;
  const c = createCanvas(hw, hh);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, hw, hh);
  ctx.filter = `blur(${5 * (s / 2)}px)`;
  for (const f of map.forests ?? []) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.55 + 0.35 * (f.density ?? 1))})`;
    ctx.beginPath();
    tracePolygon(ctx, f.points, s / 2);
    ctx.fill();
  }
  return ctx.getImageData(0, 0, hw, hh).data;
}

/**
 * @param {object} map map.json
 * @param {object} fields { W, H, s, k, heights, sd, noise } (textures.js)
 * @returns {{ color: Canvas, mask: Canvas }}
 */
export function paintBiomes(map, fields) {
  const { W, H, s, k, heights, sd, noise } = fields;
  const { colors, zones, hw } = biomeCanvas(map, W, H, s);
  const forest = forestMask(map, W, H, s);

  const color = createCanvas(W, H);
  const ctx = color.getContext('2d');
  const img = ctx.createImageData(W, H);
  const px = img.data;
  const maskCanvas = createCanvas(W >> 1, H >> 1);
  const mctx = maskCanvas.getContext('2d');
  const mimg = mctx.createImageData(W >> 1, H >> 1);
  const mpx = mimg.data;

  // Bruits précalculés en grilles (lecture bilinéaire) : 8 M d'appels de fBm seraient trop lents.
  const DW = 1024;
  const DH = DW >> 1;
  const detail = fbmGrid(noise, DW, DH, map.bounds.w / 8, 3); // ~8 unités de carte
  const PW = 512;
  const PH = PW >> 1;
  const patches = fbmGrid(noise, PW, PH, map.bounds.w / 18, 3); // taches (neige, clairières)
  const lavaF = 1 / (9 * s);
  const beachW = 5 * k * 2; // bande de sable côtière (px)
  const c = [0, 0, 0];
  const mix = (t, col) => {
    c[0] += (col[0] - c[0]) * t;
    c[1] += (col[1] - c[1]) * t;
    c[2] += (col[2] - c[2]) * t;
  };

  for (let y = 0; y < H; y++) {
    const lat = y / H; // 0 = nord, 1 = sud
    // Ligne de neige (fraction d'altitude) : basse au nord, haute au sud.
    const snowLine = 0.12 + 0.5 * lat;
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const hi = ((y >> 1) * hw + (x >> 1)) * 4;
      const h = heights[i];
      const d = sd[i];
      const o = i * 4;
      if (d > 0) {
        // Fond marin (vu à travers les hauts-fonds) : du sable verdi au bleu profond.
        const t = smoothstep(0, 60 * k, d);
        c[0] = SEABED_SHALLOW[0] + (SEABED_DEEP[0] - SEABED_SHALLOW[0]) * t;
        c[1] = SEABED_SHALLOW[1] + (SEABED_DEEP[1] - SEABED_SHALLOW[1]) * t;
        c[2] = SEABED_SHALLOW[2] + (SEABED_DEEP[2] - SEABED_SHALLOW[2]) * t;
      } else {
        // Frontières de biomes irrégulières : lecture décalée par un bruit (±34 unités).
        const u0 = x / (W - 1);
        const v0 = y / (H - 1);
        const wx = sampleGrid(patches, PW, PH, u0, v0) * 34 * s;
        const wy = sampleGrid(patches, PW, PH, v0 * 0.7 + 0.2, u0 * 0.7) * 34 * s;
        const bx = Math.min(W - 1, Math.max(0, (x + wx) | 0)) >> 1;
        const by = Math.min(H - 1, Math.max(0, (y + wy) | 0)) >> 1;
        const bi = (by * hw + bx) * 4;
        c[0] = colors[bi];
        c[1] = colors[bi + 1];
        c[2] = colors[bi + 2];
        const alt = Math.max(0, (h - 64) / 160); // 0 = plaine, ~1 = hauts sommets
        const u = x / (W - 1);
        const v = y / (H - 1);
        // Détail : grille + grain par pixel (hachage entier, quasi gratuit).
        const grain = (((x * 73856093) ^ (y * 19349663)) & 1023) / 1023 - 0.5;
        const n = sampleGrid(detail, DW, DH, u, v) + grain * 0.18;
        const patch = sampleGrid(patches, PW, PH, u, v);
        // Forêts : canopée sombre et tachetée.
        const fo = (forest[hi] / 255) * smoothstep(-0.35, 0.25, patch + n * 0.4);
        if (fo > 0) mix(fo * 0.75, CANOPY);
        // Roche en altitude, neige au-dessus de la ligne (bruitée).
        mix(smoothstep(0.3, 0.62, alt + n * 0.06), ROCK);
        mix(smoothstep(snowLine, snowLine + 0.1, alt + n * 0.08), SNOW);
        // Taches de neige dans la toundra du Nord (plus nombreuses vers le Mur).
        if (lat < 0.42)
          mix(smoothstep(0.25, 0.6, patch) * smoothstep(0.42, 0.12, lat) * 0.35, SNOW);
        // Rivage : mince bande de sable clair.
        mix(smoothstep(-beachW, 0, d) * 0.3, BEACH);
        // Lave : veines rougeoyantes sur le volcan de Valyria.
        const lavaZone = zones[hi + 1] / 255;
        if (lavaZone > 0.05) {
          const r = 1 - Math.abs(fbm(noise, x * lavaF + 7.7, y * lavaF + 3.3, 3));
          const vein = smoothstep(0.965, 0.995, r) * lavaZone * 0.8;
          mix(vein, LAVA);
          mpx[hi + 1] = Math.max(mpx[hi + 1], vein * 255);
        }
        // Variations de teinte à grande échelle et détail fin : jamais d'aplat.
        const g = 1 + n * 0.1 + patch * 0.12;
        c[0] *= g;
        c[1] *= g;
        c[2] *= g;
        mpx[hi] = zones[hi];
      }
      px[o] = c[0];
      px[o + 1] = c[1];
      px[o + 2] = c[2];
      px[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  for (let i = 3; i < mpx.length; i += 4) mpx[i] = 255;
  mctx.putImageData(mimg, 0, 0);

  // Eaux douces : rivières et lacs en gris-bleu, le Mur en glace claire.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(62, 86, 96, 0.85)';
  for (const r of map.rivers ?? []) {
    ctx.lineWidth = r.width * k * 0.9;
    ctx.beginPath();
    traceSmooth(ctx, r.points, s);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(52, 74, 84, 0.95)';
  for (const l of map.lakes ?? []) {
    ctx.beginPath();
    tracePolygon(ctx, l.points, s);
    ctx.fill();
  }
  if (map.wall) {
    ctx.strokeStyle = 'rgba(226, 236, 242, 0.95)';
    ctx.lineWidth = 6 * k;
    ctx.beginPath();
    traceSmooth(ctx, map.wall.points, s);
    ctx.stroke();
  }
  return { color, mask: maskCanvas };
}
