// Maquettes des lieux, dans l'esprit des cartes-puzzles en relief : château gris pâle sur socle,
// toits colorés, quelques signes distinctifs (barral, Donjon Rouge, Mur de glace).
// Coordonnées en unités de carte, centrées sur le lieu (x vers l'est, z vers le sud).
import { CylinderGeometry } from 'three';
import { createKit } from './kit.js';
import { rng } from '../noise.js';

const ring = (n, rx, rz = rx, phase = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return [Math.cos(a) * rx, Math.sin(a) * rz];
  });

/** Winterfell : double enceinte, tours d'angle, grand donjon, jardin de verre, bois sacré. */
export function winterfell() {
  const k = createKit();
  const base = k.plinth(17, 1.2, 10);
  // Enceinte extérieure (basse) et intérieure (haute), octogonales.
  const outer = ring(8, 15, 12, Math.PI / 8);
  const inner = ring(8, 10.5, 8, Math.PI / 8);
  k.wall(outer, { h: 2.2, t: 0.9, base });
  k.wall(inner, { h: 4, t: 1.1, base });
  outer.forEach(([x, z]) => k.tower(x, z, { r: 1.3, h: 3.4, base, roof: 'crenel' }));
  inner.forEach(([x, z]) => k.tower(x, z, { r: 1.6, h: 6, base, roof: 'crenel' }));
  // Grand donjon, première forteresse, tour brisée, salle du trône.
  k.hall(-2.5, -1.5, { w: 7, d: 5, h: 7.5, base, roof: 'flat' });
  k.tower(-5, 3, { r: 1.8, h: 9.5, base, roof: 'crenel' });
  k.tower(3.8, -4, { r: 1.4, h: 8, base, roof: 'cone', roofKey: 'stoneDark' });
  k.hall(3.5, 2.5, { w: 6, d: 3.4, h: 4, base, rot: 0.3 });
  k.dome(0.8, 5.2, 2.2, base, 'ice'); // jardin de verre
  // Bois sacré à l'est, hors de l'enceinte intérieure, avec son barral rouge.
  k.weirwood(12, -2, base, 1.25);
  return k.build();
}

/** Port-Réal : ville close, maisons serrées, Grand Septuaire, Donjon Rouge sur sa colline. */
export function portReal() {
  const k = createKit();
  const base = k.plinth(24, 1, 12);
  const wallPts = ring(12, 21, 15, 0.2);
  k.wall(wallPts, { h: 2.6, t: 0.9, base });
  wallPts.forEach(
    ([x, z], i) => i % 2 === 0 && k.tower(x, z, { r: 1.1, h: 3.6, base, roof: 'crenel' }),
  );
  // Maisons : petits blocs aux toits orange, tirés au hasard (seed fixe) dans l'enceinte.
  const rand = rng(7);
  for (let n = 0; n < 150; n++) {
    const x = (rand() * 2 - 1) * 19;
    const z = (rand() * 2 - 1) * 13.5;
    if ((x / 19) ** 2 + (z / 13.5) ** 2 > 0.92) continue;
    if (Math.hypot(x - 11, z + 4) < 7 || Math.hypot(x + 2, z - 2) < 4) continue;
    k.hall(x, z, {
      w: 1.4 + rand() * 1.2,
      d: 1.1 + rand() * 0.6,
      h: 0.9 + rand() * 0.9,
      base,
      rot: rand() * Math.PI,
      roofKey: rand() > 0.25 ? 'tile' : 'roof',
    });
  }
  k.dome(-2, 2, 3.2, base, 'stone'); // Grand Septuaire de Baelor
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) =>
      k.tower(-2 + sx * 3.6, 2 + sz * 3.6, {
        r: 0.6,
        h: 4.5,
        base,
        roof: 'cone',
        roofKey: 'stone',
      }),
    ),
  );
  // Donjon Rouge, sur la colline d'Aegon (à l'est, au-dessus de la baie).
  const hill = new CylinderGeometry(8, 9.5, 2.5, 10);
  hill.translate(11, base + 1.25, -4);
  k.add('grass', hill);
  const rk = base + 2.5;
  k.wall(
    ring(6, 6.5, 5, 0.3).map(([x, z]) => [x + 11, z - 4]),
    { h: 3.5, t: 1, base: rk, key: 'red' },
  );
  k.hall(11, -4, { w: 6, d: 4, h: 5, base: rk, roof: 'flat', key: 'red' });
  ring(6, 6.5, 5, 0.3).forEach(([x, z]) =>
    k.tower(x + 11, z - 4, { r: 1.2, h: 6.5, base: rk, roof: 'cone', key: 'red', roofKey: 'red' }),
  );
  return k.build();
}

/** Châteaunoir : bâtiments sombres au pied du Mur (côté sud). */
export function chateaunoir() {
  const k = createKit();
  const base = k.plinth(10, 1, 8);
  k.hall(-3, 2, { w: 6, d: 3, h: 3, base, key: 'wood' });
  k.hall(3.5, 3, { w: 4, d: 3, h: 2.6, base, rot: 0.4, key: 'wood' });
  k.tower(0, -1, { r: 1.6, h: 6.5, base, roof: 'crenel', key: 'stoneDark' });
  k.tower(-6, -1.5, { r: 1.1, h: 4.2, base, roof: 'crenel', key: 'stoneDark' });
  k.hall(4, -2, { w: 3, d: 3, h: 3.5, base, roof: 'flat', key: 'stoneDark' });
  // Escalier en zigzag le long du Mur.
  for (let i = 0; i < 6; i++) {
    k.hall(i % 2 ? 2 : -2, -6.5, {
      w: 5,
      d: 0.6,
      h: 0.5,
      base: base + 1.2 + i * 1.8,
      roof: 'none',
      key: 'wood',
    });
  }
  return k.build();
}

/** Château générique : enceinte carrée, quatre tours, donjon. Variantes par seed. */
export function genericCastle(seed = 1, { color = 'stone' } = {}) {
  const k = createKit();
  const rand = rng(seed);
  const s = 7 + rand() * 3;
  const base = k.plinth(s * 1.5, 1, 8);
  const corners = ring(4, s, s * (0.8 + rand() * 0.3), Math.PI / 4);
  k.wall(corners, { h: 3, base, key: color });
  corners.forEach(([x, z]) =>
    k.tower(x, z, {
      r: 1.4,
      h: 5 + rand() * 2,
      base,
      roof: rand() > 0.5 ? 'cone' : 'crenel',
      key: color,
    }),
  );
  k.hall(0, 0, { w: s * 0.9, d: s * 0.6, h: 6 + rand() * 3, base, roof: 'flat', key: color });
  k.tower(s * 0.35, -s * 0.2, { r: 1.5, h: 9 + rand() * 3, base, roof: 'cone', key: color });
  return k.build();
}
