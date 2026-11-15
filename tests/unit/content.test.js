import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { FIELDS, INTENTS, QUESTIONS } from '../../core/contact.js'
import { site, collectPending, isPending, pending, AUTHORIZED_PENDING, unauthorized, links } from '../../src/content/site.js'

const walk = (n, out = []) => {
  if (typeof n === 'string') out.push(n)
  else if (Array.isArray(n)) n.forEach((v) => walk(v, out))
  else if (n && typeof n === 'object' && !isPending(n)) Object.values(n).forEach((v) => walk(v, out))
  return out
}
// Interés (panel y página) es el único lugar con el pensamiento cerebro–IA; Contacto lo menciona como interés.
const nonInterest = (c) => { const { interestPage, ...rest } = c; return { ...rest, home: { ...rest.home, panels: { ...rest.home.panels, interest: undefined } } } }
const shape = (n) => (Array.isArray(n) ? n.map(shape) : n && typeof n === 'object' && !isPending(n) ? Object.fromEntries(Object.entries(n).map(([k, v]) => [k, shape(v)])) : isPending(n) ? 'P' : typeof n)

describe('contenido bilingüe (spec §3, §9)', () => {
  it('EN y ES tienen exactamente la misma estructura', () => {
    expect(shape(site.es)).toEqual(shape(site.en))
  })
  it('los 5 puntos del resumen existen en los dos idiomas', () => {
    expect(site.en.hero.summary).toHaveLength(5)
    expect(site.es.hero.summary).toHaveLength(5)
  })
  it('no contiene cifras inventadas ni la afirmación sin confirmar (P-05)', () => {
    const all = walk(site).join(' ')
    expect(all).not.toMatch(/1[,.]?719/)
    expect(all).not.toMatch(/técnicos reales|real technicians/i)
    expect(all).not.toMatch(/\b\d+\s?%/)
    expect(all).not.toMatch(/clientes? (satisfech|reales)|years of experience in AI/i)
  })
  it('los únicos números son los más de 8 años de fibra óptica y el año 2025 del bot (verificados por Dennys)', () => {
    // El formulario de contacto lleva rangos de presupuesto neutros (USD) y plazos, que el spec pide: se prueban aparte.
    // La línea de tiempo de Trayectoria lleva las fechas del CV público: sus números se prueban aparte (más abajo).
    const noForm = (c) => { const { contactForm, journeyPage, ...rest } = c; return { ...rest, journeyPage: { ...journeyPage, timeline: undefined } } }
    const digits = walk([noForm(site.en), noForm(site.es)]).join(' ').match(/\b\d{1,4}\b/g) ?? []
    expect(digits.filter((d) => !['2026', '2025', '5', '8', '27'].includes(d))).toEqual([])
  })
  it('cada estado de trabajo que existe está en la tabla de estados (Criden no declara estado: no consta)', () => {
    for (const lang of ['en', 'es']) for (const it of site[lang].work.items) if (it.status) expect(Object.keys(site[lang].work.status)).toContain(it.status)
  })
  const botsOf = (lang) => site[lang].work.items.find((i) => i.bots).bots
  it('cada trabajo es "en producción" o "en desarrollo", nada más; el grupo de bots no lleva estado propio (D1, D2)', () => {
    for (const lang of ['en', 'es']) {
      expect(Object.keys(site[lang].work.status).sort()).toEqual(['development', 'production'])
      for (const it of site[lang].work.items.filter((i) => !i.bots)) expect(['production', 'development']).toContain(it.status)
      expect(site[lang].work.items.find((i) => i.bots).status).toBeUndefined()
    }
    const prod = site.en.work.items.filter((i) => i.status === 'production').map((i) => i.id)
    expect(prod).toEqual(['super-gol-kids', 'criden']) // Criden está en producción (Dennys, 2026-11-01)
    expect(site.en.work.items.find((i) => i.id === 'naunturia').status).toBe('development')
  })
  it('D2: un solo elemento "Bots para Telegram" con los cuatro bots en este orden; solo Caja Cercana declara estado', () => {
    expect(site.es.work.items.filter((i) => i.bots)).toHaveLength(1)
    expect(site.es.work.items.find((i) => i.bots).title).toBe('Bots para Telegram')
    expect(botsOf('es').map((b) => b.title)).toEqual(['Bot de registro de cajas', 'Bot de caja más cercana', 'Bot de reportes', 'Bot de planificación'])
    expect(botsOf('en').map((b) => b.title)).toEqual(['Box registry bot', 'Nearest box bot', 'Reports bot', 'Planning bot'])
    for (const lang of ['en', 'es']) {
      expect(botsOf(lang).map((b) => b.id)).toEqual(['registro-cajas', 'caja-cercana', 'reportes-telecom', 'planificacion'])
      expect(botsOf(lang).filter((b) => b.status).map((b) => [b.id, b.status])).toEqual([['caja-cercana', 'production']])
      const plan = botsOf(lang).find((b) => b.id === 'planificacion')
      expect(Object.keys(plan).sort()).toEqual(['id', 'title']) // nada que no conste: ni texto, ni estado, ni enlace
      // los bots sueltos ya no son elementos aparte (ni "Bot Registry" como uno más)
      expect(site[lang].work.items.map((i) => i.id)).toEqual(['telegram-bots', 'super-gol-kids', 'criden', 'naunturia'])
      expect(walk(site[lang]).join(' ')).not.toMatch(/bot registry/i)
    }
  })
  it('Super Gol Kids: en producción, enlace al sitio público del cliente, sin cifras ni correos; Naunturia sin enlace', () => {
    for (const lang of ['en', 'es']) {
      const sg = site[lang].work.items.find((i) => i.id === 'super-gol-kids')
      const nu = site[lang].work.items.find((i) => i.id === 'naunturia')
      expect(sg.url).toBe('https://www.supergolkids.com/')
      expect(sg.text).toMatch(lang === 'es' ? /campeonatos de fútbol infantil/i : /children'?s football championships/i)
      expect(JSON.stringify(sg)).not.toMatch(/@|\d/)
      expect(nu.url).toBeUndefined(); expect(nu.repo).toBeUndefined()
      expect(JSON.stringify(nu)).not.toMatch(/https?:|@/)
    }
  })
  it('la página del ingeniero (sin confirmar) no aparece en ninguna parte', () => {
    expect(walk(site).join(' ')).not.toMatch(/ingenier[oa]|engineer'?s page/i)
  })
  it('el bot: redacción acordada (P-05 cerrada), sin empleador ni cifras', () => {
    const en = botsOf('en').find((i) => i.id === 'caja-cercana').text
    const es = botsOf('es').find((i) => i.id === 'caja-cercana').text
    expect(en).toMatch(/2025/); expect(es).toMatch(/2025/)
    expect(en).toMatch(/nearest network box/i); expect(es).toMatch(/caja de red más cercana/i)
    expect(en).toMatch(/used internally at the company/i); expect(es).toMatch(/se usa internamente en la empresa/i)
  })
  it('contacto verificado en archivo', () => {
    expect(links.emailAddress).toBe('dennys@dennysh.com')
    expect(links.linkedin).toContain('dennys-heras-27b0b520b')
    expect(links.github).toBe('https://github.com/dennysh')
  })
  it('el correo público es dennys@dennysh.com en todas partes; el Hotmail no se publica', async () => {
    const { jsonLd, llmsTxt, resumeJson } = await import('../../scripts/lib/machine.mjs')
    const everything = [JSON.stringify(site), llmsTxt(), JSON.stringify(resumeJson()), JSON.stringify(jsonLd('en')), JSON.stringify(jsonLd('es'))].join(' ')
    expect(everything).toContain('dennys@dennysh.com')
    expect(everything).not.toMatch(/hotmail/i)
    expect(links.email).toBe('mailto:dennys@dennysh.com')
    expect(site.en.hero.summary[4]).toContain('dennys@dennysh.com'); expect(site.es.hero.summary[4]).toContain('dennys@dennysh.com')
  })
  it('los enlaces a repos solo apuntan a github.com/dennysh', () => {
    for (const it of site.en.work.items) if (typeof it.repo === 'string') expect(it.repo).toMatch(/^https:\/\/github\.com\/dennysh\//)
  })
})

describe('posicionamiento AI-first honesto (encargo 2026-10-30)', () => {
  it('titular: sistemas con IA que se explican y se auditan, en los dos idiomas', () => {
    expect(site.es.hero.thesis).toBe('Construyo sistemas con IA que se explican y se auditan.')
    expect(site.en.hero.thesis).toBe('I build AI systems that explain themselves and can be audited.')
  })
  it('la portada no tiene titular: su único texto principal es la frase de Dennys (correcciones 1, C6)', () => {
    expect(site.es.home.phrase).toBe('Un poco sobre mí.')
    expect(site.en.home.phrase).toBe('A little of what I do, in a few minutes.')
  })
  it('una sola línea de origen bajo el titular: más de 8 años de fibra óptica, en campo; la fibra no es una etiqueta', () => {
    for (const lang of ['es', 'en']) {
      const who = site[lang].hero.who
      expect(who).toHaveLength(1)
      expect(who[0]).toMatch(lang === 'es' ? /más de 8 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo/ : /more than 8 years in fiber-optic networks, where things have to work in the field/)
    }
  })
  it('nada de técnico de telecomunicaciones ni de tono visionario fuera de Contacto', () => {
    for (const lang of ['es', 'en']) {
      // El panel Interés puede decir "cerebro" (D-H5), pero el resto de reglas de tono sigue aplicando a todo, Interés incluido.
      const everything = walk((({ contact, ...rest }) => rest)(site[lang])).join(' ')
      expect(everything).not.toMatch(/técnic[oa] de telecom|telecom(munications)? technician|ingeniero de telecom|\bvisión\b|\bvision(ary)?\b|world-class|revolution|revolucion|cutting-edge|vanguardia|futuro de la|future of/i)
      const all = walk(nonInterest(site[lang])).join(' ')
      expect(all).not.toMatch(/técnic[oa] de telecom|telecom(munications)? technician|ingeniero de telecom/i)
      expect(all).not.toMatch(/cerebro|brain|\bvisión\b|\bvision(ary)?\b/i)
      expect(all).not.toMatch(/world-class|revolution|revolucion|cutting-edge|vanguardia|futuro de la|future of/i)
    }
  })
  it('Hero, resumen, JSON-LD, dennys.json y llms.txt dicen lo mismo (mismo enunciado de origen y de IA)', async () => {
    const { jsonLd, llmsTxt, resumeJson } = await import('../../scripts/lib/machine.mjs')
    const en = site.en
    expect(JSON.stringify(jsonLd('en'))).toContain(en.hero.summary[0])
    expect(JSON.stringify(jsonLd('es'))).toContain(site.es.hero.summary[0])
    expect(llmsTxt()).toContain(en.hero.summary[0])
    expect(llmsTxt()).toContain(en.hero.who[0])
    expect(resumeJson().basics.summary).toContain(en.hero.summary[0])
    expect(resumeJson().basics.summary).toContain(en.hero.who[0])
    for (const out of [llmsTxt(), JSON.stringify(resumeJson()), JSON.stringify(jsonLd('en')), JSON.stringify(jsonLd('es'))]) {
      expect(out).not.toMatch(/1[,.]?719|Ecuador|brain|cerebro|Automation that decides|Automatización que decide/i)
    }
    expect(llmsTxt()).toContain('https://www.supergolkids.com/')
    expect(resumeJson().projects.map((p) => p.name).join(' ')).toMatch(/Super Gol Kids/)
    expect(resumeJson().projects.map((p) => p.name).join(' ')).toMatch(/Naunturia/)
  })
  it('la frase IA y cerebro solo vive en «Sobre mí» (D-H5; Contacto la quitó el 2026-11-14), como interés', () => {
    for (const lang of ['es', 'en']) {
      const { contact } = site[lang]
      expect(walk(nonInterest(site[lang])).join(' ')).not.toMatch(/cerebro|brain/i)
      const th = site[lang].interestPage.longTerm.thought
      expect(th).toMatch(/cerebro|brain/i)
      expect(th).not.toMatch(/capacidad|capability/i) // el aviso vive solo en `notice`, una vez
      expect(site[lang].interestPage.longTerm.notice).toMatch(lang === 'es' ? /interés, no una capacidad demostrada/i : /interest, not a demonstrated skill/i)
      expect(contact).not.toHaveProperty('interest')
      expect(contact.role).not.toMatch(/cerebro|brain/i)
    }
  })
  it('el rol buscado es una frase honesta de interés, sin marcador', () => {
    for (const lang of ['es', 'en']) {
      const r = site[lang].contact.role
      expect(typeof r).toBe('string')
      expect(r).toMatch(lang === 'es' ? /inteligencia artificial/i : /artificial intelligence/i)
      expect(r).toMatch(lang === 'es' ? /control humano/i : /human control/i)
    }
  })
  it('la visión de IA y cerebro se presenta como interés, nunca como capacidad demostrada', () => {
    for (const lang of ['es', 'en']) {
      const all = walk(site[lang]).join(' ')
      expect(all).not.toMatch(/(constru[ií]|desarroll[eé]|logr[eé]|demostr|built|developed|achieved|proved|demonstrated)[^.]*(cerebro|brain|neuro)/i)
    }
  })
  it('ubicación, idiomas y zona horaria son datos confirmados por Dennys (2026-10-30); la disponibilidad se quitó de Contacto (2026-11-14: no hay dato real)', () => {
    const en = site.en.contact; const es = site.es.contact
    expect(en.location).toMatch(/remote/i); expect(en.location).toMatch(/anywhere|worldwide|any/i)
    expect(es.location).toMatch(/remoto/i)
    expect(en.timezone).toBe('UTC-5'); expect(es.timezone).toBe('UTC-5')
    expect(en.languages).toMatch(/Spanish/); expect(en.languages).toMatch(/native/i)
    expect(es.languages).toMatch(/Español/); expect(es.languages).toMatch(/nativo/i)
    expect(collectPending(site.en.contact)).toEqual([])
    expect(site.en.contact).not.toHaveProperty('availability'); expect(site.es.contact).not.toHaveProperty('availability')
  })
  it('el inglés se declara como B1, sin inflarlo', () => {
    for (const lang of ['en', 'es']) {
      const l = site[lang].contact.languages
      expect(l).toMatch(/B1/)
      expect(l).not.toMatch(/fluent|fluido|avanzado|advanced|bilingual|bilingüe|C1|C2|B2|native English|inglés nativo/i)
    }
  })
  it('la ubicación no se presenta como país ni ciudad concretos', () => {
    for (const lang of ['en', 'es']) expect(site[lang].contact.location).not.toMatch(/ecuador|quito|guayaquil/i)
  })
})

describe('marcadores pending (T080, K2)', () => {
  it('collectPending encuentra los marcadores con su ruta', () => {
    expect(collectPending({ a: { b: [pending('P-1', 'x')] } })).toEqual([{ pending: true, id: 'P-1', hint: 'x', path: 'a.b[0]' }])
  })
  it('el sitio tiene marcadores y todos tienen id P-xx y pista', () => {
    const list = collectPending()
    expect(list.length).toBeGreaterThan(0)
    for (const p of list) { expect(p.id).toMatch(/^P-\d+$/); expect(p.hint.length).toBeGreaterThan(5) }
  })
  const gate = (env) => spawnSync('node', ['scripts/test-static.mjs', 'content'], { encoding: 'utf8', env: { ...process.env, NODE_ENV: env } })
  it('en desarrollo lista los pending y pasa', () => {
    const r = gate('development')
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('P-04')
  })
  it('el sitio no muestra pistas internas ni marcadores P-xx (Contacto ya no lleva ningún «por confirmar»)', () => {
    // Con el inicio limpio, los marcadores autorizados se ven en sus páginas: Cómo trabajo (P-04).
    const html = ['contact', 'how-i-work'].map((p) => readFileSync(`dist/en/${p}/index.html`, 'utf8')).join('\n')
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ') // solo el texto visible, sin atributos ni JSON-LD
    expect(visible).not.toMatch(/to be confirmed|When I can start/)
    expect(visible).not.toMatch(/\bP-\d+\b|Public evidence of the factory|Location, time zone and availability/)
  })
  it('Dennys autorizó publicar con P-04 y P-06 (2026-10-30; P-09, la disponibilidad, se quitó el 2026-11-14) y P-29 mientras la galería esté oculta (2026-10-31); P-22 (Criden) se resolvió el 2026-11-14', () => {
    expect([...AUTHORIZED_PENDING].sort()).toEqual(['P-04', 'P-06', 'P-29'])
  })
  it('en producción pasa: no queda ningún marcador sin autorizar', () => {
    const r = gate('production')
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('autorizados')
  })
  it('P-23, P-24 y P-25 se resolvieron (2026-10-31): ya no hay marcadores de ellas, y P-29 sigue registrado', () => {
    const ids = new Set(collectPending().map((p) => p.id))
    for (const id of ['P-23', 'P-24', 'P-25']) expect(ids.has(id)).toBe(false)
    expect(ids.has('P-29')).toBe(true)
    expect(unauthorized(collectPending())).toEqual([])
  })
  it('un marcador nuevo sin autorizar se detecta (rompería el build de producción)', () => {
    const list = [{ id: 'P-04' }, { id: 'P-99' }]
    expect(unauthorized(list).map((p) => p.id)).toEqual(['P-99'])
  })
})

describe('primera pantalla: contenido (TH07, spec 2026-10-31)', () => {
  const IDS = ['code', 'projects', 'journey', 'how', 'interest']
  it('cinco nodos (sin Demo), mismo orden e ids en los dos idiomas', () => {
    for (const lang of ['en', 'es']) expect(site[lang].home.nodes.map((n) => n.id)).toEqual(IDS)
    for (const lang of ['en', 'es']) { expect(site[lang].nav).not.toHaveProperty('demo'); expect(site[lang]).not.toHaveProperty('demo') }
  })
  it('hay un panel por nodo', () => {
    for (const lang of ['en', 'es']) expect(Object.keys(site[lang].home.panels).sort()).toEqual([...IDS].sort())
  })
  it('las tarjetas de Proyectos y Trayectoria llevan los textos aprobados del spec', () => {
    const es = site.es.home.panels
    expect(es.projects.title).toBe('Trabajo en producción')
    expect(es.projects.text).toBe('Bot de Telegram para técnicos de un ISP. Sitio de campeonatos infantiles para un cliente. Criden, para negocios y páginas web.')
    expect(es).not.toHaveProperty('demo')
    expect(es.journey.title).toBe('De la fibra a la IA')
    expect(es.journey.text).toBe('Más de 8 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.')
  })
  it('las líneas mono del Hero: más de 8 años en fibra óptica y perfil confirmado', () => {
    expect(site.es.home.tagline).toEqual(['Más de 8 años en fibra óptica', 'Remoto · Español nativo · Inglés B1'])
    expect(site.en.home.tagline).toEqual(['More than 8 years in fiber optics', 'Remote · Spanish native · English B1'])
  })
  it('Sobre mí (antes Interés): la tarjeta lleva la presentación; el pensamiento cerebro–IA vive solo en su sección final; ningún deporte (C6, Dennys 2026-11-01)', () => {
    for (const lang of ['en', 'es']) {
      const i = site[lang].home.panels.interest
      expect(Object.keys(i).sort()).toEqual(['go', 'opens', 'text', 'title'])
      expect(i.title).toBe(lang === 'es' ? 'Sobre mí' : 'About me')
      expect(i.text).not.toMatch(/cerebro|brain/i)
      expect(collectPending(i)).toEqual([])
      expect(walk(site[lang]).join(' ')).not.toMatch(/jiu|jitsu|triat|triath|obst[aá]cul|obstacle|deporte|sport|ciclismo|cycling|nataci[oó]n|swimming/i)
    }
  })
  it('Proyectos (C7, D1): "Trabajo en producción" con Bots para Telegram, Super Gol Kids y Criden (en producción, sin dirección inventada)', () => {
    for (const lang of ['en', 'es']) {
      const p = site[lang].projectsPage
      expect(p.title).toBe(lang === 'es' ? 'Trabajo en producción' : 'Work in production')
      expect(site[lang].home.panels.projects.title).toBe(p.title)
      expect(p.ids).toEqual(['telegram-bots', 'super-gol-kids', 'criden'])
      for (const id of p.ids) expect(site[lang].work.items.map((i) => i.id)).toContain(id)
      const cr = site[lang].work.items.find((i) => i.id === 'criden')
      expect(cr.text).toBe(lang === 'es' ? 'Plataforma donde vendo páginas web y automatizaciones para negocios. Es aparte de este sitio.' : 'A platform where I sell websites and automation for businesses. It is separate from this site.')
      expect(cr.status).toBe('production') // D1: en producción; con enlace desde el 2026-11-14 (encargo «Sobre mí», cierra P-22)
      expect(cr.url).toBe('https://criden.com'); expect(cr.repo).toBeUndefined()
      expect(cr.link).toBeUndefined()
      expect(p.more).toBeUndefined()
      expect(site[lang].journeyPage.more).toBeUndefined()
    }
  })
  it('se quitan de todo lo público el sistema contable, Football Manager y HARDLOCK, y solo esos tres (C7, Dennys 2026-10-31)', async () => {
    const { jsonLd, llmsTxt, resumeJson } = await import('../../scripts/lib/machine.mjs')
    const everything = [JSON.stringify(site), llmsTxt(), JSON.stringify(resumeJson()), JSON.stringify(jsonLd('en')), JSON.stringify(jsonLd('es'))].join(' ')
    expect(everything).not.toMatch(/contable|accounting system|football manager|f[uú]tbol manager|futbolManager|hardlock|Sistema-Contable|'contable'|"contable"/i)
    for (const lang of ['en', 'es']) {
      expect(site[lang].work.items.map((i) => i.id)).toEqual(['telegram-bots', 'super-gol-kids', 'criden', 'naunturia'])
    }
    // una sola fuente: llms.txt y dennys.json listan el grupo y los cuatro bots, y Naunturia sigue (D3)
    const l = llmsTxt()
    expect(l).toContain('- Telegram bots')
    expect(l.indexOf('Box registry bot')).toBeLessThan(l.indexOf('Nearest box bot'))
    expect(l.indexOf('Nearest box bot')).toBeLessThan(l.indexOf('Reports bot'))
    expect(l.indexOf('Reports bot')).toBeLessThan(l.indexOf('Planning bot'))
    expect(l).toContain('- Naunturia (In development)')
    const proj = resumeJson().projects
    expect(proj.find((x) => x.name === 'Telegram bots').highlights).toEqual(['Box registry bot', 'Nearest box bot (In production)', 'Reports bot', 'Planning bot'])
    expect(proj.map((x) => x.name)).toContain('Naunturia')
  })
  it('ningún deporte en las salidas de máquina (llms.txt, dennys.json, JSON-LD)', async () => {
    const { jsonLd, llmsTxt, resumeJson } = await import('../../scripts/lib/machine.mjs')
    const out = [llmsTxt(), JSON.stringify(resumeJson()), JSON.stringify(jsonLd('en')), JSON.stringify(jsonLd('es'))].join(' ')
    expect(out).not.toMatch(/jiu|jitsu|triat|triath|obst[aá]cul|obstacle|deporte|sport/i)
  })
  it('Capacidades (C10): se añaden LLM, Chatbots con LLM y Agentes de IA acotado; ni bots autónomos ni aprendizaje profundo ni potencias ópticas', () => {
    for (const lang of ['en', 'es']) {
      const ai = site[lang].skills.groups.find((g) => g.title === (lang === 'es' ? 'Sistemas con IA' : 'AI systems'))
      expect(ai.shown).toEqual([])
      expect(ai.declared).toEqual(lang === 'es'
        ? ['LLM', 'APIs de LLM', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'Chatbots con LLM', 'Agentes de IA']
        : ['LLM', 'LLM APIs', 'Claude', 'OpenAI', 'Gemini', 'Whisper', 'LLM chatbots', 'AI agents'])
      expect(ai.note).toMatch(lang === 'es' ? /solo lectura.*prototipo, sin producción/i : /read-only.*prototype, never in production/i)
      const all = walk(site[lang].skills).join(' ')
      expect(all).not.toMatch(/aut[oó]nom|autonomous|aprendizaje|deep learning|continual|continuous learning|potencia|optical power|isp\b.*(nombre|name)/i)
      expect(ai.note).not.toMatch(/ISP/)
    }
  })
  it('cada página interior tiene su propia descripción (no la de la portada)', () => {
    for (const lang of ['en', 'es']) {
      const c = site[lang]
      const d = ['codePage', 'projectsPage', 'journeyPage', 'howPage', 'interestPage', 'contactPage'].map((k) => c[k].description)
      expect(new Set([...d, c.meta.description]).size).toBe(7)
      for (const t of d) expect(t.length).toBeGreaterThan(40)
      expect(c.journeyPage.description).not.toMatch(/demo/i)
    }
  })
  it('ni "1,719" ni "Ecuador" en ninguna parte del contenido (P-05 cerrada)', () => {
    expect(walk(site).join(' ')).not.toMatch(/1[,.]?719|ecuador/i)
  })
})

describe('línea de tiempo de Trayectoria (trabajo B; contenido solo del CV público; P-29 sigue pendiente)', () => {
  const ORDER = ['bot-caja-cercana', 'super-gol-kids', 'ismac', 'fibratelecom', 'msnet', 'afiatic', 'telydata']
  it('siete entradas en el mismo orden en español e inglés, de lo más reciente a lo más antiguo, con sus textos', () => {
    for (const lang of ['en', 'es']) {
      const t = site[lang].journeyPage.timeline
      expect(t.map((e) => e.id)).toEqual(ORDER)
      for (const e of t) { expect(e.title.length).toBeGreaterThan(3); expect(e.bullets.length).toBeGreaterThanOrEqual(1); expect(e.bullets.length).toBeLessThanOrEqual(4); expect(e.when.length).toBeGreaterThan(3) }
      // los empleos y los estudios con fecha de inicio van de más reciente a más antiguo
      const dated = t.filter((e) => e.from).map((e) => e.from)
      expect([...dated].sort().reverse()).toEqual(dated)
    }
  })
  it('es y en tienen la misma estructura (tipo, fechas ISO, actual, número de viñetas y de etiquetas)', () => {
    const shape = (lang) => site[lang].journeyPage.timeline.map((e) => [e.id, e.kind, e.from ?? null, e.to ?? null, !!e.current, e.bullets.length, e.tags.length, (e.challenges ?? []).length])
    expect(shape('es')).toEqual(shape('en'))
  })
  it('las fechas coinciden con el CV público; "Presente" solo en los dos que siguen en curso', () => {
    const t = site.es.journeyPage.timeline, byId = (id) => t.find((e) => e.id === id)
    expect(byId('fibratelecom')).toMatchObject({ when: 'Mar 2023 – Presente', current: true, org: 'Fibratelecom' })
    expect(byId('msnet')).toMatchObject({ when: 'Jun 2021 – Oct 2022', org: 'MS@Net', title: 'ISP Manager' })
    expect(byId('afiatic')).toMatchObject({ when: 'Feb 2018 – May 2021', org: 'Afiatic' })
    expect(byId('telydata')).toMatchObject({ when: 'Mar 2017 – Feb 2018', org: 'Telydata' })
    expect(byId('ismac')).toMatchObject({ kind: 'study', when: 'Sep 2023 – Presente', current: true })
    expect(t.filter((e) => e.current).map((e) => e.id)).toEqual(['ismac', 'fibratelecom'])
    expect(t.filter((e) => e.kind === 'job').map((e) => e.id)).toEqual(['fibratelecom', 'msnet', 'afiatic', 'telydata'])
    expect(t.filter((e) => e.kind === 'project').map((e) => e.id)).toEqual(['bot-caja-cercana', 'super-gol-kids'])
  })
  it('ninguna entrada trae fotos en la compilación normal, y P-29 sigue registrado, autorizado y sin rastro visible', () => {
    for (const lang of ['en', 'es']) {
      const j = site[lang].journeyPage
      for (const e of j.timeline) expect(e.photos).toEqual([])
      expect(isPending(j.photosPending)).toBe(true)
      expect(j.photosPending.id).toBe('P-29')
      expect(collectPending(j.timeline)).toEqual([])
    }
  })
  it('no se usa la sección Referencias del CV (correos ni nombres de terceros) ni se inventan roles ni rutas de imagen', () => {
    for (const lang of ['en', 'es']) {
      const all = JSON.stringify(site[lang].journeyPage.timeline)
      expect(all).not.toMatch(/[\w.-]+@[\w.-]+\.\w+|darwin|robles|santamar|gaibor|oscar ortiz|referenc/i)
      expect(all).not.toMatch(/ingenier|engineer|supervisor|gerente|manager de|jefe|\.(webp|jpe?g|png)|"src"/i)
      expect(all).not.toMatch(/\d+ ?%|\$ ?\d|\d+ clientes|\d+ clients/i) // sin cifras que no estén en el CV
      // los únicos números de la prosa son los años del CV (y "24/7"); las fechas ISO van aparte en from/to
      const prose = JSON.stringify(site[lang].journeyPage.timeline.map(({ from, to, challenges, ...e }) => e)) // los retos tienen su propia prueba (más abajo)
      expect((prose.match(/\b\d{1,4}\b/g) ?? []).filter((d) => !['2017', '2018', '2021', '2022', '2023', '2025', '24', '7'].includes(d))).toEqual([])
    }
  })
})

describe('retos superados de Trayectoria (declarados por Dennys; sin fechas, sin clientes, sin cargos nuevos)', () => {
  const IDS = { telydata: 1, afiatic: 1, msnet: 2 }
  const byId = (lang, id) => site[lang].journeyPage.timeline.find((e) => e.id === id)
  const NUMS = { es: { telydata: ['3'], afiatic: ['800', '4', '5'], msnet: ['4', '2', '3', '3'] }, en: { telydata: ['3'], afiatic: ['800', '4', '5'], msnet: ['4', '2', '3', '3'] } }
  it('solo Telydata (1), Afiatic (1) y MS@Net (2) llevan retos, igual en es y en; Fibratelecom y el resto, ninguno', () => {
    for (const lang of ['es', 'en']) for (const e of site[lang].journeyPage.timeline) expect((e.challenges ?? []).length, `${lang} ${e.id}`).toBe(IDS[e.id] ?? 0)
  })
  it('cada reto tiene título corto y texto de 2 a 4 líneas de prosa, y existe el rótulo en los dos idiomas', () => {
    expect(site.es.journeyPage.ui.challenge).toBe('Un reto superado')
    expect(site.en.journeyPage.ui.challenge).toBe('A challenge overcome')
    for (const lang of ['es', 'en']) for (const id of Object.keys(IDS)) for (const c of byId(lang, id).challenges) {
      expect(c.title.length).toBeGreaterThan(8); expect(c.title.length).toBeLessThan(50)
      expect(c.text.length).toBeGreaterThan(150); expect(c.text.length).toBeLessThan(560)
    }
  })
  it('textos exactos de los retos que Dennys dictó (título y primera frase de cada uno)', () => {
    const T = (lang, id, i) => byId(lang, id).challenges[i]
    expect(T('es', 'telydata', 0).title).toBe('Un enlace dañado en varios puntos')
    expect(T('es', 'afiatic', 0).title).toBe('Fusionar en el aire, a 800 metros')
    expect(T('es', 'msnet', 0).title).toBe('Enlaces que no pueden esperar')
    expect(T('es', 'msnet', 1).title).toBe('La primera red GPON en Taisha')
    expect(T('en', 'telydata', 0).title).toBe('A link damaged in several places')
    expect(T('en', 'afiatic', 0).title).toBe('Splicing in the air, at 800 meters')
    expect(T('en', 'msnet', 0).title).toBe('Links that cannot wait')
    expect(T('en', 'msnet', 1).title).toBe('The first GPON network in Taisha')
    // «la primera empresa» es afirmación declarada por Dennys, con la frase de las fotos, tal cual
    expect(T('es', 'msnet', 1).text).toContain('fuimos la primera empresa en abrir una red GPON de fibra hasta la casa (FTTH)')
    expect(T('es', 'msnet', 1).text.endsWith('Fotos de respaldo disponibles a pedido.')).toBe(true)
    expect(T('en', 'msnet', 1).text).toContain('we were the first company to open a GPON fiber-to-the-home (FTTH) network')
    expect(T('en', 'msnet', 1).text.endsWith('Backup photos available on request.')).toBe(true)
  })
  it('no hay fechas, ni «inteligencia», ni «policía», ni nombres propios de clientes o personas; los números son los dictados', () => {
    for (const lang of ['es', 'en']) for (const id of Object.keys(IDS)) {
      const cs = byId(lang, id).challenges
      const all = JSON.stringify(cs)
      expect(all).not.toMatch(/\b(19|20)\d{2}\b|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre|january|february|march|april|june|july|august|september|october|november|december)\b/i)
      expect(all).not.toMatch(/inteligencia|polic[ií]a|intelligence|police/i)
      expect(all).not.toMatch(/[\w.-]+@[\w.-]+\.\w+|https?:|www\./i)
      expect(cs.flatMap((c) => c.text.match(/\b\d+\b/g) ?? []).sort()).toEqual([...NUMS[lang][id]].sort())
    }
  })
  it('las fechas y los cargos de MS@Net, Afiatic y Telydata no cambian', () => {
    for (const lang of ['es', 'en']) {
      expect(byId(lang, 'msnet')).toMatchObject({ when: 'Jun 2021 – Oct 2022', from: '2021-06', to: '2022-10', title: 'ISP Manager', org: 'MS@Net' })
      expect(byId(lang, 'afiatic')).toMatchObject({ when: 'Feb 2018 – May 2021', from: '2018-02', to: '2021-05', org: 'Afiatic' })
      expect(byId(lang, 'telydata')).toMatchObject({ when: 'Mar 2017 – Feb 2018', from: '2017-03', to: '2018-02', org: 'Telydata' })
    }
  })
})

describe('textos del formulario de contacto (D4): es y en, sin tarifas', () => {
  const F = FIELDS, I = INTENTS, Q = QUESTIONS
  const forms = { es: site.es.contactForm, en: site.en.contactForm }
  it('hay una etiqueta no vacía por cada opción y por cada valor de cada lista cerrada, en los dos idiomas', () => {
    for (const [lang, t] of Object.entries(forms)) {
      for (const i of I) expect(t.intent.options[i]?.trim().length, `${lang} intent ${i}`).toBeGreaterThan(2)
      for (const [f, def] of Object.entries(F)) {
        if (!t.questions[f]) continue
        if (def.kind === 'enum') for (const v of def.values) expect(t.questions[f].options[v]?.trim().length, `${lang} ${f}=${v}`).toBeGreaterThan(1)
        expect(t.questions[f].q.trim().length, `${lang} ${f}.q`).toBeGreaterThan(5)
      }
      for (const i of I) for (const q of Q[i]) expect(t.questions[q], `${lang} pregunta ${q}`).toBeDefined()
    }
  })
  it('los rangos de presupuesto son neutros (USD) y el formulario no publica precios, tarifas ni cantidades de Dennys', () => {
    expect(Object.values(forms.es.questions.budget.options)).toEqual(['Menos de 300', '300–1 000', '1 000–3 000', 'Más de 3 000', 'Aún no lo sé'])
    expect(Object.values(forms.en.questions.budget.options)).toEqual(['Under 300', '300–1,000', '1,000–3,000', 'Over 3,000', 'I do not know yet'])
    for (const t of Object.values(forms)) {
      const text = JSON.stringify(t)
      expect(text).not.toMatch(/tarifa|\bmy rate|\brates? (are|start)|per hour|por hora|\/h\b|\bhourly|cobro|I charge|precio de|my price/i)
      expect(text).not.toMatch(/USD per|USD por|\$\s?\d/)
    }
  })
  it('el aviso de consentimiento y el de privacidad existen en los dos idiomas', () => {
    for (const t of Object.values(forms)) { expect(t.review.consent.length).toBeGreaterThan(20); expect(t.review.privacy.length).toBeGreaterThan(5) }
  })
})

describe('Naunturia (D3): igual que hoy en los dos idiomas', () => {
  it('en desarrollo, sin enlace ni repositorio ni marcador, con "Proyecto en desarrollo" / "Project in development"', () => {
    for (const [lang, text] of [['es', 'Proyecto en desarrollo.'], ['en', 'Project in development.']]) {
      const n = site[lang].work.items.find((i) => i.id === 'naunturia')
      expect(n).toEqual({ id: 'naunturia', status: 'development', title: 'Naunturia', text })
    }
  })
})
