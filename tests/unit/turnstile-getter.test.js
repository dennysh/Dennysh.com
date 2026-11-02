// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createTokenGetter } from '../../src/demo/turnstile.js'

afterEach(() => { delete globalThis.turnstile; vi.useRealTimers() })
const fake = () => {
  const widgets = []
  globalThis.turnstile = { render: (_el, o) => { widgets.push(o); return `w${widgets.length}` }, remove: vi.fn() }
  return widgets
}

describe('createTokenGetter: no deja widgets acumulados', () => {
  it('éxito: entrega el token y quita el widget', async () => {
    const w = fake()
    const p = createTokenGetter('key', () => document.body)()
    await vi.waitFor(() => expect(w).toHaveLength(1))
    w[0].callback('tok')
    expect(await p).toBe('tok'); expect(globalThis.turnstile.remove).toHaveBeenCalledWith('w1')
  })
  it('error de Turnstile: rechaza y quita el widget (un reintento no apila otro en el mismo hueco)', async () => {
    const w = fake()
    const p = createTokenGetter('key', () => document.body)()
    await vi.waitFor(() => expect(w).toHaveLength(1))
    w[0]['error-callback']()
    await expect(p).rejects.toThrow('turnstile'); expect(globalThis.turnstile.remove).toHaveBeenCalledWith('w1')
  })
  it('tiempo agotado: rechaza y quita el widget', async () => {
    vi.useFakeTimers()
    const w = fake()
    const p = createTokenGetter('key', () => document.body)()
    const caught = p.catch((e) => e.message)
    await vi.advanceTimersByTimeAsync(15001)
    expect(await caught).toBe('timeout'); expect(w).toHaveLength(1); expect(globalThis.turnstile.remove).toHaveBeenCalledWith('w1')
  })
  it('sin clave pública (entorno local) no carga nada y devuelve el valor de desarrollo', async () => {
    expect(await createTokenGetter('', () => document.body)()).toBe('dev-no-widget')
  })
})
