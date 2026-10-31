import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { JourneyPage, ProjectsPage } from '../../src/pages/Pages.jsx'
import RowGallery from '../../src/components/RowGallery.jsx'
import { site } from '../../src/content/site.js'

// P-29 (Dennys, 2026-10-31): sin fotos reales no hay galería ni marcadores visibles; el componente queda listo para activarse.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
const PHOTO = (n) => ({ src: `/images/gallery/f${n}.webp`, alt: '', width: 1200, height: 1500 })

describe('Trayectoria sin fotos reales', () => {
  for (const lang of ['en', 'es']) {
    const html = renderToString(React.createElement(JourneyPage, { lang }))
    it(`(${lang}) muestra el texto de cada fila y nada de galería`, () => {
      for (const r of site[lang].journeyPage.rows) { expect(html).toContain(esc(r.title)); expect(html).toContain(esc(r.text)) }
      for (const cls of ['g-btn', 'g-strip', 'g-float', 'g-hint', 'g-inline', 'g-ph']) expect(html).not.toContain(cls)
      expect(html).not.toContain('<img')
    })
    it(`(${lang}) no deja marcadores, pistas ni "TU FOTO" a la vista`, () => {
      const t = visible(html)
      expect(t).not.toMatch(/\bP-\d+\b|pending|por confirmar|to be confirmed|\[[^\]]*·[^\]]*\]/i)
      expect(t).not.toMatch(/TU FOTO|EMPRESA/) // los marcadores van en mayúsculas; la palabra "empresa" aparece en textos reales
      expect(html).not.toContain('data-pending')
    })
  }
  it('Proyectos tampoco muestra marcadores', () => {
    for (const lang of ['en', 'es']) expect(visible(renderToString(React.createElement(ProjectsPage, { lang }))).match(/\bP-\d+\b/g)).toBeNull()
  })
})

describe('RowGallery lista para activarse', () => {
  const rows = [
    { id: 'a', title: 'Con fotos', meta: ['2025'], text: 'Fila con tres fotos reales.', photos: [PHOTO(1), PHOTO(2), PHOTO(3)] },
    { id: 'b', title: 'Sin fotos', meta: ['Ahora'], text: 'Fila sin fotos.', photos: [] },
  ]
  const ui = site.es.journeyPage.gallery
  const html = renderToString(React.createElement(RowGallery, { rows, ui, lang: 'es' }))
  it('una fila con fotos reales es un botón con su franja de N tramos', () => {
    expect((html.match(/class="g-btn"/g) ?? []).length).toBe(1)
    expect((html.match(/<span[^>]*><\/span>/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(html).toContain(ui.hint)
  })
  it('una fila sin fotos sigue mostrando su texto, sin botón ni franja', () => {
    expect(html).toContain('Fila sin fotos.')
    expect(html).toContain('Sin fotos')
    const rowB = html.split('<li').find((x) => x.includes('Sin fotos'))
    expect(rowB).not.toContain('g-btn')
    expect(rowB).not.toContain('g-strip')
  })
  it('sin ninguna foto, no hay pista ni contenedor flotante', () => {
    const none = renderToString(React.createElement(RowGallery, { rows: rows.map((r) => ({ ...r, photos: [] })), ui, lang: 'es' }))
    expect(none).not.toContain('g-hint')
    expect(none).not.toContain('g-float')
    expect(none).toContain('Fila con tres fotos reales.')
  })
  it('una foto sin ruta (hueco) no cuenta como foto', () => {
    const hole = renderToString(React.createElement(RowGallery, { rows: [{ ...rows[0], photos: [{}, null] }], ui, lang: 'es' }))
    expect(hole).not.toContain('g-btn')
  })
})

describe('la compilación normal nunca lleva fotos de relleno', () => {
  it('en el modo de las pruebas unitarias las filas no tienen fotos', () => {
    for (const lang of ['en', 'es']) for (const r of site[lang].journeyPage.rows) expect(r.photos).toEqual([])
  })
  it('el hook de fotos de relleno depende solo del modo e2e (no de una variable VITE_ pública)', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/content/site.js', 'utf8')
    expect(src).toContain("import.meta.env?.MODE === 'e2e'")
    expect(src).not.toMatch(/VITE_E2E/)
  })
})
