import { describe, it, expect } from 'vitest'
import { parseRequest, SIMULATE_SCHEMA, INTERVENE_SCHEMA } from '../../server/validation.js'

const req = (body, { method = 'POST', type = 'application/json', raw } = {}) => ({
  method,
  contentType: type,
  bodyText: raw ?? (typeof body === 'string' ? body : JSON.stringify(body)),
})
const ok = { lang: 'es', scenario: 'A', turnstileToken: 'tok' }
const good = { eventId: 'a'.repeat(32) + '.' + 'b'.repeat(32), action: 'approve' }

describe('simulate', () => {
  it('acepta el cuerpo válido, con o sin scenario', () => {
    expect(parseRequest(req(ok), SIMULATE_SCHEMA)).toEqual({ ok: true, value: ok })
    const { scenario, ...noScenario } = ok
    expect(parseRequest(req(noScenario), SIMULATE_SCHEMA)).toEqual({ ok: true, value: noScenario })
  })

  it.each([
    ['campo extra', { ...ok, extra: 1 }],
    ['asignación masiva decision', { ...ok, decision: 'Allow' }],
    ['lang fuera de lista', { ...ok, lang: 'fr' }],
    ['scenario fuera de lista', { ...ok, scenario: 'Z' }],
    ['scenario con tipo erróneo', { ...ok, scenario: 1 }],
    ['sin token', { lang: 'es' }],
    ['token vacío', { ...ok, turnstileToken: '' }],
    ['token no texto', { ...ok, turnstileToken: 123 }],
    ['token enorme', { ...ok, turnstileToken: 'x'.repeat(2049) }],
    ['arreglo', [ok]],
    ['null', null],
    ['texto', 'hola'],
  ])('rechaza %s con 400 E_INPUT', (_n, body) => {
    expect(parseRequest(req(body), SIMULATE_SCHEMA)).toEqual({ ok: false, status: 400, code: 'E_INPUT' })
  })

  it('rechaza __proto__ y constructor como claves', () => {
    for (const raw of [`{"lang":"es","turnstileToken":"t","__proto__":{"x":1}}`, `{"lang":"es","turnstileToken":"t","constructor":{"x":1}}`]) {
      expect(parseRequest(req(null, { raw }), SIMULATE_SCHEMA).code).toBe('E_INPUT')
    }
    expect(({}).x).toBeUndefined()
  })
})

describe('intervene', () => {
  it('acepta acciones y eventId con forma firmada', () => {
    for (const action of ['approve', 'override', 'escalate']) {
      expect(parseRequest(req({ ...good, action }), INTERVENE_SCHEMA).ok).toBe(true)
    }
  })
  it.each([
    ['acción inválida', { ...good, action: 'delete' }],
    ['eventId con forma rara', { ...good, eventId: "x'; DROP TABLE events;--" }],
    ['eventId demasiado largo', { ...good, eventId: 'a'.repeat(200) }],
    ['campo extra', { ...good, note: 'hola' }],
    ['falta acción', { eventId: good.eventId }],
  ])('rechaza %s', (_n, body) => {
    expect(parseRequest(req(body), INTERVENE_SCHEMA)).toEqual({ ok: false, status: 400, code: 'E_INPUT' })
  })
})

describe('método, tipo y tamaño', () => {
  it('método distinto de POST → 405', () => {
    for (const method of ['GET', 'PUT', 'DELETE', 'PATCH']) {
      expect(parseRequest(req(ok, { method }), SIMULATE_SCHEMA)).toEqual({ ok: false, status: 405, code: 'E_INPUT' })
    }
  })
  it('Content-Type que no es JSON → 415', () => {
    for (const type of ['text/plain', 'application/x-www-form-urlencoded', '', null]) {
      expect(parseRequest(req(ok, { type }), SIMULATE_SCHEMA)).toEqual({ ok: false, status: 415, code: 'E_INPUT' })
    }
    expect(parseRequest(req(ok, { type: 'application/json; charset=utf-8' }), SIMULATE_SCHEMA).ok).toBe(true)
  })
  it('cuerpo mayor de 4 KB → 413', () => {
    const big = JSON.stringify({ ...ok, turnstileToken: 'x'.repeat(5000) })
    expect(parseRequest(req(null, { raw: big }), SIMULATE_SCHEMA)).toEqual({ ok: false, status: 413, code: 'E_INPUT' })
  })
  it('JSON roto o vacío → 400', () => {
    for (const raw of ['{', '', 'undefined', '{"lang":']) {
      expect(parseRequest(req(null, { raw }), SIMULATE_SCHEMA)).toEqual({ ok: false, status: 400, code: 'E_INPUT' })
    }
  })
})
