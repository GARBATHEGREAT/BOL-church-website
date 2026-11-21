import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the admin runs on :5173/admin/ and proxies data calls to the API on :8787.
// Build: output goes to dist/ with files under /admin/ (the site's own /assets/ is left alone).
export default defineConfig(({ command }) => ({
  root: 'web',
  base: '/admin/',
  // In dev, also serve the website's static files (public/) so home.html can be tested against the local API.
  publicDir: command === 'serve' ? '../../public' : false,
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true, assetsDir: 'admin-assets' },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/media': 'http://localhost:8787'
    }
  }
}));
