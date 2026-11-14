import React from 'react'
import { aboutAudio } from '../content/about-audio.js'

// Reproductor de «Sobre mí». Solo se pinta si hay al menos un archivo para el idioma; el texto de la presentación siempre está visible aparte.
// Nunca arranca solo (sin `autoplay`; `preload="none"` no descarga nada hasta que la persona pulsa reproducir).
export default function AboutAudio({ lang, ui, files = aboutAudio }) {
  const list = files.filter((f) => !f.lang || f.lang === lang)
  if (!list.length) return null
  return (
    <div className="about-audio" role="group" aria-labelledby="about-audio-h" aria-describedby="about-audio-ai">
      <h2 id="about-audio-h" className="about-audio-title">{ui.title}</h2>
      <p id="about-audio-ai" className="about-audio-ai">{ui.aiNote}</p>
      {list.map((f) => (
        <figure key={f.src} className="about-audio-item">
          {f.title?.[lang] && <figcaption>{f.title[lang]}</figcaption>}
          <audio controls preload="none" aria-label={f.title?.[lang] ?? ui.title}>
            <source src={f.src} type={f.type} />
            {ui.fallback}
          </audio>
        </figure>
      ))}
    </div>
  )
}
