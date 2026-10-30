import { describe, it, expect } from 'vitest'
import { makeHarness, T0, EVENT_KEY } from '../helpers/harness.js'
import { createGetEvent } from '../../server/event.js'
import { signEventId } from '../../server/event-id.js'

async function setup() {
  const h = await makeHarness()
  const { body } = await h.post({ ...h.ok, scenario: 'C' })
  const get = createGetEvent({ store: h.store, clock: h.clock, config: h.config })
  return { h, body, get: (id = body.eventId, method = 'GET') => get({ method, eventId: id }) }
}
const NF = { status: 404, body: { code: 'E_NOT_FOUND' } }

describe('GET /api/event/:id (AC-25, D-04)', () => {
  it('devuelve el registro de solo lectura mientras no caduque', async () => {
    const { h, body, get } = await setup()
    h.clock.t = T0 + 23 * 3_600_000
    const r = await get()
    expect(r.status).toBe(200)
    expect(r.body.audit.recordHash).toBe(body.audit.recordHash)
    expect(Object.keys(r.body)).toEqual(['audit'])
  })

  it('404 uniforme: inexistente, caducado y firma inválida son indistinguibles', async () => {
    const { h, body, get } = await setup()
    const forged = body.eventId.slice(0, -1) + (body.eventId.endsWith('0') ? '1' : '0')
    const unknown = await signEventId('9'.repeat(32), EVENT_KEY)
    const results = [await get(forged), await get(unknown), await get('basura'), await get('')]
    h.clock.t = T0 + 24 * 3_600_000
    results.push(await get())
    for (const r of results) expect(r).toEqual(NF)
  })

  it('almacén caído → 503 E_INTERNAL (no finge inexistencia)', async () => {
    const { h, get } = await setup()
    h.db.state.down = true
    expect(await get()).toEqual({ status: 503, body: { code: 'E_INTERNAL' } })
  })

  it('solo GET', async () => {
    const { get } = await setup()
    expect((await get(undefined, 'POST')).status).toBe(405)
  })
})
