import { describe, it, expect } from 'vitest'
import { makeHarness, T0, EVENT_KEY } from '../helpers/harness.js'
import { createIntervene } from '../../server/intervene.js'
import { signEventId } from '../../server/event-id.js'

async function setup(over = {}) {
  const h = await makeHarness(over)
  const { body } = await h.post({ ...h.ok, scenario: 'A' })
  const intervene = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
  const act = (action, eventId = body.eventId) =>
    intervene({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId, action }) })
  return { h, body, act }
}

describe('POST /api/intervene (AC-09, AC-26, D-04)', () => {
  it('Aprobar añade una línea con hora y actor y fija el estado efectivo', async () => {
    const { h, act } = await setup()
    h.clock.t = T0 + 5000
    const r = await act('approve')
    expect(r.status).toBe(200)
    expect(r.body.audit.interventions).toEqual([{ seq: 1, action: 'approve', atUtc: new Date(T0 + 5000).toISOString(), actor: 'visitor-demo' }])
    expect(r.body.audit.effectiveState).toBe('Approved')
  })

  it('Anular revierte: estado Overridden; la última de Aprobar/Anular manda', async () => {
    const { act } = await setup()
    await act('approve')
    expect((await act('override')).body.audit.effectiveState).toBe('Overridden')
  })

  it('la cuarta acción devuelve 409 E_LIMIT y no escribe', async () => {
    const { h, act } = await setup()
    await act('approve'); await act('override'); await act('approve')
    expect(await act('override')).toEqual({ status: 409, body: { code: 'E_LIMIT' } })
    expect(h.db.raw.prepare('SELECT COUNT(*) AS n FROM interventions').get().n).toBe(3)
  })

  it('eventId con firma inválida, inexistente o caducado → 404 E_NOT_FOUND uniforme', async () => {
    const { h, body, act } = await setup()
    const forged = body.eventId.replace(/.$/, (c) => (c === '0' ? '1' : '0'))
    const unknown = await signEventId('f'.repeat(32), EVENT_KEY)
    for (const id of [forged, unknown]) expect(await act('approve', id)).toEqual({ status: 404, body: { code: 'E_NOT_FOUND' } })
    h.clock.t = T0 + 24 * 3_600_000
    expect(await act('approve')).toEqual({ status: 404, body: { code: 'E_NOT_FOUND' } })
  })

  it('entrada inválida → 400 E_INPUT sin tocar el almacén', async () => {
    const { h, body } = await setup()
    const intervene = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
    h.calls.length = 0
    const r = await intervene({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId: body.eventId, action: 'x' }) })
    expect(r).toEqual({ status: 400, body: { code: 'E_INPUT' } })
    expect(h.calls).toEqual([])
  })

  it('almacén caído → 503 E_INTERNAL', async () => {
    const { h, act } = await setup()
    h.db.state.down = true
    expect(await act('approve')).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
  })
})

describe('Escalar (spec §5.5)', () => {
  it('con mensaje: edita el mensaje de Telegram (sin enviar otro) y marca escalado', async () => {
    const { h, act } = await setup()
    const sentBefore = h.notifier.sent.length
    const r = await act('escalate')
    expect(h.notifier.edits).toHaveLength(1)
    expect(h.notifier.edits[0].id).toBe(4242)
    expect(h.notifier.edits[0].text.startsWith('[SIMULACIÓN]')).toBe(true)
    expect(h.notifier.edits[0].text).toMatch(/escalad/i)
    expect(h.notifier.sent).toHaveLength(sentBefore)
    expect(r.body.audit.escalated).toBe(true)
    expect(r.body.audit.effectiveState).toBe('Decided')
    expect(r.body.audit.alert.escalation).toBe('Edited')
  })

  it('no gasta cupo: no reserva ni consulta cupos', async () => {
    const { h, act } = await setup()
    h.calls.length = 0
    await act('escalate')
    expect(h.calls).not.toContain('reserveSlot')
  })

  it('sin mensaje (tope alcanzado) → escalation NoMessage y no llama a editar', async () => {
    const h = await makeHarness()
    await h.post(h.ok)
    const { body } = await h.post(h.ok) // agrupada
    const intervene = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
    const r = await intervene({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId: body.eventId, action: 'escalate' }) })
    expect(r.body.audit.alert.escalation).toBe('NoMessage')
    expect(h.notifier.edits).toHaveLength(0)
  })

  it('si la edición falla se muestra el fallo y la intervención queda registrada', async () => {
    const { h, act } = await setup({ edit: () => ({ kind: 'Failed', code: 'rejected' }) })
    const r = await act('escalate')
    expect(r.status).toBe(200)
    expect(r.body.audit.alert.escalation).toBe('Failed')
    expect(r.body.audit.interventions.map((i) => i.action)).toEqual(['escalate'])
  })

  it('el id del mensaje de Telegram nunca sale en la respuesta', async () => {
    const { act } = await setup()
    expect(JSON.stringify((await act('escalate')).body)).not.toContain('4242')
  })
})
