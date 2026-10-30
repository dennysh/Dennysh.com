// Adaptador de Turnstile (puerto Verifier, S12). Verifica en el servidor, con el host esperado y un solo uso.
import { timedFetch, readJson } from './http.js'

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const BOT_CODES = ['timeout-or-duplicate', 'invalid-input-response', 'missing-input-response', 'bad-request']

export function createVerifier({ secret, fetch: fetchFn = globalThis.fetch, expectedHost, timeoutMs = 3000, testMode = false }) {
  const hosts = [].concat(expectedHost ?? [])
  return {
    async verify(token) {
      const out = await timedFetch(
        fetchFn,
        SITEVERIFY,
        { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ secret, response: token }).toString() },
        timeoutMs,
      )
      if (!out.res || !out.res.ok) return { kind: 'VerifierDown' }
      const data = await readJson(out.res)
      if (!data || typeof data.success !== 'boolean') return { kind: 'VerifierDown' }
      if (data.success) {
        if (!testMode && !hosts.includes(data.hostname)) return { kind: 'Bot', reason: 'host-mismatch' }
        return { kind: 'Human' }
      }
      const codes = Array.isArray(data['error-codes']) ? data['error-codes'] : []
      // Secreto mal configurado o fallo interno: cierra seguro, no culpa al visitante.
      if (codes.some((c) => c === 'invalid-input-secret' || c === 'missing-input-secret' || c === 'internal-error')) return { kind: 'VerifierDown' }
      return { kind: 'Bot', reason: codes.find((c) => BOT_CODES.includes(c)) ?? 'rejected' }
    },
  }
}
