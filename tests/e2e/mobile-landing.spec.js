import { test, expect } from '@playwright/test'
import { setStoredTheme } from './helpers.js'
import { quiet } from '../../src/home/network-mobile.js'
import { site } from '../../src/content/site.js'
import { pagePaths } from '../../src/routes.js'

// Primera pantalla móvil como landing vertical (trabajo A): arriba solo Dennys con la red que se enciende sola o al tocar; debajo, «Explorar».
const SIZES = [{ width: 390, height: 844 }, { width: 360, height: 640 }]
const IDS = ['code', 'projects', 'journey', 'how', 'interest']
const phone = (viewport) => ({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 2 })
const ready = async (page, path = '/es/') => { await page.goto(path); await page.waitForSelector('.first[data-js]'); await page.waitForSelector('canvas.net-m') }

// Gestos táctiles reales con CDP (los toques llegan como pointer events de tipo touch).
async function drag(page, points, pause = 45) {
  const cdp = await page.context().newCDPSession(page)
  const send = (type, p) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: p ? [{ x: p[0], y: p[1] }] : [] })
  await send('touchStart', points[0])
  for (const p of points.slice(1)) { await send('touchMove', p); await page.waitForTimeout(pause) }
  return { cdp, end: () => send('touchEnd') }
}

// Puntos (px de CSS del hero) que son zona protegida con 3 px de margen hacia dentro, a partir de la caja real del retrato.
async function protectedPoints(page) {
  const box = await page.evaluate(() => {
    const h = document.querySelector('.canvas').getBoundingClientRect(), p = document.querySelector('.portrait').getBoundingClientRect()
    return { x: p.left - h.left, y: p.top - h.top, w: p.width, h: p.height, W: h.width, H: h.height }
  })
  const pts = []
  const inside = (x, y) => [[0, 0], [3, 0], [-3, 0], [0, 3], [0, -3]].every(([dx, dy]) => quiet(x + dx, y + dy, box) === 0)
  for (let y = 0; y < box.H; y += 3) for (let x = 0; x < box.W; x += 3) if (inside(x, y)) pts.push([x, y])
  return { pts, box }
}
const alphaIn = (page, pts) => page.evaluate((pts) => {
  const c = document.querySelector('canvas.net-m'), ctx = c.getContext('2d'), k = c.width / c.getBoundingClientRect().width
  let max = 0
  for (const [x, y] of pts) { const a = ctx.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data[3]; if (a > max) max = a }
  return max
}, pts)
const litPixels = (page) => page.evaluate(() => {
  const c = document.querySelector('canvas.net-m'), ctx = c.getContext('2d'), d = ctx.getImageData(0, 0, c.width, c.height).data
  let n = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 20) n++
  return n
})

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use(phone(size))

    for (const lang of ['es', 'en']) {
      test(`(${lang}) el hero no desborda; barra, retrato, frase y línea de datos; la red es decorativa y solo hay una`, async ({ page }) => {
        const errors = []
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
        page.on('pageerror', (e) => errors.push(String(e)))
        await ready(page, `/${lang}/`)
        const c = site[lang].home
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, nets: document.querySelectorAll('canvas').length, desk: document.querySelectorAll('canvas.net').length }))
        expect(m.sw).toBeLessThanOrEqual(m.iw)
        expect(m.nets).toBe(1); expect(m.desk).toBe(0) // solo la red del móvil; la de escritorio no se monta
        await expect(page.locator('h1')).toHaveText(c.phrase)
        await expect(page.locator('.tagline')).toContainText(c.tagline[0])
        await expect(page.locator('.portrait')).toBeVisible()
        await expect(page.locator('canvas.net-m')).toHaveAttribute('aria-hidden', 'true')
        const hero = await page.locator('.canvas').boundingBox()
        expect(hero.width).toBeLessThanOrEqual(size.width)
        expect(hero.height).toBeGreaterThanOrEqual(Math.min(560, size.height))
        // barra: marca, CV, idioma y tema; cada objetivo táctil ≥ 44 px y dentro de la pantalla
        for (const sel of ['.bar-brand', '.bar nav a[href$=".pdf"]', '.bar nav a[hreflang]', '.bar .theme-toggle']) {
          const b = await page.locator(sel).boundingBox()
          expect(b.height, sel).toBeGreaterThanOrEqual(44 - .5)
          expect(b.x + b.width, sel).toBeLessThanOrEqual(size.width + .5)
          expect(b.x, sel).toBeGreaterThanOrEqual(0)
        }
        // la frase no se sale de la pantalla ni se monta sobre la cabeza
        const h1 = await page.locator('h1').boundingBox(), tag = await page.locator('.tagline').boundingBox(), por = await page.locator('.portrait').boundingBox()
        expect(h1.x).toBeGreaterThanOrEqual(0); expect(h1.x + h1.width).toBeLessThanOrEqual(size.width + .5)
        expect(tag.y + tag.height, 'la línea de datos termina antes de la cabeza').toBeLessThanOrEqual(por.y + por.height * .14)
        expect(errors).toEqual([])
      })

      test(`(${lang}) «Explorar»: cinco tarjetas, cada una un enlace real a su página, con el texto real y encabezados h1 → h2 → h3`, async ({ page }) => {
        await ready(page, `/${lang}/`)
        const c = site[lang].home
        await expect(page.locator('.explore h2')).toHaveText(c.nodesLabel)
        const cards = page.locator('.m-card')
        await expect(cards).toHaveCount(5)
        for (const [i, id] of IDS.entries()) {
          const card = cards.nth(i), p = c.panels[id]
          await expect(card.locator('h3')).toHaveText(p.title)
          const a = card.locator('a')
          await expect(a).toHaveAttribute('href', pagePaths[lang][id])
          await expect(a).toContainText(p.go)
          const b = await a.boundingBox()
          expect(b.height, id).toBeGreaterThanOrEqual(44 - .5)
        }
        // textos reales (no de muestra)
        await expect(cards.nth(0)).toContainText(c.panels.code.note)
        await expect(cards.nth(1)).toContainText(c.panels.projects.text)
        await expect(cards.nth(2)).toContainText(c.panels.journey.text)
        await expect(cards.nth(3)).toContainText(site[lang].howPage.lead)
        await expect(cards.nth(4)).toContainText(c.panels.interest.thought)
        // jerarquía: ningún salto de nivel dentro de la parte visible (los paneles de escritorio están ocultos)
        const levels = await page.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, section h1, section h2, section h3')].filter((h) => h.offsetParent !== null || getComputedStyle(h).position === 'fixed').filter((h) => h.getClientRects().length).map((h) => +h.tagName[1]))
        expect(levels[0]).toBe(1)
        for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `h${levels[i - 1]} → h${levels[i]}`).toBeLessThanOrEqual(1)
        // el enlace lleva a la página (navega de verdad)
        await cards.nth(1).locator('a').click()
        await expect(page).toHaveURL(new RegExp(pagePaths[lang].projects.replace(/\//g, '\\/') + '$'))
      })
    }

    test('la línea de fibra se ilumina con el scroll y las tarjetas se encienden al entrar', async ({ page }) => {
      await ready(page)
      const p = () => page.locator('.fiber').evaluate((e) => parseFloat(getComputedStyle(e).getPropertyValue('--p') || e.style.getPropertyValue('--p')))
      const start = await p()
      expect(start).toBeLessThan(.2)
      expect(await page.locator('.m-card.on').count()).toBeLessThan(5)
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await expect.poll(p).toBeGreaterThan(.99) // al final de la página la línea llega a la última tarjeta
      await expect(page.locator('.m-card.on')).toHaveCount(5)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    })

    test('el scroll vertical sigue funcionando con un gesto de arrastre sobre el hero (touch-action: pan-y)', async ({ page }) => {
      await ready(page)
      expect(await page.locator('.canvas').evaluate((e) => getComputedStyle(e).touchAction)).toBe('pan-y')
      // Un arrastre táctil real (toque, movimiento, soltar) sobre el hero desplaza la página; con touch-action: none no se movería (comprobado a mano).
      const g = await drag(page, Array.from({ length: 16 }, (_, i) => [size.width / 2, size.height * .7 - i * 20]), 16)
      await g.end()
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(150)
    })

    for (const theme of ['dark', 'light']) {
      test(`(${theme}) la red nunca se dibuja sobre la cara ni el cuerpo, ni sola ni arrastrando el dedo por todo el hero, y sí se dibuja en el resto`, async ({ page }, info) => {
        await setStoredTheme(page, theme)
        await ready(page)
        await page.waitForTimeout(600)
        const { pts, box } = await protectedPoints(page)
        expect(pts.length, 'hay zona protegida que medir').toBeGreaterThan(500)
        let worst = await alphaIn(page, pts)
        // reposo: luz errante sola
        await page.locator('.canvas').screenshot({ path: info.outputPath(`movil-${size.width}-${theme}-reposo.png`) })
        // el dedo recorre el hero en zigzag por toda su superficie (cara y cuerpo incluidos)
        const path = []
        for (let row = 0; row < 9; row++) { const y = 20 + row * ((box.H - 40) / 8); for (let i = 0; i <= 12; i++) path.push([row % 2 ? 380 - i * 30 : 10 + i * 30, y].map((v, k) => (k === 0 ? Math.min(v, size.width - 4) : v))) }
        const g = await drag(page, path.slice(0, 1).concat(path.slice(1)), 0)
        let lit = 0
        for (let i = 0; i < path.length; i += 6) {
          await page.waitForTimeout(110)
          worst = Math.max(worst, await alphaIn(page, pts))
          lit = Math.max(lit, await litPixels(page))
        }
        await page.locator('.canvas').screenshot({ path: info.outputPath(`movil-${size.width}-${theme}-dedo.png`) })
        await g.end()
        expect(worst, 'alfa máxima sobre cara y cuerpo').toBe(0)
        expect(lit, 'la red sí se dibuja fuera de la zona protegida').toBeGreaterThan(300)
      })
    }

    test('sin JavaScript las tarjetas se ven completas y los enlaces funcionan (estado en reposo visible)', async ({ browser }) => {
      const ctx = await browser.newContext({ ...phone(size), javaScriptEnabled: false })
      const page = await ctx.newPage()
      await page.goto('/es/')
      const cards = page.locator('.m-card')
      await expect(cards).toHaveCount(5)
      for (let i = 0; i < 5; i++) {
        const s = await cards.nth(i).evaluate((e) => { const c = getComputedStyle(e); return { o: c.opacity, t: c.transform } })
        expect(s, `tarjeta ${i}`).toEqual({ o: '1', t: 'none' })
        await expect(cards.nth(i).locator('a')).toHaveAttribute('href', pagePaths.es[IDS[i]])
      }
      await expect(page.locator('canvas')).toHaveCount(0)
      await ctx.close()
    })

    test('movimiento reducido: la red no se monta hasta el primer toque, las tarjetas se ven sin transición y no hay animación continua', async ({ browser }) => {
      const ctx = await browser.newContext({ ...phone(size), reducedMotion: 'reduce' })
      const page = await ctx.newPage()
      await page.goto('/es/'); await page.waitForSelector('.first[data-js]')
      await page.waitForTimeout(400)
      await expect(page.locator('canvas')).toHaveCount(0)
      for (let i = 0; i < 5; i++) {
        const s = await page.locator('.m-card').nth(i).evaluate((e) => { const c = getComputedStyle(e); return { o: c.opacity, t: c.transform, d: c.transitionDuration } })
        expect(s).toEqual({ o: '1', t: 'none', d: '0s' })
      }
      expect(await page.locator('.hint i').evaluate((e) => getComputedStyle(e).animationName)).toBe('none')
      const g = await drag(page, [[200, 500], [210, 505]], 30) // primer toque: monta la red y la dibuja
      await expect(page.locator('canvas.net-m')).toHaveCount(1)
      await page.waitForTimeout(300)
      const frames = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const orig = CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect = function (...a) { n++; return orig.apply(this, a) }; setTimeout(() => { CanvasRenderingContext2D.prototype.clearRect = orig; res(n) }, 700) }))
      expect(frames, 'sin el dedo en movimiento no se dibuja nada (no hay bucle de animación)').toBe(0)
      await g.end()
      await ctx.close()
    })

    test('sin parpadeo ni salto de diseño al hidratar (CLS) y el hero mide lo mismo antes y después', async ({ page }) => {
      await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true }) })
      await page.goto('/es/')
      const before = await page.locator('.canvas').boundingBox()
      await page.waitForSelector('canvas.net-m')
      await page.waitForTimeout(800)
      const after = await page.locator('.canvas').boundingBox()
      expect(after).toEqual(before)
      expect(await page.evaluate(() => window.__cls)).toBeLessThan(.02)
    })

    test('rendimiento: la red del móvil mantiene el tope de 30 cuadros por segundo, ~110 puntos y se detiene fuera de pantalla', async ({ page }) => {
      await ready(page)
      await page.waitForTimeout(500)
      const count = (ms) => page.evaluate((ms) => new Promise((res) => { let n = 0; const orig = CanvasRenderingContext2D.prototype.clearRect; CanvasRenderingContext2D.prototype.clearRect = function (...a) { n++; return orig.apply(this, a) }; setTimeout(() => { CanvasRenderingContext2D.prototype.clearRect = orig; res(n) }, ms) }), ms)
      const onScreen = await count(2000)
      expect(onScreen / 2).toBeLessThanOrEqual(31) // 30 fps como mucho
      expect(onScreen / 2).toBeGreaterThan(10) // y sí se anima
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
      await page.waitForTimeout(500)
      expect(await count(800), 'fuera de pantalla no se dibuja').toBe(0)
      // coste por cuadro medido en el navegador: lógica + pintura de un cuadro con el dedo puesto
      await page.evaluate(() => window.scrollTo(0, 0))
      const cost = await page.evaluate(async () => {
        const c = document.querySelector('canvas.net-m'), orig = CanvasRenderingContext2D.prototype.clearRect, times = []
        let t0 = 0
        CanvasRenderingContext2D.prototype.clearRect = function (...a) { t0 = performance.now(); return orig.apply(this, a) }
        const raf = () => new Promise((r) => requestAnimationFrame(() => r()))
        for (let i = 0; i < 40; i++) { await raf(); if (t0) { times.push(performance.now() - t0); t0 = 0 } }
        CanvasRenderingContext2D.prototype.clearRect = orig
        return { n: times.length, mean: times.reduce((a, b) => a + b, 0) / Math.max(1, times.length), c: !!c }
      })
      test.info().annotations.push({ type: 'coste-por-cuadro-ms', description: String(cost.mean.toFixed(2)) })
    })

    for (const scheme of ['dark', 'light']) {
      test(`axe (${scheme}): hero y tarjetas sin violaciones (WCAG 2.2 AA), en español e inglés`, async ({ page }) => {
        const { default: AxeBuilder } = await import('@axe-core/playwright')
        await setStoredTheme(page, scheme)
        for (const lang of ['es', 'en']) {
          await ready(page, `/${lang}/`)
          expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'dark')).toBe(scheme)
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
          await page.waitForTimeout(700)
          await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100)
          const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
          expect(r.violations.map((v) => `${lang} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
        }
      })
    }

    test('foco visible en los enlaces de las tarjetas y en la barra (teclado)', async ({ page }) => {
      await ready(page)
      const a = page.locator('.m-card a').first()
      await a.focus()
      const o = await a.evaluate((e) => { const c = getComputedStyle(e); return { w: c.outlineWidth, s: c.outlineStyle } })
      expect(o.s).not.toBe('none'); expect(parseFloat(o.w)).toBeGreaterThanOrEqual(2)
      await page.locator('.bar .theme-toggle').focus()
      const t = await page.locator('.bar .theme-toggle').evaluate((e) => getComputedStyle(e).outlineStyle)
      expect(t).not.toBe('none')
    })
  })
}

test('escritorio: no hay «Explorar», ni pista, ni red del móvil; el arco de cinco nodos sigue igual', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/es/'); await page.waitForSelector('.first[data-js]')
  await expect(page.locator('.explore')).toBeHidden()
  await expect(page.locator('.hint')).toBeHidden()
  await expect(page.locator('canvas.net-m')).toHaveCount(0)
  await expect(page.locator('a[data-node]')).toHaveCount(5)
})
