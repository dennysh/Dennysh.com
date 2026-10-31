// Rutas del sitio, compartidas por el prerender (servidor) y la hidratación (cliente).
export const pagePaths = {
  en: { projects: '/en/projects/', journey: '/en/journey/', demo: '/en/demo/' },
  es: { projects: '/es/proyectos/', journey: '/es/trayectoria/', demo: '/es/demo/' },
}
export const legalPaths = { en: { privacy: '/en/privacy/', terms: '/en/terms/' }, es: { privacy: '/es/privacidad/', terms: '/es/terminos/' } }

const norm = (p) => (p.endsWith('/') ? p : `${p}/`)

// pathname → { lang, view }. Cualquier cosa desconocida cae en el inicio de su idioma.
export function resolveView(pathname) {
  const path = norm(pathname)
  const lang = path.startsWith('/es/') ? 'es' : 'en'
  for (const l of ['en', 'es']) {
    for (const [view, p] of Object.entries(pagePaths[l])) if (p === path) return { lang: l, view }
    for (const [view, p] of Object.entries(legalPaths[l])) if (p === path) return { lang: l, view }
  }
  return { lang, view: 'home' }
}

// Misma página en el otro idioma (para el enlace de idioma y los hreflang).
export function alternateOf(lang, view) {
  const other = lang === 'es' ? 'en' : 'es'
  if (pagePaths[other][view]) return pagePaths[other][view]
  if (legalPaths[other][view]) return legalPaths[other][view]
  return `/${other}/`
}
