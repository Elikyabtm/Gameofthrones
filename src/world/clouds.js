// Nuages volumétriques simulés (§6.3) : 30 à 40 plans à texture douce, en deux couches
// d'altitude, toujours tournés vers la caméra. La caméra les traverse pendant les vols ;
// ils s'estompent quand elle est trop près pour ne pas boucher la vue.
import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SRGBColorSpace,
} from 'three';
import { createCanvas } from './draw.js';
import { rng } from './noise.js';
import { toWorld } from './scene.js';

/** Texture de nuage : agrégat de disques flous, bords effilochés. */
function cloudTexture(seed) {
  const c = createCanvas(256, 128);
  const ctx = c.getContext('2d');
  const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const x = 40 + r() * 176;
    const y = 50 + r() * 36 - Math.abs(x - 128) * 0.12;
    const rad = 18 + r() * 34;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export function createClouds(map, { count = 36, reducedMotion = () => false } = {}) {
  const group = new Group();
  group.name = 'clouds';
  const textures = [cloudTexture(11), cloudTexture(23), cloudTexture(37)];
  const r = rng(2024);
  const geo = new PlaneGeometry(1, 0.5);
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const high = i % 3 === 0; // un tiers dans la couche haute
    const x = 120 + r() * (map.bounds.w - 240);
    const y = 60 + r() * (map.bounds.h - 120);
    const pos = toWorld(x, y);
    pos.y = high ? 6.5 + r() * 1.5 : 3.6 + r() * 1.4;
    const size = high ? 7 + r() * 6 : 4 + r() * 4;
    const mat = new MeshBasicMaterial({
      map: textures[i % 3],
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
      color: new Color(0xffffff),
      fog: true,
    });
    const m = new Mesh(geo, mat);
    m.position.copy(pos);
    m.scale.set(size, size, 1);
    m.renderOrder = 4;
    m.userData = { base: pos.clone(), speed: 0.02 + r() * 0.03, size, opacity: high ? 0.55 : 0.8 };
    group.add(m);
    clouds.push(m);
  }

  let amount = 1;
  return {
    group,
    /** Teinte de l'étape (les nuages prennent la couleur du ciel bas). */
    setTint(color) {
      for (const c of clouds) c.material.color.copy(color).lerp(new Color(0xffffff), 0.45);
    },
    /** Densité globale (0 en palier rapproché, 1 en vol). */
    setAmount(a) {
      amount = a;
    },
    update(camera, time) {
      const moving = !reducedMotion();
      for (const c of clouds) {
        if (moving)
          c.position.x =
            c.userData.base.x + Math.sin(time * c.userData.speed + c.userData.base.z) * 1.5;
        c.quaternion.copy(camera.quaternion);
        // Fondu à l'approche : ni mur blanc en traversée, ni nuage collé à l'objectif.
        const d = c.position.distanceTo(camera.position);
        const near = Math.min(1, Math.max(0, (d - 0.8) / (c.userData.size * 0.6)));
        c.material.opacity = c.userData.opacity * near * amount;
        c.visible = c.material.opacity > 0.01;
      }
    },
  };
}
