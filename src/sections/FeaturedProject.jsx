import React from 'react'
import { projects } from '../data/projects'
import CTAButton from '../components/CTAButton'
import TechBadge from '../components/TechBadge'
import './FeaturedProject.css'

export default function FeaturedProject() {
  const project = projects[0]

  if (!project) return null

  return (
    <section id="proyecto" className="featured-project reveal">
      <div className="container">
        <div className="featured-project-header">
          <h2 className="section-title">{project.title}</h2>
          <span className="featured-badge">{project.status === 'production' && 'En producción'}</span>
        </div>

        <div className="featured-project-content">
          <div className="featured-project-text">
            <p className="featured-description">{project.description}</p>

            <div className="featured-flow">
              <h3 className="featured-flow-title">Flujo de la herramienta</h3>
              <div className="flow-diagram">
                {project.flow.map((step, index) => (
                  <React.Fragment key={index}>
                    <div className="flow-step">{step}</div>
                    {index < project.flow.length - 1 && (
                      <div className="flow-arrow">→</div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="featured-results">
              <h3 className="featured-results-title">Resultados medibles</h3>
              <ul className="results-list">
                {project.metrics.map((metric, index) => (
                  <li key={index} className="result-item">
                    <span className="result-icon">✓</span>
                    <span>
                      <strong>{metric.label}:</strong> {metric.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="featured-project-visual">
            <div className="project-screenshot-placeholder">
              <div className="placeholder-content">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <p>[PENDIENTE_USUARIO_CAPTURA_BOT]</p>
                <span>Agrega una captura de pantalla del bot aquí</span>
              </div>
            </div>
          </div>
        </div>

        <div className="featured-project-stack">
          <h3 className="stack-title">Stack tecnológico</h3>
          <div className="stack-badges">
            {project.stack.map((tech) => (
              <TechBadge key={tech} text={tech} variant="primary" />
            ))}
          </div>
        </div>

        <div className="featured-project-cta">
          <CTAButton
            href={project.repoUrl}
            variant="primary"
            size="lg"
            isExternal={true}
          >
            {project.repoUrl && '→ Ver repositorio en GitHub'}
          </CTAButton>
        </div>
      </div>
    </section>
  )
}
