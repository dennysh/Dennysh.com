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
  it('el único dato numérico personal es "siete años" de fibra óptica (verificado en archivo)', () => {
    const digits = walk(site).join(' ').match(/\b\d{1,4}\b/g) ?? []
    expect(digits.filter((d) => !['2026', '5', '27'].includes(d))).toEqual([])
  })
  it('cada estado de trabajo existe en la tabla de estados', () => {
    for (const lang of ['en', 'es']) for (const it of site[lang].work.items) expect(Object.keys(site[lang].work.status)).toContain(it.status)
  })
  it('la jerarquía es honesta: el bot en producción es el único en producción', () => {
    const prod = site.en.work.items.filter((i) => i.status === 'production')
    expect(prod.map((i) => i.id)).toEqual(['caja-cercana'])
  })
  it('contacto verificado en archivo', () => {
    expect(links.emailAddress).toBe('dennys14_hq@hotmail.com')
    expect(links.linkedin).toContain('dennys-heras-27b0b520b')
    expect(links.github).toBe('https://github.com/dennysh')
  })
  it('los enlaces a repos solo apuntan a github.com/dennysh', () => {
    for (const it of site.en.work.items) if (typeof it.repo === 'string') expect(it.repo).toMatch(/^https:\/\/github\.com\/dennysh\//)
  })
})

describe('rol buscado (P-09, respuesta de Dennys 2026-10-30)', () => {
  it('es una frase honesta de interés, en los dos idiomas, sin marcador', () => {
    for (const lang of ['es', 'en']) {
      const r = site[lang].contact.role
      expect(typeof r).toBe('string')
      expect(r).toMatch(lang === 'es' ? /inteligencia artificial/i : /artificial intelligence/i)
      expect(r).toMatch(lang === 'es' ? /control humano/i : /human control/i)
      expect(r).toMatch(lang === 'es' ? /largo plazo/i : /long term|long-term/i)
      expect(r).toMatch(/cerebro|brain/i)
    }
  })
  it('la visión de IA y cerebro se presenta como interés, nunca como capacidad demostrada', () => {
    for (const lang of ['es', 'en']) {
      const all = walk(site[lang]).join(' ')
      expect(all).not.toMatch(/(constru[ií]|desarroll[eé]|logr[eé]|demostr|built|developed|achieved|proved|demonstrated)[^.]*(cerebro|brain|neuro)/i)
    }
  })
  it('el Hero lleva la primera frase (sin la visión de largo plazo, para que quepa en móvil)', () => {
    for (const lang of ['es', 'en']) {
      const who = site[lang].hero.who
      expect(typeof who[0]).toBe('string')
      expect(who[0]).not.toMatch(/cerebro|brain/i)
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
  it('Dennys autorizó publicar con P-04, P-06, P-09 y P-22 (2026-10-30)', () => {
    expect([...AUTHORIZED_PENDING].sort()).toEqual(['P-04', 'P-06', 'P-09', 'P-22'])
  })
  it('en producción pasa con todos los pending autorizados', () => {
    const r = gate('production')
    expect(r.status).toBe(0)
    expect(r.stdout).toContain('autorizados')
  })
  it('un marcador nuevo sin autorizar se detecta (rompería el build de producción)', () => {
    const list = [{ id: 'P-04' }, { id: 'P-99' }]
    expect(unauthorized(list).map((p) => p.id)).toEqual(['P-99'])
    expect(unauthorized(collectPending())).toEqual([])
  })
})
