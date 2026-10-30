import { eventHandler } from '../../../server/handlers.js'
import { withSecurityHeaders } from '../../../server/security-headers.js'

export const onRequest = withSecurityHeaders(eventHandler)
