// Panel "Código": se genera desde content/ruleset.v1.json y src/demo/static-example.json (AC-H3); nunca se copia a mano.
import { UI } from '../demo/strings.js'

const LABELS = {
  es: { rule: 'regla', decision: 'decisión', used: 'usó', unused: 'no usó', review: 'revisión' },
  en: { rule: 'rule', decision: 'decision', used: 'used', unused: 'not used', review: 'review' },
}
const WIDTH = 46
const PAD = 12
const j = (v) => JSON.stringify(v)

// Reparte una lista en líneas de ancho fijo con sangría bajo la etiqueta.
function listLines(label, items) {
  const lines = []
  let cur = ''
  items.forEach((item, i) => {
    const piece = item + (i < items.length - 1 ? ',' : '')
    if (cur && PAD + cur.length + 1 + piece.length > WIDTH) { lines.push(cur); cur = piece } else cur = cur ? `${cur} ${piece}` : piece
  })
  lines.push(cur)
  return lines.map((l, i) => (i === 0 ? label.padEnd(PAD) : ' '.repeat(PAD)) + l)
}

export function codePanel(ruleset, audit, lang = 'es') {
  const L = LABELS[lang]
  const data = UI[lang].data
  const matched = audit.matched[0]
  const rule = ruleset.rules.find((r) => r.id === matched.ruleId)
  const { type, ...rest } = rule.condition
  const restText = Object.entries(rest).map(([k, v]) => `${j(k)}: ${j(v)}`).join(', ')
  const head = [
    '$ cat ruleset.v1.json',
    `{ "id": ${j(rule.id)},`,
    `  "name": ${j(rule.name)},`,
    `  "action": ${j(rule.action)}${rule.limitMinutes != null ? `, "limitMinutes": ${rule.limitMinutes}` : ''},`,
    `  "condition": { "type": ${j(type)},`,
    `    ${restText} } }`,
  ]
  return [
    ...head,
    '',
    `$ audit ${lang === 'es' ? 'ejemplo-estatico' : 'static-example'}`,
    `${L.rule.padEnd(PAD)}${matched.ruleId} v${matched.ruleVersion}`,
    `${L.decision.padEnd(PAD)}${audit.decision}`,
    ...listLines(L.used, audit.usedData.map((k) => data[k] ?? k)),
    ...listLines(L.unused, audit.unusedData.map((k) => data[k] ?? k)),
    `${L.review.padEnd(PAD)}${audit.explanation.reviewState}`,
  ]
}
