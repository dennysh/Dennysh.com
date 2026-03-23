import React from 'react'
import { content } from '../data/content'
import './HowICanHelp.css'

export default function HowICanHelp() {
  const { howICanHelp } = content

  return (
    <section id="como-aportar" className="how-i-can-help reveal">
      <div className="container">
        <h2 className="section-title">{howICanHelp.title}</h2>

        <div className="help-cards">
          {howICanHelp.items.map((item, index) => (
            <div key={index} className="help-card reveal-child">
              <div className="help-card-number">{String(index + 1).padStart(2, '0')}</div>
              <h3 className="help-card-title">{item.title}</h3>
              <p className="help-card-description">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
