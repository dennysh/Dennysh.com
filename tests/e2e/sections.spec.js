import { test, expect } from '@playwright/test'

const IDS = ['inicio', 'demo', 'factory', 'governance', 'work', 'skills', 'journey', 'criden', 'contact', 'footer']

for (const lang of ['en', 'es']) {
  test(`${lang}: las 10 secciones existen con ancla y el idioma del documento es correcto`, async ({ page }) => {
    await page.goto(`/${lang}/`)
    for (const id of IDS) await expect(page.locator(`#${id}`)).toHaveCount(1)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('h1')).toHaveCount(1)
  })
}

test('con viewport 360×640 el Hero muestra tesis, resumen y botón de la demo sin desplazarse (AC-01)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  for (const loc of [page.locator('h1'), page.locator('#summary'), page.locator('.cta').getByRole('link', { name: 'Try the demo' })]) {
    await expect(loc).toBeInViewport({ ratio: 1 })
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('no hay desplazamiento horizontal en móvil en ninguna página', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  for (const p of ['/en/', '/es/', '/en/privacy/', '/es/terminos/', '/en/projects/', '/es/trayectoria/', '/en/demo/']) {
    await page.goto(p)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), p).toBe(true)
  }
})

test('el cambio de idioma lleva a la otra versión', async ({ page }) => {
  await page.goto('/en/')
  await page.getByRole('navigation').getByRole('link', { name: 'ES' }).click()
  await expect(page).toHaveURL(/\/es\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})

test('con JavaScript desactivado el contenido y el ejemplo estático son legibles (AC-02)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4173/en/')
  await expect(page.locator('h1')).toContainText('I build AI systems that explain themselves')
  await expect(page.locator('#summary li')).toHaveCount(5)
  await page.goto('http://localhost:4173/en/demo/') // la demo vive en su propia página (D-H1); sin JS muestra el ejemplo estático
  await expect(page.getByTestId('static-example')).toContainText('not a real send')
  await ctx.close()
})

test('axe: la página completa en inglés y español sin violaciones', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  for (const p of ['/en/', '/es/', '/en/privacy/', '/en/projects/', '/es/trayectoria/', '/en/journey/', '/es/demo/']) {
    await page.goto(p)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(r.violations.map((v) => `${p} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  }
})
