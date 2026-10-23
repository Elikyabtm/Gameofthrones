// Généré par tools/extract-content.mjs depuis reference/ancien-site/. Textes non corrigés.
// Personnages et liens de l'arbre généalogique.
import part1 from './people/families-1.js';
import part2 from './people/families-2.js';
import links from './people/links.js';

export const families = links.families;
export const people = [...part1, ...part2];
export const unions = links.unions;
export const special = links.special;

export default { families, people, unions, special };
