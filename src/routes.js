// Rutas del sitio, compartidas por el prerender (servidor) y la hidratación (cliente).
// La vista `interest` es la página «Sobre mí» / «About me» (antes «Interés»): conserva el id interno; solo cambian rótulos y rutas.
// Cada nodo de la primera pantalla es una página propia (correcciones 1, C2).
export const pagePaths = {
  en: { code: '/en/code/', projects: '/en/projects/', journey: '/en/journey/', how: '/en/how-i-work/', interest: '/en/about/', contact: '/en/contact/' },
  es: { code: '/es/codigo/', projects: '/es/proyectos/', journey: '/es/trayectoria/', how: '/es/como-trabajo/', interest: '/es/sobre-mi/', contact: '/es/contacto/' },
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

// «Interés» pasó a «Sobre mí» (2026-11-14). En Cloudflare Pages las rutas viejas redirigen con 301 desde public/_redirects; esta tabla es
// el respaldo del cliente (vista previa local, pruebas e2e) y debe coincidir con ese archivo (lo comprueba tests/unit/routes.test.js).
export const RENAMED = { '/en/interest/': '/en/about/', '/es/interes/': '/es/sobre-mi/' }

// La demo ya no existe en el sitio. Los mensajes de Telegram enviados antes apuntan a /es/?evento=… (o a /es/demo/?evento=…, que ahora
// es la 404): ambos se reenvían a la portada del mismo idioma, sin la consulta.
const OLD_DEMO = { '/en/demo/': 'en', '/es/demo/': 'es' }
export function legacyEventTarget(pathname, search) {
  const path = norm(pathname)
  if (RENAMED[path]) return RENAMED[path]
  if (OLD_DEMO[path]) return `/${OLD_DEMO[path]}/`
  const { lang, view } = resolveView(pathname)
  if (view !== 'home' || !new URLSearchParams(search).has('evento')) return null
  return `/${lang}/`
}

// Misma página en el otro idioma (para el enlace de idioma y los hreflang).
export function alternateOf(lang, view) {
  const other = lang === 'es' ? 'en' : 'es'
  if (pagePaths[other][view]) return pagePaths[other][view]
  if (legalPaths[other][view]) return legalPaths[other][view]
  return `/${other}/`
}
