// Cableado del formulario de contacto desde el entorno de Pages (correcciones 2, D4). A diferencia de buildServices, aquí faltar algo NO es un
// error: el formulario queda desactivado y la página muestra el enlace de correo. Solo se activa con CONTACT_ENABLED=true, con la base, Turnstile y
// la clave de visitante, Y con un mecanismo de entrega configurado.
import { createStore } from './store-d1.js'
import { createVerifier } from './verifier.js'

const DUMMY_TURNSTILE = /^[123]x0{10,}/

// Mecanismo de entrega hacia dennys@dennysh.com. Hoy NO existe ninguno en el proyecto (el único canal, Telegram, avisa a Dennys con texto fijo y
// no es correo): devuelve null y el formulario permanece desactivado. Un proveedor nuevo (y su clave) lo decide Dennys; se enchufa aquí con la
// forma `{ send({ subject, text, replyTo }) → { kind: 'Delivered' | 'Failed' | 'Unconfirmed' } }`.
export function createDelivery(_env) {
  return null
}

export function buildContactServices(env, { delivery = createDelivery(env) } = {}) {
  const configured = env.CONTACT_ENABLED === 'true' && Boolean(env.DB && env.TURNSTILE_SECRET && env.VISITOR_HMAC_KEY) && Boolean(delivery)
  if (!configured) return { enabled: false }
  const hosts = (env.TURNSTILE_HOSTS ?? 'dennysh.com,www.dennysh.com').split(',').map((h) => h.trim())
  // La clave de prueba de Turnstile acepta cualquier token: fuera de localhost dejaría el formulario sin freno anti-bot. Misma guarda que la demo (services.js), pero aquí cierra seguro.
  if (DUMMY_TURNSTILE.test(env.TURNSTILE_SECRET) && !hosts.every((h) => h === 'localhost' || h === '127.0.0.1')) return { enabled: false }
  return {
    enabled: true,
    config: { visitorKey: env.VISITOR_HMAC_KEY },
    store: createStore(env.DB),
    clock: { now: () => Date.now() },
    delivery,
    verifier: createVerifier({ secret: env.TURNSTILE_SECRET, expectedHost: hosts, testMode: DUMMY_TURNSTILE.test(env.TURNSTILE_SECRET) }),
  }
}
