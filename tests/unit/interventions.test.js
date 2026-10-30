import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { makeAudit } from '../helpers/fixtures.js'
import { createStore } from '../../server/store-d1.js'
import { chainInterventions } from '../../core/audit.js'

const T0 = 1_793_259_677_402
const setup = async (alert) => {
  const db = createD1()
  const store = createStore(db)
  const audit = await makeAudit({ eventId: 'ev1', nowMs: T0, alert })
  await store.putEvent({ audit, visitorHash: 'v1', lang: 'es' }, T0)
  return { db, store, audit }
}

describe('appendIntervention (AC-09, AC-26)', () => {
  it('añade en orden con seq 1..3 y actualiza el estado efectivo', async () => {
    const { store } = await setup()
    const r1 = await store.appendIntervention('ev1', 'approve', T0 + 1000)
    expect(r1.kind).toBe('Ok')
    expect(r1.interventions).toEqual([{ seq: 1, action: 'approve', atUtc: new Date(T0 + 1000).toISOString(), actor: 'visitor-demo' }])
    await store.appendIntervention('ev1', 'escalate', T0 + 2000)
    await store.appendIntervention('ev1', 'override', T0 + 3000)
    const ev = await store.getEvent('ev1', T0 + 4000)
    expect(ev.audit.interventions.map((i) => i.action)).toEqual(['approve', 'escalate', 'override'])
    expect(ev.audit.effectiveState).toBe('Overridden')
    expect(ev.audit.escalated).toBe(true)
  })

  it('la cuarta devuelve LimitReached y no escribe', async () => {
    const { db, store } = await setup()
    for (const a of ['approve', 'override', 'escalate']) await store.appendIntervention('ev1', a, T0)
    expect(await store.appendIntervention('ev1', 'approve', T0)).toEqual({ kind: 'LimitReached' })
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM interventions').get().n).toBe(3)
  })

  it('evento inexistente o caducado → NotFound', async () => {
    const { store } = await setup()
    expect(await store.appendIntervention('nada', 'approve', T0)).toEqual({ kind: 'NotFound' })
    expect(await store.appendIntervention('ev1', 'approve', T0 + 24 * 3_600_000)).toEqual({ kind: 'NotFound' })
  })

  it('acción inválida se rechaza sin tocar la base', async () => {
    const { db, store } = await setup()
    expect((await store.appendIntervention('ev1', 'delete', T0)).kind).toBe('BadAction')
    expect(db.raw.prepare('SELECT COUNT(*) AS n FROM interventions').get().n).toBe(0)
  })

  it('encadena los hashes: cada fila guarda el hash anterior (el primero, el del registro)', async () => {
    const { db, store, audit } = await setup()
    for (const a of ['approve', 'escalate', 'override']) await store.appendIntervention('ev1', a, T0 + 5)
    const rows = db.raw.prepare('SELECT seq, prevHash, hash FROM interventions ORDER BY seq').all()
    expect(rows[0].prevHash).toBe(audit.recordHash)
    expect(rows[1].prevHash).toBe(rows[0].hash)
    expect(rows[2].prevHash).toBe(rows[1].hash)
    const list = (await store.getEvent('ev1', T0 + 10)).audit.interventions
    expect(rows.map((r) => r.hash)).toEqual(await chainInterventions(audit.recordHash, list))
  })

  it('llamadas simultáneas nunca superan 3 filas ni repiten seq', async () => {
    const { db, store } = await setup()
    const r = await Promise.all(Array.from({ length: 10 }, () => store.appendIntervention('ev1', 'approve', T0)))
    expect(r.filter((x) => x.kind === 'Ok')).toHaveLength(3)
    expect(r.filter((x) => x.kind === 'LimitReached')).toHaveLength(7)
    expect(db.raw.prepare('SELECT seq FROM interventions ORDER BY seq').all().map((x) => x.seq)).toEqual([1, 2, 3])
  })

  it('almacén caído → StoreDown', async () => {
    const { db, store } = await setup()
    db.state.down = true
    expect(await store.appendIntervention('ev1', 'approve', T0)).toEqual({ kind: 'StoreDown' })
  })
})

describe('updateAlert', () => {
  it('guarda el estado de alerta y el id de mensaje (interno) sin tocar el sello', async () => {
    const { store, audit } = await setup()
    const alert = { status: 'Delivered', channel: 'telegram', atUtc: new Date(T0 + 500).toISOString(), maskedChat: '••••67', messageIdPresent: true }
    expect(await store.updateAlert('ev1', alert, 4242)).toEqual({ kind: 'Ok' })
    const ev = await store.getEvent('ev1', T0 + 1000)
    expect(ev.audit.alert).toEqual(alert)
    expect(ev.messageId).toBe(4242)
    expect(ev.audit.recordHash).toBe(audit.recordHash)
  })

  it('un evento inexistente → NotFound; caído → StoreDown', async () => {
    const { db, store } = await setup()
    expect(await store.updateAlert('nada', { status: 'TestMode', channel: 'none' })).toEqual({ kind: 'NotFound' })
    db.state.down = true
    expect(await store.updateAlert('ev1', { status: 'TestMode', channel: 'none' })).toEqual({ kind: 'StoreDown' })
  })
})

describe('interruptor de corte (T067-T068)', () => {
  it('cerrado por defecto; tras tripBreaker queda abierto 60 s y luego se cierra', async () => {
    const { store } = await setup()
    expect(await store.getBreaker(T0)).toEqual({ kind: 'Closed' })
    expect(await store.tripBreaker(T0)).toEqual({ kind: 'Ok' })
    expect(await store.getBreaker(T0 + 59_999)).toEqual({ kind: 'Open', untilAt: T0 + 60_000 })
    expect(await store.getBreaker(T0 + 60_000)).toEqual({ kind: 'Closed' })
  })

  it('volver a dispararlo no acorta una pausa ya abierta; se puede ampliar', async () => {
    const { store } = await setup()
    await store.tripBreaker(T0, 60)
    await store.tripBreaker(T0 + 10_000, 5)
    expect((await store.getBreaker(T0 + 20_000)).untilAt).toBe(T0 + 60_000)
    await store.tripBreaker(T0 + 30_000, 60)
    expect((await store.getBreaker(T0 + 40_000)).untilAt).toBe(T0 + 90_000)
  })

  it('caído → StoreDown en ambos', async () => {
    const { db, store } = await setup()
    db.state.down = true
    expect(await store.getBreaker(T0)).toEqual({ kind: 'StoreDown' })
    expect(await store.tripBreaker(T0)).toEqual({ kind: 'StoreDown' })
  })
})
