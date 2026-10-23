// Captures de lab.html (phase 1) : 4 vues en palette du cahier + 2 variantes de palette.
// Lance le serveur de dev Vite (lab.html est exclu du build), puis Playwright.
// Usage : node tools/lab-shots.mjs [--mobile]
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 5174;
const VITE = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;
const SHOTS = new URL('./shots/', import.meta.url);
const mobile = process.argv.includes('--mobile');

const server = spawn(process.execPath, [VITE, '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});
for (let i = 0; ; i++) {
  if (i > 200) throw new Error('vite ne démarre pas');
  try {
    if ((await fetch(`http://localhost:${PORT}/lab.html`)).ok) break;
  } catch {
    // pas encore prêt
  }
  await new Promise((r) => setTimeout(r, 100));
}

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
mkdirSync(SHOTS, { recursive: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.text().startsWith('[lab]')) console.log(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:${PORT}/lab.html?shots&vues${mobile ? '&mobile' : ''}`);
  await page.waitForFunction(() => window.lab?.ready, null, { timeout: 120000 });
  const prefix = mobile ? 'phase1-mobile' : 'phase1';

  const views = { 0: 'ensemble', 1: 'mur', 2: 'winterfell', 3: 'port-real' };
  for (const [n, name] of Object.entries(views)) {
    await page.evaluate((v) => window.lab.view(Number(v)), n);
    await page.screenshot({ path: new URL(`${prefix}-${n}-${name}.png`, SHOTS).pathname });
    console.log(`capture : tools/shots/${prefix}-${n}-${name}.png`);
  }
  if (!mobile) {
    for (const key of ['sepia', 'encre']) {
      await page.evaluate((k) => window.lab.palette(k), key);
      for (const [n, name] of [
        [0, 'ensemble'],
        [2, 'winterfell'],
      ]) {
        await page.evaluate((v) => window.lab.view(v), n);
        const file = `${prefix}-palette-${key}-${name}.png`;
        await page.screenshot({ path: new URL(file, SHOTS).pathname });
        console.log(`capture : tools/shots/${file}`);
      }
    }
  }
  if (!mobile && process.argv.includes('--maquettes')) {
    // Planche de contrôle : chaque cité en gros plan.
    const cities = await page.evaluate(() =>
      fetch('/src/data/map.json')
        .then((r) => r.json())
        .then((m) => m.cities.map((c) => c.name)),
    );
    for (const name of cities) {
      await page.evaluate((n) => window.lab.lieu(n), name);
      const file = `maquette-${name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\W+/g, '-')
        .toLowerCase()}.png`;
      await page.screenshot({ path: new URL(file, SHOTS).pathname });
      console.log(`capture : tools/shots/${file}`);
    }
  }
  console.log('Durées :', await page.evaluate(() => window.lab.timings));
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) {
  console.error('Erreurs console :', errors);
  process.exit(1);
}
