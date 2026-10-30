// Validación de entradas (S8, S14, AC-12): método, tipo, tamaño, forma estricta y listas cerradas.
export const MAX_BODY_BYTES = 4096
const EVENT_ID = /^[0-9a-f]{32}\.[0-9a-f]{32}$/

// Cada campo: { required, check(valor) }. Todo lo que no figure aquí se rechaza.
export const SIMULATE_SCHEMA = {
  lang: { required: true, check: (v) => v === 'es' || v === 'en' },
  scenario: { required: false, check: (v) => v === 'A' || v === 'B' || v === 'C' },
  turnstileToken: { required: true, check: (v) => typeof v === 'string' && v.length >= 1 && v.length <= 2048 },
}
export const INTERVENE_SCHEMA = {
  eventId: { required: true, check: (v) => typeof v === 'string' && EVENT_ID.test(v) },
  action: { required: true, check: (v) => v === 'approve' || v === 'override' || v === 'escalate' },
}

const fail = (status) => ({ ok: false, status, code: 'E_INPUT' })

export function parseRequest({ method, contentType, bodyText }, schema) {
  if (method !== 'POST') return fail(405)
  if (typeof contentType !== 'string' || !/^application\/json\s*(;|$)/i.test(contentType)) return fail(415)
  if (typeof bodyText !== 'string' || new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) return fail(413)
  let data
  try {
    data = JSON.parse(bodyText)
  } catch {
    return fail(400)
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return fail(400)
  const keys = Object.keys(data)
  if (keys.some((k) => !Object.hasOwn(schema, k))) return fail(400)
  const value = {}
  for (const [name, rule] of Object.entries(schema)) {
    if (!Object.hasOwn(data, name)) {
      if (rule.required) return fail(400)
      continue
    }
    if (!rule.check(data[name])) return fail(400)
    value[name] = data[name]
  }
  return { ok: true, value }
}
