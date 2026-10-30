import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { createD1 } from '../helpers/d1.js'
import { onRequest as simulate } from '../../functions/api/simulate.js'
import { buildServices } from '../../server/services.js'

const wrangler = JSON.parse(readFileSync('wrangler.jsonc', 'utf8').split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'))
afterEach(() => vi.unstubAllGlobals())

describe('wrangler.jsonc: alertas solo en Producción (formato de Pages)', () => {
  it('Producción activa ALERTS_ENABLED; Vista previa y nivel superior no lo hacen', () => {
    expect(wrangler.env.production.vars).toEqual({ ALERTS_ENABLED: 'true' })
    expect(wrangler.env.preview?.vars?.ALERTS_ENABLED).toBeUndefined()
    expect(wrangler.vars?.ALERTS_ENABLED).toBeUndefined()
  })
  it('las claves no heredables se repiten en el entorno (regla de Pages): la base D1 es la misma', () => {
    expect(wrangler.env.production.d1_databases).toEqual(wrangler.d1_databases)
    if (wrangler.env.preview) expect(wrangler.env.preview.d1_databases).toEqual(wrangler.d1_databases)
  })
  it('ninguna variable de texto del archivo es un secreto', () => {
    const names = [...Object.keys(wrangler.vars ?? {}), ...Object.keys(wrangler.env.production.vars), ...Object.keys(wrangler.env.preview?.vars ?? {})]
    expect(names.filter((n) => /SECRET|TOKEN|KEY|CHAT_ID/.test(n))).toEqual([])
  })
})

describe('ALERTS_ENABLED=true sin secretos de Telegram: degrada con honestidad', () => {
  const base = { DB: undefined, TURNSTILE_SECRET: 's', VISITOR_HMAC_KEY: 'v'.repeat(32), EVENT_HMAC_KEY: 'e'.repeat(32), ALERTS_ENABLED: 'true' }
  const req = () => new Request('https://dennysh.com/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': '203.0.113.7' }, body: JSON.stringify({ lang: 'es', scenario: 'A', turnstileToken: 't' }) })
  const run = async (over) => {
    const env = { ...base, DB: createD1(), ...over }
    const calls = []
    vi.stubGlobal('fetch', async (u) => { calls.push(String(u)); return String(u).includes('siteverify') ? new Response(JSON.stringify({ success: true, hostname: 'dennysh.com' })) : new Response('{}') })
    const res = await simulate({ request: req(), env, next: async () => new Response('x') })
    return { res, body: await res.json(), calls, env }
  }
  it.each([
    ['sin token ni chat', {}],
    ['solo falta el token', { TELEGRAM_CHAT_ID: '1' }],
    ['solo falta el chat', { TELEGRAM_BOT_TOKEN: '123:abc' }],
  ])('%s: 200, modo prueba, nunca Entregada, no llama a Telegram ni gasta cupo', async (_n, over) => {
    const { res, body, calls, env } = await run(over)
    expect(res.status).toBe(200)
    expect(body.audit.alert).toEqual({ status: 'TestMode', channel: 'none' })
    expect(calls.some((u) => u.includes('api.telegram.org'))).toBe(false)
    expect(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM alert_slots').get().n).toBe(0)
  })
  it('la clave de prueba de Turnstile sigue prohibida con la bandera activa aunque falte Telegram', async () => {
    await expect(buildServices({ ...base, DB: createD1(), TURNSTILE_SECRET: '1x0000000000000000000000000000000AA' })).rejects.toThrow()
  })
  it('con los secretos completos las alertas siguen activas (no se rompe el camino real)', async () => {
    const s = await buildServices({ ...base, DB: createD1(), TELEGRAM_BOT_TOKEN: '123:abc', TELEGRAM_CHAT_ID: '1' })
    expect(s.config.alertsEnabled).toBe(true)
    expect(s.config.testMode).toBe(false)
  })
})
