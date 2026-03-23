import React from 'react'
import { content } from '../data/content'
import CTAButton from '../components/CTAButton'
import './Contact.css'

export default function Contact() {
  const { contact } = content

  return (
    <section id="contacto" className="contact reveal">
      <div className="container">
        <div className="contact-content">
          <h2 className="section-title">{contact.title}</h2>
          <p className="contact-description">{contact.description}</p>

          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-label">Email</span>
              <a href={`mailto:${contact.email}`} className="contact-link">
                {contact.email}
              </a>
            </div>

            <div className="contact-item">
              <span className="contact-label">LinkedIn</span>
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                @dennys-heras
              </a>
            </div>

            <div className="contact-item">
              <span className="contact-label">GitHub</span>
              <a
                href={contact.github}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                @dennysh
              </a>
            </div>
          </div>

          <CTAButton
            href={`mailto:${contact.email}`}
            variant="primary"
            size="lg"
            className="contact-cta"
          >
            Enviar email
          </CTAButton>
        </div>
      </div>
    </section>
  )
}
