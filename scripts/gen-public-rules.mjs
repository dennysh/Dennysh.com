// Genera src/home/rules.public.json: solo las reglas de trabajo públicas. La página importa este archivo y no el completo, para que
// las reglas `public: false` no viajen en el JS del cliente (revisión adversarial, 2026-10-31). Uso: node scripts/gen-public-rules.mjs
import { readFileSync, writeFileSync } from 'node:fs'

export const buildPublicRules = (rules) => rules.filter((r) => r.public).map(({ id, es, en }) => ({ id, public: true, es, en }))

if (import.meta.url === `file://${process.argv[1]}`) {
  const rules = JSON.parse(readFileSync('content/working-rules.json', 'utf8'))
  writeFileSync('src/home/rules.public.json', JSON.stringify(buildPublicRules(rules), null, 2) + '\n')
  console.log('src/home/rules.public.json generado')
}
