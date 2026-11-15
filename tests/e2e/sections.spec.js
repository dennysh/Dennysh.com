import { test, expect } from '@playwright/test'

// Una página por nodo (correcciones 1, C2): el inicio es solo la primera pantalla y el resto vive en cada página, en los dos idiomas.
const PAGES = {
  en: { code: ['/en/code/', 'Code'], projects: ['/en/projects/', 'Projects'], journey: ['/en/journey/', 'Journey'], how: ['/en/how-i-work/', 'How I work'], interest: ['/en/about/', 'About me'], contact: ['/en/contact/', 'Contact'] },
  es: { code: ['/es/codigo/', 'Código'], projects: ['/es/proyectos/', 'Proyectos'], journey: ['/es/trayectoria/', 'Trayectoria'], how: ['/es/como-trabajo/', 'Cómo trabajo'], interest: ['/es/sobre-mi/', 'Sobre mí'], contact: ['/es/contacto/', 'Contacto'] },
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
    await expect(page.locator('h1')).toHaveText(lang === 'es' ? 'Software, automatizaciones, bots y agentes de IA para empresas.' : 'Software, automation, bots and AI agents for businesses.')
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

test('Cómo trabajo: lo llano arriba; «Detalle técnico» plegado por defecto (máquinas, fábrica, diagrama) y se abre con teclado; la evidencia pendiente no se ve', async ({ page }) => {
  await page.goto('/en/how-i-work/')
  await expect(page.locator('ol.rules li')).toHaveCount(7)
  const d = page.locator('details.tech')
  await expect(d).not.toHaveAttribute('open', '')
  await expect(d.locator('summary')).toHaveText('Technical detail')
  await expect(page.locator('pre.code-page')).toBeHidden()
  await expect(page.locator('svg.diagram')).toBeHidden()
  await expect(page.getByText(/being prepared/)).toHaveCount(0)
  // por teclado: foco en el resumen, Enter lo abre y Espacio lo cierra
  await d.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(d).toHaveAttribute('open', '')
  await expect(page.locator('pre.code-page')).toContainText('- Tests first, then code.')
  await expect(page.locator('pre.code-page')).toContainText('llms.txt')
  await expect(page.locator('svg.diagram')).toBeVisible()
  await expect(page.locator('.steps li')).toHaveCount(5)
  await page.keyboard.press('Space')
  await expect(d).not.toHaveAttribute('open', '')
  await expect(page.locator('pre.code-page')).toBeHidden()
  // sin JavaScript también funciona (details nativo)
})

test('Código trae el panel real y las capacidades; Agentes de IA acotado, sin bots autónomos ni aprendizaje profundo', async ({ page }) => {
  await page.goto('/es/codigo/')
  await expect(page.locator('pre.code-page')).toContainText('"id": "R-02"')
  await expect(page.locator('.tags li', { hasText: 'Chatbots con LLM' })).toHaveCount(1)
  await expect(page.locator('.tags li', { hasText: /^LLM$/ })).toHaveCount(1)
  await expect(page.locator('.skill-note')).toContainText('solo lectura')
  // 4.ª ronda de críticos: demostradas destacadas y primero, declaradas atenuadas, una sola leyenda y sin rótulo repetido en cada chip
  await expect(page.locator('.skill-legend')).toHaveCount(1)
  await expect(page.locator('.tags.shown li').first()).toBeVisible()
  const w = (sel) => page.locator(sel).first().evaluate((e) => parseInt(getComputedStyle(e).fontWeight, 10))
  expect(await w('.tags.shown li')).toBeGreaterThan(await w('.tags.declared li'))
  const colors = await page.evaluate(() => [document.querySelector('.tags.shown li'), document.querySelector('.tags.declared li')].map((e) => getComputedStyle(e).color))
  expect(colors[0]).not.toBe(colors[1])
  await expect(page.getByText(/^Declarado$/i)).toHaveCount(0)
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

test('Proyectos: el Bot de caja más cercana muestra su texto completo, con el dato de los técnicos (es y en)', async ({ page }) => {
  for (const [url, frase, bot] of [['/es/proyectos/', 'Hoy lo usan más de 10 técnicos de la empresa.', 'Bot de caja más cercana'], ['/en/projects/', 'Today more than 10 technicians at the company use it.', 'Nearest box bot']]) {
    await page.goto(url)
    const li = page.locator('details.bots li', { hasText: bot })
    await expect(li).toContainText(frase)
    await expect(li.locator('.bot-text')).toBeVisible()
  }
})

test('Proyectos: la captura del Bot de caja más cercana se ve legible, con pie, sin desbordes (es y en)', async ({ page }) => {
  for (const [url, bot] of [['/es/proyectos/', 'Bot de caja más cercana'], ['/en/projects/', 'Nearest box bot']]) {
    await page.goto(url)
    const fig = page.locator('details.bots li', { hasText: bot }).locator('figure.bot-shot')
    const img = fig.locator('img')
    await img.scrollIntoViewIfNeeded()
    await expect(img).toBeVisible()
    await expect(img).toHaveAttribute('alt', /327, 457/)
    await expect(fig.locator('figcaption')).toContainText(/ficticios|fictitious/)
    await expect.poll(() => img.evaluate((i) => i.complete && i.naturalWidth)).toBe(746)
    const b = await img.boundingBox()
    const vw = page.viewportSize().width
    expect(b.width).toBeLessThanOrEqual(480)
    expect(b.x + b.width).toBeLessThanOrEqual(vw)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }
})

test('Bots para Telegram: abierto al cargar con los cuatro bots en orden, con su texto completo, sin hueco; se cierra y abre con Enter, Espacio y clic sin mover lo de arriba', async ({ page }) => {
  await page.goto('/es/proyectos/')
  const d = page.locator('details.bots')
  const items = d.locator('li strong')
  await expect(d).toHaveAttribute('open', '')
  await expect(items).toHaveText(['Bot de registro de cajas', 'Bot de caja más cercana', 'Bot de reportes', 'Bot de planificación'])
  await expect(items.first()).toBeVisible()
  await expect(d.locator('.badge-production')).toHaveCount(1) // solo Caja Cercana está en producción
  await expect(d.locator('.badge-development')).toHaveCount(3) // los otros tres, en desarrollo
  // cada etiqueta de estado queda dentro de la caja de su bot y en la misma línea que su nombre (no puede leerse como del vecino)
  for (const li of await d.locator('li').all()) {
    const [strong, badge, box] = await Promise.all([li.locator('strong').boundingBox(), li.locator('.badge').boundingBox(), li.boundingBox()])
    expect(Math.abs((strong.y + strong.height / 2) - (badge.y + badge.height / 2))).toBeLessThan(strong.height)
    expect(badge.y).toBeGreaterThanOrEqual(box.y); expect(badge.y + badge.height).toBeLessThanOrEqual(box.y + box.height)
  }
  await expect(d.locator('li').nth(3)).toContainText('Reasigna actividades en el grupo de Telegram del equipo')
  await expect(d.locator('li').nth(1).locator('.bot-text')).toContainText('Hoy lo usan más de 10 técnicos de la empresa.') // en Proyectos cada bot muestra su texto completo (la vista previa de la portada sigue en una línea)
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

test('Bots para Telegram también se abre en el panel "Proyectos" de la portada, y sin JavaScript', async ({ page, browser }) => {
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

test('Sobre mí: el interés a largo plazo es una sola línea al final, sin título ni pregunta especulativa, sin deportes', async ({ page }) => {
  await page.goto('/en/about/')
  await expect(page.locator('main > section p.about-long')).toHaveText('In the long run I am interested in how AI can enhance human abilities. It is an interest, not a demonstrated skill.')
  await expect(page.locator('main')).not.toContainText(/brain/i)
  await expect(page.locator('h2', { hasText: /long-term|largo plazo/i })).toHaveCount(0)
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
      await expect(imgs.nth(i)).toHaveAttribute('width', '360')
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
  await expect(page.locator('h1')).toHaveText('Software, automation, bots and AI agents for businesses.')
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

// Sobre mí, maquetas verticales de bots (2026-11-15): un título por imagen, texto legible (el viewBox mide 360 px: a ≥ 340 px el texto de 14 px sale a ≥ 13 px), sin marco desplazable ni desbordar la página.
for (const [label, vp, sideBySide] of [['móvil 390×844', { width: 390, height: 844 }, false], ['escritorio 1440×900', { width: 1440, height: 900 }, true]]) {
  test(`Sobre mí (${label}): las maquetas verticales se leen enteras, con título propio y sin desbordar la página`, async ({ page }) => {
    await page.setViewportSize(vp)
    await page.goto('/es/sobre-mi/')
    await expect(page.locator('.about-mockups figcaption')).toHaveText(['Registro de cajas (ficticio)', 'Reportes de incidencias (ficticio)'])
    await expect(page.locator('.about-mockup-frame')).toHaveCount(0)
    const m = await page.locator('.about-mockups img').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { w: r.width, x: r.x, y: r.y } }))
    for (const i of m) { expect(i.w).toBeGreaterThanOrEqual(340); expect(i.w).toBeLessThanOrEqual(420) }
    if (sideBySide) expect(Math.abs(m[1].y - m[0].y)).toBeLessThan(5) // lado a lado
    else expect(m[1].y).toBeGreaterThan(m[0].y + 400) // una por fila
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.locator('main')).toContainText('datos de muestra')
    expect(await page.locator('main').evaluate((el) => el.innerText.split('Ejemplo con datos de muestra').length - 1)).toBe(1)
  })
}
