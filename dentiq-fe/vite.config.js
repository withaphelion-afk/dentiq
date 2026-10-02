import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
  build: { chunkSizeWarningLimit: 700 }, // three.js is lazy-loaded for the splash only
})
