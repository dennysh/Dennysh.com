import { test, expect } from '@playwright/test'

// Crítica Impeccable 1 (02-DOCS/critica-impeccable-1.md): lo que el CSS promete se mide en el navegador (estilos calculados, no texto de la hoja).
const PAGES = ['/es/', '/en/', '/es/codigo/', '/es/proyectos/', '/es/demo/', '/es/trayectoria/', '/es/como-trabajo/', '/es/interes/', '/es/contacto/', '/en/contact/']
const hydrated = (page) => page.waitForSelector('.first[data-js]')

test.describe('panel de vista previa (C-03)', () => {
  test('escritorio: el pie "Abrir" es sticky y sigue visible con el panel desplazado hasta el final', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/es/')
    await hydrated(page)
    for (const name of ['Código', 'Cómo trabajo']) {
      await page.getByRole('link', { name, exact: true }).hover()
      const panel = page.locator('.panel[data-active="true"]')
      await expect(panel.locator('.panel-open')).toHaveCSS('position', 'sticky')
      await panel.evaluate((p) => { p.scrollTop = p.scrollHeight })
      const btn = await panel.locator('.panel-open .btn').boundingBox()
      const box = await panel.boundingBox()
      expect(btn.y, `${name}: botón bajo el borde superior`).toBeGreaterThanOrEqual(box.y)
      expect(btn.y + btn.height, `${name}: botón dentro del panel`).toBeLessThanOrEqual(box.y + box.height + 1)
      expect(await panel.locator('.code').evaluate((c) => getComputedStyle(c).overflowY)).toBe('visible') // un solo scroll
    }
  })

  test('móvil 390×844: ningún panel tiene scroll sobrante (el pie compensa el relleno de móvil)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/es/')
    await hydrated(page)
    for (const name of ['Código', 'Proyectos', 'Demo', 'Trayectoria', 'Cómo trabajo', 'Interés']) {
      await page.getByRole('link', { name, exact: true }).hover()
      const extra = await page.locator('.panel[data-active="true"]').evaluate((p) => p.scrollHeight - p.clientHeight)
      expect(extra, `${name}: scrollHeight − clientHeight`).toBeLessThanOrEqual(1)
    }
  })
})

test.describe('Proyectos (C-02, C-06)', () => {
  test('la tarjeta de bots anuncia "Ver los 4 bots" (se oculta al abrir), mide 44 px y los títulos de tarjeta son h2 sin margen', async ({ page }) => {
    await page.goto('/es/proyectos/')
    const d = page.locator('details.bots')
    await expect(d.locator('.bots-hint')).toHaveText('Ver los 4 bots')
    expect((await d.locator('summary').boundingBox()).height).toBeGreaterThanOrEqual(44)
    await d.locator('summary').click()
    await expect(d.locator('.bots-hint')).toBeHidden()
    const h2 = page.locator('.card h2').first()
    await expect(h2).toHaveCSS('margin-top', '0px')
    expect(await h2.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(20)
    await page.goto('/en/projects/')
    await expect(page.locator('details.bots .bots-hint')).toHaveText('See the 4 bots')
  })
  test('en el panel de la portada la pista no es más grande que el título', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 640 })
    await page.goto('/es/')
    await hydrated(page)
    await page.getByRole('link', { name: 'Proyectos', exact: true }).hover()
    const sizes = await page.locator('#p-projects summary').evaluate((s) => [parseFloat(getComputedStyle(s).fontSize), parseFloat(getComputedStyle(s.querySelector('.bots-hint')).fontSize)])
    expect(sizes[1]).toBeLessThanOrEqual(sizes[0])
  })
})

test('Contacto sin JavaScript: un solo botón de correo en el cuerpo de la página (C-01)', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  for (const path of ['/es/contacto/', '/en/contact/']) {
    await page.goto(path)
    await expect(page.locator('main a[href^="mailto:"]')).toHaveCount(1)
    await expect(page.locator('main a.btn-primary[href^="mailto:"]')).toHaveCount(1)
  }
  await ctx.close()
})

for (const [label, vp, min] of [['móvil 390×844', { width: 390, height: 844 }, 44], ['escritorio 1440×900', { width: 1440, height: 900 }, 24]]) {
  test(`objetivos táctiles (${label}): ningún control que no esté dentro de una frase mide menos de ${min} px (C-07)`, async ({ page }) => {
    await page.setViewportSize(vp)
    const bad = []
    for (const path of PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const found = await page.evaluate((m) => [...document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea')]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'inline' && (r.width < m || r.height < m) })
        .map((e) => `${e.tagName.toLowerCase()}.${e.className || ''}[${(e.textContent || '').trim().slice(0, 18)}] ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`), min)
      bad.push(...found.map((f) => `${path} ${f}`))
    }
    expect(bad).toEqual([])
  })
}

test('el enlace de salto del inicio tiene contraste suficiente con foco, en claro y oscuro (C-05)', async ({ browser }) => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto('/es/')
    await page.keyboard.press('Tab')
    const { fg, bg } = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); const n = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); return { fg: n(cs.color), bg: n(cs.backgroundColor) } })
    const [a, b] = [lum(fg), lum(bg)]
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), scheme).toBeGreaterThanOrEqual(4.5)
    await ctx.close()
  }
})

test('móvil: la barra de siete enlaces deja a la vista la página actual y se difumina por la derecha (C-09)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/es/interes/')
  await page.waitForFunction(() => document.querySelector('.topbar nav').scrollLeft > 0)
  const cur = await page.locator('.topbar nav a[aria-current="page"]').boundingBox()
  expect(cur.x).toBeGreaterThanOrEqual(0)
  expect(cur.x + cur.width).toBeLessThanOrEqual(390)
  expect(await page.locator('.topbar nav').evaluate((n) => getComputedStyle(n).maskImage)).toContain('linear-gradient')
})

test('el brillo de fondo de las páginas interiores no baja el contraste del texto atenuado ni de los enlaces por debajo de 4,5:1 (C-04)', async ({ browser }) => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto('/es/interes/')
    const t = await page.evaluate(() => {
      const probe = document.createElement('i'); document.body.appendChild(probe)
      const col = (v) => { probe.style.color = `var(${v})`; const m = getComputedStyle(probe).color.match(/[\d.]+/g).map(Number); probe.remove; return m }
      const glow = col('--glow-core'); const op = parseFloat(getComputedStyle(document.querySelector('.page'), '::before').opacity)
      const out = { bg: col('--bg'), text: col('--text'), muted: col('--muted'), accent: col('--accent'), glow, op }
      probe.remove(); return out
    })
    const a = t.glow[3] ?? 1
    const mix = t.bg.slice(0, 3).map((v, i) => v * (1 - a * t.op) + t.glow[i] * a * t.op) // el peor punto: el centro del brillo sobre el fondo
    for (const k of ['text', 'muted', 'accent']) expect(ratio(t[k], mix), `${scheme} ${k} sobre el brillo`).toBeGreaterThanOrEqual(4.5)
    await ctx.close()
  }
})
