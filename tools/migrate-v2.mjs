// Migration ponctuelle (phase 0 v2) : src/content/*.js (v1) → src/data/**/*.json (§5).
// Les textes sont repris tels quels ; l'enrichissement se fait ensuite fiche par fiche.
// N'écrase jamais un JSON existant (on peut le relancer sans perdre le travail rédigé).
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import groups from '../src/content/groups.js';
import languages from '../src/content/languages.js';
import faiths from '../src/content/faiths.js';
import creatures from '../src/content/creatures.js';
import eras from '../src/content/eras.js';
import houses from '../src/content/houses.js';
import places from '../src/content/places.js';

const DATA = new URL('../src/data/', import.meta.url).pathname;
let written = 0;
function out(kind, slug, data) {
  mkdirSync(join(DATA, kind), { recursive: true });
  const file = join(DATA, kind, `${slug}.json`);
  if (existsSync(file)) return;
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  written++;
}

const GROUP_SLUG = {
  dothraki: ['dothrakis', 'peuples'],
  unsullied: ['immacules', 'ordres'],
  andals: ['andals', 'peuples'],
  rhoynar: ['rhoynar', 'peuples'],
  valyrians: ['valyriens', 'peuples'],
  ghiscari: ['ghiscaris', 'peuples'],
  braavosi: ['braaviens', 'peuples'],
  lhazareen: ['lhazareens', 'peuples'],
  faceless: ['sans-visage', 'ordres'],
  secondsons: ['puines', 'ordres'],
  goldencompany: ['compagnie-doree', 'ordres'],
  harpy: ['fils-de-la-harpie', 'ordres'],
  freefolk: ['peuple-libre', 'peuples'],
  nightwatch: ['garde-de-nuit', 'ordres'],
  ironborn: ['fer-nes', 'peuples'],
  dornish: ['dorniens', 'peuples'],
  firstmen: ['premiers-hommes', 'peuples'],
  brotherhood: ['fraternite-sans-bannieres', 'ordres'],
  kingsguard: ['garde-royale', 'ordres'],
  maesters: ['mestres', 'ordres'],
  faithmilitant: ['foi-militante', 'ordres'],
  thenns: ['thenns', 'peuples'],
};
const LANG_SLUG = {
  common: 'langue-commune',
  dothraki: 'langue-dothrakie',
  highvalyrian: 'haut-valyrien',
  lowvalyrian: 'bas-valyrien',
  old: 'ancienne-langue',
  rhoynish: 'langue-rhoynienne',
  ghiscari: 'langue-ghiscarie',
  qartheen: 'langue-qartheenne',
  lhazareen: 'langue-lhazareenne',
};

const terms = (list = []) =>
  list.map((t) => {
    const [term, ...def] = String(t).split(' : ');
    return { term: term.trim(), def: def.join(' : ').trim() || term.trim() };
  });
const sources = (src) => (src?.url ? [{ label: src.label, url: src.url }] : []);
const codex = (f, slug, rubric) =>
  out('codex', slug, {
    slug,
    rubric,
    name: f.title,
    kicker: f.kicker,
    lead: f.lead || f.body[0].split('. ')[0] + '.',
    body: f.body,
    facts: f.facts ?? [],
    terms: terms(f.terms),
    places: [],
    characters: [],
    image: f.image ?? null,
    sources: sources(f.source),
  });

for (const g of groups) codex(g, ...GROUP_SLUG[g.id]);
for (const l of languages) codex(l, LANG_SLUG[l.id], 'langues');
for (const f of faiths) codex(f, f.id, 'croyances');
for (const c of creatures) codex(c, c.id, 'creatures');
for (const e of eras) codex({ ...e, kicker: `Époque · ${e.kicker}` }, e.id, 'peuples');

for (const h of houses) {
  const fact = (label) => h.facts.find((x) => x.label === label)?.value;
  out('houses', h.id, {
    slug: h.id,
    name: h.title,
    words: fact('Devise').replace(/^« |»$/g, ''),
    sigil: h.sigil,
    sigilDescription: fact('Armoiries'),
    sigilCredit: null,
    seat: {
      stark: 'winterfell',
      lannister: 'castral-roc',
      targaryen: 'peyredragon',
      baratheon: 'accalmie',
      greyjoy: 'pyk',
      tyrell: 'hautjardin',
      martell: 'lancehelion',
      tully: 'vivesaigues',
      arryn: 'les-eyrie',
      bolton: 'fort-terreur',
    }[h.id],
    region: fact('Région'),
    history: h.body,
    inTheSeries: [],
    figures: [],
    members: [],
    sources: sources(h.source),
  });
}

for (const p of places) {
  out('places', p.id, {
    slug: p.id,
    name: p.title,
    kind: 'cité',
    region: p.kicker.split(' · ')[1] ?? p.kicker,
    continent: p.kicker.startsWith('Essos') ? 'essos' : 'westeros',
    ...(p.map ? { coords: { x: p.map.x, y: p.map.y } } : {}),
    description: p.body,
    history: [],
    events: [],
    image: p.image ?? null,
    sources: sources(p.source),
  });
}
console.log(`${written} fichier(s) écrit(s)`);
