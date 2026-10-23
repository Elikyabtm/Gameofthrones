// Vérifications automatiques (PROJET.md §11). État phase 3 :
//   1. console : 0 erreur, 0 exception (ordinateur 1440×900 et mobile 390×844) ;
//   2. contenus : chaque fiche liée au voyage s'ouvre dans la modale avec tous ses paragraphes ;
//   3. typographie : aucun texte visible sous 11 px, à chaque étape ;
//   4. débordement : pas de défilement horizontal ;
//   5. étapes : capture au palier, étiquette du lieu actif visible et hors du panneau.
// Usage : npm run check
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 4173;
const URL_BASE = `http://localhost:${PORT}/`;
const SHOTS = new URL('./shots/', import.meta.url);
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

// Vite est lancé directement (sans npx) pour que server.kill() l'arrête vraiment.
const VITE = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;

const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
};

// 1. Build de production.
console.log('Build…');
execFileSync(process.execPath, [VITE, 'build', '--logLevel', 'warn'], { stdio: 'inherit' });

// 2. Serveur de prévisualisation (vite preview) sur le port 4173.
const server = spawn(process.execPath, [VITE, 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});
let exited = null;
server.on('exit', (code) => (exited = code));
// Attente HTTP plutôt que lecture de la sortie (Vite colore le numéro de port).
for (let i = 0; ; i++) {
  if (exited !== null) throw new Error(`vite preview arrêté (code ${exited})`);
  if (i > 150) throw new Error('vite preview ne démarre pas');
  try {
    if ((await fetch(URL_BASE)).ok) break;
  } catch {
    // pas encore prêt
  }
  await new Promise((r) => setTimeout(r, 100));
}

// 3. Parcours Playwright. Options GL pour le rendu WebGL en headless (§11).
const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
mkdirSync(SHOTS, { recursive: true });

/**
 * Attend qu'un prédicat évalué dans la page devienne vrai, en l'interrogeant depuis Node.
 * (page.waitForFunction s'est révélé peu fiable quand la page rend en logiciel à ~1 i/s.)
 */
async function waitUntil(page, predicate, arg, timeout = 90000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await page.evaluate(predicate, arg)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  const state = await page.evaluate(() => window.realm?.state);
  throw new Error(`Délai dépassé (${timeout} ms) — état : ${JSON.stringify(state)}`);
}

// Texte visible sous 11 px (éléments ayant du texte propre, visibles, opacité non nulle).
const smallTexts = () =>
  [...document.querySelectorAll('body *')]
    .filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .filter((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      let o = 1;
      for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
      const shown = cs.visibility !== 'hidden' && cs.display !== 'none' && o > 0.05;
      const onScreen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight;
      return shown && onScreen && !el.closest('.visually-hidden') && parseFloat(cs.fontSize) < 11;
    })
    .map((el) => `${el.tagName}.${el.className} (${getComputedStyle(el).fontSize})`);

try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n${name} (${viewport.width}×${viewport.height})`);
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => window.realm?.ready && window.realm.state, null, {
      timeout: 120000,
    });
    await page.screenshot({ path: new URL(`${name}-00-intro.png`, SHOTS).pathname });

    // Étapes : palier de chaque étape, capture, étiquette active hors du panneau.
    const steps = await page.$$eval('.stop', (els) => els.map((a) => a.dataset.step));
    for (let i = 0; i < steps.length; i++) {
      await page.evaluate((k) => window.realm.goTo(k, { smooth: false }), i);
      await waitUntil(
        page,
        (k) => window.realm.state?.index === k && window.realm.state.phase === 'palier',
        i,
      );
      await page.waitForTimeout(500); // fondu des étiquettes (400 ms)
      const num = String(i + 1).padStart(2, '0');
      await page.screenshot({
        path: new URL(`${name}-${num}-${steps[i]}.png`, SHOTS).pathname,
      });
      const label = await page.evaluate((k) => {
        const panel = document.querySelectorAll('.stop-panel')[k].getBoundingClientRect();
        const active = [...document.querySelectorAll('.world-label.is-active.is-visible')];
        const hit = (r) =>
          !(
            r.right < panel.left ||
            r.left > panel.right ||
            r.bottom < panel.top ||
            r.top > panel.bottom
          );
        return {
          count: active.length,
          covered: active.filter((l) => hit(l.getBoundingClientRect())).map((l) => l.textContent),
        };
      }, i);
      // Étape sans cité (au-delà du Mur, ou cadrage « entre deux lieux ») : pas d'étiquette exigée.
      if (label.count || !['au-dela-du-mur'].includes(steps[i])) {
        check(
          label.count > 0 && label.covered.length === 0,
          `${num} ${steps[i]} : ${label.count} étiquette(s) active(s)${
            label.covered.length ? `, masquée(s) par le panneau : ${label.covered.join(', ')}` : ''
          }`,
        );
      }
      const small = await page.evaluate(smallTexts);
      if (small.length) check(false, `${num} ${steps[i]} : texte sous 11 px : ${small.join(', ')}`);
    }

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    check(overflow <= 0, `pas de défilement horizontal (${overflow} px de trop)`);

    // Contenus : chaque fiche liée s'ouvre avec tous ses paragraphes.
    if (name === 'desktop') {
      const result = await page.evaluate(async () => {
        const { FICHES } = window.__realmContent ?? {};
        const buttons = [...document.querySelectorAll('[data-archive]')];
        const bad = [];
        for (const b of buttons) {
          b.click();
          const dlg = document.getElementById('archive');
          const [type, id] = b.dataset.archive.split(':');
          const f = FICHES[type].find((x) => x.id === id);
          const title = dlg.querySelector('#archive-title')?.textContent;
          const paras = dlg.querySelectorAll('.archive-p').length;
          if (!dlg.open || title !== f.title || paras !== f.body.length)
            bad.push(b.dataset.archive);
          dlg.close();
        }
        // Chaque fiche du contenu doit être présente dans le DOM (voyage ou index).
        const keys = new Set(buttons.map((b) => b.dataset.archive));
        const missing = Object.entries(FICHES).flatMap(([type, list]) =>
          list.filter((f) => !keys.has(`${type}:${f.id}`)).map((f) => `${type}:${f.id}`),
        );
        const total = Object.values(FICHES).reduce((n, l) => n + l.length, 0);
        return { total: buttons.length, fiches: total, bad, missing };
      });
      check(
        result.bad.length === 0,
        `${result.total} boutons de fiche (voyage + index) ouvrent la bonne fiche avec tous ses paragraphes${
          result.bad.length ? ` — en défaut : ${result.bad.join(', ')}` : ''
        }`,
      );
      check(
        result.missing.length === 0,
        `les ${result.fiches} fiches sont toutes présentes dans la page${
          result.missing.length ? ` — absentes : ${result.missing.join(', ')}` : ''
        }`,
      );
    }

    // Annexes : capture, texte ≥ 11 px, carte estompée, interactions de base.
    for (const id of ['arbre', 'index', 'chronologie', 'sources']) {
      await page.evaluate(
        (id) => document.getElementById(id).scrollIntoView({ behavior: 'instant' }),
        id,
      );
      await page.waitForTimeout(800);
      await page.screenshot({ path: new URL(`${name}-annexe-${id}.png`, SHOTS).pathname });
      const small = await page.evaluate(smallTexts);
      check(
        small.length === 0,
        `annexe ${id} : aucun texte sous 11 px${small.length ? ' — ' + small.join(', ') : ''}`,
      );
    }
    const faded = await page.evaluate(
      () => getComputedStyle(document.getElementById('world')).opacity,
    );
    check(Number(faded) === 0, `dans les annexes, la carte est estompée (opacité ${faded})`);
    if (name === 'desktop') {
      await page.evaluate(() =>
        document.getElementById('arbre').scrollIntoView({ behavior: 'instant' }),
      );
      await page.locator('#person-ned').click();
      const asideOk = await page.locator('.tree-person').isVisible();
      check(asideOk, 'arbre : un clic sur Eddard Stark ouvre sa fiche personnage');
      await page.waitForTimeout(300);
      await page.screenshot({
        path: new URL(`${name}-annexe-arbre-selection.png`, SHOTS).pathname,
      });
      await page.locator('.index-search input').fill('dragon');
      const n = await page.locator('.index-grid li:not([hidden])').count();
      check(
        n > 0 && n < 20,
        `index : la recherche « dragon » filtre les fiches (${n} résultat(s))`,
      );
      await page.locator('.index-search input').fill('');
    }

    // Navigation (§11.9) : → de l'étape 03 à 04, clic sur un point de la frise.
    if (name === 'desktop') {
      const waitStep = (k) =>
        waitUntil(
          page,
          (k) => window.realm.state?.index === k && window.realm.state.phase === 'palier',
          k,
        );
      await page.evaluate(() => window.realm.goTo(2, { smooth: false }));
      await waitStep(2);
      // Sortir du champ de recherche de l'index : les flèches y sont volontairement ignorées.
      await page.evaluate(() => document.activeElement?.blur());
      await page.keyboard.press('ArrowRight');
      await waitStep(3).then(
        () => check(true, '→ fait passer de l’étape 03 à 04'),
        () => check(false, '→ ne fait pas passer de l’étape 03 à 04'),
      );
      await page.locator('.hud-track button[data-goto="6"]').click();
      await waitStep(6).then(
        () => check(true, 'clic sur le 8ᵉ point de la frise → étape 07'),
        () => check(false, 'clic sur un point de la frise : mauvaise étape'),
      );
      await page.screenshot({ path: new URL(`${name}-hud.png`, SHOTS).pathname });
      // Menu « Explorer » : ouverture, Échap, retour du focus.
      await page.locator('.hud-explore').click();
      await page.screenshot({ path: new URL(`${name}-menu.png`, SHOTS).pathname });
      await page.keyboard.press('Escape');
      const menuOk = await page.evaluate(
        () =>
          document.getElementById('menu').hidden &&
          document.activeElement === document.querySelector('.hud-explore'),
      );
      check(menuOk, 'menu : Échap ferme et rend le focus au bouton « Explorer »');
    }

    // Capture d'une fiche ouverte (modale).
    await page.evaluate(() => document.querySelector('[data-archive="house:stark"]').click());
    await page.waitForTimeout(400);
    await page.screenshot({ path: new URL(`${name}-fiche.png`, SHOTS).pathname });
    await page.keyboard.press('Escape');

    check(
      errors.length === 0,
      `console : ${errors.length} erreur(s)${errors.length ? ' — ' + errors.join(' | ') : ''}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(failures.length ? `\n${failures.length} échec(s).` : '\nTout est vert.');
process.exit(failures.length ? 1 : 0);
