// Resolución de explicaciones (AC-23, D-PLAN-03). Devuelve una referencia (id + parámetros), no texto.
// "Revisada por humano" solo si la plantilla trae revisadaPor y revisadaEn válidos.
const DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/

export function isReviewed(t) {
  return (
    typeof t.revisadaPor === 'string' &&
    t.revisadaPor.trim() !== '' &&
    typeof t.revisadaEn === 'string' &&
    DATE.test(t.revisadaEn) &&
    !Number.isNaN(Date.parse(t.revisadaEn))
  )
}

const pick = (src, keys) => Object.fromEntries(keys.map((k) => [k, src[k]]))
const SHAPES = {
  'speed-above': { thresholds: ['gt'], observed: ['impliedSpeedKmh'] },
  burst: { thresholds: ['min', 'maxWindowSeconds'], observed: ['failedAttempts', 'windowSeconds'] },
  'off-hours-export': { thresholds: ['from', 'to'], observed: ['localMinutes'] },
}

export function explain(outcome, templates, lang, ctx) {
  const rule = outcome.effectiveRule ? ctx.ruleset.rules.find((r) => r.id === outcome.effectiveRule) : null
  const id = rule ? `expl-${rule.id}` : 'expl-allow'
  const t = templates.find((x) => x.id === id)
  if (!t) return { ok: false, reason: 'no-template' }
  if (!t.text || typeof t.text[lang] !== 'string') return { ok: false, reason: 'no-text-for-lang' }

  const params = { ruleId: rule ? rule.id : null, thresholds: {}, observed: {} }
  if (rule) {
    const shape = SHAPES[rule.condition.type]
    params.thresholds = pick(rule.condition, shape.thresholds)
    params.observed = pick(ctx.signals, shape.observed)
    if (rule.action === 'Limit') params.durationLabel = `${rule.limitMinutes}min`
  }
  const ref = { templateId: t.id, version: t.version, params, reviewState: isReviewed(t) ? 'Reviewed' : 'PendingReview' }
  if (ref.reviewState === 'Reviewed') ref.reviewedAt = t.revisadaEn
  return ref
}
