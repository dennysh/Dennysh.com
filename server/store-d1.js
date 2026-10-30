// Almacén sobre D1 (puerto Store, plan §3). Resultados etiquetados con `kind`; D1 caído → StoreDown.
import { newRawId } from './event-id.js'

export const VISITOR_WINDOW_MS = 10 * 60 * 1000
export const GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000
export const GLOBAL_MAX = 20

export function createStore(db) {
  const down = { kind: 'StoreDown' }

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
  }
}
