// Validation des contenus (§5.6) : schémas, références, règles éditoriales et rapport de
// complétude (docs/contenu-suivi.md, section générée). Code de sortie ≠ 0 en cas d'erreur.
import Ajv from 'ajv';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DATA_DIR, KINDS, readDir, readJson } from './content-load.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const schemaDir = join(ROOT, 'tools/schemas');
const ajv = new Ajv({ allErrors: true, strict: false });
for (const f of readdirSync(schemaDir)) ajv.addSchema(JSON.parse(readFileSync(join(schemaDir, f))));

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file} : ${msg}`);

// 1. Schémas.
const SCHEMA = { characters: 'character', houses: 'house', places: 'place', codex: 'codex' };
const files = Object.fromEntries(KINDS.map((k) => [k, readDir(k)]));
for (const k of KINDS) {
  const validate = ajv.getSchema(SCHEMA[k]);
  for (const { file, data } of files[k]) {
    if (!validate(data))
      for (const e of validate.errors) err(file, `${e.instancePath || '/'} ${e.message}`);
    if (`${k}/${data.slug}.json` !== file) err(file, `slug « ${data.slug} » ≠ nom du fichier`);
  }
}
const journey = readJson('journey.json');
if (!ajv.getSchema('journey')(journey))
  for (const e of ajv.getSchema('journey').errors)
    err('journey.json', `${e.instancePath} ${e.message}`);

// 2. Références par slug.
const all = Object.fromEntries(KINDS.map((k) => [k, files[k].map((f) => f.data)]));
const slugs = Object.fromEntries(KINDS.map((k) => [k, new Set(all[k].map((e) => e.slug))]));
const any = new Set(KINDS.flatMap((k) => [...slugs[k]]));
const ref = (file, kind, slug, where) => {
  if (slug == null) return;
  const ok = kind ? slugs[kind].has(slug) : any.has(slug);
  if (!ok) err(file, `${where} → « ${slug} » introuvable${kind ? ` (${kind})` : ''}`);
};

for (const c of all.characters) {
  const f = `characters/${c.slug}.json`;
  ref(f, 'houses', c.house, 'house');
  ref(f, 'places', c.origin, 'origin');
  c.allegiances?.forEach((a) => ref(f, 'houses', a.to, 'allegiances'));
  c.relations.forEach((r) => ref(f, 'characters', r.to, 'relations'));
  c.places.forEach((p) => ref(f, 'places', p.place, 'places'));
  c.codex?.forEach((s) => ref(f, 'codex', s, 'codex'));
  c.keyMoments?.forEach((m) => ref(f, 'places', m.place, 'keyMoments.place'));
}
for (const h of all.houses) {
  const f = `houses/${h.slug}.json`;
  ref(f, 'places', h.seat, 'seat');
  h.overlord?.forEach((o) => ref(f, 'houses', o.to, 'overlord'));
  h.members.forEach((m) => ref(f, 'characters', m, 'members'));
  const ids = new Set(h.tree?.people.map((p) => p.id));
  h.tree?.people.forEach((p) => {
    ref(f, 'characters', p.character, 'tree.character');
    ref(f, 'houses', p.house, 'tree.house');
    if (!p.character && !p.name) err(f, `tree : « ${p.id} » sans nom ni personnage`);
  });
  h.tree?.unions.forEach((u) =>
    [u.a, u.b, ...u.children].forEach(
      (id) => id && !ids.has(id) && err(f, `tree : « ${id} » absent de people`),
    ),
  );
  if (!existsSync(join(ROOT, 'public', h.sigil))) err(f, `blason manquant : ${h.sigil}`);
}
for (const p of all.places) {
  ref(`places/${p.slug}.json`, 'houses', p.house, 'house');
}
for (const e of all.codex) {
  const f = `codex/${e.slug}.json`;
  e.places?.forEach((s) => ref(f, 'places', s, 'places'));
  e.characters?.forEach((s) => ref(f, 'characters', s, 'characters'));
}
for (const s of journey.steps) {
  const f = `journey.json#${s.slug}`;
  ref(f, 'places', s.place, 'place');
  s.characters.forEach((c) => ref(f, 'characters', c, 'characters'));
  s.links.forEach((l) => ref(f, null, l, 'links'));
}

// 3. Règles éditoriales des personnages.
const INVERSE = {
  parent: 'enfant',
  enfant: 'parent',
  fratrie: 'fratrie',
  conjoint: 'conjoint',
  amour: 'amour',
  allie: 'allie',
  ennemi: 'ennemi',
  mentor: 'eleve',
  eleve: 'mentor',
  serviteur: 'maitre',
  suzerain: 'vassal',
  vassal: 'suzerain',
  autre: 'autre',
};
const relCount = new Map(all.characters.map((c) => [c.slug, new Set()]));
const declared = new Map();
for (const c of all.characters)
  for (const r of c.relations) {
    relCount.get(c.slug).add(r.to);
    relCount.get(r.to)?.add(c.slug);
    declared.set(`${c.slug}>${r.to}`, r.type);
  }
for (const c of all.characters) {
  const f = `characters/${c.slug}.json`;
  if (c.house === undefined) err(f, 'house manquant (mettre null si aucune maison)');
  if (relCount.get(c.slug).size < 3)
    err(f, `seulement ${relCount.get(c.slug).size} relation(s), 3 minimum`);
  for (const r of c.relations) {
    const back = declared.get(`${r.to}>${c.slug}`);
    if (back && back !== INVERSE[r.type] && !(back === 'autre' || r.type === 'autre'))
      err(f, `relation contradictoire avec ${r.to} : ${r.type} / ${back}`);
    else if (back) warnings.push(`${f} : relation avec ${r.to} déclarée des deux côtés`);
  }
  const seasons = new Set(c.places.flatMap((p) => p.seasons));
  const bioSeasons = new Set(c.bio.map((b) => b.s ?? 1));
  for (const s of seasons)
    if (!bioSeasons.has(s)) err(f, `biographie : pas de bloc pour la saison ${s}`);
  if (c.firstSeason !== Math.min(...seasons))
    err(f, `firstSeason ${c.firstSeason} ≠ première saison des lieux ${Math.min(...seasons)}`);
  if (c.portrait && !existsSync(join(ROOT, 'public', c.portrait)))
    warnings.push(`${f} : portrait absent (${c.portrait})`);
}

// 4. Rapport de complétude.
const words = (paras = []) => paras.join(' ').split(/\s+/).filter(Boolean).length;
const rows = all.characters.map((c) => {
  const w = c.bio.reduce((n, b) => n + words(b.paragraphs), 0);
  const empty = ['quote', 'keyMoments', 'booksVsShow', 'codex', 'actor'].filter(
    (k) => c[k] == null || (Array.isArray(c[k]) && !c[k].length),
  );
  const target = c.principal ? [600, 1200] : [150, 400];
  const flag = w < target[0] ? ' ⚠ court' : w > target[1] ? ' ⚠ long' : '';
  const img = c.portrait && existsSync(join(ROOT, 'public', c.portrait)) ? 'oui' : 'non';
  return `| ${c.slug} | ${c.principal ? 'principal' : 'secondaire'} | ${w}${flag} | ${c.keyMoments?.length ?? 0} | ${relCount.get(c.slug).size} | ${img} | ${empty.join(', ') || '—'} |`;
});
const doubts = KINDS.flatMap((k) =>
  all[k].filter((e) => e._doute).map((e) => `- \`${k}/${e.slug}\` : ${e._doute}`),
);
const placeRows = all.places.map(
  (p) =>
    `| ${p.slug} | ${words(p.description)} | ${words(p.history)} | ${p.events.length} | ${p.image ? 'oui' : 'non'} |`,
);
const houseRows = all.houses.map(
  (h) =>
    `| ${h.slug} | ${words(h.history)} | ${h.inTheSeries?.length ?? 0} | ${h.members.length} |`,
);
const codexRows = all.codex.map(
  (e) =>
    `| ${e.slug} | ${e.rubric} | ${words([e.lead, ...e.body])} | ${e.terms?.length ?? 0} | ${e.image ? 'oui' : 'non'} |`,
);
const report = `<!-- DÉBUT RAPPORT GÉNÉRÉ (npm run check:data) -->
## Rapport de complétude (généré)

${all.characters.length} personnages · ${all.houses.length} maisons · ${all.places.length} lieux · ${all.codex.length} entrées du Codex · ${journey.steps.length} étapes.

### Personnages

| Slug | Rang | Mots (bio) | Moments | Relations | Portrait | Champs vides |
|---|---|---|---|---|---|---|
${rows.join('\n')}

### Lieux

| Slug | Mots (description) | Mots (histoire) | Événements | Image |
|---|---|---|---|---|
${placeRows.join('\n')}

### Maisons

| Slug | Mots (histoire) | Blocs « dans la série » | Membres |
|---|---|---|---|
${houseRows.join('\n')}

### Codex

| Slug | Rubrique | Mots | Termes | Image |
|---|---|---|---|---|
${codexRows.join('\n')}

### Doutes (\`_doute\`, jamais affichés)

${doubts.join('\n') || 'Aucun.'}
<!-- FIN RAPPORT GÉNÉRÉ -->`;
const suiviPath = join(ROOT, 'docs/contenu-suivi.md');
const prev = existsSync(suiviPath) ? readFileSync(suiviPath, 'utf8') : '# Suivi des contenus\n\n';
const next = prev.includes('<!-- DÉBUT RAPPORT GÉNÉRÉ')
  ? prev.replace(/<!-- DÉBUT RAPPORT GÉNÉRÉ[\s\S]*<!-- FIN RAPPORT GÉNÉRÉ -->/, report)
  : `${prev.trimEnd()}\n\n${report}\n`;
writeFileSync(suiviPath, next);

for (const w of warnings) console.log(`  · ${w}`);
for (const e of errors) console.log(`  ✗ ${e}`);
console.log(
  `\ncheck:data — ${all.characters.length} personnages, ${all.houses.length} maisons, ${all.places.length} lieux, ${all.codex.length} entrées, ${journey.steps.length} étapes · ${errors.length} erreur(s), ${warnings.length} avertissement(s), ${doubts.length} doute(s)`,
);
process.exit(errors.length ? 1 : 0);
