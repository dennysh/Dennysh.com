// Orquestador de POST /api/contact (correcciones 2, D4). Orden fijo, barato primero:
// entrada (esquema estricto) → ¿activo? → Turnstile → límite de tasa → entrega. La respuesta solo dice el estado (S17).
import { visitorHash } from './visitor-hash.js'
import { hmacBytes, toHex } from './hmac.js'
import { validateContact, renderContact } from '../core/contact.js'

export const CONTACT_MAX_BODY_BYTES = 12288 // 1 500 + 300 + ~300 caracteres de texto, hasta 4 bytes cada uno
const err = (status, code) => ({ status, body: { code } })

export function createContact({ verifier, store, delivery, clock, config }) {
  return async function contact({ method, contentType, bodyText, ip }) {
    // Tipo, tamaño y JSON; el contenido lo valida el núcleo, con enumeraciones y longitudes (S14).
    if (method !== 'POST') return err(405, 'E_INPUT')
    if (typeof contentType !== 'string' || !/^application\/json\s*(;|$)/i.test(contentType)) return err(415, 'E_INPUT')
    if (typeof bodyText !== 'string' || new TextEncoder().encode(bodyText).length > CONTACT_MAX_BODY_BYTES) return err(413, 'E_INPUT')
    let data
    try { data = JSON.parse(bodyText) } catch { return err(400, 'E_INPUT') }
    const checked = validateContact(data)
    if (!checked.ok) return err(400, 'E_INPUT')
    const v = checked.value

    // Sin mecanismo de entrega no hay formulario: se dice antes de gastar un token de Turnstile (cierra seguro).
    if (!delivery) return err(503, 'E_DISABLED')

    const human = await verifier.verify(v.turnstileToken)
    if (human.kind === 'Bot') return err(403, 'E_BOT')
    if (human.kind !== 'Human') return err(503, 'E_INTERNAL')

    const now = clock.now()
    const byIp = await visitorHash(ip, config.visitorKey)
    const byMail = toHex(await hmacBytes(config.visitorKey, `contact-mail:${v.email}`))
    const slot = await store.reserveContact(byIp, byMail, now)
    if (slot.kind === 'StoreDown') return err(503, 'E_INTERNAL')
    if (slot.kind === 'RateLimited') return err(429, 'E_RATE_LIMIT')
    await store.purgeContact(now) // oportunista: sin cron en Pages

    const sent = await delivery.send(renderContact(v))
    if (sent.kind === 'Delivered') return { status: 200, body: { status: 'sent' } }
    // Un envío que falló sin duda devuelve el turno; uno sin confirmar lo conserva (podría haber salido).
    if (sent.kind === 'Failed') await store.releaseContact(slot.slotId)
    return err(503, 'E_DELIVERY')
  }
}
