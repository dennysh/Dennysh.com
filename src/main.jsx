import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import Site from './Site.jsx'

const lang = location.pathname.startsWith('/es') ? 'es' : 'en'
const root = document.getElementById('root')
if (root.hasChildNodes()) hydrateRoot(root, <Site lang={lang} />)
else createRoot(root).render(<Site lang={lang} />)
