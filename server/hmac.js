// HMAC-SHA-256 con Web Crypto (Node, Workers). Devuelve bytes.
const enc = new TextEncoder()

export async function hmacBytes(key, message) {
  const k = await globalThis.crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', k, enc.encode(message)))
}

export const toHex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')

// Comparación en tiempo constante para cadenas de la misma longitud.
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
