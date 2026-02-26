import { defineConfig } from 'vite';
import pharmacyScraper from './plugins/pharmacyScraper.js';

export default defineConfig({
  plugins: [
    // Pharmacy scraper middleware (dev only — Vercel uses api/pharmacies.js)
    pharmacyScraper(),
  ],
  server: {
    port: 3000,
    host: true,
  },
});
