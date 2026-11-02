import React, { useEffect, useRef, useState } from 'react'
import { site, links } from '../content/site.js'
import NodeIcon from './icons.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import TelegramBots from '../components/TelegramBots.jsx'
import { codePanel } from './code-panel.js'
import { peopleRules, machineRules } from './rules.js'
import { startTyping, prefersReducedMotion, DURATION_MS } from './typewriter.js'
import { VIEW, HEAD, RING_R, arcPath, linePoints } from './geometry.js'
import { pagePaths, alternateOf } from '../routes.js'
import ruleset from '../../content/ruleset.v1.json'
import staticExample from '../demo/static-example.json'

// Retraso de intención: un paso del puntero por encima de un nodo no abre su vista previa.
export const HOVER_DELAY_MS = 120
// Margen para pasar del nodo a su panel sin que la vista previa se cierre.
export const LEAVE_GRACE_MS = 350

export function FirstBar({ lang }) {
  const c = site[lang]
  const other = lang === 'es' ? 'en' : 'es'
  return (
    <div className="bar">
      <a className="skip" href="#main">{c.nav.skip}</a>
      <a className="bar-brand" href={`/${lang}/`}>Dennysh</a>
      <nav aria-label={c.nav.menu}>
        <a href={links.cv}>{c.home.bar.cv}</a>
        <a href={alternateOf(lang, 'home')} hrefLang={other} lang={other}>{other.toUpperCase()}</a>
        <ThemeToggle lang={lang} />
      </nav>
    </div>
  )
}

// Texto que "se escribe": el texto completo siempre está en el HTML; solo cambia cuánto se ve (el resto, transparente).
function Typed({ text, run, skip }) {
  const [n, setN] = useState(text.length)
  const ctl = useRef(null)
  useEffect(() => {
    if (!run) return undefined
    ctl.current = startTyping({ length: text.length, onProgress: setN })
    return () => ctl.current?.stop()
  }, [run, text])
  useEffect(() => { if (skip) ctl.current?.skip() }, [skip])
  return <><span>{text.slice(0, n)}</span><span className="t-off">{text.slice(n)}</span></>
}

function Panel({ id, active, children, onClick, onEnter, onLeave, className = '' }) {
  return (
    <section id={`p-${id}`} className={`panel ${className}`} data-active={active ? 'true' : undefined} aria-labelledby={`p-${id}-h`} onClick={onClick} onPointerEnter={onEnter} onPointerLeave={onLeave}>
      {children}
    </section>
  )
}

const Open = ({ lang, id }) => {
  const p = site[lang].home.panels[id]
  return <><p className="opens">{p.opens}</p><a className="btn btn-primary" href={pagePaths[lang][id]}>{p.go}</a></>
}

const PageCard = ({ lang, id, run, skip, ...rest }) => {
  const p = site[lang].home.panels[id]
  return (
    <Panel id={id} {...rest}>
      <h2 id={`p-${id}-h`}>{p.title}</h2>
      <p className="card-text"><Typed text={p.text ?? p.thought} run={run} skip={skip} /></p>
      {id === 'projects' && <TelegramBots lang={lang} group={site[lang].work.items.find((i) => i.bots)} />}
      <Open lang={lang} id={id} />
    </Panel>
  )
}

// :focus-visible no existe en navegadores antiguos: ahí el foco no abre la vista previa (el enlace sigue funcionando).
const keyboardFocus = (el) => { try { return el.matches(':focus-visible') } catch { return false } }
const isMouse = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen'

export default function FirstScreen({ lang }) {
  const c = site[lang]
  const h = c.home
  const [active, setActive] = useState('demo') // panel que se ve (reposo: Demo)
  const [pointed, setPointed] = useState(null) // nodo señalado ahora: muestra su línea y el anillo
  const [enhanced, setEnhanced] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [tab, setTab] = useState('people')
  const [runs, setRuns] = useState({})
  const [skip, setSkip] = useState(0)
  const typingUntil = useRef(0) // instante hasta el que se está escribiendo el panel elegido (0 = nada que completar)
  const timer = useRef(0) // retraso de intención
  const off = useRef(0) // margen de salida
  const hoverSheet = useRef(false) // la hoja la abrió el ratón: se cierra al apartarlo
  useEffect(() => { setEnhanced(true); return () => { clearTimeout(timer.current); clearTimeout(off.current) } }, [])

  const codeText = codePanel(ruleset, staticExample, lang).join('\n')
  const people = peopleRules(lang)
  const machines = machineRules(lang)

  const show = (id, viaMouse = false) => {
    hoverSheet.current = viaMouse
    if (id !== active) {
      setRuns((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))
      // Solo los paneles con texto que se escribe (no "Cómo trabajo") y sin movimiento reducido tienen algo que completar.
      typingUntil.current = id !== 'how' && !prefersReducedMotion() ? performance.now() + DURATION_MS : 0
    }
    setActive(id)
    setPointed(id)
    setSheet(true)
  }
  // Vista previa al pasar el puntero (con retraso de intención) o al enfocar con teclado (sin retraso).
  const preview = (id, delay, viaMouse = false) => {
    clearTimeout(timer.current)
    clearTimeout(off.current)
    if (delay) timer.current = setTimeout(() => show(id, viaMouse), delay)
    else show(id, viaMouse)
  }
  const leave = () => { clearTimeout(timer.current); clearTimeout(off.current); off.current = setTimeout(() => { setPointed(null); if (hoverSheet.current) setSheet(false) }, LEAVE_GRACE_MS) }
  const stay = () => clearTimeout(off.current)
  const completeTyping = () => {
    if (performance.now() >= typingUntil.current) return false
    typingUntil.current = 0
    setSkip((s) => s + 1)
    return true
  }
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (!completeTyping()) { clearTimeout(timer.current); clearTimeout(off.current); setSheet(false); setPointed(null) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  const complete = () => { completeTyping() }
  // Táctil: el primer toque abre la vista previa (con su botón "Abrir página"); el segundo toque sobre el mismo nodo navega.
  const onNodeClick = (e, id) => {
    const type = e.nativeEvent.pointerType
    // Si el navegador emite el clic sin pointerType, un dispositivo sin hover cuenta como táctil.
    const touch = type === 'touch' || (type === undefined && typeof matchMedia === 'function' && matchMedia('(hover: none)').matches)
    if (touch && !(sheet && active === id)) { e.preventDefault(); preview(id, 0) }
  }

  const run = (id) => runs[id]
  const is = (id) => active === id
  const panelProps = (id) => ({ active: is(id), onClick: complete, onEnter: stay, onLeave: leave })

  return (
    <section id="inicio" className="first" data-js={enhanced ? 'true' : undefined} aria-labelledby="hero-h">
      <div className="canvas" data-sheet={sheet ? 'open' : undefined}>
        <FirstBar lang={lang} />
        <img
          className="portrait"
          src="/images/dennys-portrait.webp"
          srcSet="/images/dennys-portrait-360.webp 360w, /images/dennys-portrait.webp 900w"
          sizes="(max-width: 760px) 96px, 33vw"
          width="900"
          height="1210"
          alt={h.portraitAlt}
          fetchpriority="high"
          decoding="async"
        />
        <svg className="lines" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true" focusable="false">
          <path className="arc" d={arcPath()} />
          <circle className="ring" cx={HEAD.x} cy={HEAD.y} r={RING_R} pathLength="1" data-on={pointed ? 'true' : undefined} />
          {h.nodes.map((n) => { const p = linePoints(n.id); return <line key={n.id} className="line" data-line={n.id} pathLength="1" x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2} data-on={pointed === n.id ? 'true' : undefined} /> })}
        </svg>
        <nav className="nodes" aria-label={h.nodesLabel}>
          <ul>
            {h.nodes.map((n) => (
              <li key={n.id} className={`node n-${n.id}`}>
                <a
                  className="node-link"
                  data-node={n.id}
                  href={pagePaths[lang][n.id]}
                  aria-controls={`p-${n.id}`}
                  aria-expanded={enhanced ? sheet && is(n.id) : undefined}
                  onPointerEnter={(e) => isMouse(e) && preview(n.id, HOVER_DELAY_MS, true)}
                  onPointerLeave={(e) => isMouse(e) && leave()}
                  onFocus={(e) => keyboardFocus(e.target) && preview(n.id, 0)}
                  onBlur={leave}
                  onClick={(e) => onNodeClick(e, n.id)}
                >
                  <NodeIcon id={n.id} /><span>{n.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="phrase">
          <h1 id="hero-h">{h.phrase}</h1>
          <p className="tagline">{h.tagline[0]}<br />{h.tagline[1]}</p>
        </div>
        <div className="panels">
          <Panel id="code" {...panelProps('code')} className="has-pre">
            <h2 id="p-code-h">{h.panels.code.title}</h2>
            <pre className="code" tabIndex={0}><Typed text={codeText} run={run('code')} skip={skip} /></pre>
            <p className="note">{h.panels.code.note}</p>
            <p className="panel-links"><a href={links.github} rel="noopener noreferrer">{h.panels.code.github}</a></p>
            <Open lang={lang} id="code" />
          </Panel>
          <PageCard lang={lang} id="projects" run={run('projects')} skip={skip} {...panelProps('projects')} />
          <PageCard lang={lang} id="demo" run={run('demo')} skip={skip} {...panelProps('demo')} />
          <PageCard lang={lang} id="journey" run={run('journey')} skip={skip} {...panelProps('journey')} />
          <Panel id="how" {...panelProps('how')} className="has-pre">
            <h2 id="p-how-h">{h.panels.how.title}</h2>
            <div className={enhanced ? 'tabs' : 'tabs tabs-static'} role={enhanced ? 'tablist' : undefined}>
              {enhanced && ['people', 'machines'].map((k) => (
                <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`tabpanel-${k}`} onClick={(e) => { e.stopPropagation(); setTab(k) }}>{h.panels.how.tabs[k]}</button>
              ))}
            </div>
            <div className="tabstack">
            <div id="tabpanel-people" role={enhanced ? 'tabpanel' : undefined} aria-labelledby={enhanced ? 'tab-people' : undefined} data-off={enhanced && tab !== 'people' ? 'true' : undefined}>
              {!enhanced && <h3>{h.panels.how.tabs.people}</h3>}
              <ol className="people">{people.map((t) => <li key={t}>{t}</li>)}</ol>
            </div>
            <div id="tabpanel-machines" role={enhanced ? 'tabpanel' : undefined} aria-labelledby={enhanced ? 'tab-machines' : undefined} data-off={enhanced && tab !== 'machines' ? 'true' : undefined}>
              {!enhanced && <h3>{h.panels.how.tabs.machines}</h3>}
              <pre className="code" tabIndex={0}>{machines}</pre>
            </div>
            </div>
            <Open lang={lang} id="how" />
          </Panel>
          <PageCard lang={lang} id="interest" run={run('interest')} skip={skip} {...panelProps('interest')} />
        </div>
      </div>
    </section>
  )
}
