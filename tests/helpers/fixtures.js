// Auditoría real construida con el núcleo, para pruebas de servidor.
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'
import { scenario } from '../../core/scenario.js'
import { explain } from '../../core/explain.js'
import { buildAudit } from '../../core/audit.js'

export const templates = JSON.parse(readFileSync('content/explanations/v1.json', 'utf8')).templates
export const rulesetJson = JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8'))
let cached
export const getRuleset = async () => (cached ??= (await loadRuleset(rulesetJson)).ruleset)

export async function makeAudit({ eventId = 'ev1', id = 'A', nowMs = 1_793_259_677_402, lang = 'es', alert } = {}) {
  const ruleset = await getRuleset()
  const s = scenario(id, () => 0.5)
  const outcome = evaluate(ruleset, s.signals)
  const explanation = explain(outcome, templates, lang, { ruleset, signals: s.signals })
  return buildAudit({ eventId, nowMs, scenario: id, input: s.input, ruleset, outcome, explanation, alert })
}
