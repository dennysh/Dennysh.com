// Prerender ES/EN con react-dom/server (spec §8): HTML con el contenido real sin ejecutar JS.
// Uso: después de `vite build`. Escribe /, /en/, /es/, páginas legales, 404 y la capa de máquinas en dist/.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { site } from '../src/content/site.js'
import { headHtml, llmsTxt, resumeJson, robotsTxt, sitemapXml } from './lib/machine.mjs'

// En producción el build se niega a continuar si fallan las compuertas de publicación (marcadores pending y plantillas sin revisar).
if (process.env.NODE_ENV === 'production') {
  try {
    execFileSync(process.execPath, ['scripts/test-static.mjs', 'content', 'explain-review'], { stdio: 'inherit' })
  } catch {
    console.error('Build de producción detenido: las compuertas de publicación fallaron.')
    process.exit(1)
  }
}

const DIST = process.env.OUT_DIR ?? 'dist'
const template = readFileSync(join(DIST, 'index.html'), 'utf8')
const write = (rel, text) => {
  const f = join(DIST, rel)
  mkdirSync(dirname(f), { recursive: true })
  writeFileSync(f, text)
}
const page = ({ lang, head, body }) =>
  template.replace('<html lang="en">', `<html lang="${lang}">`).replace('<!--head-->', head).replace('<!--app-->', body)

const vite = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' })
try {
  const { renderSite, renderLegal, renderNotFound } = await vite.ssrLoadModule('/src/entry-server.jsx')

  for (const lang of ['en', 'es']) {
    const m = site[lang].meta
    const head = headHtml({ lang, path: `/${lang}/`, title: m.title, description: m.description, withAlternates: true, ld: true })
    write(`${lang}/index.html`, page({ lang, head, body: renderSite(lang) }))
    const legal = lang === 'es' ? { privacy: 'privacidad', terms: 'terminos' } : { privacy: 'privacy', terms: 'terms' }
    for (const kind of ['privacy', 'terms']) {
      const label = site[lang].footer[kind]
      const path = `/${lang}/${legal[kind]}/`
      write(`${lang}/${legal[kind]}/index.html`, page({
        lang,
        head: headHtml({ lang, path, title: `${label} — Dennys Heras`, description: m.description }),
        body: renderLegal(lang, kind),
      }))
    }
  }
  // "/" sirve el mismo contenido en inglés y declara canonical a /en/ (AC-33, P-21).
  const en = site.en.meta
  write('index.html', page({
    lang: 'en',
    head: headHtml({ lang: 'en', path: '/', canonical: '/en/', title: en.title, description: en.description, withAlternates: true, ld: true }),
    body: renderSite('en'),
  }))
  write('404.html', page({
    lang: 'en',
    head: headHtml({ lang: 'en', path: '/404.html', title: 'Not found — Dennys Heras', description: en.description, indexable: false }),
    body: renderNotFound('en'),
  }))
} finally {
  await vite.close()
}

write('llms.txt', llmsTxt())
write('dennys.json', JSON.stringify(resumeJson(), null, 2) + '\n')
write('robots.txt', robotsTxt())
write('sitemap.xml', sitemapXml())
mkdirSync(join(DIST, 'demo'), { recursive: true })
copyFileSync('content/ruleset.v1.json', join(DIST, 'demo/ruleset.v1.json'))
copyFileSync('content/explanations/v1.json', join(DIST, 'demo/explanations.v1.json'))
console.log('prerender OK — /, /en/, /es/, legales, 404 y capa de máquinas')
