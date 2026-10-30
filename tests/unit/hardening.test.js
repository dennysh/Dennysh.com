import { describe, it, expect, vi, afterEach } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { onRequest as simulate } from '../../functions/api/simulate.js'
import { buildServices } from '../../server/services.js'
import { visitorHash, visitorKeyFor } from '../../server/visitor-hash.js'
import { scanText } from '../../scripts/lib/scan-secrets.mjs'
import { createStore } from '../../server/store-d1.js'

const env = (over = {}) => ({ DB: createD1(), TURNSTILE_SECRET: 'real-secret', VISITOR_HMAC_KEY: 'v'.repeat(32), EVENT_HMAC_KEY: 'e'.repeat(32), ALERTS_ENABLED: 'false', ...over })
afterEach(() => vi.unstubAllGlobals())

describe('cuerpo sin Content-Length (MEDIO-1)', () => {
  it('un cuerpo en streaming enorme se corta pronto y responde 413 sin leerlo entero', async () => {
    let pulled = 0
    const chunk = new Uint8Array(1024).fill(120)
    const body = new ReadableStream({ pull(c) { pulled += 1; if (pulled > 5000) c.close(); else c.enqueue(chunk) } })
    const request = new Request('https://dennysh.com/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json' }, body, duplex: 'half' })
    expect(request.headers.get('content-length')).toBeNull()
    const res = await simulate({ request, env: env(), next: async () => new Response('x') })
    expect(res.status).toBe(413)
    expect(await res.json()).toEqual({ code: 'E_INPUT' })
    expect(pulled).toBeLessThan(50) // ~4 KB de límite, no los ~5 MB ofrecidos
  })
})

describe('guardia de la clave de prueba de Turnstile (BAJO-2)', () => {
  it('clave de prueba + alertas activas es un error de configuración', async () => {
    await expect(buildServices(env({ TURNSTILE_SECRET: '1x0000000000000000000000000000000AA', ALERTS_ENABLED: 'true' }))).rejects.toThrow()
  })
  it('clave de prueba sin alertas (local/e2e) está permitida; clave real con alertas también', async () => {
    await expect(buildServices(env({ TURNSTILE_SECRET: '1x0000000000000000000000000000000AA' }))).resolves.toBeTruthy()
    await expect(buildServices(env({ ALERTS_ENABLED: 'true', TELEGRAM_BOT_TOKEN: 't', TELEGRAM_CHAT_ID: '1' }))).resolves.toBeTruthy()
  })
})

describe('hash de visitante IPv6 (BAJO-1)', () => {
  const K = 'v'.repeat(32)
  it('direcciones del mismo /64 comparten visitante; otro /64 no', async () => {
    const a = await visitorHash('2001:db8:1:2:aaaa:bbbb:cccc:dddd', K)
    expect(await visitorHash('2001:db8:1:2:1111:2222:3333:4444', K)).toBe(a)
    expect(await visitorHash('2001:db8:1:2::1', K)).toBe(a)
    expect(await visitorHash('2001:db8:1:3::1', K)).not.toBe(a)
  })
  it('IPv4 y vacío no cambian', () => {
    expect(visitorKeyFor('203.0.113.7')).toBe('203.0.113.7')
    expect(visitorKeyFor('')).toBe('no-ip')
  })
  it('formas abreviadas se expanden bien', () => {
    expect(visitorKeyFor('2001:db8::1')).toBe('2001:db8:0:0::/64')
    expect(visitorKeyFor('::1')).toBe('0:0:0:0::/64')
  })
})

describe('escáner de secretos y valores de prueba (BAJO-4)', () => {
  it('un secreto real en la misma línea que un valor de prueba sigue marcándose', () => {
    const line = "TURNSTILE_SECRET=1x0000000000000000000000000000000AA TELEGRAM_BOT_TOKEN=123456789:AAH-abcdefghijklmnopqrstuvwxyz0123456"
    expect(scanText('x.js', line).length).toBeGreaterThan(0)
  })
})

describe('purga acotada', () => {
  it('borra con sentencias únicas (no una por evento)', async () => {
    const db = createD1()
    const store = createStore(db)
    const seen = []
    const orig = db.prepare.bind(db)
    db.prepare = (sql) => (seen.push(sql), orig(sql))
    for (let i = 0; i < 5; i++) db.raw.prepare("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?,NULL)").run(`e${i}`, 1, 2, 'v', 'es', 'A', 'h', '{}', '{}')
    const r = await store.purgeExpired(1000)
    expect(r).toEqual({ kind: 'Ok', count: 5 })
    expect(seen.filter((s) => /^\s*DELETE/i.test(s)).length).toBeLessThanOrEqual(3)
  })
})
