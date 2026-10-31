import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { buildPublicRules } from '../../scripts/gen-public-rules.mjs'
import { checkNoHiddenRules } from '../../scripts/static/site.mjs'

// Hallazgo de seguridad de la revisión adversarial (2026-10-31): las reglas public:false no deben viajar en el JS público.
const rules = JSON.parse(readFileSync('content/working-rules.json', 'utf8'))
const hidden = rules.filter((r) => !r.public)

describe('src/home/rules.public.json', () => {
  const generated = JSON.parse(readFileSync('src/home/rules.public.json', 'utf8'))
  it('está en sincronía con content/working-rules.json (node scripts/gen-public-rules.mjs)', () => {
    expect(generated).toEqual(buildPublicRules(rules))
  })
  it('solo trae las públicas y ni una palabra de las ocultas', () => {
    expect(generated.map((r) => r.id)).toEqual(rules.filter((r) => r.public).map((r) => r.id))
    const text = JSON.stringify(generated)
    for (const r of hidden) { expect(text).not.toContain(r.es); expect(text).not.toContain(r.en); expect(text).not.toContain(r.id) }
    expect(text).not.toMatch(/"public":\s*false/)
  })
  it('el código de la página no importa el archivo completo', () => {
    const src = readFileSync('src/home/rules.js', 'utf8')
    expect(src).toContain('rules.public.json')
    expect(src).not.toMatch(/working-rules\.json/)
  })
})

describe('checkNoHiddenRules (compuerta sobre dist/)', () => {
  const clean = [{ path: 'dist/assets/a.js', text: 'var x="Tests first, then code."' }]
  it('pasa sin rastro de las ocultas', () => expect(checkNoHiddenRules(clean, rules)).toEqual([]))
  it.each([
    ['el texto en español', hidden[0].es],
    ['el texto en inglés', hidden[1].en],
    ['la bandera minificada', 'x={id:"W-90",public:!1}'],
    ['el id', 'W-92'],
  ])('falla si el bundle lleva %s', (_n, bad) => {
    expect(checkNoHiddenRules([{ path: 'dist/assets/a.js', text: `var y="${bad}"` }], rules).length).toBeGreaterThan(0)
  })
})
