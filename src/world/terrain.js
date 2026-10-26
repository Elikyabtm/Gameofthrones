// Terrain : un plan subdivisé couvrant Westeros et Essos, déformé par le relief (§6.3).
// Mer d'herbe ondulante (shader) et veines de lave émissives à Valyria.
import {
  CanvasTexture,
  Color,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  PlaneGeometry,
  SRGBColorSpace,
  Texture,
} from 'three';
import { RepeatWrapping } from 'three';
import { createCanvas } from './draw.js';
import { rng } from './noise.js';
import { toWorld } from './scene.js';

export const RELIEF = 1.25; // échelle verticale du relief (plus marquée qu'en v1 : 1,1)
export const RELIEF_BIAS = -0.29; // relief 0 → sous la mer ; niveau 58 ≈ y 0

/** Texture depuis un canvas (fil principal) ou une ImageBitmap déjà retournée (Worker). */
export function makeTexture(src, renderer, { color = false } = {}) {
  const isBitmap = typeof ImageBitmap !== 'undefined' && src instanceof ImageBitmap;
  const tex = isBitmap ? new Texture(src) : new CanvasTexture(src);
  if (isBitmap) tex.flipY = false;
  // Seule la texture couleur est en sRGB ; relief, normales et masques sont des données.
  tex.colorSpace = color ? SRGBColorSpace : NoColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  tex.needsUpdate = true;
  return tex;
}

/**
 * Texture de détail répétée (bruit de valeur périodique, 2 octaves) : du grain de près,
 * là où la texture couleur (≈ 126 px par unité) devient floue.
 */
function detailTexture() {
  const N = 256;
  const c = createCanvas(N, N);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(N, N);
  const r = rng(91);
  const octave = (cells) => {
    const g = Array.from({ length: cells * cells }, () => r());
    const at = (i, j) => g[((j + cells) % cells) * cells + ((i + cells) % cells)];
    return (x, y) => {
      const fx = (x / N) * cells;
      const fy = (y / N) * cells;
      const i = Math.floor(fx);
      const j = Math.floor(fy);
      const tx = fx - i;
      const ty = fy - j;
      const sx = tx * tx * (3 - 2 * tx);
      const sy = ty * ty * (3 - 2 * ty);
      const a = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
      const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const o1 = octave(16);
  const o2 = octave(64);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const v = 128 + (o1(x, y) - 0.5) * 120 + (o2(x, y) - 0.5) * 70;
      const i = (y * N + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = NoColorSpace;
  return tex;
}

/**
 * @param {object} map map.json
 * @param {{ color, height, normal, mask }} src canvas ou ImageBitmap
 */
export function createTerrain(
  map,
  src,
  renderer,
  { lowEnd = false, reducedMotion = () => false } = {},
) {
  const [segX, segY] = lowEnd ? [512, 256] : [1024, 512];
  const geometry = new PlaneGeometry(map.bounds.w / 80, map.bounds.h / 80, segX, segY);
  geometry.rotateX(-Math.PI / 2);

  const maskTex = makeTexture(src.mask, renderer);
  const material = new MeshStandardMaterial({
    map: makeTexture(src.color, renderer, { color: true }),
    displacementMap: makeTexture(src.height, renderer),
    displacementScale: RELIEF,
    displacementBias: RELIEF_BIAS,
    normalMap: makeTexture(src.normal, renderer),
    roughness: 0.96,
    metalness: 0,
    emissive: new Color(0xff4a12),
    emissiveIntensity: 1.6,
  });
  const uniforms = {
    uTime: { value: 0 },
    uMask: { value: maskTex },
    uGrass: { value: 1 },
    uDetail: { value: detailTexture() },
  };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime;
        uniform float uGrass;
        uniform sampler2D uMask;
        uniform sampler2D uDetail;`,
      )
      // Mer d'herbe : bandes de lumière qui glissent comme une houle (§6.3).
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        vec4 zoneMask = texture2D(uMask, vMapUv);
        float wave = sin(vMapUv.x * 260.0 + vMapUv.y * 130.0 - uTime * 0.9)
                   * sin(vMapUv.x * 90.0 - vMapUv.y * 70.0 + uTime * 0.5);
        diffuseColor.rgb *= 1.0 + zoneMask.r * uGrass * (0.07 * wave + 0.03);
        // Grain de près (deux échelles), qui s'efface au loin.
        float near = 1.0 - smoothstep(2.0, 9.0, length(vViewPosition));
        float dt = texture2D(uDetail, vMapUv * vec2(260.0, 130.0)).r * 0.6
                 + texture2D(uDetail, vMapUv * vec2(1040.0, 520.0)).r * 0.4;
        diffuseColor.rgb *= 1.0 + (dt - 0.5) * 0.45 * near;`,
      )
      // Lave : seules les veines du masque (canal G) émettent.
      .replace(
        '#include <emissivemap_fragment>',
        `totalEmissiveRadiance *= zoneMask.g * (0.8 + 0.2 * sin(uTime * 1.3 + vMapUv.x * 60.0));`,
      );
  };

  const mesh = new Mesh(geometry, material);
  toWorld(map.bounds.w / 2, map.bounds.h / 2, mesh.position);
  mesh.name = 'terrain';
  mesh.userData.update = (time) => {
    uniforms.uTime.value = time;
    uniforms.uGrass.value = reducedMotion() ? 0 : 1;
  };
  return mesh;
}

/**
 * Hauteur monde du terrain au point de carte (x, y), lue dans le champ de relief.
 * Avec `radius` (unités de carte), renvoie le maximum sur un petit disque d'échantillons.
 */
export function terrainHeightAt(fields, x, y, { radius = 0 } = {}) {
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
  return (max / 255) * RELIEF + RELIEF_BIAS;
}
