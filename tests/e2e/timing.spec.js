import { test, expect } from '@playwright/test'
import { fixtureAudit, mockApi, stubTurnstile } from './helpers.js'

test.use({ timezoneId: 'America/Guayaquil', locale: 'es-EC' })

async function setup(page) {
  const audit = await fixtureAudit()
  const after = { ...audit, interventions: [{ seq: 1, action: 'approve', atUtc: '2026-10-29T07:41:40.000Z', actor: 'visitor-demo' }], effectiveState: 'Approved' }
  await stubTurnstile(page)
  await mockApi(page, {
    'POST /api/simulate': () => ({ body: { eventId: audit.eventId, audit } }),
    'POST /api/intervene': () => ({ body: { audit: after } }),
  })
  await page.addInitScript(() => {
    window.__live = []
    new MutationObserver(() => {
      const el = document.querySelector('[data-testid=live]')
      const t = el?.textContent?.trim()
      if (t && window.__live[window.__live.length - 1] !== t) window.__live.push(t)
    }).observe(document, { subtree: true, childList: true, characterData: true })
  })
  await page.goto('/es/')
}

test('la reproducción completa cabe en 30 s y se anuncian solo 4 cambios (AC-03, AC-30)', async ({ page }) => {
  await setup(page)
  const t0 = Date.now()
  await page.getByTestId('run').click()
  await expect(page.getByTestId('stage-oversight')).toBeVisible({ timeout: 30_000 })
  expect(Date.now() - t0).toBeLessThanOrEqual(30_000)
  await page.getByTestId('act-approve').click()
  await expect(page.getByTestId('effective')).toContainText('Aprobado')
  const live = await page.evaluate(() => window.__live)
  expect(live).toHaveLength(4)
  expect(live[0]).toBe('Evento recibido')
  expect(live[1]).toBe('Decisión: LIMITAR')
  expect(live[2]).toMatch(/^Estado de la alerta: Entregada a Telegram/)
  expect(live[3]).toBe('Intervención registrada')
})

test('"Mostrar todo" revela todo en ≤ 2,5 s', async ({ page }) => {
  await setup(page)
  await page.getByTestId('run').click()
  await expect(page.getByTestId('show-all')).toBeVisible()
  const t0 = Date.now()
  await page.getByTestId('show-all').click()
  await expect(page.getByTestId('stage-oversight')).toBeVisible({ timeout: 2500 })
  expect(Date.now() - t0).toBeLessThanOrEqual(2500)
})

test('la cronología respeta el guion: evento ~1 s, decisión ~6 s, alerta ~22 s', async ({ page }) => {
  await setup(page)
  const t0 = Date.now()
  await page.getByTestId('run').click()
  const at = async (id) => { await expect(page.getByTestId(id)).toBeVisible({ timeout: 30_000 }); return Date.now() - t0 }
  const event = await at('stage-event')
  const decision = await at('stage-decision')
  const alert = await at('stage-alert')
  expect(event).toBeGreaterThanOrEqual(900); expect(event).toBeLessThan(2500)
  expect(decision).toBeGreaterThanOrEqual(5800); expect(decision).toBeLessThan(7500)
  expect(alert).toBeGreaterThanOrEqual(21_800); expect(alert).toBeLessThan(24_000)
})
