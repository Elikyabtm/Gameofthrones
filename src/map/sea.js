// Mer : plan à y = 0 couvrant la carte avec 20 % de marge (PROJET.md §4.4).
// Ondulation lente dans le shader : ±0,01 le long de la normale et reflet très discret.
// Pas de vagues visibles en vue d'ensemble : seulement une vibration de la lumière.
// Ajouts (à valider) : la mer est plus transparente sur les hauts-fonds (0,92 au large, comme
// prévu) pour laisser voir le trait de côte du parchemin, et ses bords s'effacent dans le noir.
import { Mesh, MeshStandardMaterial, PlaneGeometry, Vector2, Vector4 } from 'three';
import { toWorld } from './scene.js';

export function createSea(map, { heightTexture, reducedMotion = false } = {}) {
  const tw = map.bounds.w / 80;
  const th = map.bounds.h / 80;
  const w = tw * 1.2;
  const h = th * 1.2;
  const geometry = new PlaneGeometry(w, h, 160, 80);
  geometry.rotateX(-Math.PI / 2);

  const center = toWorld(map.bounds.w / 2, map.bounds.h / 2);
  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.01 },
    uHeight: { value: heightTexture },
    // Rectangle du terrain et de la mer en coordonnées monde : x0, z0, largeur, profondeur.
    uTerrain: { value: new Vector4(center.x - tw / 2, center.z - th / 2, tw, th) },
    uSea: { value: new Vector4(center.x - w / 2, center.z - h / 2, w, h) },
    uRelief: { value: new Vector2(1.1, -0.25) }, // displacementScale, displacementBias
    uShallow: { value: 0.42 }, // opacité relative au-dessus des hauts-fonds
  };
  const material = new MeshStandardMaterial({
    color: 0x0b1a20,
    transparent: true,
    opacity: 0.92,
    roughness: 0.42,
    metalness: 0,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    const waves = /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      varying vec3 vSeaWorld;
      // Deux ondes lentes croisées ; renvoie (hauteur, dérivée x, dérivée z).
      vec3 seaWave(vec2 p) {
        float a = p.x * 1.7 + p.y * 0.6 + uTime * 0.35;
        float b = p.y * 2.3 - p.x * 0.4 - uTime * 0.27;
        float hgt = uAmp * (sin(a) + cos(b)) * 0.5;
        float dx = uAmp * 0.5 * (1.7 * cos(a) + 0.4 * sin(b));
        float dz = uAmp * 0.5 * (0.6 * cos(a) - 2.3 * sin(b));
        return vec3(hgt, dx, dz);
      }
    `;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${waves}`)
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vec3 sw = seaWave((modelMatrix * vec4(position, 1.0)).xz);
        objectNormal = normalize(vec3(-sw.y, 1.0, -sw.z));`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.y += sw.x;
        vSeaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform sampler2D uHeight;
        uniform vec4 uTerrain;
        uniform vec4 uSea;
        uniform vec2 uRelief;
        uniform float uShallow;
        varying vec3 vSeaWorld;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // Profondeur sous la mer, lue dans la texture de relief du terrain.
        vec2 tuv = vec2(
          (vSeaWorld.x - uTerrain.x) / uTerrain.z,
          1.0 - (vSeaWorld.z - uTerrain.y) / uTerrain.w
        );
        float inside = step(0.0, tuv.x) * step(tuv.x, 1.0) * step(0.0, tuv.y) * step(tuv.y, 1.0);
        float ground = texture2D(uHeight, clamp(tuv, 0.0, 1.0)).r * uRelief.x + uRelief.y;
        float depth = mix(1.0, -ground, inside);
        diffuseColor.a *= mix(uShallow, 1.0, smoothstep(0.0, 0.16, depth));
        // Bords du plan : effacement progressif dans le fond.
        vec2 q = (vSeaWorld.xz - uSea.xy) / uSea.zw;
        float e = min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y));
        diffuseColor.a *= smoothstep(0.0, 0.08, e);`,
      );
  };

  const mesh = new Mesh(geometry, material);
  mesh.position.copy(center);
  mesh.name = 'sea';
  mesh.renderOrder = 1; // après le terrain (transparence)

  mesh.userData.uniforms = uniforms;
  mesh.userData.update = (dt) => {
    if (!reducedMotion) uniforms.uTime.value += dt;
  };
  return mesh;
}
