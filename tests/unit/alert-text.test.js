import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync } from 'node:fs'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'
import { scenario } from '../../core/scenario.js'
import { explain } from '../../core/explain.js'
import { buildAudit } from '../../core/audit.js'
import { renderAlert } from '../../core/alert-text.js'

const templates = JSON.parse(readFileSync('content/explanations/v1.json', 'utf8')).templates
const NOW = 1793259677402 // 2026-10-29T07:41:17.402Z → 02:41:17 en Guayaquil (UTC-5)
let rules

async function make(id, over = {}) {
  const s = scenario(id, () => 0.5)
  const outcome = evaluate(rules, s.signals)
  const explanation = explain(outcome, templates, 'es', { ruleset: rules, signals: s.signals })
  return buildAudit({ eventId: 'ev_test-123', nowMs: NOW, scenario: id, input: s.input, ruleset: rules, outcome, explanation, ...over })
}

beforeAll(async () => {
  rules = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})

describe('renderAlert: instantáneas (D-02)', () => {
  it('escenario A', async () => {
    expect(renderAlert(await make('A'))).toBe(
      [
        '[SIMULACIÓN] Acceso anómalo simulado',
        'Escenario: A · ráfaga de intentos',
        'Decisión: LIMITAR (15 min)',
        'Regla: R-02',
        'Hora: 02:41:17 (Guayaquil, UTC-5)',
        'Evento: https://dennysh.com/es/demo/?evento=ev_test-123',
      ].join('\n'),
    )
  })

  it('escenario B', async () => {
    expect(renderAlert(await make('B'))).toBe(
      [
        '[SIMULACIÓN] Acceso anómalo simulado',
        'Escenario: B · viaje imposible',
        'Decisión: BLOQUEAR',
        'Regla: R-01',
        'Hora: 02:41:17 (Guayaquil, UTC-5)',
        'Evento: https://dennysh.com/es/demo/?evento=ev_test-123',
      ].join('\n'),
    )
  })

  it('escenario C', async () => {
    expect(renderAlert(await make('C'))).toBe(
      [
        '[SIMULACIÓN] Acceso anómalo simulado',
        'Escenario: C · acción fuera de horario',
        'Decisión: ALERTAR',
        'Regla: R-03',
        'Hora: 02:41:17 (Guayaquil, UTC-5)',
        'Evento: https://dennysh.com/es/demo/?evento=ev_test-123',
      ].join('\n'),
    )
  })
})

describe('renderAlert: propiedades', () => {
  it('siempre empieza por [SIMULACIÓN], es corto y no promete entrega', async () => {
    for (const id of ['A', 'B', 'C']) {
      const t = renderAlert(await make(id))
      expect(t.startsWith('[SIMULACIÓN]')).toBe(true)
      expect(t.length).toBeLessThanOrEqual(400)
      expect(t).not.toMatch(/entregad/i)
      expect(t).not.toMatch(/[\u0000-\u0009\u000b-\u001f\u007f]/)
    }
  })

  it('la hora se convierte a Guayaquil, también al cruzar la medianoche', async () => {
    const a = await make('A', { nowMs: Date.UTC(2026, 9, 29, 3, 30, 0) })
    expect(renderAlert(a)).toContain('Hora: 22:30:00 (Guayaquil, UTC-5)')
  })

  it('sin reglas coincidentes dice "Regla: ninguna" y PERMITIR', async () => {
    const a = await make('A', { outcome: { decision: 'Allow', matched: [] } })
    const t = renderAlert(a)
    expect(t).toContain('Regla: ninguna')
    expect(t).toContain('Decisión: PERMITIR')
  })

  it('con varias reglas nombra la efectiva (la primera de matched) sin repetir texto libre', async () => {
    const a = await make('A', { outcome: { decision: 'Block', matched: [{ ruleId: 'R-01', ruleVersion: '1.0.0' }, { ruleId: 'R-02', ruleVersion: '1.0.0' }] } })
    expect(renderAlert(a)).toContain('Regla: R-01, R-02')
  })
})

describe('renderAlert: sanitizado (S15)', () => {
  it('ningún valor libre de la entrada llega al mensaje', async () => {
    const a = await make('A')
    const hostile = {
      ...a,
      input: { ...a.input, accountLabel: '<script>alert(1)</script>', sourceIp: '6.6.6.6', params: { x: '*bold* [link](http://evil)' } },
    }
    const t = renderAlert(hostile)
    for (const bad of ['<script>', '6.6.6.6', 'evil', 'bold', 'alert(1)']) expect(t).not.toContain(bad)
  })

  it('decisión, escenario o regla fuera de la lista cerrada no se reproducen', async () => {
    const a = await make('A')
    const t = renderAlert({ ...a, decision: '<b>x</b>', scenario: 'Z\nINJECT', matched: [{ ruleId: 'R-99\n[ADMIN]', ruleVersion: 'x' }] })
    expect(t).not.toContain('<b>')
    expect(t).not.toContain('INJECT')
    expect(t).not.toContain('ADMIN')
    expect(t.split('\n')).toHaveLength(6)
  })

  it('un eventId con caracteres peligrosos no genera enlace', async () => {
    const a = await make('A', { eventId: 'x\n[ADMIN] http://evil.test' })
    const t = renderAlert(a)
    expect(t).not.toContain('evil')
    expect(t).toContain('Evento: (enlace no disponible)')
  })
})
