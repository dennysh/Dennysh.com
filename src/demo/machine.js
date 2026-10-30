// Máquina de estados de la demo (AC-03, AC-30). Pura: la presentación escalonada es solo reproducción
// de un evento que el servidor ya generó; no decide nada.
export const STEPS = ['event', 'decision', 'explanation', 'audit', 'alert', 'oversight']
// Guion de la spec §5.2, en ms desde que llega el resultado.
export const STEP_AT_MS = { event: 1000, decision: 6000, explanation: 9000, audit: 15000, alert: 22000, oversight: 26000 }
export const MAX_RUN_MS = 30_000
export const MAX_INTERVENTIONS = 3

export const initialState = { phase: 'idle', scenario: null, audit: null, revealed: 0, error: null, busy: false, notice: null, announce: null }

const ERRORS = ['turnstile', 'bot', 'unavailable', 'input', 'expired']
// Solo cuatro cambios se anuncian a lectores de pantalla: evento, decisión, estado de alerta, intervención.
const ANNOUNCE_AT = { 1: 'event', 2: 'decision', 5: 'alert' }

function reveal(state, count) {
  const revealed = Math.max(state.revealed, Math.min(count, STEPS.length))
  if (revealed === state.revealed) return state
  let announce = state.announce
  for (let n = state.revealed + 1; n <= revealed; n++) if (ANNOUNCE_AT[n]) announce = ANNOUNCE_AT[n]
  return { ...state, revealed, announce, phase: revealed === STEPS.length ? 'decided' : 'revealing' }
}

export function reduce(state, event) {
  switch (event.type) {
    case 'START':
      if (state.phase === 'running' || state.phase === 'revealing') return state
      return { ...initialState, phase: 'running', scenario: event.scenario ?? null }
    case 'RESULT': {
      if (state.phase !== 'running') return state
      const next = { ...state, phase: 'revealing', audit: event.audit, revealed: 0, announce: null }
      return event.reducedMotion ? reveal(next, STEPS.length) : next
    }
    case 'RESTORE':
      return reveal({ ...initialState, phase: 'revealing', audit: event.audit }, STEPS.length)
    case 'FAIL':
      return { ...initialState, phase: 'error', error: ERRORS.includes(event.kind) ? event.kind : 'unavailable' }
    case 'TICK': {
      if (state.phase !== 'revealing') return state
      return reveal(state, STEPS.filter((s) => STEP_AT_MS[s] <= event.elapsedMs).length)
    }
    case 'SHOW_ALL':
      return state.audit ? reveal(state, STEPS.length) : state
    case 'INTERVENE_START':
      return { ...state, busy: true, notice: null }
    case 'INTERVENE_OK':
      return { ...state, audit: event.audit, busy: false, notice: null, announce: 'intervention' }
    case 'INTERVENE_FAIL':
      if (event.kind === 'expired') return { ...initialState, phase: 'error', error: 'expired' }
      return { ...state, busy: false, notice: event.kind }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export const canIntervene = (s) =>
  s.phase === 'decided' && !s.busy && s.audit !== null && s.audit.interventions.length < MAX_INTERVENTIONS
