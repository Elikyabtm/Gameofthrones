// Boîte à outils des maquettes : tours, remparts, donjons, maisons, socles.
// Tout est généré par le code (aucun modèle importé) et exprimé en UNITÉS DE CARTE ;
// le groupe final est mis à l'échelle 1/80 pour passer en unités monde (comme toWorld).
// Les pièces sont regroupées par matériau puis fusionnées : un seul maillage par matériau.
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Teintes « figurine » : pierre ivoire mate, toits bruns, quelques accents.
export const MINI_COLORS = {
  stone: 0xd6cdb8,
  stoneDark: 0x9a9182,
  roof: 0x6e4c34,
  red: 0x8e3226,
  ice: 0xe4ecee,
  wood: 0x5b4331,
  plinth: 0x6a5a44,
  leaves: 0xc0452c, // barral
  bark: 0xe8e2d4,
  green: 0x4c5a33,
  tile: 0xc0662f, // tuiles orange (Port-Réal)
  grass: 0x6f7a45,
  rock: 0x8a7860, // roc de Castral Roc, pitons de Pyk
  black: 0x34302d, // pierre noire de Peyredragon
  sand: 0xd8b57c, // grès de Dorne
  gold: 0xc9a24a, // toits et dômes dorés
  white: 0xece8de, // marbre (Les Eyrié, Villevieille)
  water: 0x2b4952, // douves
  slate: 0x6c7277, // ardoises (Blancport)
  fire: 0xff8a3d, // fanal de la Tour Hightower (émissif)
};

const materials = new Map();
/** Matériau partagé, mat et à facettes (aspect maquette peinte). */
export function material(key) {
  if (!materials.has(key)) {
    materials.set(
      key,
      new MeshStandardMaterial({
        color: MINI_COLORS[key],
        roughness: key === 'water' ? 0.3 : 0.85,
        metalness: key === 'gold' ? 0.35 : 0,
        flatShading: true,
        emissive: key === 'fire' ? MINI_COLORS.fire : 0x000000,
        emissiveIntensity: key === 'fire' ? 2.5 : 0,
      }),
    );
  }
  return materials.get(key);
}

/** Collecteur de pièces : add(matériau, géométrie) puis build() → Group fusionné. */
export function createKit() {
  const parts = new Map();
  const add = (key, geo) => {
    if (!parts.has(key)) parts.set(key, []);
    parts.get(key).push(geo);
    return geo;
  };

  const kit = {
    add,

    /** Socle octogonal sous la maquette (cache la jonction avec le relief). */
    plinth(r, h = 1.2, sides = 8) {
      const g = new CylinderGeometry(r, r * 1.04, h, sides);
      g.translate(0, h / 2 - 0.4, 0);
      add('plinth', g);
      return h - 0.4;
    },

    /** Tour cylindrique, toit conique ou créneaux. */
    tower(x, z, { r = 1.6, h = 7, base = 0, roof = 'cone', roofKey = 'roof', key = 'stone' } = {}) {
      const body = new CylinderGeometry(r, r * 1.08, h, 10);
      body.translate(x, base + h / 2, z);
      add(key, body);
      if (roof === 'cone') {
        const cone = new ConeGeometry(r * 1.25, r * 2.2, 10);
        cone.translate(x, base + h + r * 1.1, z);
        add(roofKey, cone);
      } else {
        kit.crenels(x, z, r, base + h, key);
      }
    },

    /** Créneaux en couronne au sommet d'une tour. */
    crenels(x, z, r, y, key = 'stone', n = 8) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const m = new BoxGeometry(r * 0.45, r * 0.5, r * 0.45);
        m.rotateY(-a);
        m.translate(x + Math.cos(a) * r * 0.9, y + r * 0.25, z + Math.sin(a) * r * 0.9);
        add(key, m);
      }
    },

    /** Rempart le long d'une polyligne fermée [[x, z], …], avec merlons. */
    wall(points, { h = 3.2, t = 1, base = 0, key = 'stone', closed = true, merlons = true } = {}) {
      const n = closed ? points.length : points.length - 1;
      for (let i = 0; i < n; i++) {
        const [ax, az] = points[i];
        const [bx, bz] = points[(i + 1) % points.length];
        const len = Math.hypot(bx - ax, bz - az);
        const angle = Math.atan2(bz - az, bx - ax);
        const seg = new BoxGeometry(len + t, h, t);
        seg.rotateY(-angle);
        seg.translate((ax + bx) / 2, base + h / 2, (az + bz) / 2);
        add(key, seg);
        if (!merlons) continue;
        const count = Math.max(1, Math.floor(len / 1.6));
        for (let k = 0; k < count; k++) {
          const f = (k + 0.5) / count;
          const m = new BoxGeometry(0.7, 0.7, t * 1.05);
          m.rotateY(-angle);
          m.translate(ax + (bx - ax) * f, base + h + 0.35, az + (bz - az) * f);
          add(key, m);
        }
      }
    },

    /** Bâtiment rectangulaire, toit à deux pans ou plat crénelé. */
    hall(
      x,
      z,
      {
        w = 5,
        d = 3,
        h = 4,
        base = 0,
        rot = 0,
        roof = 'gable',
        key = 'stone',
        roofKey = 'roof',
      } = {},
    ) {
      const body = new BoxGeometry(w, h, d);
      body.rotateY(rot);
      body.translate(x, base + h / 2, z);
      add(key, body);
      if (roof === 'gable') {
        // Prisme triangulaire : cylindre à 3 faces couché le long de la longueur.
        const ridge = new CylinderGeometry(d * 0.62, d * 0.62, w, 3);
        ridge.rotateZ(Math.PI / 2);
        ridge.rotateX(-Math.PI / 2); // arête vers le haut
        ridge.scale(1, 0.75, 1);
        ridge.rotateY(rot);
        ridge.translate(x, base + h + d * 0.2, z);
        add(roofKey, ridge);
      } else if (roof === 'flat') {
        kit.crenels(x, z, Math.min(w, d) * 0.5, base + h, key, 6);
      }
    },

    /** Dôme (septuaire). */
    dome(x, z, r, base = 0, key = 'stone') {
      const drum = new CylinderGeometry(r, r, r * 0.6, 12);
      drum.translate(x, base + r * 0.3, z);
      add(key, drum);
      const dome = new SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2);
      dome.translate(x, base + r * 0.6, z);
      add(key, dome);
    },

    /** Barral : tronc blanc, frondaison rouge en boules. */
    weirwood(x, z, base = 0, s = 1) {
      const trunk = new CylinderGeometry(0.35 * s, 0.5 * s, 3 * s, 6);
      trunk.translate(x, base + 1.5 * s, z);
      add('bark', trunk);
      for (const [dx, dy, dz, r] of [
        [0, 3.6, 0, 1.6],
        [1.1, 3.1, 0.4, 1.1],
        [-1, 3.2, -0.3, 1.2],
        [0.2, 3.3, -1.1, 1.0],
        [-0.3, 4.4, 0.5, 1.0],
      ]) {
        const leaf = new SphereGeometry(r * s, 7, 5);
        leaf.translate(x + dx * s, base + dy * s, z + dz * s);
        add('leaves', leaf);
      }
    },

    /** Masse rocheuse irrégulière (icosaèdre déformé), base au niveau `base`. */
    rock(x, z, { r = 5, h = 6, base = 0, seed = 1, key = 'rock' } = {}) {
      const g = new IcosahedronGeometry(1, 1);
      const pos = g.attributes.position;
      // Tirage déterministe par POSITION : les copies d'un même sommet (une par face)
      // reçoivent le même décalage, sinon la surface se fendrait.
      const jitter = (x, y, z) => {
        const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.3) * 43758.5453;
        return n - Math.floor(n);
      };
      for (let i = 0; i < pos.count; i++) {
        const [vx, vy, vz] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        const k = 0.78 + jitter(vx, vy, vz) * 0.4;
        pos.setXYZ(i, vx * k, Math.max(-0.2, vy) * k, vz * k);
      }
      g.scale(r, h / 1.2, r);
      g.translate(x, base + h * 0.15, z);
      add(key, g);
      return base + h * 0.95;
    },

    /** Disque plat (douves, place, jardin). */
    disc(x, z, r, { base = 0, h = 0.3, key = 'water', sides = 16 } = {}) {
      const g = new CylinderGeometry(r, r, h, sides);
      g.translate(x, base + h / 2, z);
      add(key, g);
    },

    /** Fusionne les pièces par matériau. `scale` : unités de carte → unités monde. */
    build(scale = 1 / 80) {
      const group = new Group();
      for (const [key, geos] of parts) {
        const merged = mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)));
        geos.forEach((g) => g.dispose());
        const mesh = new Mesh(merged, material(key));
        mesh.name = key;
        group.add(mesh);
      }
      group.scale.setScalar(scale);
      return group;
    },
  };
  return kit;
}
