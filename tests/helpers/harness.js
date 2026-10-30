// Arnés de servidor: almacén real (D1 simulado) + dobles con espías para verificador, notificador, reloj y azar.
import { createD1 } from './d1.js'
import { getRuleset, templates } from './fixtures.js'
import { createStore } from '../../server/store-d1.js'
import { createSimulate } from '../../server/simulate.js'

export const T0 = 1_793_259_677_402
export const EVENT_KEY = 'e'.repeat(32)
export const VISITOR_KEY = 'v'.repeat(32)

export function seeded(seed = 7) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export async function makeHarness(over = {}) {
  const db = createD1()
  const realStore = createStore(db)
  const calls = []
  const clock = { t: T0, now: () => clock.t }
  const store = new Proxy(realStore, {
    get(target, prop) {
      const fn = target[prop]
      if (typeof fn !== 'function') return fn
      return async (...args) => {
        calls.push(String(prop))
        if (over.failOn?.includes(prop)) return { kind: 'StoreDown' }
        return fn(...args)
      }
    },
  })
  const verifier = { verify: async (token) => (calls.push('verify'), over.verify ? over.verify(token) : { kind: 'Human' }) }
  const notifier = {
    send: async (text) => (calls.push('send'), notifier.sent.push(text), over.send ? over.send(text) : { kind: 'Delivered', messageId: 4242 }),
    edit: async (id, text) => (calls.push('edit'), notifier.edits.push({ id, text }), over.edit ? over.edit(id, text) : { kind: 'Edited' }),
    sent: [],
    edits: [],
  }
  const fallback = over.fallback
    ? { send: async (text) => (calls.push('fallback'), over.fallback(text)) }
    : undefined
  const ruleset = await getRuleset()
  const config = { eventKey: EVENT_KEY, visitorKey: VISITOR_KEY, alertsEnabled: true, testMode: false, chatId: '987654367', ruleset, templates, ...over.config }
  const simulate = createSimulate({ verifier, store, notifier, fallback, clock, rng: { next: seeded(3) }, config })
  const post = (body, ip = '203.0.113.7') =>
    simulate({ method: 'POST', contentType: 'application/json', bodyText: JSON.stringify(body), ip })
  const ok = { lang: 'es', turnstileToken: 'tok' }
  return { db, store, realStore, verifier, notifier, fallback, clock, calls, simulate, post, ok, config }
}
