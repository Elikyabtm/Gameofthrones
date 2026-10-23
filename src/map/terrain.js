// Terrain : plan déformé par le relief, habillé du parchemin et des normales (PROJET.md §4.3).
import {
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { toWorld } from './scene.js';

/** Enveloppe un canvas (ou OffscreenCanvas) en texture Three.js. */
export function canvasTexture(canvas, renderer, { color = false } = {}) {
  const tex = new CanvasTexture(canvas);
  // Seule la texture couleur est en sRGB ; relief et normales sont des données linéaires.
  tex.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.generateMipmaps = true;
  return tex;
}

/**
 * @param {object} map map.json
 * @param {{ color, height, normal }} canvases canvas générés par textures.js
 */
export function createTerrain(map, canvases, renderer, { lowEnd = false } = {}) {
  const [segX, segY] = lowEnd ? [512, 256] : [1024, 512];
  const geometry = new PlaneGeometry(map.bounds.w / 80, map.bounds.h / 80, segX, segY);
  geometry.rotateX(-Math.PI / 2);

  const material = new MeshStandardMaterial({
    map: canvasTexture(canvases.color, renderer, { color: true }),
    displacementMap: canvasTexture(canvases.height, renderer),
    displacementScale: 1.1,
    displacementBias: -0.25, // relief 0 → y = −0,25 : sous la mer
    normalMap: canvasTexture(canvases.normal, renderer),
    roughness: 1,
    metalness: 0,
  });

  const mesh = new Mesh(geometry, material);
  toWorld(map.bounds.w / 2, map.bounds.h / 2, mesh.position);
  mesh.name = 'terrain';

  // Remplace une des textures (ex. nouvelle palette) en libérant l'ancienne.
  mesh.userData.replaceTexture = (slot, canvas) => {
    const old = material[slot];
    material[slot] = canvasTexture(canvas, renderer, { color: slot === 'map' });
    old?.dispose();
    material.needsUpdate = true;
  };
  return mesh;
}

/**
 * Hauteur monde du terrain au point de carte (x, y), lue dans le champ de relief.
 * Avec `radius` (unités de carte), renvoie le maximum sur un petit disque d'échantillons.
 */
export function terrainHeightAt(fields, x, y, { radius = 0, relief = 1.1, bias = -0.25 } = {}) {
  const { W, H, s, heights } = fields;
  let max = -Infinity;
  const samples = radius ? 12 : 0;
  for (let i = 0; i <= samples; i++) {
    const a = (i / Math.max(1, samples)) * Math.PI * 2;
    const r = i === 0 ? 0 : radius * (i % 2 ? 1 : 0.5);
    const px = Math.min(W - 1, Math.max(0, Math.round((x + Math.cos(a) * r) * s)));
    const py = Math.min(H - 1, Math.max(0, Math.round((y + Math.sin(a) * r) * s)));
    max = Math.max(max, heights[py * W + px]);
  }
  return (max / 255) * relief + bias;
}
