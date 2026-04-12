import React from 'react'
import './InteractiveIdentity.css'

export default function InteractiveIdentity() {
  const facets = [
    {
      color: '#7c3aed',
      title: 'FTTH / GPON',
      subtitle: 'Experto en campo',
      icon: 'ftth'
    },
    {
      color: '#2563eb',
      title: 'Python',
      subtitle: 'Automatización real',
      icon: 'python'
    },
    {
      color: '#059669',
      title: '7 Años',
      subtitle: 'Infraestructura crítica',
      icon: 'years'
    },
    {
      color: '#d97706',
      title: '3 ISPs',
      subtitle: 'Operaciones end-to-end',
      icon: 'isp'
    },
    {
      color: '#7c3aed',
      title: 'Bots',
      subtitle: 'En producción',
      icon: 'bot'
    },
    {
      color: '#2563eb',
      title: 'En transición',
      subtitle: 'Telecom → Dev',
      icon: 'transition'
    }
  ]

  const renderFacetIcon = (type) => {
    const common = {
      className: 'poly-icon',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '1.8',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true
    }

    switch (type) {
      case 'ftth':
        return (
          <svg {...common}>
            <rect x="4" y="6" width="16" height="12" rx="2" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
          </svg>
        )
      case 'python':
        return (
          <svg {...common}>
            <path d="M8 7h4a2 2 0 0 1 2 2v2H9a2 2 0 0 0-2 2v4" />
            <path d="M16 17h-4a2 2 0 0 1-2-2v-2h5a2 2 0 0 0 2-2V7" />
            <circle cx="10" cy="9" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="14" cy="15" r="0.9" fill="currentColor" stroke="none" />
          </svg>
        )
      case 'years':
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="7" />
            <path d="M12 8v4l2.5 2" />
          </svg>
        )
      case 'isp':
        return (
          <svg {...common}>
            <circle cx="12" cy="6.5" r="2" />
            <circle cx="6.5" cy="16.5" r="2" />
            <circle cx="17.5" cy="16.5" r="2" />
            <line x1="10.9" y1="8.2" x2="7.6" y2="14.7" />
            <line x1="13.1" y1="8.2" x2="16.4" y2="14.7" />
          </svg>
        )
      case 'bot':
        return (
          <svg {...common}>
            <rect x="6" y="8" width="12" height="9" rx="2" />
            <line x1="12" y1="5" x2="12" y2="8" />
            <circle cx="10" cy="12" r="0.8" fill="currentColor" stroke="none" />
            <circle cx="14" cy="12" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        )
      case 'transition':
        return (
          <svg {...common}>
            <path d="M4 8h11" />
            <path d="m12 5 3 3-3 3" />
            <path d="M20 16H9" />
            <path d="m12 13-3 3 3 3" />
          </svg>
        )
      default:
        return null
    }
  }

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
              <div className="poly-shape">{renderFacetIcon(facet.icon)}</div>
              <span className="poly-label">{facet.title}</span>
              <span className="poly-sub">{facet.subtitle}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
