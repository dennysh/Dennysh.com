import React, { useEffect, useRef, useState } from 'react'
import { site, links } from '../content/site.js'
import { legalPaths } from '../routes.js'
import { INTENTS, FIELDS, stepsFor, contactFields, fieldsFor, validateStep } from '../../core/contact.js'
import { createContactClient } from './api.js'
import { createTokenGetter } from '../demo/turnstile.js'

const PREVIEW_STEPS = 7 // antes de elegir la opción, el recorrido más largo
const fill = (t, vars) => t.replace(/\{(\w+)\}/g, (_, k) => vars[k])

// Formulario adaptativo por pasos (D4): una pregunta por paso, las preguntas dependen de la opción, barra de progreso y botón Atrás.
// Sin JavaScript (o mientras se comprueba, o si el servidor lo tiene desactivado) se muestra el enlace de correo en su lugar.
export default function ContactForm({ lang, client, getToken, sitekey = import.meta.env?.VITE_TURNSTILE_SITEKEY }) {
  const t = site[lang].contactForm
  const [phase, setPhase] = useState('pending') // pending | disabled | form | sent
  const [values, setValues] = useState({ consent: false })
  const [idx, setIdx] = useState(0)
  const [errors, setErrors] = useState([]) // campos con problema en el paso actual
  const [failure, setFailure] = useState(null) // estado devuelto por el servidor
  const [busy, setBusy] = useState(false)
  const [focusKey, setFocusKey] = useState(0) // sube solo cuando una validación falla: el foco va al primer campo con error
  const api = useRef(client ?? createContactClient())
  const slot = useRef(null)
  const heading = useRef(null)
  const moved = useRef(false)
  const tokenGetter = useRef(getToken ?? createTokenGetter(sitekey, () => slot.current))

  useEffect(() => {
    let alive = true
    api.current.status().then((ok) => { if (alive) setPhase(ok ? 'form' : 'disabled') })
    return () => { alive = false }
  }, [])

  const intent = INTENTS.includes(values.intent) ? values.intent : null
  const steps = stepsFor(intent)
  const stepId = steps[Math.min(idx, steps.length - 1)]
  const total = intent ? steps.length : PREVIEW_STEPS

  // Foco gestionado: al cambiar de paso el foco va al título del paso; con errores, al primer campo con problema.
  useEffect(() => {
    if (!moved.current) return
    heading.current?.focus()
  }, [idx, phase])
  // Solo al fallar una validación (no cuando escribir en otro campo va quitando errores: eso le robaría el foco a quien teclea).
  useEffect(() => {
    if (!focusKey || !errors.length) return
    const el = document.getElementById(`cf-${errors[0]}`) ?? document.querySelector(`[name="${errors[0]}"]`)
    el?.focus()
  }, [focusKey])

  const set = (name, v) => { setValues((o) => ({ ...o, [name]: v })); setErrors((e) => e.filter((x) => x !== name)); setFailure(null) }
  const chooseIntent = (v) => {
    // Al cambiar de opción se descartan las respuestas que ya no pertenecen a la ruta (el servidor rechaza campos de más).
    setValues((o) => { const keep = new Set(fieldsFor(v)); return Object.fromEntries(Object.entries(o).filter(([k]) => k === 'consent' || k === 'intent' || keep.has(k))) })
    set('intent', v)
  }

  const go = (to) => { moved.current = true; setErrors([]); setFailure(null); setIdx(to) }
  const next = () => {
    const bad = validateStep(intent, stepId, values)
    if (bad.length) { setErrors(bad); setFocusKey((k) => k + 1); return }
    go(idx + 1)
  }
  const back = () => { if (!busy) go(Math.max(0, idx - 1)) }

  const submit = async () => {
    const bad = validateStep(intent, 'send', values)
    if (bad.length) { setErrors(bad); setFocusKey((k) => k + 1); return }
    setBusy(true); setFailure(null)
    let token
    try { token = await tokenGetter.current() } catch { setBusy(false); return setFailure('bot') }
    const payload = { intent, lang, consent: true, turnstileToken: token }
    for (const f of fieldsFor(intent)) if ((values[f] ?? '') !== '') payload[f] = values[f]
    const r = await api.current.send(payload)
    setBusy(false)
    if (r.ok) { moved.current = true; return setPhase('sent') }
    if (r.kind === 'disabled') return setPhase('disabled')
    setFailure(r.kind)
  }
  const onSubmit = (e) => { e.preventDefault(); if (busy) return; if (stepId === 'send') submit(); else next() }

  if (phase === 'pending' || phase === 'disabled') {
    return (
      <>
        <p className="lead">{t.leadOff}</p>
        <div className="cf-fallback" data-contact-form={phase}>
          <p>{phase === 'disabled' ? t.disabled : t.fallback}</p>
          <a className="btn btn-primary btn-xl" href={links.email}>{links.emailAddress}</a>
        </div>
      </>
    )
  }
  if (phase === 'sent') {
    return <p className="cf-done" role="status" tabIndex={-1} ref={heading} data-contact-form="sent">{t.status.sent}</p>
  }

  const err = (f) => errors.includes(f)
  const errText = (f) => (f === 'consent' ? t.errors.consent : f === 'email' ? t.errors.email : FIELDS[f]?.kind === 'enum' || f === 'intent' ? t.errors.choose : (values[f] ?? '') === '' ? t.errors.required : t.errors.text)
  const Err = ({ f }) => (err(f) ? <p className="cf-error" role="alert" id={`cf-${f}-err`}>{errText(f)}</p> : null)
  const label = (f) => (f === 'name' || f === 'email' || f === 'message') && stepId === 'contact' ? t.contact[f] : t.questions[f]?.label ?? t.contact[f]

  const radios = (f, opts, text) => (
    <div role="radiogroup" aria-labelledby="cf-q" aria-describedby={err(f) ? `cf-${f}-err` : undefined} className="cf-options">
      {opts.map((o, i) => (
        <label key={o} className="cf-option">
          <input type="radio" name={f} id={i === 0 ? `cf-${f}` : undefined} value={o} checked={values[f] === o} onChange={() => (f === 'intent' ? chooseIntent(o) : set(f, o))} />
          <span>{text[o]}</span>
        </label>
      ))}
    </div>
  )
  const field = (f, { multiline = false, type = 'text', labelText, hint, optional } = {}) => {
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <div className="cf-field" key={f}>
        <label htmlFor={`cf-${f}`}>{labelText}{optional ? ` ${t.optional}` : ''}</label>
        {hint && <p className="cf-hint" id={`cf-${f}-hint`}>{hint}</p>}
        <Tag id={`cf-${f}`} name={f} type={multiline ? undefined : type} rows={multiline ? 5 : undefined} value={values[f] ?? ''} autoComplete={f === 'name' ? 'name' : f === 'email' ? 'email' : 'off'} aria-invalid={err(f) || undefined} aria-describedby={[hint ? `cf-${f}-hint` : null, err(f) ? `cf-${f}-err` : null].filter(Boolean).join(' ') || undefined} onChange={(e) => set(f, e.target.value)} />
        <Err f={f} />
      </div>
    )
  }

  let body
  let question
  if (stepId === 'intent') {
    question = t.intent.q
    body = <>{radios('intent', INTENTS, t.intent.options)}<Err f="intent" /></>
  } else if (stepId === 'contact') {
    question = t.contact.q
    body = contactFields(intent).map((f) => field(f, { multiline: f === 'message', type: f === 'email' ? 'email' : 'text', labelText: t.contact[f], optional: f === 'message' }))
  } else if (stepId === 'send') {
    question = t.review.q
    const rows = [[t.intent.q, t.intent.options[intent]], ...fieldsFor(intent).filter((f) => values[f]).map((f) => [label(f), FIELDS[f].kind === 'enum' ? t.questions[f].options[values[f]] : values[f]])]
    body = (
      <>
        <h4 className="cf-summary-title">{t.review.summary}</h4>
        <dl className="cf-summary">{rows.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
        <label className="cf-consent"><input type="checkbox" id="cf-consent" name="consent" checked={values.consent === true} aria-describedby={err('consent') ? 'cf-consent-err' : undefined} onChange={(e) => set('consent', e.target.checked)} /> <span>{t.review.consent} <a href={legalPaths[lang].privacy}>{t.review.privacy}</a></span></label>
        <Err f="consent" />
        <p className="cf-hint">{t.review.human}</p>
        <div ref={slot} className="turnstile-slot" />
        {failure && <p className="cf-error" role="alert">{t.status[failure] ?? t.status.unavailable}{failure === 'unavailable' && <> <a href={links.email}>{links.emailAddress}</a></>}</p>}
      </>
    )
  } else if (FIELDS[stepId].kind === 'enum') {
    question = t.questions[stepId].q
    body = <>{radios(stepId, FIELDS[stepId].values, t.questions[stepId].options)}<Err f={stepId} /></>
  } else {
    question = t.questions[stepId].q
    body = field(stepId, { multiline: FIELDS[stepId].multiline, labelText: t.questions[stepId].label, hint: t.questions[stepId].hint, optional: FIELDS[stepId].optional })
  }

  return (
    <>
    <p className="lead">{t.lead}</p>
    <form className="cf" noValidate onSubmit={onSubmit} data-contact-form="form" data-step={stepId}>
      <p className="cf-progress-text" id="cf-progress-text">{fill(t.progress, { k: idx + 1, n: total })}</p>
      <progress className="cf-progress" max={total} value={idx + 1} aria-labelledby="cf-progress-text" />
      <fieldset className="cf-step" aria-labelledby="cf-q">
        <h3 id="cf-q" ref={heading} tabIndex={-1}>{question}</h3>
        {body}
      </fieldset>
      <div className="cf-nav">
        {idx > 0 && <button type="button" className="btn btn-secondary" onClick={back} aria-disabled={busy || undefined}>{t.back}</button>}
        {stepId === 'send'
          ? <button type="submit" className="btn btn-primary" aria-disabled={busy || undefined}>{busy ? t.sending : t.send}</button>
          : <button type="submit" className="btn btn-primary">{t.next}</button>}
      </div>
    </form>
    </>
  )
}
