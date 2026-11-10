import React from 'react'
import { renderToString } from 'react-dom/server'
import Site from './Site.jsx'
import { LegalPage, NotFound } from './Legal.jsx'
import { CodePage, ProjectsPage, JourneyPage, HowPage, InterestPage, ContactPage } from './pages/Pages.jsx'

export const renderSite = (lang) => renderToString(<Site lang={lang} />)
export const renderLegal = (lang, kind) => renderToString(<LegalPage lang={lang} kind={kind} />)
export const renderNotFound = (lang) => renderToString(<NotFound lang={lang} />)
const PAGES = { code: CodePage, projects: ProjectsPage, journey: JourneyPage, how: HowPage, interest: InterestPage, contact: ContactPage }
export const renderPage = (lang, view) => renderToString(React.createElement(PAGES[view], { lang }))
