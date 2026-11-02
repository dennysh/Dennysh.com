import { test, expect } from '@playwright/test'
import { stubTurnstile } from './helpers.js'

// Formulario de contacto adaptativo (correcciones 2, D4) con la API simulada: el flujo completo, el teclado, Atrás, errores y el estado desactivado.
const L = { es: { path: '/es/contacto/', web: 'Hacer una página web', bots: 'Automatizar con bots o IA', other: 'Otra cosa', next: 'Siguiente', back: 'Atrás', send: 'Enviar', sent: 'Mensaje enviado. Te responderé lo antes posible.' },
  en: { path: '/en/contact/', web: 'Build a website', bots: 'Automate with bots or AI', other: 'Something else', next: 'Next', back: 'Back', send: 'Send', sent: 'Message sent. I will reply as soon as I can.' } }

async function mockContact(page, { enabled = true, post = { status: 200, body: { status: 'sent' } } } = {}) {
  const posts = []
  await stubTurnstile(page)
  await page.route('**/api/contact', async (route) => {
    const req = route.request()
    if (req.method() === 'GET') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ enabled }) })
    posts.push(JSON.parse(req.postData()))
    return route.fulfill({ status: post.status, contentType: 'application/json', body: JSON.stringify(post.body) })
  })
  return posts
}
const heading = (page) => page.locator('#cf-q')
const nextBtn = (page, lang = 'es') => page.getByRole('button', { name: L[lang].next, exact: true })

test.describe('formulario activo', () => {
  test.use({ reducedMotion: 'reduce' })

  test('flujo completo "Página web" solo con teclado: Espacio elige, Enter avanza, el foco sigue al título y se envía el cuerpo esperado', async ({ page }) => {
    const posts = await mockContact(page)
    await page.goto(L.es.path)
    await expect(page.locator('form.cf')).toBeVisible()
    await expect(page.locator('[data-contact-form="pending"]')).toHaveCount(0)
    await page.getByRole('radio', { name: L.es.web }).focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('Enter')
    await expect(heading(page)).toHaveText('¿Qué tipo de sitio necesitas?')
    await expect(heading(page)).toBeFocused()
    // tienda → presupuesto → plazo → dominio: cada paso con las flechas y Enter
    for (const [q, pick] of [['¿Qué tipo de sitio necesitas?', 'Tienda'], ['¿Qué presupuesto tienes pensado? (en USD)', '300–1 000'], ['¿Para cuándo lo necesitas?', '2–3 meses'], ['¿Ya tienes dominio y contenido?', 'En parte']]) {
      await expect(heading(page)).toHaveText(q)
      await page.getByRole('radio', { name: pick }).focus()
      await page.keyboard.press('Space')
      await page.keyboard.press('Enter')
    }
    await expect(heading(page)).toHaveText('¿Cómo te contacto?')
    await page.getByLabel('Nombre').fill('Ana Pérez')
    await page.getByLabel('Correo').fill('ana@example.com')
    await page.getByLabel('Mensaje').fill('Hola\nsegunda línea')
    await page.keyboard.press('Tab') // al botón Atrás o Siguiente: el formulario se envía con Enter desde un campo de una línea
    await page.getByLabel('Correo').focus()
    await page.keyboard.press('Enter')
    await expect(heading(page)).toHaveText('Revisa y envía')
    await expect(page.locator('.cf-summary')).toContainText('Tienda')
    await expect(page.locator('.cf-summary')).toContainText('300–1 000')
    await page.getByRole('checkbox').focus()
    await page.keyboard.press('Space')
    await page.getByRole('button', { name: L.es.send, exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-contact-form="sent"]')).toHaveText(L.es.sent)
    await expect(page.locator('[data-contact-form="sent"]')).toBeFocused()
    expect(posts).toEqual([{ intent: 'web', lang: 'es', consent: true, turnstileToken: 'stub-token', siteType: 'shop', budget: '300-1000', deadline: '2-3m', assets: 'partial', name: 'Ana Pérez', email: 'ana@example.com', message: 'Hola\nsegunda línea' }])
  })

  test('las preguntas se arman según la opción: bots pregunta qué automatizar y dónde; "Otra cosa" solo el mensaje', async ({ page }) => {
    await mockContact(page)
    await page.goto(L.en.path)
    await page.getByRole('radio', { name: L.en.bots }).check()
    await nextBtn(page, 'en').click()
    await expect(heading(page)).toHaveText('What do you want to automate?')
    await page.getByLabel('What to automate').fill('Answer FAQs')
    await nextBtn(page, 'en').click()
    await expect(heading(page)).toHaveText('Where would it be used?')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page.getByLabel('What to automate')).toHaveValue('Answer FAQs')
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await page.getByRole('radio', { name: L.en.other }).check()
    await nextBtn(page, 'en').click()
    await expect(heading(page)).toHaveText('Tell me what you need')
    await expect(page.locator('progress')).toHaveAttribute('max', '4')
  })

  test('Atrás, error de validación (foco en el campo, aria en el campo) y la barra de progreso', async ({ page }) => {
    await mockContact(page)
    await page.goto(L.es.path)
    await expect(page.getByText('Paso 1 de 7')).toBeVisible()
    await nextBtn(page).click() // sin elegir
    await expect(page.getByRole('alert')).toHaveText('Elige una opción.')
    await expect(page.getByRole('radio').first()).toBeFocused()
    await page.getByRole('radio', { name: L.es.bots }).check()
    await expect(page.getByRole('alert')).toHaveCount(0)
    await nextBtn(page).click()
    await nextBtn(page).click() // texto vacío
    await expect(page.getByRole('alert')).toHaveText('Completa este campo.')
    await expect(page.locator('#cf-automate')).toBeFocused()
    await expect(page.locator('#cf-automate')).toHaveAttribute('aria-invalid', 'true')
    await page.locator('#cf-automate').fill('x')
    await nextBtn(page).click()
    await expect(page.getByText('Paso 3 de 7')).toBeVisible()
    expect(await page.locator('progress').evaluate((p) => [p.value, p.max])).toEqual([3, 7])
    await page.getByRole('button', { name: L.es.back, exact: true }).click()
    await expect(page.getByText('Paso 2 de 7')).toBeVisible()
  })

  test('el consentimiento es obligatorio y los errores del servidor se muestran sin perder las respuestas (429)', async ({ page }) => {
    const posts = await mockContact(page, { post: { status: 429, body: { code: 'E_RATE_LIMIT' } } })
    await page.goto(L.es.path)
    await page.getByRole('radio', { name: L.es.other }).check(); await nextBtn(page).click()
    await page.getByLabel('Mensaje').fill('Hola'); await nextBtn(page).click()
    await page.getByLabel('Nombre').fill('Ana'); await page.getByLabel('Correo').fill('ana@example.com'); await nextBtn(page).click()
    await page.getByRole('button', { name: L.es.send, exact: true }).click()
    await expect(page.getByRole('alert')).toHaveText('Marca la casilla para poder enviar.')
    expect(posts).toHaveLength(0)
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: L.es.send, exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Se enviaron demasiados mensajes')
    await expect(heading(page)).toHaveText('Revisa y envía')
    await expect(page.locator('.cf-summary')).toContainText('Hola')
    expect(posts).toHaveLength(1)
  })

  test('en 360×640 el formulario no desborda, y cada paso se ve sin desplazamiento horizontal', async ({ page }) => {
    await mockContact(page)
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto(L.es.path)
    await page.getByRole('radio', { name: L.es.web }).check(); await nextBtn(page).click()
    for (let i = 0; i < 2; i++) { await page.getByRole('radio').first().check(); await nextBtn(page).click() }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    for (const b of await page.locator('form.cf button, form.cf input[type="radio"], form.cf input[type="checkbox"]').all()) {
      const box = await b.boundingBox()
      if (box) expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(20)
    }
    const next = await nextBtn(page).boundingBox()
    expect(next.height).toBeGreaterThanOrEqual(44)
  })

  test('sin errores de consola ni avisos de CSP durante el flujo', async ({ page }) => {
    const bad = []
    page.on('console', (m) => { if (m.type() === 'error' || /content security policy/i.test(m.text())) bad.push(m.text()) })
    await mockContact(page)
    await page.goto(L.es.path)
    await page.getByRole('radio', { name: L.es.other }).check(); await nextBtn(page).click()
    await page.getByLabel('Mensaje').fill('Hola'); await nextBtn(page).click()
    expect(bad).toEqual([])
  })
})

test('desactivado por falta de configuración: se muestra el enlace de correo en lugar del formulario y los enlaces siguen debajo', async ({ page }) => {
  await mockContact(page, { enabled: false })
  await page.goto(L.es.path)
  await expect(page.locator('[data-contact-form="disabled"]')).toContainText('El formulario no está disponible por ahora')
  await expect(page.locator('[data-contact-form="disabled"] a[href="mailto:dennys@dennysh.com"]')).toBeVisible()
  await expect(page.locator('form.cf')).toHaveCount(0)
  await expect(page.locator('main a[href*="linkedin.com"]')).toHaveCount(1)
  await expect(page.locator('main a[href="/cv-dennys-heras.pdf"]')).toHaveCount(1)
})

test('si la API no responde (caída o ruta ausente) el formulario tampoco aparece', async ({ page }) => {
  await page.route('**/api/contact', (r) => r.abort())
  await page.goto(L.en.path)
  await expect(page.locator('[data-contact-form="disabled"]')).toBeVisible()
  await expect(page.locator('form.cf')).toHaveCount(0)
})

test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })
  test('muestra el enlace de correo en lugar del formulario', async ({ page }) => {
    await page.goto(L.es.path)
    await expect(page.locator('[data-contact-form="pending"] a[href="mailto:dennys@dennysh.com"]')).toBeVisible()
    await expect(page.locator('form')).toHaveCount(0)
  })
})

for (const scheme of ['light', 'dark']) {
  test.describe(`axe, tema ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' })
    test('cada paso de la ruta web, con error visible y el estado enviado, sin violaciones (WCAG 2.2 AA)', async ({ page }) => {
      const { default: AxeBuilder } = await import('@axe-core/playwright')
      await mockContact(page)
      const check = async (label) => {
        const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
        expect(r.violations.map((v) => `${label} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([])
      }
      await page.goto(L.es.path)
      await expect(page.locator('form.cf')).toBeVisible()
      await check('opción'); await nextBtn(page).click(); await check('opción con error')
      await page.getByRole('radio', { name: L.es.web }).check(); await nextBtn(page).click()
      for (const n of ['tipo', 'presupuesto', 'plazo', 'dominio']) { await check(n); await page.getByRole('radio').first().check(); await nextBtn(page).click() }
      await check('contacto'); await page.getByLabel('Nombre').fill('Ana'); await page.getByLabel('Correo').fill('a@b.co'); await nextBtn(page).click()
      await check('resumen'); await page.getByRole('checkbox').check(); await page.getByRole('button', { name: L.es.send, exact: true }).click()
      await expect(page.locator('[data-contact-form="sent"]')).toBeVisible(); await check('enviado')
    })
  })
}
