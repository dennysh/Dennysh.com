// Visitante = HMAC de la IP con clave secreta, sin fecha (D-PLAN-12, AC-17). La IP nunca se guarda.
import { hmacBytes, toHex } from './hmac.js'

export async function visitorHash(ip, key) {
  const value = typeof ip === 'string' && ip.trim() !== '' ? ip.trim() : 'no-ip'
  return toHex(await hmacBytes(key, `visitor:${value}`))
}
