import { test, expect } from '@playwright/test'
import { fixtureAudit, mockApi, stubTurnstile } from './helpers.js'

test.use({ timezoneId: 'America/Guayaquil', locale: 'es-EC' })
const KEY = 'demo-event-id'

test('una recarga restaura la auditoría desde sessionStorage (AC-25)', async ({ page }) => {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  const calls = await mockApi(page, {
    'POST /api/simulate': () => ({ body: { eventId: audit.eventId, audit } }),
    'GET /api/event/:id': () => ({ body: { audit } }),
  })
  await page.goto('/es/demo/')
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBe(audit.eventId)
  await page.reload()
  await expect(page.getByTestId('stage-audit')).toBeVisible()
  await expect(page.getByTestId('stage-oversight')).toBeVisible()
  expect(calls.some((c) => c.method === 'GET' && c.path.startsWith('/api/event/'))).toBe(true)
  expect(await page.evaluate(() => document.cookie)).toBe('')
})

test('un registro caducado muestra "El registro expiró" y deja volver a simular', async ({ page }) => {
  await stubTurnstile(page)
  await mockApi(page, { 'GET /api/event/:id': () => ({ status: 404, body: { code: 'E_NOT_FOUND' } }) })
  await page.addInitScript(([k]) => sessionStorage.setItem(k, 'viejo.id'), [KEY])
  await page.goto('/es/demo/')
  await expect(page.getByTestId('error')).toContainText('El registro expiró')
  await expect(page.getByTestId('run')).toBeEnabled()
  expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBeNull()
})

test('Turnstile bloqueado: mensaje claro y ejemplo estático etiquetado, el botón no falla en silencio (AC-28)', async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/**', (r) => r.abort())
  const calls = await mockApi(page, {})
  await page.goto('/es/demo/')
  await page.getByTestId('run').click()
  await expect(page.getByTestId('error')).toContainText('verificación anti-bot')
  await expect(page.getByTestId('static-example')).toContainText('no es un envío real')
  await expect(page.getByTestId('static-example')).not.toContainText('Entregada')
  expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0)
  await expect(page.getByTestId('run')).toBeEnabled()
})

test('los chips envían el escenario elegido', async ({ page }) => {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  const calls = await mockApi(page, { 'POST /api/simulate': () => ({ body: { eventId: audit.eventId, audit } }) })
  await page.goto('/es/demo/')
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  await page.getByTestId('chip-B').click()
  await expect.poll(() => calls.filter((c) => c.method === 'POST').length).toBe(2)
  expect(JSON.parse(calls.filter((c) => c.method === 'POST')[1].body).scenario).toBe('B')
  expect(JSON.parse(calls.filter((c) => c.method === 'POST')[0].body).scenario).toBeUndefined()
})

for (const [status, code, text] of [[403, 'E_BOT', 'No pudimos verificar'], [503, 'E_INTERNAL', 'no está disponible por ahora']]) {
  test(`HTTP ${status} muestra el mensaje correcto`, async ({ page }) => {
    await stubTurnstile(page)
    await mockApi(page, { 'POST /api/simulate': () => ({ status, body: { code } }) })
    await page.goto('/es/demo/')
    await page.getByTestId('run').click()
    await expect(page.getByTestId('error')).toContainText(text)
  })
}

test('doble clic: solo se crea un evento', async ({ page }) => {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  const calls = await mockApi(page, { 'POST /api/simulate': async () => { await new Promise((r) => setTimeout(r, 400)); return { body: { eventId: audit.eventId, audit } } } })
  await page.goto('/es/demo/')
  await page.getByTestId('run').dblclick()
  await page.waitForTimeout(800)
  expect(calls.filter((c) => c.method === 'POST')).toHaveLength(1)
})

test('inglés: el botón y los avisos salen en inglés', async ({ page }) => {
  await stubTurnstile(page)
  await mockApi(page, { 'POST /api/simulate': () => ({ status: 503, body: { code: 'E_INTERNAL' } }) })
  await page.goto('/en/demo/')
  await expect(page.getByTestId('run')).toHaveText('Simulate anomalous access')
  await page.getByTestId('run').click()
  await expect(page.getByTestId('error')).toContainText('unavailable right now')
})

test('el enlace del mensaje (?evento=…) abre la auditoría en solo lectura, sin sessionStorage (spec §5.8)', async ({ page }) => {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  const calls = await mockApi(page, { 'GET /api/event/:id': () => ({ body: { audit } }) })
  await page.goto(`/es/demo/?evento=${audit.eventId}`)
  await expect(page.getByTestId('stage-audit')).toBeVisible()
  await expect(page.getByTestId('readonly')).toContainText('solo lectura')
  await expect(page.getByTestId('stage-oversight')).toHaveCount(0)
  expect(calls.some((c) => c.path === `/api/event/${audit.eventId}`)).toBe(true)
  expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBeNull()
  await expect(page.getByTestId('run')).toBeEnabled()
})

test('un enlace de un evento caducado muestra "El registro expiró"', async ({ page }) => {
  await stubTurnstile(page)
  await mockApi(page, { 'GET /api/event/:id': () => ({ status: 404, body: { code: 'E_NOT_FOUND' } }) })
  await page.goto('/es/demo/?evento=ab.cd')
  await expect(page.getByTestId('error')).toContainText('El registro expiró')
})

test('"Empezar de nuevo" olvida el evento guardado: una recarga no lo restaura', async ({ page }) => {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  await mockApi(page, { 'POST /api/simulate': () => ({ body: { eventId: audit.eventId, audit } }), 'GET /api/event/:id': () => ({ body: { audit } }) })
  await page.goto('/es/demo/')
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  await page.getByTestId('reset').click()
  expect(await page.evaluate((k) => sessionStorage.getItem(k), KEY)).toBeNull()
  await page.reload()
  await expect(page.getByTestId('stage-audit')).toHaveCount(0)
})
