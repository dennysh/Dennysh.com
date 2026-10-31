import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Site from './Site.jsx'
import { LegalPage, NotFound } from './Legal.jsx'
import { ProjectsPage, JourneyPage, DemoPage } from './pages/Pages.jsx'
import { resolveView, legacyEventTarget } from './routes.js'

// Cada ruta hidrata su propio árbol (si no, el HTML de una página interior no coincidiría con el árbol del inicio).
const legacy = legacyEventTarget(location.pathname, location.search)
if (legacy) location.replace(legacy)
const { lang, view } = resolveView(location.pathname)
const tree = {
  home: <Site lang={lang} />,
  projects: <ProjectsPage lang={lang} />,
  journey: <JourneyPage lang={lang} />,
  demo: <DemoPage lang={lang} />,
  privacy: <LegalPage lang={lang} kind="privacy" />,
  terms: <LegalPage lang={lang} kind="terms" />,
  notfound: <NotFound lang={lang} />,
}[view]
const root = document.getElementById('root')
if (root.hasChildNodes()) hydrateRoot(root, tree)
else createRoot(root).render(tree)
