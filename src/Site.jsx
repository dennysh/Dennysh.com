import React from 'react'
import { site, links } from './content/site.js'
import Txt from './components/Txt.jsx'
import Demo from './demo/Demo.jsx'
import './styles/tokens.css'
import './styles/site.css'

const base = (lang) => `/${lang}/`
export const legalPaths = { en: { privacy: '/en/privacy/', terms: '/en/terms/' }, es: { privacy: '/es/privacidad/', terms: '/es/terminos/' } }

export function FactoryDiagram({ c }) {
  const w = 160
  const gap = 30
  const total = c.steps.length * w + (c.steps.length - 1) * gap
  return (
    <svg className="diagram" viewBox={`0 0 ${total} 96`} role="img" aria-labelledby="fd-title fd-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="fd-title">{c.diagramTitle}</title>
      <desc id="fd-desc">{c.diagramDesc}</desc>
      {c.steps.map((s, i) => {
        const x = i * (w + gap)
        return (
          <g key={s.id}>
            <rect x={x} y="8" width={w} height="80" rx="10" />
            <text x={x + w / 2} y="52" textAnchor="middle">{s.label}</text>
            {i < c.steps.length - 1 && <path d={`M${x + w + 4} 48 H${x + w + gap - 4} m-6 -5 l6 5 l-6 5`} />}
          </g>
        )
      })}
    </svg>
  )
}

export function Header({ lang }) {
  const n = site[lang].nav
  const other = lang === 'es' ? 'en' : 'es'
  return (
    <header className="topbar">
      <a className="skip" href="#main">{n.skip}</a>
      <div className="wrap">
        <a className="brand" href={`${base(lang)}#inicio`}>Dennys Heras</a>
        <nav aria-label={n.menu}>
          <ul>
            <li><a href="#demo">{n.demo}</a></li>
            <li><a href="#factory">{n.factory}</a></li>
            <li><a href="#governance">{n.governance}</a></li>
            <li><a href="#work">{n.work}</a></li>
            <li><a href="#skills">{n.skills}</a></li>
            <li><a href="#journey">{n.journey}</a></li>
            <li><a href="#contact">{n.contact}</a></li>
          </ul>
        </nav>
        <a className="langlink" href={base(other)} hrefLang={other} lang={other}>{n.lang}</a>
      </div>
    </header>
  )
}

export function Footer({ lang }) {
  const c = site[lang].footer
  return (
    <footer className="site" id="footer">
      <div className="wrap">
        <span>{c.copyright}</span>
        <span>
          <a href={legalPaths[lang].privacy}>{c.privacy}</a> · <a href={legalPaths[lang].terms}>{c.terms}</a> · <a href={links.linkedin} rel="noopener noreferrer">LinkedIn</a> · <a href={links.github} rel="noopener noreferrer">GitHub</a>
        </span>
      </div>
    </footer>
  )
}

export default function Site({ lang = 'en', demoClient }) {
  const c = site[lang]
  return (
    <>
      <Header lang={lang} />
      <main id="main">
        <section id="inicio" className="hero" aria-labelledby="hero-h">
          <div className="wrap">
            <h1 id="hero-h">{c.hero.thesis}</h1>
            <p className="who">{c.hero.who.map((w, i) => <span key={i}><Txt lang={lang} v={w} /></span>)}</p>
            <div className="cta">
              <a className="btn btn-primary" href="#demo">{c.hero.tryDemo}</a>
              <a className="btn btn-secondary" href="#contact">{c.hero.contact}</a>
            </div>
            <aside className="summary" aria-labelledby="sum-h" id="summary">
              <h2 id="sum-h">{c.hero.summaryTitle}</h2>
              <ol>{c.hero.summary.map((s) => <li key={s}>{s}</li>)}</ol>
            </aside>
          </div>
        </section>

        <section id="demo" className="block" aria-labelledby="demo-h">
          <div className="wrap">
            <h2 id="demo-h">{c.demo.title}</h2>
            <p className="lead">{c.demo.lead}</p>
            <Demo lang={lang} client={demoClient} />
          </div>
        </section>

        <section id="factory" className="block" aria-labelledby="factory-h">
          <div className="wrap">
            <h2 id="factory-h">{c.factory.title}</h2>
            <p className="lead">{c.factory.lead}</p>
            <FactoryDiagram c={c.factory} />
            <ol className="steps">{c.factory.steps.map((s) => <li key={s.id}><strong>{s.label}</strong>{s.text}</li>)}</ol>
            <p className="method"><Txt lang={lang} v={c.factory.evidence} /></p>
          </div>
        </section>

        <section id="governance" className="block" aria-labelledby="gov-h">
          <div className="wrap">
            <h2 id="gov-h">{c.governance.title}</h2>
            <p className="lead">{c.governance.lead}</p>
            <ul className="rules">{c.governance.rules.map((r) => <li key={r.title}><strong>{r.title}</strong>{r.text}</li>)}</ul>
            <p className="method">{c.governance.method}</p>
          </div>
        </section>

        <section id="work" className="block" aria-labelledby="work-h">
          <div className="wrap">
            <h2 id="work-h">{c.work.title}</h2>
            <p className="lead">{c.work.lead}</p>
            <div className="cards">
              {c.work.items.map((it) => (
                <article className="card" key={it.id}>
                  <span className={`badge badge-${it.status}`}>{c.work.status[it.status]}</span>
                  <h3>{it.title}</h3>
                  <p>{it.text}</p>
                  <p>{typeof it.repo === 'string' ? <a href={it.repo} rel="noopener noreferrer">{c.work.repo}</a> : <><span>{c.work.repo}: </span><Txt lang={lang} v={it.repo} /></>}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="block" aria-labelledby="skills-h">
          <div className="wrap">
            <h2 id="skills-h">{c.skills.title}</h2>
            <p className="lead">{c.skills.lead}</p>
            <div className="skill-groups">
              {c.skills.groups.map((g) => (
                <div key={g.title}>
                  <h3>{g.title}</h3>
                  {g.shown.length > 0 && <><p className="tag-label">{c.skills.shown}</p><ul className="tags shown">{g.shown.map((t) => <li key={t}>{t}</li>)}</ul></>}
                  {g.declared.length > 0 && <><p className="tag-label">{c.skills.declared}</p><ul className="tags">{g.declared.map((t) => <li key={t}>{t}</li>)}</ul></>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="block" aria-labelledby="journey-h">
          <div className="wrap">
            <h2 id="journey-h">{c.journey.title}</h2>
            <ol className="journey">{c.journey.lines.map((l) => <li key={l}>{l}</li>)}</ol>
          </div>
        </section>

        <section id="criden" className="block" aria-labelledby="criden-h">
          <div className="wrap">
            <h2 id="criden-h">{c.criden.title}</h2>
            <p className="lead">{c.criden.text} <Txt lang={lang} v={c.criden.link} /></p>
          </div>
        </section>

        <section id="contact" className="block" aria-labelledby="contact-h">
          <div className="wrap">
            <h2 id="contact-h">{c.contact.title}</h2>
            <ul className="contact-list">
              <li>{c.contact.email}: <a href={links.email}>{links.emailAddress}</a></li>
              <li><a href={links.linkedin} rel="noopener noreferrer">{c.contact.linkedin}</a> · <a href={links.github} rel="noopener noreferrer">{c.contact.github}</a></li>
              <li><a href={links.cv}>{c.contact.cv}</a></li>
              <li>{c.contact.role}</li>
              <li>{c.contact.location} · {c.contact.timezone}</li>
              <li>{c.contact.languages}</li>
              <li><Txt lang={lang} v={c.contact.availability} /></li>
            </ul>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  )
}
