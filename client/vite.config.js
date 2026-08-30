import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 'hidden' emits .map files for Sentry to consume without adding a
    // //# sourceMappingURL comment to the shipped JS — so devtools on a
    // packaged build can't pull the map, but CI can still upload it.
    sourcemap: 'hidden',
  },
});
