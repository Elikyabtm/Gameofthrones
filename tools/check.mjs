// Vérifications automatiques (PROJET.md §11). Version minimale de la phase 0 :
// build, serveur de prévisualisation, console sans erreur et capture de la page.
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
const fail = (msg) => {
  failures.push(msg);
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

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

try {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n${name} (${viewport.width}×${viewport.height})`);
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(URL_BASE, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    if (errors.length) fail(`console : ${errors.length} erreur(s) — ${errors.join(' | ')}`);
    else ok('console : 0 erreur, 0 exception');

    const path = new URL(`${name}-00-vide.png`, SHOTS);
    await page.screenshot({ path: path.pathname });
    ok(`capture : tools/shots/${name}-00-vide.png`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(failures.length ? `\n${failures.length} échec(s).` : '\nTout est vert.');
process.exit(failures.length ? 1 : 0);
