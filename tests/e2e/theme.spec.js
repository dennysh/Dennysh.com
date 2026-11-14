import { test, expect } from '@playwright/test'
import { setStoredTheme } from './helpers.js'

// Tema oscuro por defecto (2026-11-14): todo visitante nuevo abre en oscuro, sin importar el tema de su sistema. El interruptor cambia el tema,
// la elección se guarda y se aplica antes de pintar. Quien eligió claro conserva su elección.
const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)
const toggle = (page) => page.locator('.theme-toggle').first()
const themeColor = (page) => page.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content')))
const DARK = 'rgb(21, 19, 15)'
const LIGHT = 'rgb(246, 243, 238)'

for (const system of ['light', 'dark']) {
  test.describe(`visitante nuevo, sin preferencia guardada, con el sistema en ${system}`, () => {
    test.use({ colorScheme: system })
    test('abre en oscuro (fondo negro), sin guardar nada, con el botón pulsado y la barra del navegador oscura', async ({ page }) => {
      await page.goto('/es/')
      expect(await bg(page)).toBe(DARK)
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
      expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBeUndefined()
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBeNull()
      expect(await themeColor(page)).toEqual(['#15130f'])
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe('dark')
    })
    test('el clic pasa a claro, lo guarda y sobrevive a la recarga y a otra página; otro clic vuelve a oscuro', async ({ page }) => {
      await page.goto('/es/')
      await toggle(page).click()
      expect(await bg(page)).toBe(LIGHT)
      await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light')
      expect(await themeColor(page)).toEqual(['#f6f3ee'])
      await page.reload()
      expect(await bg(page)).toBe(LIGHT)
      await page.goto('/es/proyectos/')
      expect(await bg(page)).toBe(LIGHT)
      await toggle(page).click()
      expect(await bg(page)).toBe(DARK)
      expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
    })
  })
}

test.describe('con el sistema en claro y sin preferencia guardada el sitio abre oscuro; con preferencia "claro" guardada, abre claro', () => {
  test.use({ colorScheme: 'light' })
  test('sin preferencia: oscuro en inicio, páginas interiores, legales y 404', async ({ page }) => {
    for (const p of ['/en/', '/es/', '/en/journey/', '/es/contacto/', '/es/privacidad/', '/en/terms/']) {
      await page.goto(p)
      expect(await bg(page), p).toBe(DARK)
    }
    await page.goto('/404.html') // la página que Cloudflare Pages sirve para una ruta que no existe
    expect(await bg(page)).toBe(DARK)
    expect(await themeColor(page)).toEqual(['#15130f'])
  })
  test('con "light" guardado abre claro en todas partes, también legales y 404, y la barra del navegador pasa a claro', async ({ page }) => {
    await setStoredTheme(page, 'light')
    for (const p of ['/en/', '/es/', '/es/trayectoria/', '/es/privacidad/', '/404.html']) {
      await page.goto(p)
      expect(await bg(page), p).toBe(LIGHT)
      expect(await themeColor(page), p).toEqual(['#f6f3ee'])
    }
    await page.goto('/es/')
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false')
  })
  test('con "dark" guardado abre oscuro', async ({ page }) => {
    await setStoredTheme(page, 'dark')
    await page.goto('/en/')
    expect(await bg(page)).toBe(DARK)
  })
  test('sin parpadeo: al terminar de interpretarse el documento (antes de hidratar) el tema ya es el definitivo', async ({ page }) => {
    // Claro guardado: data-theme="light" ya está puesto y el fondo ya es claro (nunca se pinta oscuro primero).
    await setStoredTheme(page, 'light')
    await page.addInitScript(() => {
      window.__atParse = null
      document.addEventListener('DOMContentLoaded', () => { window.__atParse = { theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor } })
    })
    await page.goto('/en/journey/')
    expect(await page.evaluate(() => window.__atParse)).toEqual({ theme: 'light', bg: LIGHT })
  })
  test('sin parpadeo por defecto: el fondo ya es oscuro al interpretarse el documento, sin ningún atributo ni script que lo ponga', async ({ page }) => {
    await page.addInitScript(() => {
      window.__atParse = null
      document.addEventListener('DOMContentLoaded', () => { window.__atParse = { theme: document.documentElement.dataset.theme ?? null, bg: getComputedStyle(document.body).backgroundColor } })
    })
    await page.goto('/en/')
    expect(await page.evaluate(() => window.__atParse)).toEqual({ theme: null, bg: DARK })
  })
  test('con el almacenamiento bloqueado la página abre oscura y el botón sigue cambiando el tema de la visita', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('SecurityError') } }) })
    await page.goto('/en/')
    expect(await bg(page)).toBe(DARK)
    await toggle(page).click()
    expect(await bg(page)).toBe(LIGHT)
  })
  test('un valor guardado inválido se ignora y abre oscuro', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'rojo'))
    await page.goto('/en/')
    expect(await bg(page)).toBe(DARK)
  })
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false, colorScheme: 'light' })
  test('el oscuro manda aunque el sistema sea claro y el botón sale pulsado, sin ningún script que lo ponga', async ({ page }) => {
    await page.goto('/en/')
    expect(await bg(page)).toBe(DARK)
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true')
  })
})

// El texto, los nodos, los paneles y los enlaces cumplen AA en los dos temas (axe mide el contraste donde puede; los pares de tokens y el
// peor punto del brillo están medidos en tests/unit/theme.test.js). El claro se pide como lo hace una persona: preferencia guardada.
for (const scheme of ['light', 'dark']) {
  test.describe(`axe en el tema ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })
    test.beforeEach(({ page }) => setStoredTheme(page, scheme))
    test('inicio con la vista previa abierta y páginas interiores sin violaciones (WCAG 2.2 AA)', async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright')
      await page.setViewportSize({ width: 1280, height: 800 })
      const run = async (p) => {
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${p} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      }
      await page.goto('/es/')
      await page.waitForSelector('.first[data-js]')
      expect(await bg(page)).toBe(scheme === 'light' ? LIGHT : DARK)
      await run('/es/')
      for (const name of ['Código', 'Cómo trabajo', 'Interés']) { await page.getByRole('link', { name, exact: true }).hover(); await run(`/es/ (${name})`) }
      for (const p of ['/en/code/', '/es/proyectos/', '/en/how-i-work/', '/es/contacto/', '/en/interest/', '/es/trayectoria/', '/es/privacidad/', '/en/terms/']) { await page.goto(p); await run(p) }
    })
  })
}

test('el retrato, el arco y las líneas siguen visibles en oscuro (el trazo del arco contrasta con el fondo)', async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: 'light', viewport: { width: 1280, height: 800 } }) // sistema claro: aun así es oscuro
  const page = await ctx.newPage()
  await page.goto('/en/')
  const c = await page.evaluate(() => ({ arc: getComputedStyle(document.querySelector('.arc')).stroke, bg: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color }))
  expect(c.bg).toBe(DARK)
  expect(c.arc).not.toBe(c.bg)
  expect(c.text).not.toBe(c.bg)
  await ctx.close()
})
