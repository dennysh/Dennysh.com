// Cabeceras de seguridad (spec §10 S18). Fuente única: las usan el middleware de /api/* y el generador de public/_headers.
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  'frame-src https://challenges.cloudflare.com',
  "connect-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

export const COMMON_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}

export const API_HEADERS = { ...COMMON_HEADERS, 'Cache-Control': 'no-store' }

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

function seal(res) {
  const out = new Response(res.body, res)
  for (const [k, v] of Object.entries(API_HEADERS)) out.headers.set(k, v)
  out.headers.delete('Set-Cookie') // sin cookies (S9, AC-17)
  return out
}

// Envuelve un manejador: toda respuesta (incluidos errores y excepciones) sale con las cabeceras.
export function withSecurityHeaders(handler) {
  return async (...args) => {
    try {
      return seal(await handler(...args))
    } catch {
      return seal(json({ code: 'E_INTERNAL' }, 503))
    }
  }
}
