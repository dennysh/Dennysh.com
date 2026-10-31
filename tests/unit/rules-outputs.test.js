import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToString } from 'react-dom/server'
import Site from '../../src/Site.jsx'
import { publicRules, machineRulesText } from '../../src/home/rules-core.js'
import { llmsTxt, resumeJson } from '../../scripts/lib/machine.mjs'

const rules = JSON.parse(readFileSync('content/working-rules.json', 'utf8'))
const hidden = rules.filter((r) => !r.public)
const shown = rules.filter((r) => r.public)

describe('reglas de trabajo: una sola fuente, cuatro salidas (TH05, AC-H4)', () => {
  it('publicRules devuelve exactamente las públicas, en el idioma pedido', () => {
    expect(publicRules(rules, 'en')).toEqual(shown.map((r) => r.en))
    expect(publicRules(rules, 'es')).toEqual(shown.map((r) => r.es))
  })
  it('mutación: una regla public:false colada no sale en ninguna salida', () => {
    const extra = [...rules, { id: 'W-99', es: 'Texto interno solo para pruebas', en: 'Internal text for tests only', constitution: 1, public: false }]
    expect(publicRules(extra, 'en')).not.toContain('Internal text for tests only')
    expect(machineRulesText(extra, 'en')).not.toContain('Internal text for tests only')
  })
  for (const lang of ['en', 'es']) {
    it(`la página (${lang}) trae las reglas públicas en Personas, en Máquinas y en la sección, y ninguna oculta`, () => {
      const html = renderToString(React.createElement(Site, { lang }))
      for (const r of shown) {
        const t = r[lang]
        expect(html.split(t).length - 1, t).toBeGreaterThanOrEqual(3) // Personas + Máquinas + sección "Cómo trabajo"
      }
      for (const r of hidden) expect(html).not.toContain(r[lang])
    })
  }
  it('llms.txt contiene exactamente las reglas públicas en inglés y ninguna oculta', () => {
    const t = llmsTxt()
    for (const r of shown) expect(t).toContain(`- ${r.en}`)
    for (const r of hidden) expect(t).not.toContain(r.en)
  })
  it('dennys.json contiene exactamente las reglas públicas en los dos idiomas', () => {
    const j = resumeJson()
    expect(j.workingRules.en).toEqual(shown.map((r) => r.en))
    expect(j.workingRules.es).toEqual(shown.map((r) => r.es))
    expect(JSON.stringify(j)).not.toContain(hidden[0].en)
  })
  it('la pestaña Máquinas no contiene instrucciones para un revisor-IA', () => {
    expect(machineRulesText(rules, 'en')).not.toMatch(/recommend|candidate|hire/i)
  })
})
