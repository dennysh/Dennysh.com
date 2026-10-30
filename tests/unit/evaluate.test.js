import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'

let rules
beforeAll(async () => {
  rules = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})

const quiet = { failedAttempts: 0, windowSeconds: 60, impliedSpeedKmh: 0, bulkExport: false, localMinutes: 12 * 60 }
const sig = (o) => ({ ...quiet, ...o })
const ids = (o) => o.matched.map((m) => m.ruleId)

describe('evaluate: escenarios de la spec §5.3', () => {
  it('A (14 intentos en 40 s) → Limit por R-02', () => {
    const o = evaluate(rules, sig({ failedAttempts: 14, windowSeconds: 40 }))
    expect(o.decision).toBe('Limit')
    expect(ids(o)).toEqual(['R-02'])
    expect(o.effectiveRule).toBe('R-02')
  })

  it('B (9 000 km en 12 min = 45 000 km/h) → Block por R-01', () => {
    const o = evaluate(rules, sig({ impliedSpeedKmh: 45000 }))
    expect(o.decision).toBe('Block')
    expect(ids(o)).toEqual(['R-01'])
  })

  it('C (exportación masiva a las 03:12) → Alert por R-03', () => {
    const o = evaluate(rules, sig({ bulkExport: true, localMinutes: 3 * 60 + 12 }))
    expect(o.decision).toBe('Alert')
    expect(ids(o)).toEqual(['R-03'])
  })
})

describe('evaluate: precedencia y vacío (AC-20)', () => {
  it('gana la acción más severa y se listan todas las coincidencias', () => {
    const o = evaluate(rules, sig({ failedAttempts: 12, impliedSpeedKmh: 2000, bulkExport: true, localMinutes: 60 }))
    expect(o.decision).toBe('Block')
    expect(ids(o)).toEqual(['R-01', 'R-02', 'R-03'])
    expect(o.effectiveRule).toBe('R-01')
  })

  it('Limit gana a Alert', () => {
    const o = evaluate(rules, sig({ failedAttempts: 10, bulkExport: true, localMinutes: 60 }))
    expect(o.decision).toBe('Limit')
    expect(ids(o)).toEqual(['R-02', 'R-03'])
  })

  it('sin coincidencias → Allow, matched vacío y sin regla efectiva', () => {
    const o = evaluate(rules, sig({}))
    expect(o).toEqual({ decision: 'Allow', matched: [] })
  })

  it('cada coincidencia lleva ruleId y ruleVersion', () => {
    expect(evaluate(rules, sig({ impliedSpeedKmh: 901 })).matched).toEqual([{ ruleId: 'R-01', ruleVersion: '1.0.0' }])
  })
})

describe('evaluate: la severidad manda, no el orden de las reglas', () => {
  it('con las reglas en orden inverso sigue ganando Block, luego Limit', () => {
    const reversed = { ...rules, rules: [...rules.rules].reverse() }
    const all = evaluate(reversed, sig({ failedAttempts: 12, impliedSpeedKmh: 2000, bulkExport: true, localMinutes: 60 }))
    expect(all.decision).toBe('Block')
    expect(all.effectiveRule).toBe('R-01')
    expect(evaluate(reversed, sig({ failedAttempts: 10, bulkExport: true, localMinutes: 60 })).decision).toBe('Limit')
  })
})

describe('evaluate: fronteras', () => {
  it('900 km/h exactos no bloquean; 901 sí', () => {
    expect(evaluate(rules, sig({ impliedSpeedKmh: 900 })).decision).toBe('Allow')
    expect(evaluate(rules, sig({ impliedSpeedKmh: 901 })).decision).toBe('Block')
  })

  it('ráfaga: 9 intentos no; 10 en 60 s sí; 10 en 61 s no', () => {
    expect(evaluate(rules, sig({ failedAttempts: 9, windowSeconds: 30 })).decision).toBe('Allow')
    expect(evaluate(rules, sig({ failedAttempts: 10, windowSeconds: 60 })).decision).toBe('Limit')
    expect(evaluate(rules, sig({ failedAttempts: 10, windowSeconds: 61 })).decision).toBe('Allow')
  })

  it('horario laboral [07:00, 20:00): 06:59 y 20:00 alertan; 07:00 y 19:59 no', () => {
    const at = (m) => evaluate(rules, sig({ bulkExport: true, localMinutes: m })).decision
    expect(at(419)).toBe('Alert')
    expect(at(420)).toBe('Allow')
    expect(at(1199)).toBe('Allow')
    expect(at(1200)).toBe('Alert')
  })

  it('fuera de horario sin exportación masiva no alerta', () => {
    expect(evaluate(rules, sig({ bulkExport: false, localMinutes: 180 })).decision).toBe('Allow')
  })

  it('es determinista', () => {
    const s = sig({ failedAttempts: 14, windowSeconds: 40 })
    expect(evaluate(rules, s)).toEqual(evaluate(rules, { ...s }))
  })
})
