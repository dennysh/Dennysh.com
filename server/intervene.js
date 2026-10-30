// POST /api/intervene: Aprobar / Anular / Escalar (spec §5.5). El eventId firmado es la única credencial.
import { parseRequest, INTERVENE_SCHEMA } from './validation.js'
import { verifyEventId } from './event-id.js'
import { renderAlert } from '../core/alert-text.js'

const err = (status, code) => ({ status, body: { code } })
const NOT_FOUND = err(404, 'E_NOT_FOUND')
const INTERNAL = err(503, 'E_INTERNAL')

export function createIntervene({ store, notifier, clock, config }) {
  return async function intervene({ method, contentType, bodyText }) {
    const parsed = parseRequest({ method, contentType, bodyText }, INTERVENE_SCHEMA)
    if (!parsed.ok) return err(parsed.status, parsed.code)
    const { eventId, action } = parsed.value

    if (!(await verifyEventId(eventId, config.eventKey)).ok) return NOT_FOUND
    const now = clock.now()
    const found = await store.getEvent(eventId, now)
    if (found.kind === 'StoreDown' || found.kind === 'Corrupt') return INTERNAL
    if (found.kind !== 'Found') return NOT_FOUND

    const added = await store.appendIntervention(eventId, action, now)
    if (added.kind === 'LimitReached') return err(409, 'E_LIMIT')
    if (added.kind === 'NotFound') return NOT_FOUND
    if (added.kind !== 'Ok') return INTERNAL

    // Escalar edita el mensaje ya enviado: no crea otra notificación ni gasta cupo.
    if (action === 'escalate') {
      let escalation = 'NoMessage'
      if (found.messageId != null) {
        const text = `${renderAlert(found.audit)}\nEscalado para revisión humana.`
        escalation = (await notifier.edit(found.messageId, text)).kind === 'Edited' ? 'Edited' : 'Failed'
      }
      await store.updateAlert(eventId, { ...found.audit.alert, escalation })
    }

    const fresh = await store.getEvent(eventId, now)
    if (fresh.kind !== 'Found') return INTERNAL
    return { status: 200, body: { audit: fresh.audit } }
  }
}
