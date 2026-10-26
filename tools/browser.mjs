// Outils communs aux scripts Playwright (check.mjs, lab-shots.mjs) : build, serveur
// `vite preview`, navigateur WebGL logiciel et attente par interrogation depuis Node.
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

export const PORT = 4173;
export const BASE = `http://localhost:${PORT}`;
// Vite est lancé directement (sans npx) pour que server.kill() l'arrête vraiment.
const VITE = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;

export function build() {
  execFileSync(process.execPath, [VITE, 'build', '--logLevel', 'warn'], { stdio: 'inherit' });
}

/** Démarre `vite preview` et attend qu'il réponde en HTTP. */
export async function startServer() {
  // Un ancien serveur encore actif servirait un autre build : on refuse de continuer.
  const busy = await fetch(BASE).then(
    () => true,
    () => false,
  );
  if (busy) throw new Error(`Le port ${PORT} est déjà occupé (ancien vite preview ?)`);
  const server = spawn(
    process.execPath,
    [VITE, 'preview', '--port', String(PORT), '--strictPort'],
    {
      stdio: ['ignore', 'ignore', 'inherit'],
    },
  );
  let exited = null;
  server.on('exit', (code) => (exited = code));
  for (let i = 0; ; i++) {
    if (exited !== null) throw new Error(`vite preview arrêté (code ${exited})`);
    if (i > 150) throw new Error('vite preview ne démarre pas');
    try {
      if ((await fetch(BASE)).ok) break;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return server;
}

/** Chromium avec WebGL logiciel (SwiftShader), ou sans WebGL du tout. */
export function launch({ webgl = true } = {}) {
  return chromium.launch({
    args: webgl
      ? ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist']
      : ['--disable-webgl', '--disable-3d-apis'],
  });
}

/**
 * Attend qu'un prédicat évalué dans la page devienne vrai, en l'interrogeant depuis Node
 * (page.waitForFunction s'est révélé peu fiable quand la page rend en logiciel à ~1 i/s).
 */
export async function waitUntil(page, predicate, arg, timeout = 90000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await page.evaluate(predicate, arg).catch(() => false)) return;
    await new Promise((r) => setTimeout(r, 150));
  }
  const state = await page.evaluate(() => JSON.stringify(window.realm?.state)).catch(() => '?');
  throw new Error(`Délai dépassé (${timeout} ms) — état : ${state}`);
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
