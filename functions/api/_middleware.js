// Cabeceras comunes de toda respuesta de /api/* (los _headers estáticos no aplican a Functions; D-PLAN-09).
import { withSecurityHeaders } from '../../server/security-headers.js'

export const onRequest = withSecurityHeaders((context) => context.next())
