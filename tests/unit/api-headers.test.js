import { describe, it, expect, vi } from 'vitest'
import { withSecurityHeaders, describeError, json, API_HEADERS } from '../../server/security-headers.js'

const req = new Request('https://dennysh.com/api/simulate', { method: 'POST' })
const handlers = {
  200: async () => json({ ok: 1 }),
  400: async () => json({ code: 'E_INPUT' }, 400),
  500: async () => json({ code: 'E_INTERNAL' }, 500),
  404: async () => new Response('no', { status: 404 }),
  lanza: async () => { throw new Error('boom con /ruta/secreta y token 123:AAA') },
  cookie: async () => new Response('x', { headers: { 'Set-Cookie': 'a=1', 'set-cookie': 'b=2' } }),
}

describe('cabeceras de /api/* (AC-13, AC-17, S9, S18)', () => {
  for (const [name, h] of Object.entries(handlers)) {
    it(`respuesta ${name}: cabeceras completas y ningún Set-Cookie`, async () => {
      const res = await withSecurityHeaders(h)(req)
      const csp = res.headers.get('content-security-policy')
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain("object-src 'none'")
      expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/)
      expect(res.headers.get('strict-transport-security')).toBe('max-age=31536000; includeSubDomains')
      expect(res.headers.get('x-content-type-options')).toBe('nosniff')
      expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin')
      expect(res.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
      expect(res.headers.get('permissions-policy')).toContain('camera=()')
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(res.headers.get('set-cookie')).toBeNull()
    })
  }

  it('una excepción se convierte en 503 E_INTERNAL sin traza ni mensaje', async () => {
    const res = await withSecurityHeaders(handlers.lanza)(req)
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(JSON.parse(text)).toEqual({ code: 'E_INTERNAL' })
    expect(text).not.toMatch(/boom|ruta|token|AAA/)
  })

  it('registra la causa de una excepción sin claves ni rutas (solo en el registro, no en la respuesta)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await withSecurityHeaders(async () => { throw new Error('configuración incompleta') })(req)
      await withSecurityHeaders(handlers.lanza)(req)
      const lines = spy.mock.calls.map((c) => String(c[0]))
      expect(lines[0]).toBe('api_error Error: configuración incompleta')
      expect(lines[1]).toBe('api_error Error: (mensaje omitido)')
      expect(lines.join('\n')).not.toMatch(/boom|ruta|token|AAA|123/)
    } finally {
      spy.mockRestore()
    }
  })

  it('describeError no confía en valores que no son Error', () => {
    expect(describeError('token 123:AAA')).toBe('NoError: (mensaje omitido)')
    expect(describeError(undefined)).toBe('NoError: (mensaje omitido)')
  })

  it('conserva estado y cuerpo del manejador', async () => {
    const res = await withSecurityHeaders(handlers[400])(req)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ code: 'E_INPUT' })
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('API_HEADERS es la fuente única (todas las claves llegan a la respuesta)', async () => {
    const res = await withSecurityHeaders(handlers[200])(req)
    for (const [k, v] of Object.entries(API_HEADERS)) expect(res.headers.get(k)).toBe(v)
  })
})
