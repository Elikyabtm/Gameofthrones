// Maquettes des grands châteaux (hors Winterfell, Port-Réal et Châteaunoir : voir models.js).
// Unités de carte, centrées sur le lieu (x vers l'est, z vers le sud).
import { createKit } from './kit.js';
import { rng } from '../noise.js';

const ring = (n, rx, rz = rx, phase = 0, cx = 0, cz = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * rx, cz + Math.sin(a) * rz];
  });

/** Castral Roc : une montagne de roc au bord de la mer, couronnée de tours aux toits dorés. */
export function castralRoc() {
  const k = createKit();
  const top = k.rock(0, 0, { r: 12, h: 14, seed: 3 });
  k.rock(-7, 5, { r: 6, h: 8, seed: 5 });
  k.rock(6, 4, { r: 5, h: 6, seed: 8 });
  k.wall(ring(6, 6, 5, 0.4), { h: 2.4, base: top - 1.5 });
  ring(6, 6, 5, 0.4).forEach(([x, z]) =>
    k.tower(x, z, { r: 1.2, h: 4, base: top - 1.5, roofKey: 'gold' }),
  );
  k.hall(0, 0, { w: 6, d: 4, h: 5, base: top - 1.5, roofKey: 'gold' });
  k.tower(1.5, -2, { r: 1.5, h: 9, base: top - 1.5, roofKey: 'gold' });
  return k.build();
}

/** Pyk : des tours perchées sur des pitons dans la mer, reliées par des ponts. */
export function pyk() {
  const k = createKit();
  const stacks = [
    [0, 0, 5, 12],
    [-9, 4, 3.5, 9],
    [8, 5, 3, 8],
    [3, -9, 3.2, 10],
  ];
  const tops = stacks.map(([x, z, r, h], i) => [x, z, k.rock(x, z, { r, h, seed: 11 + i })]);
  tops.forEach(([x, z, y], i) => {
    k.tower(x, z, {
      r: i ? 1.4 : 2,
      h: i ? 4.5 : 6,
      base: y - 1,
      roof: 'cone',
      key: 'stoneDark',
      roofKey: 'black',
    });
  });
  // Ponts entre le piton principal et les autres.
  for (let i = 1; i < tops.length; i++) {
    const [ax, az, ay] = tops[0];
    const [bx, bz, by] = tops[i];
    k.wall(
      [
        [ax, az],
        [bx, bz],
      ],
      { h: 0.5, t: 0.7, base: Math.min(ay, by) + 1, closed: false, merlons: false, key: 'wood' },
    );
  }
  return k.build();
}

/** Peyredragon : forteresse de pierre noire, tours effilées comme des griffes. */
export function peyredragon() {
  const k = createKit();
  const base = k.rock(0, 0, { r: 13, h: 4, seed: 21, key: 'black' });
  const pts = ring(7, 9, 7.5, 0.2);
  k.wall(pts, { h: 3, base: base - 0.5, key: 'black' });
  pts.forEach(([x, z]) =>
    k.tower(x, z, { r: 1.2, h: 5.5, base: base - 0.5, key: 'black', roofKey: 'black' }),
  );
  k.hall(0, 0, { w: 7, d: 5, h: 6, base: base - 0.5, roof: 'flat', key: 'black' });
  k.tower(-2, -1, { r: 1.6, h: 11, base: base - 0.5, key: 'black', roofKey: 'red' }); // tour du Dragon
  k.tower(3, 2, { r: 1.1, h: 8, base: base - 0.5, key: 'black', roofKey: 'black' });
  return k.build();
}

/** Les Eyrié : fines tours de marbre blanc serrées au sommet d'un pic. */
export function eyrie() {
  const k = createKit();
  const top = k.rock(0, 0, { r: 6, h: 10, seed: 31, key: 'stoneDark' });
  k.tower(0, 0, { r: 2, h: 9, base: top - 1, roof: 'cone', key: 'white', roofKey: 'white' });
  ring(6, 3.6, 3.6, 0.5).forEach(([x, z], i) =>
    k.tower(x, z, {
      r: 1,
      h: 5 + (i % 3) * 1.6,
      base: top - 1,
      roof: 'cone',
      key: 'white',
      roofKey: 'slate',
    }),
  );
  return k.build();
}

/** Hautjardin : trois enceintes concentriques, terrasses vertes, haute tour blanche. */
export function hautjardin() {
  const k = createKit();
  const base = k.plinth(17, 1, 12);
  k.disc(0, 0, 15, { base, h: 0.4, key: 'grass', sides: 24 });
  [14, 10, 6].forEach((r, i) => {
    const pts = ring(12, r, r * 0.9, i * 0.2);
    k.wall(pts, { h: 1.8 + i * 1.2, t: 0.8, base: base + i * 0.8, key: 'white' });
    pts.forEach(
      ([x, z], j) =>
        j % 3 === 0 &&
        k.tower(x, z, {
          r: 0.9,
          h: 2.8 + i * 1.4,
          base: base + i * 0.8,
          key: 'white',
          roofKey: 'grass',
        }),
    );
    if (i < 2)
      k.disc(0, 0, r - 1.2, { base: base + i * 0.8 + 0.4, h: 0.8, key: 'grass', sides: 24 });
  });
  k.hall(0, 0, { w: 5, d: 4, h: 5, base: base + 2.4, key: 'white', roofKey: 'grass' });
  k.tower(1.5, -1, { r: 1.3, h: 10, base: base + 2.4, key: 'white', roofKey: 'gold' });
  return k.build();
}

/** Lancehélion : grès doré, dômes, la tour de la Lance et la tour du Soleil. */
export function lancehelion() {
  const k = createKit();
  const base = k.plinth(15, 1, 10);
  const pts = ring(9, 13, 9, 0.1);
  k.wall(pts, { h: 2.6, base, key: 'sand' });
  pts.forEach(
    ([x, z], i) =>
      i % 2 === 0 && k.tower(x, z, { r: 1.1, h: 3.6, base, roof: 'crenel', key: 'sand' }),
  );
  k.hall(-3, 1, { w: 6, d: 5, h: 4.5, base, roof: 'flat', key: 'sand' });
  k.dome(-3, 1, 2.6, base + 4.5, 'gold'); // tour du Soleil
  k.tower(5, -2, { r: 1, h: 13, base, roof: 'cone', key: 'sand', roofKey: 'gold' }); // tour de la Lance
  k.dome(4, 4, 1.8, base, 'gold');
  k.dome(-8, -3, 1.4, base, 'sand');
  return k.build();
}

/** Vivesaigues : château triangulaire à la jonction de deux rivières, entouré d'eau. */
export function vivesaigues() {
  const k = createKit();
  const base = k.plinth(14, 0.8, 12);
  k.disc(0, 0, 13, { base, h: 0.35, key: 'water', sides: 20 });
  const tri = ring(3, 10, 10, -Math.PI / 2);
  k.disc(0, 0, 8.5, { base: base + 0.35, h: 0.6, key: 'stoneDark', sides: 3 });
  k.wall(tri, { h: 3.6, t: 1.1, base: base + 0.9 });
  tri.forEach(([x, z]) =>
    k.tower(x, z, { r: 1.8, h: 5.5, base: base + 0.9, roof: 'cone', roofKey: 'red' }),
  );
  k.hall(0, 1, { w: 5, d: 3.5, h: 5, base: base + 0.9, roofKey: 'red' });
  k.tower(-1, -2, { r: 1.3, h: 7.5, base: base + 0.9, roofKey: 'red' });
  return k.build();
}

/** Villevieille : ville close, coupoles de la Citadelle, et la Tour Hightower avec son fanal. */
export function villevieille() {
  const k = createKit();
  const base = k.plinth(19, 1, 12);
  const pts = ring(12, 17, 13, 0.3);
  k.wall(pts, { h: 2.4, base });
  pts.forEach(([x, z], i) => i % 3 === 0 && k.tower(x, z, { r: 1, h: 3.4, base, roof: 'crenel' }));
  const rand = rng(41);
  for (let n = 0; n < 90; n++) {
    const x = (rand() * 2 - 1) * 15;
    const z = (rand() * 2 - 1) * 11;
    if (
      (x / 15) ** 2 + (z / 11) ** 2 > 0.9 ||
      Math.hypot(x + 9, z - 2) < 5 ||
      Math.hypot(x - 6, z + 3) < 5
    )
      continue;
    k.hall(x, z, {
      w: 1.3 + rand(),
      d: 1 + rand() * 0.5,
      h: 0.9 + rand() * 0.7,
      base,
      rot: rand() * Math.PI,
      roofKey: rand() > 0.4 ? 'tile' : 'slate',
    });
  }
  // Citadelle : coupoles grises.
  k.dome(6, -3, 2.4, base, 'slate');
  k.dome(9, 0.5, 1.6, base, 'slate');
  // Tour Hightower : étages en retrait, fanal au sommet, sur son île (à l'ouest).
  k.rock(-9, 2, { r: 4.5, h: 3, seed: 43, key: 'stoneDark' });
  [
    [3.2, 6],
    [2.6, 6],
    [2, 6],
    [1.4, 5],
  ].reduce((y, [r, h]) => {
    k.tower(-9, 2, { r, h, base: y, roof: 'crenel', key: 'white' });
    return y + h;
  }, base + 2.5);
  k.disc(-9, 2, 0.9, { base: base + 25.5, h: 1.6, key: 'fire', sides: 8 });
  return k.build();
}

/** Accalmie : un énorme tambour de pierre aux murs épais, défiant la tempête. */
export function accalmie() {
  const k = createKit();
  const base = k.plinth(13, 1, 12);
  const pts = ring(16, 10);
  k.wall(pts, { h: 6, t: 2.2, base, key: 'stoneDark' });
  k.tower(0, 0, { r: 6.5, h: 14, base, roof: 'crenel', key: 'stoneDark' }); // la Grande Tour
  k.tower(0, 0, { r: 3, h: 3, base: base + 14, roof: 'crenel', key: 'stoneDark' });
  return k.build();
}

/** Blancport : port aux murs blancs, toits d'ardoise, jetées et le Château-Neuf. */
export function blancport() {
  const k = createKit();
  const base = k.plinth(16, 1, 10);
  const pts = ring(10, 14, 10, 0.2);
  k.wall(pts, { h: 2.2, base, key: 'white' });
  pts.forEach(
    ([x, z], i) => i % 2 === 0 && k.tower(x, z, { r: 1, h: 3, base, roof: 'crenel', key: 'white' }),
  );
  const rand = rng(51);
  for (let n = 0; n < 70; n++) {
    const x = (rand() * 2 - 1) * 12;
    const z = (rand() * 2 - 1) * 8.5;
    if ((x / 12) ** 2 + (z / 8.5) ** 2 > 0.9 || Math.hypot(x + 4, z + 2) < 4) continue;
    k.hall(x, z, {
      w: 1.3 + rand(),
      d: 1 + rand() * 0.5,
      h: 0.9 + rand() * 0.7,
      base,
      rot: rand() * Math.PI,
      key: 'white',
      roofKey: 'slate',
    });
  }
  k.hall(-4, -2, { w: 5, d: 4, h: 5, base, roof: 'flat', key: 'white' }); // Château-Neuf
  k.tower(-6, -3.5, { r: 1.3, h: 7, base, key: 'white', roofKey: 'slate' });
  // Jetées vers la mer (au sud-est).
  k.wall(
    [
      [8, 6],
      [16, 12],
    ],
    { h: 0.8, t: 1.2, base, closed: false, merlons: false, key: 'wood' },
  );
  k.wall(
    [
      [2, 8],
      [7, 16],
    ],
    { h: 0.8, t: 1.2, base, closed: false, merlons: false, key: 'wood' },
  );
  return k.build();
}

export const CASTLES = {
  'Castral Roc': castralRoc,
  Pyk: pyk,
  Peyredragon: peyredragon,
  'Les Eyrié': eyrie,
  Hautjardin: hautjardin,
  Lancehélion: lancehelion,
  Vivesaigues: vivesaigues,
  Villevieille: villevieille,
  Accalmie: accalmie,
  Blancport: blancport,
};
