// npm run check (§13) — vérifications automatiques de la v2, sur build de production :
//   1. budgets : JS initial de l'accueil < 300 Ko gzip, poids total chargé sur l'accueil ;
//   2. routes (ordinateur 1440×900 et mobile 390×844) : 0 erreur console, 0 exception,
//      aucun texte visible sous 11 px, pas de défilement horizontal, capture ;
//   3. accessibilité : axe-core, 0 violation « serious » ou « critical » ;
//   4. contraste : échantillonnage de pixels sur les textes courants (≥ 4,5:1) ;
//   5. voyage : capture de chaque étape, de la traversée et de l'écran de fin ;
//      navigation clavier (→) ;
//   6. recherche : Ctrl+K → « brienne » → Entrée ouvre la fiche ;
//   7. anti-spoilers : témoins de tools/spoiler-witnesses.json absents du DOM ;
//   8. animations réduites et navigateur sans WebGL : le site reste utilisable ;
//   9. aucune requête externe.
// Usage : npm run check [-- --no-build] [-- --quick]  (--quick : sans captures d'étapes mobiles)
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
import { BASE, build, launch, sleep, startServer, waitUntil } from './browser.mjs';

const args = process.argv.slice(2);
const QUICK = args.includes('--quick');
const ROOT = new URL('..', import.meta.url).pathname;
const SHOTS = new URL('./shots/check/', import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};
const ROUTES = [
  ['accueil', '/'],
  ['personnages', '/personnages'],
  ['personnages-grille', '/personnages?vue=grille'],
  ['fiche', '/personnages/jon-snow'],
  ['fiche-liens', '/personnages/jon-snow/liens'],
  ['fiche-lieux', '/personnages/jon-snow/lieux'],
  ['maisons', '/maisons'],
  ['maison', '/maisons/stark'],
  ['lignees', '/maisons/toutes-les-lignees'],
  ['codex', '/codex'],
  ['codex-rubrique', '/codex/creatures'],
  ['codex-entree', '/codex/creatures/dragons'],
  ['a-propos', '/a-propos'],
  ['introuvable', '/ce-chemin-n-existe-pas'],
];
// Textes courants dont on mesure le contraste réel (pixels rendus).
const CONTRAST = [
  ['/personnages/jon-snow', '.bio-block p'],
  ['/personnages/jon-snow', '.fiche-summary'],
  ['/maisons/stark', '.house-history p, .history p'],
  ['/codex/creatures/dragons', '.entry-body p'],
  ['/a-propos', '.page p'],
];

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  return ok;
};
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase();

// ---------------------------------------------------------------- 1. build et budgets
if (!args.includes('--no-build')) {
  console.log('Build…');
  build();
}
console.log('\nBudgets');
{
  const html = readFileSync(`${ROOT}dist/index.html`, 'utf8');
  const initial = [
    ...html.matchAll(/<script[^>]+src="\/([^"]+\.js)"/g),
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="\/([^"]+\.js)"/g),
  ].map((m) => m[1]);
  const gz = (f) => gzipSync(readFileSync(`${ROOT}dist/${f}`)).length;
  const initialKb = initial.reduce((n, f) => n + gz(f), 0) / 1024;
  check(initialKb < 300, `JS initial de l'accueil : ${initialKb.toFixed(1)} Ko gzip (< 300)`);
  const all = readdirSync(`${ROOT}dist/assets`).filter((f) => f.endsWith('.js'));
  const biggest = all
    .map((f) => [f, gz(`assets/${f}`) / 1024])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([f, k]) => `${f.replace(/-[\w-]{8}\.js$/, '')} ${k.toFixed(0)} Ko`);
  console.log(`    plus gros morceaux (gzip) : ${biggest.join(' · ')}`);
}

const server = await startServer();
const witnesses = JSON.parse(
  readFileSync(new URL('./spoiler-witnesses.json', import.meta.url), 'utf8'),
).witnesses;

/** Page instrumentée : erreurs, exceptions, requêtes externes. */
async function openPage(browser, viewport, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  // Saison déjà choisie (8) : le sélecteur de première visite ne s'ouvre pas.
  await context.addInitScript(() => {
    try {
      if (!localStorage.getItem('realm-divided:v2'))
        localStorage.setItem('realm-divided:v2', JSON.stringify({ season: 8 }));
    } catch {
      /* stockage indisponible */
    }
  });
  const page = await context.newPage();
  const log = { errors: [], external: [] };
  page.on('console', (m) => m.type() === 'error' && log.errors.push(m.text()));
  page.on('pageerror', (e) => log.errors.push(`exception : ${e.message}`));
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(BASE) && !/^(data|blob):/.test(u)) log.external.push(u);
  });
  return { context, page, log };
}

/** Navigation interne (SPA) puis attente du montage de l'espace. */
async function go(page, path) {
  await page.evaluate((p) => window.realm.router.navigate(p), path);
  await waitUntil(
    page,
    (p) => {
      const here = location.pathname + location.search;
      const space = document.querySelector('#space');
      return here === p && space?.children.length > 0 && !space.classList.contains('is-leaving');
    },
    path,
    30000,
  );
  await sleep(900);
}

const textAudit = (page) =>
  page.evaluate(() => {
    const small = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const el = n.parentElement;
      if (!el || el.closest('[hidden], [aria-hidden="true"], svg')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight) continue;
      if (parseFloat(cs.fontSize) < 11)
        small.add(
          `${el.tagName.toLowerCase()}.${el.className} « ${n.textContent.trim().slice(0, 30)} » ${cs.fontSize}`,
        );
    }
    return {
      small: [...small].slice(0, 5),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });

async function axe(page, label) {
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const bad = res.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  check(
    bad.length === 0,
    `axe ${label} : ${bad.length} violation(s) grave(s)${bad.length ? ` — ${bad.map((v) => `${v.id} (${v.nodes.length})`).join(', ')}` : ''}`,
  );
}

/** Contraste réel : luminances extrêmes des pixels d'un bloc de texte. */
async function contrast(page, selector) {
  const el = page.locator(selector).first();
  if (!(await el.count())) return null;
  await el.scrollIntoViewIfNeeded();
  const png = await el.screenshot();
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const lum = [];
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  for (let i = 0; i < data.length; i += info.channels * 3)
    lum.push(0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]));
  lum.sort((a, b) => a - b);
  const lo = lum[Math.floor(lum.length * 0.05)];
  const hi = lum[Math.floor(lum.length * 0.995)];
  return (hi + 0.05) / (lo + 0.05);
}

let browser = await launch();
try {
  // ---------------------------------------------------------------- 2-4. routes
  for (const [vp, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\nRoutes — ${vp}`);
    const { context, page, log } = await openPage(browser, viewport);
    await page.goto(`${BASE}/`);
    await waitUntil(page, () => window.realm?.space, null, 60000);
    await waitUntil(page, () => window.realm.world?.state?.ready, null, 180000).catch(() =>
      check(false, `${vp} : le monde 3D ne s'initialise pas`),
    );
    for (const [name, path] of ROUTES) {
      const before = log.errors.length;
      await go(page, path);
      const audit = await textAudit(page);
      const errs = log.errors.slice(before);
      check(
        errs.length === 0,
        `${vp} ${path} : console propre${errs.length ? ` — ${errs[0]}` : ''}`,
      );
      if (audit.small.length)
        check(false, `${vp} ${path} : texte < 11 px — ${audit.small.join(' | ')}`);
      if (audit.overflow > 1)
        check(false, `${vp} ${path} : défilement horizontal (${audit.overflow} px)`);
      await page.screenshot({ path: `${SHOTS}${vp}-${name}.png` });
      if (vp === 'desktop' || ['accueil', 'fiche', 'maison', 'codex-entree'].includes(name))
        await axe(page, `${vp} ${path}`);
    }
    if (vp === 'desktop') {
      console.log('\nContraste (pixels rendus)');
      for (const [path, sel] of CONTRAST) {
        await go(page, path);
        const ratio = await contrast(page, sel);
        if (ratio === null) check(false, `contraste ${path} ${sel} : élément introuvable`);
        else check(ratio >= 4.5, `contraste ${path} ${sel} : ${ratio.toFixed(1)}:1`);
      }

      // ------------------------------------------------------------ 6. recherche
      console.log('\nRecherche');
      await go(page, '/maisons');
      await page.keyboard.press('Control+k');
      await waitUntil(page, () => !document.querySelector('#search').hidden, null, 5000);
      await sleep(300);
      await page.keyboard.type('brienne');
      await sleep(400);
      await page.keyboard.press('Enter');
      await waitUntil(
        page,
        () => location.pathname === '/personnages/brienne-de-torth',
        null,
        10000,
      )
        .then(() => check(true, 'Ctrl+K → « brienne » → Entrée ouvre la fiche de Brienne'))
        .catch(() => check(false, 'Ctrl+K → « brienne » → Entrée n’ouvre pas la fiche'));
      await sleep(600);
      await page.keyboard.press('/');
      const slashOpens = await waitUntil(
        page,
        () => !document.querySelector('#search').hidden,
        null,
        3000,
      )
        .then(() => true)
        .catch(() => false);
      check(slashOpens, 'la touche / ouvre la recherche');
      await page.keyboard.press('Escape');

      // ------------------------------------------------------------ 7. anti-spoilers
      console.log('\nTémoins anti-spoilers');
      for (const w of witnesses) {
        await page.evaluate((s) => window.realm.store.set({ season: s }), w.season);
        await go(page, w.route);
        const dom = norm(await page.evaluate(() => document.body.outerHTML));
        const found = w.absent.filter((t) => dom.includes(norm(t)));
        check(
          found.length === 0,
          `saison ${w.season} ${w.route} : ${found.length ? `trouvé ${found.map((f) => `« ${f} »`).join(', ')}` : 'rien de masqué dans le DOM'}`,
        );
      }
      await page.evaluate(() => window.realm.store.set({ season: 8 }));
    }

    // ---------------------------------------------------------------- 5. voyage
    console.log(`\nVoyage — ${vp}`);
    const steps = JSON.parse(readFileSync(`${ROOT}src/data/journey.json`, 'utf8')).steps.map(
      (s) => s.slug,
    );
    const shotSteps = vp === 'mobile' && QUICK ? steps.filter((_, i) => i % 6 === 0) : steps;
    await go(page, '/');
    let ok = 0;
    for (const slug of shotSteps) {
      await go(page, `/carte/${slug}`);
      const reached = await waitUntil(page, (s) => window.realm.state?.slug === s, slug, 20000)
        .then(() => true)
        .catch(() => false);
      if (!reached) {
        check(false, `${vp} étape ${slug} : palier non atteint`);
        continue;
      }
      await sleep(1600);
      await page.screenshot({
        path: `${SHOTS}${vp}-etape-${String(steps.indexOf(slug) + 1).padStart(2, '0')}-${slug}.png`,
      });
      const audit = await textAudit(page);
      if (audit.small.length)
        check(false, `${vp} étape ${slug} : texte < 11 px — ${audit.small[0]}`);
      ok++;
    }
    check(ok === shotSteps.length, `${vp} : ${ok}/${shotSteps.length} étapes capturées au palier`);
    // Traversée de la mer Étroite et écran de fin.
    for (const [name, sel] of [
      ['traversee', '.crossing'],
      ['fin', '.journey-end, .end'],
    ]) {
      const found = await page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return false;
        scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) / 2);
        return true;
      }, sel);
      if (!check(found, `${vp} : section ${name} présente`)) continue;
      await sleep(1800);
      await page.screenshot({ path: `${SHOTS}${vp}-${name}.png` });
    }
    if (vp === 'desktop') {
      await go(page, '/carte/winterfell');
      await waitUntil(page, () => window.realm.state?.slug === 'winterfell', null, 20000);
      await sleep(800);
      await page.keyboard.press('ArrowRight');
      const moved = await waitUntil(
        page,
        () => window.realm.state?.slug && window.realm.state.slug !== 'winterfell',
        null,
        15000,
      )
        .then(() => true)
        .catch(() => false);
      check(moved, 'clavier : → passe à l’étape suivante');
    }
    check(
      log.external.length === 0,
      `${vp} : aucune requête externe${log.external.length ? ` — ${log.external[0]}` : ''}`,
    );
    await context.close();
  }

  // ---------------------------------------------------------------- 8. animations réduites
  console.log('\nAnimations réduites');
  {
    const { context, page, log } = await openPage(browser, VIEWPORTS.desktop, {
      reducedMotion: 'reduce',
    });
    await page.goto(`${BASE}/carte/port-real`);
    await waitUntil(page, () => window.realm.state?.slug === 'port-real', null, 60000)
      .then(() => check(true, 'animations réduites : /carte/port-real atteint son palier'))
      .catch(() => check(false, 'animations réduites : palier non atteint'));
    await sleep(1500);
    await page.screenshot({ path: `${SHOTS}reduced-motion.png` });
    check(
      log.errors.length === 0,
      `animations réduites : console propre${log.errors.length ? ` — ${log.errors[0]}` : ''}`,
    );
    await context.close();
  }
  await browser.close();

  // ---------------------------------------------------------------- 8. sans WebGL
  console.log('\nSans WebGL');
  browser = await launch({ webgl: false });
  {
    const { context, page, log } = await openPage(browser, VIEWPORTS.desktop);
    await page.goto(`${BASE}/carte/winterfell`);
    await waitUntil(page, () => window.realm?.state?.slug === 'winterfell', null, 60000)
      .then(() => check(true, 'sans WebGL : le voyage fonctionne (repli 2D)'))
      .catch(() => check(false, 'sans WebGL : le voyage ne démarre pas'));
    await sleep(1500);
    await page.screenshot({ path: `${SHOTS}sans-webgl.png` });
    await go(page, '/personnages/arya-stark');
    const exceptions = log.errors.filter((e) => e.startsWith('exception'));
    check(
      exceptions.length === 0,
      `sans WebGL : aucune exception${exceptions.length ? ` — ${exceptions[0]}` : ''}`,
    );
    await context.close();
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(
  failures.length
    ? `\n✗ ${failures.length} échec(s) :\n${failures.map((f) => `  - ${f}`).join('\n')}`
    : '\n✓ Toutes les vérifications passent.',
);
console.log(`Captures : tools/shots/check/`);
process.exit(failures.length ? 1 : 0);
