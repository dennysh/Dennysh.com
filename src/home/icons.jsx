import React from 'react'

// Iconos de los seis nodos: SVG en línea, trazo fino de 1,5 px, sin dependencias ni fuentes de iconos (decisión D-H2).
const SHAPES = {
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" />,
  projects: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  demo: <path d="M8 5l11 7-11 7z" />,
  journey: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></>,
  how: <><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M8 4v13" /></>,
  interest: <path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 3 5 3 3 0 0 0 5 1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-3 5 3 3 0 0 1-5 1" />,
}

export default function NodeIcon({ id }) {
  return (
    <svg className="node-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {SHAPES[id]}
    </svg>
  )
}
