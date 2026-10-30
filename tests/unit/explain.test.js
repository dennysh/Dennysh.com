import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { loadRuleset } from '../../core/ruleset.js'
import { evaluate } from '../../core/evaluate.js'
import { scenario } from '../../core/scenario.js'
import { explain, isReviewed } from '../../core/explain.js'

const shipped = JSON.parse(readFileSync('content/explanations/v1.json', 'utf8')).templates
let rules
beforeAll(async () => {
  rules = (await loadRuleset(JSON.parse(readFileSync('content/ruleset.v1.json', 'utf8')))).ruleset
})
const rng = () => 0.5
const run = (id) => {
  const { signals } = scenario(id, rng)
  return { outcome: evaluate(rules, signals), ctx: { ruleset: rules, signals } }
}
const reviewed = (t) => ({ ...t, revisadaPor: 'Dennys Heras', revisadaEn: '2026-11-02' })

describe('explain', () => {
  it('A → plantilla de R-02 con umbrales y valores observados numéricos', () => {
    const { outcome, ctx } = run('A')
    const e = explain(outcome, shipped, 'es', ctx)
    expect(e.templateId).toBe('expl-R-02')
    expect(e.params).toEqual({
      ruleId: 'R-02',
      thresholds: { min: 10, maxWindowSeconds: 60 },
      observed: { failedAttempts: 14, windowSeconds: 40 },
      durationLabel: '15min',
    })
  })

  it('B y C usan sus plantillas; sin coincidencias usa expl-allow', () => {
    const b = run('B'); const c = run('C')
    expect(explain(b.outcome, shipped, 'en', b.ctx).params.thresholds).toEqual({ gt: 900 })
    expect(explain(c.outcome, shipped, 'en', c.ctx).params.thresholds).toEqual({ from: 420, to: 1200 })
    const none = { decision: 'Allow', matched: [] }
    expect(explain(none, shipped, 'es', { ruleset: rules, signals: {} }).templateId).toBe('expl-allow')
  })

  it('params solo contiene números y claves de lista cerrada (sin texto libre)', () => {
    for (const id of ['A', 'B', 'C']) {
      const { outcome, ctx } = run(id)
      const { thresholds, observed } = explain(outcome, shipped, 'es', ctx).params
      for (const v of [...Object.values(thresholds), ...Object.values(observed)]) expect(typeof v).toBe('number')
    }
  })

  it('una plantilla sin el idioma pedido es un error de valor', () => {
    const { outcome, ctx } = run('A')
    const t = shipped.map((x) => ({ ...x, text: { es: x.text.es } }))
    expect(explain(outcome, t, 'en', ctx)).toEqual({ ok: false, reason: 'no-text-for-lang' })
  })

  it('una plantilla inexistente es un error de valor', () => {
    const { outcome, ctx } = run('A')
    expect(explain(outcome, [], 'es', ctx)).toEqual({ ok: false, reason: 'no-template' })
  })
})

describe('reviewState (AC-23)', () => {
  const { outcome, ctx } = (() => ({ outcome: { decision: 'Limit', matched: [{ ruleId: 'R-02', ruleVersion: '1.0.0' }], effectiveRule: 'R-02' }, ctx: { ruleset: null, signals: { failedAttempts: 14, windowSeconds: 40 } } }))()
  const base = shipped.find((t) => t.id === 'expl-R-02')
  const rulesetLike = () => ({ rules: [{ id: 'R-02', limitMinutes: 15, condition: { type: 'burst', min: 10, maxWindowSeconds: 60 } }] })
  const state = (t) => explain(outcome, [t], 'es', { ...ctx, ruleset: rulesetLike() })

  it('las plantillas entregadas están todas en PendingReview', () => {
    for (const t of shipped) expect(isReviewed(t)).toBe(false)
  })

  it('solo es Reviewed con revisadaPor y revisadaEn válidos', () => {
    expect(state(base).reviewState).toBe('PendingReview')
    expect(state({ ...base, revisadaPor: 'Dennys Heras' }).reviewState).toBe('PendingReview')
    expect(state({ ...base, revisadaEn: '2026-11-02' }).reviewState).toBe('PendingReview')
    expect(state({ ...base, revisadaPor: '', revisadaEn: '2026-11-02' }).reviewState).toBe('PendingReview')
    expect(state({ ...base, revisadaPor: 'X', revisadaEn: 'ayer' }).reviewState).toBe('PendingReview')
    const ok = state(reviewed(base))
    expect(ok.reviewState).toBe('Reviewed')
    expect(ok.reviewedAt).toBe('2026-11-02')
  })

  it('PendingReview no incluye reviewedAt', () => {
    expect('reviewedAt' in state(base)).toBe(false)
  })
})

describe('plantillas entregadas', () => {
  it('cubren R-01..R-03 y allow, en español e inglés, con versión', () => {
    expect(shipped.map((t) => t.id).sort()).toEqual(['expl-R-01', 'expl-R-02', 'expl-R-03', 'expl-allow'])
    for (const t of shipped) {
      expect(t.text.es.length).toBeGreaterThan(20)
      expect(t.text.en.length).toBeGreaterThan(20)
      expect(typeof t.version).toBe('string')
      expect(t.generadaCon).toBeTruthy()
    }
  })
})

describe('compuerta de build explain-review (AC-23)', () => {
  const gate = (env, file) =>
    spawnSync('node', ['scripts/test-static.mjs', 'explain-review'], {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: env, ...(file ? { EXPLAIN_TEMPLATES: file } : {}) },
    })
  const tmp = (templates) => {
    const f = join(mkdtempSync(join(tmpdir(), 'expl-')), 't.json')
    writeFileSync(f, JSON.stringify({ version: '1', templates }))
    return f
  }

  const bare = shipped.map(({ publicarSinRevision, ...t }) => t) // plantillas sin la autorización explícita
  const authorize = (t) => ({ ...t, publicarSinRevision: { autorizadaPor: 'Dennys Heras', fecha: '2026-10-30', razon: 'primera publicación' } })

  it('en producción falla si hay plantillas sin revisar y SIN autorización explícita, y las nombra', () => {
    const r = gate('production', tmp(bare))
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('expl-R-01')
  })

  it('en producción pasa si las sin revisar llevan autorización explícita y trazable (primera publicación)', () => {
    const r = gate('production', tmp(bare.map(authorize)))
    expect(r.status).toBe(0)
    expect(r.stdout).toMatch(/autorizad/i)
  })

  it('una autorización incompleta (sin quién, fecha o razón) no vale', () => {
    for (const drop of ['autorizadaPor', 'fecha', 'razon']) {
      const a = authorize(bare[0]); delete a.publicarSinRevision[drop]
      expect(gate('production', tmp([a, ...bare.slice(1).map(authorize)])).status, drop).toBe(1)
    }
    const empty = authorize(bare[0]); empty.publicarSinRevision.razon = '  '
    expect(gate('production', tmp([empty, ...bare.slice(1).map(authorize)])).status).toBe(1)
  })

  it('las plantillas entregadas están autorizadas y siguen siendo PendingReview (el sitio lo muestra)', () => {
    expect(gate('production').status).toBe(0)
    for (const t of shipped) {
      expect(t.publicarSinRevision).toMatchObject({ autorizadaPor: 'Dennys Heras', fecha: '2026-10-30' })
      expect(t.publicarSinRevision.razon.length).toBeGreaterThan(10)
      expect(isReviewed(t)).toBe(false)
    }
  })

  it('autorizar la publicación no convierte la plantilla en "revisada por humano"', () => {
    const { outcome, ctx } = run('A')
    expect(explain(outcome, shipped, 'es', ctx).reviewState).toBe('PendingReview')
  })

  it('en desarrollo pasa aunque estén sin revisar', () => {
    expect(gate('development').status).toBe(0)
  })

  it('en producción pasa si todas están revisadas', () => {
    expect(gate('production', tmp(shipped.map(reviewed))).status).toBe(0)
  })

  it('en producción falla si solo una carece de revisión', () => {
    const mixed = shipped.map((t, i) => (i === 0 ? t : reviewed(t)))
    expect(gate('production', tmp(mixed.map((t, i) => (i === 0 ? bare[0] : t)))).status).toBe(1)
  })
})
