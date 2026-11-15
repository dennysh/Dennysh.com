import { describe, it, expect } from 'vitest'
import React from 'react'
import { readFileSync, existsSync } from 'node:fs'
import { renderToString } from 'react-dom/server'
import { JourneyPage, ProjectsPage } from '../../src/pages/Pages.jsx'
import Timeline, { stepIndex } from '../../src/components/Timeline.jsx'
import { site } from '../../src/content/site.js'
import { journeyPhotos } from '../../src/content/journey-photos.js'

// Trayectoria como línea de tiempo (trabajo B). Sin fotos reales la página se ve completa, sin huecos ni marcos vacíos; con fotos, cada entrada tiene miniatura.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
const PHOTO = (n, alt = `Foto ${n}`) => ({ src: `/images/trayectoria/f${n}.webp`, thumb: `/images/trayectoria/f${n}-t.webp`, alt, width: 1600, height: 1067 })

describe('Trayectoria sin fotos reales', () => {
  for (const lang of ['en', 'es']) {
    const html = renderToString(React.createElement(JourneyPage, { lang }))
    const j = site[lang].journeyPage
    it(`(${lang}) muestra cada entrada: fechas, cargo · empresa, lo destacado y las etiquetas, en una lista ordenada`, () => {
      expect(html).toContain('<ol class="timeline"')
      expect((html.match(/<li class="tl-item"/g) ?? [])).toHaveLength(j.timeline.length)
      for (const e of j.timeline) {
        expect(html).toContain(esc(e.when))
        expect(html).toContain(esc(e.title))
        if (e.org) expect(html).toContain(esc(e.org))
        for (const b of e.bullets) expect(html).toContain(esc(b))
        for (const t of e.tags) expect(html).toContain(`<li>${esc(t)}</li>`)
      }
    })
    it(`(${lang}) los retos van dentro de su entrada, después de las viñetas y antes de las etiquetas, con rótulo y título como texto`, () => {
      const items = html.split('<li class="tl-item"').slice(1)
      const counts = items.map((x) => (x.match(/class="tl-challenge"/g) ?? []).length)
      expect(counts).toEqual(j.timeline.map((e) => (e.challenges ?? []).length))
      expect(counts).toEqual([0, 0, 0, 0, 2, 1, 1]) // Fibratelecom (3.ª) y el resto, sin reto
      expect((html.match(/<p class="tl-ch-label">/g) ?? [])).toHaveLength(4)
      items.forEach((x, i) => {
        if (!counts[i]) { expect(x).not.toContain('tl-challenges'); return }
        const e = j.timeline[i]
        const lastBullet = x.lastIndexOf(esc(e.bullets[e.bullets.length - 1]))
        const firstCh = x.indexOf('class="tl-challenges"')
        const tags = x.indexOf('class="tags tl-tags"')
        expect(lastBullet).toBeGreaterThan(-1); expect(lastBullet).toBeLessThan(firstCh); expect(firstCh).toBeLessThan(tags)
        for (const c of e.challenges) {
          expect(x).toContain(`<p class="tl-ch-label">${esc(j.ui.challenge)}</p><h3 class="tl-ch-title">${esc(c.title)}</h3><p class="tl-ch-text">${esc(c.text)}</p>`)
        }
      })
    })
    it(`(${lang}) sin miniaturas, ni diálogo, ni imágenes, ni huecos`, () => {
      for (const cls of ['tl-thumb', 'tl-dialog', 'tl-more', 'data-photo']) expect(html).not.toContain(cls)
      expect(html).not.toContain('<img')
      expect(html).not.toContain('<dialog')
    })
    it(`(${lang}) los empleos no llevan etiqueta de tipo; los proyectos y la formación sí; "Presente" solo donde corresponde`, () => {
      const items = html.split('<li class="tl-item"').slice(1)
      expect(items).toHaveLength(7)
      const kinds = items.map((x) => /data-kind="(\w+)"/.exec(x)[1])
      expect(kinds).toEqual(['project', 'project', 'study', 'job', 'job', 'job', 'job'])
      items.forEach((x, i) => { expect(x.includes('tl-kind'), kinds[i]).toBe(kinds[i] !== 'job' || x.includes('tl-status')) })
      const cur = items.map((x) => x.includes('data-current="true"'))
      expect(cur).toEqual([false, false, true, true, false, false, false])
    })
    it(`(${lang}) no deja marcadores, pistas ni "TU FOTO" a la vista`, () => {
      const t = visible(html)
      expect(t).not.toMatch(/\bP-\d+\b|pending|por confirmar|to be confirmed|\[[^\]]*·[^\]]*\]/i)
      expect(t).not.toMatch(/TU FOTO|EMPRESA/)
      expect(html).not.toContain('data-pending')
    })
  }
  it('Proyectos tampoco muestra marcadores', () => {
    for (const lang of ['en', 'es']) expect(visible(renderToString(React.createElement(ProjectsPage, { lang }))).match(/\bP-\d+\b/g)).toBeNull()
  })
})

describe('Timeline con fotos', () => {
  const ui = site.es.journeyPage.ui
  const entries = [
    { id: 'a', kind: 'job', when: '2024', title: 'Con tres fotos', org: 'Empresa A', bullets: ['Uno'], tags: ['X'], photos: [PHOTO(1, 'Primera'), PHOTO(2), PHOTO(3)] },
    { id: 'b', kind: 'job', when: '2023', title: 'Sin fotos', bullets: ['Dos'], tags: [], photos: [] },
    { id: 'c', kind: 'project', when: '2022', title: 'Con una foto', bullets: ['Tres'], tags: [], photos: [PHOTO(4)] },
  ]
  const html = renderToString(React.createElement(Timeline, { entries, ui }))
  const itemOf = (title) => html.split('<li class="tl-item"').slice(1).find((x) => x.includes(title))
  it('una entrada con fotos lleva una miniatura (la primera) con nombre accesible, enlace a la foto y "+N" si hay más', () => {
    const a = itemOf('Con tres fotos')
    expect(a).toContain('data-photo="true"')
    expect((a.match(/class="tl-thumb"/g) ?? [])).toHaveLength(1)
    expect(a).toContain('href="/images/trayectoria/f1.webp"')
    expect(a).toContain('src="/images/trayectoria/f1-t.webp"')
    expect(a).toContain('loading="lazy"')
    expect(a).toContain('aria-label="Ampliar foto: Primera (Foto 1 de 3)"')
    expect(a).toContain('>+2<')
    expect(a).not.toContain('role="button"') // sin JavaScript es un enlace; el rol se añade al hidratar
  })
  it('con una sola foto no hay "+N"; con miniatura declarada la imagen no fija un tamaño que no es el suyo', () => {
    const c = itemOf('Con una foto')
    expect(c).not.toContain('tl-more')
    expect(c).toContain('aria-label="Ampliar foto: Foto 4"')
  })
  it('una entrada sin fotos no deja hueco ni marco', () => {
    const b = itemOf('Sin fotos')
    expect(b).not.toContain('tl-thumb')
    expect(b).not.toContain('data-photo')
    expect(b).not.toContain('<img')
  })
  it('hay un único diálogo modal, vacío hasta que se abre', () => {
    expect((html.match(/<dialog/g) ?? [])).toHaveLength(1)
    expect(html).toContain('class="tl-dialog"')
    expect(html).not.toContain('class="tl-figure"')
  })
  it('una foto sin ruta (hueco) no cuenta como foto', () => {
    const hole = renderToString(React.createElement(Timeline, { entries: [{ ...entries[0], photos: [{}, null] }], ui }))
    expect(hole).not.toContain('tl-thumb')
    expect(hole).not.toContain('<dialog')
  })
  it('stepIndex: tope en los extremos, sin dar la vuelta', () => {
    expect(stepIndex(0, -1, 3)).toBe(0)
    expect(stepIndex(0, 1, 3)).toBe(1)
    expect(stepIndex(2, 1, 3)).toBe(2)
    expect(stepIndex(1, -1, 3)).toBe(0)
    expect(stepIndex(0, 1, 0)).toBe(0)
  })
})

describe('la compilación normal nunca lleva fotos de relleno', () => {
  it('en el modo de las pruebas unitarias las entradas no tienen fotos', () => {
    for (const lang of ['en', 'es']) for (const e of site[lang].journeyPage.timeline) expect(e.photos).toEqual([])
  })
  it('el hook de fotos de relleno depende solo del modo e2e (no de una variable VITE_ pública)', () => {
    const src = readFileSync('src/content/site.js', 'utf8')
    expect(src).toContain("import.meta.env?.MODE === 'e2e'")
    expect(src).not.toMatch(/VITE_\w*PHOTO/i)
  })
})

describe('fotos declaradas en src/content/journey-photos.js (hoy ninguna: Dennys las entrega después)', () => {
  const ids = site.es.journeyPage.timeline.map((e) => e.id)
  const entries = Object.entries(journeyPhotos)
  it('solo declara ids que existen en la línea de tiempo', () => {
    for (const [id] of entries) expect(ids, id).toContain(id)
  })
  it('cada foto declarada tiene ruta WebP existente, tamaño fijo y texto alternativo en español e inglés', () => {
    for (const [id, list] of entries) for (const p of list) {
      expect(p.src, id).toMatch(/^\/images\/trayectoria\/[\w.-]+\.webp$/)
      expect(existsSync(`public${p.src}`), `${id}: falta public${p.src}`).toBe(true)
      if (p.thumb) { expect(p.thumb).toMatch(/^\/images\/trayectoria\/[\w.-]+\.webp$/); expect(existsSync(`public${p.thumb}`), `${id}: falta public${p.thumb}`).toBe(true) }
      expect(p.width).toBeGreaterThan(0); expect(p.height).toBeGreaterThan(0)
      for (const l of ['es', 'en']) expect(p.alt?.[l]?.trim().length, `${id}: alt ${l}`).toBeGreaterThan(5)
    }
  })
})
