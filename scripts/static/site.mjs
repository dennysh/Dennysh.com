// Comprobaciones sobre el sitio construido (dist/). Cada una recibe un lector `read(rel) -> string|null` y devuelve problemas.
import { gzipSync } from 'node:zlib'
import { site, links } from '../../src/content/site.js'
import { SITE_URL, INNER_PAGES, sitemapPaths } from '../lib/machine.mjs'
import { pagePaths } from '../../src/routes.js'

export const SECTION_IDS = ['inicio', 'demo', 'factory', 'governance', 'work', 'skills', 'journey', 'criden', 'contact', 'footer']
const need = (read, rel, problems) => {
  const t = read(rel)
  if (t == null) problems.push(`falta ${rel}`)
  return t
}

export function checkPrerender(read) {
  const problems = []
  for (const [rel, lang] of [['index.html', 'en'], ['en/index.html', 'en'], ['es/index.html', 'es']]) {
    const html = need(read, rel, problems)
    if (html == null) continue
    if (!html.includes(site[lang].hero.thesis)) problems.push(`${rel}: falta la tesis en el HTML (${lang})`)
    for (const s of site[lang].hero.summary) if (!html.includes(s.replace(/&/g, '&amp;'))) problems.push(`${rel}: falta una línea del resumen`)
    for (const id of SECTION_IDS) if (!html.includes(`id="${id}"`)) problems.push(`${rel}: falta la ancla #${id}`)
    if (!new RegExp(`<html lang="${lang}"`).test(html)) problems.push(`${rel}: <html lang> incorrecto`)
  }
  return problems
}

export function checkMachine(read) {
  const problems = []
  for (const [rel, canonical] of [['index.html', '/en/'], ['en/index.html', '/en/'], ['es/index.html', '/es/']]) {
    const html = need(read, rel, problems)
    if (html == null) continue
    if (!html.includes(`<link rel="canonical" href="${SITE_URL}${canonical}" />`)) problems.push(`${rel}: canonical debe ser ${canonical}`)
    for (const l of ['en', 'es', 'x-default']) if (!new RegExp(`hreflang="${l}"`).test(html)) problems.push(`${rel}: falta hreflang ${l}`)
    if (!html.includes(`hreflang="x-default" href="${SITE_URL}/en/"`)) problems.push(`${rel}: x-default debe apuntar a /en/`)
    const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)
    if (!m) problems.push(`${rel}: falta JSON-LD`)
    else {
      try {
        const ld = JSON.parse(m[1])
        const person = ld['@graph']?.find((n) => n['@type'] === 'Person')
        if (!person) problems.push(`${rel}: JSON-LD sin Person`)
        else {
          if (person.email !== links.emailAddress) problems.push(`${rel}: el correo del JSON-LD no coincide con el contenido`)
          if (!person.sameAs?.includes(links.github)) problems.push(`${rel}: JSON-LD sin GitHub`)
        }
        if (!ld['@graph']?.some((n) => n['@type'] === 'ProfilePage')) problems.push(`${rel}: JSON-LD sin ProfilePage`)
      } catch {
        problems.push(`${rel}: JSON-LD no es JSON válido`)
      }
    }
  }
  const llms = need(read, 'llms.txt', problems)
  if (llms && !/^# Dennys Heras/m.test(llms)) problems.push('llms.txt sin título')
  if (llms && !llms.includes(`${SITE_URL}/demo/ruleset.v1.json`)) problems.push('llms.txt sin enlace al ruleset')
  const res = need(read, 'dennys.json', problems)
  if (res) {
    try {
      const j = JSON.parse(res)
      if (j.basics?.email !== links.emailAddress) problems.push('dennys.json: correo distinto del contenido')
    } catch { problems.push('dennys.json no es JSON válido') }
  }
  const robots = need(read, 'robots.txt', problems)
  if (robots && !robots.includes('Sitemap: https://dennysh.com/sitemap.xml')) problems.push('robots.txt sin Sitemap')
  const map = need(read, 'sitemap.xml', problems)
  if (map) {
    const locs = [...map.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1])
    const expected = sitemapPaths().flatMap((pair) => [`${SITE_URL}${pair.en}`, `${SITE_URL}${pair.es}`])
    if (JSON.stringify(locs) !== JSON.stringify(expected)) problems.push(`sitemap.xml debe listar el inicio y las páginas nuevas en en/es (hay: ${locs.join(', ')})`)
  }
  // Páginas interiores: canonical propio, hreflang en/es/x-default (x-default = inglés) y contenido en el HTML.
  for (const { view } of INNER_PAGES) {
    for (const lang of ['en', 'es']) {
      const path = pagePaths[lang][view]
      const rel = `${path.slice(1)}index.html`
      const html = need(read, rel, problems)
      if (html == null) continue
      if (!html.includes(`<link rel="canonical" href="${SITE_URL}${path}" />`)) problems.push(`${rel}: canonical debe ser ${path}`)
      for (const l of ['en', 'es']) if (!html.includes(`hreflang="${l}" href="${SITE_URL}${pagePaths[l][view]}"`)) problems.push(`${rel}: falta hreflang ${l}`)
      if (!html.includes(`hreflang="x-default" href="${SITE_URL}${pagePaths.en[view]}"`)) problems.push(`${rel}: x-default debe apuntar a ${pagePaths.en[view]}`)
      if (!/<h1\b/.test(html)) problems.push(`${rel}: sin contenido (falta el h1)`)
    }
  }
  return problems
}

export function checkLegal(read) {
  const problems = []
  const must = {
    'en/privacy/index.html': [/HMAC/, /Turnstile/, /Telegram/, /24 hours/],
    'es/privacidad/index.html': [/HMAC/, /Turnstile/, /Telegram/, /24 horas/],
    'en/terms/index.html': [/simulation/i],
    'es/terminos/index.html': [/simulaci[oó]n/i],
  }
  for (const [rel, res] of Object.entries(must)) {
    const html = need(read, rel, problems)
    if (html != null) for (const re of res) if (!re.test(html)) problems.push(`${rel}: falta la mención ${re}`)
  }
  if (need(read, '404.html', problems) != null && !/404/.test(read('404.html'))) problems.push('404.html sin contenido')
  return problems
}

export function checkStaticExample(read) {
  const problems = []
  for (const [rel, label] of [[`${pagePaths.en.demo.slice(1)}index.html`, 'not a real send'], [`${pagePaths.es.demo.slice(1)}index.html`, 'no es un envío real']]) {
    const html = need(read, rel, problems)
    if (html == null) continue
    const m = /<noscript>([\s\S]*?)<\/noscript>/.exec(html)
    if (!m) { problems.push(`${rel}: falta el ejemplo estático en <noscript>`); continue }
    if (!m[1].toLowerCase().includes(label)) problems.push(`${rel}: el ejemplo estático no está etiquetado como no real`)
    if (/entregada|delivered to/i.test(m[1])) problems.push(`${rel}: el ejemplo estático afirma una entrega`)
  }
  return problems
}

export function checkSvg(read) {
  const problems = []
  for (const rel of ['en/index.html', 'es/index.html']) {
    const html = need(read, rel, problems)
    if (html == null) continue
    const m = /<svg[^>]*class="diagram"[\s\S]*?<\/svg>/.exec(html)
    if (!m) { problems.push(`${rel}: falta el diagrama SVG`); continue }
    if (!/<title[^>]*>[^<]+<\/title>/.test(m[0])) problems.push(`${rel}: SVG sin <title>`)
    if (!/<desc[^>]*>[^<]+<\/desc>/.test(m[0])) problems.push(`${rel}: SVG sin <desc>`)
    if (!/role="img"/.test(m[0]) || !/aria-labelledby=/.test(m[0])) problems.push(`${rel}: SVG sin role/aria-labelledby`)
    const text = m[0].replace(/<[^>]+>/g, ' ')
    if (/\d/.test(text)) problems.push(`${rel}: el SVG contiene cifras`)
  }
  return problems
}

export function checkFonts(files) {
  return files.filter(({ text }) => /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(text)).map(({ path }) => `${path}: referencia a un dominio de fuentes externo`)
}

export const JS_BUDGET_GZIP = 150 * 1024
export function checkBudget(read, readBuffer) {
  const problems = []
  const html = need(read, 'en/index.html', problems)
  if (html == null) return problems
  const scripts = [...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((m) => m[1].replace(/^\//, ''))
  const preloads = [...html.matchAll(/<link rel="modulepreload"[^>]+href="([^"]+)"/g)].map((m) => m[1].replace(/^\//, ''))
  let total = 0
  for (const rel of [...new Set([...scripts, ...preloads])]) {
    const buf = readBuffer(rel)
    if (!buf) problems.push(`falta ${rel}`)
    else total += gzipSync(buf).length
  }
  if (!scripts.length) problems.push('no se encontró el script inicial')
  if (total > JS_BUDGET_GZIP) problems.push(`JS inicial ${(total / 1024).toFixed(1)} KB gzip supera 150 KB`)
  return problems
}

// CSP sin 'unsafe-inline' (regla 24): nada de style="…" ni de <script> en línea (el JSON-LD es un bloque de datos y no cuenta),
// y ningún dominio externo de fuentes o iconos (reglas 24 y 25).
const withoutScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/g, '')
export function checkMarkup(files) {
  const problems = []
  for (const { path, text } of files) {
    if (/\sstyle\s*=\s*["']/i.test(withoutScripts(text))) problems.push(`${path}: atributo style en línea (la CSP lo bloquea)`)
    if (/<script\b(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/i.test(text)) problems.push(`${path}: <script> en línea (la CSP lo bloquea)`)
    if (/fonts\.googleapis\.com|fonts\.gstatic\.com|material-?symbols|fontawesome|typekit/i.test(text)) problems.push(`${path}: dominio externo de fuentes o iconos`)
  }
  return problems
}

// Las reglas de trabajo `public: false` no pueden aparecer en nada de lo publicado (JS, HTML, llms.txt, dennys.json).
export function checkNoHiddenRules(files, rules) {
  const hidden = rules.filter((r) => !r.public)
  const problems = []
  for (const { path, text } of files) {
    for (const r of hidden) {
      for (const t of [r.es, r.en]) if (text.includes(t)) problems.push(`${path}: contiene el texto de la regla interna ${r.id}`)
      if (new RegExp(`(?<![\\w-])${r.id}(?![\\w-])`).test(text)) problems.push(`${path}: contiene el id de la regla interna ${r.id}`)
    }
    if (/public:\s*!1|"public"\s*:\s*false/.test(text)) problems.push(`${path}: contiene una bandera public:false`)
  }
  return problems
}

// Los seis nodos de la primera pantalla llevan icono SVG en línea, oculto a lectores de pantalla, con trazo de 1,5 px.
export function checkNodeIcons(rel, html) {
  const icons = [...html.matchAll(/<svg\b[^>]*class="node-icon"[^>]*>/g)].map((m) => m[0])
  const problems = []
  if (icons.length !== 6) problems.push(`${rel}: se esperaban 6 iconos de nodo y hay ${icons.length}`)
  for (const i of icons) {
    if (!/aria-hidden="true"/.test(i)) problems.push(`${rel}: un icono de nodo no es aria-hidden`)
    if (!/stroke-width="1\.5"/.test(i)) problems.push(`${rel}: un icono de nodo no tiene trazo de 1,5`)
  }
  return problems
}

// Nada de marcadores a la vista del visitante: ni ids P-<n>, ni "TU FOTO"/"EMPRESA", ni la palabra "pending", ni pistas internas [... · P-n].
// El JSON-LD y los atributos (data-pending) no son texto visible. Las etiquetas autorizadas ("por confirmar") sí pueden verse.
export function checkVisibleMarkers(files) {
  const problems = []
  for (const { path, text } of files) {
    const visible = text.replace(/<script\b[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
    if (/\bP-\d+\b/.test(visible)) problems.push(`${path}: se ve un id de marcador (P-<n>)`)
    if (/TU FOTO|EMPRESA/.test(visible)) problems.push(`${path}: se ve un marcador de foto o de empresa`)
    // "pending review" es el rótulo honesto de las plantillas sin revisar (AC-23), no un marcador.
    if (/\bpending\b(?!\s+(human\s+)?review)/i.test(visible)) problems.push(`${path}: se ve la palabra "pending"`)
  }
  return problems
}
