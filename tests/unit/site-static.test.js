import { describe, it, expect } from 'vitest'
import { checkPrerender, checkMachine, checkLegal, checkStaticExample, checkSvg, checkFonts, checkBudget } from '../../scripts/static/site.mjs'
import { sitemapXml, llmsTxt, headHtml, INNER_PAGES } from '../../scripts/lib/machine.mjs'
import { pagePaths } from '../../src/routes.js'
import { site } from '../../src/content/site.js'

const reader = (files) => (rel) => files[rel] ?? null

describe('prerender del inicio limpio (AC-02, correcciones 1 C4)', () => {
  const NODES = ['code', 'projects', 'demo', 'journey', 'how', 'interest']
  const good = (lang) => `<html lang="${lang}"><body><section id="inicio"><h1 id="hero-h">${site[lang].home.phrase}</h1>${NODES.map((n) => `<a class="node-link" data-node="${n}" href="${pagePaths[lang][n]}">x</a>`).join('')}</section><script type="application/ld+json">{"email":"dennys@dennysh.com"}</script></body>`
  const files = { 'index.html': good('en'), 'en/index.html': good('en'), 'es/index.html': good('es') }
  it('pasa con la frase única como h1, los seis nodos hacia sus páginas y el correo solo en el JSON-LD', () => expect(checkPrerender(reader(files))).toEqual([]))
  it('falla si falta la frase', () => expect(checkPrerender(reader({ ...files, 'es/index.html': files['es/index.html'].replace(site.es.home.phrase, 'otra') })).join(' ')).toMatch(/frase única/))
  it('falla si hay dos h1 (por ejemplo el titular que se eliminó)', () => {
    expect(checkPrerender(reader({ ...files, 'en/index.html': files['en/index.html'].replace('</section>', '<h1>Titular</h1></section>') })).join(' ')).toMatch(/un solo h1/)
  })
  it('falla si el enlace del propio nodo pierde su href aunque el botón del panel lo repita', () => {
    const html = files['en/index.html'].replace(`<a class="node-link" data-node="interest" href="${pagePaths.en.interest}">x</a>`, `<a class="node-link" data-node="interest">x</a><a href="${pagePaths.en.interest}">Open</a>`)
    expect(checkPrerender(reader({ ...files, 'en/index.html': html })).join(' ')).toMatch(/nodo interest/)
  })
  it('falla si falta un nodo o apunta a otra ruta', () => {
    expect(checkPrerender(reader({ ...files, 'en/index.html': files['en/index.html'].replace('data-node="how"', 'data-node="otro"') })).join(' ')).toMatch(/nodo how/)
    expect(checkPrerender(reader({ ...files, 'es/index.html': files['es/index.html'].replace(pagePaths.es.interest, '#p-interest') })).join(' ')).toMatch(/nodo interest/)
  })
  it('falla si el inicio vuelve a llevar una sección larga, el pie o el correo a la vista', () => {
    for (const id of ['demo', 'factory', 'governance', 'work', 'skills', 'journey', 'criden', 'contact', 'footer']) {
      expect(checkPrerender(reader({ ...files, 'en/index.html': files['en/index.html'].replace('<section id="inicio">', `<section id="${id}"></section><section id="inicio">`) })).join(' '), id).toContain(`#${id}`)
    }
    expect(checkPrerender(reader({ ...files, 'en/index.html': files['en/index.html'].replace('</section>', '<a href="mailto:dennys@dennysh.com">dennys@dennysh.com</a></section>') })).join(' ')).toMatch(/correo/)
  })
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
  it('las páginas son exactamente estas siete (una por nodo y Contacto), con estas rutas (no se derivan de la misma lista que se verifica)', () => {
    expect(INNER_PAGES.map((p) => p.view)).toEqual(['code', 'projects', 'demo', 'journey', 'how', 'interest', 'contact'])
    expect(pagePaths).toEqual({
      en: { code: '/en/code/', projects: '/en/projects/', demo: '/en/demo/', journey: '/en/journey/', how: '/en/how-i-work/', interest: '/en/interest/', contact: '/en/contact/' },
      es: { code: '/es/codigo/', projects: '/es/proyectos/', demo: '/es/demo/', journey: '/es/trayectoria/', how: '/es/como-trabajo/', interest: '/es/interes/', contact: '/es/contacto/' },
    })
    const locs = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace('https://dennysh.com', ''))
    expect(locs).toEqual(['/en/', '/es/', '/en/code/', '/es/codigo/', '/en/projects/', '/es/proyectos/', '/en/demo/', '/es/demo/', '/en/journey/', '/es/trayectoria/', '/en/how-i-work/', '/es/como-trabajo/', '/en/interest/', '/es/interes/', '/en/contact/', '/es/contacto/'])
  })
  it('cada <url> del sitemap declara su x-default hacia la versión en inglés', () => {
    const bad = sitemapXml().replace(/(<loc>https:\/\/dennysh\.com\/es\/<\/loc>[\s\S]*?hreflang="x-default" href=")[^"]*/, '$1https://dennysh.com/es/')
    expect(checkMachine(reader({ ...files, 'sitemap.xml': bad })).join(' ')).toMatch(/x-default/)
  })
  it('el sitemap lista el inicio y las siete páginas en los dos idiomas (AC-H8)', () => {
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
    'en/privacy/index.html': 'HMAC Turnstile Telegram 24 hours contact form 25 hours', 'es/privacidad/index.html': 'HMAC Turnstile Telegram 24 horas formulario de contacto 25 horas',
    'en/terms/index.html': 'This is a simulation', 'es/terminos/index.html': 'es una simulación', '404.html': '404',
  }
  it('pasa con las menciones', () => expect(checkLegal(reader(files))).toEqual([]))
  it('falla si privacidad no menciona la retención de 24 h', () => {
    expect(checkLegal(reader({ ...files, 'en/privacy/index.html': 'HMAC Turnstile Telegram' })).length).toBeGreaterThan(0)
  })
  it('falla si privacidad no declara el formulario de contacto ni sus 25 h de límites', () => {
    expect(checkLegal(reader({ ...files, 'en/privacy/index.html': 'HMAC Turnstile Telegram 24 hours' })).length).toBeGreaterThan(0)
    expect(checkLegal(reader({ ...files, 'es/privacidad/index.html': 'HMAC Turnstile Telegram 24 horas formulario de contacto' })).length).toBeGreaterThan(0)
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
  const how = { en: `${pagePaths.en.how.slice(1)}index.html`, es: `${pagePaths.es.how.slice(1)}index.html` }
  const svg = (inner) => `<svg class="diagram" role="img" aria-labelledby="a b">${inner}</svg>`
  it('SVG con título y descripción pasa; sin ellos o con cifras falla', () => {
    const ok = svg('<title id="a">Diagrama</title><desc id="b">Cinco pasos</desc><text>Orquestador</text>')
    expect(checkSvg(reader({ [how.en]: ok, [how.es]: ok }))).toEqual([])
    expect(checkSvg(reader({ [how.en]: svg('<text>x</text>'), [how.es]: ok })).length).toBeGreaterThan(0)
    expect(checkSvg(reader({ [how.en]: svg('<title id="a">t</title><desc id="b">d</desc><text>99%</text>'), [how.es]: ok })).length).toBe(1)
    expect(checkSvg(reader({ 'en/index.html': ok, 'es/index.html': ok })).length).toBe(2) // el diagrama vive en Cómo trabajo, no en el inicio
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
