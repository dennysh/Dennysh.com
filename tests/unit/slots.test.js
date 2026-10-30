import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { createStore, VISITOR_WINDOW_MS, GLOBAL_WINDOW_MS, GLOBAL_MAX } from '../../server/store-d1.js'

const T0 = 1_793_259_677_402
const v = (i) => `visitor-${i}`
const fresh = () => {
  const db = createD1()
  return { db, store: createStore(db) }
}

describe('reserveSlot: tope por visitante (AC-07)', () => {
  it('primera vez Reserved; segunda dentro de 10 min VisitorCap con la hora de la anterior', async () => {
    const { store } = fresh()
    const a = await store.reserveSlot(v(1), T0)
    expect(a.kind).toBe('Reserved')
    expect(typeof a.slotId).toBe('string')
    expect(await store.reserveSlot(v(1), T0 + 5 * 60_000)).toEqual({ kind: 'VisitorCap', lastAlertAt: T0 })
  })

  it('a los 10 min exactos se libera (ventana abierta por la izquierda)', async () => {
    const { store } = fresh()
    await store.reserveSlot(v(1), T0)
    expect((await store.reserveSlot(v(1), T0 + VISITOR_WINDOW_MS - 1)).kind).toBe('VisitorCap')
    expect((await store.reserveSlot(v(1), T0 + VISITOR_WINDOW_MS)).kind).toBe('Reserved')
  })

  it('otro visitante no se ve afectado', async () => {
    const { store } = fresh()
    await store.reserveSlot(v(1), T0)
    expect((await store.reserveSlot(v(2), T0 + 1)).kind).toBe('Reserved')
  })
})

describe('reserveSlot: tope global en ventana móvil de 24 h (AC-08, AC-32)', () => {
  it('20 visitantes distintos pasan; el 21.º recibe GlobalCap con la última alerta', async () => {
    const { store } = fresh()
    for (let i = 0; i < GLOBAL_MAX; i++) expect((await store.reserveSlot(v(i), T0 + i)).kind).toBe('Reserved')
    expect(await store.reserveSlot(v(99), T0 + 100)).toEqual({ kind: 'GlobalCap', lastAlertAt: T0 + GLOBAL_MAX - 1 })
  })

  it('es móvil: pasadas 24 h de la más antigua vuelve a haber hueco; no depende del día de calendario', async () => {
    const { store } = fresh()
    for (let i = 0; i < GLOBAL_MAX; i++) await store.reserveSlot(v(i), T0 + i)
    expect((await store.reserveSlot(v(50), T0 + GLOBAL_WINDOW_MS - 1)).kind).toBe('GlobalCap')
    expect((await store.reserveSlot(v(51), T0 + GLOBAL_WINDOW_MS)).kind).toBe('Reserved')
    expect((await store.reserveSlot(v(52), T0 + GLOBAL_WINDOW_MS)).kind).toBe('GlobalCap')
  })

  it('con ambos topes agotados informa el del visitante', async () => {
    const { store } = fresh()
    for (let i = 0; i < GLOBAL_MAX; i++) await store.reserveSlot(v(i), T0 + i)
    expect((await store.reserveSlot(v(3), T0 + 1000)).kind).toBe('VisitorCap')
  })
})

describe('reserveSlot: atomicidad bajo concurrencia (AC-32)', () => {
  it('50 llamadas simultáneas de visitantes distintos reservan exactamente 20', async () => {
    const { store } = fresh()
    const r = await Promise.all(Array.from({ length: 50 }, (_, i) => store.reserveSlot(v(i), T0)))
    expect(r.filter((x) => x.kind === 'Reserved')).toHaveLength(20)
    expect(r.filter((x) => x.kind === 'GlobalCap')).toHaveLength(30)
  })

  it('50 llamadas simultáneas del mismo visitante reservan exactamente 1', async () => {
    const { store } = fresh()
    const r = await Promise.all(Array.from({ length: 50 }, () => store.reserveSlot(v(1), T0)))
    expect(r.filter((x) => x.kind === 'Reserved')).toHaveLength(1)
    expect(r.filter((x) => x.kind === 'VisitorCap')).toHaveLength(49)
  })

  it('la reserva es una sola sentencia SQL (sin leer y luego escribir)', async () => {
    const { db, store } = fresh()
    const seen = []
    const orig = db.prepare.bind(db)
    db.prepare = (sql) => (seen.push(sql), orig(sql))
    await store.reserveSlot(v(1), T0)
    const writes = seen.filter((s) => /^\s*INSERT/i.test(s))
    expect(writes).toHaveLength(1)
    expect(writes[0]).toMatch(/WHERE[\s\S]*COUNT/i)
  })

  it('el cupo se consume aunque nadie lo use después (no se libera)', async () => {
    const { store } = fresh()
    await store.reserveSlot(v(1), T0)
    expect((await store.reserveSlot(v(1), T0 + 1)).kind).toBe('VisitorCap')
  })
})

describe('reserveSlot: fallo del almacén', () => {
  it('devuelve StoreDown y no lanza', async () => {
    const { db, store } = fresh()
    db.state.down = true
    expect(await store.reserveSlot(v(1), T0)).toEqual({ kind: 'StoreDown' })
  })
})
