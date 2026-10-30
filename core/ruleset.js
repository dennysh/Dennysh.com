// Carga y validación del conjunto de reglas (spec §5.3, AC-24). Puro: sin red ni reloj.
const ACTIONS = ['Block', 'Limit', 'Alert']
const RULE_KEYS = ['id', 'name', 'version', 'action', 'condition', 'limitMinutes']
const CONDITIONS = {
  'speed-above': ['type', 'signal', 'gt'],
  burst: ['type', 'min', 'maxWindowSeconds'],
  'off-hours-export': ['type', 'from', 'to'],
}

export function canonicalJson(v) {
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(',')}]`
  if (v && typeof v === 'object') {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(v[k])}`).join(',')}}`
  }
  return JSON.stringify(v)
}

async function sha256Hex(text) {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const onlyKeys = (o, allowed) => Object.keys(o).every((k) => allowed.includes(k))
const bad = (reason) => ({ ok: false, reason })

export async function loadRuleset(json) {
  if (!isObj(json) || !onlyKeys(json, ['version', 'rules'])) return bad('root')
  if (typeof json.version !== 'string' || !Array.isArray(json.rules)) return bad('root')
  const ids = new Set()
  for (const r of json.rules) {
    if (!isObj(r) || !onlyKeys(r, RULE_KEYS)) return bad('rule')
    if (typeof r.id !== 'string' || ids.has(r.id)) return bad('rule-id')
    ids.add(r.id)
    if (!ACTIONS.includes(r.action)) return bad('action')
    const c = r.condition
    if (!isObj(c) || !Object.hasOwn(CONDITIONS, c.type) || !onlyKeys(c, CONDITIONS[c.type])) return bad('condition')
  }
  const hash = await sha256Hex(canonicalJson(json))
  return { ok: true, ruleset: { version: json.version, rules: json.rules, hash } }
}
