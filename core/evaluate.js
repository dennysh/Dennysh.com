// Motor de reglas (AC-04, AC-20). Puro y determinista.
// Equidad (AC-14): solo lee estas señales de comportamiento; nunca nombre, país, idioma, dispositivo ni género.
export const SIGNAL_KEYS = ['failedAttempts', 'windowSeconds', 'impliedSpeedKmh', 'bulkExport', 'localMinutes']

const SEVERITY = { Block: 3, Limit: 2, Alert: 1 }
const num = (v) => typeof v === 'number' && Number.isFinite(v)

const CHECKS = {
  'speed-above': (c, s) => num(s.impliedSpeedKmh) && s.impliedSpeedKmh > c.gt,
  burst: (c, s) =>
    num(s.failedAttempts) && num(s.windowSeconds) && s.failedAttempts >= c.min && s.windowSeconds <= c.maxWindowSeconds,
  // Horario laboral [from, to) en minutos desde medianoche; alerta fuera de él.
  'off-hours-export': (c, s) =>
    s.bulkExport === true && num(s.localMinutes) && (s.localMinutes < c.from || s.localMinutes >= c.to),
}

export function evaluate(ruleset, signals) {
  const matched = ruleset.rules.filter((r) => CHECKS[r.condition.type](r.condition, signals))
  if (matched.length === 0) return { decision: 'Allow', matched: [] }
  const top = matched.reduce((a, r) => (SEVERITY[r.action] > SEVERITY[a.action] ? r : a))
  return {
    decision: top.action,
    matched: matched.map((r) => ({ ruleId: r.id, ruleVersion: r.version })),
    effectiveRule: top.id,
  }
}
