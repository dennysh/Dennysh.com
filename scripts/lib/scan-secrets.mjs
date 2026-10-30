// Escáner de secretos (S1, AC-11). Devuelve { file, line, rule }; nunca el valor hallado.
const RULES = [
  { rule: 'telegram-bot-token', re: /\b\d{8,10}:[A-Za-z0-9_-]{30,}\b/ },
  { rule: 'private-key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  {
    rule: 'secret-assignment',
    re: /\b[A-Z0-9_]*(?:TOKEN|SECRET|API_KEY|PASSWORD)\b\s*[=:]\s*["']?(?![<\s"'$?]|$)[^\s"']+/,
  },
]

export function scanText(file, text) {
  const hits = []
  text.split('\n').forEach((line, i) => {
    for (const { rule, re } of RULES) {
      if (re.test(line)) hits.push({ file, line: i + 1, rule })
    }
  })
  return hits
}
