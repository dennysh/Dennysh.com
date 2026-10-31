import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Site from './Site.jsx'
import { LegalPage } from './Legal.jsx'
import { ProjectsPage, JourneyPage, DemoPage } from './pages/Pages.jsx'
import { resolveView } from './routes.js'

// Cada ruta hidrata su propio árbol (si no, el HTML de una página interior no coincidiría con el árbol del inicio).
const { lang, view } = resolveView(location.pathname)
const tree = {
  home: <Site lang={lang} />,
  projects: <ProjectsPage lang={lang} />,
  journey: <JourneyPage lang={lang} />,
  demo: <DemoPage lang={lang} />,
  privacy: <LegalPage lang={lang} kind="privacy" />,
  terms: <LegalPage lang={lang} kind="terms" />,
}[view]
const root = document.getElementById('root')
if (root.hasChildNodes()) hydrateRoot(root, tree)
else createRoot(root).render(tree)
