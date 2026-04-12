import React, { useState, useEffect } from 'react'
import TechOrbit from '../components/TechOrbit'
import { content } from '../data/content'
import './Stack.css'

// Hook para calcular la altura del canvas según breakpoint
function useCanvasHeight() {
  const getHeight = () => {
    const w = window.innerWidth
    if (w >= 1280) return 600
    if (w >= 1024) return 540
    return 480 // tablet 768–1023px
  }

  const [height, setHeight] = useState(getHeight)

  useEffect(() => {
    const update = () => setHeight(getHeight())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return height
}

// Fallback para móvil: grid CSS con cards simples
function StackFallback({ items }) {
  return (
    <div className="stack-fallback">
      {items.map((tech) => (
        <div
          key={tech.name}
          className="stack-fallback-card"
          style={{
            '--tech-color': tech.color,
            '--tech-color-glow': tech.color + '44'
          }}
        >
          <img
            src={tech.image}
            alt={tech.name}
            className="stack-fallback-icon"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <span className="stack-fallback-name">{tech.name}</span>
        </div>
      ))}
    </div>
  )
}

export default function Stack() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  const canvasHeight = useCanvasHeight()

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <section id="stack" className="stack reveal">
      <div className="container">
        <h2 className="section-title">{content.stack.title}</h2>
        {isMobile
          ? <StackFallback items={content.stack.items} />
          : <TechOrbit height={canvasHeight} items={content.stack.items} />
        }
      </div>
    </section>
  )
}
