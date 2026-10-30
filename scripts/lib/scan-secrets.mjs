// Escáner de secretos (S1, AC-11). Devuelve { file, line, rule }; nunca el valor hallado.
const NAMES = '(?:TOKEN|SECRET|API_KEY|PASSWORD|HMAC_KEY|PRIVATE_KEY)'
const RULES = [
  // Token de bot de Telegram, también dentro de una URL (…/bot123456789:AAH…/sendMessage).
  { rule: 'telegram-bot-token', re: /\d{8,10}:[A-Za-z0-9_-]{30,}/ },
  { rule: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { rule: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: 'github-token', re: /\b(?:ghp|gho|ghs|ghu|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/ },
  { rule: 'bearer-token', re: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/ },
  // Variable de entorno / clave JSON en MAYÚSCULAS con valor (también entre comillas).
  { rule: 'secret-assignment', re: new RegExp(`\\b[A-Z0-9_]*${NAMES}\\b["']?\\s*[=:]\\s*["']?(?![<\\s"'$?]|$)[^\\s"']+`) },
  // Nombres en minúsculas o camelCase: solo si el valor es un literal largo con aspecto de secreto (evita marcar código normal).
  { rule: 'secret-literal', re: /(?:token|secret|api[_-]?key|apikey|password|passwd|hmac[_-]?key)\w*["']?\s*[=:]\s*["'][A-Za-z0-9_\-+/=.:]{20,}["']/i },
]

// Valores de PRUEBA públicos o inventados, usados solo en e2e. Lista exacta: cualquier otro valor con forma de secreto sigue fallando.
export const KNOWN_TEST_VALUES = [
  '1x0000000000000000000000000000000AA', // clave secreta de prueba de Cloudflare Turnstile (siempre pasa; documentada por Cloudflare)
  '000000000:e2e-token-invalido-no-existe-000000000', // token de bot inventado para e2e: Telegram lo rechaza
  'e2e-visitor-key-000000000000000000', // claves HMAC inventadas, solo para la base local de e2e
  'e2e-event-key-00000000000000000000',
]
const escapeRe = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Se enmascara solo el valor completo (no seguido de más caracteres de token): `…AAreal` NO queda enmascarado.
const KNOWN_RE = KNOWN_TEST_VALUES.map((v) => new RegExp(`${escapeRe(v)}(?![A-Za-z0-9_-])`, 'g'))

export function scanText(file, text) {
  const hits = []
  text.split('\n').forEach((line, i) => {
    const masked = KNOWN_RE.reduce((l, re) => l.replace(re, '<prueba>'), line)
    for (const { rule, re } of RULES) {
      if (re.test(masked)) hits.push({ file, line: i + 1, rule })
    }
  })
  return hits
}
