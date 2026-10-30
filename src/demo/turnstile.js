// Turnstile con carga diferida: el script de Cloudflare solo se pide cuando alguien pulsa el botón (CSP: script-src challenges.cloudflare.com).
const SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading

function load() {
  loading ??= new Promise((resolve, reject) => {
    if (globalThis.turnstile) return resolve()
    const s = document.createElement('script')
    s.src = SRC
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(s)
  })
  return loading
}

export function createTokenGetter(sitekey, container) {
  return async function getToken() {
    if (!sitekey) return 'dev-no-widget' // entorno local sin clave: el servidor en modo prueba usa la clave de prueba
    await load()
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), 15000)
      const id = globalThis.turnstile.render(container(), {
        sitekey,
        size: 'flexible',
        callback: (token) => { clearTimeout(timer); globalThis.turnstile.remove(id); resolve(token) },
        'error-callback': () => { clearTimeout(timer); reject(new Error('turnstile')) },
      })
    })
  }
}
