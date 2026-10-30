// Adaptadores Request→núcleo de servidor→Response. Aquí se aplica la lista blanca de respuestas.
import { buildServices } from './services.js'
import { createSimulate } from './simulate.js'
import { createIntervene } from './intervene.js'
import { createGetEvent } from './event.js'
import { MAX_BODY_BYTES } from './validation.js'
import { json } from './security-headers.js'
import { toBody } from './views.js'

const respond = (r) => json(toBody(r.body), r.status)

// Lee el cuerpo con tope: sin Content-Length (streaming) se corta al pasar el máximo, sin cargar todo en memoria.
const OVERSIZE = 'x'.repeat(MAX_BODY_BYTES + 1)
async function readBody(request) {
  if (request.method !== 'POST') return ''
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) return OVERSIZE
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_BODY_BYTES) {
      await reader.cancel()
      return OVERSIZE
    }
    chunks.push(value)
  }
  const all = new Uint8Array(total)
  let at = 0
  for (const c of chunks) { all.set(c, at); at += c.byteLength }
  return new TextDecoder().decode(all)
}
const input = async (request) => ({
  method: request.method,
  contentType: request.headers.get('content-type'),
  bodyText: await readBody(request),
  ip: request.headers.get('CF-Connecting-IP'),
})

export async function simulateHandler({ request, env }) {
  return respond(await createSimulate(await buildServices(env))(await input(request)))
}

export async function interveneHandler({ request, env }) {
  return respond(await createIntervene(await buildServices(env))(await input(request)))
}

export async function eventHandler({ request, env, params }) {
  return respond(await createGetEvent(await buildServices(env))({ method: request.method, eventId: params?.id }))
}
