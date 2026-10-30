import { describe, it, expect, vi, afterEach } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { onRequest as simulate } from '../../functions/api/simulate.js'

const env = () => ({
  DB: createD1(), TURNSTILE_SECRET: 's', TELEGRAM_BOT_TOKEN: '123456789:AAH-super-secret-token-value-0000', TELEGRAM_CHAT_ID: '987654367',
  VISITOR_HMAC_KEY: 'v'.repeat(32), EVENT_HMAC_KEY: 'e'.repeat(32), ALERTS_ENABLED: 'true',
})
const req = () => new Request('https://dennysh.com/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' }, body: JSON.stringify({ lang: 'es', scenario: 'A', turnstileToken: 't' }) })
const run = async (e, fetchImpl) => {
  vi.stubGlobal('fetch', fetchImpl)
  const res = await simulate({ request: req(), env: e, next: async () => new Response('x') })
  return { status: res.status, body: await res.json() }
}
const turnstileOk = () => new Response(JSON.stringify({ success: true, hostname: 'dennysh.com' }))
afterEach(() => vi.unstubAllGlobals())

describe('degradación ante fallos inyectados (D-06, K1)', () => {
  it('Telegram caído (red): la demo sigue completa y dice Failed, no Delivered', async () => {
    const r = await run(env(), async (u) => { if (String(u).includes('siteverify')) return turnstileOk(); throw new Error('ECONNRESET') })
    expect(r.status).toBe(200)
    expect(r.body.audit.decision).toBe('Limit')
    expect(r.body.audit.alert).toMatchObject({ status: 'Failed', channel: 'telegram', code: 'network' })
  })

  it('Telegram responde 502: Failed(server_error) y el interruptor protege la siguiente petición', async () => {
    const e = env()
    const f = async (u) => (String(u).includes('siteverify') ? turnstileOk() : new Response('bad gateway', { status: 502 }))
    expect((await run(e, f)).body.audit.alert.code).toBe('server_error')
    const second = new Request('https://dennysh.com/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '198.51.100.9' }, body: JSON.stringify({ lang: 'es', turnstileToken: 't' }) })
    const res = await simulate({ request: second, env: e, next: async () => new Response('x') })
    expect((await res.json()).audit.alert.status).toBe('Paused')
  })

  it('D1 caído: 503 E_INTERNAL, sin alerta real y sin detalles', async () => {
    const e = env()
    e.DB.state.down = true
    const telegramCalls = []
    const r = await run(e, async (u) => { if (String(u).includes('siteverify')) return turnstileOk(); telegramCalls.push(u); return new Response('{}') })
    expect(r).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(telegramCalls).toHaveLength(0)
  })

  it('Turnstile caído: 503 E_INTERNAL y no se crea evento', async () => {
    const e = env()
    const r = await run(e, async () => { throw new Error('dns') })
    expect(r).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(e.DB.raw.prepare('SELECT COUNT(*) AS n FROM events').get().n).toBe(0)
  })

  it('todo caído a la vez: sigue siendo una respuesta limpia, sin excepción', async () => {
    const e = env()
    e.DB.state.down = true
    const r = await run(e, async () => { throw new Error('todo caído') })
    expect(r).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
  })

  it('Telegram devuelve basura (no JSON): Failed(bad_response o rejected), nunca Delivered', async () => {
    const r = await run(env(), async (u) => (String(u).includes('siteverify') ? turnstileOk() : new Response('<html>', { status: 200 })))
    expect(r.body.audit.alert.status).toBe('Failed')
  })
})
