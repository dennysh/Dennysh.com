// Reglas de accesibilidad de la crítica Impeccable 1 (C-05, C-07, C-08, C-09, C-24): el CSS es la única fuente, así que se fija por texto.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const home = readFileSync('src/styles/home.css', 'utf8')
const site = readFileSync('src/styles/site.css', 'utf8')
const rule = (css, selector) => {
  const i = css.indexOf(`${selector} {`)
  expect(i, `falta la regla ${selector}`).toBeGreaterThan(-1)
  return css.slice(i, css.indexOf('}', i))
}

describe('contraste y tamaño del enlace de salto (C-05)', () => {
  it('en la barra del inicio conserva su par de colores (texto sobre acento) y mide 44 px', () => {
    const r = rule(home, '.bar a.skip, .bar a.skip:hover')
    expect(r).toContain('color: var(--accent-ink)')
    expect(r).toContain('min-height: 44px')
  })
  it('en las páginas interiores también mide 44 px', () => expect(rule(site, '.skip')).toContain('min-height: 44px'))
})

describe('objetivos táctiles (C-07)', () => {
  it('móvil: los enlaces de la barra del inicio miden 44 px sin crecer la barra (margen negativo)', () => {
    const mobile = home.slice(home.indexOf('@media (max-width: 760px) {'))
    const r = rule(mobile, '  .bar a')
    expect(r).toMatch(/min-width: 44px/)
    expect(r).toMatch(/min-height: 44px/)
    expect(r).toMatch(/margin-block: -8px/)
    expect(mobile).toMatch(/\.panel-links a, \.panel \.btn, \.tabs button \{ min-height: 44px; \}/)
  })
  it('páginas interiores: marca y navegación móvil a 44 px; pie, Volver y enlaces sueltos a 28 px (escritorio) o 44 px (móvil)', () => {
    expect(rule(site, '.brand')).toContain('min-height: 44px')
    expect(rule(site, 'footer.site a')).toMatch(/min-height: 28px[^}]*min-width: 28px|min-width: 28px[^}]*min-height: 28px/)
    expect(rule(site, '.back a, .card p > a, .contact-list a')).toContain('min-height: 28px')
    const mobile = site.slice(site.indexOf('@media (max-width: 600px) {'))
    expect(mobile).toMatch(/\.topbar nav a \{[^}]*min-height: 44px/)
    expect(mobile).toMatch(/footer\.site a, \.back a, \.card p > a, \.contact-list a \{ min-height: 44px; min-width: 44px; \}/)
    expect(rule(site, '.bots > summary')).toContain('min-height: 44px')
  })
})

describe('texto de 12 px como mínimo (C-08)', () => {
  it('ninguna regla fija una fuente menor de 12 px, salvo la etiqueta de los nodos en móvil (aplazada con el rediseño móvil, C-10)', () => {
    const small = []
    for (const [name, css] of [['home.css', home], ['site.css', site]]) {
      for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        const sizes = [...m[2].matchAll(/font(?:-size)?:\s*(?:[^;]*\s)?(\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1]))
        if (sizes.some((n) => n < 12)) small.push(`${name}: ${m[1].trim()}`)
      }
    }
    expect(small).toEqual(['home.css: .node-link'])
  })
  it('escritorio y móvil: tagline y "Abre una página nueva" desde 12 px', () => {
    expect(home).toMatch(/\.tagline \{ margin: 1\.2cqw 0 0; font-size: max\(12px, 1cqw\); \}/)
    expect(home).toMatch(/\.tagline \{ margin: 6px 0 0; font-size: 12px;/)
    expect(rule(home, '.panel .opens')).toContain('font: 12px/')
  })
})

describe('navegación móvil y movimiento (C-09, C-24)', () => {
  it('la barra de siete enlaces se difumina por la derecha y deja relleno para el último', () => {
    const mobile = site.slice(site.indexOf('@media (max-width: 600px) {'))
    expect(mobile).toMatch(/\.topbar nav \{[^}]*mask-image: linear-gradient\(to right, #000 calc\(100% - 28px\), transparent\)/)
    expect(mobile).toMatch(/\.topbar nav ul \{ padding-right: 32px; \}/)
  })
  it('los nodos dejan de flotar al apuntarlos o enfocarlos y no flotan en móvil', () => {
    expect(home).toMatch(/\.node-link:is\(:hover, :focus-visible\) \{ animation-play-state: paused; \}/)
    expect(home).toMatch(/\.node-link \{ animation: none; \}/)
  })
})
