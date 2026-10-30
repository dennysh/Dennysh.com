import { describe, it, expect } from 'vitest'
import { signEventId, verifyEventId, newRawId } from '../../server/event-id.js'

const KEY = 'k'.repeat(32)
const RAW = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

describe('eventId firmado (D-04, AC-25)', () => {
  it('ida y vuelta devuelve el id crudo', async () => {
    const id = await signEventId(RAW, KEY)
    expect(id).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{32}$/)
    expect(await verifyEventId(id, KEY)).toEqual({ ok: true, rawId: RAW })
  })

  it('es determinista para la misma clave y cambia con otra', async () => {
    expect(await signEventId(RAW, KEY)).toBe(await signEventId(RAW, KEY))
    expect(await signEventId(RAW, KEY)).not.toBe(await signEventId(RAW, 'z'.repeat(32)))
  })

  it('firma alterada, truncada, vacía o de otra clave → Invalid', async () => {
    const id = await signEventId(RAW, KEY)
    const [raw, sig] = id.split('.')
    const flipped = sig.slice(0, -1) + (sig.endsWith('0') ? '1' : '0')
    for (const bad of [`${raw}.${flipped}`, `${raw}.${sig.slice(0, 16)}`, `${raw}.`, raw, '', `${raw}.${sig}.x`, `${RAW.replace('a', 'b')}.${sig}`]) {
      expect(await verifyEventId(bad, KEY)).toEqual({ ok: false })
    }
    expect(await verifyEventId(id, 'otra-clave'.repeat(4))).toEqual({ ok: false })
  })

  it('entradas que no son texto → Invalid, sin lanzar', async () => {
    for (const bad of [null, undefined, 42, {}, ['a.b']]) expect(await verifyEventId(bad, KEY)).toEqual({ ok: false })
  })

  it('newRawId produce 128 bits en hex a partir de bytes aleatorios inyectados', () => {
    const bytes = new Uint8Array(16).map((_, i) => i)
    expect(newRawId(() => bytes)).toBe('000102030405060708090a0b0c0d0e0f')
  })
})
