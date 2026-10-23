// Texture couleur « parchemin sombre » (PROJET.md §4.2-B). Aucun texte n'y est dessiné :
// les noms de lieux sont des étiquettes HTML (§4.5).
import { createCanvas, smoothstep, traceSmooth } from './draw.js';
import { rng } from './noise.js';
import { DEFAULT_PALETTE, PALETTES, rgb } from './palettes.js';

const mix = (a, b, t) => a + (b - a) * t;

// Hachage entier rapide → [0, 1) : grain du papier, sans état.
function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Peint la texture couleur à partir des champs de buildFields().
 * @param {object} map données de map.json
 * @param {object} fields { W, H, s, k, heights, sd, noise }
 * @param {object} palette entrée de PALETTES
 */
export function paintColor(map, fields, palette = PALETTES[DEFAULT_PALETTE]) {
  const { W, H, s, k, heights, sd, noise } = fields;
  const C = Object.fromEntries(
    Object.entries(palette)
      .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
      .map(([key, v]) => [key, rgb(v)]),
  );
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(W, H);
  const px = img.data;

  const inkW = 1.25 * k; // demi-largeur du trait de côte (2,5 px)
  const engraveOffset = 4 * k; // second trait, décalé vers le large
  const engraveW = 0.75 * k;
  const jitterFreq = 0.06 / k; // fréquence du tremblé (en cycles par pixel)

  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    for (let x = 0; x < W; x++) {
      const u = x / (W - 1);
      const i = y * W + x;
      const d = sd[i];
      const h = heights[i];

      // Mer : plus sombre vers les bords de la carte.
      const ex = (u - 0.5) * 2;
      const ey = (v - 0.5) * 2;
      const edge = smoothstep(0.35, 1.25, Math.sqrt(ex * ex + ey * ey));
      let r = mix(C.sea[0], C.seaEdge[0], edge);
      let g = mix(C.sea[1], C.seaEdge[1], edge);
      let b = mix(C.sea[2], C.seaEdge[2], edge);

      // Terres : sommets éclaircis, vallées assombries.
      const land = smoothstep(0.75, -0.75, d);
      if (land > 0) {
        let lr;
        let lg;
        let lb;
        if (h >= 70) {
          const t = Math.min(1, (h - 70) / 110);
          lr = mix(C.land[0], C.peak[0], t);
          lg = mix(C.land[1], C.peak[1], t);
          lb = mix(C.land[2], C.peak[2], t);
        } else {
          const t = Math.min(1, (70 - h) / 30);
          lr = mix(C.land[0], C.valley[0], t);
          lg = mix(C.land[1], C.valley[1], t);
          lb = mix(C.land[2], C.valley[2], t);
        }
        // Neige : au-delà du Mur (y carte < ~170, bord irrégulier) et sur les hauts sommets.
        const ym = y / s + noise((x * 0.004) / k, (y * 0.004) / k) * 22;
        const snow = Math.max(smoothstep(178, 140, ym), smoothstep(185, 225, h));
        if (snow > 0) {
          lr = mix(lr, C.snow[0], snow * 0.9);
          lg = mix(lg, C.snow[1], snow * 0.9);
          lb = mix(lb, C.snow[2], snow * 0.9);
        }
        r = mix(r, lr, land);
        g = mix(g, lg, land);
        b = mix(b, lb, land);
      }

      // Côtes : trait d'encre tremblé (±1 px), puis contour « de graveur » à 30 %.
      if (d > -4 * k && d < engraveOffset + 3 * k) {
        const dd = d + noise(x * jitterFreq, y * jitterFreq) * k;
        const ink = 1 - smoothstep(inkW - 0.6, inkW + 0.6, Math.abs(dd));
        const engrave =
          dd > 0
            ? 0.3 * (1 - smoothstep(engraveW - 0.5, engraveW + 0.5, Math.abs(dd - engraveOffset)))
            : 0;
        const a = Math.max(ink, engrave);
        r = mix(r, C.ink[0], a);
        g = mix(g, C.ink[1], a);
        b = mix(b, C.ink[2], a);
      }

      // Grain de papier : bruit à 6 % d'opacité sur toute la texture.
      const grain = hash(x, y) * 255;
      const o = i * 4;
      px[o] = mix(r, grain, 0.06);
      px[o + 1] = mix(g, grain, 0.06);
      px[o + 2] = mix(b, grain, 0.06);
      px[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  drawHatching(ctx, map, fields, palette);
  drawLines(ctx, map, s, k, palette);
  drawStains(ctx, W, H, k);
  return canvas;
}

// Hachures courtes à 35°, densité proportionnelle à h, plus serrées vers le sommet.
function drawHatching(ctx, map, { W, s, k, sd }, palette) {
  const rand = rng(4242);
  const angle = (-35 * Math.PI) / 180; // « / » : 35° au-dessus de l'horizontale
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  ctx.save();
  ctx.strokeStyle = palette.hatch;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.1 * k;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const m of map.mountains ?? []) {
    const rx = m.rx * s;
    const ry = m.ry * s;
    const count = Math.round(((Math.PI * rx * ry) / (70 * k * k)) * m.h);
    for (let n = 0; n < count; n++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      if (rand() > Math.pow(1 - r, 0.6)) continue; // plus dense au centre
      const x = m.x * s + Math.cos(a) * r * rx;
      const y = m.y * s + Math.sin(a) * r * ry;
      if (sd[(y | 0) * W + (x | 0)] > -3 * k) continue; // jamais sur la mer
      const len = (6 + rand() * 5) * k * (0.6 + 0.4 * (1 - r));
      ctx.moveTo(x - (cos * len) / 2, y - (sin * len) / 2);
      ctx.lineTo(x + (cos * len) / 2, y + (sin * len) / 2);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Rivières (trait fin) et Mur (filet de glace pâle).
function drawLines(ctx, map, s, k, palette) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = palette.river;
  for (const r of map.rivers ?? []) {
    ctx.lineWidth = Math.max(0.8, 1.5 * k * (r.width / 3));
    ctx.beginPath();
    traceSmooth(ctx, r.points, s);
    ctx.stroke();
  }
  if (map.wall) {
    // Le Mur : toute l'arête en glace blanche (largeur de l'arête du relief).
    ctx.strokeStyle = palette.wall;
    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 10 * k;
    ctx.beginPath();
    traceSmooth(ctx, map.wall.points, s);
    ctx.stroke();
  }
  ctx.restore();
}

// Quelques taches irrégulières à 4 % : l'usure du papier.
function drawStains(ctx, W, H, k) {
  const rand = rng(99);
  ctx.save();
  for (let n = 0; n < 16; n++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = (80 + rand() * 260) * k;
    const dark = rand() > 0.35;
    const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    const c = dark ? '40, 28, 12' : '220, 205, 170';
    grad.addColorStop(0, `rgba(${c}, 0.04)`);
    grad.addColorStop(0.6, `rgba(${c}, 0.025)`);
    grad.addColorStop(1, `rgba(${c}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    // Contour irrégulier : ellipse légèrement aplatie et tournée.
    ctx.ellipse(x, y, r, r * (0.55 + rand() * 0.4), rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
