// public/_headers se genera desde la fuente única server/security-headers.js (AC-13, S18).
import { COMMON_HEADERS } from '../../server/security-headers.js'

export function renderHeadersFile() {
  const lines = ['# Generado por scripts/gen-headers.mjs desde server/security-headers.js. No editar a mano.', '/*']
  for (const [k, v] of Object.entries(COMMON_HEADERS)) lines.push(`  ${k}: ${v}`)
  lines.push('/api/*', '  Cache-Control: no-store', '')
  return lines.join('\n')
}

function blocks(text) {
  const out = {}
  let current = null
  for (const raw of text.split('\n')) {
    if (/^\S/.test(raw) && !raw.startsWith('#')) {
      current = raw.trim()
      out[current] ??= {}
    } else if (current && /^\s+\S/.test(raw)) {
      const i = raw.indexOf(':')
      if (i > 0) out[current][raw.slice(0, i).trim().toLowerCase()] = raw.slice(i + 1).trim()
    }
  }
  return out
}

const REFERRER_OK = ['no-referrer', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin']

export function checkHeadersFile(text) {
  const all = blocks(text)
  const h = all['/*'] ?? {}
  const problems = []
  for (const k of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'cross-origin-opener-policy', 'referrer-policy', 'permissions-policy']) {
    if (!h[k]) problems.push(`falta la cabecera ${k} en /*`)
  }
  const csp = h['content-security-policy'] ?? ''
  if (/unsafe-inline|unsafe-eval/.test(csp)) problems.push("la CSP no puede llevar 'unsafe-inline' ni 'unsafe-eval'")
  if (csp && !/frame-ancestors 'none'/.test(csp)) problems.push("la CSP debe llevar frame-ancestors 'none'")
  if (csp && !/object-src 'none'/.test(csp)) problems.push("la CSP debe llevar object-src 'none'")
  if (csp && !/font-src 'self'/.test(csp)) problems.push("la CSP debe llevar font-src 'self'")
  // Directivas que ejecutan o cargan código no pueden abrirse con comodines ni esquemas completos.
  for (const part of csp.split(';').map((p) => p.trim()).filter(Boolean)) {
    const [name, ...vals] = part.split(/\s+/)
    if (['default-src', 'script-src', 'connect-src', 'frame-src', 'style-src'].includes(name)) {
      if (vals.some((v) => v === '*' || v === 'https:' || v === 'http:' || v === 'data:' || v === 'blob:')) problems.push(`la CSP ${name} no puede usar comodines ni esquemas completos (${vals.join(' ')})`)
    }
  }
  const hsts = /max-age=(\d+)/.exec(h['strict-transport-security'] ?? '')
  if (h['strict-transport-security'] && (!hsts || Number(hsts[1]) < 31536000)) problems.push('HSTS: max-age debe ser al menos 31536000')
  if (h['x-content-type-options'] && h['x-content-type-options'] !== 'nosniff') problems.push('X-Content-Type-Options debe ser nosniff')
  if (h['referrer-policy'] && !REFERRER_OK.includes(h['referrer-policy'])) problems.push(`Referrer-Policy no permitida (${h['referrer-policy']})`)
  if (h['cross-origin-opener-policy'] && h['cross-origin-opener-policy'] !== 'same-origin') problems.push('COOP debe ser same-origin')
  if (/=\s*\*|=\(\*\)/.test(h['permissions-policy'] ?? '')) problems.push('Permissions-Policy no puede usar comodines')
  // Ningún otro bloque puede debilitar la política.
  for (const [path, headers] of Object.entries(all)) {
    if (path === '/*') continue
    for (const k of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'cross-origin-opener-policy', 'referrer-policy', 'permissions-policy']) {
      if (headers[k]) problems.push(`el bloque ${path} no puede redefinir ${k}`)
    }
  }
  return problems
}
