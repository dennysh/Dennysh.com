import { describe, it, expect } from 'vitest'
import { utcLabel, localLabel, offsetLabel, hhmmLocal, fillTemplate, explanationText } from '../../src/demo/format.js'
import { createClient, STORAGE_KEY } from '../../src/demo/api.js'
import { UI } from '../../src/demo/strings.js'
import explanations from '../../content/explanations/v1.json'

const ISO = '2026-10-29T07:41:17.402Z'

describe('horas (AC-19)', () => {
  it('UTC con milisegundos', () => expect(utcLabel(ISO)).toBe('07:41:17.402 UTC'))
  it('hora local con zona America/Guayaquil muestra UTC-5', () => {
    expect(localLabel(ISO, 'es', 'America/Guayaquil')).toBe('02:41:17 (UTC-5)')
    expect(offsetLabel(ISO, 'America/Guayaquil')).toBe('UTC-5')
  })
  it('otras zonas: UTC+0, UTC+5:30 y UTC-3', () => {
    expect(offsetLabel(ISO, 'UTC')).toBe('UTC+0')
    expect(offsetLabel(ISO, 'Asia/Kolkata')).toBe('UTC+5:30')
    expect(offsetLabel(ISO, 'America/Sao_Paulo')).toBe('UTC-3')
  })
  it('HH:MM local para el estado Agrupada', () => expect(hhmmLocal(ISO, 'America/Guayaquil')).toBe('02:41'))
  it('una fecha inválida no lanza', () => {
    expect(utcLabel('nada')).toBe('—')
    expect(localLabel('nada', 'es', 'UTC')).toBe('—')
  })
})

describe('explicación', () => {
  const t = explanations.templates.find((x) => x.id === 'expl-R-02')
  it('sustituye marcadores con números de params', () => {
    const text = fillTemplate(t.text.es, { thresholds: { min: 10, maxWindowSeconds: 60 }, observed: { failedAttempts: 14, windowSeconds: 40 } })
    expect(text).toContain('14 intentos fallidos en 40 s')
    expect(text).toContain('desde 10 intentos en 60 s')
    expect(text).not.toMatch(/[{}]/)
  })
  it('un marcador sin valor se deja vacío, nunca "undefined" ni HTML', () => {
    expect(fillTemplate('a {observed.x} b', { observed: {} })).toBe('a — b')
    expect(fillTemplate('{observed.x}', { observed: { x: '<b>' } })).toBe('—')
  })
  it('explanationText resuelve plantilla e idioma desde la referencia del servidor', () => {
    const ref = { templateId: 'expl-R-01', version: '1', params: { thresholds: { gt: 900 }, observed: { impliedSpeedKmh: 45000 } }, reviewState: 'PendingReview' }
    expect(explanationText(ref, 'en')).toContain('45000 km/h')
    expect(explanationText({ ...ref, templateId: 'nada' }, 'en')).toBe('')
  })
})

describe('cliente de API (AC-25, AC-28)', () => {
  const mk = (handler, store = new Map()) => {
    const calls = []
    const fetch = async (url, init) => (calls.push({ url, init }), handler(url, init))
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: (k) => store.delete(k) }
    return { calls, store, client: createClient({ fetch, getToken: async () => 'tok', storage }) }
  }
  const ok = (body, status = 200) => new Response(JSON.stringify(body), { status })

  it('simulate envía lang, scenario elegido y token; guarda el eventId en sessionStorage', async () => {
    const { calls, store, client } = mk(() => ok({ eventId: 'ev.1', audit: { eventId: 'ev.1' } }))
    const r = await client.simulate({ lang: 'es', scenario: 'B' })
    expect(r).toEqual({ ok: true, audit: { eventId: 'ev.1' } })
    expect(JSON.parse(calls[0].init.body)).toEqual({ lang: 'es', scenario: 'B', turnstileToken: 'tok' })
    expect(calls[0].url).toBe('/api/simulate')
    expect(store.get(STORAGE_KEY)).toBe('ev.1')
  })
  it('sin escenario no lo envía', async () => {
    const { calls, client } = mk(() => ok({ eventId: 'e', audit: {} }))
    await client.simulate({ lang: 'en' })
    expect(JSON.parse(calls[0].init.body)).toEqual({ lang: 'en', turnstileToken: 'tok' })
  })
  it.each([[403, 'bot'], [400, 'input'], [503, 'unavailable'], [500, 'unavailable']])('HTTP %s → %s', async (status, kind) => {
    const { client } = mk(() => ok({ code: 'x' }, status))
    expect(await client.simulate({ lang: 'es' })).toEqual({ ok: false, kind })
  })
  it('red caída → unavailable; token imposible → turnstile', async () => {
    expect(await mk(() => { throw new Error('x') }).client.simulate({ lang: 'es' })).toEqual({ ok: false, kind: 'unavailable' })
    const c = createClient({ fetch: async () => ok({}), getToken: async () => { throw new Error('blocked') }, storage: { getItem() {}, setItem() {}, removeItem() {} } })
    expect(await c.simulate({ lang: 'es' })).toEqual({ ok: false, kind: 'turnstile' })
  })
  it('restore: sin id guardado → null; con id válido devuelve la auditoría; caducado borra y avisa', async () => {
    expect(await mk(() => ok({})).client.restore()).toBeNull()
    const store = new Map([[STORAGE_KEY, 'ev.1']])
    expect(await mk(() => ok({ audit: { eventId: 'ev.1' } }), store).client.restore()).toEqual({ ok: true, audit: { eventId: 'ev.1' } })
    const gone = mk(() => ok({ code: 'E_NOT_FOUND' }, 404), new Map([[STORAGE_KEY, 'ev.1']]))
    expect(await gone.client.restore()).toEqual({ ok: false, kind: 'expired' })
    expect(gone.store.has(STORAGE_KEY)).toBe(false)
  })
  it('intervene: 200 devuelve la auditoría, 409 → limit, 404 → expired', async () => {
    expect(await mk(() => ok({ audit: { a: 1 } })).client.intervene('ev.1', 'approve')).toEqual({ ok: true, audit: { a: 1 } })
    expect(await mk(() => ok({ code: 'E_LIMIT' }, 409)).client.intervene('ev.1', 'approve')).toEqual({ ok: false, kind: 'limit' })
    expect(await mk(() => ok({ code: 'E_NOT_FOUND' }, 404)).client.intervene('ev.1', 'approve')).toEqual({ ok: false, kind: 'expired' })
  })
  it('sessionStorage no disponible no rompe nada', async () => {
    const c = createClient({ fetch: async () => ok({ eventId: 'e', audit: {} }), getToken: async () => 't', storage: null })
    expect((await c.simulate({ lang: 'es' })).ok).toBe(true)
    expect(await c.restore()).toBeNull()
  })
  it('nunca usa cookies ni credenciales', async () => {
    const { calls, client } = mk(() => ok({ eventId: 'e', audit: {} }))
    await client.simulate({ lang: 'es' })
    expect(calls[0].init.credentials).toBe('omit')
  })
})

describe('textos de la interfaz', () => {
  const flat = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`]))
  it('EN y ES tienen las mismas claves', () => expect(flat(UI.es).sort()).toEqual(flat(UI.en).sort()))
  it('nunca dice "Entregada" para estados que no sean Delivered', () => {
    for (const lang of ['es', 'en']) {
      const s = UI[lang].alert
      for (const [k, v] of Object.entries(s.status)) if (k !== 'Delivered') expect(String(v)).not.toMatch(/^(entregada|delivered)/i)
    }
  })
  it('Delivered dice exactamente "Entregada a Telegram" / "Delivered to Telegram" (P-02)', () => {
    expect(UI.es.alert.status.Delivered).toBe('Entregada a Telegram')
    expect(UI.en.alert.status.Delivered).toBe('Delivered to Telegram')
  })
})
