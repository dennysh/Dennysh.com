// Lista blanca de respuestas (S17). Todo campo fuera de estas listas se descarta aunque exista en el registro.
const pick = (src, keys) => {
  const out = {}
  if (src && typeof src === 'object') for (const k of keys) if (src[k] !== undefined) out[k] = src[k]
  return out
}
const PARAMS = {
  A: ['failedAttempts', 'windowSeconds'],
  B: ['fromCity', 'toCity', 'distanceKm', 'minutes', 'impliedSpeedKmh'],
  C: ['action', 'localTime', 'orgZone'],
}
const CODES = ['E_INPUT', 'E_BOT', 'E_RATE', 'E_NOT_FOUND', 'E_LIMIT', 'E_INTERNAL']

function alertView(a = {}) {
  const out = pick(a, ['status', 'channel', 'atUtc', 'maskedChat', 'messageIdPresent', 'groupedWithAtUtc', 'code', 'escalation'])
  if (a.fallback) out.fallback = pick(a.fallback, ['channel', 'status', 'atUtc', 'code'])
  return out
}

export function toAuditView(a) {
  const kind = a.input?.kind
  const explanation = pick(a.explanation, ['templateId', 'version', 'reviewState', 'reviewedAt'])
  explanation.params = pick(a.explanation?.params, ['ruleId', 'thresholds', 'observed', 'durationLabel'])
  return {
    eventId: a.eventId,
    createdAtUtc: a.createdAtUtc,
    scenario: a.scenario,
    input: { ...pick(a.input, ['accountLabel', 'sourceIp', 'kind']), params: pick(a.input?.params, PARAMS[kind] ?? []) },
    engine: pick(a.engine, ['name', 'version', 'kind']),
    ruleset: pick(a.ruleset, ['version', 'hash']),
    matched: (a.matched ?? []).map((m) => pick(m, ['ruleId', 'ruleVersion'])),
    decision: a.decision,
    explanation,
    modules: (a.modules ?? []).map((m) => pick(m, ['id', 'version'])),
    usedData: [...(a.usedData ?? [])],
    unusedData: [...(a.unusedData ?? [])],
    alert: alertView(a.alert),
    interventions: (a.interventions ?? []).map((i) => pick(i, ['seq', 'action', 'atUtc', 'actor'])),
    effectiveState: a.effectiveState,
    escalated: a.escalated,
    recordHash: a.recordHash,
  }
}

export function toBody(body) {
  if (body && typeof body.code === 'string') return { code: CODES.includes(body.code) ? body.code : 'E_INTERNAL' }
  if (body?.audit) return body.eventId ? { eventId: body.eventId, audit: toAuditView(body.audit) } : { audit: toAuditView(body.audit) }
  return { code: 'E_INTERNAL' }
}
