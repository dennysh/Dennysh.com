import { test, expect } from '@playwright/test'
import { setStoredTheme } from './helpers.js'

// Crítica Impeccable 1 (02-DOCS/critica-impeccable-1.md): lo que el CSS promete se mide en el navegador (estilos calculados, no texto de la hoja).
const PAGES = ['/es/', '/en/', '/es/codigo/', '/es/proyectos/', '/es/trayectoria/', '/es/como-trabajo/', '/es/sobre-mi/', '/es/contacto/', '/en/contact/']
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
      await expect(panel.locator('h2')).toHaveText(name) // el panel ya es el de este nodo (sin carrera con el hover)
      await expect(panel.locator('.panel-open')).toHaveCSS('position', 'sticky')
      await panel.evaluate((p) => { p.scrollTop = p.scrollHeight })
      const btn = await panel.locator('.panel-open .btn').boundingBox()
      const box = await panel.boundingBox()
      expect(btn.y, `${name}: botón bajo el borde superior`).toBeGreaterThanOrEqual(box.y)
      expect(btn.y + btn.height, `${name}: botón dentro del panel`).toBeLessThanOrEqual(box.y + box.height + 1)
      expect(await panel.locator('.code').evaluate((c) => getComputedStyle(c).overflowY)).toBe('visible') // un solo scroll
    }
  })

})

test.describe('Proyectos (C-02, C-06)', () => {
  test('la tarjeta de bots nace abierta (pista oculta), al cerrarla anuncia "Ver los 4 bots", mide 44 px y los títulos de tarjeta son h2 sin margen', async ({ page }) => {
    await page.goto('/es/proyectos/')
    const d = page.locator('details.bots')
    await expect(d).toHaveAttribute('open', '')
    await expect(d.locator('.bots-hint')).toBeHidden()
    expect((await d.locator('summary').boundingBox()).height).toBeGreaterThanOrEqual(44)
    await d.locator('summary').click()
    await expect(d.locator('.bots-hint')).toHaveText('Ver los 4 bots')
    const h2 = page.locator('.card h2').first()
    await expect(h2).toHaveCSS('margin-top', '0px')
    expect(await h2.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))).toBeLessThan(20)
    await page.goto('/en/projects/')
    await expect(page.locator('details.bots .bots-hint')).toHaveText('See the 4 bots')
    await expect(page.locator('details.bots')).toHaveAttribute('open', '')
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
  for (const enabled of [false, true]) {
    test(`objetivos táctiles (${label}, formulario ${enabled ? 'activo' : 'apagado'}): ningún control que no esté dentro de una frase mide menos de ${min} px (C-07)`, async ({ page }) => {
      // Estado fijo del formulario: sin esto el resultado dependía de si la API de la vista previa respondía a tiempo.
      await page.route('**/api/contact', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled }) }))
      await page.route('https://challenges.cloudflare.com/**', (route) => route.abort())
      await page.setViewportSize(vp)
      const bad = []
      for (const path of PAGES) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        if (path.includes('contact')) await expect(page.locator(enabled ? 'form[data-contact-form]' : '[data-contact-form="disabled"]')).toBeAttached()
        const found = await page.evaluate((m) => [...document.querySelectorAll('a[href], button, summary, input:not([type=hidden]), select, textarea')]
          // radios y casillas: el objetivo es la etiqueta que los envuelve, no el círculo de 20 px
          .map((e) => (e.matches('input[type=radio], input[type=checkbox]') && e.closest('label') ? e.closest('label') : e))
          .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'inline' && (r.width < m || r.height < m) })
          .map((e) => `${e.tagName.toLowerCase()}.${e.className || ''}[${(e.textContent || '').trim().slice(0, 18)}] ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`), min)
        bad.push(...found.map((f) => `${path} ${f}`))
      }
      expect(bad).toEqual([])
    })
  }
}

test('el enlace de salto del inicio tiene contraste suficiente con foco, en claro y oscuro (C-05)', async ({ browser }) => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    await setStoredTheme(ctx, scheme)
    const page = await ctx.newPage()
    await page.goto('/es/')
    await page.keyboard.press('Tab')
    const { fg, bg } = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); const n = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number); return { fg: n(cs.color), bg: n(cs.backgroundColor) } })
    const [a, b] = [lum(fg), lum(bg)]
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), scheme).toBeGreaterThanOrEqual(4.5)
    await ctx.close()
  }
})

for (const [width, height] of [[390, 844], [360, 640]]) {
  test(`móvil ${width}×${height}: la barra de las páginas interiores pasa los enlaces a una segunda fila, sin cortes, sin desplazamiento lateral y con 44 px (C-09)`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    for (const path of ['/es/sobre-mi/', '/en/about/', '/es/contacto/', '/es/como-trabajo/']) {
      await page.goto(path)
      const m = await page.locator('.topbar nav').evaluate((nav) => {
        const r = nav.getBoundingClientRect()
        const links = [...nav.querySelectorAll('a')].map((a) => { const b = a.getBoundingClientRect(); return { l: b.left, r: b.right, h: b.height, clipped: a.scrollWidth > a.clientWidth + 1 } })
        return { navScroll: nav.scrollWidth > nav.clientWidth, links, navLeft: r.left, navRight: r.right, sw: document.documentElement.scrollWidth, iw: innerWidth }
      })
      expect(m.navScroll, path).toBe(false)
      expect(m.sw, path).toBeLessThanOrEqual(m.iw)
      expect(m.links, path).toHaveLength(6)
      for (const l of m.links) { expect(l.l, path).toBeGreaterThanOrEqual(0); expect(l.r, path).toBeLessThanOrEqual(width); expect(l.h, path).toBeGreaterThanOrEqual(44); expect(l.clipped, path).toBe(false) }
      await expect(page.locator('.topbar nav a[aria-current="page"]')).toHaveCount(1)
    }
  })
}

test('el brillo de fondo de las páginas interiores no baja el contraste del texto atenuado ni de los enlaces por debajo de 4,5:1 (C-04)', async ({ browser }) => {
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05)
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    await setStoredTheme(ctx, scheme)
    const page = await ctx.newPage()
    await page.goto('/es/sobre-mi/')
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

// ---------- medidas de lo que antes solo se fijaba por texto de CSS (hallazgos del refutador de pruebas) ----------
test('Cómo trabajo: los cinco pasos se reparten 3 + 2 en pantalla ancha, el diagrama se ve en escritorio y se oculta en móvil (C-11, C-26)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/es/como-trabajo/')
  await expect(page.locator('.diagram')).toBeVisible()
  const ys = await page.locator('.steps > li').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)))
  expect(ys).toHaveLength(5)
  const rows = [...new Set(ys)]
  expect(rows).toHaveLength(2)
  expect(ys.filter((y) => y === rows[0])).toHaveLength(3)
  expect(ys.filter((y) => y === rows[1])).toHaveLength(2)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.diagram')).toBeHidden()
  await expect(page.locator('.steps > li')).toHaveCount(5) // la lista sigue ahí: el diagrama no era el único portador de la información
})

test('las reglas no tienen pestaña lateral y un aviso "por confirmar" no parece un error (C-14, C-17)', async ({ page }) => {
  await page.goto('/es/como-trabajo/')
  const r = await page.locator('.rules li').first().evaluate((e) => { const c = getComputedStyle(e); return [c.borderLeftWidth, c.borderRightWidth, c.borderTopWidth] })
  expect(new Set(r).size).toBe(1) // el borde izquierdo mide lo mismo que los demás
  // Contacto ya no lleva ningún «por confirmar»: se mide el estilo de la clase con un elemento de prueba.
  const pend = await page.evaluate(() => { const e = document.createElement('span'); e.className = 'pending'; document.body.appendChild(e); const c = getComputedStyle(e); return { style: c.borderTopStyle, bg: c.backgroundColor, bottom: c.borderBottomStyle } })
  expect(pend.style).not.toBe('dashed')
  expect(pend.bottom).not.toBe('dashed')
  expect(pend.bg).toBe('rgba(0, 0, 0, 0)')
})

test('texto visible de 12 px como mínimo en todas las páginas, salvo las etiquetas de los nodos en móvil (C-08)', async ({ page }) => {
  const bad = []
  for (const [vp, allowNodes] of [[{ width: 390, height: 844 }, true], [{ width: 1440, height: 900 }, false]]) {
    await page.setViewportSize(vp)
    for (const path of PAGES) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const small = await page.evaluate((allow) => {
        const out = []
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
        for (let t = walker.nextNode(); t; t = walker.nextNode()) {
          if (!t.textContent.trim()) continue
          const e = t.parentElement
          if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE'].includes(e.tagName)) continue
          const r = e.getBoundingClientRect(); const c = getComputedStyle(e)
          if (r.width === 0 || r.height === 0 || c.visibility === 'hidden') continue
          if (allow && e.closest('.node-link')) continue
          const px = parseFloat(c.fontSize)
          if (px < 12) out.push(`${e.tagName.toLowerCase()}.${e.className || ''} ${px}px "${t.textContent.trim().slice(0, 20)}"`)
        }
        return out
      }, allowNodes)
      bad.push(...[...new Set(small)].map((x) => `${vp.width} ${path} ${x}`))
    }
  }
  expect(bad).toEqual([])
})

test('los nodos dejan de flotar al apuntarlos y al enfocarlos (con movimiento permitido) (C-24)', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/es/')
  await hydrated(page)
  const play = (name) => page.getByRole('link', { name, exact: true }).evaluate((e) => getComputedStyle(e).animationPlayState)
  expect(await play('Trayectoria')).toBe('running')
  await page.getByRole('link', { name: 'Trayectoria', exact: true }).focus()
  expect(await play('Trayectoria')).toBe('paused')
})

test('móvil: la barra del inicio mantiene su altura aunque sus enlaces midan 44 px (C-07)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/es/')
  await hydrated(page)
  expect((await page.locator('.bar').boundingBox()).height).toBeLessThanOrEqual(48)
  for (const name of ['CV', 'EN']) expect((await page.locator('.bar').getByRole('link', { name, exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(44)
})

// El anillo (y las líneas) quedan detrás del retrato: rodea la cabeza y pasa tras el cuello y los hombros; nodos y paneles siguen encima.
test.describe('anillo detrás del retrato (escritorio)', () => {
  for (const theme of ['light', 'dark']) {
    test(`1280×800 (${theme}): con un nodo señalado, el anillo queda por debajo del retrato; nodos, barra y panel por encima`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
      await setStoredTheme(page, theme)
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/es/')
      await hydrated(page)
      await page.getByRole('link', { name: 'Trayectoria', exact: true }).hover()
      await expect(page.locator('.ring')).toHaveAttribute('data-on', 'true')
      await expect(page.locator('.panel[data-active="true"]')).toBeVisible()
      const m = await page.evaluate(() => {
        const q = (s) => document.querySelector(s)
        const svg = q('svg.lines'), img = q('.portrait'), ring = q('.ring')
        svg.style.pointerEvents = 'auto' // el SVG no recibe puntero; para medir el orden de pintado se le da puntero solo en esta prueba
        // Orden de apilamiento real: lo que el navegador pinta arriba en un punto donde el anillo cruza el cuerpo.
        const ctm = svg.getScreenCTM(), pr = img.getBoundingClientRect()
        const L = ring.getTotalLength()
        const pts = Array.from({ length: 720 }, (_, i) => { const p = ring.getPointAtLength((L * i) / 719); const d = new DOMPoint(p.x, p.y).matrixTransform(ctm); return [d.x, d.y] })
        const onBody = pts.filter(([x, y]) => x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom)
        const tops = onBody.map(([x, y]) => { const st = document.elementsFromPoint(x, y); return st.indexOf(ring) === -1 || st.indexOf(img) < st.indexOf(ring) })
        const seen = onBody.filter(([x, y]) => document.elementsFromPoint(x, y).includes(ring)).length
        const z = (s) => getComputedStyle(q(s)).zIndex
        return { onBody: onBody.length, seen, imgAboveRing: tops.every(Boolean), svgZ: z('svg.lines'), navZ: z('nav.nodes'), barZ: z('.bar'), imgZ: z('.portrait'), nodeHit: !!document.elementFromPoint(...(() => { const r = q('.node-link').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2] })())?.closest('.node-link') }
      })
      expect(m.onBody, 'el anillo cruza el cuerpo del retrato (si no, la prueba no mide nada)').toBeGreaterThan(0)
      expect(m.seen, 'el anillo es detectable bajo el retrato (la medición no es vacía)').toBeGreaterThan(0)
      expect(m.imgAboveRing, 'en todo punto del anillo sobre el retrato, el retrato se pinta encima').toBe(true)
      expect(m.svgZ).toBe('-1')
      expect(m.navZ).toBe('7'); expect(m.barZ).toBe('6')
      expect(m.nodeHit).toBe(true) // el nodo sigue recibiendo el puntero
      const panel = await page.locator('.panel[data-active="true"]').boundingBox()
      const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('.panel'), [panel.x + panel.width / 2, panel.y + 20])
      expect(hit, 'el panel sigue encima').toBe(true)
      await page.locator('.canvas').screenshot({ path: info.outputPath(`anillo-${theme}.png`) })
    })
  }
})

// La Demo salió de la primera pantalla: cinco nodos equilibrados, ninguna tarjeta en reposo y la tarjeta solo mientras se señala o enfoca un nodo.
test.describe('primera pantalla sin Demo (escritorio)', () => {
  for (const theme of ['light', 'dark']) {
    test(`1280×800 (${theme}): cinco nodos, reposo sin tarjeta, tarjeta al señalar y de vuelta al reposo al salir`, async ({ page }, info) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
      await setStoredTheme(page, theme)
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/es/')
      await hydrated(page)
      await expect(page.locator('a[data-node]')).toHaveCount(5)
      await expect(page.getByRole('link', { name: 'Demo', exact: true })).toHaveCount(0)
      await expect(page.locator('.panel:visible')).toHaveCount(0)
      await expect(page.locator('.ring')).not.toHaveAttribute('data-on', 'true')
      await page.locator('.canvas').screenshot({ path: info.outputPath(`reposo-${theme}.png`) })
      await page.getByRole('link', { name: 'Proyectos', exact: true }).hover()
      await expect(page.locator('#p-projects')).toBeVisible()
      await expect(page.locator('.panel:visible')).toHaveCount(1)
      await page.locator('.canvas').screenshot({ path: info.outputPath(`señalado-${theme}.png`) })
      await page.mouse.move(5, 5)
      await expect(page.locator('.panel:visible')).toHaveCount(0)
      await expect(page.locator('.ring')).not.toHaveAttribute('data-on', 'true')
    })
  }
  test('el reparto es equilibrado: nodos simétricos respecto al retrato, Trayectoria sobre el eje y sin pisar la barra', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es/')
    await hydrated(page)
    const m = await page.evaluate(() => {
      const c = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, r: r.right, l: r.left, b: r.bottom, t: r.top } }
      const pr = document.querySelector('.portrait').getBoundingClientRect()
      const hit = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
      const jr = document.querySelector('.n-journey .node-link').getBoundingClientRect()
      const overlapsBar = [...document.querySelectorAll('.bar a, .bar button, .bar-brand')].some((e) => hit(jr, e.getBoundingClientRect()))
      return { axis: pr.x + pr.width / 2, code: c('.n-code .node-icon'), projects: c('.n-projects .node-icon'), journey: c('.n-journey .node-icon'), how: c('.n-how .node-icon'), interest: c('.n-interest .node-icon'), overlapsBar }
    })
    expect(Math.abs(m.journey.x - m.axis)).toBeLessThanOrEqual(1.5)
    expect(m.code.x + m.interest.x).toBeCloseTo(2 * m.axis, -0.3)
    expect(m.projects.x + m.how.x).toBeCloseTo(2 * m.axis, -0.3)
    expect(Math.abs(m.code.y - m.interest.y)).toBeLessThanOrEqual(1.5)
    expect(Math.abs(m.projects.y - m.how.y)).toBeLessThanOrEqual(1.5)
    expect(m.journey.y).toBeLessThan(m.projects.y) // el arco sube hacia el centro
    expect(m.overlapsBar).toBe(false) // Trayectoria no pisa nada de la barra superior
  })
})
