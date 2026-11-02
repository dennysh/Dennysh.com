import { test, expect } from '@playwright/test'

// Con la pila real (Functions + D1 local) y SIN mecanismo de entrega: el formulario queda desactivado de verdad (correcciones 2, D4).
const ORIGIN = 'http://localhost:8788'
const GOOD = { intent: 'other', lang: 'es', turnstileToken: 'tok', consent: true, name: 'Ana', email: 'ana@example.com', message: 'Hola' }

test('GET /api/contact dice enabled:false con las cabeceras de seguridad', async ({ request }) => {
  const res = await request.get(`${ORIGIN}/api/contact`)
  expect(res.status()).toBe(200)
  expect(await res.json()).toEqual({ enabled: false })
  const h = res.headers()
  expect(h['cache-control']).toBe('no-store'); expect(h['content-security-policy']).not.toMatch(/unsafe-inline/); expect(h['x-content-type-options']).toBe('nosniff'); expect(h['set-cookie']).toBeUndefined()
})

test('POST válido → 503 E_DISABLED, nada se entrega; entrada inválida → 400; tipo y método incorrectos', async ({ request }) => {
  const ok = await request.post(`${ORIGIN}/api/contact`, { data: GOOD })
  expect(ok.status()).toBe(503); expect(await ok.json()).toEqual({ code: 'E_DISABLED' })
  const bad = await request.post(`${ORIGIN}/api/contact`, { data: { ...GOOD, admin: true } })
  expect(bad.status()).toBe(400); expect(await bad.json()).toEqual({ code: 'E_INPUT' })
  const inj = await request.post(`${ORIGIN}/api/contact`, { data: { ...GOOD, name: 'Ana\r\nBcc: evil@x.co' } })
  expect(inj.status()).toBe(400)
  const type = await request.post(`${ORIGIN}/api/contact`, { headers: { 'content-type': 'text/plain' }, data: JSON.stringify(GOOD) })
  expect(type.status()).toBe(415)
  const put = await request.put(`${ORIGIN}/api/contact`, { data: {} })
  expect([405, 503]).toContain(put.status())
  const big = await request.post(`${ORIGIN}/api/contact`, { data: { ...GOOD, message: 'a'.repeat(13000) } })
  expect(big.status()).toBe(413)
})

test('en la página real el formulario no aparece: se ve el enlace de correo (sin inventar un formulario que no funciona)', async ({ page }) => {
  await page.goto('/es/contacto/')
  await expect(page.locator('[data-contact-form="disabled"]')).toContainText('El formulario no está disponible por ahora')
  await expect(page.locator('form.cf')).toHaveCount(0)
  await expect(page.locator('[data-contact-form="disabled"] a[href="mailto:dennys@dennysh.com"]')).toBeVisible()
})
