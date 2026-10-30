// GET /api/event/:id: lectura de solo lectura. 404 uniforme para inexistente, caducado y firma inválida (AC-25).
import { verifyEventId } from './event-id.js'

export function createGetEvent({ store, clock, config }) {
  return async function getEvent({ method, eventId }) {
    if (method !== 'GET') return { status: 405, body: { code: 'E_INPUT' } }
    const notFound = { status: 404, body: { code: 'E_NOT_FOUND' } }
    if (!(await verifyEventId(eventId, config.eventKey)).ok) return notFound
    const found = await store.getEvent(eventId, clock.now())
    if (found.kind === 'StoreDown' || found.kind === 'Corrupt') return { status: 503, body: { code: 'E_INTERNAL' } }
    if (found.kind !== 'Found') return notFound
    return { status: 200, body: { audit: found.audit } }
  }
}
