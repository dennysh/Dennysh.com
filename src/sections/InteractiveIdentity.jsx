import React from 'react'
import './InteractiveIdentity.css'

export default function InteractiveIdentity() {
  const facets = [
    {
      color: '#7c3aed',
      title: 'FTTH / GPON',
      subtitle: 'Experto en campo'
    },
    {
      color: '#2563eb',
      title: 'Python',
      subtitle: 'Automatización real'
    },
    {
      color: '#059669',
      title: '7 Años',
      subtitle: 'Infraestructura crítica'
    },
    {
      color: '#d97706',
      title: '3 ISPs',
      subtitle: 'Operaciones end-to-end'
    },
    {
      color: '#7c3aed',
      title: 'Bots',
      subtitle: 'En producción'
    },
    {
      color: '#2563eb',
      title: 'En transición',
      subtitle: 'Telecom → Dev'
    }
  ]

  return (
    <section id="identidad" className="interactive-identity reveal">
      <div className="container">
        <span className="section-label">Identidad Técnica</span>
        <h2 className="section-title">No soy solo un técnico. No soy solo un desarrollador.</h2>
        <p className="identity-subtext">
          Soy el puente entre la infraestructura de campo y el software que la opera.
        </p>

        <div className="identity-grid">
          {facets.map((facet, idx) => (
            <div key={idx} className="poly-card reveal-child" style={{ '--color': facet.color }}>
              <div className="poly-shape" />
              <span className="poly-label">{facet.title}</span>
              <span className="poly-sub">{facet.subtitle}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
