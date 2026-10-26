// Captures des écrans types (hors carte) : node tools/shots-spaces.mjs [--no-build] [--mobile] [--season=8] [chemins…]
import { mkdirSync } from 'node:fs';
import { BASE, build, launch, sleep, startServer, waitUntil } from './browser.mjs';

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const season = Number(args.find((a) => a.startsWith('--season='))?.slice(9) ?? 8);
const paths = args.filter((a) => a.startsWith('/'));
const OUT = new URL('./shots/spaces/', import.meta.url);
mkdirSync(OUT, { recursive: true });
if (!args.includes('--no-build')) build();
const server = await startServer();
const browser = await launch();
const page = await browser.newPage({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
});
page.on('console', (m) => m.type() === 'error' && console.log('  console :', m.text()));
page.on('pageerror', (e) => console.log('  exception :', e.message));
try {
  await page.goto(`${BASE}/a-propos`);
  await page.evaluate((s) => window.realm.store.set({ season: s }), season);
  for (const p of paths.length
    ? paths
    : [
        '/personnages',
        '/personnages/arya-stark',
        '/personnages/arya-stark/liens',
        '/maisons',
        '/maisons/stark',
        '/codex',
        '/codex/ordres',
        '/codex/ordres/garde-de-nuit',
        '/a-propos',
        '/nulle-part',
      ]) {
    await page.evaluate((u) => window.realm.router.navigate(u), p);
    await waitUntil(
      page,
      (u) =>
        location.pathname === u.split('?')[0] &&
        !document.getElementById('space').classList.contains('is-leaving'),
      p,
      20000,
    );
    await sleep(1500);
    const name = p.replace(/\//g, '_').replace(/^_/, '') || 'root';
    await page.screenshot({ path: new URL(`${name}${mobile ? '-m' : ''}.png`, OUT).pathname });
    console.log('  ✓', p, await page.title());
  }
} finally {
  await browser.close();
  server.kill();
}
