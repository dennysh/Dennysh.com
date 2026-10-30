// Escáner de secretos (S1, AC-11). Devuelve { file, line, rule }; nunca el valor hallado.
const RULES = [
  { rule: 'telegram-bot-token', re: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { rule: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    rule: 'secret-assignment',
    re: /\b[A-Z0-9_]*(?:TOKEN|SECRET|API_KEY|PASSWORD)\b\s*[=:]\s*["']?(?![<\s"'$?]|$)[^\s"']+/,
  },
]

// Valores de PRUEBA públicos o inventados, usados solo en e2e. Lista exacta: cualquier otro valor con forma de secreto sigue fallando.
export const KNOWN_TEST_VALUES = [
  '1x0000000000000000000000000000000AA', // clave secreta de prueba de Cloudflare Turnstile (siempre pasa; documentada por Cloudflare)
  '000000000:e2e-token-invalido-no-existe-000000000', // token de bot inventado para e2e: Telegram lo rechaza
]

export function scanText(file, text) {
  const hits = []
  text.split('\n').forEach((line, i) => {
    if (KNOWN_TEST_VALUES.some((v) => line.includes(v))) return
    for (const { rule, re } of RULES) {
      if (re.test(line)) hits.push({ file, line: i + 1, rule })
    }
  })
  return hits
}
