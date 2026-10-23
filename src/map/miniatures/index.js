// Pose des maquettes sur la carte : chaque cité reçoit sa maquette, posée sur le relief.
import { Group } from 'three';
import { toWorld } from '../scene.js';
import { terrainHeightAt } from '../terrain.js';
import { chateaunoir, genericCastle, portReal, winterfell } from './models.js';
import { CASTLES } from './castles.js';
import { createHamlets } from './hamlets.js';

// Maquettes dédiées ; les autres cités reçoivent un château générique (variante par seed).
const SPECIAL = {
  ...CASTLES,
  Winterfell: winterfell,
  'Port-Réal': portReal,
  Châteaunoir: chateaunoir,
};
// Décalage (unités de carte) : Châteaunoir se tient au pied du Mur, côté sud.
const NUDGE = { Châteaunoir: [0, 9] };
// Teinte des châteaux génériques (pierre claire par défaut).
const TINT = { Pyk: 'stoneDark', Peyredragon: 'stoneDark', 'Castral Roc': 'stone' };
// Échelle propre à certaines maquettes (Winterfell, cœur du Nord, plus imposant).
const SIZE = { Winterfell: 1.35 };

/**
 * @param {object} map map.json
 * @param {object} fields champs de textures.js (relief), pour poser les socles au bon niveau
 * @param {{ scale?: number, relief?: number, bias?: number }} opts
 */
export function createMiniatures(map, fields, { scale = 1.35, relief = 1.1, bias = -0.25 } = {}) {
  const group = new Group();
  group.name = 'maquettes';
  map.cities.forEach((city, i) => {
    const build =
      SPECIAL[city.name] ?? (() => genericCastle(i + 3, { color: TINT[city.name] ?? 'stone' }));
    const model = build();
    model.scale.multiplyScalar(scale * (SIZE[city.name] ?? 1));
    const [dx, dz] = NUDGE[city.name] ?? [0, 0];
    const x = city.x + dx;
    const y = city.y + dz;
    toWorld(x, y, model.position);
    // Socle posé au plus haut du relief sous la maquette : il ne s'enfonce jamais.
    model.position.y = terrainHeightAt(fields, x, y, { radius: 8, relief, bias });
    model.name = city.name;
    group.add(model);
  });
  group.add(createHamlets(map, fields, { sc: scale, relief, bias }));
  return group;
}
