import React, { useState, useEffect } from 'react'
import { content } from '../data/content'
import './Navbar.css'

const THEME_META = {
  dark:   { icon: '🌙', label: 'Dark'   },
  light:  { icon: '☀️', label: 'Claro'  },
  hacker: { icon: '>_', label: 'Hacker' },
}

export default function Navbar({ theme = 'dark', cycleTheme }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    // Handle scroll for navbar background
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)

    // Handle active section via IntersectionObserver
    const sections = document.querySelectorAll('section[id]')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    )
    sections.forEach((section) => observer.observe(section))

    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  const handleNavClick = (href) => {
    setIsOpen(false)
    // Smooth scroll handled by HTML scroll-behavior
  }

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <a href="#inicio" aria-label="Dennysh — volver al inicio">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 240 60"
              fill="none"
              className="navbar-logo-img"
              aria-hidden="true"
            >
              <text x="0" y="36" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="38">
                <tspan style={{ fill: 'var(--logo-text)' }}>denn</tspan>
                <tspan style={{ fill: 'var(--logo-accent-1)' }}>ysh</tspan>
              </text>
              <rect x="0" y="42" width="72" height="2.5" rx="1.5" style={{ fill: 'var(--logo-accent-1)' }} />
              <text x="1" y="57" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="10" style={{ fill: 'var(--logo-sub)' }} letterSpacing="2">AUTOMATION ENGINEER</text>
            </svg>
          </a>
        </div>

        <button
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={isOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {content.header.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={`navbar-link ${
                  activeSection === item.href.slice(1) ? 'active' : ''
                }`}
                onClick={() => handleNavClick(item.href)}
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <button
              className="theme-btn"
              onClick={cycleTheme}
              aria-label={`Tema actual: ${theme}. Clic para cambiar tema`}
              title="Cambiar tema"
            >
              <span className="theme-btn__icon">{THEME_META[theme].icon}</span>
              <span className="theme-btn__label">{THEME_META[theme].label}</span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
