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

    it(`(${lang}) un solo h1: la frase única, sin titular; y las dos líneas del perfil`, () => {
      expect(out.match(/<h1\b/g)).toHaveLength(1)
      expect(out).toContain(`<h1 id="hero-h">${esc(c.home.phrase)}</h1>`)
      expect(out).not.toContain(esc(c.hero.thesis))
      for (const t of c.home.tagline) expect(out).toContain(esc(t))
    })
    it(`(${lang}) cinco nodos como enlaces (sin Demo), con nombre accesible y destino`, () => {
      expect(nodeLinks.map((n) => n.id)).toEqual(['code', 'projects', 'journey', 'how', 'interest'])
      expect(nodeLinks.map((n) => n.label)).toEqual(c.home.nodes.map((n) => esc(n.label)))
      const href = (id) => /href="([^"]+)"/.exec(nodeLinks.find((n) => n.id === id).tag)[1]
      expect(href('projects')).toBe(pagePaths[lang].projects)
      expect(out).not.toMatch(/data-node="demo"|id="p-demo"|\/demo\//)
      expect(href('journey')).toBe(pagePaths[lang].journey)
      for (const id of ['code', 'how', 'interest']) expect(href(id)).toBe(pagePaths[lang][id])
      for (const n of nodeLinks) expect(n.tag).not.toMatch(/href="#/)
    })
    it(`(${lang}) los cinco paneles están en el HTML con su texto completo`, () => {
      for (const id of ['code', 'projects', 'journey', 'how', 'interest']) expect(out).toContain(`id="p-${id}"`)
      for (const line of codePanel(ruleset, audit, lang)) if (line.trim()) expect(out).toContain(esc(line))
      const p = c.home.panels
      for (const t of [p.projects.text, p.journey.text, p.interest.thought]) expect(out).toContain(esc(t))
      expect(out).toContain('https://github.com/dennysh')
      expect(out).toContain(pagePaths[lang].projects)
      expect(out).toContain(esc(p.projects.text)) // Trabajo en producción, con Criden
      expect(out).toContain(esc(p.projects.title))
      const d = /<section id="p-projects"[\s\S]*?<\/section>/.exec(out)[0]
      expect(d).toMatch(/<details class="bots"[^>]*><summary>/) // Bots para Telegram, cerrado, en el panel
      expect([...d.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1])).toEqual(c.work.items[0].bots.map((b) => esc(b.title)))
    })
    it(`(${lang}) cada panel trae su botón hacia la página del nodo (táctil: "Abrir página")`, () => {
      for (const id of ['code', 'projects', 'journey', 'how', 'interest']) {
        const panel = new RegExp(`<section id="p-${id}"[\\s\\S]*?</section>`).exec(out)[0]
        expect(panel, id).toContain(`<a class="btn btn-primary" href="${pagePaths[lang][id]}">${esc(c.home.panels[id].go)}</a>`)
      }
    })
    it(`(${lang}) en reposo no hay ninguna tarjeta activa (ni la de Demo, que ya no existe) y no hay rotación`, () => {
      expect(out.match(/data-active="true"/g)).toBeNull()
      expect(out.match(/<section id="p-/g)).toHaveLength(5)
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
    it(`(${lang}) el inicio es solo la primera pantalla: sin resumen, sin botones de demo ni de contacto, sin secciones largas, sin pie y sin correo`, () => {
      for (const id of ['demo', 'factory', 'governance', 'work', 'skills', 'journey', 'criden', 'contact', 'footer', 'summary']) expect(out).not.toContain(`id="${id}"`)
      expect(out).not.toContain('class="cta"')
      expect(out).not.toContain('<footer')
      expect(out).not.toContain(esc(c.hero.summary[0]))
      expect(out).not.toMatch(/dennys@dennysh\.com|mailto:|#contact|\/contact|\/contacto/)
      expect(out).not.toContain('Scroll')
    })
    it(`(${lang}) la barra del inicio: CV, idioma e interruptor de tema; sin Contacto`, () => {
      const bar = /<div class="bar">[\s\S]*?<\/nav><\/div>/.exec(out)[0]
      expect(bar).toContain('/cv-dennys-heras.pdf')
      expect(bar).toContain(`hrefLang="${lang === 'es' ? 'en' : 'es'}"`)
      expect(bar).toMatch(/<button[^>]*class="theme-toggle"[^>]*aria-pressed="true"[^>]*aria-label="[^"]+"/)
      expect(bar).not.toMatch(/contact/i)
    })
    it(`(${lang}) Interés trae solo el pensamiento y ningún deporte ni marcador`, () => {
      const i = c.home.panels.interest
      expect(out).toContain(esc(i.thought))
      expect(out).not.toMatch(/jiu|triat|triath|obst[aá]cul|obstacle|deporte|sport/i)
      expect(out).not.toContain('data-pending')
    })
  }
})

describe('panel de vista previa: la acción "Abrir" siempre se ve (critica-impeccable-1, C-03)', () => {
  const css = readFileSync('src/styles/home.css', 'utf8')
  it('cada panel termina en un pie "etiqueta + Abrir" que queda pegado abajo al hacer scroll', () => {
    for (const lang of ['en', 'es']) {
      const out = html(lang)
      const footers = out.match(/<div class="panel-open"><p class="opens">[^<]+<\/p><a class="btn btn-primary" href="[^"]+">[^<]+<\/a><\/div>/g) ?? []
      expect(footers).toHaveLength(5)
    }
    expect(css).toMatch(/\.panel-open \{[^}]*position: sticky;[^}]*bottom: calc\(-1 \* var\(--panel-pad-y\)\)/)
    expect(css).toMatch(/\.panel \{ --panel-pad-y: 14px;/)
    expect(css).toMatch(/\.panel \{ --panel-pad-y: 10px;/) // el pie compensa el relleno de cada tamaño: sin scroll sobrante en móvil
  })
  it('hay un solo scroll en el panel: el bloque de código no tiene el suyo propio', () => {
    expect(css).not.toMatch(/\.panel \.code \{[^}]*(max-height|overflow)/)
    expect(css).toMatch(/\.panel \{ max-height: 100%; overflow: auto; \}/)
  })
})
