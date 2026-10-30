import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { visitorHash } from '../../server/visitor-hash.js'
import { onRequest as simulate } from '../../functions/api/simulate.js'
import { onRequest as intervene } from '../../functions/api/intervene.js'
import { onRequest as eventRoute } from '../../functions/api/event/[id].js'

const TOKEN = '123456789:AAH-super-secret-token-value-0000'
const CHAT = '987654367'
const TSECRET = 'turnstile-secret-value'
const EKEY = 'e'.repeat(32)
const VKEY = 'v'.repeat(32)
const IP = '203.0.113.7'
const env = () => ({
  DB: createD1(), TURNSTILE_SECRET: TSECRET, TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_CHAT_ID: CHAT,
  VISITOR_HMAC_KEY: VKEY, EVENT_HMAC_KEY: EKEY, ALERTS_ENABLED: 'true',
})
const stubFetch = (over = {}) =>
  vi.stubGlobal('fetch', async (url) => {
    if (String(url).includes('siteverify')) return new Response(JSON.stringify(over.turnstile ?? { success: true, hostname: 'dennysh.com' }))
    return new Response(JSON.stringify(over.telegram ?? { ok: true, result: { message_id: 4242 } }))
  })
const post = (path, body, e, ip = IP) =>
  new Request(`https://dennysh.com${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip }, body: typeof body === 'string' ? body : JSON.stringify(body) })
const call = (fn, request, e, params = {}) => fn({ request, env: e, params, next: async () => new Response('x') })

const only = (obj, required, optional = []) => {
  const keys = Object.keys(obj)
  for (const k of required) expect(keys, `falta ${k}`).toContain(k)
  for (const k of keys) expect([...required, ...optional], `campo no permitido: ${k}`).toContain(k)
}
function assertAudit(a) {
  only(a, ['eventId', 'createdAtUtc', 'scenario', 'input', 'engine', 'ruleset', 'matched', 'decision', 'explanation', 'modules', 'usedData', 'unusedData', 'alert', 'interventions', 'effectiveState', 'escalated', 'recordHash'])
  only(a.input, ['accountLabel', 'sourceIp', 'kind', 'params'])
  const P = { A: ['failedAttempts', 'windowSeconds'], B: ['fromCity', 'toCity', 'distanceKm', 'minutes', 'impliedSpeedKmh'], C: ['action', 'localTime', 'orgZone'] }
  only(a.input.params, P[a.input.kind])
  only(a.engine, ['name', 'version', 'kind'])
  only(a.ruleset, ['version', 'hash'])
  for (const m of a.matched) only(m, ['ruleId', 'ruleVersion'])
  only(a.explanation, ['templateId', 'version', 'params', 'reviewState'], ['reviewedAt'])
  only(a.explanation.params, ['ruleId', 'thresholds', 'observed'], ['durationLabel'])
  for (const m of a.modules) only(m, ['id', 'version'])
  only(a.alert, ['status', 'channel'], ['atUtc', 'maskedChat', 'messageIdPresent', 'groupedWithAtUtc', 'code', 'fallback', 'escalation'])
  if (a.alert.fallback) only(a.alert.fallback, ['channel', 'status'], ['atUtc', 'code'])
  for (const i of a.interventions) only(i, ['seq', 'action', 'atUtc', 'actor'])
}
const assertHeaders = (res) => {
  expect(res.headers.get('content-security-policy')).toContain("frame-ancestors 'none'")
  expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  expect(res.headers.get('strict-transport-security')).toBeTruthy()
  expect(res.headers.get('cross-origin-opener-policy')).toBe('same-origin')
  expect(res.headers.get('cache-control')).toBe('no-store')
  expect(res.headers.get('set-cookie')).toBeNull()
}
const NEVER = async () => [TOKEN, '4242:', CHAT, TSECRET, EKEY, VKEY, IP, await visitorHash(IP, VKEY), 'Traceback', 'stack', ' at ', 'node_modules']

beforeEach(() => stubFetch())
afterEach(() => vi.unstubAllGlobals())

describe('lista blanca de respuestas (S17, AC-11, AC-13)', () => {
  it('simulate → intervene → event: solo campos permitidos, cabeceras y nada sensible', async () => {
    const e = env()
    const texts = []
    const s = await call(simulate, post('/api/simulate', { lang: 'es', scenario: 'A', turnstileToken: 't' }), e)
    expect(s.status).toBe(200); assertHeaders(s)
    const sb = await s.clone().json(); texts.push(await s.text())
    only(sb, ['eventId', 'audit']); assertAudit(sb.audit)
    expect(sb.audit.alert).toEqual(expect.objectContaining({ status: 'Delivered', maskedChat: '••••67', messageIdPresent: true }))

    const i = await call(intervene, post('/api/intervene', { eventId: sb.eventId, action: 'escalate' }), e)
    expect(i.status).toBe(200); assertHeaders(i)
    const ib = await i.clone().json(); texts.push(await i.text())
    only(ib, ['audit']); assertAudit(ib.audit)
    expect(ib.audit.alert.escalation).toBe('Edited')

    const g = await call(eventRoute, new Request(`https://dennysh.com/api/event/${sb.eventId}`), e, { id: sb.eventId })
    expect(g.status).toBe(200); assertHeaders(g)
    const gb = await g.clone().json(); texts.push(await g.text())
    only(gb, ['audit']); assertAudit(gb.audit)

    for (const t of texts) for (const bad of await NEVER()) expect(t).not.toContain(bad)
  })

  it('errores: solo { code }, con cabeceras, en los tres endpoints', async () => {
    const e = env()
    const cases = [
      [simulate, post('/api/simulate', { lang: 'fr' }, e), 400, 'E_INPUT'],
      [simulate, new Request('https://dennysh.com/api/simulate'), 405, 'E_INPUT'],
      [intervene, post('/api/intervene', 'no json', e), 400, 'E_INPUT'],
      [intervene, post('/api/intervene', { eventId: 'a'.repeat(32) + '.' + 'b'.repeat(32), action: 'approve' }, e), 404, 'E_NOT_FOUND'],
      [eventRoute, new Request('https://dennysh.com/api/event/zzz'), 404, 'E_NOT_FOUND'],
    ]
    for (const [fn, req, status, code] of cases) {
      const res = await call(fn, req, e, { id: 'zzz' })
      expect(res.status).toBe(status); assertHeaders(res)
      expect(await res.json()).toEqual({ code })
    }
  })

  it('bot (Turnstile rechaza): 403 E_BOT sin detalles del proveedor', async () => {
    stubFetch({ turnstile: { success: false, 'error-codes': ['timeout-or-duplicate'], hostname: 'x' } })
    const res = await call(simulate, post('/api/simulate', { lang: 'es', turnstileToken: 't' }), env())
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ code: 'E_BOT' })
  })

  it('configuración incompleta (falta una clave) → 503 E_INTERNAL sin detalles ni cabeceras ausentes', async () => {
    const e = env(); delete e.EVENT_HMAC_KEY
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let res
    try {
      res = await call(simulate, post('/api/simulate', { lang: 'es', turnstileToken: 't' }), e)
      expect(spy.mock.calls.map((c) => String(c[0]))).toEqual(['api_error Error: configuración incompleta, falta EVENT_HMAC_KEY'])
    } finally {
      spy.mockRestore()
    }
    expect(res.status).toBe(503); assertHeaders(res)
    expect(await res.json()).toEqual({ code: 'E_INTERNAL' })
  })

  it('un campo extra NO sellado en el registro almacenado no llega a la respuesta (defensa en profundidad)', async () => {
    const e = env()
    const sb = await (await call(simulate, post('/api/simulate', { lang: 'es', scenario: 'B', turnstileToken: 't' }), e)).json()
    const row = e.DB.raw.prepare('SELECT auditJson FROM events').get()
    e.DB.raw.prepare('UPDATE events SET auditJson = ?').run(JSON.stringify({ ...JSON.parse(row.auditJson), internalNote: 'secreto', visitorHash: 'abc' }))
    const g = await call(eventRoute, new Request('https://x/api/event/' + sb.eventId), e, { id: sb.eventId })
    const text = await g.text()
    expect(text).not.toContain('secreto')
    expect(text).not.toContain('visitorHash')
    assertAudit(JSON.parse(text).audit)
  })

  it('un campo SELLADO alterado en la base se detecta y la API responde 503 (sello de integridad)', async () => {
    const e = env()
    const sb = await (await call(simulate, post('/api/simulate', { lang: 'es', scenario: 'B', turnstileToken: 't' }), e)).json()
    const row = e.DB.raw.prepare('SELECT auditJson FROM events').get()
    const polluted = { ...JSON.parse(row.auditJson), input: { ...JSON.parse(row.auditJson).input, visitorHash: 'abc' } }
    e.DB.raw.prepare('UPDATE events SET auditJson = ?').run(JSON.stringify(polluted))
    const g = await call(eventRoute, new Request('https://x/api/event/' + sb.eventId), e, { id: sb.eventId })
    expect(g.status).toBe(503)
    expect(await g.json()).toEqual({ code: 'E_INTERNAL' })
  })
})
