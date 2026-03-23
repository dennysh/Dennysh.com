import React from 'react'
import './CTAButton.css'

export default function CTAButton({
  children,
  href,
  variant = 'primary',
  size = 'md',
  isExternal = false,
  onClick,
  className = '',
  ...props
}) {
  const buttonClass = `cta-button cta-button--${variant} cta-button--${size} ${className}`

  if (href) {
    const commonProps = {
      className: buttonClass,
      ...props
    }

    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...commonProps}>
          {children}
        </a>
      )
    }

    return (
      <a href={href} {...commonProps}>
        {children}
      </a>
    )
  }

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
