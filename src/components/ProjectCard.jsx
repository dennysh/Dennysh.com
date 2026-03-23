import React from 'react'
import './ProjectCard.css'

export default function ProjectCard({ project }) {
  const isPlaceholder = project.placeholder

  return (
    <div className={`project-card ${isPlaceholder ? 'project-card--placeholder' : ''}`}>
      <div className="project-card__header">
        <h3 className="project-card__title">{project.title}</h3>
        <span className={`project-card__badge project-card__badge--${project.status}`}>
          {project.status === 'production' && 'En producción'}
          {project.status === 'development' && 'En desarrollo'}
          {project.status === 'coming-soon' && 'Próximamente'}
        </span>
      </div>

      {project.description && !isPlaceholder && (
        <p className="project-card__description">{project.description}</p>
      )}

      {isPlaceholder && (
        <p className="project-card__placeholder-text">
          Agrega tu próximo proyecto en <code>src/data/projects.js</code>
        </p>
      )}

      {project.stack && !isPlaceholder && (
        <div className="project-card__stack">
          {project.stack.map((tech) => (
            <span key={tech} className="project-card__tech">
              {tech}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
