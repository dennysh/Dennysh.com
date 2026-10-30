import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate, SIGNAL_KEYS } from '../../core/evaluate.js'
import { scenario, pickScenario } from '../../core/scenario.js'

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let rules
beforeAll(async () => {
  rules = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})

const DOC_IP = /^(192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/

describe('scenario', () => {
  it('A, B y C producen Limit, Block y Alert con el motor real (AC-04)', () => {
    const out = ['A', 'B', 'C'].map((id) => evaluate(rules, scenario(id, seeded(1)).signals).decision)
    expect(out).toEqual(['Limit', 'Block', 'Alert'])
  })

  it('usa los valores de la spec §5.3', () => {
    expect(scenario('A', seeded(1)).input.params).toEqual({ failedAttempts: 14, windowSeconds: 40 })
    expect(scenario('B', seeded(1)).input.params).toMatchObject({ distanceKm: 9000, minutes: 12, impliedSpeedKmh: 45000 })
    expect(scenario('C', seeded(1)).input.params).toEqual({ action: 'bulkExport', localTime: '03:12', orgZone: 'org' })
  })

  it('la entrada es InputView exacta y sintética (IP de documentación, RFC 5737)', () => {
    for (const id of ['A', 'B', 'C']) {
      const { input } = scenario(id, seeded(7))
      expect(Object.keys(input).sort()).toEqual(['accountLabel', 'kind', 'params', 'sourceIp'])
      expect(input.kind).toBe(id)
      expect(input.sourceIp).toMatch(DOC_IP)
      expect(input.accountLabel).toMatch(/^demo-account-\d{2}$/)
    }
  })

  it('las señales solo usan claves permitidas del motor', () => {
    for (const id of ['A', 'B', 'C']) {
      expect(Object.keys(scenario(id, seeded(3)).signals).every((k) => SIGNAL_KEYS.includes(k))).toBe(true)
    }
  })

  it('es determinista con el mismo rng sembrado y varía con otro', () => {
    expect(scenario('A', seeded(5))).toEqual(scenario('A', seeded(5)))
    const seen = new Set()
    for (let s = 1; s <= 30; s++) seen.add(scenario('A', seeded(s)).input.sourceIp + scenario('A', seeded(s)).input.accountLabel)
    expect(seen.size).toBeGreaterThan(1)
  })

  it('un escenario desconocido es un error de valor, no una excepción', () => {
    expect(scenario('Z', seeded(1))).toEqual({ ok: false, reason: 'unknown-scenario' })
  })
})

describe('pickScenario', () => {
  it('devuelve A, B o C y alcanza los tres con un rng sembrado', () => {
    const r = seeded(11)
    const seen = new Set(Array.from({ length: 60 }, () => pickScenario(r)))
    expect([...seen].sort()).toEqual(['A', 'B', 'C'])
  })
})
