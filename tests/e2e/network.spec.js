import { test, expect } from '@playwright/test'
import { VIEW, HEAD_RECT, PORTRAIT_PX } from '../../src/home/geometry.js'

// Red de fondo (trabajo A): canvas solo con puntero fino, detrás del retrato y de los nodos, sin cubrir cara ni cuerpo.
const hydrated = (page) => page.waitForSelector('.first[data-js]')
const net = (page) => page.locator('canvas.net')
const sweep = async (page, fn) => {
  const box = await page.locator('.canvas').boundingBox()
  for (let gy = 0; gy <= 5; gy++) for (let gx = 0; gx <= 10; gx++) {
    await page.mouse.move(box.x + (box.width * gx) / 10, box.y + (box.height * gy) / 5, { steps: 3 })
    await page.waitForTimeout(70)
    await fn()
  }
}

test.describe('puntero fino (escritorio)', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('hay un canvas decorativo, sin eventos de puntero, y la pantalla no da errores de consola', async ({ page }) => {
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('/es/')
    await hydrated(page)
    await expect(net(page)).toHaveCount(1)
    await expect(net(page)).toHaveAttribute('aria-hidden', 'true')
    const info = await net(page).evaluate((c) => ({ pe: getComputedStyle(c).pointerEvents, z: getComputedStyle(c).zIndex, parent: c.parentElement.className, w: c.width, cssW: c.getBoundingClientRect().width }))
    expect(info.pe).toBe('none')
    expect(info.parent).toBe('canvas')
    expect(info.w).toBeLessThanOrEqual(info.cssW * 2 + 1) // DPR máximo 2
    await page.mouse.move(300, 300, { steps: 5 })
    await page.waitForTimeout(300)
    expect(errors, errors.join('\n')).toEqual([])
  })

  test('capas: encima del brillo, debajo de las líneas, del retrato y de los nodos', async ({ page }) => {
    await page.goto('/es/')
    await hydrated(page)
    const order = await page.evaluate(() => {
      const z = (s) => Number(getComputedStyle(document.querySelector(s)).zIndex) || 0
      const c = document.querySelector('.canvas'), n = document.querySelector('canvas.net'), l = document.querySelector('svg.lines'), p = document.querySelector('.portrait')
      return { netZ: z('canvas.net'), linesZ: z('.lines'), nodesZ: z('.nodes'), netBeforeLines: !!(n.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING), portraitAuto: getComputedStyle(p).zIndex, glow: getComputedStyle(c, '::before').zIndex }
    })
    expect(order.glow).toBe('-1')
    expect(order.netZ).toBe(-1)
    expect(order.netBeforeLines).toBe(true)
    expect(order.portraitAuto).toBe('auto') // el retrato (posicionado, sin z-index) pinta por encima de los z-index negativos
    expect(order.nodesZ).toBeGreaterThan(0)
  })

  test('los nodos siguen recibiendo el puntero con la red activa: hover muestra su tarjeta, el foco también y el clic navega', async ({ page }) => {
    await page.goto('/es/')
    await hydrated(page)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const code = page.getByRole('link', { name: 'Código', exact: true })
    const box = await code.boundingBox()
    // el elemento bajo el centro del nodo es el enlace, no el canvas
    const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.dataset.node, [box.x + box.width / 2, box.y + box.height / 2])
    expect(top).toBe('code')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 })
    await expect(page.locator('#p-code')).toBeVisible()
    await page.mouse.move(5, 5)
    await expect(page.locator('.panel:visible')).toHaveCount(0)
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab')
    await page.getByRole('link', { name: 'Proyectos', exact: true }).focus()
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    await expect(page.locator('#p-projects')).toBeVisible()
    await page.getByRole('link', { name: 'Interés', exact: true }).click()
    await expect(page).toHaveURL(/\/es\/interes\/$/)
  })

  test('medición por píxeles: sobre la cara y el cuerpo el canvas queda transparente tras mover el puntero por todos lados', async ({ page }) => {
    await page.goto('/es/')
    await hydrated(page)
    const regions = await page.evaluate(([view, head, port]) => {
      const c = document.querySelector('canvas.net'); const kx = c.width / view.w, ky = c.height / view.h
      const r = (x0, y0, x1, y1) => ({ x: Math.floor(x0 * kx), y: Math.floor(y0 * ky), w: Math.ceil((x1 - x0) * kx), h: Math.ceil((y1 - y0) * ky) })
      const cx = (head.x0 + head.x1) / 2
      return { face: r(head.x0, head.y0, head.x1, head.y1), body: r(cx - port.w * .19, head.y1 + 4, cx + port.w * .19, view.h - 4) }
    }, [VIEW, HEAD_RECT, PORTRAIT_PX])
    let maxFace = 0, maxBody = 0, lit = 0
    const read = () => page.evaluate((rg) => {
      const c = document.querySelector('canvas.net'), ctx = c.getContext('2d')
      const mx = (r) => { const d = ctx.getImageData(r.x, r.y, r.w, r.h).data; let m = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > m) m = d[i]; return m }
      const all = ctx.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < all.length; i += 4) if (all[i] > 8) n++
      return { face: mx(rg.face), body: mx(rg.body), lit: n }
    }, regions)
    await sweep(page, async () => { const m = await read(); maxFace = Math.max(maxFace, m.face); maxBody = Math.max(maxBody, m.body); lit = Math.max(lit, m.lit) })
    expect(lit, 'la red sí se dibuja en algún sitio').toBeGreaterThan(300)
    expect(maxFace, 'alfa máxima sobre la cara').toBe(0)
    expect(maxBody, 'alfa máxima sobre el cuerpo').toBe(0)
  })

  test('el color sale del acento del tema y reacciona al cambio de tema', async ({ page }) => {
    await page.goto('/es/')
    await hydrated(page)
    await page.emulateMedia({ colorScheme: 'light' })
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light' })
    const box = await page.locator('.canvas').boundingBox()
    const dominant = () => page.evaluate(() => {
      const c = document.querySelector('canvas.net'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let best = null
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= 70 && (!best || d[i + 3] > best[3])) best = [d[i], d[i + 1], d[i + 2], d[i + 3]]
      return best
    })
    const hover = async () => { for (let i = 0; i < 25; i++) await page.mouse.move(box.x + box.width * 0.2 + (i % 4), box.y + box.height * 0.35 + (i % 3)); await page.waitForTimeout(600) }
    await hover()
    const light = await dominant()
    expect(light, 'hay un píxel encendido').not.toBeNull()
    expect(Math.abs(light[0] - 179)).toBeLessThan(14); expect(Math.abs(light[1] - 48)).toBeLessThan(14)
    await page.locator('.theme-toggle').click()
    await hover()
    const dark = await dominant()
    expect(dark).not.toBeNull()
    expect(Math.abs(dark[0] - 255)).toBeLessThan(14); expect(Math.abs(dark[1] - 130)).toBeLessThan(14)
  })

  test('movimiento reducido: no hay animación continua; solo se dibuja al mover el puntero', async ({ page }) => {
    await page.addInitScript(() => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => { window.__raf++; return o(cb) } })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/es/')
    await hydrated(page)
    await page.waitForTimeout(400)
    const snap = () => net(page).evaluate((c) => c.toDataURL())
    const a = await snap(); const r0 = await page.evaluate(() => window.__raf)
    await page.waitForTimeout(700)
    expect(await snap()).toBe(a)
    expect(await page.evaluate(() => window.__raf), 'sin cuadros nuevos en reposo').toBe(r0)
    const box = await page.locator('.canvas').boundingBox()
    await page.mouse.move(box.x + box.width * .2, box.y + box.height * .35, { steps: 6 })
    await page.waitForTimeout(100)
    expect(await snap()).not.toBe(a)
  })

  test('con movimiento normal anima; con la pestaña oculta se pausa', async ({ page }) => {
    await page.addInitScript(() => { window.__raf = 0; const o = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = (cb) => { window.__raf++; return o(cb) } })
    await page.goto('/es/')
    await hydrated(page)
    await page.waitForTimeout(300)
    const r0 = await page.evaluate(() => window.__raf)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__raf)).toBeGreaterThan(r0 + 5)
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')) })
    await page.waitForTimeout(100)
    const r1 = await page.evaluate(() => window.__raf)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.__raf)).toBe(r1)
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')) })
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => window.__raf)).toBeGreaterThan(r1 + 5)
  })

  test('sin cuadros largos mientras se mueve el puntero', async ({ page }) => {
    await page.addInitScript(() => { window.__long = []; try { new PerformanceObserver((l) => window.__long.push(...l.getEntries().map((e) => e.duration))).observe({ entryTypes: ['longtask'] }) } catch {} })
    await page.goto('/es/')
    await hydrated(page)
    await page.waitForTimeout(500)
    await page.evaluate(() => { window.__long.length = 0 })
    await sweep(page, async () => {})
    const long = await page.evaluate(() => window.__long)
    console.log(`tareas largas durante el recorrido: ${long.length} ${long.map((d) => d.toFixed(0)).join(',')}`)
    expect(long.filter((d) => d > 100)).toEqual([])
  })

  test('al achicar la ventana por debajo de 761 px el canvas se retira', async ({ page }) => {
    await page.goto('/es/')
    await hydrated(page)
    await expect(net(page)).toHaveCount(1)
    await page.setViewportSize({ width: 700, height: 800 })
    await expect(net(page)).toHaveCount(0)
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(net(page)).toHaveCount(1)
  })
})

test.describe('sin puntero fino', () => {
  test('móvil táctil 390×844: no hay canvas', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 })
    const page = await ctx.newPage()
    await page.goto('/es/')
    await hydrated(page)
    await page.waitForTimeout(300)
    await expect(net(page)).toHaveCount(0)
    expect(await page.evaluate(() => document.querySelectorAll('canvas').length)).toBe(0)
    await ctx.close()
  })
  test('pantalla ancha pero táctil (tableta 1024×768, sin hover): no hay canvas', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true })
    const page = await ctx.newPage()
    await page.goto('/en/')
    await hydrated(page)
    await page.waitForTimeout(300)
    expect(await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)).toBe(false)
    await expect(net(page)).toHaveCount(0)
    await ctx.close()
  })
  test('móvil estrecho 360×640 con ratón: tampoco', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/es/')
    await hydrated(page)
    await expect(net(page)).toHaveCount(0)
  })
  test('sin JavaScript no hay canvas ni nada roto (el HTML del servidor no lo incluye)', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto('/es/')
    await expect(page.locator('canvas')).toHaveCount(0)
    await expect(page.locator('h1')).toBeVisible()
    await ctx.close()
  })
})
