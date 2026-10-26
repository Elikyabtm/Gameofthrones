// Ciel (§6.3) : dôme en dégradé qui suit la lumière de l'étape, horizon visible, halo du
// soleil et étoiles qui apparaissent quand le ciel s'assombrit (traversée, Valyria).
import { BackSide, Color, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three';

export function createSky() {
  const uniforms = {
    uTop: { value: new Color(0x1c2733) },
    uHorizon: { value: new Color(0x6d7c86) },
    uSunDir: { value: new Vector3(0, 0.3, -1) },
    uSunColor: { value: new Color(0xffffff) },
    uStars: { value: 0 },
  };
  const material = new ShaderMaterial({
    uniforms,
    side: BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww; // toujours au fond
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      uniform float uStars;
      varying vec3 vDir;
      float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main() {
        float h = max(vDir.y, 0.0);
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(0.0, 0.55, h), 0.8));
        // Sous l'horizon : la couleur basse (la mer et le brouillard prennent le relais).
        col = mix(col, uHorizon * 0.85, smoothstep(0.0, -0.08, vDir.y));
        float sun = max(dot(vDir, normalize(uSunDir)), 0.0);
        col += uSunColor * (pow(sun, 18.0) * 0.35 + pow(sun, 600.0) * 1.2);
        // Étoiles : points fixes, visibles seulement dans un ciel sombre.
        vec3 q = floor(vDir * 340.0);
        float st = step(0.9965, hash(q)) * smoothstep(0.02, 0.25, h);
        col += vec3(st * uStars * (0.6 + 0.4 * hash(q + 1.0)));
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new Mesh(new SphereGeometry(180, 32, 16), material);
  mesh.name = 'sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.userData.uniforms = uniforms;
  return mesh;
}
