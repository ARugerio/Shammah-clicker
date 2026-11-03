import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Shammah-clicker-studio/',
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173'),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
