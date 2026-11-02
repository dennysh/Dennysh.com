// Rutas del sitio, compartidas por el prerender (servidor) y la hidratación (cliente).
// Cada nodo de la primera pantalla es una página propia (correcciones 1, C2).
export const pagePaths = {
  en: { code: '/en/code/', projects: '/en/projects/', demo: '/en/demo/', journey: '/en/journey/', how: '/en/how-i-work/', interest: '/en/interest/', contact: '/en/contact/' },
  es: { code: '/es/codigo/', projects: '/es/proyectos/', demo: '/es/demo/', journey: '/es/trayectoria/', how: '/es/como-trabajo/', interest: '/es/interes/', contact: '/es/contacto/' },
}
export const legalPaths = { en: { privacy: '/en/privacy/', terms: '/en/terms/' }, es: { privacy: '/es/privacidad/', terms: '/es/terminos/' } }

const norm = (p) => (p.endsWith('/') ? p : `${p}/`)

const HOMES = { '/': 'en', '/index.html/': 'en', '/en/': 'en', '/es/': 'es' }

// pathname → { lang, view }. Una ruta desconocida es la 404, que se prerenderiza en inglés: se hidrata igual para no mezclar árboles.
export function resolveView(pathname) {
  const path = norm(pathname)
  if (HOMES[path]) return { lang: HOMES[path], view: 'home' }
  for (const l of ['en', 'es']) {
    for (const [view, p] of Object.entries(pagePaths[l])) if (p === path) return { lang: l, view }
    for (const [view, p] of Object.entries(legalPaths[l])) if (p === path) return { lang: l, view }
  }
  return { lang: 'en', view: 'notfound' }
}

// Los mensajes de Telegram enviados antes de mover la demo apuntan a /es/?evento=…: se reenvían a la página de la demo.
export function legacyEventTarget(pathname, search) {
  const { lang, view } = resolveView(pathname)
  if (view !== 'home' || !new URLSearchParams(search).has('evento')) return null
  return `${pagePaths[lang].demo}${search}`
}

// Misma página en el otro idioma (para el enlace de idioma y los hreflang).
export function alternateOf(lang, view) {
  const other = lang === 'es' ? 'en' : 'es'
  if (pagePaths[other][view]) return pagePaths[other][view]
  if (legalPaths[other][view]) return legalPaths[other][view]
  return `/${other}/`
}
