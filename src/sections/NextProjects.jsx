import React from 'react'
import { upcomingProjects } from '../data/projects'
import ProjectCard from '../components/ProjectCard'
import './NextProjects.css'

export default function NextProjects() {
  return (
    <section id="proximos" className="next-projects reveal">
      <div className="container">
        <h2 className="section-title">Próximos proyectos</h2>

        <div className="projects-grid">
          {upcomingProjects.map((project) => (
            <div key={project.id} className="reveal-child">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        <div className="next-projects-note">
          <p>
            ¿Tienes un proyecto que quieras que agregue? Contáctame directamente o
            abre un PR en el repositorio de este portafolio.
          </p>
        </div>
      </div>
    </section>
  )
}
