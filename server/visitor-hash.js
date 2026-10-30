// Visitante = HMAC de la IP con clave secreta, sin fecha (D-PLAN-12, AC-17). La IP nunca se guarda.
import { hmacBytes, toHex } from './hmac.js'

// IPv6: un cliente controla todo su /64, así que el visitante es el prefijo /64 (si no, rotaría direcciones y esquivaría el tope).
export function visitorKeyFor(ip) {
  const v = typeof ip === 'string' ? ip.trim().toLowerCase() : ''
  if (v === '') return 'no-ip'
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v)
  if (mapped) return mapped[1]
  if (!v.includes(':')) return v
  const [head, tail = ''] = v.split('::')
  const a = head ? head.split(':') : []
  const b = tail ? tail.split(':') : []
  const groups = v.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : a
  return `${groups.slice(0, 4).map((g) => (g.replace(/^0+(?=.)/, '') || '0')).join(':')}::/64`
}

export async function visitorHash(ip, key) {
  const value = visitorKeyFor(ip)
  return toHex(await hmacBytes(key, `visitor:${value}`))
}
