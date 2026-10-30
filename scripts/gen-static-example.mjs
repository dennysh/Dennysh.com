// Ejemplo estático sin JS (T075, AC-02, AC-29): un caso fijo calculado con el núcleo, sin envío real.
import { readFileSync, writeFileSync } from 'node:fs'
import { loadRuleset } from '../core/ruleset.js'
import { evaluate } from '../core/evaluate.js'
import { scenario } from '../core/scenario.js'
import { explain } from '../core/explain.js'
import { buildAudit } from '../core/audit.js'

export async function buildStaticExample() {
  const ruleset = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
  const templates = JSON.parse(readFileSync('content/explanations/v1.json', 'utf8')).templates
  const s = scenario('A', () => 0.5)
  const outcome = evaluate(ruleset, s.signals)
  const explanation = explain(outcome, templates, 'es', { ruleset, signals: s.signals })
  return buildAudit({
    eventId: 'ejemplo-estatico',
    nowMs: Date.UTC(2026, 0, 15, 12, 0, 0, 0), // fecha fija: el ejemplo es determinista
    scenario: 'A', input: s.input, ruleset, outcome, explanation,
    alert: { status: 'TestMode', channel: 'none' },
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync('src/demo/static-example.json', JSON.stringify(await buildStaticExample(), null, 2) + '\n')
  console.log('src/demo/static-example.json generado')
}
