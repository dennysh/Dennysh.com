import React, { useEffect, useRef, useState } from 'react'
import { site, links } from '../content/site.js'
import Txt from '../components/Txt.jsx'
import NodeIcon from './icons.jsx'
import { codePanel } from './code-panel.js'
import { peopleRules, machineRules } from './rules.js'
import { startTyping, prefersReducedMotion } from './typewriter.js'
import { pagePaths, alternateOf } from '../routes.js'
import ruleset from '../../content/ruleset.v1.json'
import staticExample from '../demo/static-example.json'

const HEAD = { x: 550, y: 262 }
// Centros de los iconos en el lienzo de 1100×720 (spec §2). Las clases CSS usan los mismos valores en porcentaje.
const POINTS = { code: [120, 214], projects: [232, 112], demo: [392, 62], journey: [708, 62], how: [868, 112], interest: [980, 214] }
const curve = ([x, y]) => `M${HEAD.x} ${HEAD.y} Q${(HEAD.x + x) / 2} ${Math.min(y, HEAD.y) - 36} ${x} ${y}`

export function FirstBar({ lang }) {
  const c = site[lang]
  const other = lang === 'es' ? 'en' : 'es'
  return (
    <div className="bar">
      <a className="skip" href="#main">{c.nav.skip}</a>
      <a className="bar-brand" href={`/${lang}/`}>Dennysh</a>
      <nav aria-label={c.nav.menu}>
        <a href={links.cv}>{c.home.bar.cv}</a>
        <a href="#contact">{c.home.bar.contact}</a>
        <a href={alternateOf(lang, 'home')} hrefLang={other} lang={other}>{other.toUpperCase()}</a>
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

function Panel({ id, active, children, onClick, className = '' }) {
  return (
    <section id={`p-${id}`} className={`panel ${className}`} data-active={active ? 'true' : undefined} aria-labelledby={`p-${id}-h`} onClick={onClick}>
      {children}
    </section>
  )
}

const PageCard = ({ lang, id, run, skip, active, onClick }) => {
  const p = site[lang].home.panels[id]
  return (
    <Panel id={id} active={active} onClick={onClick}>
      <h2 id={`p-${id}-h`}>{p.title}</h2>
      <p className="card-text"><Typed text={p.text} run={run} skip={skip} /></p>
      <p className="opens">{p.opens}</p>
      <a className="btn btn-primary" href={pagePaths[lang][id]}>{p.go}</a>
    </Panel>
  )
}

export default function FirstScreen({ lang }) {
  const c = site[lang]
  const h = c.home
  const [active, setActive] = useState('demo')
  const [enhanced, setEnhanced] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [tab, setTab] = useState('people')
  const [runs, setRuns] = useState({})
  const [skip, setSkip] = useState(0)
  const typing = useRef(false)
  useEffect(() => setEnhanced(true), [])

  const codeText = codePanel(ruleset, staticExample, lang).join('\n')
  const people = peopleRules(lang)
  const machines = machineRules(lang)

  const choose = (id) => {
    if (id === active && sheet) { setSheet(false); return }
    setActive(id)
    setSheet(true)
    setRuns((r) => ({ ...r, [id]: (r[id] ?? 0) + 1 }))
    typing.current = !prefersReducedMotion() // con movimiento reducido el texto aparece completo: no hay nada que completar
    setTimeout(() => { typing.current = false }, 1850)
  }
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (typing.current) { setSkip((s) => s + 1); typing.current = false } else setSheet(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  const complete = () => { if (typing.current) { setSkip((s) => s + 1); typing.current = false } }

  const hrefFor = (id) => (id === 'projects' || id === 'demo' || id === 'journey' ? pagePaths[lang][id] : `#p-${id}`)
  const run = (id) => runs[id]
  const is = (id) => active === id

  return (
    <section id="inicio" className="first" aria-labelledby="hero-h">
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
        <svg className="lines" viewBox="0 0 1100 720" aria-hidden="true" focusable="false">
          {h.nodes.map((n) => <path key={n.id} className="line" d={curve(POINTS[n.id])} data-on={is(n.id) ? "true" : undefined} />)}
        </svg>
        <nav className="nodes" aria-label={h.nodesLabel}>
          <ul>
            {h.nodes.map((n) => (
              <li key={n.id} className={`node n-${n.id}`}>
                {enhanced ? (
                  <button type="button" className="node-link" data-node={n.id} aria-pressed={is(n.id)} aria-controls={`p-${n.id}`} onClick={() => choose(n.id)}>
                    <NodeIcon id={n.id} /><span>{n.label}</span>
                  </button>
                ) : (
                  <a className="node-link" data-node={n.id} href={hrefFor(n.id)}>
                    <NodeIcon id={n.id} /><span>{n.label}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="phrase">
          <h1 id="hero-h">{c.hero.thesis}</h1>
          <p className="tagline">{h.tagline[0]}<br />{h.tagline[1]}</p>
        </div>
        <div className="panels">
          <Panel id="code" active={is('code')} onClick={complete} className="has-pre">
            <h2 id="p-code-h">{h.panels.code.title}</h2>
            <pre className="code" tabIndex={0}><Typed text={codeText} run={run('code')} skip={skip} /></pre>
            <p className="note">{h.panels.code.note}</p>
            <p className="panel-links"><a href={links.github} rel="noopener noreferrer">{h.panels.code.github}</a> <a href={pagePaths[lang].projects}>{h.panels.code.projects}</a></p>
          </Panel>
          <PageCard lang={lang} id="projects" run={run('projects')} skip={skip} active={is('projects')} onClick={complete} />
          <PageCard lang={lang} id="demo" run={run('demo')} skip={skip} active={is('demo')} onClick={complete} />
          <PageCard lang={lang} id="journey" run={run('journey')} skip={skip} active={is('journey')} onClick={complete} />
          <Panel id="how" active={is('how')} onClick={complete} className="has-pre">
            <h2 id="p-how-h">{h.panels.how.title}</h2>
            <div className={enhanced ? 'tabs' : 'tabs tabs-static'} role={enhanced ? 'tablist' : undefined}>
              {enhanced && ['people', 'machines'].map((k) => (
                <button key={k} type="button" role="tab" id={`tab-${k}`} aria-selected={tab === k} aria-controls={`tabpanel-${k}`} onClick={(e) => { e.stopPropagation(); setTab(k) }}>{h.panels.how.tabs[k]}</button>
              ))}
            </div>
            <div id="tabpanel-people" role={enhanced ? 'tabpanel' : undefined} aria-labelledby={enhanced ? 'tab-people' : undefined} hidden={enhanced && tab !== 'people'}>
              {!enhanced && <h3>{h.panels.how.tabs.people}</h3>}
              <ol className="people">{people.map((t) => <li key={t}>{t}</li>)}</ol>
            </div>
            <div id="tabpanel-machines" role={enhanced ? 'tabpanel' : undefined} aria-labelledby={enhanced ? 'tab-machines' : undefined} hidden={enhanced && tab !== 'machines'}>
              {!enhanced && <h3>{h.panels.how.tabs.machines}</h3>}
              <pre className="code" tabIndex={0}>{machines}</pre>
            </div>
            <p className="panel-links"><a href="#governance">{h.panels.how.read}</a></p>
          </Panel>
          <Panel id="interest" active={is('interest')} onClick={complete}>
            <h2 id="p-interest-h">{h.panels.interest.title}</h2>
            <p className="sports"><strong>{h.panels.interest.sportsLabel}:</strong> {h.panels.interest.sports.map((s, i) => <React.Fragment key={i}>{i > 0 && ', '}<Txt lang={lang} v={s} /></React.Fragment>)}</p>
            <p className="card-text"><Typed text={h.panels.interest.thought} run={run('interest')} skip={skip} /></p>
            <p className="panel-links"><a href="#contact">{h.panels.interest.contact}</a></p>
          </Panel>
        </div>
        <p className="hint" aria-hidden="true">{h.hint} ↓</p>
      </div>
      <div className="below wrap">
        <div className="cta">
          <a className="btn btn-primary" href={pagePaths[lang].demo}>{c.hero.tryDemo}</a>
          <a className="btn btn-secondary" href="#contact">{c.hero.contact}</a>
        </div>
        <aside className="summary" aria-labelledby="sum-h" id="summary">
          <h2 id="sum-h">{c.hero.summaryTitle}</h2>
          <ol>{c.hero.summary.map((s) => <li key={s}>{s}</li>)}</ol>
        </aside>
      </div>
    </section>
  )
}
