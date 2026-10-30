// eventId = <128 bits aleatorios en hex>.<HMAC-SHA-256 truncado a 128 bits> (D-PLAN-05).
import { hmacBytes, toHex, timingSafeEqual } from './hmac.js'

const SHAPE = /^([0-9a-f]{32})\.([0-9a-f]{32})$/

export const newRawId = (randomBytes = () => globalThis.crypto.getRandomValues(new Uint8Array(16))) => toHex(randomBytes())

const sig = async (rawId, key) => toHex((await hmacBytes(key, `event:${rawId}`)).slice(0, 16))

export async function signEventId(rawId, key) {
  return `${rawId}.${await sig(rawId, key)}`
}

export async function verifyEventId(eventId, key) {
  if (typeof eventId !== 'string') return { ok: false }
  const m = SHAPE.exec(eventId)
  if (!m) return { ok: false }
  return timingSafeEqual(await sig(m[1], key), m[2]) ? { ok: true, rawId: m[1] } : { ok: false }
}
