import React from 'react'
import { site, links } from './content/site.js'
import Txt from './components/Txt.jsx'
import FirstScreen from './home/FirstScreen.jsx'
import { peopleRules } from './home/rules.js'
import { pagePaths, legalPaths, alternateOf } from './routes.js'
import './styles/tokens.css'
import './styles/site.css'
import './styles/home.css'

const base = (lang) => `/${lang}/`
export { legalPaths }

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

// Cabecera de las páginas interiores (legales, Proyectos, Trayectoria, Demo): los anclajes apuntan al inicio y el idioma a la misma página.
export function Header({ lang, view = 'home' }) {
  const n = site[lang].nav
  const other = lang === 'es' ? 'en' : 'es'
  const home = (id) => `${base(lang)}#${id}`
  return (
    <header className="topbar">
      <a className="skip" href="#main">{n.skip}</a>
      <div className="wrap">
        <a className="brand" href={base(lang)}>Dennys Heras</a>
        <nav aria-label={n.menu}>
          <ul>
            <li><a href={pagePaths[lang].demo}>{n.demo}</a></li>
            <li><a href={pagePaths[lang].projects}>{n.work}</a></li>
            <li><a href={pagePaths[lang].journey}>{n.journey}</a></li>
            <li><a href={home('governance')}>{n.governance}</a></li>
            <li><a href={home('contact')}>{n.contact}</a></li>
          </ul>
        </nav>
        <a className="langlink" href={alternateOf(lang, view)} hrefLang={other} lang={other}>{n.lang}</a>
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

export default function Site({ lang = 'en' }) {
  const c = site[lang]
  return (
    <>
      <main id="main">
        <FirstScreen lang={lang} />

        <section id="demo" className="block" aria-labelledby="demo-h">
          <div className="wrap">
            <h2 id="demo-h">{c.demo.title}</h2>
            <p className="lead">{c.demo.lead}</p>
            <a className="btn btn-primary btn-xl" href={pagePaths[lang].demo}>{c.hero.tryDemo}</a>
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
            <ol className="rules">{peopleRules(lang).map((t) => <li key={t}>{t}</li>)}</ol>
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
                  {it.url && <p><a href={it.url} rel="noopener noreferrer">{c.work.visit}</a></p>}
                  {it.repo && <p>{typeof it.repo === 'string' ? <a href={it.repo} rel="noopener noreferrer">{c.work.repo}</a> : <><span>{c.work.repo}: </span><Txt lang={lang} v={it.repo} /></>}</p>}
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
              <li>{c.contact.interest}</li>
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

export function WorkCard({ lang, it }) {
  const c = site[lang]
  return (
    <article className="card">
      <span className={`badge badge-${it.status}`}>{c.work.status[it.status]}</span>
      <h3>{it.title}</h3>
      <p>{it.text}</p>
      {it.url && <p><a href={it.url} rel="noopener noreferrer">{c.work.visit}</a></p>}
      {it.repo && <p>{typeof it.repo === 'string' ? <a href={it.repo} rel="noopener noreferrer">{c.work.repo}</a> : <><span>{c.work.repo}: </span><Txt lang={lang} v={it.repo} /></>}</p>}
    </article>
  )
}
