import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { site, links } from '../../src/content/site.js'
import { pagePaths, legalPaths } from '../../src/routes.js'
import { CodePage, ProjectsPage, JourneyPage, HowPage, InterestPage, ContactPage } from '../../src/pages/Pages.jsx'
import { LegalPage, NotFound } from '../../src/Legal.jsx'
import Site from '../../src/Site.jsx'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
const PAGES = { code: CodePage, projects: ProjectsPage, journey: JourneyPage, how: HowPage, interest: InterestPage, contact: ContactPage }
const render = (C, lang) => renderToString(React.createElement(C, { lang }))

describe('cada nodo es una página propia (C2) con barra, Volver, un h1 y pie con contactos (C5)', () => {
  for (const lang of ['en', 'es']) {
    for (const [view, C] of Object.entries(PAGES)) {
      const out = render(C, lang)
      it(`(${lang}) ${view}: un h1, el título de su página y "Volver"`, () => {
        expect(out.match(/<h1\b/g)).toHaveLength(1)
        expect(out).toContain(esc(site[lang][`${view}Page`].title))
        expect(out).toContain(`<a href="/${lang}/">${esc(site[lang][`${view}Page`].back)}</a>`)
      })
      it(`(${lang}) ${view}: los encabezados no saltan de nivel (h1 → h2 → h3…)`, () => {
        const levels = [...out.matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]))
        levels.reduce((prev, n) => { expect(n - prev, `salto de h${prev} a h${n}`).toBeLessThanOrEqual(1); return n }, 0)
      })
      it(`(${lang}) ${view}: barra con las siete páginas, la actual marcada, interruptor de tema e idioma hacia la misma página`, () => {
        const header = /<header[\s\S]*?<\/header>/.exec(out)[0]
        for (const id of ['code', 'projects', 'demo', 'journey', 'how', 'interest', 'contact']) expect(header).toContain(`href="${pagePaths[lang][id]}"`)
        expect(header.match(/aria-current="page"/g)).toHaveLength(1)
        expect(header).toContain(`href="${pagePaths[lang][view]}" aria-current="page"`)
        expect(header).toContain('class="theme-toggle"')
        const other = lang === 'es' ? 'en' : 'es'
        expect(header).toContain(`href="${pagePaths[other][view]}" hrefLang="${other}"`)
      })
      it(`(${lang}) ${view}: pie con correo, LinkedIn, GitHub, CV, página de contacto y legales`, () => {
        const footer = /<footer[\s\S]*?<\/footer>/.exec(out)[0]
        for (const href of [links.email, links.linkedin, links.github, links.cv, pagePaths[lang].contact, legalPaths[lang].privacy, legalPaths[lang].terms]) expect(footer, href).toContain(`href="${href}"`)
        expect(footer).toContain(links.emailAddress)
      })
    }
  }
  it('las páginas legales y la 404 llevan la misma barra y el mismo pie', () => {
    for (const out of [renderToString(React.createElement(LegalPage, { lang: 'es', kind: 'privacy' })), renderToString(React.createElement(NotFound, { lang: 'en' }))]) {
      expect(out).toContain('class="theme-toggle"')
      expect(out).toContain(links.emailAddress)
    }
  })
})

describe('el contenido de cada sección pasó a la página de su nodo sin perderse (C4)', () => {
  for (const lang of ['en', 'es']) {
    const c = site[lang]
    it(`(${lang}) Cómo trabajo: reglas públicas, llms.txt visible, método, fábrica con su diagrama y evidencia`, () => {
      const out = render(HowPage, lang)
      expect(out).toContain(esc(c.governance.title)); expect(out).toContain(esc(c.governance.lead)); expect(out).toContain(esc(c.governance.method))
      expect(out).toContain(esc(c.factory.title)); expect(out).toContain(esc(c.factory.lead))
      for (const st of c.factory.steps) expect(out).toContain(esc(st.text))
      expect(out).toMatch(/<svg[^>]*class="diagram"[^>]*role="img"/)
      expect(out).toContain('# Working rules (llms.txt format)')
      expect(out).toContain(esc(c.howPage.people)); expect(out).toContain(esc(c.howPage.machines))
    })
    it(`(${lang}) Código: el panel real de la demo y las capacidades con "demostrado" y "declarado", y la nota acotada de agentes`, () => {
      const out = render(CodePage, lang)
      expect(out).toMatch(/<pre class="code code-page" tabindex="0">[^<]{200,}/) // el panel de Código: datos reales de la demo
      for (const g of c.skills.groups) { expect(out).toContain(esc(g.title)); for (const t of [...g.shown, ...g.declared]) expect(out).toContain(`<li>${esc(t)}</li>`) }
      expect(out).toContain(esc(c.skills.groups.find((g) => g.note).note))
      expect(out).toContain(esc(c.skills.shown)); expect(out).toContain(esc(c.skills.declared))
      expect(out).toContain(links.github)
      expect(out).not.toMatch(/Contacto →|Contact →/) // el enlace de contacto del panel de Código se quitó (C5)
    })
    it(`(${lang}) Proyectos: Bots para Telegram (desplegable), Super Gol Kids y Criden en producción, sin enlace inventado`, () => {
      const out = render(ProjectsPage, lang)
      const cards = [...out.matchAll(/<article class="card[^"]*">[\s\S]*?<\/article>/g)].map((m) => m[0])
      expect(cards).toHaveLength(3)
      expect(cards.map((x) => /<h2>([^<]+)<\/h2>/.exec(x)[1])).toEqual([esc(c.work.items[0].title), 'Super Gol Kids', 'Criden'])
      const criden = cards[2]
      expect(criden).toContain(`badge-production">${esc(c.work.status.production)}`)
      expect(criden).not.toContain('href=')
      expect(criden).not.toContain('data-pending') // el marcador P-22 no sale en el HTML público
      expect(criden).not.toMatch(/pr[óo]ximamente|coming soon/i)
      expect(out).toContain(esc(c.projectsPage.title))
      expect(out).not.toMatch(/contable|accounting|football manager|f[uú]tbol manager|hardlock/i)
    })
    it(`(${lang}) Proyectos: "Bots para Telegram" es un <details> cerrado con los cuatro bots en orden, accesible sin JavaScript`, () => {
      const out = render(ProjectsPage, lang)
      const d = /<details class="bots"[\s\S]*?<\/details>/.exec(out)[0]
      expect(d).not.toMatch(/<details[^>]*\sopen/)
      expect(d).toMatch(/<summary><h2>[^<]+<\/h2><span class="bots-hint">[^<]+<\/span><\/summary>/)
      const titles = [...d.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1])
      expect(titles).toEqual(c.work.items[0].bots.map((b) => esc(b.title)))
      expect(d.match(/badge-production/g)).toHaveLength(1) // solo Caja Cercana
      expect(d).not.toMatch(/badge-development|badge-undefined|href=|data-pending/)
      expect(d.match(/class="badge/g)).toHaveLength(1)
      // una línea por bot: cada bot con texto lo muestra (Caja Cercana reutiliza el suyo); el de planificación solo lleva nombre
      const bots = c.work.items[0].bots
      for (const b of bots.filter((x) => x.text)) expect(d, b.id).toContain(esc(b.text))
      expect(d.match(/class="bot-text"/g)).toHaveLength(bots.filter((x) => x.text).length)
      expect(/<li data-bot="planificacion">([\s\S]*?)<\/li>/.exec(d)[1]).toBe(`<strong>${esc(bots[3].title)}</strong>`)
    })
    it(`(${lang}) Trayectoria: las cuatro líneas de la trayectoria antes de la galería`, () => {
      const out = render(JourneyPage, lang)
      for (const l of c.journey.lines) expect(out).toContain(esc(l))
      expect(out.indexOf(esc(c.journey.lines[0]))).toBeLessThan(out.indexOf(esc(c.journeyPage.rows[0].title)))
    })
    it(`(${lang}) Interés: solo el pensamiento cerebro–IA, como idea y no como capacidad`, () => {
      const out = render(InterestPage, lang)
      expect(out).toContain(esc(c.home.panels.interest.thought))
      expect(out).not.toMatch(/jiu|triat|triath|obst[aá]cul|obstacle|deporte|sport/i)
    })
    it(`(${lang}) Contacto: la sección completa (correo, LinkedIn, GitHub, CV, rol, interés, ubicación, idiomas, disponibilidad)`, () => {
      const out = render(ContactPage, lang).replace(/<!-- -->/g, '')
      const k = c.contact
      for (const t of [k.role, k.interest, k.languages, k.cv, k.linkedin, k.github]) expect(out).toContain(esc(t))
      expect(out).toContain(`${esc(k.location)} · ${k.timezone}`)
      expect(out).toContain(`href="${links.email}"`)
      expect(out).toContain('data-pending="P-09"')
      expect(out).toContain(`${esc(k.availabilityLabel)}: <span class="pending" data-pending="P-09"`) // el aviso "por confirmar" lleva su etiqueta
      expect(out).toContain(esc(c.contactForm.leadOff)) // sin JS el formulario no está: no se promete
      expect(out).not.toContain(esc(c.contactForm.lead))
    })
  }
})

describe('el inicio es solo la primera pantalla (C4/C5)', () => {
  it('no incluye contacto, pie ni secciones largas; la única frase es el h1', () => {
    for (const lang of ['en', 'es']) {
      const out = renderToString(React.createElement(Site, { lang }))
      expect(out).not.toMatch(/<footer|<section id="(demo|factory|governance|work|skills|journey|criden|contact)"/)
      expect(out).toContain(`<h1 id="hero-h">${esc(site[lang].home.phrase)}</h1>`)
      expect(out.length).toBeLessThan(40_000) // el inicio mide una pantalla, no las ≈5800 px de antes
    }
  })
})
