import React, { useEffect, useReducer, useRef, useState, useMemo } from 'react'
import { reduce, initialState, STEPS, canIntervene } from './machine.js'
import { createClient } from './api.js'
import { createTokenGetter } from './turnstile.js'
import { UI, fmt } from './strings.js'
import { EventPanel, DecisionBadge, ExplanationPanel, AuditPanel, AlertPanel, OversightBar, alertLine } from './parts.jsx'
import staticExample from './static-example.json'
import './demo.css'

const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function StaticExample({ lang }) {
  const t = UI[lang].staticExample
  return (
    <figure className="static-example" id="static-example" data-testid="static-example">
      <figcaption>
        <strong>{t.title}</strong>
        <span>{t.lead}</span>
      </figcaption>
      <EventPanel audit={staticExample} lang={lang} />
      <DecisionBadge audit={staticExample} lang={lang} />
      <ExplanationPanel audit={staticExample} lang={lang} />
      <AlertPanel audit={staticExample} lang={lang} tz="UTC" />
    </figure>
  )
}

const STAGE = {
  event: (a, lang) => <EventPanel audit={a} lang={lang} />,
  decision: (a, lang) => <DecisionBadge audit={a} lang={lang} />,
  explanation: (a, lang) => <ExplanationPanel audit={a} lang={lang} />,
  audit: (a, lang) => <AuditPanel audit={a} lang={lang} />,
  alert: (a, lang) => <AlertPanel audit={a} lang={lang} />,
}

export default function Demo({ lang = 'es', client, sitekey = import.meta.env?.VITE_TURNSTILE_SITEKEY }) {
  const t = UI[lang]
  const [state, dispatch] = useReducer(reduce, initialState)
  const [chosen, setChosen] = useState('random')
  const slot = useRef(null)
  const api = useMemo(() => client ?? createClient({ getToken: createTokenGetter(sitekey, () => slot.current) }), [client, sitekey])
  const startedAt = useRef(0)

  // Recarga dentro de 24 h: restaura la auditoría guardada por eventId (sin cookies).
  useEffect(() => {
    let alive = true
    api.restore().then((r) => {
      if (!alive || !r) return
      dispatch(r.ok ? { type: 'RESTORE', audit: r.audit } : { type: 'FAIL', kind: r.kind })
    })
    return () => { alive = false }
  }, [api])

  // La reproducción escalonada es solo presentación de un resultado que el servidor ya generó.
  useEffect(() => {
    if (state.phase !== 'revealing') return undefined
    startedAt.current = performance.now()
    const id = setInterval(() => dispatch({ type: 'TICK', elapsedMs: performance.now() - startedAt.current }), 200)
    return () => clearInterval(id)
  }, [state.phase === 'revealing', state.audit?.eventId])

  async function run(scenario) {
    if (state.phase === 'running' || state.phase === 'revealing') return
    dispatch({ type: 'START', scenario })
    const r = await api.simulate({ lang, scenario: scenario === 'random' ? undefined : scenario })
    dispatch(r.ok ? { type: 'RESULT', audit: r.audit, reducedMotion: prefersReducedMotion() } : { type: 'FAIL', kind: r.kind })
  }

  async function act(action) {
    dispatch({ type: 'INTERVENE_START' })
    const r = await api.intervene(state.audit.eventId, action)
    dispatch(r.ok ? { type: 'INTERVENE_OK', audit: r.audit } : { type: 'INTERVENE_FAIL', kind: r.kind })
  }

  const busy = state.phase === 'running' || state.phase === 'revealing'
  const audit = state.audit
  const live = (() => {
    if (!audit || !state.announce) return ''
    if (state.announce === 'event') return t.live.event
    if (state.announce === 'decision') return fmt(t.live.decision, { d: t.decision[audit.decision] })
    if (state.announce === 'alert') return fmt(t.live.alert, { s: alertLine(audit.alert, lang, 'UTC') })
    return t.live.intervention
  })()
  const chip = (id, label) => (
    <button key={id} type="button" className={`chip${chosen === id ? ' is-on' : ''}`} aria-pressed={chosen === id} disabled={busy} onClick={() => { setChosen(id); run(id) }} data-testid={`chip-${id}`}>{label}</button>
  )

  return (
    <div className="demo" data-testid="demo" data-phase={state.phase}>
      <p className="demo-notice">{t.notice}</p>
      <div className="demo-controls">
        <button type="button" className="btn btn-primary btn-xl" disabled={busy} onClick={() => run(chosen)} data-testid="run">
          {busy ? t.running : audit ? t.again : t.run}
        </button>
        {state.phase === 'revealing' && (
          <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'SHOW_ALL' })} data-testid="show-all">{t.showAll}</button>
        )}
        {audit && state.phase !== 'revealing' && (
          <button type="button" className="btn btn-link" onClick={() => dispatch({ type: 'RESET' })} data-testid="reset">{t.reset}</button>
        )}
      </div>
      {audit && (
        <div className="chips" role="group" aria-label={t.chips.label} data-testid="chips">
          {chip('random', t.chips.random)}{chip('A', t.chips.A)}{chip('B', t.chips.B)}{chip('C', t.chips.C)}
        </div>
      )}
      <div ref={slot} className="turnstile-slot" aria-hidden="true" />
      <div className="sr-only" role="status" aria-live="polite" data-testid="live">{live}</div>

      {state.phase === 'error' && (
        <div className="demo-error" role="alert" data-testid="error">
          <p>{t.errors[state.error]}</p>
          {(state.error === 'turnstile' || state.error === 'unavailable') && <StaticExample lang={lang} />}
        </div>
      )}

      {audit && (
        <div className="stages" data-testid="stages">
          {STEPS.slice(0, 5).map((step, i) => state.revealed > i && (
            <section key={step} className={`stage stage-${step}`} data-testid={`stage-${step}`} aria-labelledby={`h-${step}`}>
              <h3 id={`h-${step}`}>{t.stages[step]}</h3>
              {STAGE[step](audit, lang)}
            </section>
          ))}
          {state.revealed > 5 && (
            <section className="stage stage-oversight" data-testid="stage-oversight" aria-labelledby="h-oversight">
              <h3 id="h-oversight">{t.stages.oversight}</h3>
              <OversightBar audit={audit} lang={lang} disabled={!canIntervene(state)} notice={state.notice} onAct={act} />
            </section>
          )}
        </div>
      )}
      <noscript><StaticExample lang={lang} /></noscript>
    </div>
  )
}
