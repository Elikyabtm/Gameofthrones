// Captures du paysage (phase 2) : intro, étapes au cadrage haut et rapproché.
// Usage : node tools/lab-shots.mjs [--mobile] [--steps=winterfell,braavos] [--no-build]
// Les étapes sont visitées par l'URL /carte/{étape} puis repositionnées à u donné.
import { mkdirSync } from 'node:fs';
import { BASE, build, launch, sleep, startServer, waitUntil } from './browser.mjs';

const args = process.argv.slice(2);
const mobile = args.includes('--mobile');
const only = args
  .find((a) => a.startsWith('--steps='))
  ?.slice(8)
  .split(',');
const us = (args.find((a) => a.startsWith('--u='))?.slice(4) ?? '0.2,0.45').split(',').map(Number);
const OUT = new URL('./shots/lab/', import.meta.url);
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
  await page.goto(`${BASE}/`);
  // Saison déjà choisie : pas de sélecteur.
  await page.evaluate(() => window.realm.store.set({ season: 8 }));
  const t0 = Date.now();
  await waitUntil(page, () => window.realm.world?.state?.ready, null, 180000);
  const w = await page.evaluate(() => ({
    init: window.realm.world.initMs,
    timings: window.realm.world.timings,
    worker: window.realm.world.usedWorker,
  }));
  console.log(`Monde prêt en ${Date.now() - t0} ms`, JSON.stringify(w));
  await sleep(2500);
  await page.screenshot({ path: new URL(`intro${mobile ? '-m' : ''}.png`, OUT).pathname });
  const steps = await page.evaluate(() =>
    [...document.querySelectorAll('.step')].map((e) => e.id.slice(6)),
  );
  for (const slug of steps.filter((s) => !only || only.includes(s))) {
    for (const u of us) {
      await page.evaluate(
        ({ slug, u }) => {
          const el = document.getElementById(`etape-${slug}`);
          const top = el.getBoundingClientRect().top + scrollY;
          scrollTo(0, Math.round(top + u * (el.offsetHeight - innerHeight)));
        },
        { slug, u },
      );
      await waitUntil(page, (slug) => window.realm.state?.slug === slug, slug, 30000);
      await sleep(2600); // quelques images en rendu logiciel
      await page.screenshot({
        path: new URL(`${slug}-${u}${mobile ? '-m' : ''}.png`, OUT).pathname,
      });
      console.log(
        `  ${slug} u=${u}`,
        JSON.stringify(await page.evaluate(() => window.realm.state.world)),
      );
    }
  }
} finally {
  await browser.close();
  server.kill();
}
