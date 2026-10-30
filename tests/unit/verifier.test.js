import { describe, it, expect } from 'vitest'
import { createVerifier } from '../../server/verifier.js'

const SECRET = 'S3CRET-turnstile-value'
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
const make = (handler, opts = {}) => {
  const calls = []
  const fetch = async (url, init) => (calls.push({ url, init }), handler(url, init))
  return { calls, verifier: createVerifier({ secret: SECRET, fetch, expectedHost: 'dennysh.com', timeoutMs: 50, ...opts }) }
}

describe('verifier Turnstile (AC-27, S12)', () => {
  it('éxito con host esperado → Human, con un solo POST a siteverify (secreto y token en el cuerpo)', async () => {
    const { calls, verifier } = make(() => json({ success: true, hostname: 'dennysh.com' }))
    expect(await verifier.verify('tok-1')).toEqual({ kind: 'Human' })
    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify')
    expect(calls[0].init.method).toBe('POST')
    const body = new URLSearchParams(String(calls[0].init.body))
    expect(body.get('secret')).toBe(SECRET)
    expect(body.get('response')).toBe('tok-1')
  })

  it('token repetido o caducado → Bot con su código', async () => {
    const { verifier } = make(() => json({ success: false, 'error-codes': ['timeout-or-duplicate'] }))
    expect(await verifier.verify('tok-1')).toEqual({ kind: 'Bot', reason: 'timeout-or-duplicate' })
  })

  it('el mismo token solo vale una vez (el servicio lo rechaza la segunda)', async () => {
    let used = false
    const { verifier } = make(() => {
      const r = used ? { success: false, 'error-codes': ['timeout-or-duplicate'] } : { success: true, hostname: 'dennysh.com' }
      used = true
      return json(r)
    })
    expect((await verifier.verify('t')).kind).toBe('Human')
    expect((await verifier.verify('t')).kind).toBe('Bot')
  })

  it('host ajeno → Bot(host-mismatch)', async () => {
    const { verifier } = make(() => json({ success: true, hostname: 'evil.example' }))
    expect(await verifier.verify('t')).toEqual({ kind: 'Bot', reason: 'host-mismatch' })
  })

  it('el host de vista previa o local solo se acepta si se declara', async () => {
    const { verifier } = make(() => json({ success: true, hostname: 'abc.dennysh.pages.dev' }), { expectedHost: ['dennysh.com', 'abc.dennysh.pages.dev'] })
    expect((await verifier.verify('t')).kind).toBe('Human')
  })

  it('modo prueba (claves de prueba de Cloudflare) no compara el host', async () => {
    const { verifier } = make(() => json({ success: true, hostname: 'example.com' }), { testMode: true })
    expect((await verifier.verify('t')).kind).toBe('Human')
  })

  it('sin código de error conocido → Bot(rejected)', async () => {
    const { verifier } = make(() => json({ success: false }))
    expect(await verifier.verify('t')).toEqual({ kind: 'Bot', reason: 'rejected' })
  })

  it('códigos desconocidos no se reflejan (lista cerrada)', async () => {
    const { verifier } = make(() => json({ success: false, 'error-codes': ['<script>alert(1)</script>'] }))
    expect(await verifier.verify('t')).toEqual({ kind: 'Bot', reason: 'rejected' })
  })

  it.each([
    ['red caída', () => { throw new Error(`fallo con ${SECRET}`) }],
    ['HTTP 500', () => json({ success: false }, 500)],
    ['no es JSON', () => new Response('<html>', { status: 200 })],
    ['cuerpo vacío', () => new Response(null, { status: 200 })],
  ])('%s → VerifierDown y sin filtrar el secreto', async (_n, handler) => {
    const { verifier } = make(handler)
    const r = await verifier.verify('t')
    expect(r).toEqual({ kind: 'VerifierDown' })
    expect(JSON.stringify(r)).not.toContain(SECRET)
  })

  it('si el servicio no responde a tiempo → VerifierDown', async () => {
    const { verifier } = make((_u, init) => new Promise((_res, rej) => init.signal.addEventListener('abort', () => rej(new Error('abort')))))
    expect(await verifier.verify('t')).toEqual({ kind: 'VerifierDown' })
  })
})
