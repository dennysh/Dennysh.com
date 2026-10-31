import React from 'react'
import { site } from '../content/site.js'
import Txt from '../components/Txt.jsx'
import Demo from '../demo/Demo.jsx'
import RowGallery from '../components/RowGallery.jsx'
import { Header, Footer, WorkCard } from '../Site.jsx'

const Shell = ({ lang, view, children }) => (
  <>
    <Header lang={lang} view={view} />
    <main id="main">{children}</main>
    <Footer lang={lang} />
  </>
)

export function ProjectsPage({ lang }) {
  const c = site[lang]
  const p = c.projectsPage
  const items = p.ids.map((id) => c.work.items.find((i) => i.id === id))
  return (
    <Shell lang={lang} view="projects">
      <section className="block page" aria-labelledby="page-h">
        <div className="wrap">
          <h1 id="page-h">{p.title}</h1>
          <p className="lead">{p.lead}</p>
          <div className="cards">{items.map((it) => <WorkCard key={it.id} lang={lang} it={it} />)}</div>
          <p className="more"><Txt lang={lang} v={p.more} /></p>
          <p><a href={`/${lang}/`}>{p.back}</a></p>
        </div>
      </section>
    </Shell>
  )
}

export function DemoPage({ lang, demoClient }) {
  const c = site[lang]
  return (
    <Shell lang={lang} view="demo">
      <section id="demo" className="block page" aria-labelledby="page-h">
        <div className="wrap">
          <h1 id="page-h">{c.demo.title}</h1>
          <p className="lead">{c.demo.lead}</p>
          <Demo lang={lang} client={demoClient} />
          <p><a href={`/${lang}/`}>{c.projectsPage.back}</a></p>
        </div>
      </section>
    </Shell>
  )
}

export function JourneyPage({ lang }) {
  const c = site[lang]
  const p = c.journeyPage
  return (
    <Shell lang={lang} view="journey">
      <section className="block page" aria-labelledby="page-h">
        <div className="wrap">
          <h1 id="page-h">{p.title}</h1>
          <p className="lead">{p.lead}</p>
          <RowGallery rows={p.rows} ui={p.gallery} lang={lang} />
          <p className="more"><Txt lang={lang} v={p.more} /></p>
          <p><a href={`/${lang}/`}>{p.back}</a></p>
        </div>
      </section>
    </Shell>
  )
}
