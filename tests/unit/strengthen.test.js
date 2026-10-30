import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { makeAudit, getRuleset } from '../helpers/fixtures.js'
import { makeHarness, T0 } from '../helpers/harness.js'
import { timingSafeEqual } from '../../server/hmac.js'
import { signEventId, verifyEventId } from '../../server/event-id.js'
import { visitorHash } from '../../server/visitor-hash.js'
import { verifyRecordHash } from '../../core/audit.js'
import { isReviewed } from '../../core/explain.js'
import { parseRequest, SIMULATE_SCHEMA, INTERVENE_SCHEMA } from '../../server/validation.js'
import { createTelegramNotifier } from '../../server/notifier.js'
import { createVerifier } from '../../server/verifier.js'
import { createStore, VISITOR_WINDOW_MS, GLOBAL_WINDOW_MS, GLOBAL_MAX, EVENT_TTL_MS, SLOT_TTL_MS } from '../../server/store-d1.js'
import { createGetEvent } from '../../server/event.js'
import { createIntervene } from '../../server/intervene.js'
import { onRequest as simulateRoute } from '../../functions/api/simulate.js'

const json = (b, status = 200) => new Response(JSON.stringify(b), { status })

describe('comparación en tiempo constante', () => {
  it('detecta una diferencia en cualquier posición y en la longitud', () => {
    const a = 'f'.repeat(32)
    expect(timingSafeEqual(a, a)).toBe(true)
    for (let i = 0; i < 32; i++) expect(timingSafeEqual(a, a.slice(0, i) + '0' + a.slice(i + 1)), `pos ${i}`).toBe(false)
    expect(timingSafeEqual('abc', 'abcd')).toBe(false)
    expect(timingSafeEqual('abcd', 'abc')).toBe(false)
  })
  it('una firma con el PRIMER carácter alterado no pasa', async () => {
    const id = await signEventId('a1b2c3d4e5f60718293a4b5c6d7e8f90', 'k'.repeat(32))
    const [raw, sig] = id.split('.')
    for (let i = 0; i < sig.length; i++) {
      const bad = sig.slice(0, i) + (sig[i] === '0' ? '1' : '0') + sig.slice(i + 1)
      expect((await verifyEventId(`${raw}.${bad}`, 'k'.repeat(32))).ok, `pos ${i}`).toBe(false)
    }
  })
})

describe('vectores conocidos (separación de dominio)', () => {
  it('signEventId y visitorHash con claves fijas dan siempre lo mismo', async () => {
    expect(await signEventId('a1b2c3d4e5f60718293a4b5c6d7e8f90', 'k'.repeat(32))).toBe('a1b2c3d4e5f60718293a4b5c6d7e8f90.df8911ae8d44fe49a705f6ba9d32675e')
    expect(await visitorHash('203.0.113.7', 'v'.repeat(32))).toBe('0f00df2ef4c5881af2b70cb9c128a7a46e5ad272cc35fcbba2314602460fbed7')
  })
})

describe('constantes con valores literales (no importadas de sí mismas)', () => {
  it('ventanas, topes y retenciones', () => {
    expect(VISITOR_WINDOW_MS).toBe(600_000)
    expect(GLOBAL_WINDOW_MS).toBe(86_400_000)
    expect(GLOBAL_MAX).toBe(20)
    expect(EVENT_TTL_MS).toBe(86_400_000)
    expect(SLOT_TTL_MS).toBe(90_000_000)
  })
})

describe('sello: todos los campos sellados se vigilan', () => {
  it.each(['usedData', 'unusedData', 'modules', 'matched', 'ruleset', 'engine', 'explanation', 'scenario', 'createdAtUtc', 'eventId'])('alterar %s rompe el sello', async (field) => {
    const a = await makeAudit({ nowMs: T0 })
    const tampered = { ...a, [field]: Array.isArray(a[field]) ? [...a[field], 'x'] : typeof a[field] === 'object' ? { ...a[field], x: 1 } : `${a[field]}x` }
    expect(await verifyRecordHash(tampered)).toBe(false)
  })
})

describe('fechas de revisión imposibles (AC-23)', () => {
  it.each(['2026-13-45', '2026-02-31x', 'ayer', ''])('"%s" no cuenta como revisada', (d) => {
    expect(isReviewed({ revisadaPor: 'Dennys', revisadaEn: d })).toBe(false)
  })
  it('una fecha real sí', () => expect(isReviewed({ revisadaPor: 'Dennys', revisadaEn: '2026-11-02' })).toBe(true))
})

describe('validación: bytes, fronteras, anclas, mayúsculas', () => {
  const req = (raw, type = 'application/json') => ({ method: 'POST', contentType: type, bodyText: raw })
  const pad = (n) => JSON.stringify({ lang: 'es', turnstileToken: 'x'.repeat(n) })
  it('4096 bytes exactos pasan el tamaño; 4097 dan 413', () => {
    const base = pad(0).length
    const at = (bytes) => { const t = 'x'.repeat(bytes - base); return JSON.stringify({ lang: 'es', turnstileToken: t }) }
    expect(new TextEncoder().encode(at(2000)).length).toBe(2000)
    // el token máximo es 2048, así que la frontera de 4096 B se prueba con relleno en un campo extra → 400 (no 413)
    const exact = JSON.stringify({ lang: 'es', turnstileToken: 't', pad: 'x'.repeat(4096 - JSON.stringify({ lang: 'es', turnstileToken: 't', pad: '' }).length) })
    expect(new TextEncoder().encode(exact).length).toBe(4096)
    expect(parseRequest(req(exact), SIMULATE_SCHEMA).status).toBe(400)
    expect(parseRequest(req(exact + ' '), SIMULATE_SCHEMA).status).toBe(413)
  })
  it('cuenta bytes UTF-8, no caracteres', () => {
    const multi = JSON.stringify({ lang: 'es', turnstileToken: 't', pad: 'ñ'.repeat(2100) })
    expect(multi.length).toBeLessThan(4096)
    expect(new TextEncoder().encode(multi).length).toBeGreaterThan(4096)
    expect(parseRequest(req(multi), SIMULATE_SCHEMA).status).toBe(413)
  })
  it('eventId con prefijo o sufijo extra se rechaza (400)', () => {
    const id = 'a'.repeat(32) + '.' + 'b'.repeat(32)
    for (const bad of [`x${id}`, `${id}z`, ` ${id}`]) {
      expect(parseRequest(req(JSON.stringify({ eventId: bad, action: 'approve' })), INTERVENE_SCHEMA).status, bad).toBe(400)
    }
  })
  it('Content-Type en mayúsculas es válido', () => {
    expect(parseRequest(req(pad(1), 'Application/JSON; charset=utf-8'), SIMULATE_SCHEMA).ok).toBe(true)
  })
})

describe('notificador y verificador: códigos exactos', () => {
  const mk = (res) => createTelegramNotifier({ token: '1:' + 'a'.repeat(35), chatId: '1', fetch: async () => res(), timeoutMs: 50 })
  it('HTTP 500 exacto es server_error; 429 rate_limited; 400 rejected', async () => {
    expect(await mk(() => json({ ok: false }, 500)).send('t')).toEqual({ kind: 'Failed', code: 'server_error' })
    expect(await mk(() => json({ ok: false }, 429)).send('t')).toEqual({ kind: 'Failed', code: 'rate_limited' })
    expect(await mk(() => json({ ok: false }, 499)).send('t')).toEqual({ kind: 'Failed', code: 'rejected' })
  })
  it('edit con message_id 0 se rechaza sin red', async () => {
    let calls = 0
    const n = createTelegramNotifier({ token: '1:' + 'a'.repeat(35), chatId: '1', fetch: async () => (calls++, json({ ok: true })) })
    expect(await n.edit(0, 't')).toEqual({ kind: 'Failed', code: 'bad_message_id' })
    expect(calls).toBe(0)
  })
  it.each(['internal-error', 'invalid-input-secret', 'missing-input-secret'])('Turnstile %s → VerifierDown (cierra seguro, no culpa al visitante)', async (code) => {
    const v = createVerifier({ secret: 's', fetch: async () => json({ success: false, 'error-codes': [code] }), expectedHost: 'dennysh.com' })
    expect(await v.verify('t')).toEqual({ kind: 'VerifierDown' })
  })
})

describe('retención: fronteras exactas y llamada desde simulate', () => {
  it('el evento con expiresAt == now y el cupo con at == now - 25 h se purgan', async () => {
    const db = createD1(); const store = createStore(db)
    db.raw.prepare("INSERT INTO events VALUES ('e',1,1000,'v','es','A','h','{}','{}',NULL)").run()
    db.raw.prepare("INSERT INTO alert_slots VALUES ('s','v',?, NULL,'Reserved')").run(1000 - SLOT_TTL_MS)
    expect((await store.purgeExpired(1000)).count).toBe(2)
  })
  it('un simulate borra lo caducado (la purga oportunista se ejecuta)', async () => {
    const h = await makeHarness()
    h.db.raw.prepare("INSERT INTO events VALUES ('viejo',1,2,'v','es','A','h','{}','{}',NULL)").run()
    await h.post(h.ok)
    expect(h.db.raw.prepare("SELECT COUNT(*) AS n FROM events WHERE id = 'viejo'").get().n).toBe(0)
  })
})

describe('eventId con firma falsa aunque exista la fila', () => {
  it('GET e intervene dan 404 si la firma no es válida', async () => {
    const h = await makeHarness()
    const { body } = await h.post(h.ok)
    const [raw] = body.eventId.split('.')
    const forged = `${raw}.${'0'.repeat(32)}`
    h.db.raw.prepare('UPDATE events SET id = ?').run(forged) // la fila existe con ese id, pero la firma no es nuestra
    const get = createGetEvent({ store: h.store, clock: h.clock, config: h.config })
    expect((await get({ method: 'GET', eventId: forged })).status).toBe(404)
    const iv = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
    expect((await iv({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId: forged, action: 'approve' }) })).status).toBe(404)
  })
})

describe('Escalar dos veces conserva el message_id (AC-26)', () => {
  it('la segunda edición también llega a Telegram', async () => {
    const h = await makeHarness()
    const { body } = await h.post(h.ok)
    const iv = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
    const go = () => iv({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId: body.eventId, action: 'escalate' }) })
    expect((await go()).body.audit.alert.escalation).toBe('Edited')
    expect((await go()).body.audit.alert.escalation).toBe('Edited')
    expect(h.notifier.edits).toHaveLength(2)
  })
})

describe('Content-Length mentiroso (handlers)', () => {
  it('Content-Length enorme con cuerpo corto → 413 sin leer', async () => {
    const request = new Request('https://dennysh.com/api/simulate', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': '99999' }, body: '{}' })
    const res = await simulateRoute({ request, env: { DB: createD1(), TURNSTILE_SECRET: 's', VISITOR_HMAC_KEY: 'v'.repeat(32), EVENT_HMAC_KEY: 'e'.repeat(32) }, next: async () => new Response('x') })
    expect(res.status).toBe(413)
  })
})

describe('AC-27: dos simulate en paralelo del mismo visitante', () => {
  it('solo uno recibe cupo y solo se envía una alerta', async () => {
    const h = await makeHarness()
    const [a, b] = await Promise.all([h.post(h.ok), h.post(h.ok)])
    expect([a.body.audit.alert.status, b.body.audit.alert.status].sort()).toEqual(['Delivered', 'Grouped'])
    expect(h.notifier.sent).toHaveLength(1)
  })
})

describe('AC-24: el hash que firma el servidor es el del ruleset público', () => {
  it('coincide con el ruleset cargado por el servicio', async () => {
    const h = await makeHarness()
    const { body } = await h.post(h.ok)
    expect(body.audit.ruleset.hash).toBe((await getRuleset()).hash)
  })
})
