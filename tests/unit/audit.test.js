import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'
import { scenario } from '../../core/scenario.js'
import { explain } from '../../core/explain.js'
import {
  buildAudit, effectiveState, addIntervention, chainInterventions, verifyRecordHash,
} from '../../core/audit.js'

const templates = JSON.parse(readFileSync('content/explanations/v1.json', 'utf8')).templates
const NOW = 1793259677402 // 2026-10-29T07:41:17.402Z
let rules

async function make(id = 'A', over = {}) {
  const s = scenario(id, () => 0.5)
  const outcome = evaluate(rules, s.signals)
  const explanation = explain(outcome, templates, 'es', { ruleset: rules, signals: s.signals })
  return buildAudit({ eventId: 'ev_test', nowMs: NOW, scenario: id, input: s.input, ruleset: rules, outcome, explanation, ...over })
}

beforeAll(async () => {
  rules = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})

describe('buildAudit (AC-05, AC-19)', () => {
  it('contiene exactamente los campos de AuditView del plan §3', async () => {
    const a = await make()
    expect(Object.keys(a).sort()).toEqual([
      'alert', 'createdAtUtc', 'decision', 'effectiveState', 'engine', 'escalated', 'eventId', 'explanation',
      'input', 'interventions', 'matched', 'modules', 'recordHash', 'ruleset', 'scenario', 'unusedData', 'usedData',
    ])
  })

  it('hora en UTC ISO 8601 con milisegundos', async () => {
    const a = await make()
    expect(a.createdAtUtc).toBe('2026-10-29T07:41:17.402Z')
  })

  it('motor determinista sin IA, regla, versión y hash completo del ruleset', async () => {
    const a = await make()
    expect(a.engine).toEqual({ name: 'rules-engine', version: '1.0.0', kind: 'deterministic' })
    expect(a.ruleset).toEqual({ version: '1.0.0', hash: rules.hash })
    expect(a.ruleset.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(a.matched).toEqual([{ ruleId: 'R-02', ruleVersion: '1.0.0' }])
    expect(a.decision).toBe('Limit')
  })

  it('estado inicial: Decided, sin escalar, sin intervenciones y alerta en modo prueba', async () => {
    const a = await make()
    expect(a.effectiveState).toBe('Decided')
    expect(a.escalated).toBe(false)
    expect(a.interventions).toEqual([])
    expect(a.alert).toEqual({ status: 'TestMode', channel: 'none' })
  })

  it('módulos de lista cerrada por escenario, siempre con el notificador', async () => {
    for (const id of ['A', 'B', 'C']) {
      const a = await make(id)
      expect(a.modules.length).toBeGreaterThanOrEqual(3)
      expect(a.modules.map((m) => m.id)).toContain('telegram-notifier')
      for (const m of a.modules) expect(m.version).toBe('1')
    }
  })

  it('datos usados y no usados: lo no usado nombra los atributos protegidos y no se solapa', async () => {
    const a = await make('B')
    expect(a.unusedData).toEqual(expect.arrayContaining(['name', 'nationality', 'language', 'device', 'gender']))
    expect(a.usedData.filter((k) => a.unusedData.includes(k))).toEqual([])
    expect(a.usedData.length).toBeGreaterThan(0)
  })

  it('la alerta recibida se conserva', async () => {
    const alert = { status: 'Delivered', channel: 'telegram', atUtc: '2026-10-29T07:41:18.115Z', maskedChat: '••••67', messageIdPresent: true }
    expect((await make('A', { alert })).alert).toEqual(alert)
  })
})

describe('recordHash (AC-26)', () => {
  it('SHA-256 en 64 hex y determinista', async () => {
    const a = await make(); const b = await make()
    expect(a.recordHash).toMatch(/^[0-9a-f]{64}$/)
    expect(a.recordHash).toBe(b.recordHash)
  })

  it('cambia con la decisión o con la hora; no con el estado de la alerta', async () => {
    const a = await make()
    expect((await make('B')).recordHash).not.toBe(a.recordHash)
    expect((await make('A', { nowMs: NOW + 1 })).recordHash).not.toBe(a.recordHash)
    const withAlert = await make('A', { alert: { status: 'Delivered', channel: 'telegram' } })
    expect(withAlert.recordHash).toBe(a.recordHash)
  })

  it('verifyRecordHash acepta el registro íntegro y rechaza uno alterado', async () => {
    const a = await make()
    expect(await verifyRecordHash(a)).toBe(true)
    expect(await verifyRecordHash({ ...a, decision: 'Allow' })).toBe(false)
    expect(await verifyRecordHash({ ...a, input: { ...a.input, accountLabel: 'otra' } })).toBe(false)
  })
})

describe('effectiveState (AC-26)', () => {
  const iv = (...actions) => actions.map((action, i) => ({ seq: i + 1, action }))
  it.each([
    [[], 'Decided', false],
    [['approve'], 'Approved', false],
    [['approve', 'override'], 'Overridden', false],
    [['override', 'approve'], 'Approved', false],
    [['override', 'escalate'], 'Overridden', true],
    [['escalate'], 'Decided', true],
    [['approve', 'escalate', 'override'], 'Overridden', true],
  ])('%j → %s, escalado=%s', (actions, state, esc) => {
    expect(effectiveState(iv(...actions))).toEqual({ effectiveState: state, escalated: esc })
  })
})

describe('addIntervention', () => {
  it('añade seq 1..3 con hora UTC y actor, sin mutar la lista original', () => {
    const base = []
    const r1 = addIntervention(base, 'approve', NOW)
    expect(base).toEqual([])
    expect(r1.interventions).toEqual([{ seq: 1, action: 'approve', atUtc: '2026-10-29T07:41:17.402Z', actor: 'visitor-demo' }])
    const r3 = addIntervention(addIntervention(r1.interventions, 'escalate', NOW + 1000).interventions, 'override', NOW + 2000)
    expect(r3.interventions.map((x) => x.seq)).toEqual([1, 2, 3])
  })

  it('rechaza la cuarta intervención y las acciones desconocidas', () => {
    let list = []
    for (const a of ['approve', 'override', 'escalate']) list = addIntervention(list, a, NOW).interventions
    expect(addIntervention(list, 'approve', NOW)).toEqual({ ok: false, reason: 'limit-reached' })
    expect(addIntervention([], 'delete', NOW)).toEqual({ ok: false, reason: 'bad-action' })
  })
})

describe('cadena de hashes de intervenciones', () => {
  it('cada hash depende del anterior y del registro', async () => {
    const a = await make()
    let list = []
    for (const act of ['approve', 'escalate', 'override']) list = addIntervention(list, act, NOW).interventions
    const hs = await chainInterventions(a.recordHash, list)
    expect(hs).toHaveLength(3)
    expect(new Set(hs).size).toBe(3)
    for (const h of hs) expect(h).toMatch(/^[0-9a-f]{64}$/)
    expect(await chainInterventions(a.recordHash, list)).toEqual(hs)
  })

  it('alterar una intervención anterior cambia ese hash y todos los siguientes', async () => {
    const a = await make()
    let list = []
    for (const act of ['approve', 'escalate', 'override']) list = addIntervention(list, act, NOW).interventions
    const hs = await chainInterventions(a.recordHash, list)
    const tampered = list.map((x, i) => (i === 0 ? { ...x, action: 'override' } : x))
    const ht = await chainInterventions(a.recordHash, tampered)
    expect(ht[0]).not.toBe(hs[0]); expect(ht[1]).not.toBe(hs[1]); expect(ht[2]).not.toBe(hs[2])
  })

  it('otro registro de base da otra cadena', async () => {
    const list = addIntervention([], 'approve', NOW).interventions
    expect(await chainInterventions('a'.repeat(64), list)).not.toEqual(await chainInterventions('b'.repeat(64), list))
  })
})
