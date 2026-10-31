import { test, expect } from '@playwright/test'
import { stubTurnstile } from './helpers.js'

// Pila real: Pages Functions + D1 local + verificación real de Turnstile con su clave de prueba.
// Telegram recibe un token inválido de prueba, así que el envío FALLA de verdad y la demo debe decirlo (AC-21).
test.use({ locale: 'en-US', timezoneId: 'America/Guayaquil' })

async function runAndShow(page, id = 'run') {
  await page.getByTestId(id).click()
  await page.getByTestId('show-all').click()
  await expect(page.getByTestId('stage-oversight')).toBeVisible()
}

test('flujo completo: tres escenarios, tope, Anular, Escalar y fallo de Telegram (AC-03..AC-09, AC-21, AC-27)', async ({ page, request }) => {
  await stubTurnstile(page)
  await page.goto('/en/demo/')

  // 1.ª ejecución: gasta el cupo del visitante; el envío a Telegram falla y se dice.
  await runAndShow(page)
  const alert = page.getByTestId('alert')
  // Telegram rechaza el token de prueba ("Not delivered") o tarda más de 4 s desde esta red ("Not confirmed"): las dos son no-entregas honestas.
  await expect(alert).toContainText(/Not delivered|Not confirmed \(timed out\)/)
  await expect(alert).not.toContainText('Delivered to Telegram')
  await expect(page.getByTestId('decision')).toContainText(/BLOCK|LIMIT|ALERT/)

  // Los tres escenarios dan tres decisiones distintas, con regla y versión visibles (AC-04).
  const seen = {}
  for (const [chip, word, rule] of [['A', 'LIMIT', 'R-02'], ['B', 'BLOCK', 'R-01'], ['C', 'ALERT', 'R-03']]) {
    await page.getByTestId(`chip-${chip}`).click()
    await page.getByTestId('show-all').click()
    await expect(page.getByTestId('stage-oversight')).toBeVisible()
    await expect(page.getByTestId('decision')).toContainText(word)
    await expect(page.getByTestId('explanation')).toContainText(rule)
    await expect(page.getByTestId('explanation')).toContainText('sha256:')
    seen[chip] = await page.getByTestId('decision').innerText()
    // Tope por visitante (AC-07): ya se usó el cupo, así que se agrupa y la simulación sigue completa. Como el envío falló, no hay hora de «última alerta entregada».
    await expect(page.getByTestId('alert')).toContainText('Grouped to avoid noise (no recent delivered alert)')
  }
  expect(new Set(Object.values(seen)).size).toBe(3)

  // Supervisión humana (AC-09, AC-26): hasta 3 acciones, todas en la pista.
  await page.getByTestId('act-override').click()
  await expect(page.getByTestId('effective')).toContainText('Overridden by a person')
  await page.getByTestId('act-escalate').click()
  await expect(page.getByTestId('alert')).toContainText('No message to update')
  await page.getByTestId('act-approve').click()
  await expect(page.getByTestId('effective')).toContainText('Approved by a person')
  await expect(page.getByTestId('audit')).toContainText('Override')
  await expect(page.getByTestId('audit').locator('ol li')).toHaveCount(3)
  for (const id of ['approve', 'override', 'escalate']) await expect(page.getByTestId(`act-${id}`)).toBeDisabled()
  await expect(page.getByTestId('remaining')).toContainText('maximum of 3')

  // La cuarta acción tampoco entra por la API (409), aunque se fuerce.
  const eventId = await page.evaluate(() => sessionStorage.getItem('demo-event-id'))
  const res = await request.post('/api/intervene', { data: { eventId, action: 'approve' } })
  expect(res.status()).toBe(409)
  expect(await res.json()).toEqual({ code: 'E_LIMIT' })

  // Recarga: la auditoría vuelve con las 3 intervenciones (AC-25).
  await page.reload()
  await expect(page.getByTestId('audit').locator('ol li')).toHaveCount(3)
})

test('un eventId falsificado o inexistente da 404 uniforme (AC-25)', async ({ request }) => {
  for (const id of ['x', 'a'.repeat(32) + '.' + 'b'.repeat(32), '..%2f..%2fetc']) {
    const r = await request.get(`/api/event/${id}`)
    expect(r.status()).toBe(404)
    expect(await r.json()).toEqual({ code: 'E_NOT_FOUND' })
  }
})

test('entradas inválidas y cabeceras de la API real (AC-12, AC-13)', async ({ request }) => {
  const bad = await request.post('/api/simulate', { data: { lang: 'fr', turnstileToken: 't' } })
  expect(bad.status()).toBe(400)
  expect(await bad.json()).toEqual({ code: 'E_INPUT' })
  const extra = await request.post('/api/simulate', { data: { lang: 'es', turnstileToken: 't', decision: 'Allow' } })
  expect(extra.status()).toBe(400)
  const get = await request.get('/api/simulate')
  expect(get.status()).toBe(405)
  for (const r of [bad, extra, get]) {
    const h = r.headers()
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
    expect(h['x-content-type-options']).toBe('nosniff')
    expect(h['cache-control']).toBe('no-store')
    expect(h['set-cookie']).toBeUndefined()
  }
})
