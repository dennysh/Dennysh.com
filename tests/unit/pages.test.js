import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { site, links } from '../../src/content/site.js'
import { pagePaths, legalPaths } from '../../src/routes.js'
import { renderToStaticMarkup } from 'react-dom/server'
import AboutAudio from '../../src/components/AboutAudio.jsx'
import { aboutAudio } from '../../src/content/about-audio.js'
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
      it(`(${lang}) ${view}: barra con las seis páginas (sin Demo), la actual marcada, interruptor de tema e idioma hacia la misma página`, () => {
        const header = /<header[\s\S]*?<\/header>/.exec(out)[0]
        for (const id of ['code', 'projects', 'journey', 'how', 'interest', 'contact']) expect(header).toContain(`href="${pagePaths[lang][id]}"`)
        expect(header).not.toMatch(/\/demo\//)
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
  it('la privacidad menciona el botón de WhatsApp: chat en WhatsApp (Meta), sus propias condiciones y que el sitio no recibe el número', () => {
    const en = renderToString(React.createElement(LegalPage, { lang: 'en', kind: 'privacy' })).replace(/<!-- -->/g, '')
    const es = renderToString(React.createElement(LegalPage, { lang: 'es', kind: 'privacy' })).replace(/<!-- -->/g, '')
    expect(en).toMatch(/WhatsApp button opens a chat in WhatsApp \(Meta\), which processes data under its own terms\. This site does not receive your number until you write\./)
    expect(es).toMatch(/botón de WhatsApp abre un chat en WhatsApp \(Meta\), que trata los datos según sus propias condiciones\. Este sitio no recibe tu número hasta que tú escribes\./)
    expect(en + es).not.toMatch(/593960664347|960664347/)
  })
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
    it(`(${lang}) Código: el panel real (reglas y ejemplo de auditoría) y las capacidades con "demostrado" y "declarado", y la nota acotada de agentes`, () => {
      const out = render(CodePage, lang)
      expect(out).toMatch(/<pre class="code code-page" tabindex="0">[^<]{200,}/) // el panel de Código: datos reales
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
      expect(criden).toContain('<a href="https://criden.com" rel="noopener noreferrer">') // P-22 resuelto (2026-11-14): enlace real, sin nota de pendiente
      expect(criden).not.toContain('data-pending')
      expect(criden).not.toMatch(/pr[óo]ximamente|coming soon/i)
      expect(out).toContain(esc(c.projectsPage.title))
      expect(out).not.toMatch(/contable|accounting|football manager|f[uú]tbol manager|hardlock/i)
    })
    it(`(${lang}) Proyectos: "Bots para Telegram" es un <details> abierto de origen con los cuatro bots en orden, accesible sin JavaScript`, () => {
      const out = render(ProjectsPage, lang)
      const d = /<details class="bots"[\s\S]*?<\/details>/.exec(out)[0]
      expect(d).toMatch(/<details[^>]*\sopen=""/)
      expect(d).toMatch(/<summary><h2>[^<]+<\/h2><span class="bots-hint">[^<]+<\/span><\/summary>/)
      const titles = [...d.matchAll(/<strong>([^<]+)<\/strong>/g)].map((m) => m[1])
      expect(titles).toEqual(c.work.items[0].bots.map((b) => esc(b.title)))
      expect(d.match(/badge-production/g)).toHaveLength(1) // solo Caja Cercana
      expect(d).not.toMatch(/badge-development|badge-undefined|href=|data-pending/)
      expect(d.match(/class="badge/g)).toHaveLength(1)
      // una línea por bot: cada bot con texto lo muestra (Caja Cercana reutiliza el suyo); el de planificación solo lleva nombre
      const bots = c.work.items[0].bots
      for (const b of bots.filter((x) => x.text)) expect(d, b.id).toContain(esc(b.text.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? b.text)) // un renglón: la primera frase
      expect(d.match(/class="bot-text"/g)).toHaveLength(bots.filter((x) => x.text).length)
      expect(/<li data-bot="planificacion">([\s\S]*?)<\/li>/.exec(d)[1]).toBe(`<strong>${esc(bots[3].title)}</strong>`)
    })
    it(`(${lang}) Trayectoria: las cuatro líneas de la trayectoria antes de la línea de tiempo`, () => {
      const out = render(JourneyPage, lang)
      for (const l of c.journey.lines) expect(out).toContain(esc(l))
      expect(out.indexOf(esc(c.journey.lines[0]))).toBeLessThan(out.indexOf(esc(c.journeyPage.timeline[0].title)))
    })
    it(`(${lang}) Sobre mí: el pensamiento cerebro–IA, como idea y no como capacidad, al final y con su aviso`, () => {
      const out = render(InterestPage, lang)
      const lt = c.interestPage.longTerm
      expect(out).toContain(esc(lt.thought))
      expect(out).toContain(esc(lt.notice))
      expect(out.indexOf(`>${esc(lt.title)}</h2>`)).toBeGreaterThan(out.indexOf(`>${esc(c.interestPage.contact.title)}</h2>`)) // última sección
      expect(out.indexOf(esc(lt.thought))).toBe(out.lastIndexOf(esc(lt.thought)))
      expect(out.match(/no una capacidad|not a capability|not a demonstrated skill/gi) ?? []).toHaveLength(1) // el aviso va una sola vez
      expect(out).not.toMatch(/jiu|triat|triath|obst[aá]cul|obstacle|deporte|sport/i)
    })
    it(`(${lang}) Contacto: la sección completa (correo y WhatsApp juntos, LinkedIn, GitHub, CV, rol, ubicación, idiomas); sin disponibilidad, sin interés a largo plazo y sin aviso de formulario`, () => {
      const out = render(ContactPage, lang).replace(/<!-- -->/g, '')
      const k = c.contact
      for (const t of [k.role, k.languages, k.cv, k.linkedin, k.github, c.contactPage.lead]) expect(out).toContain(esc(t))
      expect(out).toContain(`${esc(k.location)} · ${k.timezone}`)
      expect(out).toContain(`href="${links.email}"`)
      expect(out).not.toMatch(/data-pending|por confirmar|to be confirmed|Cuándo puedo empezar|When I can start/)
      expect(out).not.toMatch(/cerebro|brain|largo plazo|long-term/i) // «Interés a largo plazo» vive una sola vez, al final de Sobre mí
      // correo y WhatsApp en el mismo bloque, el correo primero, y la frase ya no dice que el correo es «la forma más directa»
      const block = out.slice(out.indexOf('class="contact-direct"'), out.indexOf('<h2', out.indexOf('class="contact-direct"')))
      expect(block.indexOf('href="mailto:')).toBeGreaterThan(-1)
      expect(block.indexOf('href="mailto:')).toBeLessThan(block.indexOf('wa.me'))
      expect(block).toContain(esc(c.contactPage.lead))
      // WhatsApp junto al correo (encargo 2026-11-14): pestaña nueva, noopener noreferrer, sin número a la vista
      expect(out).toContain('<a class="btn btn-secondary" href="https://wa.me/593960664347" target="_blank" rel="noopener noreferrer"')
      expect(out.match(/href="mailto:/g)).toHaveLength(2) // la barra de pie y el correo de la página; el botón de correo sigue siendo único en el cuerpo (C-01)
      expect(out).toContain(`aria-label="${esc(c.contactPage.buttons.whatsappLabel)}"`)
      expect(out.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).not.toMatch(/593960664347|960664347/)
      expect(c.contactPage.buttons).toEqual({ email: c.interestPage.contact.email, whatsapp: c.interestPage.contact.whatsapp, whatsappLabel: c.interestPage.contact.whatsappLabel })
      expect(out).not.toContain(esc(c.contactForm.lead)) // sin JS el formulario no está: no se promete, y tampoco se avisa de que falta
      expect(out).not.toMatch(/no está disponible|not available/i)
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

describe('Sobre mí (encargo 2026-11-14): presentación, audio opcional, qué hago, ejemplos del bot, Criden y contacto', () => {
  const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')
  for (const lang of ['en', 'es']) {
    const c = site[lang]
    const p = c.interestPage
    const out = render(InterestPage, lang)
    const at = (t) => out.indexOf(esc(t))
    it(`(${lang}) el orden: presentación, qué hago, ejemplos del bot, Criden, contacto, interés a largo plazo`, () => {
      const h2 = (t) => out.indexOf(`>${esc(t)}</h2>`)
      const order = [at(p.intro), h2(p.whatTitle), h2(p.botExample.title), at(p.criden.text), h2(p.contact.title), h2(p.longTerm.title)]
      expect(order.every((i) => i >= 0)).toBe(true)
      expect([...order].sort((a, b) => a - b)).toEqual(order)
    })
    it(`(${lang}) la presentación es el texto aprobado y siempre está visible`, () => {
      expect(p.intro).toContain(lang === 'es' ? 'Hola, soy Dennys Heras. Vengo de más de 7 años en redes de fibra óptica' : 'Hi, I\'m Dennys Heras. I come from more than 7 years in fiber-optic networks')
      expect(out).toContain(`<p class="lead">${esc(p.intro)}</p>`)
      expect(c.home.panels.interest.text).toBe(lang === 'es' ? 'Quién soy, a qué me dedico y cómo contactarme.' : 'Who I am, what I do and how to reach me.') // la tarjeta no repite la presentación
      expect(c.home.panels.interest.text).not.toContain(p.intro.slice(0, 30))
    })
    it(`(${lang}) con la lista de audio vacía no hay reproductor, ni rótulo, ni hueco`, () => {
      expect(aboutAudio).toEqual([])
      expect(out).not.toMatch(/<audio|about-audio/)
      expect(out).not.toContain(esc(p.audio.aiNote))
    })
    it(`(${lang}) con un archivo: reproductor sin reproducción automática, rótulo de voz con IA y texto accesible`, () => {
      const html = renderToStaticMarkup(React.createElement(AboutAudio, { lang, ui: p.audio, files: [{ src: '/audio/prueba.mp3', type: 'audio/mpeg', title: { es: 'Presentación', en: 'Introduction' } }, { src: '/audio/solo-otro-idioma.mp3', type: 'audio/mpeg', lang: lang === 'es' ? 'en' : 'es' }] }))
      expect(html).toMatch(/<audio controls="" preload="none"/)
      expect(html).not.toMatch(/autoplay|autoPlay|loop/i)
      expect(html).toContain(esc(p.audio.aiNote))
      expect(html).toContain('aria-describedby="about-audio-ai"')
      expect(html).toContain('/audio/prueba.mp3')
      expect(html).not.toContain('solo-otro-idioma')
      expect(renderToStaticMarkup(React.createElement(AboutAudio, { lang, ui: p.audio, files: [{ src: '/audio/x.mp3', type: 'audio/mpeg', lang: lang === 'es' ? 'en' : 'es' }] }))).toBe('')
    })
    it(`(${lang}) «Qué hago»: los cinco puntos, una frase cada uno; agentes marcados como declarados y prototipo; solo ejemplos que ya constan`, () => {
      expect(p.what.map((w) => w.id)).toEqual(['bots', 'automation', 'web', 'agents', 'custom'])
      for (const w of p.what) expect(out).toContain(esc(w.text))
      expect(p.what.find((w) => w.id === 'agents').text).toMatch(lang === 'es' ? /declaro.*prototipo.*nunca estuvo en producción/s : /declare.*prototype.*never in production/s)
      expect(p.what.find((w) => w.id === 'web').text).toContain('Super Gol Kids')
    })
    it(`(${lang}) ejemplos del bot: dos imágenes con alt, ancho y alto fijos, carga diferida y el rótulo de muestra, sin enlace al bot`, () => {
      const imgs = [...out.matchAll(/<img\b[^>]*>/g)].map((m) => m[0])
      expect(imgs).toHaveLength(2)
      for (const im of imgs) {
        expect(im).toMatch(/width="360"/); expect(im).toMatch(/height="640"/); expect(im).toMatch(/loading="lazy"/)
        expect(im).toMatch(/alt="[^"]{60,}"/)
      }
      expect(imgs.map((i) => /src="([^"]+)"/.exec(i)[1])).toEqual(['/images/bot-registro-cajas-chat.svg', '/images/bot-reportes-chat.svg'])
      expect(p.botExample.note).toBe(lang === 'es' ? 'Ejemplo con datos de muestra: los bots reales son privados de la empresa.' : 'Example with sample data: the real bots are private to the company.')
      expect(out.split(esc(p.botExample.note)).length - 1).toBe(1) // el rótulo de muestra va una sola vez para el conjunto
      expect(p.botExample.images.map((i) => i.title)).toEqual(lang === 'es' ? ['Registro de cajas (ficticio)', 'Reportes de incidencias (ficticio)'] : ['Box registration (fictional)', 'Incident reports (fictional)'])
      for (const im of p.botExample.images) expect(out).toContain(`<figcaption>${esc(im.title)}</figcaption>`)
      expect(out).not.toContain('about-mockup-frame') // sin marco desplazable
      expect(out).not.toMatch(/t\.me|telegram\.me|github\.com\/dennysh\/(bot|Bot)/)
      expect(visible(out)).not.toMatch(/Fibratelecom|MS@Net|Afiatic|Telydata/)
    })
    it(`(${lang}) Criden con enlace externo y contacto con correo y WhatsApp (pestaña nueva, noopener noreferrer, sin mostrar el número)`, () => {
      expect(out).toContain(`<a href="https://criden.com" rel="noopener noreferrer">${esc(p.criden.link)}</a>`)
      expect(out).toContain(`<a class="btn btn-primary" href="mailto:dennys@dennysh.com">${esc(p.contact.email)}</a>`)
      expect(out).toMatch(new RegExp(`<a class="btn btn-secondary" href="https://wa\\.me/593960664347" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.contact.whatsappLabel).replace(/[()]/g, '\\$&')}">WhatsApp`))
      expect(visible(out)).not.toMatch(/593960664347|960664347|\+?593 ?9/)
    })
  }
})
