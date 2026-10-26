// npm run images (§10.3) : variantes WebP 480, 960 et 1600 px de chaque image de
// public/images, plus le manifeste src/data/images.json lu par src/ui/media.js (srcset).
// Vérifie aussi les ratios attendus : 3:4 pour les portraits, paysage pour les scènes.
// Les variantes existantes ne sont régénérées que si l'original est plus récent.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import sharp from 'sharp';

const ROOT = new URL('..', import.meta.url).pathname;
const PUBLIC = join(ROOT, 'public');
const IMAGES = join(PUBLIC, 'images');
const MANIFEST = join(ROOT, 'src/data/images.json');
const WIDTHS = [480, 960, 1600];
const VARIANT = /-(480|960|1600)\.webp$/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const originals = walk(IMAGES)
  .filter((f) => f.endsWith('.webp') && !VARIANT.test(f))
  .sort();

const manifest = {};
const warnings = [];
let made = 0;

for (const file of originals) {
  const src = relative(PUBLIC, file);
  const { width: w, height: h } = await sharp(file).metadata();
  const ratio = w / h;
  if (src.startsWith('images/personnages/')) {
    if (Math.abs(ratio - 3 / 4) > 0.03)
      warnings.push(`${src} : ratio ${ratio.toFixed(2)} (3:4 attendu)`);
  } else if (ratio < 1.2) {
    warnings.push(`${src} : ratio ${ratio.toFixed(2)} (paysage attendu)`);
  }
  const variants = [];
  for (const target of WIDTHS) {
    if (target >= w) continue;
    const out = file.replace(/\.webp$/, `-${target}.webp`);
    let fresh = false;
    try {
      fresh = statSync(out).mtimeMs >= statSync(file).mtimeMs;
    } catch {
      // variante absente
    }
    if (!fresh) {
      await sharp(file).resize({ width: target }).webp({ quality: 78, effort: 5 }).toFile(out);
      made++;
    }
    variants.push(target);
  }
  manifest[src] = { w, h, variants };
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `npm run images — ${originals.length} originaux, ${made} variante(s) générée(s), manifeste : src/data/images.json`,
);
const squares = warnings.filter((w) => w.includes('ratio 1.00 (3:4'));
if (squares.length)
  console.warn(
    `  ⚠ ${squares.length} portrait(s) carré(s) au lieu de 3:4 (recadrés par object-fit, à refaire)`,
  );
for (const w of warnings.filter((x) => !squares.includes(x))) console.warn(`  ⚠ ${w}`);
