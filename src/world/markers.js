// Losange actif, colonne de lumière et étiquettes HTML projetées (§6.5).
// Étiquettes : serif crème sans boîte ; lieu courant (22 px) et lieux des étapes voisines
// (16 px) seulement ; noms des mers en italique très discret.
import {
  AdditiveBlending,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Shape,
  ShapeGeometry,
  ShaderMaterial,
  Vector3,
} from 'three';
import { toWorld } from './scene.js';
import { terrainHeightAt } from './terrain.js';

const GOLD = new Color(0xc9b27c);
const LABEL_MARGIN = 0.06;
const PULSE_PERIOD = 2.4;

/** Losange fin, à plat (contour d'épaisseur `w`, demi-diagonale `r`). */
function diamondRing(r, w) {
  const shape = new Shape();
  shape.moveTo(0, r).lineTo(r, 0).lineTo(0, -r).lineTo(-r, 0).closePath();
  const hole = new Shape();
  const q = r - w * Math.SQRT2;
  hole.moveTo(0, q).lineTo(q, 0).lineTo(0, -q).lineTo(-q, 0).closePath();
  shape.holes.push(hole);
  const g = new ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  return g;
}

function createDiamond() {
  const rings = new Group();
  const mat = new MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  rings.add(new Mesh(diamondRing(1, 0.03), mat), new Mesh(diamondRing(0.84, 0.015), mat));
  rings.renderOrder = 6;
  // Colonne de lumière discrète : cylindre ouvert, dégradé additif vers le haut.
  const column = new Mesh(
    new CylinderGeometry(0.004, 0.004, 0.8, 12, 1, true).translate(0, 0.4, 0),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: { uColor: { value: GOLD }, uOpacity: { value: 1 } },
      vertexShader: `varying float vH; void main(){ vH = position.y / 0.8; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uColor; uniform float uOpacity; varying float vH; void main(){ gl_FragColor = vec4(uColor, 0.32 * (1.0 - vH) * (1.0 - vH) * uOpacity); }`,
    }),
  );
  column.renderOrder = 6;
  return { rings, mat, column };
}

/**
 * @param {object} o { scene, map, fields, steps, labelsRoot }
 * Les étiquettes sont celles des cités de map.json, rattachées aux étapes par leur slug.
 */
export function createMarkers({ scene, map, fields, steps, labelsRoot }) {
  // Cités de chaque étape : le lieu principal et les lieux liés présents sur la carte.
  const citySlugs = new Set(map.cities.map((c) => c.slug));
  const stepCities = steps.map(
    (s) => new Set([s.place, ...s.links].filter((x) => citySlugs.has(x))),
  );

  const label = (text, cls, x, y, lift) => {
    const el = document.createElement('span');
    el.className = `world-label ${cls}`;
    el.textContent = text;
    labelsRoot.append(el);
    const pos = toWorld(x, y);
    pos.y = (lift ? terrainHeightAt(fields, x, y, { radius: 6 }) : 0) + lift;
    return { el, pos, shown: false };
  };
  const cities = map.cities.map((c) => ({ slug: c.slug, ...label(c.name, '', c.x, c.y, 0.09) }));
  const seas = (map.seas ?? []).map((s) => label(s.name, 'is-sea', s.x, s.y, 0));

  const { rings, mat, column } = createDiamond();
  rings.visible = column.visible = false;
  scene.add(rings, column);
  const anchors = steps.map((s) => {
    const p = toWorld(s.focus.x, s.focus.y);
    p.y = terrainHeightAt(fields, s.focus.x, s.focus.y, { radius: 5 }) + 0.006;
    return p;
  });

  const v = new Vector3();
  const project = (l, camera, width, height) => {
    v.copy(l.pos).project(camera);
    const sx = (v.x + 1) / 2;
    const sy = (1 - v.y) / 2;
    const ok =
      v.z < 1 &&
      sx > -LABEL_MARGIN &&
      sx < 1 + LABEL_MARGIN &&
      sy > -LABEL_MARGIN &&
      sy < 1 + LABEL_MARGIN;
    if (ok)
      l.el.style.transform = `translate(${(sx * width).toFixed(1)}px, ${(sy * height).toFixed(1)}px) translate(-50%, -100%)`;
    return ok;
  };
  const show = (l, on) => {
    if (on === l.shown) return;
    l.shown = on;
    l.el.classList.toggle('is-visible', on);
  };

  /**
   * @param {object} p { index, u, time, camera, width, height, mode, reduced, showSeas }
   * index = étape courante (−1 : intro ou crossing sans étape).
   */
  function update({
    index,
    u,
    time,
    camera,
    width,
    height,
    mode = 'map',
    reduced = false,
    showSeas = false,
  }) {
    const inMap = mode === 'map';
    // Losange : s'allume pendant l'approche (u 0,30 → 0,42), pulse lentement.
    const glow =
      inMap && index >= 0
        ? Math.min(1, Math.max(0, (u - 0.3) / 0.12)) * (u < 0.95 ? 1 : (1 - u) / 0.05)
        : 0;
    rings.visible = column.visible = glow > 0;
    if (glow > 0) {
      rings.position.copy(anchors[index]);
      column.position.copy(anchors[index]);
      const pulse = reduced ? 1 : 1 + 0.04 * (1 - Math.cos((time / PULSE_PERIOD) * Math.PI * 2));
      rings.scale.setScalar(0.11 * pulse);
      mat.opacity = glow;
      column.material.uniforms.uOpacity.value = glow;
    }
    const near = new Set();
    for (const k of [index - 1, index, index + 1]) stepCities[k]?.forEach((n) => near.add(n));
    const active = stepCities[index] ?? new Set();
    for (const l of cities) {
      const on = inMap && near.has(l.slug) && project(l, camera, width, height);
      show(l, on);
      l.el.classList.toggle('is-active', active.has(l.slug));
    }
    for (const l of seas) show(l, inMap && showSeas && project(l, camera, width, height));
  }

  return { update, cities };
}
