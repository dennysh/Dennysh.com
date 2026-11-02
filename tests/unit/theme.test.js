import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import React from 'react'
import { renderToString } from 'react-dom/server'
import ThemeToggle from '../../src/components/ThemeToggle.jsx'

const css = readFileSync('src/styles/tokens.css', 'utf8')
const block = (re) => {
  const m = re.exec(css)
  expect(m, String(re)).not.toBeNull()
  return Object.fromEntries([...m[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((x) => [x[1], x[2].trim()]))
}
const light = block(/:root \{([^}]*)\}/)
const darkMedia = block(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{([^}]*)\}/)
const darkForced = block(/:root\[data-theme="dark"\] \{([^}]*)\}/)

// Contraste WCAG 2.x. `over` mezcla un color con alfa sobre el fondo (peor caso del brillo detrás del retrato).
const rgb = (c) => {
  if (c.startsWith('#')) return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16))
  const n = c.match(/[\d.]+/g).map(Number)
  return n.length >= 3 ? n.slice(0, 3).map((v) => v) : [0, 0, 0]
}
const alpha = (c) => (c.startsWith('#') ? 1 : (c.match(/[\d.]+/g).map(Number)[3] ?? 1))
const over = (fg, bg) => { const a = alpha(fg); const f = rgb(fg); const b = rgb(bg); return `#${f.map((v, i) => Math.round(v * a + b[i] * (1 - a)).toString(16).padStart(2, '0')).join('')}` }
const lum = (c) => rgb(c).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }).reduce((t, v, i) => t + v * [0.2126, 0.7152, 0.0722][i], 0)
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

describe('tokens de tema (C9): claro, oscuro por sistema y oscuro forzado', () => {
  it('las dos paletas oscuras (media query y data-theme) son idénticas y completas', () => {
    const dm = darkMedia
    expect(Object.keys(darkForced).sort()).toEqual(Object.keys(darkMedia).sort())
    expect(darkMedia).toEqual(darkForced)
    expect(dm['--bg']).toBeDefined()
    // todo lo que cambia entre temas existe en el tema claro (si no, el claro heredaría un valor oscuro)
    for (const k of Object.keys(darkForced)) expect(Object.keys(light), k).toContain(k)
  })
  it('el tema oscuro sí es oscuro y el claro es claro; cada uno declara su color-scheme', () => {
    expect(lum(darkForced['--bg'])).toBeLessThan(0.05)
    expect(lum(light['--bg'])).toBeGreaterThan(0.8)
    expect(/:root \{\s*color-scheme: light;/.test(css)).toBe(true)
    expect(/:root:not\(\[data-theme="light"\]\) \{\s*color-scheme: dark;/.test(css)).toBe(true)
    expect(/:root\[data-theme="dark"\] \{\s*color-scheme: dark;/.test(css)).toBe(true)
  })
  it('el media query respeta la elección explícita de claro (no pisa data-theme="light")', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\)/)
  })
  for (const [name, t] of [['claro', light], ['oscuro', darkForced]]) {
    it(`contraste AA en el tema ${name}: texto, apagado, acento, botones y estados sobre fondo y superficie`, () => {
      const pairs = [['--text', '--bg'], ['--text', '--surface'], ['--muted', '--bg'], ['--muted', '--surface'], ['--accent', '--bg'], ['--accent', '--surface'], ['--accent-ink', '--accent'], ['--ok', '--bg'], ['--warn', '--bg'], ['--danger', '--bg']]
      for (const [fg, bg] of pairs) expect(contrast(t[fg], t[bg]), `${name}: ${fg} sobre ${bg}`).toBeGreaterThanOrEqual(4.5)
    })
    it(`contraste en el tema ${name}: el texto sobre el fondo de los bloques de código y sobre --accent-soft (AA), y bordes y trazos visibles (≥ 1,2:1 y 3:1)`, () => {
      const codeBg = over(t['--code-bg'], t['--surface'])
      expect(contrast(t['--text'], codeBg), `${name}: texto sobre --code-bg`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t['--text'], over(t['--accent-soft'], t['--bg'])), `${name}: texto sobre --accent-soft`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t['--accent'], over(t['--accent-soft'], t['--bg'])), `${name}: acento sobre --accent-soft`).toBeGreaterThanOrEqual(4.5)
      expect(contrast(t['--line'], t['--bg']), `${name}: --line visible`).toBeGreaterThanOrEqual(1.2)
      expect(contrast(t['--accent-line'], t['--bg']), `${name}: trazo del anillo`).toBeGreaterThanOrEqual(3)
      expect(contrast(t['--text'], t['--bg']), `${name}: arco (26 % del texto) sobre fondo`).toBeGreaterThan(1)
    })
    // El centro del brillo (--glow-core) queda detrás de la cabeza; el texto de la portada empieza a partir del tramo medio (la frase y las etiquetas
    // están a ≥ 0,5 del radio), así que el texto principal se prueba en todo el degradado y el apagado desde el tramo medio hacia fuera.
    it(`contraste AA en el tema ${name} sobre el brillo naranja (texto principal en todo el degradado; apagado desde el tramo medio)`, () => {
      for (const glow of ['--glow-core', '--glow-mid', '--glow-edge']) expect(contrast(t['--text'], over(t[glow], t['--bg'])), `${name}: texto sobre ${glow}`).toBeGreaterThanOrEqual(4.5)
      for (const glow of ['--glow-mid', '--glow-edge']) expect(contrast(t['--muted'], over(t[glow], t['--bg'])), `${name}: apagado sobre ${glow}`).toBeGreaterThanOrEqual(4.5)
    })
  }
})

describe('estilos de nodo activo', () => {
  it('ninguna regla usa aria-pressed (los nodos son enlaces con aria-expanded)', () => {
    expect(readFileSync('src/styles/home.css', 'utf8')).not.toContain('aria-pressed="true"]')
    expect(readFileSync('src/styles/home.css', 'utf8').match(/\.node-link\[aria-expanded="true"\]/g).length).toBeGreaterThanOrEqual(3) // escritorio (2) y móvil (1)
  })
})

describe('brillo detrás del retrato (C8): el del boceto aprobado', () => {
  const home = readFileSync('src/styles/home.css', 'utf8')
  it('claro: los tres colores del boceto, y el degradado es el del boceto (rojo → ámbar → dorado) centrado en la cabeza', () => {
    expect(light['--glow-core']).toBe('rgba(229, 67, 45, .34)')
    expect(light['--glow-mid']).toBe('rgba(217, 130, 43, .22)')
    expect(light['--glow-edge']).toBe('rgba(232, 185, 61, .08)')
    expect(home).toMatch(/\.canvas::before \{[^}]*radial-gradient\(ellipse 30% 52% at 50% 44%, var\(--glow-core\) 0%, var\(--glow-mid\) 50%, var\(--glow-edge\) 80%, transparent 100%\)/)
  })
  it('en producción era la mitad de intensidad y sin rojo: ya no queda ese degradado, y el oscuro es más fuerte que el claro', () => {
    expect(home).not.toMatch(/rgb\(217 130 43 \/ \.16\)/)
    expect(alpha(darkForced['--glow-core'])).toBeGreaterThan(alpha(light['--glow-core']))
    expect(alpha(darkForced['--glow-mid'])).toBeGreaterThan(alpha(light['--glow-mid']))
  })
  it('el brillo no recibe el puntero y va detrás del contenido', () => {
    expect(home).toMatch(/\.canvas::before \{[^}]*pointer-events: none/)
    expect(home).toMatch(/\.canvas::before \{[^}]*z-index: -1/)
    expect(home).toMatch(/\.canvas \{[^}]*isolation: isolate/)
  })
})

describe('/theme-init.js (aplica la preferencia guardada antes de pintar)', () => {
  const src = readFileSync('public/theme-init.js', 'utf8')
  const run = (storage) => {
    const doc = { documentElement: { dataset: {} } }
    vm.runInNewContext(src, { document: doc, localStorage: storage })
    return doc.documentElement.dataset.theme
  }
  it('aplica "dark" y "light" guardados', () => {
    expect(run({ getItem: () => 'dark' })).toBe('dark')
    expect(run({ getItem: () => 'light' })).toBe('light')
  })
  it('sin valor, o con un valor raro, no fuerza nada (sigue al sistema)', () => {
    expect(run({ getItem: () => null })).toBeUndefined()
    expect(run({ getItem: () => 'rojo' })).toBeUndefined()
  })
  it('con el almacenamiento bloqueado no lanza ni fuerza nada', () => {
    expect(run({ getItem: () => { throw new Error('SecurityError') } })).toBeUndefined()
  })
  it('es un script externo en <head>, antes de las hojas de estilo, y la CSP no necesita unsafe-inline', () => {
    const html = readFileSync('index.html', 'utf8')
    expect(html).toMatch(/<head>[\s\S]*<script src="\/theme-init\.js"><\/script>[\s\S]*<!--head-->/)
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/)
    expect(readFileSync('public/_headers', 'utf8')).not.toContain('unsafe-inline')
  })
})

describe('interruptor de tema', () => {
  it('es un botón con aria-pressed y etiqueta accesible, con icono SVG en línea oculto a lectores', () => {
    for (const [lang, label] of [['en', 'Dark mode'], ['es', 'Modo oscuro']]) {
      const out = renderToString(React.createElement(ThemeToggle, { lang }))
      expect(out).toMatch(/^<button type="button" class="theme-toggle" aria-pressed="false" aria-label="[^"]+"/)
      expect(out).toContain(`aria-label="${label}"`)
      expect(out).toMatch(/<svg aria-hidden="true"/)
      expect(out).not.toMatch(/<img|\.png|\.svg/)
    }
  })
})
