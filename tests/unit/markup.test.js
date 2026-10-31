import { describe, it, expect } from 'vitest'
import { checkMarkup, checkNodeIcons } from '../../scripts/static/site.mjs'

const icon = '<svg class="node-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1"/></svg>'
const home = `<html><body>${icon.repeat(6)}<script type="application/ld+json">{"a":1}</script><script type="module" src="/assets/a.js"></script></body></html>`

describe('marcado prerenderizado y la CSP (TH09, AC-H7)', () => {
  it('pasa con un HTML limpio', () => expect(checkMarkup([{ path: 'en/index.html', text: home }])).toEqual([]))
  it.each([
    ['atributo style', '<div style="left:1px">x</div>'],
    ['atributo style con comillas simples', "<div style='left:1px'>x</div>"],
    ['script en línea', '<script>alert(1)</script>'],
    ['Google Fonts', '<link href="https://fonts.googleapis.com/css2?family=X" rel="stylesheet">'],
    ['Material Symbols', '<link href="https://fonts.gstatic.com/s/materialsymbols/x.woff2">'],
  ])('falla con %s', (_n, bad) => {
    expect(checkMarkup([{ path: 'en/index.html', text: home.replace('</body>', `${bad}</body>`) }]).length).toBeGreaterThan(0)
  })
  it('un style dentro de un script JSON-LD no cuenta como atributo', () => {
    const ld = '<script type="application/ld+json">{"x":" style=\\"a\\" "}</script>'
    expect(checkMarkup([{ path: 'en/index.html', text: home.replace('</body>', `${ld}</body>`) }])).toEqual([])
  })
})

describe('iconos de los nodos (TH09)', () => {
  it('seis iconos SVG en línea, aria-hidden y trazo 1,5', () => expect(checkNodeIcons('en/index.html', home)).toEqual([]))
  it('falla con cinco', () => expect(checkNodeIcons('en/index.html', `<html>${icon.repeat(5)}</html>`).length).toBeGreaterThan(0))
  it('falla si un icono no está oculto a lectores de pantalla', () => {
    expect(checkNodeIcons('en/index.html', `<html>${icon.repeat(5)}${icon.replace(' aria-hidden="true"', '')}</html>`).length).toBeGreaterThan(0)
  })
  it('falla si el trazo no es 1,5', () => {
    expect(checkNodeIcons('en/index.html', `<html>${icon.repeat(5)}${icon.replace('1.5', '3')}</html>`).length).toBeGreaterThan(0)
  })
})
