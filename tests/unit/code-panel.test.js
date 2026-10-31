import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { codePanel } from '../../src/home/code-panel.js'
import { UI } from '../../src/demo/strings.js'

// El panel de Código sale de los archivos reales (AC-H3): si cambia la regla o el ejemplo, cambia el panel.
const ruleset = JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8'))
const audit = JSON.parse(readFileSync('src/demo/static-example.json', 'utf8'))
const R02 = ruleset.rules.find((r) => r.id === 'R-02')

// Lee el bloque de una etiqueta (con sus líneas de continuación sangradas) y devuelve sus elementos, sin depender de la implementación.
const block = (lines, label) => {
  const i = lines.findIndex((l) => l.startsWith(label))
  const out = [lines[i].slice(12)]
  for (let j = i + 1; j < lines.length && lines[j].startsWith(' '.repeat(12)); j++) out.push(lines[j].trim())
  return out.join(' ').split(',').map((x) => x.trim()).filter(Boolean)
}

describe('codePanel: etiqueta y orden de los datos (revisión de pruebas, hallazgo 1)', () => {
  for (const [lang, used, unused] of [['es', 'usó', 'no usó'], ['en', 'used', 'not used']]) {
    it(`(${lang}) los datos que usó salen bajo "${used}" y los que no usó bajo "${unused}", cada uno en su sitio y en su orden`, () => {
      const lines = codePanel(ruleset, audit, lang)
      expect(block(lines, used.padEnd(12))).toEqual(audit.usedData.map((k) => UI[lang].data[k]))
      expect(block(lines, unused.padEnd(12))).toEqual(audit.unusedData.map((k) => UI[lang].data[k]))
    })
  }
  it('intercambiar las dos listas del ejemplo cambia el panel', () => {
    const swapped = codePanel(ruleset, { ...audit, usedData: audit.unusedData, unusedData: audit.usedData }, 'es')
    expect(block(swapped, 'usó'.padEnd(12))).toEqual(audit.unusedData.map((k) => UI.es.data[k]))
  })
})

describe('codePanel: cada campo se toma de los archivos, no se fija a mano (mutaciones)', () => {
  const r = (mut) => { const m = structuredClone(ruleset); mut(m.rules.find((x) => x.id === 'R-02')); return codePanel(m, audit, 'es').join('\n') }
  it('limitMinutes', () => { const o = r((x) => { x.limitMinutes = 20 }); expect(o).toContain('"limitMinutes": 20'); expect(o).not.toContain('"limitMinutes": 15') })
  it('action', () => expect(r((x) => { x.action = 'Block' })).toContain('"action": "Block"'))
  it('name', () => expect(r((x) => { x.name = 'otro-nombre' })).toContain('"name": "otro-nombre"'))
  it('maxWindowSeconds', () => expect(r((x) => { x.condition.maxWindowSeconds = 90 })).toContain('"maxWindowSeconds": 90'))
  it('el tipo de condición', () => expect(r((x) => { x.condition.type = 'otra' })).toContain('"type": "otra"'))
  it('la versión de la regla del ejemplo', () => {
    const o = codePanel(ruleset, { ...audit, matched: [{ ruleId: 'R-02', ruleVersion: '9.9.9' }] }, 'es').join('\n')
    expect(o).toMatch(/regla\s+R-02 v9\.9\.9/)
  })
  it('el estado de revisión del ejemplo', () => {
    const o = codePanel(ruleset, { ...audit, explanation: { ...audit.explanation, reviewState: 'Reviewed' } }, 'es').join('\n')
    expect(o).toMatch(/revisión\s+Reviewed/)
  })
  it('el valor de cada campo coincide con los archivos reales (R-02 hoy)', () => {
    const o = codePanel(ruleset, audit, 'es').join('\n')
    expect(o).toContain('"limitMinutes": 15')
    expect(o).toContain('"name": "intentos-en-rafaga"')
    expect(o).toContain('"action": "Limit"')
  })
})

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
  it('ninguna línea pasa de 46 caracteres (cabe en la tarjeta)', () => {
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
