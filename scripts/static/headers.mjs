// public/_headers se genera desde la fuente única server/security-headers.js (AC-13, S18).
import { COMMON_HEADERS } from '../../server/security-headers.js'

export function renderHeadersFile() {
  const lines = ['# Generado por scripts/gen-headers.mjs desde server/security-headers.js. No editar a mano.', '/*']
  for (const [k, v] of Object.entries(COMMON_HEADERS)) lines.push(`  ${k}: ${v}`)
  lines.push('/api/*', '  Cache-Control: no-store', '')
  return lines.join('\n')
}

function starBlock(text) {
  const out = {}
  let inside = false
  for (const raw of text.split('\n')) {
    if (/^\S/.test(raw) && !raw.startsWith('#')) inside = raw.trim() === '/*'
    else if (inside && /^\s+\S/.test(raw)) {
      const i = raw.indexOf(':')
      if (i > 0) out[raw.slice(0, i).trim().toLowerCase()] = raw.slice(i + 1).trim()
    }
  }
  return out
}

export function checkHeadersFile(text) {
  const h = starBlock(text)
  const problems = []
  for (const k of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'cross-origin-opener-policy', 'referrer-policy', 'permissions-policy']) {
    if (!h[k]) problems.push(`falta la cabecera ${k} en /*`)
  }
  const csp = h['content-security-policy'] ?? ''
  if (/unsafe-inline|unsafe-eval/.test(csp)) problems.push("la CSP no puede llevar 'unsafe-inline' ni 'unsafe-eval'")
  if (csp && !/frame-ancestors 'none'/.test(csp)) problems.push("la CSP debe llevar frame-ancestors 'none'")
  if (csp && !/object-src 'none'/.test(csp)) problems.push("la CSP debe llevar object-src 'none'")
  if (csp && !/font-src 'self'/.test(csp)) problems.push("la CSP debe llevar font-src 'self'")
  if (h['x-content-type-options'] && h['x-content-type-options'] !== 'nosniff') problems.push('X-Content-Type-Options debe ser nosniff')
  return problems
}
