// Cités à l'échelle (§6.3) : silhouettes sombres de tours et de remparts, au plus 0,15 unité
// de diamètre, avec de petites lumières chaudes aux fenêtres, visibles même de loin.
// Signatures : le Mur qui luit, le Titan de Braavos, les pyramides de Meereen, le Donjon Rouge.
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createCanvas } from './draw.js';
import { rng } from './noise.js';
import { toWorld } from './scene.js';
import { terrainHeightAt } from './terrain.js';

// Taille relative : capitale et grandes cités plus étendues (diamètre max 0,15).
const SIZE = {
  'port-real': 1,
  meereen: 1,
  volantis: 0.95,
  braavos: 0.95,
  qarth: 0.9,
  pentos: 0.8,
  'vaes-dothrak': 0.8,
  astapor: 0.8,
  yunkai: 0.75,
  villevieille: 0.8,
  lancehelion: 0.75,
  winterfell: 0.75,
  'castral-roc': 0.7,
  hautjardin: 0.7,
  valyria: 0.9,
};

const DARK = new MeshStandardMaterial({ color: 0x24221f, roughness: 0.9, flatShading: true });
const RED = new MeshStandardMaterial({ color: 0x5a2a22, roughness: 0.85, flatShading: true });
const SAND = new MeshStandardMaterial({ color: 0x5b4a36, roughness: 0.95, flatShading: true });
const BRONZE = new MeshStandardMaterial({
  color: 0x3a3a30,
  roughness: 0.6,
  metalness: 0.4,
  flatShading: true,
});

function glowTexture() {
  const c = createCanvas(32, 32);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,230,180,1)');
  g.addColorStop(0.3, 'rgba(255,170,80,0.6)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

/** Une silhouette générique : tours, donjon et rempart, plus ses points de fenêtres. */
function genericCity(r, scale, kind) {
  const parts = [];
  const lights = [];
  const R = 0.065 * scale;
  const n = Math.round(4 + 6 * scale);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * R * 0.8;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const h = (0.018 + r() * 0.05) * (i === 0 ? 1.6 : 1) * (0.7 + 0.5 * scale);
    const tower = r() < 0.5;
    const g =
      kind === 'pyramide'
        ? new ConeGeometry(0.012 + r() * 0.012, h * 1.1, 4).rotateY(Math.PI / 4)
        : tower
          ? new CylinderGeometry(0.005, 0.006, h, 6)
          : new BoxGeometry(0.01 + r() * 0.012, h, 0.01 + r() * 0.012);
    g.translate(x, h / 2, z);
    parts.push(g);
    if (tower && kind !== 'pyramide') {
      const roof = new ConeGeometry(0.0075, 0.012, 6);
      roof.translate(x, h + 0.006, z);
      parts.push(roof);
    }
    const w = 1 + Math.floor(r() * 3);
    for (let k = 0; k < w; k++)
      lights.push(x + (r() - 0.5) * 0.008, h * (0.3 + r() * 0.6), z + (r() - 0.5) * 0.008);
  }
  // Rempart : anneau de segments bas.
  const seg = 14;
  for (let i = 0; i < seg; i++) {
    if (r() < 0.12) continue;
    const a = (i / seg) * Math.PI * 2;
    const len = (2 * Math.PI * R) / seg;
    const g = new BoxGeometry(len, 0.012, 0.004);
    g.rotateY(-a + Math.PI / 2);
    g.translate(Math.cos(a) * R, 0.006, Math.sin(a) * R);
    parts.push(g);
  }
  // Lumières de la ville basse, au sol.
  for (let i = 0; i < 10 * scale; i++) {
    const a = r() * Math.PI * 2;
    const d = R * (0.3 + r() * 0.9);
    lights.push(Math.cos(a) * d, 0.004, Math.sin(a) * d);
  }
  return { parts, lights };
}

/** Le Titan de Braavos : silhouette debout, épée levée, à l'entrée de la lagune. */
function titan() {
  const parts = [];
  const legs = [-0.006, 0.006].map((x) =>
    new BoxGeometry(0.005, 0.05, 0.006).translate(x, 0.025, 0),
  );
  parts.push(...legs);
  parts.push(new BoxGeometry(0.018, 0.04, 0.009).translate(0, 0.07, 0));
  parts.push(new BoxGeometry(0.008, 0.01, 0.008).translate(0, 0.096, 0));
  parts.push(new BoxGeometry(0.004, 0.05, 0.004).translate(0.013, 0.11, 0)); // bras levé
  parts.push(new BoxGeometry(0.002, 0.04, 0.002).translate(0.013, 0.15, 0)); // épée
  return { parts, lights: [-0.002, 0.098, 0.004, 0.002, 0.098, 0.004] };
}

export function createCities(map, fields, { lowEnd = false } = {}) {
  const group = new Group();
  group.name = 'cities';
  const byMat = new Map([
    [DARK, []],
    [RED, []],
    [SAND, []],
    [BRONZE, []],
  ]);
  const lights = [];
  const r = rng(77);

  const place = (geoms, mat, origin) => {
    for (const g of geoms) {
      g.translate(origin.x, origin.y, origin.z);
      byMat.get(mat).push(g);
    }
  };

  for (const c of map.cities) {
    const scale = SIZE[c.slug] ?? 0.6;
    const origin = toWorld(c.x, c.y);
    origin.y = terrainHeightAt(fields, c.x, c.y, { radius: 5 }) - 0.004;
    const kind = ['meereen', 'yunkai', 'astapor'].includes(c.slug) ? 'pyramide' : 'ville';
    const { parts, lights: l } = genericCity(r, scale, kind);
    const mat =
      c.slug === 'port-real' ? RED : kind === 'pyramide' || c.region === 'essos' ? SAND : DARK;
    place(parts, mat, origin);
    // Valyria : des ruines, sans lumière humaine.
    if (c.slug !== 'valyria')
      for (let i = 0; i < l.length; i += 3)
        lights.push(l[i] + origin.x, l[i + 1] + origin.y, l[i + 2] + origin.z);
    if (c.slug === 'braavos') {
      const t = titan();
      const at = toWorld(c.x - 14, c.y + 4);
      at.y = 0;
      place(t.parts, BRONZE, at);
      for (let i = 0; i < t.lights.length; i += 3)
        lights.push(t.lights[i] + at.x, t.lights[i + 1], t.lights[i + 2] + at.z);
    }
  }

  for (const [mat, geoms] of byMat) {
    if (!geoms.length) continue;
    const mesh = new Mesh(mergeGeometries(geoms.map((g) => g.toNonIndexed())), mat);
    mesh.name = 'cities-mesh';
    group.add(mesh);
  }

  const lg = new BufferGeometry();
  lg.setAttribute('position', new Float32BufferAttribute(lights, 3));
  const windows = new Points(
    lg,
    new PointsMaterial({
      map: glowTexture(),
      color: new Color(0xffb766),
      size: lowEnd ? 0.03 : 0.024,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      fog: false,
    }),
  );
  windows.name = 'city-lights';
  windows.renderOrder = 5;
  group.add(windows);

  // Le Mur luit légèrement : un ruban émissif posé sur son arête.
  if (map.wall) {
    const pts = map.wall.points.map(([x, y]) => {
      const v = toWorld(x, y);
      v.y = terrainHeightAt(fields, x, y, { radius: 2 }) + 0.003;
      return v;
    });
    const pos = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const side = new Vector3(b.z - a.z, 0, a.x - b.x).normalize().multiplyScalar(0.03);
      pos.push(
        a.x - side.x,
        a.y,
        a.z - side.z,
        b.x - side.x,
        b.y,
        b.z - side.z,
        b.x + side.x,
        b.y,
        b.z + side.z,
      );
      pos.push(
        a.x - side.x,
        a.y,
        a.z - side.z,
        b.x + side.x,
        b.y,
        b.z + side.z,
        a.x + side.x,
        a.y,
        a.z + side.z,
      );
    }
    const wg = new BufferGeometry();
    wg.setAttribute('position', new Float32BufferAttribute(pos, 3));
    wg.computeVertexNormals();
    const wall = new Mesh(
      wg,
      new MeshStandardMaterial({
        color: 0xcfe2ec,
        emissive: 0x7fb4d6,
        emissiveIntensity: 0.55,
        roughness: 0.4,
      }),
    );
    wall.name = 'wall-glow';
    group.add(wall);
  }
  return { group, windows };
}
