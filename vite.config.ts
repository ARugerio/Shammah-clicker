import { defineConfig } from 'vite';

export default defineConfig({
  base: '/Shammah-clicker-studio/',
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
  },
  optimizeDeps: {
    exclude: ['manifold-3d'],
  },
});
