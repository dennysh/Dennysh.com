import React from 'react'
import { content } from '../data/content'
import './About.css'

export default function About() {
  const { about } = content

  return (
    <section id="sobre-mi" className="about reveal">
      <div className="container">
        <h2 className="section-title">{about.title}</h2>

        <div className="about-content">
          <div className="about-text">
            <p className="about-intro">{about.intro}</p>
            <p className="about-body">{about.body1}</p>
            <p className="about-body">{about.body2}</p>
          </div>

          <div className="about-stats">
            {about.stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
