import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { site, collectPending, isPending, pending, AUTHORIZED_PENDING, links } from '../../src/content/site.js'

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
  it('en producción falla mientras haya pending no autorizados y los nombra', () => {
    expect(AUTHORIZED_PENDING).toEqual([])
    const r = gate('production')
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('P-04')
    expect(r.stderr).toContain('P-06')
  })
})
