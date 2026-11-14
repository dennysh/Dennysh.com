import React from 'react'
import { site, links, isPending } from './content/site.js'
import Txt from './components/Txt.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import TelegramBots from './components/TelegramBots.jsx'
import FirstScreen from './home/FirstScreen.jsx'
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

// Cabecera de las páginas interiores: los seis nodos y Contacto, cada uno a su página; el idioma lleva a la misma página.
export function Header({ lang, view = 'home' }) {
  const n = site[lang].nav
  const other = lang === 'es' ? 'en' : 'es'
  return (
    <header className="topbar">
      <a className="skip" href="#main">{n.skip}</a>
      <div className="wrap">
        <a className="brand" href={base(lang)}>Dennys Heras</a>
        <nav aria-label={n.menu}>
          <ul>
            {['code', 'projects', 'journey', 'how', 'interest', 'contact'].map((id) => (
              <li key={id}><a href={pagePaths[lang][id]} aria-current={view === id ? 'page' : undefined}>{n[id]}</a></li>
            ))}
          </ul>
        </nav>
        <span className="topbar-end">
          <ThemeToggle lang={lang} />
          <a className="langlink" href={alternateOf(lang, view)} hrefLang={other} lang={other}>{n.lang}</a>
        </span>
      </div>
    </header>
  )
}

// Pie de las páginas interiores con los contactos (el inicio no lleva pie ni contacto, C5).
export function Footer({ lang }) {
  const c = site[lang].footer
  return (
    <footer className="site" id="footer">
      <div className="wrap">
        <span>{c.copyright}</span>
        <span className="foot-contact">
          <a href={links.email}>{links.emailAddress}</a> · <a href={links.linkedin} rel="noopener noreferrer">LinkedIn</a> · <a href={links.github} rel="noopener noreferrer">GitHub</a> · <a href={links.cv}>CV</a> · <a href={pagePaths[lang].contact}>{c.contactPage}</a>
        </span>
        <span>
          <a href={legalPaths[lang].privacy}>{c.privacy}</a> · <a href={legalPaths[lang].terms}>{c.terms}</a>
        </span>
      </div>
    </footer>
  )
}

// El inicio es solo la primera pantalla (C4): el contenido de cada sección vive en la página de su nodo.
export default function Site({ lang = 'en' }) {
  return (
    <main id="main">
      <FirstScreen lang={lang} />
    </main>
  )
}

export function WorkCard({ lang, it }) {
  const c = site[lang]
  if (it.bots) return <article className="card card-bots"><TelegramBots lang={lang} group={it} heading open /></article>
  return (
    <article className="card">
      {it.status && <span className={`badge badge-${it.status}`}>{c.work.status[it.status]}</span>}
      <h2>{it.title}</h2>
      <p>{it.text}</p>
      {it.link && !isPending(it.link) && <p><Txt lang={lang} v={it.link} /></p>}
      {it.url && <p><a href={it.url} rel="noopener noreferrer">{c.work.visit}</a></p>}
      {it.repo && <p>{typeof it.repo === 'string' ? <a href={it.repo} rel="noopener noreferrer">{c.work.repo}</a> : <><span>{c.work.repo}: </span><Txt lang={lang} v={it.repo} /></>}</p>}
    </article>
  )
}
