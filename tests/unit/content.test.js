import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { site, collectPending, isPending, pending, AUTHORIZED_PENDING, unauthorized, links } from '../../src/content/site.js'

const walk = (n, out = []) => {
  if (typeof n === 'string') out.push(n)
  else if (Array.isArray(n)) n.forEach((v) => walk(v, out))
  else if (n && typeof n === 'object' && !isPending(n)) Object.values(n).forEach((v) => walk(v, out))
  return out
}
const nonInterest = (c) => { const { contact, ...rest } = c; return { ...rest, home: { ...rest.home, panels: { ...rest.home.panels, interest: undefined } } } }
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
  it('los únicos números son los 7 años de fibra óptica y el año 2025 del bot (verificados por Dennys)', () => {
    const digits = walk(site).join(' ').match(/\b\d{1,4}\b/g) ?? []
    expect(digits.filter((d) => !['2026', '2025', '5', '7', '27'].includes(d))).toEqual([])
  })
  it('cada estado de trabajo existe en la tabla de estados', () => {
    for (const lang of ['en', 'es']) for (const it of site[lang].work.items) expect(Object.keys(site[lang].work.status)).toContain(it.status)
  })
  it('cada trabajo es "en producción" o "en desarrollo", nada más (encargo 2026-10-30)', () => {
    for (const lang of ['en', 'es']) {
      expect(Object.keys(site[lang].work.status).sort()).toEqual(['development', 'production'])
      for (const it of site[lang].work.items) expect(['production', 'development']).toContain(it.status)
    }
    const prod = site.en.work.items.filter((i) => i.status === 'production').map((i) => i.id)
    expect(prod).toEqual(['caja-cercana', 'super-gol-kids'])
    expect(site.en.work.items.find((i) => i.id === 'naunturia').status).toBe('development')
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
    const en = site.en.work.items.find((i) => i.id === 'caja-cercana').text
    const es = site.es.work.items.find((i) => i.id === 'caja-cercana').text
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
  it('una sola línea de origen bajo el titular: 7 años de fibra óptica, en campo; la fibra no es una etiqueta', () => {
    for (const lang of ['es', 'en']) {
      const who = site[lang].hero.who
      expect(who).toHaveLength(1)
      expect(who[0]).toMatch(lang === 'es' ? /7 años en redes de fibra óptica, donde las cosas tienen que funcionar en campo/ : /7 years in fiber-optic networks, where things have to work in the field/)
    }
  })
  it('nada de técnico de telecomunicaciones ni de tono visionario fuera de Contacto', () => {
    for (const lang of ['es', 'en']) {
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
  it('la frase IA y cerebro solo vive en Contacto y en el nodo Interés (D-H5, spec 2026-10-31), como interés', () => {
    for (const lang of ['es', 'en']) {
      const { contact } = site[lang]
      expect(walk(nonInterest(site[lang])).join(' ')).not.toMatch(/cerebro|brain/i)
      const th = site[lang].home.panels.interest.thought
      expect(th).toMatch(/cerebro|brain/i)
      expect(th).toMatch(lang === 'es' ? /una idea, no una capacidad/i : /an idea, not a capability/i)
      const i = contact.interest
      expect(i).toMatch(/cerebro|brain/i)
      expect(i).toMatch(lang === 'es' ? /interés/i : /interest/i)
      expect(i.length).toBeLessThan(120)
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
  it('ubicación, idiomas y zona horaria son datos confirmados por Dennys (2026-10-30); solo la disponibilidad sigue pendiente', () => {
    const en = site.en.contact; const es = site.es.contact
    expect(en.location).toMatch(/remote/i); expect(en.location).toMatch(/anywhere|worldwide|any/i)
    expect(es.location).toMatch(/remoto/i)
    expect(en.timezone).toBe('UTC-5'); expect(es.timezone).toBe('UTC-5')
    expect(en.languages).toMatch(/Spanish/); expect(en.languages).toMatch(/native/i)
    expect(es.languages).toMatch(/Español/); expect(es.languages).toMatch(/nativo/i)
    const left = collectPending(site.en.contact)
    expect(left.map((p) => p.id)).toEqual(['P-09'])
    expect(left[0].hint).toMatch(/availab/i)
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
    expect(r.stdout).toContain('P-09')
  })
  it('el sitio muestra "por confirmar" (no pistas internas) en los marcadores autorizados', () => {
    const html = readFileSync('dist/en/index.html', 'utf8')
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ') // solo el texto visible, sin atributos ni JSON-LD
    expect(visible).toContain('to be confirmed')
    expect(visible).not.toMatch(/\bP-\d+\b|Public evidence of the factory|Location, time zone and availability/)
  })
  it('Dennys autorizó publicar con P-04, P-06, P-09 y P-22 (2026-10-30) y P-29 mientras la galería esté oculta (2026-10-31)', () => {
    expect([...AUTHORIZED_PENDING].sort()).toEqual(['P-04', 'P-06', 'P-09', 'P-22', 'P-29'])
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
  const IDS = ['code', 'projects', 'demo', 'journey', 'how', 'interest']
  it('seis nodos, mismo orden e ids en los dos idiomas', () => {
    for (const lang of ['en', 'es']) expect(site[lang].home.nodes.map((n) => n.id)).toEqual(IDS)
  })
  it('hay un panel por nodo', () => {
    for (const lang of ['en', 'es']) expect(Object.keys(site[lang].home.panels).sort()).toEqual([...IDS].sort())
  })
  it('las tarjetas de Proyectos, Demo y Trayectoria llevan los textos aprobados del spec', () => {
    const es = site.es.home.panels
    expect(es.projects.title).toBe('Trabajo en producción')
    expect(es.projects.text).toBe('Bot de Telegram para técnicos de un ISP. Sitio de campeonatos infantiles para un cliente.')
    expect(es.demo.title).toBe('Demo en vivo')
    expect(es.demo.text).toBe('Una decisión automatizada, con la regla usada, la explicación y su auditoría.')
    expect(es.journey.title).toBe('De la fibra a la IA')
    expect(es.journey.text).toBe('Siete años en redes de fibra óptica, donde las cosas tienen que funcionar en campo.')
  })
  it('las líneas mono del Hero: 7 años en fibra óptica y perfil confirmado', () => {
    expect(site.es.home.tagline).toEqual(['7 años en fibra óptica', 'Remoto · UTC-5 · Español nativo · Inglés B1'])
    expect(site.en.home.tagline).toEqual(['7 years in fiber optics', 'Remote · UTC-5 · Spanish native · English B1'])
  })
  it('Interés (P-23, respuesta de Dennys 2026-10-31): jiu-jitsu, y triatlón y pistas de obstáculos pocas veces, sin inflar', () => {
    for (const lang of ['en', 'es']) {
      const i = site[lang].home.panels.interest
      expect(i.sports).toEqual(['jiu-jitsu'])
      expect(collectPending(i)).toEqual([])
      expect(i.sportsMore).toMatch(lang === 'es' ? /triatlón/i : /triathlon/i)
      expect(i.sportsMore).toMatch(lang === 'es' ? /pistas de obstáculos/i : /obstacle courses/i)
      expect(i.sportsMore).toMatch(lang === 'es' ? /ciclismo, natación y pista/i : /cycling, swimming and track/i)
      expect(i.sportsMore).toMatch(lang === 'es' ? /pocas veces, no de forma constante/i : /a few times, not consistently/i)
      expect(JSON.stringify(i)).not.toMatch(/competid|compet(e|ing|itor)|campe[oó]n|champion|resultado|result|podio|podium|medall|medal|ranking|\d/i)
    }
  })
  it('Proyectos y Trayectoria (P-24, P-25): se quedan como están, sin marcadores ni sección extra', () => {
    for (const lang of ['en', 'es']) {
      const p = site[lang].projectsPage
      expect(p.ids).toEqual(['caja-cercana', 'super-gol-kids'])
      for (const id of p.ids) expect(site[lang].work.items.map((i) => i.id)).toContain(id)
      expect(p.more).toBeUndefined()
      expect(site[lang].journeyPage.more).toBeUndefined()
    }
  })
  it('cada página interior tiene su propia descripción (no la de la portada)', () => {
    for (const lang of ['en', 'es']) {
      const c = site[lang]
      const d = [c.projectsPage.description, c.journeyPage.description, c.demo.description]
      expect(new Set([...d, c.meta.description]).size).toBe(4)
      for (const t of d) expect(t.length).toBeGreaterThan(40)
      expect(c.journeyPage.description).not.toMatch(/demo/i)
    }
  })
  it('ni "1,719" ni "Ecuador" en ninguna parte del contenido (P-05 cerrada)', () => {
    expect(walk(site).join(' ')).not.toMatch(/1[,.]?719|ecuador/i)
  })
})

describe('galería por fila de Trayectoria (spec §5.1; P-29 resuelto por Dennys el 2026-10-31)', () => {
  it('cuatro filas con su texto real; sin fotos entregadas todavía (llegan en unos días)', () => {
    for (const lang of ['en', 'es']) {
      const rows = site[lang].journeyPage.rows
      expect(rows.map((r) => r.id)).toEqual(['fibra', 'bot', 'supergol', 'ia'])
      for (const r of rows) { expect(r.photos).toEqual([]); expect(r.title.length).toBeGreaterThan(3); expect(r.text.length).toBeGreaterThan(20) }
    }
  })
  it('P-29 queda registrado como pendiente, autorizado y sin rastro visible en las filas', () => {
    for (const lang of ['en', 'es']) {
      const j = site[lang].journeyPage
      expect(isPending(j.photosPending)).toBe(true)
      expect(j.photosPending.id).toBe('P-29')
      expect(collectPending(j.rows)).toEqual([])
    }
  })
  it('no se nombra la empresa de fibra ni se inventan roles ni rutas de imagen', () => {
    for (const lang of ['en', 'es']) {
      const rows = JSON.stringify(site[lang].journeyPage.rows)
      expect(site[lang].journeyPage.rows[0].meta).toEqual([lang === 'es' ? '7 años' : '7 years'])
      expect(rows).not.toMatch(/técnic[oa] de telecom|telecom technician|ingenier|engineer|supervisor|gerente|manager|jefe|empresa por confirmar|company to be confirmed/i)
      expect(rows).not.toMatch(/\.(webp|jpe?g|png)|"src"/)
    }
  })
})
