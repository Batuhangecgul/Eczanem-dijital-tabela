import { defineConfig } from 'vite';
import { resolve } from 'path';
import pharmacyScraper from './plugins/pharmacyScraper.js';

export default defineConfig({
  plugins: [
    // Pharmacy scraper middleware (dev only — Vercel uses api/pharmacies.js)
    pharmacyScraper(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nobetci: resolve(__dirname, 'nobetci.html'),
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
