import { defineConfig } from 'vite';
import { buildIndex, DATA_DIR } from './tools/content-load.mjs';

// Module virtuel `virtual:content-index` : index léger de tous les contenus, calculé au build
// depuis src/data/**/*.json. Les fiches complètes restent des JSON chargés un par un.
function contentIndex() {
  const ID = 'virtual:content-index';
  const RESOLVED = '\0' + ID;
  return {
    name: 'content-index',
    resolveId: (id) => (id === ID ? RESOLVED : null),
    load(id) {
      if (id !== RESOLVED) return null;
      return `export default ${JSON.stringify(buildIndex())};`;
    },
    configureServer(server) {
      // En développement, toute modification d'un JSON de contenu recalcule l'index.
      server.watcher.on('change', (file) => {
        if (!file.startsWith(DATA_DIR)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED);
        if (mod) server.reloadModule(mod);
      });
    },
  };
}

// Site 100 % statique. `base: '/'` : les URLs propres (/personnages/arya-stark) exigent des
// chemins absolus ; vercel.json renvoie toutes les routes vers index.html.
export default defineConfig({
  base: '/',
  plugins: [contentIndex()],
  build: {
    outDir: 'dist',
    // Three.js pèse ~150 Ko gzip à lui seul : il vit dans le bloc « world » chargé à part.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      // lab.html reste hors du build final : seule index.html est une entrée.
      input: 'index.html',
    },
  },
  worker: { format: 'es' },
  server: { port: 5173 },
  preview: { port: 4173 },
});
