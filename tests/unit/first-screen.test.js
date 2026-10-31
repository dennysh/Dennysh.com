import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import React from 'react'
import { renderToString } from 'react-dom/server'
import Site from '../../src/Site.jsx'
import { site } from '../../src/content/site.js'
import { codePanel } from '../../src/home/code-panel.js'
import { pagePaths } from '../../src/routes.js'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const ruleset = JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8'))
const audit = JSON.parse(readFileSync('src/demo/static-example.json', 'utf8'))
const html = (lang) => renderToString(React.createElement(Site, { lang }))

describe('primera pantalla: marcado sin JavaScript (TH11, AC-H2, AC-H6)', () => {
  for (const lang of ['en', 'es']) {
    const c = site[lang]
    const out = html(lang)
    const nodeLinks = [...out.matchAll(/<a\b[^>]*data-node="(\w+)"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => ({ id: m[1], tag: m[0], label: m[2].replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, '').trim() }))

    it(`(${lang}) un solo h1 con la tesis y las dos líneas del perfil`, () => {
      expect(out.match(/<h1\b/g)).toHaveLength(1)
      expect(out).toContain(esc(c.hero.thesis))
      for (const t of c.home.tagline) expect(out).toContain(esc(t))
    })
    it(`(${lang}) seis nodos como enlaces, con nombre accesible y destino`, () => {
      expect(nodeLinks.map((n) => n.id)).toEqual(['code', 'projects', 'demo', 'journey', 'how', 'interest'])
      expect(nodeLinks.map((n) => n.label)).toEqual(c.home.nodes.map((n) => esc(n.label)))
      const href = (id) => /href="([^"]+)"/.exec(nodeLinks.find((n) => n.id === id).tag)[1]
      expect(href('projects')).toBe(pagePaths[lang].projects)
      expect(href('demo')).toBe(pagePaths[lang].demo)
      expect(href('journey')).toBe(pagePaths[lang].journey)
      for (const id of ['code', 'how', 'interest']) expect(href(id)).toBe(`#p-${id}`)
    })
    it(`(${lang}) los seis paneles están en el HTML con su texto completo`, () => {
      for (const id of ['code', 'projects', 'demo', 'journey', 'how', 'interest']) expect(out).toContain(`id="p-${id}"`)
      for (const line of codePanel(ruleset, audit, lang)) if (line.trim()) expect(out).toContain(esc(line))
      const p = c.home.panels
      for (const t of [p.projects.text, p.demo.text, p.journey.text, p.interest.thought]) expect(out).toContain(esc(t))
      expect(out).toContain('https://github.com/dennysh')
      expect(out).toContain(pagePaths[lang].projects)
    })
    it(`(${lang}) el panel Demo es el activo de inicio y no hay rotación`, () => {
      expect(/id="p-demo"[^>]*data-active="true"|data-active="true"[^>]*id="p-demo"/.test(out)).toBe(true)
      expect(out.match(/data-active="true"/g)).toHaveLength(1)
    })
    it(`(${lang}) retrato con alt, dimensiones, prioridad alta y srcset`, () => {
      const img = /<img\b[^>]*dennys-portrait[^>]*>/.exec(out)[0]
      expect(img).toContain(`alt="${esc(c.home.portraitAlt)}"`)
      expect(img).toContain('width="900"')
      expect(img).toContain('height="1210"')
      expect(img).toContain('fetchpriority="high"')
      expect(img).toMatch(/srcset="[^"]*dennys-portrait-360\.webp 360w[^"]*dennys-portrait\.webp 900w/i)
    })
    it(`(${lang}) sin aria-live, sin style en línea y con las líneas SVG ocultas`, () => {
      expect(out).not.toContain('aria-live')
      expect(out).not.toMatch(/\sstyle="/)
      expect(/<svg\b[^>]*class="lines"[^>]*aria-hidden="true"/.test(out)).toBe(true)
    })
    it(`(${lang}) resumen de 5 líneas, botón de la demo hacia la página propia y puntero #demo`, () => {
      for (const s of c.hero.summary) expect(out).toContain(esc(s))
      expect(out).toMatch(new RegExp(`<a[^>]*href="${pagePaths[lang].demo}"[^>]*>${esc(c.hero.tryDemo)}</a>`))
      expect(out).toContain('id="demo"')
    })
    it(`(${lang}) un marcador pendiente en Interés se ve como tal`, () => {
      expect(out).toContain('data-pending="P-23"')
    })
  }
})
