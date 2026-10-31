import { test, expect } from '@playwright/test'

// Primera pantalla (AC-H1, AC-H5, AC-H6, AC-01). Los nodos flotan; Playwright espera que un elemento esté quieto para pulsarlo,
// así que la interacción se prueba con movimiento reducido (que es además un comportamiento exigido).
const NODES = { en: ['Code', 'Projects', 'Demo', 'Journey', 'How I work', 'Interest'], es: ['Código', 'Proyectos', 'Demo', 'Trayectoria', 'Cómo trabajo', 'Interés'] }

for (const [w, h] of [[360, 640], [390, 844]]) {
  for (const lang of ['en', 'es']) {
    test(`móvil ${w}×${h} (${lang}): tesis, resumen, botón de la demo y los seis nodos caben sin desplazarse (AC-H1, AC-01)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(`/${lang}/`)
      await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
      const cta = page.locator('.cta a.btn-primary')
      for (const loc of [page.locator('h1'), page.locator('#summary'), cta, page.locator('.portrait')]) await expect(loc).toBeInViewport({ ratio: 1 })
      for (const name of NODES[lang]) {
        const node = page.getByRole('button', { name })
        await expect(node).toBeInViewport({ ratio: 1 })
        const box = await node.boundingBox()
        expect(box.width, `${name} ancho`).toBeGreaterThanOrEqual(44)
        expect(box.height, `${name} alto`).toBeGreaterThanOrEqual(44)
      }
      const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bottom: document.querySelector('#summary').getBoundingClientRect().bottom, vh: innerHeight }))
      expect(dims.sw).toBeLessThanOrEqual(dims.iw)
      expect(dims.bottom).toBeLessThanOrEqual(dims.vh)
    })
  }
}

test('escritorio 1180×800: retrato, seis nodos, frase y tarjeta sin desplazarse (AC-H1)', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 800 })
  await page.goto('/es/')
  await expect(page.locator('.canvas')).toBeInViewport({ ratio: 1 })
  for (const loc of [page.locator('.portrait'), page.locator('h1'), page.locator('.panel[data-active="true"]')]) await expect(loc).toBeInViewport({ ratio: 1 })
  await expect(page.locator('[data-node]')).toHaveCount(6)
  for (let i = 0; i < 6; i++) await expect(page.locator('[data-node]').nth(i)).toBeInViewport({ ratio: 1 })
})

test('escritorio 1024×768: el lienzo se escala y los nodos no se pisan', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 })
  await page.goto('/en/')
  await expect(page.locator('.canvas')).toBeInViewport({ ratio: 1 })
  const boxes = await page.locator('.node-link').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom] }))
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, b] = [boxes[i], boxes[j]]
    expect(a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1], `${i} y ${j} se solapan`).toBe(true)
  }
})

test.describe('interacción', () => {
  test.use({ reducedMotion: 'reduce' })
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto('/en/')
    await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
  })

  test('elegir un nodo cambia aria-pressed, el panel y la línea activa; Demo es el inicial', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Demo' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#p-demo')).toBeVisible()
    await page.getByRole('button', { name: 'Code' }).click()
    await expect(page.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Demo' })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('#p-code')).toBeVisible()
    await expect(page.locator('#p-demo')).toBeHidden()
    await expect(page.locator('.line[data-on="true"]')).toHaveCount(1)
    await expect(page.locator('#p-code pre.code')).toContainText('"id": "R-02"')
    await expect(page.locator('#p-code pre.code')).toContainText('not used')
  })

  test('teclado: Tab llega a los nodos con foco visible; Enter y Espacio los eligen', async ({ page }) => {
    const node = page.getByRole('button', { name: 'Interest' })
    await node.focus()
    const outline = await node.evaluate((e) => getComputedStyle(e).outlineStyle)
    expect(outline).not.toBe('none')
    await page.keyboard.press('Enter')
    await expect(node).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('#p-interest')).toBeVisible()
    await page.getByRole('button', { name: 'Journey' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByRole('button', { name: 'Journey' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('Cómo trabajo: pestañas Personas y Máquinas con las mismas reglas públicas', async ({ page }) => {
    await page.getByRole('button', { name: 'How I work' }).click()
    await expect(page.getByRole('tab', { name: 'People' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('#tabpanel-people')).toContainText('Tests first, then code.')
    await page.getByRole('tab', { name: 'Machines' }).click()
    await expect(page.locator('#tabpanel-machines')).toContainText('- Tests first, then code.')
    await expect(page.locator('#tabpanel-machines')).toContainText('No AI model call per visitor click.')
    await expect(page.locator('#tabpanel-people')).toBeHidden()
  })

  test('con movimiento reducido el panel aparece completo al instante, sin redirigir', async ({ page }) => {
    await page.getByRole('button', { name: 'Interest' }).click()
    await expect(page.locator('#p-interest .t-off')).toHaveText('')
    await page.waitForTimeout(2300)
    expect(new URL(page.url()).pathname).toBe('/en/')
  })

  test('no hay aria-live en la primera pantalla', async ({ page }) => {
    await expect(page.locator('.first [aria-live]')).toHaveCount(0)
  })

  test('sin errores de consola ni avisos de CSP al cargar y elegir nodos', async ({ page }) => {
    const bad = []
    page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) bad.push(m.text()) })
    await page.reload()
    await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
    await page.getByRole('button', { name: 'Code' }).click()
    expect(bad).toEqual([])
  })
})

test.describe('escritura de los paneles (AC-H5), con movimiento normal', () => {
  test.use({ reducedMotion: 'no-preference' })
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto('/en/')
    await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
  })
  test('el panel termina de escribirse en ≤ 2 s', async ({ page }) => {
    await page.getByRole('button', { name: 'Code' }).click({ force: true })
    await expect(page.locator('#p-code .t-off')).not.toHaveText('', { timeout: 500 }) // al empezar queda texto por escribir
    await expect(page.locator('#p-code .t-off')).toHaveText('', { timeout: 2000 })
  })
  test('un clic en el panel lo completa al instante', async ({ page }) => {
    await page.getByRole('button', { name: 'Code' }).click({ force: true })
    await expect(page.locator('#p-code .t-off')).not.toHaveText('', { timeout: 500 })
    await page.locator('#p-code').click()
    await expect(page.locator('#p-code .t-off')).toHaveText('', { timeout: 300 })
  })
  for (const [node, panel] of [['Projects', 'projects'], ['Demo', 'demo'], ['Journey', 'journey'], ['Interest', 'interest']]) {
    test(`un clic en el panel ${panel} lo completa al instante (AC-H5, los seis paneles)`, async ({ page }) => {
      if (panel === 'demo') await page.getByRole('button', { name: 'Code' }).click({ force: true }) // Demo ya es el activo: se cambia antes para que se escriba
      await page.getByRole('button', { name: node }).click({ force: true })
      await expect(page.locator(`#p-${panel} .t-off`)).not.toHaveText('', { timeout: 500 })
      await page.locator(`#p-${panel}`).click({ position: { x: 5, y: 5 } })
      await expect(page.locator(`#p-${panel} .t-off`)).toHaveText('', { timeout: 300 })
    })
  }
  test('Esc lo completa al instante y no cambia de página', async ({ page }) => {
    await page.getByRole('button', { name: 'Interest' }).click({ force: true })
    await expect(page.locator('#p-interest .t-off')).not.toHaveText('', { timeout: 500 })
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-interest .t-off')).toHaveText('', { timeout: 300 })
    expect(new URL(page.url()).pathname).toBe('/en/')
  })
})

test('móvil bajo: la tarjeta se abre como hoja al pulsar un nodo y Esc la cierra', async ({ page }) => {
  test.slow()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
  await expect(page.locator('#p-demo')).toBeHidden()
  await page.getByRole('button', { name: 'Interest' }).click()
  await expect(page.locator('#p-interest')).toBeVisible()
  await expect(page.locator('#summary')).toBeInViewport({ ratio: 1 }) // la hoja se superpone y no empuja el diseño
  await page.keyboard.press('Escape')
  await expect(page.locator('#p-interest')).toBeHidden()
})

test('móvil bajo: volver a pulsar el mismo nodo cierra la hoja, y axe no halla violaciones con la hoja abierta (AC-H6)', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
  await page.getByRole('button', { name: 'Code' }).click()
  await expect(page.locator('#p-code')).toBeVisible()
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
  await page.getByRole('button', { name: 'Code' }).click()
  await expect(page.locator('#p-code')).toBeHidden()
})

test('móvil bajo: la hoja del panel Código no tapa la fila de nodos (se puede cambiar de nodo)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/en/')
  await page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')
  await page.getByRole('button', { name: 'Code' }).click()
  const sheet = await page.locator('#p-code').boundingBox()
  const nodes = await page.locator('.nodes').boundingBox()
  expect(sheet.y).toBeGreaterThanOrEqual(nodes.y + nodes.height)
  await page.getByRole('button', { name: 'Interest' }).click() // sin force: el clic llega al nodo
  await expect(page.locator('#p-interest')).toBeVisible()
})

test.describe('Esc, hash y 404 (revisión adversarial, 2026-10-31)', () => {
  test.use({ reducedMotion: 'no-preference' })
  const hydrated = (page) => page.waitForFunction(() => document.querySelector('.node-link')?.tagName === 'BUTTON')

  test('Esc justo después de "Cómo trabajo" (sin escritura) cierra la hoja a la primera', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/en/')
    await hydrated(page)
    await page.getByRole('button', { name: 'How I work' }).click({ force: true })
    await expect(page.locator('#p-how')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-how')).toBeHidden()
  })

  test('cambiar de nodo con la escritura a medias: Esc completa el nuevo texto y no cierra la hoja (temporizador viejo)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/en/')
    await hydrated(page)
    await page.getByRole('button', { name: 'Code' }).click({ force: true })
    await page.waitForTimeout(1200)
    await page.getByRole('button', { name: 'Demo' }).click({ force: true })
    await expect(page.locator('#p-demo .t-off')).not.toHaveText('')
    await page.waitForTimeout(700) // ya pasaron ~1,9 s desde el primer clic: el temporizador viejo habría desactivado la guarda
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-demo .t-off')).toHaveText('', { timeout: 300 })
    await expect(page.locator('#p-demo')).toBeVisible() // completó el texto; la hoja sigue abierta
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-demo')).toBeHidden()
  })

  for (const [w, h, label] of [[1180, 800, 'escritorio'], [360, 640, 'móvil bajo']]) {
    test(`con #p-code en la URL (${label}) elegir otro nodo sí cambia el panel; un hash viejo no lo deja pegado`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/en/#p-code')
      await hydrated(page)
      await expect(page.locator('#p-code')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true')
      await page.getByRole('button', { name: 'Interest' }).click({ force: true })
      await expect(page.locator('#p-interest')).toBeVisible()
      await expect(page.locator('#p-code')).toBeHidden()
      if (w < 400) {
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await expect(page.locator('#p-interest')).toBeHidden() // y la hoja se puede cerrar
      }
    })
  }

  test('la 404 se hidrata como 404: sin errores de React ni cambio a la portada', async ({ page }) => {
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('/404.html')
    await page.waitForTimeout(800)
    await expect(page.locator('h1')).not.toContainText('I build AI systems')
    await expect(page.locator('.first')).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('el enlace antiguo /es/?evento=… redirige a la página de la demo conservando el evento', async ({ page }) => {
    await page.goto('/es/?evento=ab.cd')
    await page.waitForURL(/\/es\/demo\/\?evento=ab\.cd$/)
  })

  test('los enlaces de la barra superior miden al menos 24×24 px en móvil (WCAG 2.5.8)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/es/')
    for (const a of await page.locator('.bar a:not(.skip)').all()) {
      const b = await a.boundingBox()
      expect(b.width).toBeGreaterThanOrEqual(24)
      expect(b.height).toBeGreaterThanOrEqual(24)
    }
  })
})

test.describe('sin JavaScript (AC-H2)', () => {
  test.use({ javaScriptEnabled: false })
  test('los seis nodos son enlaces, los textos de los paneles están y :target elige el panel', async ({ page }) => {
    await page.goto('/es/')
    await expect(page.locator('a[data-node]')).toHaveCount(6)
    await expect(page.locator('#p-demo')).toBeVisible()
    await expect(page.locator('#p-code')).toBeHidden()
    await expect(page.locator('#p-code pre.code')).toContainText('$ cat ruleset.v1.json')
    await page.goto('/es/#p-code')
    await expect(page.locator('#p-code')).toBeVisible()
    await expect(page.locator('#p-demo')).toBeHidden()
    await expect(page.locator('h1')).toContainText('Construyo sistemas con IA')
    await expect(page.locator('#summary li')).toHaveCount(5)
  })
})

test.describe('páginas nuevas', () => {
  for (const [path, h1] of [['/en/projects/', 'Projects'], ['/es/proyectos/', 'Proyectos'], ['/en/journey/', 'Journey'], ['/es/trayectoria/', 'Trayectoria'], ['/en/demo/', 'Live demo']]) {
    test(`${path} carga con su h1, canonical y enlace de regreso`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator('h1')).toContainText(h1)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://dennysh.com${path}`)
      await expect(page.locator('main a', { hasText: /home screen|primera pantalla/ })).toHaveAttribute('href', path.startsWith('/es') ? '/es/' : '/en/')
    })
  }
  test('Proyectos muestra solo Caja Cercana y Super Gol Kids, en producción, sin marcadores (P-24)', async ({ page }) => {
    await page.goto('/en/projects/')
    await expect(page.locator('.card')).toHaveCount(2)
    await expect(page.locator('.card .badge-production')).toHaveCount(2)
    await expect(page.locator('[data-pending]:not([data-pending="P-06"])')).toHaveCount(0) // solo queda la etiqueta autorizada del repositorio del bot (P-06)
  })
})
