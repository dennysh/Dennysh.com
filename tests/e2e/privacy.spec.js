import { test, expect } from '@playwright/test'
import { stubTurnstile } from './helpers.js'

const ORIGIN = 'http://localhost:8788'

test('solo salen peticiones a estáticos, Turnstile y /api con el cuerpo permitido; sin cookies ni violaciones de CSP (AC-17, S9)', async ({ page, context }) => {
  const requests = []
  const responses = []
  const consoleErrors = []
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }))
  page.on('response', async (r) => responses.push({ url: r.url(), headers: await r.allHeaders() }))
  page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) consoleErrors.push(m.text()) })
  await stubTurnstile(page)

  await page.goto('/es/')
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  await page.getByTestId('act-approve').click()
  await expect(page.getByTestId('effective')).toContainText('Aprobado')

  const allowedHosts = [ORIGIN, 'https://challenges.cloudflare.com']
  for (const r of requests) expect(allowedHosts.some((h) => r.url.startsWith(h)), r.url).toBe(true)

  const api = requests.filter((r) => r.url.startsWith(`${ORIGIN}/api/`))
  expect(api.length).toBeGreaterThan(0)
  for (const r of api.filter((x) => x.method === 'POST')) {
    const keys = Object.keys(JSON.parse(r.body))
    const allowed = r.url.endsWith('/simulate') ? ['lang', 'scenario', 'turnstileToken'] : ['eventId', 'action']
    for (const k of keys) expect(allowed, `${r.url} campo ${k}`).toContain(k)
  }
  for (const res of responses) expect(res.headers['set-cookie'], res.url).toBeUndefined()
  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(() => document.cookie)).toBe('')
  expect(consoleErrors).toEqual([])
})

test('lo único guardado en el navegador es el eventId en sessionStorage (sin localStorage)', async ({ page }) => {
  await stubTurnstile(page)
  await page.goto('/en/')
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  const store = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }))
  expect(store.local).toEqual([])
  expect(store.session).toEqual(['demo-event-id'])
})
