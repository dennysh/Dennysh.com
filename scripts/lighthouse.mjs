// Presupuestos de rendimiento (AC-16): Lighthouse móvil ≥ 90 rendimiento, 100 accesibilidad, LCP ≤ 2000 ms (perfil móvil/4G simulado).
// Uso: npm run build && npm run test:lighthouse. Usa el Chromium de Playwright con depuración remota (`npx playwright install chromium`).
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import { chromium } from '@playwright/test'

const PORT = 4195
const BUDGET = { performance: 90, accessibility: 100, lcpMs: 2000 }

const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--outDir', 'dist', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], { stdio: ['ignore', 'inherit', 'inherit'] })
let last = ""
const until = async (url) => { for (let i = 0; i < 40; i++) { try { const r = await fetch(url); if (r.ok) return; last = `HTTP ${r.status}` } catch (e) { last = String(e.cause?.message ?? e.message) } await new Promise((r) => setTimeout(r, 500)) } throw new Error(`servidor de vista previa no arrancó (${last})`) }

let failed = false
try {
  await until(`http://127.0.0.1:${PORT}/en/`)
  const DEBUG_PORT = 9333
  const browser = await chromium.launch({ args: [`--remote-debugging-port=${DEBUG_PORT}`] })
  for (const path of ['/en/', '/es/']) {
    const { lhr } = await lighthouse(`http://127.0.0.1:${PORT}${path}`, { port: DEBUG_PORT, onlyCategories: ['performance', 'accessibility'], formFactor: 'mobile', logLevel: 'error' })
    const perf = Math.round(lhr.categories.performance.score * 100)
    const a11y = Math.round(lhr.categories.accessibility.score * 100)
    const lcp = Math.round(lhr.audits['largest-contentful-paint'].numericValue)
    const ok = perf >= BUDGET.performance && a11y >= BUDGET.accessibility && lcp <= BUDGET.lcpMs
    console.log(`${ok ? 'OK ' : 'FALLA'} ${path} rendimiento ${perf} (≥${BUDGET.performance}) · accesibilidad ${a11y} (=${BUDGET.accessibility}) · LCP ${lcp} ms (≤${BUDGET.lcpMs})`)
    if (!ok) failed = true
  }
  await browser.close()
} finally {
  server.kill()
}
process.exit(failed ? 1 : 0)
