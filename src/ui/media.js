// Images : srcset depuis le manifeste généré par `npm run images` (§10.3) et placeholders
// SVG élégants quand une image manque (§10.4) — jamais un trou, jamais une image trouvée.
import manifest from '../data/images.json';
import { esc } from './dom.js';

/** Attributs src/srcset/sizes d'une image du dossier public/images. */
export function srcAttrs(src, sizes = '100vw') {
  const m = manifest[src];
  const url = `/${src}`;
  if (!m?.variants?.length) return `src="${url}"`;
  const set = m.variants
    .map((w) => `/${src.replace(/\.webp$/, `-${w}.webp`)} ${w}w`)
    .concat(`${url} ${m.w}w`);
  return `src="${url}" srcset="${set.join(', ')}" sizes="${sizes}" width="${m.w}" height="${m.h}"`;
}

/** Balise <img> standard : lazy sauf première vue, décodage asynchrone, alt obligatoire. */
export function img(src, { alt = '', sizes, eager = false, cls = '', style = '' } = {}) {
  return `<img class="${cls}" ${srcAttrs(src, sizes)} alt="${esc(alt)}" ${
    eager ? 'fetchpriority="high"' : 'loading="lazy"'
  } decoding="async"${style ? ` style="${style}"` : ''} />`;
}

const initials = (name) =>
  name
    .replace(/^(le|la|les|l’|ser|mestre|septa|khal)\s+/i, '')
    .split(/[\s-]+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('') || name[0];

/** Placeholder de portrait 3:4 : fond sombre, blason en filigrane, initiales en grand serif. */
export function portraitPlaceholder(name, sigil, cls = '') {
  const id = `g${Math.random().toString(36).slice(2, 8)}`;
  return `<svg class="ph ${cls}" viewBox="0 0 300 400" role="img" aria-label="${esc(
    `Portrait à venir : ${name}`,
  )}" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="${id}" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#1c2124"/><stop offset="1" stop-color="#0b0d0e"/></radialGradient></defs>
    <rect width="300" height="400" fill="url(#${id})"/>
    ${sigil ? `<image href="/${sigil}" x="40" y="70" width="220" height="220" opacity=".09" preserveAspectRatio="xMidYMid meet"/>` : '<path d="M150 90 230 180 150 270 70 180Z" fill="none" stroke="#e8e4da" stroke-opacity=".12"/>'}
    <rect x="14" y="14" width="272" height="372" fill="none" stroke="#e8e4da" stroke-opacity=".14"/>
    <text x="150" y="205" text-anchor="middle" dominant-baseline="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="104" fill="#e8e4da" fill-opacity=".78">${esc(
      initials(name),
    )}</text>
    <path d="M120 300h24M156 300h24" stroke="#c9b27c" stroke-opacity=".6"/><path d="M150 295l5 5-5 5-5-5Z" fill="none" stroke="#c9b27c" stroke-opacity=".8"/>
  </svg>`;
}

/** Placeholder de paysage 16:9 : brume, ligne d'horizon, nom du lieu en filigrane. */
export function scenePlaceholder(name, cls = '') {
  const id = `s${Math.random().toString(36).slice(2, 8)}`;
  return `<svg class="ph ${cls}" viewBox="0 0 1600 900" role="img" aria-label="${esc(
    `Illustration à venir : ${name}`,
  )}" preserveAspectRatio="xMidYMid slice">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2226"/><stop offset=".62" stop-color="#121719"/><stop offset="1" stop-color="#0b0d0e"/></linearGradient></defs>
    <rect width="1600" height="900" fill="url(#${id})"/>
    <path d="M0 640 C180 600 260 520 420 560 S700 470 860 540 1180 500 1340 560 1520 580 1600 560 V900 H0Z" fill="#0e1214" opacity=".9"/>
    <path d="M0 700 C240 660 420 690 620 650 S1040 700 1260 660 1600 690 1600 690 V900 H0Z" fill="#0b0d0e"/>
    <text x="800" y="430" text-anchor="middle" font-family="Cormorant Garamond, Georgia, serif" font-size="150" fill="#e8e4da" fill-opacity=".07" letter-spacing="12">${esc(
      name.toUpperCase(),
    )}</text>
  </svg>`;
}

/** Portrait d'un personnage (image ou placeholder). */
export function portrait(c, { sigil = null, sizes = '240px', eager = false, cls = '', alt } = {}) {
  if (c.portrait)
    return img(c.portrait, {
      alt: alt ?? `Portrait illustré de ${c.name}`,
      sizes,
      eager,
      cls,
      style: c.portraitFocus ? `object-position:${c.portraitFocus}` : '',
    });
  return portraitPlaceholder(c.name, sigil, cls);
}

/** Illustration d'un lieu, d'une étape ou d'une entrée (image ou placeholder). */
export function scene(src, name, { alt, sizes = '100vw', eager = false, cls = '' } = {}) {
  if (src) return img(src, { alt: alt ?? `Illustration : ${name}`, sizes, eager, cls });
  return scenePlaceholder(name, cls);
}
