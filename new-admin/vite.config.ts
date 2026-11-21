import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the admin SPA runs on :5173 and proxies data calls to the API on :8787.
export default defineConfig({
  root: 'web',
  publicDir: '../../public',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8787',
      '/media': 'http://localhost:8787'
    }
  }
});
