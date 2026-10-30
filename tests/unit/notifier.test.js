import { describe, it, expect } from 'vitest'
import { createTelegramNotifier, maskChat } from '../../server/notifier.js'

const TOKEN = '123456789:AAH-super-secret-token-value-0000'
const CHAT = '987654367'
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const make = (handler, opts = {}) => {
  const calls = []
  const fetch = async (url, init) => (calls.push({ url, init }), handler(url, init))
  return { calls, n: createTelegramNotifier({ token: TOKEN, chatId: CHAT, fetch, timeoutMs: 50, ...opts }) }
}
const leaks = (v) => JSON.stringify(v).includes('AAH-super') || JSON.stringify(v).includes(CHAT)

describe('send (AC-06, AC-21, D-01)', () => {
  it('Delivered solo con ok:true y message_id', async () => {
    const { calls, n } = make(() => json({ ok: true, result: { message_id: 77 } }))
    expect(await n.send('[SIMULACIÓN] hola')).toEqual({ kind: 'Delivered', messageId: 77 })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe(`https://api.telegram.org/bot${TOKEN}/sendMessage`)
    const body = JSON.parse(calls[0].init.body)
    expect(body).toEqual({ chat_id: CHAT, text: '[SIMULACIÓN] hola', disable_web_page_preview: true })
    expect(body.parse_mode).toBeUndefined()
  })

  it('ok:true sin message_id NO es Delivered', async () => {
    for (const body of [{ ok: true }, { ok: true, result: {} }, { ok: true, result: { message_id: 'x' } }]) {
      const { n } = make(() => json(body))
      expect((await n.send('t')).kind).toBe('Failed')
    }
  })

  it('ok:false o HTTP de error → Failed con código propio', async () => {
    const r400 = await make(() => json({ ok: false, error_code: 400, description: `chat ${CHAT} not found` }, 400)).n.send('t')
    expect(r400).toEqual({ kind: 'Failed', code: 'rejected' })
    const r429 = await make(() => json({ ok: false, error_code: 429, parameters: { retry_after: 7 } }, 429)).n.send('t')
    expect(r429).toEqual({ kind: 'Failed', code: 'rate_limited' })
    const r500 = await make(() => json({ ok: false }, 502)).n.send('t')
    expect(r500).toEqual({ kind: 'Failed', code: 'server_error' })
  })

  it('error de red → Failed(network) sin filtrar token ni chat', async () => {
    const { n } = make(() => { throw new Error(`ECONNRESET https://api.telegram.org/bot${TOKEN}/sendMessage ${CHAT}`) })
    const r = await n.send('t')
    expect(r).toEqual({ kind: 'Failed', code: 'network' })
    expect(leaks(r)).toBe(false)
  })

  it('a los 4 s (aquí 50 ms) sin respuesta → Unconfirmed, nunca Delivered, sin reintento', async () => {
    const { calls, n } = make((_u, init) => new Promise((_a, rej) => init.signal.addEventListener('abort', () => rej(new Error('abort')))))
    expect(await n.send('t')).toEqual({ kind: 'Unconfirmed' })
    expect(calls).toHaveLength(1)
  })

  it('el tiempo límite por defecto es de 4 s', () => {
    expect(createTelegramNotifier({ token: TOKEN, chatId: CHAT, fetch: async () => {} }).timeoutMs).toBe(4000)
  })

  it('modo prueba: NotSent y no llama a la red', async () => {
    const { calls, n } = make(() => json({ ok: true }), { dryRun: true })
    expect(await n.send('t')).toEqual({ kind: 'NotSent', reason: 'modo prueba' })
    expect(calls).toHaveLength(0)
  })

  it('sin token o sin chat configurado: NotSent, nunca falla en voz alta con datos', async () => {
    const { calls, n } = make(() => json({ ok: true }), { token: '' })
    expect((await n.send('t')).kind).toBe('NotSent')
    expect(calls).toHaveLength(0)
  })

  it('ninguna salida contiene el token', async () => {
    const outs = []
    for (const h of [() => json({ ok: true, result: { message_id: 1 } }), () => json({ ok: false, description: TOKEN }, 401), () => { throw new Error(TOKEN) }]) {
      outs.push(await make(h).n.send('t'))
    }
    expect(outs.some(leaks)).toBe(false)
  })

  it('el destino es fijo: el texto no puede cambiar el chat ni la URL', async () => {
    const { calls, n } = make(() => json({ ok: true, result: { message_id: 1 } }))
    await n.send('t', { chatId: 'otro', url: 'https://evil.test' })
    expect(JSON.parse(calls[0].init.body).chat_id).toBe(CHAT)
    expect(calls[0].url.startsWith('https://api.telegram.org/bot')).toBe(true)
  })
})

describe('edit (Escalar)', () => {
  it('Edited con ok:true; usa editMessageText con el message_id', async () => {
    const { calls, n } = make(() => json({ ok: true, result: { message_id: 77 } }))
    expect(await n.edit(77, 'nuevo')).toEqual({ kind: 'Edited' })
    expect(calls[0].url).toBe(`https://api.telegram.org/bot${TOKEN}/editMessageText`)
    expect(JSON.parse(calls[0].init.body)).toEqual({ chat_id: CHAT, message_id: 77, text: 'nuevo', disable_web_page_preview: true })
  })
  it('fallo → Failed con código; tiempo agotado → Failed(timeout); sin filtrar secretos', async () => {
    expect(await make(() => json({ ok: false }, 400)).n.edit(1, 't')).toEqual({ kind: 'Failed', code: 'rejected' })
    const t = make((_u, init) => new Promise((_a, rej) => init.signal.addEventListener('abort', () => rej(new Error('x')))))
    expect(await t.n.edit(1, 't')).toEqual({ kind: 'Failed', code: 'timeout' })
    expect(leaks(await make(() => { throw new Error(TOKEN) }).n.edit(1, 't'))).toBe(false)
  })
  it('modo prueba no llama a la red', async () => {
    const { calls, n } = make(() => json({ ok: true }), { dryRun: true })
    expect((await n.edit(1, 't')).kind).toBe('Failed')
    expect(calls).toHaveLength(0)
  })
  it('un message_id que no es entero positivo se rechaza sin red', async () => {
    const { calls, n } = make(() => json({ ok: true }))
    for (const id of [null, 'x', -1, 1.5]) expect((await n.edit(id, 't')).kind).toBe('Failed')
    expect(calls).toHaveLength(0)
  })
})

describe('maskChat', () => {
  it('muestra solo los dos últimos dígitos', () => {
    expect(maskChat('987654367')).toBe('••••67')
    expect(maskChat(-1001234567890)).toBe('••••90')
    expect(maskChat('')).toBe('••••')
  })
})
