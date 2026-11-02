import { describe, it, expect } from 'vitest'
import { contactHandler } from '../../server/handlers.js'
import { buildContactServices, createDelivery } from '../../server/contact-services.js'
import { withSecurityHeaders } from '../../server/security-headers.js'
import { createD1 } from '../helpers/d1.js'
import { CONTACT_MAX_BODY_BYTES } from '../../server/contact.js'

const GOOD = { intent: 'other', lang: 'en', turnstileToken: 'tok', consent: true, name: 'Ana', email: 'ana@example.com', message: 'Hola' }
const url = 'https://dennysh.com/api/contact'
const ENV_OK = () => ({ CONTACT_ENABLED: 'true', DB: createD1(), TURNSTILE_SECRET: 's'.repeat(20), VISITOR_HMAC_KEY: 'v'.repeat(32) })
const fakeDelivery = () => { const sent = []; return { sent, send: async (m) => (sent.push(m), { kind: 'Delivered' }) } }
// Como lo invoca Pages: onRequest(context). `services` extra en el contexto permite inyectar el doble de entrega.
const run = (env, request, delivery) => withSecurityHeaders(contactHandler)({ request, env, services: buildContactServices(env, { delivery }) })
const call = (env, init, delivery) => run(env, new Request(url, init), delivery)
const post = (env, body, delivery, headers = { 'content-type': 'application/json' }) => call(env, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) }, delivery)

describe('cableado: el formulario solo se activa con todo configurado', () => {
  it('hoy no existe ningún mecanismo de entrega en el proyecto: createDelivery devuelve null', () => {
    expect(createDelivery({ TELEGRAM_BOT_TOKEN: 'x', TELEGRAM_CHAT_ID: '1' })).toBeNull() // Telegram avisa con texto fijo; no es correo
  })
  it('desactivado sin entrega, sin CONTACT_ENABLED o con cualquier pieza que falte', () => {
    expect(buildContactServices(ENV_OK()).enabled).toBe(false) // sin entrega
    expect(buildContactServices(ENV_OK(), { delivery: fakeDelivery() }).enabled).toBe(true)
    for (const k of ['CONTACT_ENABLED', 'DB', 'TURNSTILE_SECRET', 'VISITOR_HMAC_KEY']) {
      const env = ENV_OK(); delete env[k]
      expect(buildContactServices(env, { delivery: fakeDelivery() }).enabled, k).toBe(false)
    }
    for (const v of ['false', 'TRUE', '1', '', undefined]) expect(buildContactServices({ ...ENV_OK(), CONTACT_ENABLED: v }, { delivery: fakeDelivery() }).enabled, String(v)).toBe(false)
  })
  it('con la clave de prueba de Turnstile fuera de localhost el formulario queda desactivado (sin freno anti-bot); en local sí puede activarse', () => {
    const dummy = '1x0000000000000000000000000000000AA'
    expect(buildContactServices({ ...ENV_OK(), TURNSTILE_SECRET: dummy }, { delivery: fakeDelivery() }).enabled).toBe(false)
    expect(buildContactServices({ ...ENV_OK(), TURNSTILE_SECRET: dummy, TURNSTILE_HOSTS: 'dennysh.com,localhost' }, { delivery: fakeDelivery() }).enabled).toBe(false)
    expect(buildContactServices({ ...ENV_OK(), TURNSTILE_SECRET: dummy, TURNSTILE_HOSTS: 'localhost' }, { delivery: fakeDelivery() }).enabled).toBe(true)
    expect(buildContactServices({ ...ENV_OK(), TURNSTILE_SECRET: 'una-clave-real-no-de-prueba-123' }, { delivery: fakeDelivery() }).enabled).toBe(true)
  })
  it('un entorno vacío no lanza (a diferencia de la demo): el formulario queda desactivado', () => {
    expect(() => buildContactServices({})).not.toThrow()
    expect(buildContactServices({}).enabled).toBe(false)
  })
})

describe('GET /api/contact', () => {
  it('dice solo si está activo, con las cabeceras de seguridad y sin guardar nada en caché', async () => {
    for (const [env, d, want] of [[{}, undefined, false], [ENV_OK(), undefined, false], [ENV_OK(), fakeDelivery(), true]]) {
      const res = await call(env, { method: 'GET' }, d)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ enabled: want })
      expect(res.headers.get('cache-control')).toBe('no-store')
      expect(res.headers.get('content-security-policy')).not.toMatch(/unsafe-inline/)
      expect(res.headers.get('set-cookie')).toBeNull()
    }
  })
  it('no revela configuración ni secretos', async () => {
    const env = ENV_OK()
    const text = await (await call(env, { method: 'GET' }, fakeDelivery())).text()
    expect(text).toBe('{"enabled":true}')
    expect(text).not.toContain(env.TURNSTILE_SECRET)
  })
})

describe('POST /api/contact por el manejador real', () => {
  it('desactivado: 503 E_DISABLED con cabeceras, sin tocar nada', async () => {
    const res = await post(ENV_OK(), GOOD)
    expect(res.status).toBe(503); expect(await res.json()).toEqual({ code: 'E_DISABLED' })
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
  })
  it('desactivado igualmente valida la entrada (400) y no toca Turnstile, almacén ni entrega', async () => {
    const orig = globalThis.fetch
    let fetched = 0
    globalThis.fetch = async () => { fetched++; return new Response('{}') }
    try {
      expect((await post(ENV_OK(), { ...GOOD, admin: true })).status).toBe(400)
      expect((await post(ENV_OK(), { ...GOOD, name: 'Ana\r\nBcc: x@y.co' })).status).toBe(400)
      expect((await post(ENV_OK(), '{roto')).status).toBe(400)
      expect((await post(ENV_OK(), GOOD, undefined, { 'content-type': 'text/plain' })).status).toBe(415)
      expect((await post(ENV_OK(), GOOD)).status).toBe(503)
      expect(fetched).toBe(0)
    } finally { globalThis.fetch = orig }
  })
  it('otros métodos desactivados: 405', async () => {
    expect((await call(ENV_OK(), { method: 'PUT' })).status).toBe(405)
    expect((await call(ENV_OK(), { method: 'DELETE' })).status).toBe(405)
  })
  it('activado (doble de entrega y Turnstile de prueba): entrega y responde solo el estado', async () => {
    const env = ENV_OK(); const d = fakeDelivery()
    const orig = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, hostname: 'dennysh.com' }), { status: 200 })
    try {
      const res = await post(env, GOOD, d)
      expect(res.status).toBe(200); expect(await res.json()).toEqual({ status: 'sent' })
      expect(d.sent[0].text).toContain('Hola'); expect(d.sent[0].replyTo).toBe('ana@example.com')
    } finally { globalThis.fetch = orig }
  })
  it('Turnstile con clave real comprueba el host: un token válido de otro dominio da 403 y no se entrega', async () => {
    const env = ENV_OK(); const d = fakeDelivery()
    const orig = globalThis.fetch
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true, hostname: 'evil.example' }), { status: 200 })
    try {
      const res = await post(env, GOOD, d)
      expect(res.status).toBe(403); expect(await res.json()).toEqual({ code: 'E_BOT' })
      expect(d.sent).toHaveLength(0)
    } finally { globalThis.fetch = orig }
  })
  it('cuerpo demasiado grande, declarado o en streaming sin Content-Length: 413 y nada se entrega', async () => {
    const env = ENV_OK(); const d = fakeDelivery()
    const big = JSON.stringify({ ...GOOD, message: 'a'.repeat(CONTACT_MAX_BODY_BYTES) })
    expect((await post(env, big, d)).status).toBe(413)
    const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close() } })
    const res = await run(env, new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half' }), d)
    expect(res.status).toBe(413)
    expect(d.sent).toHaveLength(0)
  })
  it('un fallo inesperado sale como 503 E_INTERNAL sin detalles', async () => {
    const res = await withSecurityHeaders(() => { throw new Error('boom secreto 123:AAA') })(new Request(url, { method: 'POST' }))
    expect(res.status).toBe(503); expect(await res.text()).toBe('{"code":"E_INTERNAL"}')
  })
})
