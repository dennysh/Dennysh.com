// Cableado de puertos desde el entorno de Pages. Faltar un secreto es un error (cierra seguro).
import { createStore } from './store-d1.js'
import { createVerifier } from './verifier.js'
import { createTelegramNotifier } from './notifier.js'
import { loadRuleset } from '../core/ruleset.js'
import rulesetJson from '../content/ruleset.v1.json'
import explanations from '../content/explanations/v1.json'

let rulesetPromise
const getRuleset = () => (rulesetPromise ??= loadRuleset(rulesetJson).then((r) => {
  if (!r.ok) throw new Error('ruleset inválido')
  return r.ruleset
}))

const DUMMY_TURNSTILE = /^[123]x0{10,}/ // claves de prueba de Cloudflare

export async function buildServices(env) {
  for (const k of ['DB', 'TURNSTILE_SECRET', 'VISITOR_HMAC_KEY', 'EVENT_HMAC_KEY']) {
    if (!env[k]) throw new Error('configuración incompleta')
  }
  const alertsEnabled = env.ALERTS_ENABLED === 'true'
  // La clave de prueba de Turnstile acepta cualquier token: con alertas reales activas dejaría el cupo abierto a bots.
  // Solo se tolera si TODOS los hosts permitidos son locales (e2e); en producción el host por defecto es dennysh.com.
  const hosts = (env.TURNSTILE_HOSTS ?? 'dennysh.com,www.dennysh.com').split(',').map((h) => h.trim())
  if (alertsEnabled && DUMMY_TURNSTILE.test(env.TURNSTILE_SECRET) && !hosts.every((h) => h === 'localhost' || h === '127.0.0.1')) throw new Error('configuración insegura')
  const config = {
    eventKey: env.EVENT_HMAC_KEY,
    visitorKey: env.VISITOR_HMAC_KEY,
    alertsEnabled,
    testMode: !alertsEnabled,
    chatId: env.TELEGRAM_CHAT_ID,
    ruleset: await getRuleset(),
    templates: explanations.templates,
  }
  return {
    config,
    store: createStore(env.DB),
    clock: { now: () => Date.now() },
    rng: { next: Math.random },
    verifier: createVerifier({
      secret: env.TURNSTILE_SECRET,
      expectedHost: hosts,
      testMode: DUMMY_TURNSTILE.test(env.TURNSTILE_SECRET),
    }),
    notifier: createTelegramNotifier({ token: env.TELEGRAM_BOT_TOKEN, chatId: env.TELEGRAM_CHAT_ID, dryRun: !alertsEnabled }),
  }
}
