// Extraction ponctuelle des textes de l'ancien site (reference/ancien-site/) vers src/content/.
// Les tableaux littéraux sont relus dans un bac à sable node:vm, sans DOM ni exécution du site.
// Les textes sont repris MOT POUR MOT : aucune correction ici (voir tools/extraction-report.md).
// Usage : node tools/extract-content.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { imagePath } from './asset-names.mjs';

const REF = new URL('../reference/ancien-site/', import.meta.url);
const OUT = new URL('../src/content/', import.meta.url);
const read = (f) => readFileSync(new URL(f, REF), 'utf8');

/**
 * Renvoie le littéral (tableau ou objet) qui suit `const <name>=` dans `src`.
 * Parcourt le texte en tenant compte des chaînes pour trouver le crochet fermant.
 */
function literal(src, name) {
  const decl = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*`).exec(src);
  if (!decl) throw new Error(`Déclaration introuvable : ${name}`);
  const start = decl.index + decl[0].length;
  const open = src[start];
  if (open !== '[' && open !== '{') throw new Error(`${name} n'est pas un littéral`);
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (depth === 0) return vm.runInNewContext(`(${src.slice(start, i + 1)})`);
    }
  }
  throw new Error(`Littéral non terminé : ${name}`);
}

// Identifiant stable : minuscules, sans accent, mots séparés par des tirets.
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '-')
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Libellé lisible d'une source à partir de son domaine.
const SOURCE_LABELS = {
  'awoiaf.westeros.org': 'A Wiki of Ice and Fire',
  'gameofthrones.fandom.com': 'Wiki of Westeros',
  'dothraki.com': 'David J. Peterson — Dothraki',
  'dothraki.org': 'Communauté Dothraki & Valyrian',
  'www.westeros.org': 'Westeros.org',
};
function source(url) {
  if (!url) return null;
  const host = new URL(url).hostname;
  return { label: SOURCE_LABELS[host] ?? host, url };
}

const enc = read('encyclopedia.js');
const atlas = read('atlas.js');
const gen = read('genealogy.js');

// --- Groupes (22) -----------------------------------------------------------
const groups = literal(enc, 'groups').map((g) => ({
  id: g.id,
  type: 'group',
  title: g.name,
  kicker: g.region,
  lead: g.lead,
  body: g.body,
  facts: [
    { label: 'Langue', value: g.language },
    { label: 'Visages & repères', value: g.figures },
  ],
  terms: g.terms ?? [],
  image: imagePath(g.image),
  source: source(g.source),
  tags: [g.kind],
}));

// --- Maisons (10) : [nom, siège, région, devise, blason, texte, figures, image] ----
const houses = literal(enc, 'houseData').map(
  ([name, seat, region, motto, blazon, text, figures, img]) => ({
    id: slug(name),
    type: 'house',
    title: `Maison ${name}`,
    kicker: `${region} · ${seat}`,
    lead: `« ${motto} »`,
    body: [text],
    facts: [
      { label: 'Siège', value: seat },
      { label: 'Région', value: region },
      { label: 'Devise', value: motto },
      { label: 'Armoiries', value: blazon },
      { label: 'Figures', value: figures },
    ],
    image: imagePath(img),
    sigil: `sigils/${slug(name)}.svg`,
    source: null,
    tags: ['Maisons'],
  }),
);

// --- Langues (9) : [id, titre, surtitre, accroche, §1, §2, où la retrouver, repères, source]
const languages = literal(enc, 'langs').map(
  ([id, title, kicker, lead, p1, p2, where, terms, url]) => ({
    id,
    type: 'lang',
    title,
    kicker,
    lead,
    body: [p1, p2],
    facts: [{ label: 'Où la retrouver', value: where }],
    terms: terms.map(([t, d]) => `${t} : ${d}`),
    image: null,
    source: source(url),
    tags: ['Langues'],
  }),
);

// --- Croyances (6) : [nom, surtitre, texte, image] ------------------------------
const FAITH_IDS = {
  'Les anciens dieux': 'anciens-dieux',
  'La Foi des Sept': 'foi-des-sept',
  'Le Maître de la Lumière': 'maitre-de-la-lumiere',
  'Le Dieu Noyé': 'dieu-noye',
  'Le Dieu Multiface': 'dieu-multiface',
  'Le Grand Étalon': 'grand-etalon',
};
const faiths = literal(enc, 'faiths').map(([name, kicker, text, img]) => ({
  id: FAITH_IDS[name] ?? slug(name),
  type: 'faith',
  title: name,
  kicker,
  lead: '',
  body: [text],
  facts: [],
  image: imagePath(img),
  source: null,
  tags: ['Croyances'],
}));

// --- Créatures (5) : [nom, surtitre, image, texte] ------------------------------
const CREATURE_IDS = {
  Dragons: 'dragons',
  'Loups géants': 'loups-geants',
  Géants: 'geants',
  'Marcheurs blancs & morts animés': 'marcheurs-blancs',
  'Enfants de la Forêt': 'enfants-de-la-foret',
};
const creatures = literal(enc, 'beasts').map(([name, kicker, img, text]) => ({
  id: CREATURE_IDS[name] ?? slug(name),
  type: 'creature',
  title: name,
  kicker,
  lead: '',
  body: [text],
  facts: [],
  image: imagePath(img),
  source: null,
  tags: ['Créatures'],
}));

// --- Périodes (4) : [nom, surtitre, texte] --------------------------------------
const ERA_IDS = {
  'L’Âge des Héros': 'age-des-heros',
  'La Conquête': 'conquete',
  'La Rébellion': 'rebellion',
  'Au début de la série': 'debut-de-la-serie',
};
const eras = literal(enc, 'eras').map(([name, kicker, text], order) => ({
  id: ERA_IDS[name] ?? slug(name),
  type: 'era',
  order,
  title: name,
  kicker,
  body: [text],
}));

// --- Lieux : 13 cités de Westeros (atlas.js) + 15 destinations d'Essos ----------
const regionNames = literal(atlas, 'regions'); // { north: ['LE NORD', 'Stark', …], … }
// L'ancien site écrit les régions en capitales (« LE NORD ») : on stocke une casse normale,
// la mise en petites capitales relève du CSS.
const REGION_LABELS = {
  'LE DON': 'Le Don',
  'LE NORD': 'Le Nord',
  'LE CONFLANS': 'Le Conflans',
  'LE VAL': 'Le Val',
  'LES ÎLES DE FER': 'Les Îles de Fer',
  'L’OUEST': 'L’Ouest',
  'LES TERRES DE LA COURONNE': 'Les Terres de la Couronne',
  'LE BIEF': 'Le Bief',
  'LES TERRES DE L’ORAGE': 'Les Terres de l’Orage',
  DORNE: 'Dorne',
};
const cityInfo = literal(atlas, 'info'); // { 'Winterfell': 'description', … }
const atlasData = JSON.parse(read('atlas-data.json'));
const westeros = atlasData.cities.map((c) => {
  const region = REGION_LABELS[regionNames[c.region]?.[0]];
  if (!region) throw new Error(`Région inconnue : ${c.region}`);
  if (!cityInfo[c.name]) throw new Error(`Cité sans description : ${c.name}`);
  return {
    id: slug(c.name),
    type: 'place',
    title: c.name,
    kicker: `Westeros · ${region}`,
    lead: '',
    body: [cityInfo[c.name]],
    facts: [{ label: 'Région', value: region }],
    image: null,
    source: null,
    tags: ['Westeros'],
    map: { x: c.x, y: c.y, region: c.region },
  };
});
// Destinations : [nom, nature, ligne « Langue : … », texte, image, groupe associé]
const essos = literal(enc, 'destinations').map(([name, nature, langLine, text, img, group]) => {
  const [langLabel, ...langValue] = langLine.split(' : ');
  return {
    id: slug(name),
    type: 'place',
    title: name,
    kicker: `Essos · ${nature}`,
    lead: '',
    body: [text],
    facts: [
      { label: 'Nature', value: nature },
      { label: langLabel, value: langValue.join(' : ') },
    ],
    image: imagePath(img),
    source: null,
    tags: ['Essos'],
    related: [{ type: 'group', id: group }],
  };
});
const places = [...westeros, ...essos];

// --- Arbre généalogique ---------------------------------------------------------
// On exécute uniquement la partie déclarative de genealogy.js (familles, P(), U(), special,
// portraits), qui précède toute manipulation du DOM (`const byid`).
const genCode = gen.slice(gen.indexOf('const families'), gen.indexOf('const byid'));
if (/document|window/.test(genCode))
  throw new Error('genealogy.js : partie déclarative inattendue');
const tree = vm.runInNewContext(`${genCode};({families, people, unions, special})`);
const people = {
  families: tree.families.map(([name, color]) => ({ id: slug(name), name, color })),
  // Les coordonnées x/y de l'ancien arbre sont abandonnées : nouvelle implémentation en phase 5.
  people: tree.people.map((p) => ({
    id: p.id,
    name: p.name,
    house: slug(p.house),
    title: p.title,
    portrait: p.portrait ? `images/portraits/${p.portrait}.webp` : null,
    bio: p.bio || '',
  })),
  // mode : 'normal' | 'public' (version officielle) | 'secret' (révélée sur option, anti-spoilers)
  unions: tree.unions.map((u) => ({ a: u.a, b: u.b, children: u.c, mode: u.mode })),
  special: tree.special.map((s) => ({ ...s })),
};

// --- Écriture -------------------------------------------------------------------
mkdirSync(OUT, { recursive: true });
const HEADER =
  '// Généré par tools/extract-content.mjs depuis reference/ancien-site/. Textes non corrigés.\n';
const write = (file, data, comment) =>
  writeFileSync(
    new URL(file, OUT),
    `${HEADER}// ${comment}\nexport default ${JSON.stringify(data)};\n`,
  );

// Point d'entrée qui assemble des sous-fichiers (règle des 400 lignes max. par fichier).
const writeIndex = (file, comment, body) =>
  writeFileSync(new URL(file, OUT), `${HEADER}// ${comment}\n${body}`);

const isWesteros = (g) => g.kicker.startsWith('Westeros');
mkdirSync(new URL('groups/', OUT), { recursive: true });
write('groups/westeros.js', groups.filter(isWesteros), 'Fiches de groupes situées à Westeros.');
write(
  'groups/essos.js',
  groups.filter((g) => !isWesteros(g)),
  "Fiches de groupes d'Essos.",
);
writeIndex(
  'groups.js',
  'Peuples, armées, ordres et civilisations (22 fiches).',
  `import westeros from './groups/westeros.js';\nimport essos from './groups/essos.js';\n\n` +
    `// Ordre de l'ancien site conservé.\nconst ORDER = ${JSON.stringify(groups.map((g) => g.id))};\n` +
    `const all = [...westeros, ...essos];\n` +
    `export default ORDER.map((id) => all.find((g) => g.id === id));\n`,
);

write('houses.js', houses, 'Grandes maisons.');
write('languages.js', languages, 'Langues.');
write('faiths.js', faiths, 'Croyances.');
write('creatures.js', creatures, 'Créatures.');
write('eras.js', eras, 'Périodes de la chronologie.');

mkdirSync(new URL('places/', OUT), { recursive: true });
write('places/westeros.js', westeros, 'Les 13 cités de Westeros (descriptions de atlas.js).');
write('places/essos.js', essos, "Les 15 destinations d'Essos.");
writeIndex(
  'places.js',
  "Cités de Westeros et destinations d'Essos.",
  `import westeros from './places/westeros.js';\nimport essos from './places/essos.js';\n\n` +
    `export default [...westeros, ...essos];\n`,
);

// Personnages répartis en deux fichiers (5 familles chacun), liens à part.
const half = new Set(people.families.slice(0, 5).map((f) => f.id));
mkdirSync(new URL('people/', OUT), { recursive: true });
write(
  'people/families-1.js',
  people.people.filter((p) => half.has(p.house)),
  `Personnages : ${[...half].join(', ')}.`,
);
write(
  'people/families-2.js',
  people.people.filter((p) => !half.has(p.house)),
  'Personnages des cinq autres familles.',
);
write(
  'people/links.js',
  { families: people.families, unions: people.unions, special: people.special },
  "Familles, unions (filiations) et liens particuliers de l'arbre.",
);
writeIndex(
  'people.js',
  "Personnages et liens de l'arbre généalogique.",
  `import part1 from './people/families-1.js';\nimport part2 from './people/families-2.js';\n` +
    `import links from './people/links.js';\n\n` +
    `export const families = links.families;\n` +
    `export const people = [...part1, ...part2];\n` +
    `export const unions = links.unions;\n` +
    `export const special = links.special;\n\n` +
    `export default { families, people, unions, special };\n`,
);
const counts = {
  groups: groups.length,
  houses: houses.length,
  languages: languages.length,
  faiths: faiths.length,
  creatures: creatures.length,
  eras: eras.length,
  'places (Westeros)': westeros.length,
  'places (Essos)': essos.length,
  people: people.people.length,
  unions: people.unions.length,
};
console.log(counts);
