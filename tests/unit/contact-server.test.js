import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { createStore, CONTACT_LIMITS } from '../../server/store-d1.js'
import { createContact, CONTACT_MAX_BODY_BYTES } from '../../server/contact.js'
import { toBody } from '../../server/views.js'
import { SUBJECT } from '../../core/contact.js'

const T0 = 1_793_259_677_402
const KEY = 'v'.repeat(32)
const GOOD = { intent: 'web', lang: 'es', turnstileToken: 'tok', consent: true, name: 'Ana', email: 'ana@example.com', siteType: 'shop', budget: 'unknown', deadline: 'flexible', assets: 'no' }

function harness(over = {}) {
  const db = createD1()
  const calls = []
  const clock = { t: T0, now: () => clock.t }
  const sent = []
  const store = createStore(db)
  const wrap = Object.fromEntries(['reserveContact', 'releaseContact', 'purgeContact'].map((k) => [k, async (...a) => (calls.push(k), over.store?.[k] ? over.store[k](...a) : store[k](...a))]))
  const verifier = { verify: async (t) => (calls.push('verify'), over.verify ? over.verify(t) : { kind: 'Human' }) }
  const delivery = over.delivery === null ? null : { send: async (m) => (calls.push('send'), sent.push(m), over.send ? over.send(m) : { kind: 'Delivered' }) }
  const run = createContact({ verifier, store: wrap, delivery, clock, config: { visitorKey: KEY } })
  const post = (body, { ip = '203.0.113.7', method = 'POST', contentType = 'application/json' } = {}) =>
    run({ method, contentType, bodyText: typeof body === 'string' ? body : JSON.stringify(body), ip })
  return { post, calls, sent, clock, db }
}

describe('POST /api/contact: camino feliz', () => {
  it('valida, comprueba Turnstile, reserva el turno y entrega; responde solo el estado', async () => {
    const h = harness()
    const r = await h.post(GOOD)
    expect(r).toEqual({ status: 200, body: { status: 'sent' } })
    expect(h.calls).toEqual(['verify', 'reserveContact', 'purgeContact', 'send'])
    expect(toBody(r.body)).toEqual({ status: 'sent' })
    expect(h.sent).toHaveLength(1)
    expect(h.sent[0].subject).toBe(SUBJECT)
    expect(h.sent[0].replyTo).toBe('ana@example.com')
    expect(h.sent[0].text).toContain('name: Ana')
    expect(JSON.stringify(r)).not.toMatch(/ana@|Ana|tok/)
  })
})

describe('validación en el servidor (S14): lo inesperado se rechaza antes de gastar Turnstile, cupo o entrega', () => {
  const nothingHappened = (h) => expect(h.calls).toEqual([])
  it.each([
    ['campo de más', { ...GOOD, admin: true }],
    ['campo de otra opción', { ...GOOD, automate: 'x' }],
    ['enum fuera de lista', { ...GOOD, budget: '999999' }],
    ['sin consentimiento', { ...GOOD, consent: false }],
    ['correo inválido', { ...GOOD, email: 'no-es-correo' }],
    ['nombre demasiado largo', { ...GOOD, name: 'a'.repeat(81) }],
    ['inyección de cabeceras en el nombre', { ...GOOD, name: 'Ana\r\nBcc: evil@x.co' }],
    ['inyección de cabeceras en el correo', { ...GOOD, email: 'ana@example.com\nBcc: evil@x.co' }],
    ['opción desconocida', { ...GOOD, intent: 'admin' }],
  ])('400 E_INPUT: %s', async (_n, body) => {
    const h = harness()
    expect(await h.post(body)).toEqual({ status: 400, body: { code: 'E_INPUT' } })
    nothingHappened(h)
  })
  it('JSON roto, método, tipo de contenido y tamaño', async () => {
    const h = harness()
    expect((await h.post('{no json')).status).toBe(400)
    expect((await h.post('[]')).status).toBe(400)
    expect((await h.post('null')).status).toBe(400)
    expect((await h.post(GOOD, { method: 'GET' })).status).toBe(405)
    expect((await h.post(GOOD, { contentType: 'text/plain' })).status).toBe(415)
    expect((await h.post(GOOD, { contentType: null })).status).toBe(415)
    expect((await h.post({ ...GOOD, message: 'a'.repeat(CONTACT_MAX_BODY_BYTES) })).status).toBe(413)
    nothingHappened(h)
  })
  it('un mensaje de 1 500 emojis (6 000 bytes) cabe; uno de 1 501 se rechaza por longitud', async () => {
    const h = harness()
    expect((await h.post({ ...GOOD, message: '😀'.repeat(1500) })).status).toBe(200)
    expect((await h.post({ ...GOOD, message: '😀'.repeat(1501), email: 'otra@example.com' })).status).toBe(400)
  })
  it('el mensaje llega al entregador como texto, intacto y sin HTML interpretado', async () => {
    const h = harness()
    await h.post({ ...GOOD, message: '<script>alert(1)</script>\nlínea 2' })
    expect(h.sent[0].text).toContain('<script>alert(1)</script>\nlínea 2')
    expect(h.sent[0].subject).toBe(SUBJECT)
  })
})

describe('desactivado cierra seguro', () => {
  it('sin mecanismo de entrega: 503 E_DISABLED sin gastar Turnstile ni cupo; antes se valida la entrada', async () => {
    const h = harness({ delivery: null })
    expect(await h.post(GOOD)).toEqual({ status: 503, body: { code: 'E_DISABLED' } })
    expect(h.calls).toEqual([])
    expect((await h.post({ ...GOOD, admin: 1 })).status).toBe(400)
    expect(toBody({ code: 'E_DISABLED' })).toEqual({ code: 'E_DISABLED' })
  })
})

describe('Turnstile (S12)', () => {
  it('Bot → 403 y no se reserva cupo ni se entrega', async () => {
    const h = harness({ verify: () => ({ kind: 'Bot' }) })
    expect(await h.post(GOOD)).toEqual({ status: 403, body: { code: 'E_BOT' } })
    expect(h.calls).toEqual(['verify'])
  })
  it('verificador caído → 503 E_INTERNAL, sin entrega', async () => {
    const h = harness({ verify: () => ({ kind: 'VerifierDown' }) })
    expect(await h.post(GOOD)).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(h.calls).toEqual(['verify'])
  })
  it('se verifica el token que llegó en el cuerpo', async () => {
    const tokens = []
    const h = harness({ verify: (t) => (tokens.push(t), { kind: 'Human' }) })
    await h.post({ ...GOOD, turnstileToken: 'otro-token' })
    expect(tokens).toEqual(['otro-token'])
  })
})

describe('límite de tasa por IP y por correo, 429 (S11)', () => {
  const mail = (i) => `u${i}@example.com`
  it(`la IP pasa ${CONTACT_LIMITS.ipMax} veces por hora y la siguiente recibe 429 sin entregar; otra IP no se ve afectada`, async () => {
    const h = harness()
    for (let i = 0; i < CONTACT_LIMITS.ipMax; i++) expect((await h.post({ ...GOOD, email: mail(i) })).status).toBe(200)
    h.sent.length = 0
    expect(await h.post({ ...GOOD, email: mail(9) })).toEqual({ status: 429, body: { code: 'E_RATE_LIMIT' } })
    expect(h.sent).toHaveLength(0)
    expect((await h.post({ ...GOOD, email: mail(9) }, { ip: '198.51.100.9' })).status).toBe(200)
  })
  it('la ventana de la IP es de una hora, abierta por la izquierda', async () => {
    const h = harness()
    for (let i = 0; i < CONTACT_LIMITS.ipMax; i++) await h.post({ ...GOOD, email: mail(i) })
    h.clock.t = T0 + CONTACT_LIMITS.ipWindowMs - 1
    expect((await h.post({ ...GOOD, email: mail(7) })).status).toBe(429)
    h.clock.t = T0 + CONTACT_LIMITS.ipWindowMs
    expect((await h.post({ ...GOOD, email: mail(7) })).status).toBe(200)
  })
  it(`el correo pasa ${CONTACT_LIMITS.mailMax} veces al día aunque cambie de IP; el mismo correo con otras mayúsculas cuenta igual`, async () => {
    const h = harness()
    expect((await h.post(GOOD, { ip: '198.51.100.1' })).status).toBe(200)
    expect((await h.post({ ...GOOD, email: 'ANA@example.com' }, { ip: '198.51.100.2' })).status).toBe(200)
    expect((await h.post(GOOD, { ip: '198.51.100.3' })).status).toBe(429)
    expect((await h.post({ ...GOOD, email: 'otra@example.com' }, { ip: '198.51.100.3' })).status).toBe(200)
  })
  it(`tope global de ${CONTACT_LIMITS.globalMax} al día`, async () => {
    const h = harness()
    for (let i = 0; i < CONTACT_LIMITS.globalMax; i++) expect((await h.post({ ...GOOD, email: mail(i) }, { ip: `198.51.${i}.1` })).status, `n=${i}`).toBe(200)
    expect((await h.post({ ...GOOD, email: 'nuevo@example.com' }, { ip: '192.0.2.1' })).status).toBe(429)
  })
  it('IPv6: un cliente que rota dentro de su /64 no esquiva el tope', async () => {
    const h = harness()
    for (let i = 0; i < CONTACT_LIMITS.ipMax; i++) await h.post({ ...GOOD, email: mail(i) }, { ip: `2001:db8:1:2:${i}::1` })
    expect((await h.post({ ...GOOD, email: mail(8) }, { ip: '2001:db8:1:2:ffff::9' })).status).toBe(429)
  })
  it('la base solo guarda hashes y la hora: nunca la IP, el correo ni el texto', async () => {
    const h = harness()
    await h.post({ ...GOOD, message: 'texto secreto' })
    const rows = h.db.raw.prepare('SELECT * FROM contact_slots').all()
    expect(rows).toHaveLength(1)
    const dump = JSON.stringify(rows)
    expect(dump).not.toMatch(/203\.0\.113|ana@|Ana|texto secreto|example\.com/)
    expect(rows[0].byIp).toMatch(/^[0-9a-f]{64}$/); expect(rows[0].byMail).toMatch(/^[0-9a-f]{64}$/)
    expect(Object.keys(rows[0]).sort()).toEqual(['at', 'byIp', 'byMail', 'id'])
  })
  it('los turnos viejos se purgan a las 25 h', async () => {
    const h = harness()
    await h.post(GOOD)
    h.clock.t = T0 + 25 * 3600_000 + 1
    await h.post({ ...GOOD, email: 'otra@example.com' })
    expect(h.db.raw.prepare('SELECT COUNT(*) AS n FROM contact_slots').get().n).toBe(1)
  })
  it('almacén caído → 503 E_INTERNAL y no se entrega', async () => {
    const h = harness({ store: { reserveContact: async () => ({ kind: 'StoreDown' }) } })
    expect(await h.post(GOOD)).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    expect(h.sent).toHaveLength(0)
  })
})

describe('entrega', () => {
  it('si la entrega falla sin duda, el turno se devuelve y se responde 503 E_DELIVERY sin detalles', async () => {
    const h = harness({ send: () => ({ kind: 'Failed', code: 'smtp 550 secreto@x' }) })
    const r = await h.post(GOOD)
    expect(r).toEqual({ status: 503, body: { code: 'E_DELIVERY' } })
    expect(JSON.stringify(r)).not.toMatch(/smtp|secreto/)
    expect(h.calls).toContain('releaseContact')
    expect(h.db.raw.prepare('SELECT COUNT(*) AS n FROM contact_slots').get().n).toBe(0)
  })
  it('si la entrega queda sin confirmar, el turno se conserva (podría haber salido)', async () => {
    const h = harness({ send: () => ({ kind: 'Unconfirmed' }) })
    expect((await h.post(GOOD)).status).toBe(503)
    expect(h.calls).not.toContain('releaseContact')
    expect(h.db.raw.prepare('SELECT COUNT(*) AS n FROM contact_slots').get().n).toBe(1)
  })
  it('E_RATE_LIMIT, E_DISABLED y E_DELIVERY pasan la lista blanca de respuestas', () => {
    for (const code of ['E_RATE_LIMIT', 'E_DISABLED', 'E_DELIVERY']) expect(toBody({ code })).toEqual({ code })
    expect(toBody({ code: 'E_ALGO_RARO' })).toEqual({ code: 'E_INTERNAL' })
    expect(toBody({ status: 'sent', email: 'x@y.co', name: 'Ana' })).toEqual({ status: 'sent' })
  })
})

describe('límites del spec fijados con literales (no derivados de CONTACT_LIMITS)', () => {
  const H = 3600_000
  it('los números del spec: IP 3/hora, correo 2/día, global 40/día, y las ventanas de 1 h, 24 h y 24 h', () => {
    expect(CONTACT_LIMITS).toEqual({ ipMax: 3, ipWindowMs: H, mailMax: 2, mailWindowMs: 24 * H, globalMax: 40, globalWindowMs: 24 * H })
  })
  it('IP: la cuarta en una hora da 429; a la hora exacta vuelve a pasar', async () => {
    const h = harness()
    for (let i = 0; i < 3; i++) expect((await h.post({ ...GOOD, email: `i${i}@example.com` })).status).toBe(200)
    expect((await h.post({ ...GOOD, email: 'i9@example.com' })).status).toBe(429)
    h.clock.t = T0 + H - 1; expect((await h.post({ ...GOOD, email: 'i9@example.com' })).status).toBe(429)
    h.clock.t = T0 + H; expect((await h.post({ ...GOOD, email: 'i9@example.com' })).status).toBe(200)
  })
  it('correo: la tercera en un día da 429 aunque pasen 2 h; a las 24 h exactas vuelve a pasar', async () => {
    const h = harness()
    await h.post(GOOD, { ip: '198.51.100.1' })
    h.clock.t = T0 + 2 * H; await h.post(GOOD, { ip: '198.51.100.2' })
    h.clock.t = T0 + 5 * H; expect((await h.post(GOOD, { ip: '198.51.100.3' })).status).toBe(429)
    h.clock.t = T0 + 24 * H - 1; expect((await h.post(GOOD, { ip: '198.51.100.3' })).status).toBe(429)
    h.clock.t = T0 + 24 * H; expect((await h.post(GOOD, { ip: '198.51.100.3' })).status).toBe(200) // el primero ya salió de la ventana
  })
  it('global: el envío 41 en un día da 429; pasadas 24 h exactas vuelve a pasar', async () => {
    const h = harness()
    for (let i = 0; i < 40; i++) expect((await h.post({ ...GOOD, email: `g${i}@example.com` }, { ip: `198.51.${i}.9` })).status).toBe(200)
    expect((await h.post({ ...GOOD, email: 'g99@example.com' }, { ip: '192.0.2.9' })).status).toBe(429)
    h.clock.t = T0 + 24 * H - 1; expect((await h.post({ ...GOOD, email: 'g99@example.com' }, { ip: '192.0.2.9' })).status).toBe(429)
    h.clock.t = T0 + 24 * H; expect((await h.post({ ...GOOD, email: 'g99@example.com' }, { ip: '192.0.2.9' })).status).toBe(200)
  })
  it('tipo de contenido: solo application/json exacto (con parámetros); no basta con mencionarlo', async () => {
    const h = harness()
    for (const ct of ['text/plain; application/json', 'application/jsonx', 'x/application/json', 'application/json-patch+json']) expect((await h.post(GOOD, { contentType: ct })).status, ct).toBe(415)
    expect((await h.post(GOOD, { contentType: 'application/json; charset=utf-8' })).status).toBe(200)
  })
  it('tamaño en BYTES: 12 288 pasan al esquema, 12 289 dan 413; los multibyte cuentan por bytes', async () => {
    const h = harness()
    const pad = (bytes) => { const base = JSON.stringify({ ...GOOD, message: '' }).length; return JSON.stringify({ ...GOOD, message: 'a'.repeat(bytes - base) }) }
    expect(new TextEncoder().encode(pad(12288)).length).toBe(12288)
    expect((await h.post(pad(12288))).status).toBe(400) // cabe en bytes; el mensaje de ~12 000 caracteres excede los 1 500 y lo rechaza el esquema
    expect((await h.post(pad(12289))).status).toBe(413)
    expect((await h.post(JSON.stringify({ ...GOOD, message: '😀'.repeat(3100) }))).status).toBe(413) // ~12 400 bytes pero solo 3 100 caracteres
  })
})
