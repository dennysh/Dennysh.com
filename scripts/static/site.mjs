// Comprobaciones sobre el sitio construido (dist/). Cada una recibe un lector `read(rel) -> string|null` y devuelve problemas.
import { gzipSync } from 'node:zlib'
import { site, links } from '../../src/content/site.js'
import { SITE_URL } from '../lib/machine.mjs'

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
    if (JSON.stringify(locs) !== JSON.stringify([`${SITE_URL}/en/`, `${SITE_URL}/es/`])) problems.push(`sitemap.xml debe listar solo /en/ y /es/ (hay: ${locs.join(', ')})`)
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
  for (const [rel, label] of [['en/index.html', 'not a real send'], ['es/index.html', 'no es un envío real']]) {
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
