import { test, expect } from '@playwright/test'

// Modo oscuro con interruptor (correcciones 1, C9): sigue al sistema, el clic fuerza un tema, se guarda y se aplica antes de pintar.
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const toggle = (page) => page.locator('.theme-toggle').first()
const DARK = 'rgb(21, 19, 15)'
const LIGHT = 'rgb(246, 243, 238)'

test.describe('sigue al sistema por defecto', () => {
  test.use({ colorScheme: 'dark' })
  test('con el sistema oscuro la página es oscura sin guardar nada y el botón lo refleja', async ({ page }) => {
    await page.goto('/es/')
    expect(await bg(page)).toBe(DARK)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined()
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull()
  })
  test('el clic fuerza claro, lo guarda y sobrevive a la recarga y a otra página', async ({ page }) => {
    await page.goto('/es/')
    await toggle(page).click()
    expect(await bg(page)).toBe(LIGHT)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light')
    await page.reload()
    expect(await bg(page)).toBe(LIGHT)
    await page.goto('/es/proyectos/')
    expect(await bg(page)).toBe(LIGHT)
  })
})

test.describe('sistema claro', () => {
  test.use({ colorScheme: 'light' })
  test('por defecto claro; el clic fuerza oscuro y la elección se aplica antes de pintar (sin parpadeo)', async ({ page }) => {
    await page.goto('/en/')
    expect(await bg(page)).toBe(LIGHT)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
    await toggle(page).click()
    expect(await bg(page)).toBe(DARK)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
    // La segunda visita: el atributo ya está puesto cuando el documento termina de interpretarse, antes de hidratar.
    await page.addInitScript(() => { window.__themeAtParse = null; document.addEventListener('DOMContentLoaded', () => { window.__themeAtParse = document.documentElement.dataset.theme }) })
    await page.goto('/en/journey/')
    expect(await page.evaluate(() => window.__themeAtParse)).toBe('dark')
    expect(await bg(page)).toBe(DARK)
  })
  test('con el almacenamiento bloqueado la página funciona y el botón sigue cambiando el tema de la visita', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError') } }) })
    await page.goto('/en/')
    await toggle(page).click()
    expect(await bg(page)).toBe(DARK)
  })
  test('un valor guardado inválido se ignora', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'rojo'))
    await page.goto('/en/')
    expect(await bg(page)).toBe(LIGHT)
  })
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'dark' })
  test('prefers-color-scheme sigue mandando y no hay interruptor roto', async ({ page }) => {
    await page.goto('/en/')
    expect(await bg(page)).toBe(DARK)
  })
})

// El texto, los nodos, los paneles y los enlaces cumplen AA en los dos temas (axe mide el contraste donde puede; los pares de tokens y el
// peor punto del brillo están medidos en tests/unit/theme.test.js).
for (const scheme of ['light', 'dark']) {
  test.describe(`axe en el tema ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })
    test('inicio con la vista previa abierta y páginas interiores sin violaciones (WCAG 2.2 AA)', async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright')
      await page.setViewportSize({ width: 1280, height: 800 })
      const run = async (p) => {
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${p} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      }
      await page.goto('/es/')
      await page.waitForSelector('.first[data-js]')
      await run('/es/')
      for (const name of ['Código', 'Cómo trabajo', 'Interés']) { await page.getByRole('link', { name, exact: true }).hover(); await run(`/es/ (${name})`) }
      for (const p of ['/en/code/', '/es/proyectos/', '/en/how-i-work/', '/es/contacto/', '/en/interest/', '/es/trayectoria/']) { await page.goto(p); await run(p) }
    })
  })
}

test('el retrato, el arco y las líneas siguen visibles en oscuro (el trazo del arco contrasta con el fondo)', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'dark', viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto('/en/')
  const c = await page.evaluate(() => ({ arc: getComputedStyle(document.querySelector('.arc')).stroke, bg: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color }))
  expect(c.arc).not.toBe(c.bg)
  expect(c.text).not.toBe(c.bg)
  await ctx.close()
})
