import { test, expect } from '@playwright/test'
import { stubTurnstile } from './helpers.js'

const ORIGIN = 'http://localhost:8788'
const PAGES = ['/es/', '/en/', '/es/codigo/', '/en/projects/', '/es/contacto/', '/en/privacy/']

// La demo salió del sitio: lo que queda es la portada, las páginas y el formulario de contacto (que solo consulta GET /api/contact).
test('solo salen peticiones a estáticos, Turnstile y GET /api/contact; sin cookies ni violaciones de CSP (AC-17, S9)', async ({ page, context }) => {
  const requests = []
  const responses = []
  const consoleErrors = []
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }))
  page.on('response', async (r) => responses.push({ url: r.url(), headers: await r.allHeaders() }))
  page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) consoleErrors.push(m.text()) })

  await page.emulateMedia({ reducedMotion: 'reduce' }) // los nodos flotan; Playwright espera que estén quietos para señalarlos
  await stubTurnstile(page) // sin red hacia Cloudflare: el script de Turnstile se sustituye
  for (const p of PAGES) await page.goto(p)
  await page.goto('/es/')
  await page.locator('.first[data-js]').waitFor()
  await page.getByRole('link', { name: 'Código', exact: true }).hover()

  const allowedHosts = [ORIGIN, 'https://challenges.cloudflare.com']
  for (const r of requests) expect(allowedHosts.some((h) => r.url.startsWith(h)), r.url).toBe(true)
  for (const r of requests.filter((x) => x.url.startsWith(`${ORIGIN}/api/`))) {
    expect(r.method, r.url).toBe('GET')
    expect(r.url).toBe(`${ORIGIN}/api/contact`)
  }
  expect(requests.some((r) => /\/demo\//.test(r.url))).toBe(false)
  for (const res of responses) expect(res.headers['set-cookie'], res.url).toBeUndefined()
  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(() => document.cookie)).toBe('')
  expect(consoleErrors).toEqual([])
})

test('el navegador no guarda nada del sitio: ni localStorage ni sessionStorage (la demo ya no guarda el eventId)', async ({ page }) => {
  await stubTurnstile(page)
  for (const p of ['/en/', '/es/contacto/']) {
    await page.goto(p)
    const store = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))
    expect(store.session, p).toEqual([])
    expect(store.local.filter((k) => !/theme/i.test(k)), p).toEqual([]) // la preferencia de tema es lo único que puede quedar
  }
})
