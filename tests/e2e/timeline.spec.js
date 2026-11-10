import { test, expect } from '@playwright/test'

// Trayectoria como línea de tiempo (trabajo B). La compilación e2e declara fotos de relleno solo en Fibratelecom (2) y MS@Net (1);
// el resto de las entradas no tiene, así que cada prueba ve a la vez entradas con y sin fotos.
const PATH = { es: '/es/trayectoria/', en: '/en/journey/' }
const TITLES = {
  es: ['Bot Caja Cercana', 'Super Gol Kids', 'Desarrollo de Software', 'Técnico de Campo / Gestión de Activos', 'ISP Manager', 'Técnico de Redes (contratista CNT)', 'Auxiliar Técnico'],
  en: ['Caja Cercana bot', 'Super Gol Kids', 'Software Development', 'Field Technician / Asset Management', 'ISP Manager', 'Network Technician (CNT contractor)', 'Technical Assistant'],
}
const item = (page, i) => page.locator('.tl-item').nth(i)
const ready = async (page, lang) => { await page.goto(PATH[lang]); await page.waitForSelector('a.tl-thumb[role="button"]') }

for (const lang of ['es', 'en']) {
  test(`escritorio (${lang}): fechas a la izquierda, contenido a la derecha, siete entradas en orden y sin desbordes`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await ready(page, lang)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('.tl-item .tl-title')).toHaveCount(7)
    const titles = await page.locator('.tl-item .tl-title').evaluateAll((els) => els.map((e) => e.firstChild.textContent.trim()))
    expect(titles).toEqual(TITLES[lang])
    const ys = []
    for (let i = 0; i < 7; i++) {
      const w = await item(page, i).locator('.tl-when').boundingBox()
      const b = await item(page, i).locator('.tl-body').boundingBox()
      expect(w.x + w.width, `fecha ${i} a la izquierda del cuerpo`).toBeLessThanOrEqual(b.x + 1)
      ys.push(b.y)
    }
    expect([...ys].sort((a, b) => a - b)).toEqual(ys)
    const d = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }))
    expect(d.sw).toBeLessThanOrEqual(d.iw)
    // Fibratelecom y Presente: dos entradas con "Presente" (en español) y el indicador lleno
    await expect(page.locator('.tl-item[data-current="true"]')).toHaveCount(2)
    await expect(page.locator('.tl-when', { hasText: lang === 'es' ? 'Presente' : 'Present' })).toHaveCount(2)
  })
}

for (const [w, h] of [[360, 640], [390, 844]]) {
  test(`móvil ${w}×${h}: una columna sin desborde, fecha sobre el contenido y miniatura de al menos 44 px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h })
    await ready(page, 'es')
    const d = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }))
    expect(d.sw).toBeLessThanOrEqual(d.iw)
    for (let i = 0; i < 7; i++) {
      const when = await item(page, i).locator('.tl-when').boundingBox()
      const body = await item(page, i).locator('.tl-body').boundingBox()
      expect(when.y + when.height, `fecha ${i} encima`).toBeLessThanOrEqual(body.y + 2)
      expect(body.x + body.width).toBeLessThanOrEqual(w)
    }
    for (const t of await page.locator('a.tl-thumb').all()) {
      const b = await t.boundingBox()
      expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44)
      expect(b.x + b.width).toBeLessThanOrEqual(w)
    }
  })
}

test('con y sin fotos: solo las entradas con fotos tienen miniatura; las demás no dejan hueco ni marco', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'es')
  const has = await page.locator('.tl-item').evaluateAll((els) => els.map((e) => !!e.querySelector('.tl-thumb')))
  expect(has).toEqual([false, false, false, true, true, false, false]) // Fibratelecom y MS@Net
  // una entrada sin fotos ocupa el ancho completo; una con fotos reserva solo la miniatura
  const wTitle = (i) => item(page, i).locator('.tl-title').boundingBox().then((b) => b.width)
  expect(await wTitle(5)).toBeGreaterThan((await wTitle(3)) + 60)
  expect(await page.locator('.tl-item:not([data-photo]) .tl-thumb, .tl-item:not([data-photo]) img').count()).toBe(0)
  // las miniaturas tienen tamaño fijo, lazy y la ampliación lleva alt
  const th = page.locator('a.tl-thumb img').first()
  await expect(th).toHaveAttribute('loading', 'lazy')
  await expect(th).toHaveAttribute('width', /\d+/)
  await expect(th).toHaveAttribute('height', /\d+/)
  await expect(page.locator('.tl-thumb .tl-more')).toHaveText('+1') // Fibratelecom: 2 fotos
})

test('ampliación por teclado: Enter abre, el foco entra, ‹ › y flechas navegan con tope, Esc cierra y el foco vuelve a la miniatura', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'es')
  const thumb = page.locator('a.tl-thumb').first()
  await thumb.focus()
  await page.keyboard.press('Enter')
  const dlg = page.locator('dialog.tl-dialog')
  await expect(dlg).toHaveAttribute('open', '')
  await expect(page.locator('dialog .tl-close')).toBeFocused()
  await expect(page.locator('dialog .tl-count')).toHaveText('Foto 1 de 2')
  await expect(page.locator('dialog img')).toHaveAttribute('alt', 'Foto de prueba 1')
  const prev = page.getByRole('button', { name: 'Foto anterior' }), next = page.getByRole('button', { name: 'Foto siguiente' })
  await expect(prev).toBeDisabled(); await expect(next).toBeEnabled()
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('dialog .tl-count')).toHaveText('Foto 2 de 2')
  await expect(page.locator('dialog img')).toHaveAttribute('alt', 'Foto de prueba 2')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('dialog .tl-count')).toHaveText('Foto 2 de 2') // tope
  await expect(next).toBeDisabled()
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('dialog .tl-count')).toHaveText('Foto 1 de 2')
  // el resto de la página queda inerte: el foco nunca llega a un elemento de fuera del diálogo (puede pasar por el navegador, es decir, por body)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => { const a = document.activeElement; return !a || a === document.body || !!a.closest('dialog') })).toBe(true)
  }
  await page.locator('dialog .tl-close').focus()
  await page.keyboard.press('Escape')
  await expect(dlg).not.toHaveAttribute('open', '')
  await expect(thumb).toBeFocused()
})

test('ampliación con el ratón: clic abre; "Cerrar" y el clic fuera cierran; una sola foto no lleva ‹ ›', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'es')
  await page.locator('a.tl-thumb').nth(0).click()
  await expect(page.locator('dialog.tl-dialog')).toHaveAttribute('open', '')
  await page.getByRole('button', { name: 'Cerrar' }).click()
  await expect(page.locator('dialog.tl-dialog')).not.toHaveAttribute('open', '')
  await page.locator('a.tl-thumb').nth(1).click() // MS@Net: una foto
  await expect(page.locator('dialog .tl-count')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Foto siguiente' })).toHaveCount(0)
  await page.mouse.click(8, 8) // sobre el fondo oscurecido
  await expect(page.locator('dialog.tl-dialog')).not.toHaveAttribute('open', '')
})

test('móvil 390: la ampliación cabe en la pantalla y se maneja con los botones ‹ ›', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page, 'es')
  await page.locator('a.tl-thumb').first().click()
  const box = await page.locator('dialog.tl-dialog').boundingBox()
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(844)
  for (const b of await page.locator('dialog button').all()) { const bb = await b.boundingBox(); expect(bb.width).toBeGreaterThanOrEqual(44); expect(bb.height).toBeGreaterThanOrEqual(44) }
  await page.getByRole('button', { name: 'Foto siguiente' }).click()
  await expect(page.locator('dialog .tl-count')).toHaveText('Foto 2 de 2')
})

test('en inglés la ampliación habla inglés', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'en')
  await expect(page.locator('a.tl-thumb').first()).toHaveAttribute('aria-label', /Enlarge photo: Test photo 1 \(Photo 1 of 2\)/)
  await page.locator('a.tl-thumb').first().click()
  await expect(page.locator('dialog .tl-count')).toHaveText('Photo 1 of 2')
  await expect(page.getByRole('button', { name: 'Close' })).toBeVisible()
})

test('Presente: el indicador de la entrada actual se distingue; al pasar el puntero no se atenúa nada y no se depende del hover', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'es')
  const dot = (i) => item(page, i).locator('.tl-body').evaluate((e) => { const s = getComputedStyle(e, '::before'); return { bg: s.backgroundColor, sh: s.boxShadow } })
  const now = await dot(3), past = await dot(4)
  expect(now.bg).not.toBe(past.bg)
  expect(now.sh).not.toBe('none'); expect(past.sh).toBe('none')
  const op = () => page.locator('.tl-item').evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity))
  await item(page, 4).hover()
  expect((await op()).every((o) => o === '1')).toBe(true)
  const c = await item(page, 4).locator('.tl-title').evaluate((e) => getComputedStyle(e).color)
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())
  expect(accent).toMatch(/^#/)
  expect(c).not.toBe(await item(page, 5).locator('.tl-title').evaluate((e) => getComputedStyle(e).color))
})

test('movimiento reducido: sin transiciones en la línea de tiempo', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await ready(page, 'es')
  const d = await page.locator('.tl-title').first().evaluate((e) => getComputedStyle(e).transitionDuration)
  expect(d).toBe('0s')
})

test('la miniatura no es una trampa sin JavaScript: es un enlace al archivo de la foto', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } })
  const page = await ctx.newPage()
  await page.goto(PATH.es)
  await expect(page.locator('.tl-item')).toHaveCount(7)
  const t = page.locator('a.tl-thumb').first()
  await expect(t).toHaveAttribute('href', '/images/dennys-portrait-360.webp')
  await expect(t).not.toHaveAttribute('role', 'button')
  await ctx.close()
})

for (const scheme of ['light', 'dark']) {
  for (const lang of ['es', 'en']) {
    test.describe(`axe y contraste (${lang}, tema ${scheme})`, () => {
      test.use({ colorScheme: scheme, reducedMotion: 'reduce' })
      test('la página y el diálogo abierto no tienen violaciones WCAG 2.2 AA; el texto mide AA', async ({ page }) => {
        const { default: AxeBuilder } = await import('@axe-core/playwright')
        await page.setViewportSize({ width: 1280, height: 800 })
        await ready(page, lang)
        const run = async (where) => {
          const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
          expect(r.violations.map((v) => `${where} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
        }
        await run('página')
        await page.locator('a.tl-thumb').first().click()
        await expect(page.locator('dialog.tl-dialog')).toHaveAttribute('open', '')
        await run('diálogo')
      })
    })
  }
}
