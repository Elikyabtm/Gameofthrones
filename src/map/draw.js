// Utilitaires de dessin partagés par textures.js et parchment.js (sans DOM obligatoire).

export function createCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Toutes les terres : régions + au-delà du Mur.
export const landPolygons = (map) =>
  [...Object.values(map.regions), map.beyondWall].filter(Boolean);

export function tracePolygon(ctx, pts, s) {
  ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * s, pts[i][1] * s);
  ctx.closePath();
}

// Polyligne lissée (courbes quadratiques passant par les milieux des segments).
export function traceSmooth(ctx, pts, s) {
  ctx.moveTo(pts[0][0] * s, pts[0][1] * s);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) / 2) * s;
    const my = ((pts[i][1] + pts[i + 1][1]) / 2) * s;
    ctx.quadraticCurveTo(pts[i][0] * s, pts[i][1] * s, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0] * s, last[1] * s);
}
