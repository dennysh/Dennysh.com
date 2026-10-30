// Máquina de estados de la demo (AC-03, AC-30). Pura: la presentación escalonada es solo reproducción
// de un evento que el servidor ya generó; no decide nada.
export const STEPS = ['event', 'decision', 'explanation', 'audit', 'alert', 'oversight']
// Guion de la spec §5.2, en ms desde que llega el resultado.
export const STEP_AT_MS = { event: 1000, decision: 6000, explanation: 9000, audit: 15000, alert: 22000, oversight: 26000 }
export const MAX_RUN_MS = 30_000
export const MAX_INTERVENTIONS = 3

export const initialState = { phase: 'idle', scenario: null, audit: null, revealed: 0, error: null, busy: false, notice: null, announce: null, readOnly: false }

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
    // La restauración (recarga o enlace) solo vale desde reposo: una respuesta tardía no pisa una ejecución nueva.
    case 'RESTORE':
      if (state.phase !== 'idle') return state
      return reveal({ ...initialState, phase: 'revealing', audit: event.audit, readOnly: event.readOnly === true }, STEPS.length)
    case 'RESTORE_FAIL':
      if (state.phase !== 'idle') return state
      return { ...initialState, phase: 'error', error: ERRORS.includes(event.kind) ? event.kind : 'unavailable' }
    case 'FAIL':
      if (state.phase !== 'running') return state
      return { ...initialState, phase: 'error', error: ERRORS.includes(event.kind) ? event.kind : 'unavailable' }
    case 'TICK': {
      if (state.phase !== 'revealing') return state
      return reveal(state, STEPS.filter((s) => STEP_AT_MS[s] <= event.elapsedMs).length)
    }
    case 'SHOW_ALL':
      return state.audit ? reveal(state, STEPS.length) : state
    case 'INTERVENE_START':
      if (state.phase !== 'decided' || state.readOnly) return state
      return { ...state, busy: true, notice: null }
    // Las respuestas de una intervención solo valen para el mismo evento y mientras siga decidido (si no, son de una ejecución vieja).
    case 'INTERVENE_OK':
      if (state.phase !== 'decided' || event.audit?.eventId !== state.audit?.eventId) return state
      return { ...state, audit: event.audit, busy: false, notice: null, announce: 'intervention' }
    case 'INTERVENE_FAIL':
      if (state.phase !== 'decided') return state
      if (event.kind === 'expired') return { ...initialState, phase: 'error', error: 'expired' }
      return { ...state, busy: false, notice: event.kind }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export const canIntervene = (s) =>
  s.phase === 'decided' && !s.busy && !s.readOnly && s.audit !== null && s.audit.interventions.length < MAX_INTERVENTIONS
