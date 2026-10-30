// Almacén sobre D1 (puerto Store, plan §3). Resultados etiquetados con `kind`; D1 caído → StoreDown.
import { newRawId } from './event-id.js'
import { effectiveState, chainInterventions } from '../core/audit.js'

export const VISITOR_WINDOW_MS = 10 * 60 * 1000
export const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000
export const GLOBAL_MAX = 20
const ACTIONS = ['approve', 'override', 'escalate']
const MAX_INTERVENTIONS = 3
export const EVENT_TTL_MS = 24 * 60 * 60 * 1000
export const SLOT_TTL_MS = 25 * 60 * 60 * 1000

export function createStore(db) {
  const down = { kind: 'StoreDown' }

  // Reconstruye la vista: la parte sellada + alerta + intervenciones (con estado efectivo).
  async function load(eventId) {
    const row = await db.prepare('SELECT auditJson, alertJson, alertMessageId, expiresAt FROM events WHERE id = ?').bind(eventId).first()
    if (!row) return null
    const { results } = await db.prepare('SELECT seq, action, at FROM interventions WHERE eventId = ? ORDER BY seq').bind(eventId).all()
    const interventions = results.map((r) => ({ seq: r.seq, action: r.action, atUtc: new Date(r.at).toISOString(), actor: 'visitor-demo' }))
    const audit = { ...JSON.parse(row.auditJson), alert: JSON.parse(row.alertJson), interventions, ...effectiveState(interventions) }
    return { audit, messageId: row.alertMessageId, expiresAt: row.expiresAt }
  }

  return {
    // Una sola sentencia condicional: nunca lee y luego escribe, así que dos peticiones simultáneas no pasan ambas.
    async reserveSlot(visitorHash, now) {
      try {
        const id = newRawId()
        const r = await db
          .prepare(
            `INSERT INTO alert_slots (id, visitorHash, at, eventId, status)
             SELECT ?, ?, ?, NULL, 'Reserved'
             WHERE (SELECT COUNT(*) FROM alert_slots WHERE visitorHash = ? AND at > ?) = 0
               AND (SELECT COUNT(*) FROM alert_slots WHERE at > ?) < ?`,
          )
          .bind(id, visitorHash, now, visitorHash, now - VISITOR_WINDOW_MS, now - GLOBAL_WINDOW_MS, GLOBAL_MAX)
          .run()
        if (r.meta.changes === 1) return { kind: 'Reserved', slotId: id }
        const mine = await db
          .prepare('SELECT MAX(at) AS at FROM alert_slots WHERE visitorHash = ? AND at > ?')
          .bind(visitorHash, now - VISITOR_WINDOW_MS)
          .first()
        if (mine?.at != null) return { kind: 'VisitorCap', lastAlertAt: mine.at }
        const last = await db.prepare('SELECT MAX(at) AS at FROM alert_slots WHERE at > ?').bind(now - GLOBAL_WINDOW_MS).first()
        return { kind: 'GlobalCap', lastAlertAt: last?.at ?? null }
      } catch {
        return down
      }
    },

    async putEvent({ audit, visitorHash, lang, messageId = null }, now) {
      try {
        const { alert, interventions, effectiveState: _e, escalated: _x, ...sealed } = audit
        await db
          .prepare('INSERT INTO events (id, createdAt, expiresAt, visitorHash, lang, scenario, recordHash, auditJson, alertJson, alertMessageId) VALUES (?,?,?,?,?,?,?,?,?,?)')
          .bind(audit.eventId, now, now + EVENT_TTL_MS, visitorHash, lang, audit.scenario, audit.recordHash, JSON.stringify(sealed), JSON.stringify(alert), messageId)
          .run()
        return { kind: 'Ok' }
      } catch {
        return down
      }
    },

    // Lo caducado se trata como inexistente aunque la fila siga (la purga es oportunista).
    async getEvent(eventId, now) {
      try {
        const found = await load(eventId)
        if (!found || found.expiresAt <= now) return { kind: 'NotFoundOrExpired' }
        return { kind: 'Found', audit: found.audit, messageId: found.messageId }
      } catch {
        return down
      }
    },

    async purgeExpired(now) {
      try {
        const old = await db.prepare('SELECT id FROM events WHERE expiresAt <= ?').bind(now).all()
        let count = 0
        for (const { id } of old.results) {
          count += (await db.prepare('DELETE FROM interventions WHERE eventId = ?').bind(id).run()).meta.changes
          count += (await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()).meta.changes
        }
        count += (await db.prepare('DELETE FROM alert_slots WHERE at <= ?').bind(now - SLOT_TTL_MS).run()).meta.changes
        return { kind: 'Ok', count }
      } catch {
        return down
      }
    },

    async updateAlert(eventId, alert, messageId = null) {
      try {
        const r = await db
          .prepare('UPDATE events SET alertJson = ?, alertMessageId = COALESCE(?, alertMessageId) WHERE id = ?')
          .bind(JSON.stringify(alert), messageId, eventId)
          .run()
        return r.meta.changes === 1 ? { kind: 'Ok' } : { kind: 'NotFound' }
      } catch {
        return down
      }
    },

    // seq es parte de la clave primaria: dos peticiones simultáneas no pueden ocupar el mismo hueco (se reintenta).
    async appendIntervention(eventId, action, now) {
      if (!ACTIONS.includes(action)) return { kind: 'BadAction' }
      try {
        for (let attempt = 0; attempt < 10; attempt++) {
          const found = await load(eventId)
          if (!found || found.expiresAt <= now) return { kind: 'NotFound' }
          const current = found.audit.interventions
          if (current.length >= MAX_INTERVENTIONS) return { kind: 'LimitReached' }
          const next = { seq: current.length + 1, action, atUtc: new Date(now).toISOString(), actor: 'visitor-demo' }
          const chain = await chainInterventions(found.audit.recordHash, [...current, next])
          const prevHash = chain.length > 1 ? chain[chain.length - 2] : found.audit.recordHash
          try {
            await db
              .prepare('INSERT INTO interventions (eventId, seq, action, at, prevHash, hash) VALUES (?,?,?,?,?,?)')
              .bind(eventId, next.seq, action, now, prevHash, chain[chain.length - 1])
              .run()
            return { kind: 'Ok', interventions: [...current, next] }
          } catch (e) {
            if (!/UNIQUE|PRIMARY|constraint/i.test(String(e?.message))) throw e
          }
        }
        return down
      } catch {
        return down
      }
    },

    async getBreaker(now) {
      try {
        const row = await db.prepare('SELECT openUntil FROM breaker WHERE id = 1').bind().first()
        return row && row.openUntil > now ? { kind: 'Open', untilAt: row.openUntil } : { kind: 'Closed' }
      } catch {
        return down
      }
    },

    async tripBreaker(now, seconds = 60) {
      try {
        await db
          .prepare('INSERT INTO breaker (id, openUntil) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET openUntil = MAX(openUntil, excluded.openUntil)')
          .bind(now + seconds * 1000)
          .run()
        return { kind: 'Ok' }
      } catch {
        return down
      }
    },
  }
}
