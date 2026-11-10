import { describe, it, expect, vi } from 'vitest'
import { onRequest as simulate } from '../../functions/api/simulate.js'
import { onRequest as intervene } from '../../functions/api/intervene.js'
import { onRequest as event } from '../../functions/api/event/[id].js'

// H1 de la revisión de seguridad: las rutas de la demo retirada no deben admitir trabajo ni escrituras.
describe('rutas de la demo retiradas', () => {
  const touched = vi.fn()
  // Si algo intentara usar la base, Turnstile o Telegram, estos accesos lo delatan.
  const env = new Proxy({}, { get: (_, k) => { touched(String(k)); return undefined } })
  for (const [name, fn] of [['simulate', simulate], ['intervene', intervene], ['event/[id]', event]]) {
    for (const method of ['GET', 'POST', 'PUT']) {
      it(`${name} ${method}: 410, cuerpo mínimo, cabeceras de seguridad y sin tocar el entorno`, async () => {
        const body = method === 'POST' ? JSON.stringify({ scenario: 'A' }) : undefined
        const res = await fn({ request: new Request('https://dennysh.com/api/x', { method, body, headers: { 'content-type': 'application/json' } }), env, params: { id: 'abc' } })
        expect(res.status).toBe(410)
        expect(await res.json()).toEqual({ code: 'E_NOT_FOUND' })
        expect(res.headers.get('Cache-Control')).toBe('no-store')
        expect(res.headers.get('Content-Security-Policy')).toContain("frame-ancestors 'none'")
        expect(res.headers.get('Set-Cookie')).toBeNull()
        expect(touched).not.toHaveBeenCalled()
      })
    }
  }
})
