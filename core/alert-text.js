// Mensaje de la alerta real (spec §5.8, D-02, S15): texto plano en español, plantilla fija.
// Solo entran valores de listas cerradas; nada de la entrada del visitante. Sin `parse_mode`, así no hay marcado que escapar.
const SCENARIOS = { A: 'ráfaga de intentos', B: 'viaje imposible', C: 'acción fuera de horario' }
const DECISIONS = { Block: 'BLOQUEAR', Limit: 'LIMITAR', Alert: 'ALERTAR', Allow: 'PERMITIR' }
const DURATIONS = { '15min': ' (15 min)' }
const RULES = ['R-01', 'R-02', 'R-03']
const SAFE_ID = /^[A-Za-z0-9_.-]{1,128}$/
const ZONE_OFFSET_MS = -5 * 3600 * 1000 // America/Guayaquil (supuesto P-15)

export const EVENT_LINK_BASE = 'https://dennysh.com/es/demo/?evento='

export function renderAlert(audit) {
  const has = (o, k) => typeof k === 'string' && Object.hasOwn(o, k)
  const scenario = has(SCENARIOS, audit.scenario) ? `${audit.scenario} · ${SCENARIOS[audit.scenario]}` : 'desconocido'
  const decision = has(DECISIONS, audit.decision) ? DECISIONS[audit.decision] : 'DESCONOCIDA'
  const duration = audit.decision === 'Limit' ? DURATIONS[audit.explanation?.params?.durationLabel] ?? '' : ''
  const rules = audit.matched.map((m) => m.ruleId).filter((id) => RULES.includes(id))
  const hour = new Date(Date.parse(audit.createdAtUtc) + ZONE_OFFSET_MS).toISOString().slice(11, 19)
  const link = typeof audit.eventId === 'string' && SAFE_ID.test(audit.eventId)
    ? `${EVENT_LINK_BASE}${audit.eventId}`
    : '(enlace no disponible)'
  return [
    '[SIMULACIÓN] Acceso anómalo simulado',
    `Escenario: ${scenario}`,
    `Decisión: ${decision}${duration}`,
    `Regla: ${rules.length ? rules.join(', ') : 'ninguna'}`,
    `Hora: ${hour} (Guayaquil, UTC-5)`,
    `Evento: ${link}`,
  ].join('\n')
}
