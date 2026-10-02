import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Each build gets an id; the app compares it with /version.json to auto-update installed copies
const buildId = Date.now().toString(36)
const versionFile = {
  name: 'version-file',
  generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: buildId }) }) },
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile],
  define: { 'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId) },
  server: { proxy: { '/api': 'http://localhost:4000' } },
})
