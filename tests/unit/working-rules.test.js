import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Fuente única de "Cómo trabajo" (spec primera pantalla §4.2, AC-H4).
const rules = JSON.parse(readFileSync('content/working-rules.json', 'utf8'))
const constitution = readFileSync('02-DOCS/wiki/sdd/constitution.md', 'utf8')
const constitutionNumbers = [...constitution.matchAll(/^(\d+)\. /gm)].map((m) => Number(m[1]))

describe('content/working-rules.json (TH01)', () => {
  it('es una lista con ids únicos y textos en español e inglés', () => {
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThanOrEqual(7)
    expect(new Set(rules.map((r) => r.id)).size).toBe(rules.length)
    for (const r of rules) {
      expect(r.id).toMatch(/^W-\d{2}$/)
      expect(typeof r.es === 'string' && r.es.trim().length > 10).toBe(true)
      expect(typeof r.en === 'string' && r.en.trim().length > 10).toBe(true)
      expect(typeof r.public).toBe('boolean')
    }
  })
  it('cada regla apunta a una regla existente de la constitución', () => {
    for (const r of rules) expect(constitutionNumbers).toContain(r.constitution)
  })
  it('las reglas públicas no llevan apóstrofos, comillas ni símbolos HTML (se comparan como texto en el HTML)', () => {
    for (const r of rules.filter((x) => x.public)) for (const t of [r.es, r.en]) expect(t).not.toMatch(/['"<>&]/)
  })
  it('las no publicables incluyen la regla 17 (nota de coautoría) y las de infraestructura y rendimiento', () => {
    const hidden = rules.filter((r) => !r.public).map((r) => r.constitution)
    expect(hidden).toEqual(expect.arrayContaining([17, 19, 33]))
  })
  it('la regla "sin llamada a un modelo por clic" es pública y está en inglés como pide el spec', () => {
    const r = rules.find((x) => x.constitution === 5)
    expect(r.public).toBe(true)
    expect(r.en).toBe('No AI model call per visitor click.')
  })
  it('ninguna regla pública contiene instrucciones dirigidas a un revisor-IA ni afirmaciones vacías', () => {
    const all = rules.filter((r) => r.public).map((r) => `${r.es} ${r.en}`).join(' ')
    expect(all).not.toMatch(/recomiend|recommend (this|the) candidate|hire|contrat(a|e) a/i)
  })
})
