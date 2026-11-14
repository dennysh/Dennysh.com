import React, { useEffect, useRef, useState } from 'react'
import { site } from '../content/site.js'
import { pagePaths } from '../routes.js'
import NodeIcon from './icons.jsx'

// «Explorar» (solo móvil, ≤ 760 px): las cinco secciones como tarjetas sobre una línea de fibra que se ilumina con el scroll; cada tarjeta se
// enciende al entrar en pantalla. Cada tarjeta es un enlace real a la página del nodo, con el texto real del contenido. Sin JavaScript (o sin
// IntersectionObserver) todas las tarjetas se ven completas: el estado "apagado" solo existe cuando el cliente ya las vigila.
const IDS = ['code', 'projects', 'journey', 'how', 'interest']

export const cardText = (lang, id) => {
  const c = site[lang]
  const p = c.home.panels[id]
  if (id === 'code') return p.note
  if (id === 'how') return c.howPage.lead // el panel de escritorio es la lista de reglas; la tarjeta usa la entradilla de su página
  return p.text ?? p.thought
}

export default function Explore({ lang }) {
  const h = site[lang].home
  const list = useRef(null)
  const [watching, setWatching] = useState(false)

  useEffect(() => {
    const el = list.current
    if (!el) return undefined
    const cards = [...el.querySelectorAll('.m-card')]
    const progress = () => {
      const r = el.getBoundingClientRect()
      // Al llegar al final de la página no queda más scroll con el que seguir iluminando: la línea se completa (la maqueta se quedaba en ≈ .8).
      const end = scrollY + innerHeight >= document.documentElement.scrollHeight - 2
      if (end) cards.forEach((c) => c.classList.add('on')) // con la tarjeta de Sobre mí más corta la última puede no alcanzar el umbral del observador: al final de la página todas están encendidas
      el.style.setProperty('--p', (end ? 1 : Math.min(1, Math.max(0, (innerHeight * .72 - r.top) / r.height))).toFixed(3))
    }
    let io = null
    if (typeof IntersectionObserver === 'function') {
      setWatching(true)
      io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('on') }), { rootMargin: '0px 0px -18% 0px', threshold: .15 })
      cards.forEach((c) => io.observe(c))
    }
    progress()
    addEventListener('scroll', progress, { passive: true }); addEventListener('resize', progress)
    return () => { io?.disconnect(); removeEventListener('scroll', progress); removeEventListener('resize', progress) }
  }, [])

  return (
    <section className="explore" aria-labelledby="explore-h">
      <h2 id="explore-h" className="label">{h.nodesLabel}</h2>
      <ol className="fiber" ref={list} data-watching={watching ? 'true' : undefined}>
        {IDS.map((id) => {
          const p = h.panels[id]
          return (
            <li key={id} className="m-card" data-card={id}>
              <span className="dot"><NodeIcon id={id} className="m-icon" /></span>
              <div className="body">
                <h3>{p.title}</h3>
                <p>{cardText(lang, id)}</p>
                <a href={pagePaths[lang][id]}>{p.go}<small>{p.opens}</small></a>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
