import { test, expect } from '@playwright/test'

// Una página por nodo (correcciones 1, C2): el inicio es solo la primera pantalla y el resto vive en cada página, en los dos idiomas.
const PAGES = {
  en: { code: ['/en/code/', 'Code'], projects: ['/en/projects/', 'Work in production'], journey: ['/en/journey/', 'Journey'], how: ['/en/how-i-work/', 'How I work'], interest: ['/en/about/', 'About me'], contact: ['/en/contact/', 'Contact'] },
  es: { code: ['/es/codigo/', 'Código'], projects: ['/es/proyectos/', 'Trabajo en producción'], journey: ['/es/trayectoria/', 'Trayectoria'], how: ['/es/como-trabajo/', 'Cómo trabajo'], interest: ['/es/sobre-mi/', 'Sobre mí'], contact: ['/es/contacto/', 'Contacto'] },
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
    await expect(page.locator('h1')).toHaveText(lang === 'es' ? 'Un poco sobre mí.' : 'A little of what I do, in a few minutes.')
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
  await expect(page.locator('.card', { hasText: 'Criden' }).locator('a')).toHaveAttribute('href', 'https://criden.com') // enlace real desde 2026-11-14 (cierra P-22)
  await expect(page.locator('main')).not.toContainText(/contable|football manager|f[uú]tbol manager|hardlock|pr[óo]ximamente/i)
})

test('Bots para Telegram: abierto al cargar con los cuatro bots en orden, un renglón por bot, sin hueco; se cierra y abre con Enter, Espacio y clic sin mover lo de arriba', async ({ page }) => {
  await page.goto('/es/proyectos/')
  const d = page.locator('details.bots')
  const items = d.locator('li strong')
  await expect(d).toHaveAttribute('open', '')
  await expect(items).toHaveText(['Bot de registro de cajas', 'Bot de caja más cercana', 'Bot de reportes', 'Bot de planificación'])
  await expect(items.first()).toBeVisible()
  await expect(d.locator('.badge-production')).toHaveCount(1) // solo Caja Cercana declara estado
  for (const t of await d.locator('.bot-text').allTextContents()) expect(t.split(/[.!?]\s/).length).toBe(1) // un renglón (una frase) por bot
  // la tarjeta ocupa la fila entera: ninguna tarjeta vecina queda más baja que su contenido
  const cards = await page.locator('.cards > .card').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, w: r.width, h: r.height } }))
  expect(cards[0].w).toBeGreaterThan(cards[1].w)
  const above = await page.locator('h1').boundingBox()
  await d.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(d).not.toHaveAttribute('open', '')
  await expect(items.first()).toBeHidden()
  expect(await page.locator('h1').boundingBox()).toEqual(above)
  await page.keyboard.press('Space')
  await expect(d).toHaveAttribute('open', '')
  await d.locator('summary').click()
  await expect(items.first()).toBeHidden()
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
  await expect(p2.locator('details.bots li strong').first()).toBeVisible() // abierta de origen, también sin JS
  await p2.locator('details.bots summary').click() // <details> nativo: funciona sin JS
  await expect(p2.locator('details.bots li strong')).toHaveCount(4)
  await ctx.close()
})

test('Sobre mí: el pensamiento cerebro–IA va al final, sin deportes', async ({ page }) => {
  await page.goto('/en/about/')
  await expect(page.locator('main')).toContainText('connect the brain to AI')
  await expect(page.locator('main')).not.toContainText(/jiu|triathlon|obstacle|sport/i)
})

// «Sobre mí» (encargo 2026-11-14): rutas viejas, presentación, sin audio vacío, ejemplos del bot, contacto sin número a la vista.
for (const [old, now, lang] of [['/en/interest/', '/en/about/', 'en'], ['/es/interes/', '/es/sobre-mi/', 'es']]) {
  test(`${lang}: la ruta vieja ${old} lleva a ${now} (respaldo del cliente; en Pages la resuelve _redirects con 301)`, async ({ page }) => {
    await page.goto(old)
    await page.waitForURL(`**${now}`)
    await expect(page.locator('h1')).toHaveText(lang === 'es' ? 'Sobre mí' : 'About me')
  })
  test(`${lang}: Sobre mí muestra la presentación, sin reproductor vacío, con ejemplos rotulados y contacto`, async ({ page }) => {
    await page.goto(now)
    const main = page.locator('main')
    await expect(main).toContainText(lang === 'es' ? 'Hola, soy Dennys Heras' : 'Hi, I\'m Dennys Heras')
    await expect(page.locator('audio')).toHaveCount(0)
    await expect(page.locator('.about-audio')).toHaveCount(0)
    const imgs = page.locator('.about-mockups img')
    await expect(imgs).toHaveCount(2)
    await imgs.first().scrollIntoViewIfNeeded()
    for (const i of [0, 1]) {
      await expect(imgs.nth(i)).toHaveJSProperty('complete', true)
      expect(await imgs.nth(i).evaluate((el) => el.naturalWidth)).toBeGreaterThan(0)
      await expect(imgs.nth(i)).toHaveAttribute('width', '1200')
      await expect(imgs.nth(i)).toHaveAttribute('loading', 'lazy')
    }
    await expect(main).toContainText(lang === 'es' ? 'Ejemplo con datos de muestra: los bots reales son privados de la empresa' : 'Example with sample data: the real bots are private to the company')
    const wa = page.getByRole('link', { name: lang === 'es' ? 'Escribir por WhatsApp (se abre en otra pestaña)' : 'Write on WhatsApp (opens in another tab)' })
    await expect(wa).toHaveAttribute('href', 'https://wa.me/593960664347')
    await expect(wa).toHaveAttribute('target', '_blank')
    await expect(wa).toHaveAttribute('rel', 'noopener noreferrer')
    expect(await wa.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/593\s?96|960\s?664/)
    await expect(page.getByRole('link', { name: lang === 'es' ? 'Escríbeme' : 'Write to me' })).toHaveAttribute('href', 'mailto:dennys@dennysh.com')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('con viewport 360×640 el inicio muestra frase y retrato en la primera pantalla y no se desplaza de lado (AC-01)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  for (const loc of [page.locator('h1'), page.locator('.portrait')]) await expect(loc).toBeInViewport({ ratio: 1 })
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

// Sobre mí, maquetas de bots (críticos 2, 2026-11-14): un título por imagen, una por fila, texto interno legible y sin desbordar la página.
for (const [label, vp, minW] of [['móvil 390×844', { width: 390, height: 844 }, 800], ['escritorio 1440×900', { width: 1440, height: 900 }, 900]]) {
  test(`Sobre mí (${label}): las maquetas van una por fila, con título propio, a un ancho legible y sin desbordar la página`, async ({ page }) => {
    await page.setViewportSize(vp)
    await page.goto('/es/sobre-mi/')
    await expect(page.locator('.about-mockups figcaption')).toHaveText(['Registro de cajas (ficticio)', 'Reportes de incidencias (ficticio)'])
    const m = await page.locator('.about-mockups img').evaluateAll((els) => els.map((e) => ({ w: e.getBoundingClientRect().width, y: e.getBoundingClientRect().y })))
    expect(m[1].y).toBeGreaterThan(m[0].y + 100) // una por fila
    for (const i of m) expect(i.w).toBeGreaterThanOrEqual(minW) // 1200 px de maqueta a ≥ 800 px deja el texto de 14 px en ≥ 9 px y el de 22 px en ≥ 14 px; en escritorio ≥ 900
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('main')).toContainText('datos de muestra')
    expect(await page.locator('main').evaluate((el) => el.innerText.split('Ejemplo con datos de muestra').length - 1)).toBe(1)
  })
}
