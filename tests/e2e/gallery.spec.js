import { test, expect, devices } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Galería por fila de Trayectoria (spec §5.1, AC-H11, AC-H12, AC-H13). Las fotos son marcadores (P-29): ninguna entregada todavía.
const PATH = '/en/journey/'
const { defaultBrowserType: _b, ...PIXEL } = devices['Pixel 5']
const rowBox = async (page, i) => (await page.locator('.g-btn').nth(i).boundingBox())
const counter = (page) => page.locator('.g-float .g-count')

test.describe('ratón', () => {
  test.use({ reducedMotion: 'no-preference' })
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto(PATH)
    await page.waitForFunction(() => document.querySelector('.gallery')?.dataset.mode === 'fine')
  })

  test('el movimiento sobre los N tramos de una fila muestra las fotos 1..N en orden (AC-H11)', async ({ page }) => {
    for (const [row, n] of [[0, 6], [1, 4], [2, 3], [3, 5]]) {
      const b = await rowBox(page, row)
      await page.mouse.move(b.x + 1, b.y + b.height / 2)
      for (let k = 0; k < n; k++) {
        await page.mouse.move(b.x + ((k + 0.5) / n) * b.width, b.y + b.height / 2)
        await expect(counter(page)).toHaveText(`${k + 1}/${n}`)
      }
      await page.mouse.move(b.x - 40, b.y - 40) // sale de la fila
      await expect(page.locator('.g-float')).not.toHaveAttribute('data-on', 'true')
    }
  })

  test('las demás filas se atenúan y la franja marca el tramo activo', async ({ page }) => {
    const b = await rowBox(page, 0)
    await page.mouse.move(b.x + 5, b.y + 20)
    await page.mouse.move(b.x + b.width * 0.9, b.y + 20)
    await expect(page.locator('.g-row[data-dim="true"]')).toHaveCount(3)
    await expect(page.locator('.g-row').first().locator('.g-strip .on')).toHaveCount(1)
    await expect(page.locator('.g-row').first().locator('.g-strip span').nth(5)).toHaveClass('on')
  })

  test('un scroll no cambia ni abre fotos, ni los eventos sintéticos posteriores; reaparece con movimiento real (AC-H11)', async ({ page }) => {
    const b = await rowBox(page, 0)
    const x = b.x + b.width * 0.3
    const y = b.y + b.height / 2
    await page.mouse.move(b.x + 2, y)
    await page.mouse.move(x, y)
    await expect(counter(page)).toHaveText('2/6')
    await page.mouse.wheel(0, 200)
    await expect(page.locator('.g-float')).not.toHaveAttribute('data-on', 'true')
    // Evento sintético que el navegador emite tras un scroll, dentro de la ventana de 200 ms, con otras coordenadas.
    await page.evaluate(([cx, cy]) => {
      const el = document.elementFromPoint(cx, cy)?.closest('.g-btn') ?? document.querySelector('.g-btn')
      el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: cx + 40, clientY: cy }))
    }, [x, y])
    await expect(page.locator('.g-float')).not.toHaveAttribute('data-on', 'true')
    await page.waitForTimeout(350)
    const b2 = await rowBox(page, 0)
    if (b2 && b2.y > 0) { // la fila sigue a la vista tras el scroll
      await page.mouse.move(b2.x + 3, b2.y + b2.height / 2)
      await page.mouse.move(b2.x + b2.width * 0.7, b2.y + b2.height / 2)
      await expect(page.locator('.g-float')).toHaveAttribute('data-on', 'true')
    }
  })

  test('un pointermove sin cambio de coordenadas no cambia nada (AC-H11)', async ({ page }) => {
    const b = await rowBox(page, 0)
    const x = b.x + b.width * 0.55
    const y = b.y + b.height / 2
    await page.mouse.move(b.x + 2, y)
    await page.mouse.move(x, y)
    await expect(counter(page)).toHaveText('4/6')
    await page.evaluate(([cx, cy]) => {
      const el = document.querySelector('.g-btn')
      el.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerType: 'mouse', clientX: cx, clientY: cy }))
    }, [x, y])
    await expect(counter(page)).toHaveText('4/6')
  })

  test('el texto de cada fila es visible y la foto pendiente se rotula, nunca se inventa una foto (AC-H13)', async ({ page }) => {
    await expect(page.locator('.g-desc')).toHaveCount(4)
    for (const t of await page.locator('.g-desc').all()) await expect(t).toBeVisible()
    const b = await rowBox(page, 1)
    await page.mouse.move(b.x + 2, b.y + 20)
    await page.mouse.move(b.x + 30, b.y + 20)
    await expect(page.locator('.g-float .g-ph [data-pending="P-29"]')).toHaveCount(1) // marcador visible mientras Dennys no entregue la foto
    await expect(page.locator('.g-float img')).toHaveCount(0)
  })
})

test.describe('teclado', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto(PATH)
    await page.waitForFunction(() => document.querySelector('.gallery')?.dataset.mode === 'fine')
  })
  test('Tab muestra la foto 1; ← y → cambian de foto; al salir del foco se oculta (AC-H12)', async ({ page }) => {
    await page.locator('.g-btn').first().focus()
    await expect(counter(page)).toHaveText('1/6')
    await page.keyboard.press('ArrowRight')
    await expect(counter(page)).toHaveText('2/6')
    await page.keyboard.press('ArrowRight')
    await expect(counter(page)).toHaveText('3/6')
    await page.keyboard.press('ArrowLeft')
    await expect(counter(page)).toHaveText('2/6')
    await page.keyboard.press('Tab') // el foco pasa a la fila siguiente y muestra su foto 1
    await expect(counter(page)).toHaveText('1/4')
    await page.locator('.g-btn').nth(1).blur()
    await expect(page.locator('.g-float')).not.toHaveAttribute('data-on', 'true')
  })
  test('axe sin violaciones con la foto visible por teclado', async ({ page }) => {
    await page.locator('.g-btn').first().focus()
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([])
  })
})

test.describe('movimiento reducido', () => {
  test.use({ reducedMotion: 'reduce' })
  test('la foto no sigue al cursor: queda junto a la fila (AC-H12)', async ({ page }) => {
    await page.setViewportSize({ width: 1180, height: 800 })
    await page.goto(PATH)
    await page.waitForFunction(() => document.querySelector('.gallery')?.dataset.mode === 'fine')
    const b = await rowBox(page, 0)
    await page.mouse.move(b.x + 2, b.y + 20)
    await page.mouse.move(b.x + b.width * 0.2, b.y + 20)
    await expect(counter(page)).toHaveText('2/6')
    const t1 = await page.locator('.g-float').evaluate((e) => e.style.transform)
    await page.mouse.move(b.x + b.width * 0.8, b.y + 30)
    await expect(counter(page)).toHaveText('5/6')
    const t2 = await page.locator('.g-float').evaluate((e) => e.style.transform)
    expect(t1).toBe(t2)
  })
})

test.describe('táctil', () => {
  test.use({ ...PIXEL })
  test.beforeEach(async ({ page }) => {
    await page.goto(PATH)
    await page.waitForFunction(() => document.querySelector('.gallery')?.dataset.mode === 'touch')
  })
  test('tocar una fila abre la galería en línea con ‹ ›; una sola abierta a la vez; aria-expanded (AC-H12)', async ({ page }) => {
    const rows = page.locator('.g-btn')
    await expect(rows.first()).toHaveAttribute('aria-expanded', 'false')
    await rows.first().tap()
    await expect(rows.first()).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 1 of 6')
    const next = page.getByRole('button', { name: 'Next photo' })
    const box = await next.boundingBox()
    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    await next.tap()
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 2 of 6')
    await page.getByRole('button', { name: 'Previous photo' }).tap()
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 1 of 6')
    await rows.nth(1).tap()
    await expect(rows.first()).toHaveAttribute('aria-expanded', 'false')
    await expect(rows.nth(1)).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('.g-inline')).toHaveCount(1)
  })
  test('deslizar el dedo 30 px o más cambia de foto; menos no (AC-H12)', async ({ page }) => {
    await page.locator('.g-btn').first().tap()
    const swipe = (dx) => page.locator('.g-inline').evaluate((el, d) => {
      const mk = (x, type) => new TouchEvent(type, { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: el, clientX: x, clientY: 10 })], touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: el, clientX: x, clientY: 10 })] })
      el.dispatchEvent(mk(200, 'touchstart'))
      el.dispatchEvent(mk(200 + d, 'touchend'))
    }, dx)
    await swipe(-80)
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 2 of 6')
    await swipe(-10)
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 2 of 6')
    await swipe(80)
    await expect(page.locator('.g-inline .g-count')).toHaveText('Photo 1 of 6')
  })
  test('axe sin violaciones con una fila abierta', async ({ page }) => {
    await page.locator('.g-btn').first().tap()
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([])
  })
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('el texto de cada fila se ve completo (AC-H13)', async ({ page }) => {
    await page.goto(PATH)
    for (const t of ['7 years in fiber-optic networks', 'Telegram bot for ISP technicians', 'children\'s football championships', 'explain themselves']) await expect(page.getByText(t, { exact: false }).first()).toBeVisible()
  })
})
