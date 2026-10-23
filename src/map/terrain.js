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
