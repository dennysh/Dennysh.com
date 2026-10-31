import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { codePanel } from '../../src/home/code-panel.js'
import { UI } from '../../src/demo/strings.js'

// El panel de Código sale de los archivos reales (AC-H3): si cambia la regla o el ejemplo, cambia el panel.
const ruleset = JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8'))
const audit = JSON.parse(readFileSync('src/demo/static-example.json', 'utf8'))
const R02 = ruleset.rules.find((r) => r.id === 'R-02')

describe('codePanel (TH03)', () => {
  const text = codePanel(ruleset, audit, 'es').join('\n')
  it('muestra la regla R-02 tal como está en ruleset.v1.json', () => {
    expect(text).toContain('$ cat ruleset.v1.json')
    expect(text).toContain(`"id": "${R02.id}"`)
    expect(text).toContain(`"name": "${R02.name}"`)
    expect(text).toContain(`"action": "${R02.action}", "limitMinutes": ${R02.limitMinutes}`)
    expect(text).toContain(`"type": "${R02.condition.type}"`)
    expect(text).toContain(`"min": ${R02.condition.min}, "maxWindowSeconds": ${R02.condition.maxWindowSeconds}`)
  })
  it('muestra la auditoría del ejemplo estático', () => {
    expect(text).toContain('$ audit ejemplo-estatico')
    expect(text).toMatch(new RegExp(`regla\\s+${audit.matched[0].ruleId} v${audit.matched[0].ruleVersion}`))
    expect(text).toMatch(new RegExp(`decisión\\s+${audit.decision}`))
    expect(text).toMatch(new RegExp(`revisión\\s+${audit.explanation.reviewState}`))
    for (const k of audit.usedData) expect(text).toContain(UI.es.data[k])
    for (const k of audit.unusedData) expect(text).toContain(UI.es.data[k])
  })
  it('no usa líneas de más de 40 caracteres de datos (cabe en la tarjeta)', () => {
    for (const l of codePanel(ruleset, audit, 'es')) expect(l.length).toBeLessThanOrEqual(46)
  })
  it('en inglés usa los rótulos y datos en inglés', () => {
    const en = codePanel(ruleset, audit, 'en').join('\n')
    expect(en).toMatch(/rule\s+R-02/)
    expect(en).toMatch(/not used/)
    expect(en).toContain(UI.en.data.nationality)
  })
  it('mutación: si cambia el umbral de la regla, cambia el panel', () => {
    const mutated = structuredClone(ruleset)
    mutated.rules.find((r) => r.id === 'R-02').condition.min = 12
    const out = codePanel(mutated, audit, 'es').join('\n')
    expect(out).toContain('"min": 12')
    expect(out).not.toContain('"min": 10')
  })
  it('mutación: si cambia la decisión del ejemplo, cambia el panel', () => {
    const out = codePanel(ruleset, { ...audit, decision: 'Block' }, 'es').join('\n')
    expect(out).toMatch(/decisión\s+Block/)
  })
})
