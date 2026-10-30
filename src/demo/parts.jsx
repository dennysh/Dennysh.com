// Piezas de presentación de la demo. Reciben la vista del servidor (AuditView) y no deciden nada.
import React from 'react'
import { UI, fmt } from './strings.js'
import { utcLabel, localLabel, hhmmLocal, explanationText } from './format.js'

const tzOf = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export function Times({ iso, lang, tz = tzOf() }) {
  return (
    <span className="times">
      <time dateTime={iso}>{utcLabel(iso)}</time>
      <span className="sep"> · </span>
      <span>{localLabel(iso, lang, tz)} <small>({UI[lang].audit.local})</small></span>
    </span>
  )
}

export function EventPanel({ audit, lang }) {
  const t = UI[lang].event
  const p = audit.input.params
  const label = (k) => t[k] ?? k
  const rows = [[t.account, audit.input.accountLabel], [t.origin, audit.input.sourceIp]]
  if (audit.input.kind === 'A') rows.push([t.failedAttempts, p.failedAttempts], [t.windowSeconds, p.windowSeconds])
  if (audit.input.kind === 'B') rows.push([t.fromCity, label(p.fromCity)], [t.toCity, label(p.toCity)], [t.distanceKm, p.distanceKm], [t.minutes, p.minutes], [t.impliedSpeedKmh, p.impliedSpeedKmh])
  if (audit.input.kind === 'C') rows.push([t.action, t.bulkExport], [t.localTime, p.localTime], [t.orgZone, label(p.orgZone)])
  return (
    <dl className="kv" data-testid="event">
      {rows.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd className="mono">{String(v)}</dd></div>
      ))}
    </dl>
  )
}

export function DecisionBadge({ audit, lang }) {
  const d = UI[lang].decision
  const hint = d[`hint${audit.decision}`]
  const mark = { Block: '✕', Limit: '⏱', Alert: '!', Allow: '✓' }[audit.decision]
  const extra = audit.decision === 'Limit' && audit.explanation.params.durationLabel === '15min' ? ` (${d.minutes15})` : ''
  return (
    <div className={`decision decision-${audit.decision.toLowerCase()}`} data-testid="decision">
      <span className="decision-mark" aria-hidden="true">{mark}</span>
      <div>
        <p className="decision-word">{d[audit.decision]}{extra}</p>
        <p className="decision-hint">{hint}</p>
      </div>
    </div>
  )
}

const dataLabel = (lang, k) => UI[lang].data[k] ?? k

export function ExplanationPanel({ audit, lang }) {
  const t = UI[lang].explanation
  const ex = audit.explanation
  const reviewed = ex.reviewState === 'Reviewed'
  const text = explanationText(ex, lang)
  return (
    <div data-testid="explanation">
      <p className="explanation-text">{text}</p>
      <p className={`review-tag ${reviewed ? 'is-reviewed' : 'is-pending'}`} data-testid="review-state">
        {reviewed ? `${t.reviewed} · ${ex.reviewedAt}` : t.pending} · {t.version} {ex.version}
      </p>
      <dl className="kv">
        <div><dt>{t.rule}</dt><dd className="mono">{audit.matched.map((m) => m.ruleId).join(', ') || '—'} · ruleset v{audit.ruleset.version} · sha256:{audit.ruleset.hash.slice(0, 8)}…</dd></div>
        <div><dt>{t.used}</dt><dd>{audit.usedData.map((k) => dataLabel(lang, k)).join(', ')}</dd></div>
        <div><dt>{t.unused}</dt><dd>{audit.unusedData.map((k) => dataLabel(lang, k)).join(', ')}</dd></div>
        <div><dt>{t.modules}</dt><dd className="mono">{audit.modules.map((m) => `${UI[lang].modules[m.id] ?? m.id} v${m.version}`).join(' · ')}</dd></div>
      </dl>
      <p className="honesty">{reviewed ? t.noteReviewed : t.notePending}</p>
    </div>
  )
}

export function alertLine(alert, lang, tz) {
  const A = UI[lang].alert
  const key = alert.status === 'Grouped' && !alert.groupedWithAtUtc ? 'GroupedNoTime' : alert.status
  let line = fmt(A.status[key] ?? alert.status, { hhmm: alert.groupedWithAtUtc ? hhmmLocal(alert.groupedWithAtUtc, tz) : '' })
  if (alert.status === 'Failed' || alert.status === 'Unconfirmed') {
    const why = A.code[alert.code]
    if (why) line += ` (${why})`
  }
  return line
}

export function AlertPanel({ audit, lang, tz = tzOf() }) {
  const A = UI[lang].alert
  const a = audit.alert
  return (
    <div data-testid="alert" className={`alert alert-${a.status.toLowerCase()}`}>
      <p className="alert-line"><span className="sim-tag">{A.simulation}</span> {alertLine(a, lang, tz)}</p>
      <dl className="kv">
        <div><dt>{UI[lang].audit.to}</dt><dd className="mono">{a.channel === 'telegram' && a.maskedChat ? `Telegram ${a.maskedChat}` : A.channel[a.channel]}</dd></div>
        {a.atUtc && <div><dt>{UI[lang].audit.when}</dt><dd><Times iso={a.atUtc} lang={lang} tz={tz} /></dd></div>}
        {a.fallback && <div><dt>{A.fallback}</dt><dd>{A.fallbackStatus[a.fallback.status] ?? a.fallback.status}</dd></div>}
        {a.escalation && <div><dt>{UI[lang].oversight.escalate}</dt><dd>{A.escalation[a.escalation]}</dd></div>}
      </dl>
    </div>
  )
}

export function AuditPanel({ audit, lang, tz = tzOf() }) {
  const t = UI[lang].audit
  const o = UI[lang].oversight
  const dec = UI[lang].decision
  const ruleIds = audit.matched.map((m) => m.ruleId).join(', ') || '—'
  const rows = [
    [t.eventId, <span className="mono" key="id">{audit.eventId}</span>],
    [t.time, <Times key="t" iso={audit.createdAtUtc} lang={lang} tz={tz} />],
    [t.input, <span className="mono" key="in">{audit.input.accountLabel} · {UI[lang].chips[audit.input.kind] ?? audit.input.kind} · {audit.input.sourceIp}</span>],
    [t.engine, fmt(t.engineValue, { v: audit.engine.version })],
    [t.rule, <span className="mono" key="r">{ruleIds} · sha256:{audit.ruleset.hash.slice(0, 12)}…</span>],
    [t.result, dec[audit.decision]],
    [t.explanation, `${audit.explanation.templateId} · ${UI[lang].explanation.version} ${audit.explanation.version} · ${audit.explanation.reviewState === 'Reviewed' ? UI[lang].explanation.reviewed : UI[lang].explanation.pending}`],
    [t.modules, <span className="mono" key="m">{audit.modules.map((m) => `${m.id} v${m.version}`).join(' · ')}</span>],
    [t.alert, alertLine(audit.alert, lang, tz)],
    [t.to, audit.alert.channel === 'telegram' && audit.alert.maskedChat ? `Telegram ${audit.alert.maskedChat}` : UI[lang].alert.channel[audit.alert.channel]],
    [t.when, audit.alert.atUtc ? <Times key="w" iso={audit.alert.atUtc} lang={lang} tz={tz} /> : '—'],
    [t.intervention, audit.interventions.length === 0 ? t.none : (
      <ol key="iv" className="interventions">
        {audit.interventions.map((i) => (
          <li key={i.seq}><Times iso={i.atUtc} lang={lang} tz={tz} /> · {o[i.action]} · {o.actor}</li>
        ))}
      </ol>
    )],
  ]
  return (
    <div data-testid="audit">
      <dl className="kv audit-grid">
        {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        <div><dt>{o.effective}</dt><dd data-testid="effective">{o[audit.effectiveState]}{audit.escalated ? ` · ${o.escalated}` : ''}</dd></div>
        <div><dt>{t.seal}</dt><dd className="mono">sha256:{audit.recordHash.slice(0, 16)}…</dd></div>
      </dl>
    </div>
  )
}

export function OversightBar({ audit, lang, disabled, notice, onAct }) {
  const o = UI[lang].oversight
  const left = 3 - audit.interventions.length
  const btn = (action, label, hint) => (
    <button type="button" className="btn btn-secondary" disabled={disabled} onClick={() => onAct(action)} data-testid={`act-${action}`} aria-describedby={`hint-${action}`}>
      {label}<span id={`hint-${action}`} className="sr-only"> {hint}</span>
    </button>
  )
  return (
    <div data-testid="oversight">
      <p className="oversight-title">{o.title}</p>
      <div className="actions">
        {btn('approve', o.approve, o.approveHint)}
        {btn('override', o.override, o.overrideHint)}
        {btn('escalate', o.escalate, o.escalateHint)}
      </div>
      <p className="muted" data-testid="remaining">{left > 0 ? fmt(o.remaining, { n: left }) : o.limit}</p>
      {notice === 'limit' && <p role="status" className="notice">{o.limit}</p>}
      {(notice === 'input' || notice === 'unavailable') && <p role="status" className="notice">{o.failed}</p>}
    </div>
  )
}
