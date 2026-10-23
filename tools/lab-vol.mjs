// Phase 2 : vérifications et vidéo du vol dans lab.html (serveur de dev Vite, Playwright).
//   - captures aux moments clés (intro, vols, paliers, traversée en arc haut) ;
//   - arc 'high' : la caméra passe au-dessus de y = 5,5 au milieu de la traversée ;
//   - décalage optique : panneau à gauche → lieu dans le tiers droit, et inversement ;
//   - reduced-motion : aucune caméra en vol plus de 400 ms après un changement d'étape ;
//   - URL directe #etape-xxx : ouvre l'étape au début de son palier (u = 0,48) ;
//   - vidéo du vol complet (recordVideo) → tools/shots/phase2-vol.mp4.
// Le rendu logiciel (SwiftShader) ne tient que quelques images/s : la vidéo est tournée au
// ralenti (défilement de 120 s, animations ×0,1) puis accélérée ×10 avec ffmpeg.
// Usage : node tools/lab-vol.mjs [--sans-video]
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { chromium } from 'playwright';

const PORT = 5175;
const BASE = `http://localhost:${PORT}/lab.html`;
const VITE = new URL('../node_modules/vite/bin/vite.js', import.meta.url).pathname;
const SHOTS = new URL('./shots/', import.meta.url);
const shot = (name) => new URL(name, SHOTS).pathname;
const withVideo = !process.argv.includes('--sans-video');
const SLOW = 10; // facteur de ralenti du tournage

const failures = [];
const check = (ok, msg) => {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) failures.push(msg);
};

const server = spawn(process.execPath, [VITE, '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'ignore', 'inherit'],
});
for (let i = 0; ; i++) {
  if (i > 200) throw new Error('vite ne démarre pas');
  try {
    if ((await fetch(BASE)).ok) break;
  } catch {
    // pas encore prêt
  }
  await new Promise((r) => setTimeout(r, 100));
}

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
mkdirSync(SHOTS, { recursive: true });

async function open(context, url) {
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.lab?.ready && window.lab.flight.state, null, {
    timeout: 120000,
  });
  return { page, errors };
}

// Attend que la caméra ait rendu une image pour l'étape i à la progression u.
const waitState = (page, i, u) =>
  page.waitForFunction(
    ([i, u]) => {
      const s = window.lab.flight.state;
      return s && s.index === i && Math.abs(s.u - u) < 0.01;
    },
    [i, u],
    { timeout: 60000, polling: 50 },
  );

// Place le scroll sur l'étape i à la progression u, attend le rendu, renvoie l'état.
async function goTo(page, i, u) {
  await page.evaluate(([i, u]) => window.lab.flight.goTo(i, { smooth: false, u }), [i, u]);
  await waitState(page, i, u);
  return page.evaluate(() => window.lab.flight.state);
}

const fmt = (x) => x.toFixed(2);

try {
  // 1. Captures aux moments clés (ordinateur).
  console.log('Vol — captures');
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const { page, errors } = await open(desktop, `${BASE}?shots`);
  await page.screenshot({ path: shot('phase2-00-intro.png') });
  const moments = [
    [0, 0.2, 'phase2-01-vol-intro-mur.png'],
    [0, 0.6, 'phase2-02-palier-mur.png'],
    [1, 0.2, 'phase2-03-vol-mur-winterfell.png'],
    [1, 0.6, 'phase2-04-palier-winterfell.png'],
    [2, 0.2, 'phase2-05-traversee-haute.png'],
    [2, 0.6, 'phase2-06-palier-port-real.png'],
  ];
  for (const [i, u, file] of moments) {
    const s = await goTo(page, i, u);
    await page.screenshot({ path: shot(file) });
    console.log(`  capture : tools/shots/${file} (${s.phase}, caméra y = ${fmt(s.cameraY)})`);
    if (file.includes('traversee')) {
      check(s.cameraY > 5.5, `traversée : caméra y = ${fmt(s.cameraY)} > 5,5 au milieu du vol`);
    }
    if (s.phase === 'palier') {
      const ok = s.side === 'left' ? s.screen.x > 0.6 : s.screen.x < 0.4;
      const where = s.side === 'left' ? 'à gauche → tiers droit' : 'à droite → tiers gauche';
      check(ok, `panneau ${where} : lieu à x = ${fmt(s.screen.x)}`);
    }
  }
  check(
    errors.length === 0,
    `console sans erreur${errors.length ? ' : ' + errors.join(' | ') : ''}`,
  );
  await desktop.close();

  // 2. Lien direct : #etape-winterfell → étape 2, début du palier.
  console.log('URL directe');
  const direct = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const d = await open(direct, `${BASE}?shots#etape-winterfell`);
  await d.page.waitForTimeout(500); // laisse passer un éventuel saut d'ancre natif
  await d.page.waitForFunction(() => window.lab.flight.state.index === 1, null, { timeout: 60000 });
  const ds = await d.page.evaluate(() => ({ ...window.lab.flight.state, hash: location.hash }));
  check(
    ds.id === 'winterfell' && Math.abs(ds.u - 0.48) < 0.02,
    `#etape-winterfell → étape ${ds.id}, u = ${ds.u.toFixed(3)} (attendu 0,48)`,
  );
  await direct.close();

  // 3. Mouvement réduit : coupe directe, jamais de vol, panneaux sans translation.
  console.log('Mouvement réduit');
  const reduced = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const r = await open(reduced, `${BASE}?shots`);
  await goTo(r.page, 0, 0.6);
  await r.page.evaluate(() => window.lab.flight.goTo(1, { smooth: false, u: 0.05 }));
  await waitState(r.page, 1, 0.05);
  await r.page.waitForTimeout(400);
  const rs = await r.page.evaluate(() => window.lab.flight.state);
  check(
    rs.index === 1 && rs.phase !== 'vol',
    `${Math.round(rs.sinceChange)} ms après le changement d'étape : ${rs.phase} sur ${rs.id}`,
  );
  await r.page.screenshot({ path: shot('phase2-07-reduced-motion.png') });
  await reduced.close();

  // 4. Mobile : panneau en bas, lieu dans le tiers supérieur.
  console.log('Mobile');
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const m = await open(mobile, `${BASE}?shots&mobile`);
  const ms = await goTo(m.page, 1, 0.6);
  check(ms.screen.y < 0.4, `lieu dans le tiers supérieur : y = ${fmt(ms.screen.y)}`);
  await m.page.screenshot({ path: shot('phase2-08-mobile-palier.png') });
  await mobile.close();

  // 5. Vidéo : défilement continu de l'intro à la fin, tourné au ralenti puis accéléré.
  if (withVideo) {
    console.log('Vidéo (≈ 2 min de tournage)');
    const videoDir = new URL('./video-tmp/', SHOTS).pathname;
    rmSync(videoDir, { recursive: true, force: true });
    const rec = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
    });
    // Profil allégé (?mobile : maillage 512×256) pour gagner des images/s en rendu logiciel.
    const v = await open(rec, `${BASE}?shots&mobile&temps=${1 / SLOW}`);
    await v.page.evaluate(
      (duration) =>
        new Promise((resolve) => {
          const end = document.documentElement.scrollHeight - innerHeight;
          const t0 = performance.now();
          const step = () => {
            const k = Math.min(1, (performance.now() - t0) / duration);
            // Défilement à vitesse constante, comme une molette régulière.
            window.scrollTo(0, end * k);
            if (k < 1) requestAnimationFrame(step);
            else setTimeout(resolve, 3000);
          };
          requestAnimationFrame(step);
        }),
      12000 * SLOW,
    );
    const video = v.page.video();
    await rec.close();
    const raw = await video.path();
    execFileSync('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      raw,
      '-filter:v',
      `setpts=PTS/${SLOW},fps=25`,
      '-an',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      shot('phase2-vol.mp4'),
    ]);
    rmSync(videoDir, { recursive: true, force: true });
    console.log('  vidéo : tools/shots/phase2-vol.mp4 (≈ 12 s)');
  }
} finally {
  await browser.close();
  server.kill();
}

console.log(failures.length ? `\n${failures.length} échec(s).` : '\nTout est vert.');
process.exit(failures.length ? 1 : 0);
