import React from 'react'
import { content } from '../data/content'
import CTAButton from '../components/CTAButton'
import './Collaborate.css'

export default function Collaborate() {
  const { collaborate } = content

  return (
    <section id="colabora" className="collaborate reveal">
      <div className="container">
        <h2 className="section-title">{collaborate.title}</h2>

        <div className="collaborate-cards">
          {collaborate.items.map((item, index) => (
            <CTAButton
              key={index}
              href={item.href}
              variant="dark"
              className="collaborate-card reveal-child"
            >
              <span className="collaborate-card-text">{item.title}</span>
            </CTAButton>
          ))}
        </div>
      </div>
    </section>
  )
}
