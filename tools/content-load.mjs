// Lecture des contenus JSON (src/data/**) et construction de l'index léger (§12 « Données »).
// Partagé par vite.config.js (module virtuel `virtual:content-index`) et check-data.mjs.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const DATA_DIR = new URL('../src/data/', import.meta.url).pathname;
export const KINDS = ['characters', 'houses', 'places', 'codex'];

export function readDir(kind) {
  const dir = join(DATA_DIR, kind);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => ({ file: `${kind}/${f}`, data: JSON.parse(readFileSync(join(dir, f), 'utf8')) }));
}

export function readJson(name) {
  return JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8'));
}

/** Toutes les entités : { characters: [...], houses, places, codex }. */
export function loadAll() {
  return Object.fromEntries(KINDS.map((k) => [k, readDir(k).map((e) => e.data)]));
}

const pick = (o, keys) =>
  Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]));

/**
 * Index léger chargé par tous les espaces : de quoi lister, relier, chercher et filtrer,
 * sans les biographies ni les longs textes (chargés fiche par fiche).
 */
export function buildIndex(all = loadAll()) {
  return {
    characters: all.characters.map((c) => ({
      ...pick(c, [
        'slug',
        'name',
        'short',
        'aliases',
        'house',
        'origin',
        'titles',
        'firstSeason',
        'status',
        'summary',
        'portrait',
        'portraitFocus',
        'places',
        'codex',
        'principal',
      ]),
      relations: (c.relations ?? []).map((r) =>
        pick(r, ['to', 'type', 'label', 'inverseLabel', 's']),
      ),
      region: c.region,
      camp: c.camp,
    })),
    houses: all.houses.map((h) =>
      pick(h, [
        'slug',
        'name',
        'words',
        'sigil',
        'seat',
        'region',
        'members',
        'overlord',
        'color',
        'summary',
      ]),
    ),
    places: all.places.map((p) => ({
      ...pick(p, [
        'slug',
        'name',
        'kind',
        'region',
        'continent',
        'coords',
        'house',
        'image',
        'summary',
      ]),
    })),
    codex: all.codex.map((e) =>
      pick(e, [
        'slug',
        'rubric',
        'name',
        'kicker',
        'lead',
        'image',
        'characters',
        'places',
        'featured',
      ]),
    ),
  };
}
