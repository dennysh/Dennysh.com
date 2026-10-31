import { describe, it, expect } from 'vitest'
import { checkPrerender, checkMachine, checkLegal, checkStaticExample, checkSvg, checkFonts, checkBudget, SECTION_IDS } from '../../scripts/static/site.mjs'
import { sitemapXml, llmsTxt, headHtml, INNER_PAGES } from '../../scripts/lib/machine.mjs'
import { pagePaths } from '../../src/routes.js'
import { site } from '../../src/content/site.js'

const reader = (files) => (rel) => files[rel] ?? null

describe('prerender (AC-02)', () => {
  const good = (lang) => `<html lang="${lang}"><body>${site[lang].hero.thesis} ${site[lang].hero.summary.join(' ').replace(/&/g, '&amp;')} ${SECTION_IDS.map((i) => `<s id="${i}">`).join('')}</body>`
  const files = { 'index.html': good('en'), 'en/index.html': good('en'), 'es/index.html': good('es') }
  it('pasa con el texto de la tesis, el resumen y las 10 anclas', () => expect(checkPrerender(reader(files))).toEqual([]))
  it('falla si falta la tesis', () => expect(checkPrerender(reader({ ...files, 'es/index.html': '<html lang="es">' })).length).toBeGreaterThan(0))
  it('falla si falta una ancla', () => expect(checkPrerender(reader({ ...files, 'en/index.html': files['en/index.html'].replace('id="work"', '') }))).toContainEqual(expect.stringContaining('#work')))
})

describe('capa de máquinas (AC-15, AC-33)', () => {
  const page = (lang, canonical) => `<html>${headHtml({ lang, path: `/${lang}/`, canonical, title: 't', description: 'd', withAlternates: true, ld: true })}</html>`
  const files = {
    'index.html': page('en', '/en/'), 'en/index.html': page('en', '/en/'), 'es/index.html': page('es', '/es/'),
    ...Object.fromEntries(INNER_PAGES.flatMap(({ view }) => ['en', 'es'].map((lang) => [`${pagePaths[lang][view].slice(1)}index.html`, `<html>${headHtml({ lang, path: pagePaths[lang][view], title: 't', description: 'd', alternates: { en: pagePaths.en[view], es: pagePaths.es[view] } })}<h1>x</h1></html>`]))),
    'llms.txt': llmsTxt(), 'dennys.json': JSON.stringify({ basics: { email: 'dennys@dennysh.com' } }),
    'robots.txt': 'Sitemap: https://dennysh.com/sitemap.xml', 'sitemap.xml': sitemapXml(),
  }
  it('pasa con los archivos generados', () => expect(checkMachine(reader(files))).toEqual([]))
  it('falla si "/" no apunta su canonical a /en/', () => {
    expect(checkMachine(reader({ ...files, 'index.html': page('en', '/') }))).toContainEqual(expect.stringContaining('canonical'))
  })
  it('falla si falta hreflang x-default', () => {
    expect(checkMachine(reader({ ...files, 'en/index.html': files['en/index.html'].replace('hreflang="x-default"', 'hreflang="zz"') })).length).toBeGreaterThan(0)
  })
  it('el sitemap lista el inicio y las tres páginas nuevas en los dos idiomas (AC-H8)', () => {
    const locs = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(locs).toEqual(['https://dennysh.com/en/', 'https://dennysh.com/es/', ...INNER_PAGES.flatMap(({ view }) => ['en', 'es'].map((l) => `https://dennysh.com${pagePaths[l][view]}`))])
  })
  it('falla si una página nueva no existe, no tiene canonical propio o no apunta su x-default a la versión en inglés', () => {
    const k = `${pagePaths.es.projects.slice(1)}index.html`
    const { [k]: _gone, ...rest } = files
    expect(checkMachine(reader(rest))).toContainEqual(expect.stringContaining('falta'))
    expect(checkMachine(reader({ ...files, [k]: files[k].replace(/<link rel="canonical"[^>]*>/, '<link rel="canonical" href="https://dennysh.com/es/" />') }))).toContainEqual(expect.stringContaining('canonical'))
    expect(checkMachine(reader({ ...files, [k]: files[k].replace('hreflang="x-default"', 'hreflang="zz"') })).length).toBeGreaterThan(0)
  })
  it('falla si el sitemap lista algo fuera de la lista esperada', () => {
    expect(checkMachine(reader({ ...files, 'sitemap.xml': sitemapXml().replace('</urlset>', '<url><loc>https://dennysh.com/</loc></url></urlset>') })).length).toBeGreaterThan(0)
  })
  it('falla con JSON-LD roto o con otro correo', () => {
    expect(checkMachine(reader({ ...files, 'en/index.html': files['en/index.html'].replace(/\{"@context".*?<\/script>/s, '{rota</script>') })).length).toBeGreaterThan(0)
    expect(checkMachine(reader({ ...files, 'dennys.json': JSON.stringify({ basics: { email: 'otro@x.com' } }) })).length).toBeGreaterThan(0)
  })
})

describe('perfil en datos de máquina (idiomas)', () => {
  it('JSON-LD y dennys.json declaran español nativo e inglés B1', async () => {
    const { jsonLd, resumeJson } = await import('../../scripts/lib/machine.mjs')
    const person = jsonLd('en')['@graph'].find((n) => n['@type'] === 'Person')
    expect(person.knowsLanguage).toEqual(['es', 'en'])
    const langs = resumeJson().languages
    expect(langs).toEqual([{ language: 'Spanish', fluency: 'Native speaker' }, { language: 'English', fluency: 'B1' }])
  })
})

describe('legales (AC-31)', () => {
  const files = {
    'en/privacy/index.html': 'HMAC Turnstile Telegram 24 hours', 'es/privacidad/index.html': 'HMAC Turnstile Telegram 24 horas',
    'en/terms/index.html': 'This is a simulation', 'es/terminos/index.html': 'es una simulación', '404.html': '404',
  }
  it('pasa con las menciones', () => expect(checkLegal(reader(files))).toEqual([]))
  it('falla si privacidad no menciona la retención de 24 h', () => {
    expect(checkLegal(reader({ ...files, 'en/privacy/index.html': 'HMAC Turnstile Telegram' })).length).toBeGreaterThan(0)
  })
  it('falla si falta la página 404', () => expect(checkLegal(reader({ ...files, '404.html': undefined })).length).toBeGreaterThan(0))
})

describe('ejemplo estático (AC-29) y SVG', () => {
  const ex = (label, extra = '') => `<noscript>${label} ${extra}</noscript>`
  it('pasa etiquetado y sin entrega', () => {
    expect(checkStaticExample(reader({ 'en/demo/index.html': ex('Static example, not a real send'), 'es/demo/index.html': ex('Ejemplo estático, no es un envío real') }))).toEqual([])
  })
  it('falla si afirma entrega o no está etiquetado', () => {
    expect(checkStaticExample(reader({ 'en/demo/index.html': ex('Static example, not a real send', 'Delivered to Telegram'), 'es/demo/index.html': ex('Ejemplo estático, no es un envío real') })).length).toBe(1)
    expect(checkStaticExample(reader({ 'en/demo/index.html': ex('hola'), 'es/demo/index.html': ex('Ejemplo estático, no es un envío real') })).length).toBe(1)
  })
  const svg = (inner) => `<svg class="diagram" role="img" aria-labelledby="a b">${inner}</svg>`
  it('SVG con título y descripción pasa; sin ellos o con cifras falla', () => {
    const ok = svg('<title id="a">Diagrama</title><desc id="b">Cinco pasos</desc><text>Orquestador</text>')
    expect(checkSvg(reader({ 'en/index.html': ok, 'es/index.html': ok }))).toEqual([])
    expect(checkSvg(reader({ 'en/index.html': svg('<text>x</text>'), 'es/index.html': ok })).length).toBeGreaterThan(0)
    expect(checkSvg(reader({ 'en/index.html': svg('<title id="a">t</title><desc id="b">d</desc><text>99%</text>'), 'es/index.html': ok })).length).toBe(1)
  })
})

describe('fuentes propias y presupuesto (T079, T088)', () => {
  it('detecta dominios de fuentes externos', () => {
    expect(checkFonts([{ path: 'a.css', text: '@import url(https://fonts.googleapis.com/x)' }]).length).toBe(1)
    expect(checkFonts([{ path: 'a.css', text: 'font-family: system-ui' }])).toEqual([])
  })
  it('JS inicial dentro de presupuesto pasa; uno enorme falla', () => {
    const html = '<script type="module" crossorigin src="/assets/a.js"></script>'
    const big = Buffer.from(Array.from({ length: 800_000 }, () => Math.random().toString(36)[2]).join(''))
    expect(checkBudget(reader({ 'en/index.html': html }), () => Buffer.from('x'.repeat(1000)))).toEqual([])
    expect(checkBudget(reader({ 'en/index.html': html }), () => big).length).toBe(1)
  })
})
