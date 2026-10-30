import { describe, it, expect } from 'vitest'
import { initialState, reduce, STEPS, STEP_AT_MS, canIntervene, MAX_RUN_MS } from '../../src/demo/machine.js'

const audit = (extra = {}) => ({ eventId: 'e', decision: 'Limit', interventions: [], alert: { status: 'Delivered' }, ...extra })
const run = (...events) => events.reduce(reduce, initialState)

describe('estados (AC-03)', () => {
  it('reposo → ejecutando → revelando → decidido', () => {
    expect(initialState.phase).toBe('idle')
    const running = run({ type: 'START', scenario: 'A' })
    expect(running).toMatchObject({ phase: 'running', scenario: 'A', audit: null, revealed: 0, error: null })
    const revealing = reduce(running, { type: 'RESULT', audit: audit() })
    expect(revealing).toMatchObject({ phase: 'revealing', revealed: 0 })
    const done = reduce(revealing, { type: 'TICK', elapsedMs: MAX_RUN_MS })
    expect(done.phase).toBe('decided')
    expect(done.revealed).toBe(STEPS.length)
  })

  it('la cronología cabe en 30 s y los pasos van en orden creciente', () => {
    expect(MAX_RUN_MS).toBeLessThanOrEqual(30_000)
    expect(STEPS).toEqual(['event', 'decision', 'explanation', 'audit', 'alert', 'oversight'])
    const times = STEPS.map((s) => STEP_AT_MS[s])
    expect(times).toEqual([...times].sort((a, b) => a - b))
    expect(STEP_AT_MS.event).toBe(1000)
    expect(STEP_AT_MS.decision).toBe(6000)
    expect(STEP_AT_MS.oversight).toBe(26000)
  })

  it('TICK revela los pasos cuyo instante ya pasó, sin retroceder', () => {
    let s = run({ type: 'START' }, { type: 'RESULT', audit: audit() })
    s = reduce(s, { type: 'TICK', elapsedMs: 6500 })
    expect(s.revealed).toBe(2)
    s = reduce(s, { type: 'TICK', elapsedMs: 100 })
    expect(s.revealed).toBe(2)
    s = reduce(s, { type: 'TICK', elapsedMs: 16_000 })
    expect(s.revealed).toBe(4)
  })

  it('"Mostrar todo" lo revela todo de golpe', () => {
    const s = run({ type: 'START' }, { type: 'RESULT', audit: audit() }, { type: 'SHOW_ALL' })
    expect(s).toMatchObject({ phase: 'decided', revealed: STEPS.length })
  })

  it('prefers-reduced-motion: el resultado se muestra completo sin escalonar', () => {
    const s = run({ type: 'START' }, { type: 'RESULT', audit: audit(), reducedMotion: true })
    expect(s).toMatchObject({ phase: 'decided', revealed: STEPS.length })
  })

  it('RESTORE (recarga con sessionStorage) muestra todo', () => {
    expect(reduce(initialState, { type: 'RESTORE', audit: audit() })).toMatchObject({ phase: 'decided', revealed: STEPS.length })
  })

  it('RESET vuelve a reposo y borra la auditoría', () => {
    const s = run({ type: 'START' }, { type: 'RESULT', audit: audit() }, { type: 'SHOW_ALL' }, { type: 'RESET' })
    expect(s).toEqual(initialState)
  })

  it('START mientras corre no hace nada (doble clic)', () => {
    const s = run({ type: 'START', scenario: 'A' })
    expect(reduce(s, { type: 'START', scenario: 'B' })).toBe(s)
  })

  it('los eventos desconocidos y TICK en reposo no cambian el estado', () => {
    expect(reduce(initialState, { type: 'TICK', elapsedMs: 5000 })).toBe(initialState)
    expect(reduce(initialState, { type: 'NOPE' })).toBe(initialState)
  })
})

describe('errores', () => {
  it.each(['turnstile', 'bot', 'unavailable', 'input', 'expired'])('FAIL %s → fase error con el tipo', (kind) => {
    const s = run({ type: 'START' }, { type: 'FAIL', kind })
    expect(s).toMatchObject({ phase: 'error', error: kind })
  })
  it('tras un error se puede volver a empezar', () => {
    const s = run({ type: 'START' }, { type: 'FAIL', kind: 'bot' }, { type: 'START', scenario: 'C' })
    expect(s).toMatchObject({ phase: 'running', scenario: 'C', error: null })
  })
  it('un tipo de error desconocido se trata como unavailable', () => {
    expect(run({ type: 'START' }, { type: 'FAIL', kind: '<script>' }).error).toBe('unavailable')
  })
})

describe('intervención', () => {
  const decided = () => run({ type: 'START' }, { type: 'RESULT', audit: audit() }, { type: 'SHOW_ALL' })
  it('solo se puede intervenir con todo revelado, sin petición en curso y con menos de 3', () => {
    const revealing = run({ type: 'START' }, { type: 'RESULT', audit: audit() })
    expect(canIntervene(revealing)).toBe(false)
    expect(canIntervene(decided())).toBe(true)
    expect(canIntervene(reduce(decided(), { type: 'INTERVENE_START' }))).toBe(false)
    const three = reduce(decided(), { type: 'INTERVENE_OK', audit: audit({ interventions: [1, 2, 3].map((seq) => ({ seq })) }) })
    expect(canIntervene(three)).toBe(false)
  })
  it('INTERVENE_OK sustituye la auditoría y anuncia la intervención', () => {
    const s = reduce(reduce(decided(), { type: 'INTERVENE_START' }), { type: 'INTERVENE_OK', audit: audit({ interventions: [{ seq: 1 }] }) })
    expect(s.audit.interventions).toHaveLength(1)
    expect(s.busy).toBe(false)
    expect(s.announce).toBe('intervention')
  })
  it('INTERVENE_FAIL deja la auditoría y muestra el aviso', () => {
    const s = reduce(reduce(decided(), { type: 'INTERVENE_START' }), { type: 'INTERVENE_FAIL', kind: 'limit' })
    expect(s.busy).toBe(false)
    expect(s.notice).toBe('limit')
    expect(s.audit.decision).toBe('Limit')
  })
  it('INTERVENE_FAIL expired pasa a la fase de registro expirado', () => {
    const s = reduce(decided(), { type: 'INTERVENE_FAIL', kind: 'expired' })
    expect(s).toMatchObject({ phase: 'error', error: 'expired' })
  })
})

describe('anuncios aria-live: solo 4 (AC-30)', () => {
  const seen = (...events) => {
    const out = []
    let s = initialState
    for (const e of events) {
      const before = s.announce
      s = reduce(s, e)
      if (s.announce && s.announce !== before) out.push(s.announce)
    }
    return out
  }
  it('evento, decisión, estado de alerta e intervención, una vez cada uno', () => {
    const ticks = [1000, 2000, 6000, 7000, 10_000, 16_000, 23_000, 27_000].map((elapsedMs) => ({ type: 'TICK', elapsedMs }))
    const list = seen({ type: 'START' }, { type: 'RESULT', audit: audit() }, ...ticks, { type: 'INTERVENE_OK', audit: audit({ interventions: [{ seq: 1 }] }) })
    expect(list).toEqual(['event', 'decision', 'alert', 'intervention'])
  })
  it('con "Mostrar todo" se anuncia el resumen final sin repetir', () => {
    const list = seen({ type: 'START' }, { type: 'RESULT', audit: audit() }, { type: 'SHOW_ALL' })
    expect(new Set(list).size).toBe(list.length)
    expect(list.length).toBeLessThanOrEqual(4)
  })
})
