// Rutas de la demo retiradas del sitio (2026-11-09). Responden 410 sin tocar la base, Turnstile ni Telegram: no construyen servicios,
// no leen secretos, no escriben ni envían alertas. El código de la demo sigue en handlers.js (sin usar) por si se reactiva con otro encargo.
import { json } from './security-headers.js'

export const retiredHandler = () => json({ code: 'E_NOT_FOUND' }, 410)
