import { describe, it, expect } from 'vitest'
import { createD1 } from '../helpers/d1.js'
import { makeAudit } from '../helpers/fixtures.js'
import { makeHarness, T0 } from '../helpers/harness.js'
import { createStore } from '../../server/store-d1.js'
import { createGetEvent } from '../../server/event.js'
import { createIntervene } from '../../server/intervene.js'
import { reduce, initialState, canIntervene } from '../../src/demo/machine.js'
import { createClient, STORAGE_KEY } from '../../src/demo/api.js'
import { utcLabel } from '../../src/demo/format.js'
import { alertLine } from '../../src/demo/parts.jsx'
import { loadRuleset } from '../../core/ruleset.js'
import { rulesetJson } from '../helpers/fixtures.js'

const audit = (id, extra = {}) => ({ eventId: id, decision: 'Limit', interventions: [], alert: { status: 'Delivered' }, ...extra })
const decided = (id = 'e1') => [{ type: 'START' }, { type: 'RESULT', audit: audit(id) }, { type: 'SHOW_ALL' }].reduce(reduce, initialState)

describe('máquina: carreras (MEDIO-1)', () => {
  it('INTERVENE_OK de otro evento o fuera de fase "decided" se ignora', () => {
    const mid = reduce(decided('e1'), { type: 'INTERVENE_START' })
    const restarted = [{ type: 'START' }, { type: 'RESULT', audit: audit('e2') }].reduce(reduce, mid)
    expect(reduce(restarted, { type: 'INTERVENE_OK', audit: audit('e1', { interventions: [{ seq: 1 }] }) })).toBe(restarted)
    const reset = reduce(mid, { type: 'RESET' })
    expect(reduce(reset, { type: 'INTERVENE_OK', audit: audit('e1') })).toBe(reset)
    expect(reduce(mid, { type: 'INTERVENE_OK', audit: audit('e1', { interventions: [{ seq: 1 }] }) }).audit.interventions).toHaveLength(1)
  })
  it('INTERVENE_FAIL expired no pisa otra ejecución en curso', () => {
    const running = reduce(initialState, { type: 'START' })
    expect(reduce(running, { type: 'INTERVENE_FAIL', kind: 'expired' })).toBe(running)
  })
  it('RESTORE y su FAIL solo valen desde reposo (no pisan un START)', () => {
    const running = reduce(initialState, { type: 'START' })
    expect(reduce(running, { type: 'RESTORE', audit: audit('viejo') })).toBe(running)
    expect(reduce(running, { type: 'RESTORE_FAIL', kind: 'expired' })).toBe(running)
    expect(reduce(initialState, { type: 'RESTORE_FAIL', kind: 'expired' })).toMatchObject({ phase: 'error', error: 'expired' })
  })
  it('RESULT tras un START nuevo sigue funcionando después de un RESTORE tardío ignorado', () => {
    const s = [{ type: 'START' }, { type: 'RESTORE', audit: audit('viejo') }, { type: 'RESULT', audit: audit('nuevo') }].reduce(reduce, initialState)
    expect(s.audit.eventId).toBe('nuevo')
  })
})

describe('enlace de solo lectura ?evento= (ALTO-1)', () => {
  it('RESTORE readOnly muestra todo pero no deja intervenir', () => {
    const s = reduce(initialState, { type: 'RESTORE', audit: audit('e1'), readOnly: true })
    expect(s).toMatchObject({ phase: 'decided', readOnly: true })
    expect(canIntervene(s)).toBe(false)
  })
  it('RESET sale del modo solo lectura', () => {
    const s = reduce(reduce(initialState, { type: 'RESTORE', audit: audit('e1'), readOnly: true }), { type: 'RESET' })
    expect(s.readOnly).toBeFalsy()
  })
  it('el cliente puede ver un evento por id sin guardarlo como propio, y olvidar el guardado', async () => {
    const store = new Map()
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
    const urls = []
    const fetch = async (u) => (urls.push(u), new Response(JSON.stringify({ audit: { eventId: 'x' } }), { status: 200 }))
    const c = createClient({ fetch, getToken: async () => 't', storage })
    expect(await c.view('ab.cd')).toEqual({ ok: true, audit: { eventId: 'x' } })
    expect(urls[0]).toBe('/api/event/ab.cd')
    expect(store.has(STORAGE_KEY)).toBe(false)
    store.set(STORAGE_KEY, 'zz')
    c.forget()
    expect(store.has(STORAGE_KEY)).toBe(false)
  })
  it('un evento por enlace caducado da expired; el guardado de un id ausente no escribe "undefined"', async () => {
    const store = new Map()
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
    const c404 = createClient({ fetch: async () => new Response('{}', { status: 404 }), getToken: async () => 't', storage })
    expect(await c404.view('a.b')).toEqual({ ok: false, kind: 'expired' })
    const noId = createClient({ fetch: async () => new Response(JSON.stringify({ audit: {} }), { status: 200 }), getToken: async () => 't', storage })
    await noId.simulate({ lang: 'es' })
    expect(store.has(STORAGE_KEY)).toBe(false)
  })
})

describe('"Agrupada" y horas (MEDIO-2, BAJO-3)', () => {
  it('Grouped sin hora de referencia usa el texto sin HH:MM', () => {
    const es = alertLine({ status: 'Grouped', channel: 'none' }, 'es', 'UTC')
    expect(es).not.toMatch(/\{|—|undefined/)
    expect(es).toMatch(/Agrupada/)
    expect(alertLine({ status: 'Grouped', channel: 'none', groupedWithAtUtc: '2026-10-29T07:41:00.000Z' }, 'es', 'UTC')).toContain('07:41')
  })
  it('utcLabel acepta ISO sin milisegundos', () => expect(utcLabel('2026-10-29T10:00:00Z')).toBe('10:00:00.000 UTC'))
})

describe('orquestador (MEDIO-2, MEDIO-3, MEDIO-4)', () => {
  it('Grouped apunta a la última alerta ENTREGADA; si la primera falló, no hay hora', async () => {
    const h = await makeHarness({ send: () => ({ kind: 'Failed', code: 'rejected' }) })
    await h.post(h.ok)
    h.clock.t = T0 + 61_000
    const r = await h.post(h.ok)
    expect(r.body.audit.alert.status).toBe('Grouped')
    expect(r.body.audit.alert.groupedWithAtUtc).toBeUndefined()
  })
  it('tras una entrega, el cupo queda confirmado y la hora aparece', async () => {
    const h = await makeHarness()
    await h.post(h.ok)
    h.clock.t = T0 + 5000
    expect((await h.post(h.ok)).body.audit.alert.groupedWithAtUtc).toBe(new Date(T0).toISOString())
  })
  it('si getBreaker o putEvent fallan tras reservar, el cupo se devuelve', async () => {
    for (const failOn of [['getBreaker'], ['putEvent']]) {
      const h = await makeHarness({ failOn })
      expect((await h.post(h.ok)).status).toBe(503)
      expect(h.db.raw.prepare('SELECT COUNT(*) AS n FROM alert_slots').get().n, failOn[0]).toBe(0)
    }
  })
  it('updateAlert se reintenta una vez antes de rendirse', async () => {
    let n = 0
    const h = await makeHarness({})
    const orig = h.realStore.updateAlert
    h.realStore.updateAlert = async (...a) => (++n === 1 ? { kind: 'StoreDown' } : orig(...a))
    const r = await h.post(h.ok)
    expect(n).toBe(2)
    expect((await h.realStore.getEvent(r.body.eventId, T0 + 1)).audit.alert.status).toBe('Delivered')
  })
})

describe('sello de integridad al leer (BAJO-1)', () => {
  it('un registro manipulado en la base se detecta (Corrupt) y la API responde 503', async () => {
    const h = await makeHarness()
    const { body } = await h.post({ ...h.ok, scenario: 'C' })
    h.db.raw.prepare("UPDATE events SET auditJson = replace(auditJson, '\"Alert\"', '\"Allow\"')").run()
    expect((await h.realStore.getEvent(body.eventId, T0 + 1)).kind).toBe('Corrupt')
    const get = createGetEvent({ store: h.store, clock: h.clock, config: h.config })
    expect(await get({ method: 'GET', eventId: body.eventId })).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
    const iv = createIntervene({ store: h.store, notifier: h.notifier, clock: h.clock, config: h.config })
    const r = await iv({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify({ eventId: body.eventId, action: 'approve' }) })
    expect(r.status).toBe(503)
  })
  it('un registro íntegro sigue leyéndose', async () => {
    const db = createD1(); const store = createStore(db)
    const a = await makeAudit({ eventId: 'ev1', nowMs: T0 })
    await store.putEvent({ audit: a, visitorHash: 'v', lang: 'es' }, T0)
    expect((await store.getEvent('ev1', T0 + 1)).kind).toBe('Found')
  })
})

describe('ruleset: tipos (BAJO-4)', () => {
  const mutate = (fn) => { const j = JSON.parse(JSON.stringify(rulesetJson)); fn(j); return j }
  it.each([
    ['umbral gt no numérico', (j) => { j.rules[0].condition.gt = '900' }],
    ['burst.min negativo', (j) => { j.rules[1].condition.min = -1 }],
    ['Limit sin limitMinutes', (j) => { delete j.rules[1].limitMinutes }],
    ['limitMinutes no numérico', (j) => { j.rules[1].limitMinutes = '15' }],
    ['from/to fuera de rango', (j) => { j.rules[2].condition.to = 2000 }],
  ])('rechaza %s', async (_n, fn) => expect((await loadRuleset(mutate(fn))).ok).toBe(false))
  it('el ruleset real sigue siendo válido', async () => expect((await loadRuleset(rulesetJson)).ok).toBe(true))
})
