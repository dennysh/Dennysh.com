import { defineConfig, devices } from '@playwright/test'

// Dos servidores: vista previa estática (la API se simula en la prueba) y `wrangler pages dev` con la pila real
// (Functions + D1 local + verificación real de Turnstile con su clave de prueba). Todo lo "secreto" aquí es de prueba.
const STATE = '.wrangler/e2e-state'
const BIND = [
  'TURNSTILE_SECRET=1x0000000000000000000000000000000AA',
  'VISITOR_HMAC_KEY=e2e-visitor-key-000000000000000000',
  'EVENT_HMAC_KEY=e2e-event-key-00000000000000000000',
  'ALERTS_ENABLED=true',
  'TELEGRAM_BOT_TOKEN=000000000:e2e-token-invalido-no-existe-000000000',
  'TELEGRAM_CHAT_ID=1234567867',
  'TURNSTILE_HOSTS=localhost',
].map((b) => `--binding ${b}`).join(' ')

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: { ...devices['Desktop Chrome'], trace: 'off' },
  projects: [
    { name: 'mocked', testIgnore: /(full-flow|privacy)\.spec\.js/, use: { baseURL: 'http://localhost:4173' } },
    { name: 'real', testMatch: /(full-flow|privacy)\.spec\.js/, use: { baseURL: 'http://localhost:8788' } },
  ],
  webServer: [
    { command: 'npx vite preview --outDir dist-e2e --port 4173 --strictPort', url: 'http://localhost:4173/en/', reuseExistingServer: true, timeout: 60_000 },
    { command: `sh -c "rm -rf ${STATE} && npx wrangler d1 migrations apply dennysh-demo --local --persist-to ${STATE} > /dev/null && npx wrangler pages dev dist-e2e --port 8788 --persist-to ${STATE} --log-level warn ${BIND}"`, url: 'http://localhost:8788/en/', reuseExistingServer: true, timeout: 120_000 },
  ],
})
