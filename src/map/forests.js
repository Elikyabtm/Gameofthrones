// Forêts : des milliers de petits arbres instanciés (un seul appel de dessin), dans l'esprit
// des cartes-puzzles en relief. Les zones viennent de map.json → forests.
import {
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createNoise, rng } from './noise.js';
import { toWorld } from './scene.js';
import { terrainHeightAt } from './terrain.js';

const inside = (pts, x, y) => {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

const distToSegment = (px, py, [ax, ay], [bx, by]) => {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
};

/** Pin stylisé (unités de carte) : deux cônes étagés sur un court tronc. */
function pineGeometry() {
  const parts = [
    new ConeGeometry(1.2, 2.4, 6).translate(0, 2.0, 0),
    new ConeGeometry(0.85, 1.9, 6).translate(0, 3.2, 0),
    new CylinderGeometry(0.2, 0.26, 1, 5).translate(0, 0.5, 0),
  ];
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  parts.forEach((g) => g.dispose());
  return geo;
}

/** Feuillu stylisé : houppier arrondi (icosaèdre aplati) sur un tronc. */
function broadleafGeometry() {
  const parts = [
    new IcosahedronGeometry(1.35, 0).scale(1, 0.85, 1).translate(0, 2.2, 0),
    new CylinderGeometry(0.22, 0.3, 1.2, 5).translate(0, 0.6, 0),
  ];
  const geo = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  parts.forEach((g) => g.dispose());
  return geo;
}

/** Distance (unités de carte) d'un point au bord d'un polygone. */
const distToEdge = (pts, x, y) =>
  Math.min(...pts.map((p, i) => distToSegment(x, y, pts[(i + pts.length - 1) % pts.length], p)));

export function createForests(map, fields, { density = 1 / 14, relief = 1.1, bias = -0.25 } = {}) {
  const rand = rng(2024);
  const noise = createNoise(77);
  const spots = { pine: [], broadleaf: [] };
  const blockers = map.cities.map((c) => [c.x, c.y]);
  for (const forest of map.forests ?? []) {
    const xs = forest.points.map((p) => p[0]);
    const ys = forest.points.map((p) => p[1]);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const count = Math.round((x1 - x0) * (y1 - y0) * density * (forest.density ?? 1));
    for (let n = 0; n < count; n++) {
      const x = x0 + rand() * (x1 - x0);
      const y = y0 + rand() * (y1 - y0);
      if (!inside(forest.points, x, y)) continue;
      // Lisière irrégulière : densité qui monte depuis le bord, modulée par un bruit.
      const n1 = noise(x / 28, y / 28);
      const edge = Math.min(1, distToEdge(forest.points, x, y) / 14);
      if (rand() > edge * (0.55 + 0.45 * n1) + 0.15) continue;
      // Ni sur les cités, ni dans le lit des rivières, ni sur les hauts sommets, ni en mer.
      if (blockers.some(([cx, cy]) => Math.hypot(x - cx, y - cy) < 24)) continue;
      const nearRiver = (map.rivers ?? []).some((r) =>
        r.points.some((p, i) => i && distToSegment(x, y, r.points[i - 1], p) < 3),
      );
      if (nearRiver) continue;
      const h = terrainHeightAt(fields, x, y, { relief, bias });
      if (h < 0.01 || h > 0.45) continue;
      // Essence : pins au nord et sur la neige, feuillus au sud, mélange entre les deux.
      const kind = forest.kind ?? 'mixte';
      const pineShare = kind === 'pins' ? 0.92 : kind === 'feuillus' ? 0.08 : 0.5;
      const list = rand() < pineShare ? spots.pine : spots.broadleaf;
      list.push([x, y, h, 0.7 + rand() * 0.7, rand() * Math.PI * 2, rand()]);
    }
  }

  const group = new Group();
  group.name = 'forêts';
  const material = new MeshStandardMaterial({ roughness: 0.92, metalness: 0, flatShading: true });
  const dummy = new Object3D();
  const color = new Color();
  for (const [kind, list] of Object.entries(spots)) {
    const geo = kind === 'pine' ? pineGeometry() : broadleafGeometry();
    const mesh = new InstancedMesh(geo, material, list.length);
    list.forEach(([x, y, h, s, rot, tone], i) => {
      toWorld(x, y, dummy.position);
      dummy.position.y = h - 0.004;
      dummy.rotation.y = rot;
      dummy.scale.setScalar((s * 1.15) / 80);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // Verts sombres : pins plus bleutés, feuillus plus jaunes, légères variations.
      const hue = kind === 'pine' ? 0.3 + tone * 0.05 : 0.22 + tone * 0.06;
      color.setHSL(hue, 0.38 + tone * 0.12, 0.085 + tone * 0.06);
      mesh.setColorAt(i, color);
    });
    mesh.name = kind;
    group.add(mesh);
  }
  return group;
}
