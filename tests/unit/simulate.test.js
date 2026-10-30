import { describe, it, expect } from 'vitest'
import { makeHarness, T0, EVENT_KEY } from '../helpers/harness.js'
import { verifyEventId } from '../../server/event-id.js'
import { GLOBAL_MAX } from '../../server/store-d1.js'

const MIN = 60_000
const order = (calls) => calls.filter((c) => c !== 'purgeExpired')

describe('POST /api/simulate: orden D-03', () => {
  it('verificar → cupo → interruptor → persistir → enviar → actualizar', async () => {
    const h = await makeHarness()
    const r = await h.post(h.ok)
    expect(r.status).toBe(200)
    expect(order(h.calls)).toEqual(['verify', 'reserveSlot', 'getBreaker', 'putEvent', 'send', 'confirmSlot', 'updateAlert'])
  })

  it('entrada inválida: 400 sin verificar, sin cupo y sin enviar', async () => {
    const h = await makeHarness()
    const r = await h.simulate({ method: 'POST', contentType: 'application/json', bodyText: '{"lang":"fr"}', ip: '1.1.1.1' })
    expect(r).toEqual({ status: 400, body: { code: 'E_INPUT' } })
    expect(h.calls).toEqual([])
  })

  it('bot: 403 E_BOT sin cupo, sin evento y sin enviar', async () => {
    const h = await makeHarness({ verify: () => ({ kind: 'Bot', reason: 'timeout-or-duplicate' }) })
    expect(await h.post(h.ok)).toEqual({ status: 403, body: { code: 'E_BOT' } })
    expect(h.calls).toEqual(['verify'])
  })

  it('verificador caído: 503 E_INTERNAL y no se envía nada', async () => {
    const h = await makeHarness({ verify: () => ({ kind: 'VerifierDown' }) })
    expect(await h.post(h.ok)).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(h.calls).toEqual(['verify'])
  })
})

describe('respuesta y evento', () => {
  it('200 { eventId, audit }; el eventId está firmado y el evento se puede leer', async () => {
    const h = await makeHarness()
    const r = await h.post({ ...h.ok, scenario: 'B' })
    expect(Object.keys(r.body).sort()).toEqual(['audit', 'eventId'])
    expect(await verifyEventId(r.body.eventId, EVENT_KEY)).toMatchObject({ ok: true })
    expect(r.body.audit.eventId).toBe(r.body.eventId)
    expect(r.body.audit.decision).toBe('Block')
    expect(r.body.audit.createdAtUtc).toBe(new Date(T0).toISOString())
    const stored = await h.realStore.getEvent(r.body.eventId, T0 + 1000)
    expect(stored.kind).toBe('Found')
    expect(stored.audit.alert.status).toBe('Delivered')
    expect(stored.messageId).toBe(4242)
  })

  it('respeta el escenario pedido y, si falta, elige uno (los tres existen)', async () => {
    const h = await makeHarness()
    const picked = {}
    for (const s of ['A', 'B', 'C']) picked[s] = (await h.post({ ...h.ok, scenario: s }, `203.0.113.${s.charCodeAt(0)}`)).body.audit.decision
    expect(picked).toEqual({ A: 'Limit', B: 'Block', C: 'Alert' })
    const seen = new Set()
    for (let i = 0; i < 40; i++) seen.add((await h.post(h.ok, `198.51.100.${i}`)).body.audit.scenario)
    expect([...seen].sort()).toEqual(['A', 'B', 'C'])
  })

  it('la IP del visitante nunca llega a la base', async () => {
    const h = await makeHarness()
    await h.post(h.ok, '203.0.113.99')
    const dump = JSON.stringify(h.db.raw.prepare('SELECT * FROM events').all()) + JSON.stringify(h.db.raw.prepare('SELECT * FROM alert_slots').all())
    expect(dump).not.toContain('203.0.113.99')
  })

  it('el mensaje enviado es la plantilla fija con [SIMULACIÓN] y el enlace al evento', async () => {
    const h = await makeHarness()
    const r = await h.post(h.ok)
    expect(h.notifier.sent).toHaveLength(1)
    expect(h.notifier.sent[0].startsWith('[SIMULACIÓN]')).toBe(true)
    expect(h.notifier.sent[0]).toContain(r.body.eventId)
  })
})

describe('AlertView por caso (AC-06, AC-21, spec §5.7)', () => {
  it('Delivered solo con confirmación: canal, hora, chat enmascarado, messageIdPresent', async () => {
    const h = await makeHarness()
    const a = (await h.post(h.ok)).body.audit.alert
    expect(a).toEqual({ status: 'Delivered', channel: 'telegram', atUtc: new Date(T0).toISOString(), maskedChat: '••••67', messageIdPresent: true })
  })

  it('Telegram falla (4xx): Failed con código propio, simulación completa', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Failed', code: 'rejected' }) })
    const r = await h.post(h.ok)
    expect(r.status).toBe(200)
    expect(r.body.audit.alert).toMatchObject({ status: 'Failed', channel: 'telegram', code: 'rejected' })
    expect(r.body.audit.decision).toBeTruthy()
  })

  it('tiempo agotado: Unconfirmed, nunca Delivered', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Unconfirmed' }) })
    const a = (await h.post(h.ok)).body.audit.alert
    expect(a.status).toBe('Unconfirmed')
    expect(a.code).toBe('timeout')
    expect(a.messageIdPresent).toBeUndefined()
  })

  it('modo prueba: TestMode, sin cupo y sin llamar al notificador', async () => {
    const h = await makeHarness({ config: { testMode: true } })
    const r = await h.post(h.ok)
    expect(r.body.audit.alert).toEqual({ status: 'TestMode', channel: 'none' })
    expect(order(h.calls)).toEqual(['verify', 'putEvent', 'updateAlert'])
  })

  it('alertas desactivadas (ALERTS_ENABLED≠true) se comportan como modo prueba', async () => {
    const h = await makeHarness({ config: { alertsEnabled: false } })
    expect((await h.post(h.ok)).body.audit.alert.status).toBe('TestMode')
    expect(h.calls).not.toContain('send')
  })

  it('el notificador en modo prueba (NotSent) también da TestMode', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'NotSent', reason: 'modo prueba' }) })
    expect((await h.post(h.ok)).body.audit.alert.status).toBe('TestMode')
  })
})

describe('topes (AC-07, AC-08, AC-32)', () => {
  it('segunda ejecución del mismo visitante en 10 min: Grouped con la hora de la primera; se envía una sola vez', async () => {
    const h = await makeHarness()
    await h.post(h.ok)
    h.clock.t = T0 + 4 * MIN
    const r = await h.post(h.ok)
    expect(r.status).toBe(200)
    expect(r.body.audit.alert).toEqual({ status: 'Grouped', channel: 'none', groupedWithAtUtc: new Date(T0).toISOString() })
    expect(h.notifier.sent).toHaveLength(1)
    expect(r.body.audit.decision).toBeTruthy()
  })

  it('a los 10 min vuelve a enviarse', async () => {
    const h = await makeHarness()
    await h.post(h.ok)
    h.clock.t = T0 + 10 * MIN
    expect((await h.post(h.ok)).body.audit.alert.status).toBe('Delivered')
    expect(h.notifier.sent).toHaveLength(2)
  })

  it('tope global: 20 envían y el 21.º se agrupa con la última alerta; el notificador no se invoca', async () => {
    const h = await makeHarness()
    for (let i = 0; i < GLOBAL_MAX; i++) {
      h.clock.t = T0 + i
      expect((await h.post(h.ok, `203.0.113.${i + 1}`)).body.audit.alert.status).toBe('Delivered')
    }
    h.clock.t = T0 + 100
    const r = await h.post(h.ok, '198.51.100.200')
    expect(r.body.audit.alert).toEqual({ status: 'Grouped', channel: 'none', groupedWithAtUtc: new Date(T0 + GLOBAL_MAX - 1).toISOString() })
    expect(h.notifier.sent).toHaveLength(GLOBAL_MAX)
  })

  it('cupo agotado nunca llama al notificador ni consulta el interruptor', async () => {
    const h = await makeHarness()
    await h.post(h.ok)
    h.calls.length = 0
    await h.post(h.ok)
    expect(order(h.calls)).toEqual(['verify', 'reserveSlot', 'putEvent', 'updateAlert'])
  })
})

describe('interruptor de corte (T067-T068)', () => {
  it('429 abre el interruptor 60 s; la siguiente alerta queda Paused sin llamar a Telegram', async () => {
    let n = 0
    const h = await makeHarness({ send: () => (++n === 1 ? { kind: 'Failed', code: 'rate_limited' } : { kind: 'Delivered', messageId: 9 }) })
    expect((await h.post(h.ok, '203.0.113.1')).body.audit.alert.code).toBe('rate_limited')
    h.clock.t = T0 + 30_000
    const paused = await h.post(h.ok, '203.0.113.2')
    expect(paused.body.audit.alert).toEqual({ status: 'Paused', channel: 'none' })
    expect(h.notifier.sent).toHaveLength(1)
    h.clock.t = T0 + 60_000
    expect((await h.post(h.ok, '203.0.113.3')).body.audit.alert.status).toBe('Delivered')
  })

  it.each([
    ['5xx', { kind: 'Failed', code: 'server_error' }, true],
    ['tiempo agotado', { kind: 'Unconfirmed' }, true],
    ['rechazo normal (400)', { kind: 'Failed', code: 'rejected' }, false],
    ['red', { kind: 'Failed', code: 'network' }, false],
  ])('%s → interruptor abierto=%s', async (_n, result, trips) => {
    const h = await makeHarness({ send: () => result })
    await h.post(h.ok)
    expect((await h.realStore.getBreaker(T0 + 1)).kind).toBe(trips ? 'Open' : 'Closed')
  })
})

describe('respaldo por correo (D-IMPL-06, puerto opcional)', () => {
  it('Telegram falla → se intenta el respaldo con estado propio y sin segundo cupo', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Failed', code: 'rejected' }), fallback: () => ({ kind: 'Delivered' }) })
    const r = await h.post(h.ok)
    expect(r.body.audit.alert).toMatchObject({ status: 'Failed', channel: 'telegram', code: 'rejected', fallback: { channel: 'email', status: 'Delivered' } })
    expect(h.calls.filter((c) => c === 'reserveSlot')).toHaveLength(1)
  })

  it('vence el tiempo → también se intenta; si el respaldo falla, lo dice', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Unconfirmed' }), fallback: () => ({ kind: 'Failed', code: 'rejected' }) })
    expect((await h.post(h.ok)).body.audit.alert.fallback).toMatchObject({ channel: 'email', status: 'Failed', code: 'rejected' })
  })

  it('no se usa si Telegram entregó, si hay tope o si está en pausa', async () => {
    const h = await makeHarness({ fallback: () => ({ kind: 'Delivered' }) })
    await h.post(h.ok)
    await h.post(h.ok)
    expect(h.calls).not.toContain('fallback')
  })

  it('sin puerto de respaldo no hay campo fallback', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Failed', code: 'rejected' }) })
    expect('fallback' in (await h.post(h.ok)).body.audit.alert).toBe(false)
  })
})

describe('fallo del almacén (D-IMPL-07)', () => {
  it('reserveSlot caído: 503 E_INTERNAL y sin envío', async () => {
    const h = await makeHarness({ failOn: ['reserveSlot'] })
    expect(await h.post(h.ok)).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(h.calls).not.toContain('send')
  })
  it('putEvent caído: 503 y sin envío', async () => {
    const h = await makeHarness({ failOn: ['putEvent'] })
    expect((await h.post(h.ok)).status).toBe(503)
    expect(h.calls).not.toContain('send')
  })
  it('getBreaker caído: 503 y sin envío', async () => {
    const h = await makeHarness({ failOn: ['getBreaker'] })
    expect((await h.post(h.ok)).status).toBe(503)
    expect(h.calls).not.toContain('send')
  })
  it('updateAlert caído tras enviar: responde 200 con el estado real', async () => {
    const h = await makeHarness({ failOn: ['updateAlert'] })
    const r = await h.post(h.ok)
    expect(r.status).toBe(200)
    expect(r.body.audit.alert.status).toBe('Delivered')
  })
})
