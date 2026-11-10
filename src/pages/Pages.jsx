import React from 'react'
import { site, links } from '../content/site.js'
import Txt from '../components/Txt.jsx'
import Timeline from '../components/Timeline.jsx'
import ContactForm from '../contact/ContactForm.jsx'
import { Header, Footer, WorkCard, FactoryDiagram } from '../Site.jsx'
import { codePanel } from '../home/code-panel.js'
import { peopleRules, machineRules } from '../home/rules.js'
import ruleset from '../../content/ruleset.v1.json'
import staticExample from '../demo/static-example.json'

const Shell = ({ lang, view, children }) => (
  <>
    <Header lang={lang} view={view} />
    <main id="main">{children}</main>
    <Footer lang={lang} />
  </>
)

// Estructura común de una página de nodo: un solo h1, su introducción, el contenido y "Volver".
const Page = ({ lang, view, id, title, lead, back, children }) => (
  <Shell lang={lang} view={view}>
    <section id={id} className="block page" aria-labelledby="page-h">
      <div className="wrap">
        <h1 id="page-h">{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
        <p className="back"><a href={`/${lang}/`}>{back}</a></p>
      </div>
    </section>
  </Shell>
)

export function CodePage({ lang }) {
  const c = site[lang]
  const p = c.codePage
  return (
    <Page lang={lang} view="code" title={p.title} lead={p.lead} back={p.back}>
      <pre className="code code-page" tabIndex={0}>{codePanel(ruleset, staticExample, lang).join('\n')}</pre>
      <p className="more">{c.home.panels.code.note} <a href={links.github} rel="noopener noreferrer">{c.home.panels.code.github}</a></p>
      <h2>{c.skills.title}</h2>
      <p className="lead">{c.skills.lead}</p>
      <div className="skill-groups">
        {c.skills.groups.map((g) => (
          <div key={g.title}>
            <h3>{g.title}</h3>
            {g.shown.length > 0 && <><p className="tag-label">{c.skills.shown}</p><ul className="tags shown">{g.shown.map((t) => <li key={t}>{t}</li>)}</ul></>}
            {g.declared.length > 0 && <><p className="tag-label">{c.skills.declared}</p><ul className="tags">{g.declared.map((t) => <li key={t}>{t}</li>)}</ul></>}
            {g.note && <p className="skill-note">{g.note}</p>}
          </div>
        ))}
      </div>
    </Page>
  )
}

export function ProjectsPage({ lang }) {
  const c = site[lang]
  const p = c.projectsPage
  const items = p.ids.map((id) => c.work.items.find((i) => i.id === id))
  return (
    <Page lang={lang} view="projects" title={p.title} lead={p.lead} back={p.back}>
      <div className="cards">{items.map((it) => <WorkCard key={it.id} lang={lang} it={it} />)}</div>
    </Page>
  )
}

export function JourneyPage({ lang }) {
  const c = site[lang]
  const p = c.journeyPage
  return (
    <Page lang={lang} view="journey" title={p.title} lead={p.lead} back={p.back}>
      <ol className="journey">{c.journey.lines.map((l) => <li key={l}>{l}</li>)}</ol>
      <Timeline entries={p.timeline} ui={p.ui} />
    </Page>
  )
}

export function HowPage({ lang }) {
  const c = site[lang]
  const p = c.howPage
  return (
    <Page lang={lang} view="how" title={p.title} lead={p.lead} back={p.back}>
      <h2>{c.governance.title}</h2>
      <p className="lead">{c.governance.lead}</p>
      <h3>{p.people}</h3>
      <ol className="rules">{peopleRules(lang).map((t) => <li key={t}>{t}</li>)}</ol>
      <h3>{p.machines}</h3>
      <p className="more">{p.machinesLead}</p>
      <pre className="code code-page" tabIndex={0}>{machineRules(lang)}</pre>
      <p className="method">{c.governance.method}</p>
      <h2>{c.factory.title}</h2>
      <p className="lead">{c.factory.lead}</p>
      <FactoryDiagram c={c.factory} />
      <ol className="steps">{c.factory.steps.map((s) => <li key={s.id}><strong>{s.label}</strong>{s.text}</li>)}</ol>
      <p className="method"><Txt lang={lang} v={c.factory.evidence} /></p>
    </Page>
  )
}

export function InterestPage({ lang }) {
  const c = site[lang]
  const p = c.interestPage
  return (
    <Page lang={lang} view="interest" title={p.title} lead={p.lead} back={p.back}>
      <p className="lead">{c.home.panels.interest.thought}</p>
    </Page>
  )
}

export function ContactPage({ lang }) {
  const c = site[lang]
  const k = c.contact
  const p = c.contactPage
  return (
    <Page lang={lang} view="contact" id="contact" title={p.title} back={p.back}>
      <ContactForm lang={lang} />
      <h2>{k.otherWays}</h2>
      <ul className="contact-list">
        <li><a href={links.linkedin} rel="noopener noreferrer">{k.linkedin}</a> · <a href={links.github} rel="noopener noreferrer">{k.github}</a></li>
        <li><a href={links.cv}>{k.cv}</a></li>
        <li>{k.role}</li>
        <li>{k.interest}</li>
        <li>{k.location} · {k.timezone}</li>
        <li>{k.languages}</li>
        <li>{k.availabilityLabel}: <Txt lang={lang} v={k.availability} /></li>
      </ul>
    </Page>
  )
}
