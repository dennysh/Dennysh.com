import { describe, it, expect } from 'vitest'
import { resolveView, alternateOf, legacyEventTarget, pagePaths, legalPaths } from '../../src/routes.js'

describe('resolveView (hallazgo: la 404 hidrataba el árbol de la portada)', () => {
  it.each([
    ['/', 'en', 'home'], ['/en/', 'en', 'home'], ['/es/', 'es', 'home'], ['/es', 'es', 'home'], ['/en', 'en', 'home'], ['/index.html', 'en', 'home'],
    ['/en/projects/', 'en', 'projects'], ['/es/proyectos', 'es', 'projects'], ['/en/journey/', 'en', 'journey'], ['/es/trayectoria/', 'es', 'journey'],
    ['/en/code/', 'en', 'code'], ['/es/codigo/', 'es', 'code'], ['/en/how-i-work/', 'en', 'how'], ['/es/como-trabajo', 'es', 'how'],
    ['/en/interest/', 'en', 'interest'], ['/es/interes/', 'es', 'interest'], ['/en/contact/', 'en', 'contact'], ['/es/contacto', 'es', 'contact'], ['/en/privacy/', 'en', 'privacy'], ['/es/terminos/', 'es', 'terms'],
  ])('%s → %s/%s', (path, lang, view) => expect(resolveView(path)).toEqual({ lang, view }))
  it.each(['/404.html', '/zzz/', '/es/zzz/', '/en/projects/x/', '/EN/', '/en/Demo/', '/en/demo/', '/es/demo/', '/es/demo', '/es/privacy/', '/en/howiwork/', '/en/como-trabajo/', '/es/code/', '/en/contacto/'])('%s es una página no encontrada y se hidrata como la 404 prerenderizada (inglés)', (path) => {
    expect(resolveView(path)).toEqual({ lang: 'en', view: 'notfound' })
  })
})

describe('alternateOf', () => {
  it('lleva a la misma página en el otro idioma', () => {
    expect(alternateOf('en', 'projects')).toBe(pagePaths.es.projects)
    expect(alternateOf('es', 'journey')).toBe(pagePaths.en.journey)
    expect(alternateOf('en', 'home')).toBe('/es/')
  })
  it.each(['code', 'projects', 'journey', 'how', 'interest', 'contact'])('cada pareja de %s se resuelve de ida y vuelta', (view) => {
    for (const lang of ['en', 'es']) {
      expect(resolveView(alternateOf(lang, view))).toEqual({ lang: lang === 'en' ? 'es' : 'en', view })
      expect(pagePaths[lang][view]).toMatch(/^\/(en|es)\/[a-z-]+\/$/)
    }
  })
  it('las dieciséis rutas son distintas entre sí y de las legales, y ya no hay ruta de demo', () => {
    const all = ['en', 'es'].flatMap((l) => [...Object.values(pagePaths[l]), ...Object.values(legalPaths[l])])
    expect(all).toHaveLength(16)
    expect(new Set(all).size).toBe(16)
    expect(all.some((p) => /demo/.test(p))).toBe(false)
    for (const l of ['en', 'es']) expect(pagePaths[l]).not.toHaveProperty('demo')
  })
})

describe('legacyEventTarget (enlaces de Telegram enviados cuando la demo existía)', () => {
  it('?evento= en el inicio redirige a la portada del mismo idioma, sin la consulta', () => {
    expect(legacyEventTarget('/es/', '?evento=ab.cd')).toBe('/es/')
    expect(legacyEventTarget('/en/', '?evento=ab.cd')).toBe('/en/')
  })
  it('la antigua /es/demo/ y /en/demo/ (con o sin ?evento=) llevan a la portada de su idioma, no a una 404', () => {
    expect(legacyEventTarget('/es/demo/', '?evento=ab.cd')).toBe('/es/')
    expect(legacyEventTarget('/en/demo', '?evento=ev_x-1')).toBe('/en/')
    expect(legacyEventTarget('/es/demo/', '')).toBe('/es/')
  })
  it('sin ?evento=, o en otra página, no redirige', () => {
    expect(legacyEventTarget('/es/', '')).toBeNull()
    expect(legacyEventTarget('/es/', '?x=1')).toBeNull()
    expect(legacyEventTarget('/es/privacidad/', '?evento=ab.cd')).toBeNull()
  })
})
