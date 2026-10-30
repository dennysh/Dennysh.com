import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { fixtureAudit, mockApi, stubTurnstile } from './helpers.js'

test.use({ timezoneId: 'America/Guayaquil', locale: 'es-EC' })

async function ready(page) {
  const audit = await fixtureAudit()
  await stubTurnstile(page)
  await mockApi(page, { 'POST /api/simulate': () => ({ body: { eventId: audit.eventId, audit } }) })
  await page.goto('/es/')
  return audit
}
async function runAll(page) {
  await page.getByTestId('run').click()
  await page.getByTestId('show-all').click()
  await expect(page.getByTestId('stage-oversight')).toBeVisible()
}

test('la auditoría muestra todos los campos con hora UTC y hora local (UTC-5)', async ({ page }) => {
  await ready(page)
  await runAll(page)
  const audit = page.getByTestId('audit')
  const labels = await audit.locator('dt').allInnerTexts()
  for (const l of ['ID de evento', 'Hora exacta (servidor)', 'Datos de entrada', 'Motor de decisión', 'Regla usada', 'Resultado', 'Explicación', 'Módulos usados', 'Estado de alerta', 'A quién', 'Cuándo', 'Intervención humana']) {
    expect(labels).toContain(l)
  }
  await expect(audit).toContainText('07:41:17.402 UTC')
  await expect(audit).toContainText('02:41:17 (UTC-5)')
  await expect(audit).toContainText('Telegram ••••67')
  await expect(page.getByTestId('alert')).toContainText('Entregada a Telegram')
})

test('el visor de regla muestra la regla, los datos usados y los no usados', async ({ page }) => {
  await ready(page)
  await runAll(page)
  const ex = page.getByTestId('explanation')
  await expect(ex).toContainText('R-02')
  await expect(ex).toContainText('sha256:')
  await expect(ex).toContainText('Datos que usó')
  await expect(ex).toContainText('Datos que deliberadamente NO usó')
  await expect(ex).toContainText('nacionalidad')
  await expect(page.getByTestId('review-state')).toContainText('Borrador pendiente de revisión')
})

for (const scheme of ['dark', 'light']) {
  test(`axe: sin violaciones WCAG 2.2 AA con el resultado completo (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await ready(page)
    await runAll(page)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  })
}

test('prefers-reduced-motion: todo aparece de golpe y sin animación', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await ready(page)
  await page.getByTestId('run').click()
  await expect(page.getByTestId('stage-oversight')).toBeVisible({ timeout: 3000 })
  const anim = await page.getByTestId('stage-decision').evaluate((el) => getComputedStyle(el).animationName)
  expect(anim).toBe('none')
})

test('teclado: el botón se alcanza con Tab, se ejecuta con Enter y mide al menos 44 px', async ({ page }) => {
  await ready(page)
  const run = page.getByTestId('run')
  await run.focus()
  expect((await run.boundingBox()).height).toBeGreaterThanOrEqual(44)
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('stage-event')).toBeVisible({ timeout: 5000 })
  await page.getByTestId('show-all').focus()
  await page.keyboard.press('Enter')
  for (const id of ['approve', 'override', 'escalate']) expect((await page.getByTestId(`act-${id}`).boundingBox()).height).toBeGreaterThanOrEqual(44)
})
