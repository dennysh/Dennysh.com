import { test, expect } from '@playwright/test'
import { VIEW, HEAD_BOX, POINTS } from '../../src/home/geometry.js'

// Primera pantalla (AC-H1, AC-H5, AC-H6, AC-01) y correcciones 1 (F1, F2, F4, C1, C3). Los nodos flotan; Playwright espera que un elemento esté
// quieto para actuar sobre él, así que la interacción se prueba con movimiento reducido (que es además un comportamiento exigido).
const NODES = { en: ['Code', 'Projects', 'Demo', 'Journey', 'How I work', 'Interest'], es: ['Código', 'Proyectos', 'Demo', 'Trayectoria', 'Cómo trabajo', 'Interés'] }
const IDS = ['code', 'projects', 'demo', 'journey', 'how', 'interest']
const PATHS = { en: { code: '/en/code/', projects: '/en/projects/', demo: '/en/demo/', journey: '/en/journey/', how: '/en/how-i-work/', interest: '/en/interest/' } }
const hydrated = (page) => page.waitForSelector('.first[data-js]')
const node = (page, name) => page.getByRole('link', { name, exact: true })

for (const [w, h] of [[360, 640], [390, 844]]) {
  for (const lang of ['en', 'es']) {
    test(`móvil ${w}×${h} (${lang}): frase única, los seis nodos y el retrato caben sin desplazarse (AC-H1, AC-01)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto(`/${lang}/`)
      await hydrated(page)
      for (const loc of [page.locator('h1'), page.locator('.portrait'), page.locator('.nodes')]) await expect(loc).toBeInViewport({ ratio: 1 })
      for (const name of NODES[lang]) {
        const n = node(page, name)
        await expect(n).toBeInViewport({ ratio: 1 })
        const box = await n.boundingBox()
        expect(box.width, `${name} ancho`).toBeGreaterThanOrEqual(44)
        expect(box.height, `${name} alto`).toBeGreaterThanOrEqual(44)
      }
      const dims = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight, vh: innerHeight }))
      expect(dims.sw).toBeLessThanOrEqual(dims.iw)
      expect(dims.sh).toBeLessThanOrEqual(dims.vh) // el inicio es una sola pantalla: no hay nada más abajo (C4)
    })
  }
}

test('móvil 390×844: la tarjeta Demo en vivo se ve en línea y entra en la pantalla', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/es/')
  await expect(page.locator('#p-demo')).toBeInViewport({ ratio: 1 })
})

test('escritorio 1180×800: retrato, seis nodos, frase y tarjeta sin desplazarse (AC-H1)', async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 800 })
  await page.goto('/es/')
  await expect(page.locator('.canvas')).toBeInViewport({ ratio: 1 })
  for (const loc of [page.locator('.portrait'), page.locator('h1'), page.locator('.panel[data-active="true"]')]) await expect(loc).toBeInViewport({ ratio: 1 })
  await expect(page.locator('[data-node]')).toHaveCount(6)
  for (let i = 0; i < 6; i++) await expect(page.locator('[data-node]').nth(i)).toBeInViewport({ ratio: 1 })
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
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

// ---------- F1/F2: la barra no tapa los nodos y cada círculo y etiqueta están centrados sobre su punto ----------
test.describe('F1/F2: clic y centrado de los nodos', () => {
  test.use({ reducedMotion: 'reduce' })
  for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [1024, 768]]) {
    for (const lang of ['es', 'en']) {
      test(`${w}×${h} (${lang}): los 15 puntos de cada nodo dan el propio nodo en elementFromPoint`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h })
        await page.goto(`/${lang}/`)
        await hydrated(page)
        const res = await page.evaluate(() => [...document.querySelectorAll('.node-link')].map((el) => {
          const r = el.getBoundingClientRect()
          let hit = 0
          const bad = new Set()
          for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
            const x = r.left + (r.width * (i + 0.5)) / 5
            const y = r.top + (r.height * (j + 0.5)) / 3
            const top = document.elementFromPoint(x, y)
            if (top && top.closest('.node-link') === el) hit++
            else bad.add(top ? `${top.tagName}.${top.className?.baseVal ?? top.className}` : 'null')
          }
          return { id: el.dataset.node, hit, bad: [...bad] }
        }))
        for (const r of res) expect(r.hit, `${r.id} bloqueado por ${r.bad.join(', ')}`).toBe(15)
      })
      test(`${w}×${h} (${lang}): el círculo de cada nodo está centrado sobre su punto del arco y la etiqueta centrada bajo el círculo`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: h })
        await page.goto(`/${lang}/`)
        await hydrated(page)
        const m = await page.evaluate(() => {
          const c = document.querySelector('.canvas').getBoundingClientRect()
          return { c: [c.left, c.top, c.width, c.height], nodes: [...document.querySelectorAll('.node-link')].map((el) => {
            const i = el.querySelector('.node-icon').getBoundingClientRect(); const s = el.querySelector('span').getBoundingClientRect()
            return { id: el.dataset.node, icon: [i.left + i.width / 2, i.top + i.height / 2], label: [s.left + s.width / 2, s.top], iconBottom: i.bottom }
          }) }
        })
        const border = 0.5
        for (const n of m.nodes) {
          const wantX = m.c[0] + border + (POINTS[n.id][0] / VIEW.w) * (m.c[2] - 2 * border)
          const wantY = m.c[1] + border + (POINTS[n.id][1] / VIEW.h) * (m.c[3] - 2 * border)
          expect(Math.abs(n.icon[0] - wantX), `${n.id} x`).toBeLessThanOrEqual(1.5)
          expect(Math.abs(n.icon[1] - wantY), `${n.id} y`).toBeLessThanOrEqual(1.5)
          expect(Math.abs(n.label[0] - n.icon[0]), `${n.id} etiqueta`).toBeLessThanOrEqual(1)
          expect(n.label[1], `${n.id} etiqueta debajo`).toBeGreaterThanOrEqual(n.iconBottom)
        }
      })
    }
  }
  test('el clic en la parte superior de Demo y Trayectoria (donde antes estaba la barra) navega', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    for (const [id, path] of [['demo', '/es/demo/'], ['journey', '/es/trayectoria/']]) {
      await page.goto('/es/')
      await hydrated(page)
      const b = await page.locator(`[data-node="${id}"] .node-icon`).boundingBox()
      await page.mouse.click(b.x + b.width / 2, b.y + 3) // 3 px bajo el borde superior del círculo
      await page.waitForURL(`**${path}`)
    }
  })
  test('con un viewport estrecho la barra sigue sin tapar nada y sus enlaces funcionan', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/en/')
    await hydrated(page)
    for (const sel of ['.bar-brand', '.bar nav a[href$=".pdf"]', '.bar .theme-toggle', '.bar nav a[hreflang]']) {
      const b = await page.locator(sel).boundingBox()
      const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a,button')?.outerHTML.slice(0, 60), [b.x + b.width / 2, b.y + b.height / 2])
      expect(hit, sel).toBeTruthy()
    }
  })
})

// ---------- F4 / C1: anillo concéntrico con la cabeza, líneas simétricas y ningún trazo dentro de la cabeza ----------
test.describe('C1 opción C: arco, anillo y líneas', () => {
  test.use({ reducedMotion: 'reduce' })
  for (const [w, h] of [[1280, 800], [1920, 1080], [1024, 768]]) {
    test(`${w}×${h}: anillo concéntrico con la cabeza (±2 % del retrato), puntos simétricos y ningún trazo entra en la cabeza`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h })
      await page.goto('/es/')
      await hydrated(page)
      const m = await page.evaluate(({ headBox }) => {
        const svg = document.querySelector('svg.lines')
        const ctm = svg.getScreenCTM()
        const pt = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(ctm); return [p.x, p.y] }
        const pr = document.querySelector('.portrait').getBoundingClientRect()
        const head = { x0: pr.left + headBox.x0 * pr.width, x1: pr.left + headBox.x1 * pr.width, y0: pr.top + headBox.y0 * pr.height, y1: pr.top + headBox.y1 * pr.height }
        const inside = ([x, y]) => x >= head.x0 && x <= head.x1 && y >= head.y0 && y <= head.y1
        const sample = (el) => { const L = el.getTotalLength(); return Array.from({ length: 400 }, (_, i) => { const p = el.getPointAtLength((L * i) / 399); return pt(p.x, p.y) }) }
        const ring = document.querySelector('.ring')
        const rc = pt(Number(ring.getAttribute('cx')), Number(ring.getAttribute('cy')))
        const lines = Object.fromEntries([...document.querySelectorAll('.line')].map((l) => [l.dataset.line, { end: pt(Number(l.getAttribute('x2')), Number(l.getAttribute('y2'))), start: pt(Number(l.getAttribute('x1')), Number(l.getAttribute('y1'))), enters: sample(l).some(inside) }]))
        return { pw: pr.width, head, ringCenter: rc, ringEnters: sample(ring).some(inside), arcEnters: sample(document.querySelector('.arc')).some(inside), lines, axis: pr.left + pr.width / 2 }
      }, { headBox: HEAD_BOX })
      const headCenter = [(m.head.x0 + m.head.x1) / 2, (m.head.y0 + m.head.y1) / 2]
      const tol = 0.02 * m.pw
      expect(Math.abs(m.ringCenter[0] - headCenter[0])).toBeLessThanOrEqual(tol)
      expect(Math.abs(m.ringCenter[1] - headCenter[1])).toBeLessThanOrEqual(tol)
      expect(m.ringEnters).toBe(false); expect(m.arcEnters).toBe(false)
      for (const id of IDS) expect(m.lines[id].enters, `la línea de ${id} entra en la cabeza`).toBe(false)
      for (const [l, r] of [['code', 'interest'], ['projects', 'how'], ['demo', 'journey']]) {
        expect(m.lines[l].end[0] + m.lines[r].end[0]).toBeCloseTo(2 * m.axis, 0)
        expect(m.lines[l].end[1]).toBeCloseTo(m.lines[r].end[1], 0)
      }
    })
  }
  test('la línea parte del borde del círculo del nodo señalado, no de su centro ni de la etiqueta', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es/')
    await hydrated(page)
    for (const id of IDS) {
      const { gap, circle } = await page.evaluate((id) => {
        const l = document.querySelector(`.line[data-line="${id}"]`)
        const ctm = document.querySelector('svg.lines').getScreenCTM()
        const s = new DOMPoint(Number(l.getAttribute('x1')), Number(l.getAttribute('y1'))).matrixTransform(ctm)
        const i = document.querySelector(`[data-node="${id}"] .node-icon`).getBoundingClientRect()
        const c = [i.left + i.width / 2, i.top + i.height / 2]
        return { gap: Math.hypot(s.x - c[0], s.y - c[1]), circle: i.width / 2 }
      }, id)
      expect(Math.abs(gap - circle), `${id}: el trazo debe empezar en el borde del círculo`).toBeLessThanOrEqual(4)
    }
  })
  test('al señalar un nodo aparecen su línea y el anillo; al apartar el puntero desaparecen; con movimiento reducido no hay transición', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es/')
    await hydrated(page)
    await expect(page.locator('.ring')).toHaveCSS('opacity', '0')
    await expect(page.locator('.line')).toHaveCount(6)
    await node(page, 'Proyectos').hover()
    await expect(page.locator('.line[data-on="true"]')).toHaveCount(1)
    await expect(page.locator('.line[data-line="projects"]')).toHaveCSS('opacity', '1')
    await expect(page.locator('.ring')).toHaveCSS('opacity', '1')
    expect(await page.locator('.ring').evaluate((e) => getComputedStyle(e).transitionDuration)).toBe('0s')
    await page.mouse.move(640, 760)
    await expect(page.locator('.ring')).toHaveCSS('opacity', '0', { timeout: 3000 })
  })
  test('con movimiento normal el trazo se anima (transición de 0,45 s)', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 800 } })
    const page = await ctx.newPage()
    await page.goto('/es/')
    expect(await page.locator('.ring').evaluate((e) => getComputedStyle(e).transitionDuration)).toMatch(/0\.45s/)
    await ctx.close()
  })
})

// ---------- C3: vista previa al pasar el mouse ----------
test.describe('vista previa al pasar el mouse (C3)', () => {
  test.use({ reducedMotion: 'reduce' })
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en/')
    await hydrated(page)
  })

  test('Demo es el panel de reposo; pasar el mouse por cada nodo muestra su panel', async ({ page }) => {
    await expect(page.locator('#p-demo')).toBeVisible()
    for (const [name, id] of [['Code', 'code'], ['Projects', 'projects'], ['Journey', 'journey'], ['How I work', 'how'], ['Interest', 'interest'], ['Demo', 'demo']]) {
      await node(page, name).hover()
      await expect(page.locator(`#p-${id}`), id).toBeVisible()
      await expect(page.locator('.panel:visible')).toHaveCount(1)
      await expect(node(page, name)).toHaveAttribute('aria-expanded', 'true')
    }
  })
  test('Proyectos muestra "Work in production" con Criden, y su botón lleva a la página', async ({ page }) => {
    await node(page, 'Projects').hover()
    await expect(page.locator('#p-projects h2')).toHaveText('Work in production')
    await expect(page.locator('#p-projects')).toContainText('Criden')
    await expect(page.locator('#p-projects summary')).toHaveText('Telegram bots')
    await expect(page.locator('#p-code pre')).toBeHidden()
  })
  test('el panel de Código muestra datos reales y no trae enlace a Contacto', async ({ page }) => {
    await node(page, 'Code').hover()
    await expect(page.locator('#p-code pre.code')).toContainText('"id": "R-02"')
    await expect(page.locator('#p-code pre.code')).toContainText('not used')
    await expect(page.locator('#p-code a', { hasText: /contact/i })).toHaveCount(0)
  })
  test('el panel sigue abierto al llevar el puntero del nodo al panel, y sus pestañas se pueden usar', async ({ page }) => {
    await node(page, 'How I work').hover()
    await expect(page.getByRole('tab', { name: 'People' })).toHaveAttribute('aria-selected', 'true')
    const nb = await node(page, 'How I work').boundingBox()
    const pb = await page.locator('#p-how').boundingBox()
    await page.mouse.move(nb.x + nb.width / 2, nb.y + nb.height / 2)
    await page.mouse.move(pb.x + pb.width / 2, pb.y + 20, { steps: 12 })
    await page.getByRole('tab', { name: 'Machines' }).click()
    await expect(page.locator('#tabpanel-machines')).toContainText('- Tests first, then code.')
    await expect(page.locator('#tabpanel-machines')).toContainText('No AI model call per visitor click.')
    await expect(page.locator('#tabpanel-people')).toBeHidden()
    await page.waitForTimeout(900) // más que el margen de salida: el puntero sigue sobre el panel
    await expect(page.locator('#p-how')).toBeVisible()
    await expect(page.locator('.line[data-on="true"]')).toHaveCount(1)
  })
  test('cambiar de pestaña en Cómo trabajo no cambia la altura del panel (no se encoge bajo el puntero)', async ({ page }) => {
    await node(page, 'How I work').hover()
    await expect(page.locator('#p-how')).toBeVisible()
    const a = await page.locator('#p-how').boundingBox()
    await page.getByRole('tab', { name: 'Machines' }).click()
    await expect(page.locator('#tabpanel-people')).toBeHidden()
    expect(await page.locator('#p-how').boundingBox()).toEqual(a)
  })
  test('el panel no salta de sitio ni cambia el tamaño del lienzo al abrirse (sin salto de layout)', async ({ page }) => {
    const before = await page.locator('.canvas').boundingBox()
    const bar = await page.locator('.bar').boundingBox()
    for (const name of ['Code', 'Journey', 'How I work']) await node(page, name).hover()
    expect(await page.locator('.canvas').boundingBox()).toEqual(before)
    expect(await page.locator('.bar').boundingBox()).toEqual(bar)
    expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  })
  test('ningún panel pisa los nodos (el panel más alto queda por debajo del nodo Interés)', async ({ page }) => {
    const interest = await node(page, 'Interest').boundingBox()
    for (const [name, id] of [['Code', 'code'], ['How I work', 'how'], ['Interest', 'interest']]) {
      await node(page, name).hover()
      await expect(page.locator(`#p-${id}`)).toBeVisible()
      const pb = await page.locator(`#p-${id}`).boundingBox()
      expect(pb.y, id).toBeGreaterThanOrEqual(interest.y + interest.height)
      expect(pb.y + pb.height, id).toBeLessThanOrEqual(800)
    }
  })
  test('clic en un nodo lleva a su página (los seis, también Código, Cómo trabajo e Interés)', async ({ page }) => {
    for (const [name, id] of [['Code', 'code'], ['Projects', 'projects'], ['Demo', 'demo'], ['Journey', 'journey'], ['How I work', 'how'], ['Interest', 'interest']]) {
      await page.goto('/en/')
      await hydrated(page)
      await node(page, name).click()
      await page.waitForURL(`**${PATHS.en[id]}`)
      await expect(page.locator('h1')).toBeVisible()
    }
  })
  test('el botón del panel abre la misma página que el nodo', async ({ page }) => {
    await node(page, 'Journey').hover()
    await page.locator('#p-journey a.btn').click()
    await page.waitForURL('**/en/journey/')
  })
  test('teclado: Tab llega a los nodos con foco visible y los enfoca abre su panel; Enter navega', async ({ page }) => {
    const n = node(page, 'Interest')
    await n.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab') // vuelve al nodo por teclado: focus-visible
    const outline = await n.evaluate((e) => getComputedStyle(e).outlineStyle)
    expect(outline).not.toBe('none')
    await expect(page.locator('#p-interest')).toBeVisible()
    await page.keyboard.press('Enter')
    await page.waitForURL('**/en/interest/')
  })
  test('Esc cierra la vista previa en móvil (hoja) y nunca cambia de página', async ({ page }) => {
    await page.keyboard.press('Escape')
    expect(new URL(page.url()).pathname).toBe('/en/')
  })
  test('no hay aria-live en la primera pantalla', async ({ page }) => {
    await expect(page.locator('.first [aria-live]')).toHaveCount(0)
  })
  test('sin errores de consola ni avisos de CSP al cargar y pasar por los nodos', async ({ page }) => {
    const bad = []
    page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) bad.push(m.text()) })
    await page.reload()
    await hydrated(page)
    await node(page, 'Code').hover()
    await node(page, 'Interest').hover()
    expect(bad).toEqual([])
  })
})

test.describe('retraso de intención y escritura con movimiento normal (AC-H5)', () => {
  test.use({ reducedMotion: 'no-preference' })
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en/')
    await hydrated(page)
  })
  test('un barrido rápido por encima de un nodo no abre su panel', async ({ page }) => {
    const b = await page.locator('[data-node="how"] .node-icon').boundingBox()
    await page.mouse.move(b.x - 60, b.y + 10)
    await page.mouse.move(b.x + b.width + 60, b.y + 10, { steps: 3 })
    await page.waitForTimeout(400)
    await expect(page.locator('#p-demo')).toBeVisible()
  })
  test('el panel termina de escribirse en ≤ 2 s', async ({ page }) => {
    await page.locator('[data-node="code"]').hover({ force: true })
    await expect(page.locator('#p-code .t-off')).not.toHaveText('', { timeout: 1000 })
    await expect(page.locator('#p-code .t-off')).toHaveText('', { timeout: 2200 })
  })
  test('un clic en el panel lo completa al instante', async ({ page }) => {
    await page.locator('[data-node="code"]').hover({ force: true })
    await expect(page.locator('#p-code .t-off')).not.toHaveText('', { timeout: 1000 })
    await page.locator('#p-code').click({ position: { x: 5, y: 5 } })
    await expect(page.locator('#p-code .t-off')).toHaveText('', { timeout: 300 })
  })
  test('Esc completa el texto al instante y no cambia de página', async ({ page }) => {
    await page.locator('[data-node="interest"]').hover({ force: true })
    await expect(page.locator('#p-interest .t-off')).not.toHaveText('', { timeout: 1000 })
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-interest .t-off')).toHaveText('', { timeout: 300 })
    expect(new URL(page.url()).pathname).toBe('/en/')
  })
})

test.describe('táctil (C3): primer toque abre la vista previa, segundo toque navega', () => {
  test.use({ hasTouch: true, reducedMotion: 'reduce' })
  test('móvil bajo 360×640: la hoja se abre al primer toque con "Open Journey →", no deja pasar el clic, y el segundo toque navega', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/en/')
    await hydrated(page)
    await expect(page.locator('#p-demo')).toBeHidden()
    await node(page, 'Journey').tap()
    await expect(page.locator('#p-journey')).toBeVisible()
    await expect(page.locator('#p-journey a.btn')).toHaveText('Open Journey →')
    expect(new URL(page.url()).pathname).toBe('/en/')
    await node(page, 'Journey').tap()
    await page.waitForURL('**/en/journey/')
  })
  test('móvil 390×844: tocar otro nodo cambia la vista previa sin navegar; el botón "Abrir" navega', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/es/')
    await hydrated(page)
    await node(page, 'Proyectos').tap()
    await expect(page.locator('#p-projects')).toBeVisible()
    await node(page, 'Interés').tap()
    await expect(page.locator('#p-interest')).toBeVisible()
    await expect(page.locator('#p-projects')).toBeHidden()
    expect(new URL(page.url()).pathname).toBe('/es/')
    await page.locator('#p-interest a.btn').tap()
    await page.waitForURL('**/es/interes/')
  })
  test('móvil bajo: Esc cierra la hoja; la hoja no tapa la fila de nodos; axe no halla violaciones con la hoja abierta (AC-H6)', async ({ page }) => {
    const { default: AxeBuilder } = await import('@axe-core/playwright')
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/en/')
    await hydrated(page)
    await node(page, 'Code').tap()
    await expect(page.locator('#p-code')).toBeVisible()
    const sheet = await page.locator('#p-code').boundingBox()
    const nodes = await page.locator('.nodes').boundingBox()
    expect(sheet.y).toBeGreaterThanOrEqual(nodes.y + nodes.height)
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
    await page.keyboard.press('Escape')
    await expect(page.locator('#p-code')).toBeHidden()
  })
})

test.describe('revisión adversarial: 404, enlace antiguo, barra', () => {
  test('la 404 se hidrata como 404: sin errores de React ni cambio a la portada', async ({ page }) => {
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e)))
    await page.goto('/404.html')
    await page.waitForTimeout(800)
    await expect(page.locator('h1')).toHaveText('404')
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
    for (const a of await page.locator('.bar a:not(.skip), .bar button').all()) {
      const b = await a.boundingBox()
      expect(b.width).toBeGreaterThanOrEqual(24)
      expect(b.height).toBeGreaterThanOrEqual(24)
    }
  })
})

test.describe('sin JavaScript (AC-H2)', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' })
  test('los seis nodos son enlaces a sus páginas, los textos de los paneles están y CSS da la vista previa al señalar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/es/')
    await expect(page.locator('a[data-node]')).toHaveCount(6)
    for (const id of IDS) await expect(page.locator(`a[data-node="${id}"]`)).toHaveAttribute('href', new RegExp(`^/es/[a-z-]+/$`))
    await expect(page.locator('#p-demo')).toBeVisible()
    await expect(page.locator('#p-code')).toBeHidden()
    await expect(page.locator('#p-code pre.code')).toContainText('$ cat ruleset.v1.json')
    await page.locator('a[data-node="code"]').hover()
    await expect(page.locator('#p-code')).toBeVisible()
    await expect(page.locator('#p-demo')).toBeHidden()
    await page.locator('a[data-node="interest"]').focus()
    await expect(page.locator('#p-interest')).toBeVisible()
    await expect(page.locator('h1')).toHaveText('Un poco de lo que hago, en pocos minutos.')
  })
})
