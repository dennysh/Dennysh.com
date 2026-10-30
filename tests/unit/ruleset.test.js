import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset, canonicalJson } from '../../core/ruleset.js'

const reverseKeys = (v) =>
  Array.isArray(v) ? v.map(reverseKeys)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).reverse().map(([k, x]) => [k, reverseKeys(x)]))
    : v
const file = () => JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8'))

describe('loadRuleset', () => {
  it('carga content/ruleset.v1.json con R-01..R-03 y los umbrales de la spec', async () => {
    const r = await loadRuleset(file())
    expect(r.ok).toBe(true)
    const byId = Object.fromEntries(r.ruleset.rules.map((x) => [x.id, x]))
    expect(Object.keys(byId)).toEqual(['R-01', 'R-02', 'R-03'])
    expect(byId['R-01'].condition.gt).toBe(900)
    expect(byId['R-02'].condition).toMatchObject({ min: 10, maxWindowSeconds: 60 })
    expect(byId['R-02'].limitMinutes).toBe(15)
    expect(byId['R-03'].condition).toMatchObject({ from: 420, to: 1200 })
    expect(byId['R-01'].action).toBe('Block')
    expect(byId['R-02'].action).toBe('Limit')
    expect(byId['R-03'].action).toBe('Alert')
  })

  it('rechaza campos desconocidos en la raíz, en la regla y en la condición', async () => {
    const a = file(); a.extra = 1
    const b = file(); b.rules[0].extra = 1
    const c = file(); c.rules[0].condition.extra = 1
    for (const bad of [a, b, c]) expect((await loadRuleset(bad)).ok).toBe(false)
  })

  it('rechaza un tipo de condición o una acción fuera de la lista cerrada', async () => {
    const a = file(); a.rules[0].condition.type = 'eval'
    const b = file(); b.rules[0].action = 'Delete'
    for (const bad of [a, b]) expect((await loadRuleset(bad)).ok).toBe(false)
  })

  it('rechaza ids de regla repetidos y entradas que no son objetos', async () => {
    const a = file(); a.rules[1].id = 'R-01'
    expect((await loadRuleset(a)).ok).toBe(false)
    expect((await loadRuleset(null)).ok).toBe(false)
    expect((await loadRuleset('x')).ok).toBe(false)
  })

  it('el hash es SHA-256 en 64 hex y no cambia al reordenar claves', async () => {
    const orig = file()
    const reordered = reverseKeys(orig)
    expect(JSON.stringify(reordered)).not.toBe(JSON.stringify(orig))
    const h1 = (await loadRuleset(orig)).ruleset.hash
    expect(h1).toMatch(/^[0-9a-f]{64}$/)
    expect((await loadRuleset(reordered)).ruleset.hash).toBe(h1)
  })

  it('el hash cambia si cambia un umbral', async () => {
    const a = file(); const b = file(); b.rules[0].condition.gt = 901
    expect((await loadRuleset(a)).ruleset.hash).not.toBe((await loadRuleset(b)).ruleset.hash)
  })
})

describe('canonicalJson', () => {
  it('ordena claves recursivamente y no deja espacios', () => {
    expect(canonicalJson({ b: [{ d: 1, c: 2 }], a: null })).toBe('{"a":null,"b":[{"c":2,"d":1}]}')
  })
})
