import { test, expect } from '@playwright/test'

// Una página por nodo (correcciones 1, C2): el inicio es solo la primera pantalla y el resto vive en cada página, en los dos idiomas.
const PAGES = {
  en: { code: ['/en/code/', 'Code'], projects: ['/en/projects/', 'Work in production'], journey: ['/en/journey/', 'Journey'], how: ['/en/how-i-work/', 'How I work'], interest: ['/en/interest/', 'Interest'], contact: ['/en/contact/', 'Contact'] },
  es: { code: ['/es/codigo/', 'Código'], projects: ['/es/proyectos/', 'Trabajo en producción'], journey: ['/es/trayectoria/', 'Trayectoria'], how: ['/es/como-trabajo/', 'Cómo trabajo'], interest: ['/es/interes/', 'Interés'], contact: ['/es/contacto/', 'Contacto'] },
}
const ALL = Object.values(PAGES).flatMap((p) => Object.values(p).map(([path]) => path))

for (const lang of ['en', 'es']) {
  test(`${lang}: el inicio es una sola pantalla: solo #inicio, un h1 con la frase única, sin pie ni contacto`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`/${lang}/`)
    await expect(page.locator('#inicio')).toHaveCount(1)
    for (const id of ['demo', 'factory', 'governance', 'work', 'skills', 'journey', 'criden', 'contact', 'footer']) await expect(page.locator(`#${id}`), id).toHaveCount(0)
    await expect(page.locator('html')).toHaveAttribute('lang', lang)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('h1')).toHaveText(lang === 'es' ? 'Un poco de lo que hago, en pocos minutos.' : 'A little of what I do, in a few minutes.')
    await expect(page.locator('footer')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /contact|contacto|contactar/i })).toHaveCount(0)
    await expect(page.getByText('dennys@dennysh.com')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(800) // antes medía ≈5800 px
    await expect(page.locator('.cta, #summary')).toHaveCount(0)
  })
  for (const [view, [path, h1]] of Object.entries(PAGES[lang])) {
    test(`${path}: carga con su h1, idioma, canonical, barra, "Volver" y el pie con los contactos`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).toContainText(h1)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://dennysh.com${path}`)
      await expect(page.locator('header.topbar nav a')).toHaveCount(6)
      await expect(page.locator(`header.topbar nav a[aria-current="page"]`)).toHaveAttribute('href', path)
      await expect(page.locator('main a', { hasText: /home screen|primera pantalla/ })).toHaveAttribute('href', `/${lang}/`)
      await expect(page.locator('footer a[href="mailto:dennys@dennysh.com"]')).toHaveCount(1)
      await expect(page.locator('footer a[href*="linkedin.com"]')).toHaveCount(1)
      await expect(page.locator('footer a[href*="github.com/dennysh"]')).toHaveCount(1)
      await page.locator('header .langlink').click()
      await page.waitForURL(`**${PAGES[lang === 'en' ? 'es' : 'en'][view][0]}`)
    })
  }
}

test('Cómo trabajo trae las reglas para personas, las de máquinas (llms.txt) y la fábrica con su diagrama', async ({ page }) => {
  await page.goto('/en/how-i-work/')
  await expect(page.locator('ol.rules li')).toHaveCount(7)
  await expect(page.locator('pre.code-page')).toContainText('- Tests first, then code.')
  await expect(page.locator('svg.diagram')).toBeVisible()
  await expect(page.locator('.steps li')).toHaveCount(5)
})

test('Código trae el panel real y las capacidades; Agentes de IA acotado, sin bots autónomos ni aprendizaje profundo', async ({ page }) => {
  await page.goto('/es/codigo/')
  await expect(page.locator('pre.code-page')).toContainText('"id": "R-02"')
  await expect(page.locator('.tags li', { hasText: 'Chatbots con LLM' })).toHaveCount(1)
  await expect(page.locator('.tags li', { hasText: /^LLM$/ })).toHaveCount(1)
  await expect(page.locator('.skill-note')).toContainText('solo lectura')
  await expect(page.locator('main')).not.toContainText(/aut[oó]nomo|aprendizaje profundo|potencias/i)
})

test('Proyectos: Bots para Telegram (desplegable), Super Gol Kids y Criden en producción; nada de contable, Football Manager ni HARDLOCK', async ({ page }) => {
  await page.goto('/es/proyectos/')
  await expect(page.locator('.card')).toHaveCount(3)
  await expect(page.locator('.card h2')).toHaveText(['Bots para Telegram', 'Super Gol Kids', 'Criden'])
  await expect(page.locator('.card:not(.card-bots) .badge-production')).toHaveCount(2)
  await expect(page.locator('.card', { hasText: 'Criden' }).locator('a')).toHaveCount(0) // en producción, todavía sin enlace
  await expect(page.locator('main')).not.toContainText(/contable|football manager|f[uú]tbol manager|hardlock|pr[óo]ximamente/i)
})

test('Bots para Telegram: cerrado al cargar, se abre con Enter o Espacio y con clic, muestra los cuatro bots en orden y no mueve lo de arriba', async ({ page }) => {
  await page.goto('/es/proyectos/')
  const d = page.locator('details.bots')
  const items = d.locator('li strong')
  await expect(d).not.toHaveAttribute('open', '')
  await expect(items.first()).toBeHidden()
  const above = await page.locator('h1').boundingBox()
  await d.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(d).toHaveAttribute('open', '')
  await expect(items).toHaveText(['Bot de registro de cajas', 'Bot de caja más cercana', 'Bot de reportes', 'Bot de planificación'])
  await expect(d.locator('.badge-production')).toHaveCount(1) // solo Caja Cercana declara estado
  expect(await page.locator('h1').boundingBox()).toEqual(above)
  await page.keyboard.press('Space')
  await expect(d).not.toHaveAttribute('open', '')
  await d.locator('summary').click()
  await expect(items.first()).toBeVisible()
})

test('Bots para Telegram también se abre en el panel "Trabajo en producción" de la portada, y sin JavaScript', async ({ page, browser }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }) // los nodos flotan; Playwright espera que estén quietos
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/es/')
  await page.waitForSelector('.first[data-js]')
  await page.getByRole('link', { name: 'Proyectos', exact: true }).hover()
  const d = page.locator('#p-projects details.bots')
  await expect(d).toBeVisible()
  await d.locator('summary').click()
  await expect(d.locator('li strong')).toHaveText(['Bot de registro de cajas', 'Bot de caja más cercana', 'Bot de reportes', 'Bot de planificación'])
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })
  const p2 = await ctx.newPage()
  await p2.goto('http://localhost:4173/es/proyectos/')
  await p2.locator('details.bots summary').click() // <details> nativo: funciona sin JS
  await expect(p2.locator('details.bots li strong')).toHaveCount(4)
  await ctx.close()
})

test('Interés: solo el pensamiento cerebro–IA, sin deportes', async ({ page }) => {
  await page.goto('/en/interest/')
  await expect(page.locator('main')).toContainText('connect the brain to AI')
  await expect(page.locator('main')).not.toContainText(/jiu|triathlon|obstacle|sport/i)
})

test('con viewport 360×640 el inicio muestra frase, nodos y retrato sin desplazarse (AC-01)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  for (const loc of [page.locator('h1'), page.locator('.nodes'), page.locator('.portrait')]) await expect(loc).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('no hay desplazamiento horizontal en móvil en ninguna página', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  for (const p of ['/en/', '/es/', '/en/privacy/', '/es/terminos/', ...ALL]) {
    await page.goto(p)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), p).toBe(true)
  }
})

test('el cambio de idioma lleva a la otra versión', async ({ page }) => {
  await page.goto('/en/')
  await page.locator('.bar').getByRole('link', { name: 'ES', exact: true }).click()
  await expect(page).toHaveURL(/\/es\/$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'es')
})

test('con JavaScript desactivado el contenido y los cinco nodos son legibles (AC-02)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('http://localhost:4173/en/')
  await expect(page.locator('h1')).toHaveText('A little of what I do, in a few minutes.')
  await expect(page.locator('a[data-node]')).toHaveCount(5)
  await page.goto('http://localhost:4173/en/demo/') // la demo ya no existe: este servidor devuelve la portada o la 404, nunca una página de demo
  await expect(page.getByTestId('run')).toHaveCount(0)
  await expect(page.getByTestId('static-example')).toHaveCount(0)
  await ctx.close()
})

test('axe: la página completa en inglés y español sin violaciones', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  for (const p of ['/en/', '/es/', '/en/privacy/', '/es/terminos/', ...ALL]) {
    await page.goto(p)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(r.violations.map((v) => `${p} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  }
})
