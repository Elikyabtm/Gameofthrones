// Losange actif, colonne de lumière et étiquettes HTML projetées (PROJET.md §4.5).
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
import { focusPoint } from './camera-path.js';
import { toWorld } from './scene.js';
import { terrainHeightAt } from './terrain.js';

const GOLD = new Color(0xbba476);
const LABEL_MARGIN = 0.08; // marge hors cadre avant de masquer une étiquette
const PULSE_PERIOD = 2.4;

/** Losange à double trait, à plat (contour d'épaisseur `w`, demi-diagonale `r`). */
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
  const group = new Group();
  const mat = new MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
    fog: false,
  });
  group.add(new Mesh(diamondRing(1, 0.035), mat), new Mesh(diamondRing(0.86, 0.018), mat));
  // Colonne de lumière : cylindre ouvert, dégradé additif de 35 % à 0 % vers le haut.
  const column = new Mesh(
    new CylinderGeometry(0.06, 0.06, 1.6, 24, 1, true).translate(0, 0.8, 0),
    new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
      uniforms: { uColor: { value: GOLD }, uOpacity: { value: 1 } },
      vertexShader: /* glsl */ `
        varying float vH;
        void main() {
          vH = position.y / 1.6;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vH;
        void main() { gl_FragColor = vec4(uColor, 0.35 * (1.0 - vH) * uOpacity); }`,
    }),
  );
  column.renderOrder = 3;
  group.renderOrder = 3;
  // La colonne n'est pas un enfant du losange : elle garde sa hauteur de 1,6 quelle que soit
  // l'échelle (et la pulsation) du losange.
  return { rings: group, mat, column };
}

/**
 * @param {object} opts { scene, map, fields, steps, labelsRoot, placeTitle(id), reducedMotion }
 * Chaque étape expose ses cités : la cité visée et les lieux liés présents sur la carte.
 */
export function createMarkers({
  scene,
  map,
  fields,
  steps,
  labelsRoot,
  placeTitle,
  reducedMotion = false,
}) {
  const cityNames = new Set(map.cities.map((c) => c.name));
  const stepCities = steps.map((s) => {
    const names = new Set();
    if (s.focus.city) names.add(s.focus.city);
    for (const l of s.links) {
      const t = l.type === 'place' ? placeTitle(l.id) : null;
      if (t && cityNames.has(t)) names.add(t);
    }
    return names;
  });

  // Étiquettes : une par cité, positionnée au-dessus de sa maquette.
  const labels = map.cities.map((c) => {
    const el = document.createElement('span');
    el.className = 'world-label';
    el.textContent = c.name;
    labelsRoot.append(el);
    const pos = toWorld(c.x, c.y);
    pos.y = terrainHeightAt(fields, c.x, c.y, { radius: 8 }) + 0.42; // au-dessus des tours
    return { name: c.name, el, pos, shown: false };
  });

  // Losange et colonne de l'étape courante.
  const { rings: diamond, mat, column } = createDiamond();
  diamond.visible = false;
  column.visible = false;
  scene.add(diamond, column);
  const anchors = steps.map((s) => {
    const { x, y } = focusPoint(s.focus, map);
    const p = toWorld(x, y);
    p.y = terrainHeightAt(fields, x, y, { radius: 6 }) + 0.012;
    // Le losange encadre la maquette quand il y en a une.
    return { pos: p, size: s.focus.city ? 0.5 : 0.35 };
  });

  const v = new Vector3();
  let current = -2;

  function update({ index, u, time, camera, width, height }) {
    // Losange : visible en palier (fondu d'arrivée), pulsation lente sauf mouvement réduit.
    if (index !== current) {
      current = index;
      if (index >= 0) {
        diamond.position.copy(anchors[index].pos);
        column.position.copy(anchors[index].pos);
      }
    }
    const show = index >= 0 ? Math.min(1, Math.max(0, (u - 0.3) / 0.2)) : 0;
    diamond.visible = column.visible = show > 0;
    if (diamond.visible) {
      // Pulsation ×1 → ×1,08 sur 2,4 s.
      const pulse = reducedMotion
        ? 1
        : 1 + 0.04 * (1 - Math.cos((time / PULSE_PERIOD) * Math.PI * 2));
      diamond.scale.setScalar(anchors[index].size * pulse);
      mat.opacity = show;
      column.material.uniforms.uOpacity.value = show;
    }

    // Étiquettes : cités de l'étape courante, de la précédente et de la suivante.
    const near = new Set();
    for (const k of [index - 1, index, index + 1]) stepCities[k]?.forEach((n) => near.add(n));
    const active = stepCities[index] ?? new Set();
    for (const l of labels) {
      let visible = near.has(l.name);
      if (visible) {
        v.copy(l.pos).project(camera);
        const sx = (v.x + 1) / 2;
        const sy = (1 - v.y) / 2;
        const inFrame =
          v.z < 1 &&
          sx > -LABEL_MARGIN &&
          sx < 1 + LABEL_MARGIN &&
          sy > -LABEL_MARGIN &&
          sy < 1 + LABEL_MARGIN;
        visible = inFrame;
        if (inFrame)
          l.el.style.transform = `translate(${(sx * width).toFixed(1)}px, ${(sy * height).toFixed(1)}px) translate(-50%, -100%)`;
      }
      if (visible !== l.shown) {
        l.shown = visible;
        l.el.classList.toggle('is-visible', visible);
      }
      l.el.classList.toggle('is-active', active.has(l.name));
    }
  }

  return { update, labels };
}
