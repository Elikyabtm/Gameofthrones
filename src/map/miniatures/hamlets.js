// Hameaux : petits groupes de maisons semés dans les campagnes (détail des cartes-puzzles).
// Positions tirées au hasard (seed fixe) sur les terres, loin des cités, des forêts,
// des montagnes et de la neige. Tout est fusionné en un maillage par matériau.
import { createKit } from './kit.js';
import { rng } from '../noise.js';
import { terrainHeightAt } from '../terrain.js';

const inside = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export function createHamlets(
  map,
  fields,
  { count = 34, sc = 1.35, relief = 1.1, bias = -0.25 } = {},
) {
  const rand = rng(313);
  const placed = [];
  for (let tries = 0; placed.length < count && tries < 4000; tries++) {
    const x = 200 + rand() * 420;
    const y = 190 + rand() * 900; // au sud du Mur
    const h = terrainHeightAt(fields, x, y, { radius: 3, relief, bias });
    if (h < 0.04 || h > 0.2) continue; // mer, rivages, reliefs
    if (map.cities.some((c) => Math.hypot(c.x - x, c.y - y) < 38)) continue;
    if (placed.some(([px, py]) => Math.hypot(px - x, py - y) < 34)) continue;
    if ((map.forests ?? []).some((f) => inside(f.points, x, y))) continue;
    if ((map.lakes ?? []).some((l) => inside(l.points, x, y))) continue;
    placed.push([x, y, h]);
  }

  // Un seul kit pour tous les hameaux : coordonnées en unités de carte relatives à l'origine
  // de toWorld (410, 590), hauteur convertie en unités de carte (×80). `sc` : taille des maisons.
  const k = createKit();
  for (const [x, y, h] of placed) {
    const ox = x - 410;
    const oz = y - 590;
    const base = h * 80;
    const n = 3 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const r = (1.5 + rand() * 3) * sc;
      k.hall(ox + Math.cos(a) * r, oz + Math.sin(a) * r, {
        w: (1.4 + rand() * 0.8) * sc,
        d: (1 + rand() * 0.4) * sc,
        h: (0.8 + rand() * 0.5) * sc,
        base,
        rot: rand() * Math.PI,
        roofKey: rand() > 0.5 ? 'roof' : 'tile',
      });
    }
    // Tour de guet ou petit septuaire.
    if (rand() > 0.6) k.tower(ox, oz, { r: 0.8 * sc, h: 3 * sc, base, roof: 'cone' });
  }
  const group = k.build(1 / 80);
  group.name = 'hameaux';
  return group;
}
