import { defineConfig } from 'vite';

// Site 100 % statique : chemins relatifs pour pouvoir héberger dist/ n'importe où.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      // lab.html (phases 1-2) reste hors du build final : seule index.html est une entrée.
      input: 'index.html',
    },
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
