// Mer (§6.3) : un plan qui s'étend jusqu'à l'horizon, couleur profonde, petites vagues
// en normales animées (calculées par pixel), reflet du soleil et écume le long des côtes.
// Sur les hauts-fonds, elle s'éclaircit et laisse voir le fond peint dans la texture.
import { Color, Mesh, MeshStandardMaterial, PlaneGeometry, Vector2, Vector4 } from 'three';
import { toWorld } from './scene.js';
import { RELIEF, RELIEF_BIAS } from './terrain.js';

const SIZE = 420; // unités monde : bien au-delà de la portée du brouillard

export function createSea(map, { heightTexture, reducedMotion = () => false } = {}) {
  const tw = map.bounds.w / 80;
  const th = map.bounds.h / 80;
  const geometry = new PlaneGeometry(SIZE, SIZE, 1, 1);
  geometry.rotateX(-Math.PI / 2);

  const center = toWorld(map.bounds.w / 2, map.bounds.h / 2);
  const uniforms = {
    uTime: { value: 0 },
    uHeight: { value: heightTexture },
    // Rectangle du terrain en coordonnées monde : x0, z0, largeur, profondeur.
    uTerrain: { value: new Vector4(center.x - tw / 2, center.z - th / 2, tw, th) },
    uRelief: { value: new Vector2(RELIEF, RELIEF_BIAS) },
    uFoam: { value: new Color(0xd8e2e2) },
    uShallow: { value: new Color(0x2e5a5c) },
  };
  const material = new MeshStandardMaterial({
    color: 0x0e1d24,
    transparent: true,
    opacity: 0.94,
    roughness: 0.28,
    metalness: 0.05,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSeaWorld;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvSeaWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;',
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        uniform float uTime;
        uniform sampler2D uHeight;
        uniform vec4 uTerrain;
        uniform vec2 uRelief;
        uniform vec3 uFoam;
        uniform vec3 uShallow;
        varying vec3 vSeaWorld;
        float seaGround;
        // Somme de vagues directionnelles : renvoie la pente (d/dx, d/dz).
        vec2 seaSlope(vec2 p, float t) {
          vec2 g = vec2(0.0);
          vec4 W[4];
          W[0] = vec4(0.83, 0.55, 7.0, 0.9);
          W[1] = vec4(-0.4, 0.92, 11.0, 1.3);
          W[2] = vec4(0.97, -0.24, 17.0, 1.7);
          W[3] = vec4(-0.7, -0.71, 27.0, 2.3);
          for (int i = 0; i < 4; i++) {
            float k = W[i].z;
            float ph = dot(W[i].xy, p) * k + t * W[i].w;
            g += W[i].xy * cos(ph) * (0.018 / (1.0 + float(i) * 0.6));
          }
          return g;
        }`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        vec2 tuv = vec2((vSeaWorld.x - uTerrain.x) / uTerrain.z, 1.0 - (vSeaWorld.z - uTerrain.y) / uTerrain.w);
        float inside = step(0.0, tuv.x) * step(tuv.x, 1.0) * step(0.0, tuv.y) * step(tuv.y, 1.0);
        seaGround = mix(-1.0, texture2D(uHeight, clamp(tuv, 0.0, 1.0)).r * uRelief.x + uRelief.y, inside);
        float depth = -seaGround;
        // Hauts-fonds : eau plus claire et plus transparente près des côtes.
        float shallow = 1.0 - smoothstep(0.0, 0.14, depth);
        diffuseColor.rgb = mix(diffuseColor.rgb, uShallow, shallow * 0.55);
        diffuseColor.a *= mix(0.55, 1.0, smoothstep(0.0, 0.1, depth));
        // Écume : un liseré clair et mouvant le long du rivage.
        float band = smoothstep(0.045, 0.0, depth) * step(0.0, depth + 0.004);
        float ripple = 0.5 + 0.5 * sin(depth * 160.0 - uTime * 1.6 + vSeaWorld.x * 3.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, band * (0.35 + 0.45 * ripple));
        diffuseColor.a = max(diffuseColor.a, band * 0.9);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        // Petites vagues : atténuées au loin pour éviter le scintillement.
        float fade = 1.0 - smoothstep(6.0, 40.0, length(vViewPosition));
        vec2 sl = seaSlope(vSeaWorld.xz, uTime) * fade;
        vec3 wn = normalize(vec3(-sl.x, 1.0, -sl.y));
        normal = normalize((viewMatrix * vec4(wn, 0.0)).xyz);`,
      );
  };

  const mesh = new Mesh(geometry, material);
  mesh.position.copy(center);
  mesh.name = 'sea';
  mesh.renderOrder = 1; // après le terrain (transparence)
  mesh.userData.update = (dt) => {
    if (!reducedMotion()) uniforms.uTime.value += dt;
  };
  return mesh;
}
