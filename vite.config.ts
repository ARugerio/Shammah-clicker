import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Shammah-clicker-studio/',
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
