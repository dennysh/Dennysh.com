import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { makeAudit } from '../helpers/fixtures.js'
import { createStore, GLOBAL_MAX } from '../../server/store-d1.js'

const T0 = 1_793_259_677_402
const H = 3_600_000
const fresh = () => {
  const db = createD1()
  return { db, store: createStore(db) }
}
const count = (db, t) => db.raw.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n
const put = async (store, audit, extra = {}) => store.putEvent({ audit, visitorHash: 'v1', lang: 'es', ...extra }, T0)

describe('caducidad de eventos (AC-25, D-05)', () => {
  it('visible antes de 24 h; a las 24 h y a las 24 h 30 min no existe, aunque la fila siga', async () => {
    const { db, store } = fresh()
    const audit = await makeAudit({ eventId: 'ev1', nowMs: T0 })
    expect(await put(store, audit)).toEqual({ kind: 'Ok' })
    const early = await store.getEvent('ev1', T0 + 24 * H - 1)
    expect(early.kind).toBe('Found')
    expect(early.audit.recordHash).toBe(audit.recordHash)
    expect(await store.getEvent('ev1', T0 + 24 * H)).toEqual({ kind: 'NotFoundOrExpired' })
    expect(await store.getEvent('ev1', T0 + 24 * H + 30 * 60_000)).toEqual({ kind: 'NotFoundOrExpired' })
    expect(count(db, 'events')).toBe(1)
  })

  it('un id desconocido es NotFoundOrExpired', async () => {
    expect(await fresh().store.getEvent('nada', T0)).toEqual({ kind: 'NotFoundOrExpired' })
  })
})

describe('purga oportunista (sin cron)', () => {
  it('a las 24 h 30 min borra el evento y sus intervenciones pero conserva el cupo de 25 h', async () => {
    const { db, store } = fresh()
    await put(store, await makeAudit({ eventId: 'ev1', nowMs: T0 }))
    db.raw.prepare("INSERT INTO interventions VALUES ('ev1',1,'approve',?,'p','h')").run(T0)
    await store.reserveSlot('v1', T0)
    const n = await store.purgeExpired(T0 + 24 * H + 30 * 60_000)
    expect(n.kind).toBe('Ok')
    expect(n.count).toBe(2)
    expect(count(db, 'events')).toBe(0)
    expect(count(db, 'interventions')).toBe(0)
    expect(count(db, 'alert_slots')).toBe(1)
  })

  it('a las 25 h 30 min también se purgan las filas de cupo', async () => {
    const { db, store } = fresh()
    await store.reserveSlot('v1', T0)
    expect((await store.purgeExpired(T0 + 25 * H - 1)).count).toBe(0)
    expect((await store.purgeExpired(T0 + 25 * H + 30 * 60_000)).count).toBe(1)
    expect(count(db, 'alert_slots')).toBe(0)
  })

  it('un cupo de hace 24 h 30 min ya no cuenta para el tope global (ventana móvil exacta)', async () => {
    const { store } = fresh()
    for (let i = 0; i < GLOBAL_MAX; i++) await store.reserveSlot(`v${i}`, T0)
    const later = T0 + 24 * H + 30 * 60_000
    expect((await store.reserveSlot('nuevo', later)).kind).toBe('Reserved')
  })

  it('no toca eventos vigentes', async () => {
    const { db, store } = fresh()
    await put(store, await makeAudit({ eventId: 'ev1', nowMs: T0 }))
    await store.purgeExpired(T0 + 1 * H)
    expect(count(db, 'events')).toBe(1)
  })

  it('con el almacén caído devuelve StoreDown', async () => {
    const { db, store } = fresh()
    db.state.down = true
    expect(await store.purgeExpired(T0)).toEqual({ kind: 'StoreDown' })
    expect(await store.getEvent('x', T0)).toEqual({ kind: 'StoreDown' })
  })
})
