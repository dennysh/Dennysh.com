import React from 'react'
import './TechBadge.css'

export default function TechBadge({ text, variant = 'default' }) {
  return (
    <span className={`tech-badge tech-badge--${variant}`}>
      {text}
    </span>
  )
}
