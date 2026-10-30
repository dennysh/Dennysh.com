import { describe, it, expect } from 'vitest'
import { visitorHash } from '../../server/visitor-hash.js'

const KEY = 'v'.repeat(32)

describe('visitorHash (AC-17, AC-32, D-05)', () => {
  it('HMAC en 64 hex, estable y sin fecha', async () => {
    const a = await visitorHash('203.0.113.7', KEY)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
    expect(await visitorHash('203.0.113.7', KEY)).toBe(a)
  })

  it('no depende del reloj: sigue igual al cruzar medianoche UTC', async () => {
    const real = Date.now
    const before = await visitorHash('203.0.113.7', KEY)
    Date.now = () => real() + 86_400_000 * 3
    try { expect(await visitorHash('203.0.113.7', KEY)).toBe(before) } finally { Date.now = real }
  })

  it('cambia con la IP y con la clave, y no contiene la IP en claro', async () => {
    const a = await visitorHash('203.0.113.7', KEY)
    expect(await visitorHash('203.0.113.8', KEY)).not.toBe(a)
    expect(await visitorHash('203.0.113.7', 'w'.repeat(32))).not.toBe(a)
    expect(a).not.toContain('203')
  })

  it('IP ausente o vacía comparte un solo cubo estable (no lanza)', async () => {
    const none = await visitorHash(undefined, KEY)
    expect(none).toMatch(/^[0-9a-f]{64}$/)
    expect(await visitorHash('', KEY)).toBe(none)
    expect(none).not.toBe(await visitorHash('203.0.113.7', KEY))
  })
})
