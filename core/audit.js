// Registro de auditoría (spec §5.5-5.6, AC-05, AC-19, AC-26). Puro; el reloj entra como `nowMs`.
import { canonicalJson, sha256Hex } from './hash.js'

const ENGINE = { name: 'rules-engine', version: '1.0.0', kind: 'deterministic' }
const MODULES = {
  A: ['burst-detector', 'severity-classifier', 'telegram-notifier'],
  B: ['velocity-checker', 'severity-classifier', 'telegram-notifier'],
  C: ['schedule-checker', 'severity-classifier', 'telegram-notifier'],
}
const USED = {
  A: ['account', 'failed-attempts', 'time-window'],
  B: ['account', 'distance', 'elapsed-time'],
  C: ['account', 'action-type', 'local-time'],
}
// Lo que la decisión deliberadamente NO usa (spec §5.4).
const UNUSED = ['name', 'nationality', 'language', 'device', 'gender', 'source-ip']
const ACTIONS = ['approve', 'override', 'escalate']
export const MAX_INTERVENTIONS = 3

export const toUtcIso = (ms) => new Date(ms).toISOString()

// El hash cubre la parte inmutable; el estado de la alerta y las intervenciones cambian después.
const sealed = (a) => ({
  eventId: a.eventId, createdAtUtc: a.createdAtUtc, scenario: a.scenario, input: a.input, engine: a.engine,
  ruleset: a.ruleset, matched: a.matched, decision: a.decision, explanation: a.explanation,
  modules: a.modules, usedData: a.usedData, unusedData: a.unusedData,
})

export async function buildAudit({ eventId, nowMs, scenario, input, ruleset, outcome, explanation, alert }) {
  const record = {
    eventId,
    createdAtUtc: toUtcIso(nowMs),
    scenario,
    input,
    engine: { ...ENGINE },
    ruleset: { version: ruleset.version, hash: ruleset.hash },
    matched: outcome.matched,
    decision: outcome.decision,
    explanation,
    modules: MODULES[scenario].map((id) => ({ id, version: '1' })),
    usedData: [...USED[scenario]],
    unusedData: [...UNUSED],
  }
  return {
    ...record,
    alert: alert ?? { status: 'TestMode', channel: 'none' },
    interventions: [],
    effectiveState: 'Decided',
    escalated: false,
    recordHash: await sha256Hex(canonicalJson(sealed(record))),
  }
}

export async function verifyRecordHash(audit) {
  return (await sha256Hex(canonicalJson(sealed(audit)))) === audit.recordHash
}

// Estado efectivo = última acción de decisión (Aprobar/Anular); Escalar solo marca el caso.
export function effectiveState(interventions) {
  let state = 'Decided'
  for (const i of interventions) {
    if (i.action === 'approve') state = 'Approved'
    else if (i.action === 'override') state = 'Overridden'
  }
  return { effectiveState: state, escalated: interventions.some((i) => i.action === 'escalate') }
}

export function addIntervention(interventions, action, nowMs) {
  if (!ACTIONS.includes(action)) return { ok: false, reason: 'bad-action' }
  if (interventions.length >= MAX_INTERVENTIONS) return { ok: false, reason: 'limit-reached' }
  const next = { seq: interventions.length + 1, action, atUtc: toUtcIso(nowMs), actor: 'visitor-demo' }
  return { ok: true, interventions: [...interventions, next] }
}

// Cada hash encadena el anterior (el primero, el del registro): alterar una línea rompe las siguientes.
export async function chainInterventions(recordHash, interventions) {
  const hashes = []
  let prev = recordHash
  for (const i of interventions) {
    prev = await sha256Hex(`${prev}|${canonicalJson(i)}`)
    hashes.push(prev)
  }
  return hashes
}
