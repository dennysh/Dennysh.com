// Ruta retirada (la demo ya no está en el sitio): 410 sin servicios ni escrituras. Ver server/retired.js.
import { retiredHandler } from '../../server/retired.js'
import { withSecurityHeaders } from '../../server/security-headers.js'

export const onRequest = withSecurityHeaders(retiredHandler)
