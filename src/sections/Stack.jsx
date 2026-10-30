import React from 'react'
import { content } from '../data/content'
import './Stack.css'

// Grid CSS con tarjetas simples (sustituye a la órbita 3D, T006)
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
  return (
    <section id="stack" className="stack reveal">
      <div className="container">
        <h2 className="section-title">{content.stack.title}</h2>
        <StackFallback items={content.stack.items} />
      </div>
    </section>
  )
}
