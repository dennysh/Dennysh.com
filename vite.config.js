import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Las cabeceras de seguridad no se fijan aquí: viven en server/security-headers.js (fuente única) y salen
// en public/_headers (estáticos) y en el middleware de /api/*.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: { sourcemap: false, minify: 'esbuild' },
})
