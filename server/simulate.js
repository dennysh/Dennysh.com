// Orquestador de POST /api/simulate. Orden fijo (D-03), barato primero:
// entrada → Turnstile → cupo → interruptor → decidir → persistir → notificar → actualizar.
// Sin reglas de negocio aquí: las decide el núcleo.
import { parseRequest, SIMULATE_SCHEMA } from './validation.js'
import { visitorHash } from './visitor-hash.js'
import { signEventId, newRawId } from './event-id.js'
import { maskChat } from './notifier.js'
import { scenario as buildScenario, pickScenario } from '../core/scenario.js'
import { evaluate } from '../core/evaluate.js'
import { explain } from '../core/explain.js'
import { buildAudit, toUtcIso } from '../core/audit.js'
import { renderAlert } from '../core/alert-text.js'

const err = (status, code) => ({ status, body: { code } })
const INTERNAL = err(503, 'E_INTERNAL')
const TRIPS_BREAKER = ['rate_limited', 'server_error']

export function createSimulate({ verifier, store, notifier, fallback, clock, rng, config }) {
  async function deliver(text, now) {
    const r = await notifier.send(text)
    if (r.kind === 'NotSent') return { alert: { status: 'TestMode', channel: 'none' } }
    let alert
    let messageId = null
    if (r.kind === 'Delivered') {
      messageId = r.messageId
      alert = { status: 'Delivered', channel: 'telegram', atUtc: toUtcIso(now), maskedChat: maskChat(config.chatId), messageIdPresent: true }
    } else if (r.kind === 'Unconfirmed') {
      alert = { status: 'Unconfirmed', channel: 'telegram', atUtc: toUtcIso(now), code: 'timeout' }
    } else {
      alert = { status: 'Failed', channel: 'telegram', atUtc: toUtcIso(now), code: r.code }
    }
    if (r.kind === 'Unconfirmed' || (r.kind === 'Failed' && TRIPS_BREAKER.includes(r.code))) await store.tripBreaker(now, 60)
    if (fallback && (r.kind === 'Failed' || r.kind === 'Unconfirmed')) {
      // Comparte el cupo ya reservado: no pide otro.
      const f = await fallback.send(text)
      alert.fallback = { channel: 'email', status: f.kind === 'Delivered' ? 'Delivered' : f.kind === 'Unconfirmed' ? 'Unconfirmed' : 'Failed', atUtc: toUtcIso(now) }
      if (f.kind === 'Failed') alert.fallback.code = f.code
      if (f.kind === 'Unconfirmed') alert.fallback.code = 'timeout'
    }
    return { alert, messageId }
  }

  return async function simulate({ method, contentType, bodyText, ip }) {
    const parsed = parseRequest({ method, contentType, bodyText }, SIMULATE_SCHEMA)
    if (!parsed.ok) return err(parsed.status, parsed.code)
    const { lang, scenario: asked, turnstileToken } = parsed.value

    const human = await verifier.verify(turnstileToken)
    if (human.kind === 'Bot') return err(403, 'E_BOT')
    if (human.kind !== 'Human') return INTERNAL

    const now = clock.now()
    const vHash = await visitorHash(ip, config.visitorKey)
    const realAlerts = config.alertsEnabled === true && config.testMode !== true

    // Cupo antes de nada caro (D-02/D-03). Se consume aunque el envío falle.
    let alert = { status: 'TestMode', channel: 'none' }
    let mayNotify = false
    if (realAlerts) {
      const slot = await store.reserveSlot(vHash, now)
      if (slot.kind === 'StoreDown') return INTERNAL
      if (slot.kind === 'VisitorCap' || slot.kind === 'GlobalCap') {
        alert = { status: 'Grouped', channel: 'none' }
        if (slot.lastAlertAt != null) alert.groupedWithAtUtc = toUtcIso(slot.lastAlertAt)
      } else {
        const breaker = await store.getBreaker(now)
        if (breaker.kind === 'StoreDown') return INTERNAL
        if (breaker.kind === 'Open') alert = { status: 'Paused', channel: 'none' }
        else mayNotify = true
      }
    }

    const id = asked ?? pickScenario(rng.next)
    const s = buildScenario(id, rng.next)
    const outcome = evaluate(config.ruleset, s.signals)
    const explanation = explain(outcome, config.templates, lang, { ruleset: config.ruleset, signals: s.signals })
    if (explanation.ok === false) return INTERNAL
    const eventId = await signEventId(newRawId(), config.eventKey)
    const audit = await buildAudit({ eventId, nowMs: now, scenario: id, input: s.input, ruleset: config.ruleset, outcome, explanation, alert })

    const put = await store.putEvent({ audit, visitorHash: vHash, lang }, now)
    if (put.kind !== 'Ok') return INTERNAL
    await store.purgeExpired(now) // oportunista: sin cron en Pages

    let messageId = null
    if (mayNotify) {
      const out = await deliver(renderAlert(audit), now)
      audit.alert = out.alert
      messageId = out.messageId ?? null
    }
    await store.updateAlert(eventId, audit.alert, messageId) // si falla, la respuesta igual dice la verdad

    return { status: 200, body: { eventId, audit } }
  }
}
