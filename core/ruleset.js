// Carga y validación del conjunto de reglas (spec §5.3, AC-24). Puro: sin red ni reloj.
import { canonicalJson, sha256Hex } from './hash.js'

export { canonicalJson }

const ACTIONS = ['Block', 'Limit', 'Alert']
const RULE_KEYS = ['id', 'name', 'version', 'action', 'condition', 'limitMinutes']
const CONDITIONS = {
  'speed-above': ['type', 'signal', 'gt'],
  burst: ['type', 'min', 'maxWindowSeconds'],
  'off-hours-export': ['type', 'from', 'to'],
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
    const num = (v) => typeof v === 'number' && Number.isFinite(v)
    if (c.type === 'speed-above' && !(num(c.gt) && c.gt >= 0 && c.signal === 'impliedSpeedKmh')) return bad('condition-values')
    if (c.type === 'burst' && !(Number.isInteger(c.min) && c.min >= 1 && Number.isInteger(c.maxWindowSeconds) && c.maxWindowSeconds >= 1)) return bad('condition-values')
    if (c.type === 'off-hours-export' && !(Number.isInteger(c.from) && Number.isInteger(c.to) && c.from >= 0 && c.to <= 1440 && c.from < c.to)) return bad('condition-values')
    if (r.action === 'Limit' && !(Number.isInteger(r.limitMinutes) && r.limitMinutes >= 1)) return bad('limit-minutes')
  }
  const hash = await sha256Hex(canonicalJson(json))
  return { ok: true, ruleset: { version: json.version, rules: json.rules, hash } }
}
