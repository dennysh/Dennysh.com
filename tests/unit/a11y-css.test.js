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
    // La barra del móvil flota sobre el hero (posición absoluta): no hay alto que preservar, así que ya no lleva margen negativo.
    const r = rule(mobile, '  .bar a, .bar .theme-toggle')
    expect(r).toMatch(/min-width: 44px/)
    expect(r).toMatch(/min-height: 44px/)
    expect(rule(mobile, '  .m-card a')).toMatch(/min-height: 44px/) // los enlaces de las tarjetas de «Explorar»
  })
  it('páginas interiores: marca y navegación móvil a 44 px; pie, Volver y enlaces sueltos a 28 px (escritorio) o 44 px (móvil)', () => {
    expect(rule(site, '.brand')).toContain('min-height: 44px')
    expect(rule(site, 'footer.site a')).toMatch(/min-height: 28px[^}]*min-width: 28px|min-width: 28px[^}]*min-height: 28px/)
    expect(rule(site, '.back a, .card p > a, .contact-list a')).toContain('min-height: 28px')
    const bar = site.slice(site.indexOf('@media (max-width: 760px) {'))
    expect(bar).toMatch(/\.topbar nav a \{[^}]*min-height: 44px/)
    expect(bar).not.toMatch(/overflow-x: auto|mask-image/) // sin desplazamiento lateral ni difuminado: nada queda cortado
    const mobile = site.slice(site.indexOf('@media (max-width: 600px) {'))
    expect(mobile).toMatch(/footer\.site a, \.back a, \.card p > a, \.contact-list a \{ min-height: 44px; min-width: 44px; \}/)
    expect(rule(site, '.bots > summary')).toContain('min-height: 44px')
  })
})

describe('texto de 12 px como mínimo (C-08)', () => {
  it('ninguna regla fija una fuente menor de 12 px (la etiqueta de nodos en móvil desapareció con la landing vertical)', () => {
    const small = []
    for (const [name, css] of [['home.css', home], ['site.css', site]]) {
      for (const m of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
        const sizes = [...m[2].matchAll(/font(?:-size)?:\s*(?:[^;]*\s)?(\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1]))
        if (sizes.some((n) => n < 12)) small.push(`${name}: ${m[1].trim()}`)
      }
    }
    expect(small).toEqual([])
  })
  it('escritorio y móvil: tagline y "Abre una página nueva" desde 12 px', () => {
    expect(home).toMatch(/\.tagline \{ margin: 1\.2cqw 0 0; font-size: max\(12px, 1cqw\); \}/)
    expect(home).toMatch(/\.tagline \{ margin: 10px 0 0; font-size: 12px;/)
    expect(rule(home, '.panel .opens')).toContain('font: 12px/')
  })
})

describe('navegación móvil y movimiento (C-09, C-24)', () => {
  it('la barra de seis enlaces va en rejilla de tres columnas en una segunda fila, sin desplazamiento ni difuminado, y marca la página actual', () => {
    const bar = site.slice(site.indexOf('@media (max-width: 760px) {'), site.indexOf('@media (max-width: 600px) {'))
    expect(bar).toMatch(/\.topbar nav \{[^}]*order: 3; width: 100%/)
    expect(bar).toMatch(/\.topbar nav ul \{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
    expect(bar).toMatch(/\.topbar nav a\[aria-current="page"\]/)
    expect(bar).not.toMatch(/overflow-x|mask-image|nowrap/)
  })
  it('los nodos dejan de flotar al apuntarlos o enfocarlos; en móvil no hay nodos flotantes (están ocultos)', () => {
    expect(home).toMatch(/\.node-link:is\(:hover, :focus-visible\) \{ animation-play-state: paused; \}/)
    expect(rule(home.slice(home.indexOf('@media (max-width: 760px) {')), '  .lines, .net, .nodes, .panels')).toContain('display: none')
  })
})

describe('identidad de las páginas interiores y arreglos baratos (C-04, C-11, C-14, C-17, C-19, C-20, C-26)', () => {
  it('la marca de las interiores usa la misma voz que el inicio: mono, mayúsculas y espaciada', () => {
    const r = rule(site, '.brand')
    expect(r).toMatch(/font: 700 13px\/1 var\(--font-mono\)/)
    expect(r).toContain('text-transform: uppercase')
    expect(r).toContain('letter-spacing: .2em')
  })
  it('el brillo cálido va por debajo del texto y no recibe el puntero', () => {
    const r = rule(site, '.page::before')
    expect(r).toContain('z-index: -1')
    expect(r).toContain('pointer-events: none')
    expect(r).toMatch(/var\(--glow-core\)/)
    expect(rule(site, '.page')).toContain('isolation: isolate')
  })
  it('.pending ya no parece un error (sin borde discontinuo ni fondo rojizo) y la tarjeta de reglas no es una pestaña lateral', () => {
    const r = rule(site, '.pending')
    expect(r).not.toMatch(/dashed|background/)
    expect(rule(site, '.rules li')).not.toContain('border-left')
  })
  it('párrafos sin palabra suelta, medida de lectura y diagrama oculto en móvil', () => {
    expect(site).toMatch(/\.page :is\(p, li\) \{ text-wrap: pretty; \}/)
    expect(site).toMatch(/\.page \.lead, \.page \.method \{ max-width: 68ch; \}/)
    expect(site.slice(site.indexOf('@media (max-width: 600px) {'))).toMatch(/\.diagram \{ display: none; \}/)
  })
  it('la fábrica de agentes reparte sus cinco pasos 3 + 2 en pantallas anchas', () => {
    expect(site).toMatch(/\.steps:has\(> li:nth-child\(5\):last-child\) \{ grid-template-columns: repeat\(6, 1fr\); \}/)
    expect(site).toMatch(/> li:nth-child\(n\+4\) \{ grid-column: span 3; \}/)
  })
})

describe('el anillo y las líneas van detrás del retrato en escritorio', () => {
  it('.lines tiene z-index -1 en el bloque de escritorio; barra (6) y nodos (7) no cambian y en móvil sigue oculto', () => {
    const desk = home.slice(home.indexOf('@media (min-width: 761px)'), home.indexOf('@media (max-width: 760px)'))
    expect(rule(desk, '.lines')).toContain('z-index: -1')
    expect(rule(desk, '.nodes')).toContain('z-index: 7')
    expect(rule(home, '.bar')).toContain('z-index: 6')
    expect(rule(home, '.canvas::before')).toContain('z-index: -1')
    expect(rule(home.slice(home.indexOf('@media (max-width: 760px)')), '.lines, .net, .nodes, .panels')).toContain('display: none')
    // la red de fondo: detrás de todo salvo el brillo, y sin recibir el puntero
    expect(rule(desk, '.net')).toContain('z-index: -1')
    expect(rule(desk, '.net')).toContain('pointer-events: none')
  })
})
