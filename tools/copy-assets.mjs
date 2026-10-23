// Copie des médias de l'ancien site vers public/ avec des noms clairs (PROJET.md §1.4).
// Les .jpg basse définition (doublons des .webp) et les .png d'armoiries (doublons des .svg)
// ne sont pas copiés. Usage : node tools/copy-assets.mjs
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { IMAGE_NAMES } from './asset-names.mjs';

const REF = new URL('../reference/ancien-site/assets/', import.meta.url);
const PUB = new URL('../public/', import.meta.url);

const copy = (from, to) => {
  mkdirSync(new URL('.', to), { recursive: true });
  copyFileSync(from, to);
};

// Illustrations : chaque .webp doit avoir un nom clair dans IMAGE_NAMES.
const illustrations = readdirSync(REF).filter((f) => f.endsWith('.webp'));
for (const file of illustrations) {
  const key = file.replace(/\.webp$/, '');
  if (!IMAGE_NAMES[key]) throw new Error(`Pas de nom clair pour ${file} (tools/asset-names.mjs)`);
  copy(new URL(file, REF), new URL(`images/${IMAGE_NAMES[key]}.webp`, PUB));
}

// Portraits : les noms (prénoms) sont déjà clairs.
const portraits = readdirSync(new URL('portraits/', REF)).filter((f) => f.endsWith('.webp'));
for (const file of portraits) {
  copy(new URL(`portraits/${file}`, REF), new URL(`images/portraits/${file}`, PUB));
}

// Armoiries SVG + crédits.
const sigils = readdirSync(new URL('sigils/', REF)).filter(
  (f) => f.endsWith('.svg') || f.endsWith('.json'),
);
for (const file of sigils) {
  copy(new URL(`sigils/${file}`, REF), new URL(`sigils/${file}`, PUB));
}

console.log({
  illustrations: illustrations.length,
  portraits: portraits.length,
  sigils: sigils.length,
});
