// Modo demostración (npm run demo): API de mentira que valida igual que la real, no envía ni guarda nada y solo escucha en local.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDemoServer } from '../../scripts/demo-server.mjs'

let server
let base
const valid = { intent: 'other', lang: 'es', consent: true, turnstileToken: 'dev-no-widget', name: 'Ana', email: 'ana@example.com', message: 'Hola' }
const post = (body, headers = { 'content-type': 'application/json' }) =>
  fetch(`${base}/api/contact`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) })

beforeAll(async () => {
  const outer = mkdtempSync(join(tmpdir(), 'demo-'))
  const root = join(outer, 'site')
  mkdirSync(join(root, 'es', 'contacto'), { recursive: true })
  writeFileSync(join(root, 'es', 'contacto', 'index.html'), '<html><body><main>contacto</main></body></html>')
  writeFileSync(join(root, '404.html'), '<html><body>no existe</body></html>')
  writeFileSync(join(root, 'app.js'), 'console.log(1)')
  writeFileSync(join(outer, 'secreto-demo.txt'), 'no debe servirse')
  server = createDemoServer(root)
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${server.address().port}`
})
afterAll(() => new Promise((r) => server.close(r)))

describe('modo demostración', () => {
  it('solo escucha en 127.0.0.1', () => {
    expect(server.address().address).toBe('127.0.0.1')
  })

  it('GET /api/contact dice que el formulario está activo', async () => {
    expect(await (await fetch(`${base}/api/contact`)).json()).toEqual({ enabled: true })
  })

  it('acepta un mensaje válido sin enviarlo: solo lo imprime en la terminal', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const res = await post(valid)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(log.mock.calls.flat().join('\n')).toContain('NO se envía ni se guarda')
    log.mockRestore()
  })

  it('rechaza lo inválido con el mismo esquema estricto (campos extra, consentimiento, JSON roto, tipo, tamaño)', async () => {
    expect((await post({ ...valid, extra: 1 })).status).toBe(400)
    expect((await post({ ...valid, consent: false })).status).toBe(400)
    expect((await post('{no es json')).status).toBe(400)
    expect((await post(valid, { 'content-type': 'text/plain' })).status).toBe(415)
    expect((await post({ ...valid, message: 'x'.repeat(20000) })).status).toBe(413)
    expect((await fetch(`${base}/api/contact`, { method: 'PUT' })).status).toBe(405)
  })

  it.each([['limite', 429], ['bot', 403], ['caido', 503]])('el correo %s@… fuerza la respuesta %i para ver el aviso', async (name, status) => {
    const res = await post({ ...valid, email: `${name}@example.com` })
    expect(res.status).toBe(status)
    expect((await res.json()).ok).toBe(false)
  })

  it('sirve las páginas con el aviso de demostración y 404 para lo que no existe', async () => {
    const page = await fetch(`${base}/es/contacto/`)
    expect(page.status).toBe(200)
    expect(await page.text()).toContain('MODO DEMOSTRACIÓN')
    const missing = await fetch(`${base}/es/nada/`)
    expect(missing.status).toBe(404)
    expect(await missing.text()).toContain('no existe')
    expect(await (await fetch(`${base}/app.js`)).text()).toBe('console.log(1)')
  })

  it('no sale de la carpeta servida (recorrido de rutas)', async () => {
    for (const p of ['/..%2fsecreto-demo.txt', '/%2e%2e/secreto-demo.txt', '/../secreto-demo.txt']) {
      const res = await fetch(`${base}${p}`)
      expect(await res.text()).not.toContain('no debe servirse')
    }
  })

  it('no lee configuración, claves ni variables de entorno de Cloudflare', () => {
    const src = readFileSync(new URL('../../scripts/demo-server.mjs', import.meta.url), 'utf8')
    expect(src).not.toMatch(/process\.env\.(?!DEMO_)/)
    expect(src).not.toMatch(/\.dev\.vars|wrangler|TURNSTILE_SECRET|fetch\(/)
  })
})
