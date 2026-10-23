// Mise en page de l'arbre : familles en colonnes, générations en rangées.
// Les générations sont déduites des liens (enfant = parent + 1, époux et frères alignés),
// toutes unions comprises : la mise en page ne révèle donc rien des filiations secrètes.

export const CARD_W = 132;
export const CARD_H = 168;
export const GAP_X = 18;
export const ROW_H = 250;
export const FAMILY_GAP = 90;
export const TOP = 70; // place du titre de famille

/** Génération de chaque personne (0 = la plus ancienne). */
function generations(people, unions, special) {
  const gen = Object.fromEntries(people.map((p) => [p.id, 0]));
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;
    const raise = (id, g) => {
      if (id && gen[id] < g) {
        gen[id] = g;
        changed = true;
      }
    };
    for (const u of unions) {
      const parentGen = Math.max(gen[u.a] ?? 0, u.b ? (gen[u.b] ?? 0) : 0);
      raise(u.a, parentGen);
      raise(u.b, parentGen); // époux sur la même rangée
      for (const c of u.children) raise(c, parentGen + 1);
    }
    for (const s of special) {
      if (s.type === 'sibling') {
        const g = Math.max(gen[s.a], gen[s.b]);
        raise(s.a, g);
        raise(s.b, g);
      }
    }
    if (!changed) break;
  }
  return gen;
}

/**
 * @returns {{ width, height, families: [{ id, name, color, x, width }], pos: { id: { x, y } } }}
 */
export function layoutTree({ families, people, unions, special }) {
  const gen = generations(people, unions, special);
  const order = new Map(people.map((p, i) => [p.id, i])); // ordre de l'ancien site conservé
  const pos = {};
  const cols = [];
  let x = 40;
  let maxGen = 0;
  for (const f of families) {
    const members = people.filter((p) => p.house === f.id);
    const rows = new Map();
    for (const p of members) {
      const g = gen[p.id];
      maxGen = Math.max(maxGen, g);
      if (!rows.has(g)) rows.set(g, []);
      rows.get(g).push(p);
    }
    const perRow = Math.max(...[...rows.values()].map((r) => r.length));
    const width = perRow * CARD_W + (perRow - 1) * GAP_X;
    for (const [g, row] of rows) {
      row.sort((a, b) => order.get(a.id) - order.get(b.id));
      // Rangée centrée dans la colonne de la famille.
      const rowW = row.length * CARD_W + (row.length - 1) * GAP_X;
      row.forEach((p, i) => {
        pos[p.id] = { x: x + (width - rowW) / 2 + i * (CARD_W + GAP_X), y: TOP + g * ROW_H };
      });
    }
    cols.push({ ...f, x, width });
    x += width + FAMILY_GAP;
  }
  return { width: x - FAMILY_GAP + 40, height: TOP + (maxGen + 1) * ROW_H, families: cols, pos };
}
