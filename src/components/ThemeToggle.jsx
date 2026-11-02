import React, { useEffect, useState } from 'react'
import { site } from '../content/site.js'

const effective = () => {
  const forced = document.documentElement.dataset.theme
  if (forced === 'dark' || forced === 'light') return forced
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Interruptor claro/oscuro (correcciones 1, C9). Por defecto sigue al sistema; el clic fuerza un tema y lo guarda (con try/catch).
export default function ThemeToggle({ lang }) {
  const [dark, setDark] = useState(false)
  useEffect(() => setDark(effective() === 'dark'), [])
  const toggle = () => {
    const next = dark ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* sin almacenamiento: vale para esta visita */ }
    setDark(next === 'dark')
  }
  return (
    <button type="button" className="theme-toggle" aria-pressed={dark} aria-label={site[lang].nav.theme} onClick={toggle}>
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {dark
          ? <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>
          : <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />}
      </svg>
    </button>
  )
}
