import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'

// Generador sembrado (mulberry32): la prueba es reproducible.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = (r, xs) => xs[Math.floor(r() * xs.length)]
const PROTECTED = {
  name: ['Ana', 'Wei', 'Olu', 'Søren', 'María José', ''],
  country: ['EC', 'US', 'IN', 'NG', 'JP', 'XX'],
  language: ['es', 'en', 'zh', 'ar'],
  device: ['mobile', 'desktop', 'tablet', 'unknown'],
  gender: ['f', 'm', 'x', 'unspecified'],
}

function behaviour(r) {
  return {
    failedAttempts: Math.floor(r() * 20),
    windowSeconds: Math.floor(r() * 120),
    impliedSpeedKmh: Math.floor(r() * 2000),
    bulkExport: r() < 0.5,
    localMinutes: Math.floor(r() * 1440),
  }
}

// Devuelve cuántas veces cambia el resultado al variar solo atributos protegidos.
function violations(evalFn, ruleset, runs = 500) {
  const r = rng(20261030)
  let bad = 0
  for (let i = 0; i < runs; i++) {
    const base = behaviour(r)
    const reference = JSON.stringify(evalFn(ruleset, base))
    for (let k = 0; k < 5; k++) {
      const withProtected = { ...base }
      for (const [field, values] of Object.entries(PROTECTED)) withProtected[field] = pick(r, values)
      if (JSON.stringify(evalFn(ruleset, withProtected)) !== reference) bad++
    }
  }
  return bad
}

let ruleset
beforeAll(async () => {
  ruleset = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})

describe('equidad (AC-14)', () => {
  it('cambiar nombre, país, idioma, dispositivo y género no cambia el resultado', () => {
    expect(violations(evaluate, ruleset)).toBe(0)
  })

  it('la prueba detecta un mutante que lee el país (puede fallar)', () => {
    const mutant = (rs, s) => (s.country === 'XX' ? { decision: 'Allow', matched: [] } : evaluate(rs, s))
    expect(violations(mutant, ruleset)).toBeGreaterThan(0)
  })

  it('la prueba detecta un mutante que lee el idioma o el dispositivo', () => {
    const lang = (rs, s) => (s.language === 'ar' ? { decision: 'Block', matched: [] } : evaluate(rs, s))
    const dev = (rs, s) => (s.device === 'mobile' ? { decision: 'Allow', matched: [] } : evaluate(rs, s))
    expect(violations(lang, ruleset)).toBeGreaterThan(0)
    expect(violations(dev, ruleset)).toBeGreaterThan(0)
  })
})
