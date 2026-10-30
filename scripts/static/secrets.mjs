// Variables públicas y secretos (S1, S3, AC-11).
import { scanText } from '../lib/scan-secrets.mjs'

export const ALLOWED_VITE = ['VITE_TURNSTILE_SITEKEY']

export function checkViteEnv(file, text) {
  return [...text.matchAll(/\bVITE_[A-Z0-9_]+/g)]
    .map((m) => m[0])
    .filter((name) => !ALLOWED_VITE.includes(name))
    .map((name) => `${file}: variable pública no permitida ${name}`)
}

const HISTORY_SKIP = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|glb|lock)$|package-lock\.json$|(^|\/)tests\/|scan-secrets|\/static\//

// Mira solo las líneas añadidas de un parche (git log -p). Devuelve { file, line, rule }, nunca el valor.
export function scanPatchAdditions(patch) {
  const hits = []
  let file = ''
  for (const line of patch.split('\n')) {
    if (line.startsWith('+++ b/')) file = line.slice(6)
    else if (line.startsWith('+') && !line.startsWith('+++') && !HISTORY_SKIP.test(file)) hits.push(...scanText(file, line.slice(1)))
  }
  return hits
}
