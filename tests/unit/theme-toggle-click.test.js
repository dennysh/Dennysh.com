// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import ThemeToggle from '../../src/components/ThemeToggle.jsx'

const setup = (dark) => {
  window.matchMedia = (q) => ({ matches: dark && q.includes('dark'), media: q, addEventListener() {}, removeEventListener() {} })
}
beforeEach(() => { delete document.documentElement.dataset.theme; localStorage.clear() })
afterEach(cleanup)

describe('interruptor de tema: el clic', () => {
  it('con el sistema claro: el clic fuerza oscuro, lo guarda y marca aria-pressed; otro clic vuelve a claro', () => {
    setup(false)
    const c = render(React.createElement(ThemeToggle, { lang: 'es' }))
    const b = c.container.querySelector('button')
    expect(b.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(b)
    expect(document.documentElement.dataset.theme).toBe('dark'); expect(localStorage.getItem('theme')).toBe('dark'); expect(b.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(b)
    expect(document.documentElement.dataset.theme).toBe('light'); expect(localStorage.getItem('theme')).toBe('light'); expect(b.getAttribute('aria-pressed')).toBe('false')
  })
  it('con el sistema oscuro: parte pulsado y el clic fuerza claro', () => {
    setup(true)
    const b = render(React.createElement(ThemeToggle, { lang: 'en' })).container.querySelector('button')
    expect(b.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(b)
    expect(document.documentElement.dataset.theme).toBe('light'); expect(localStorage.getItem('theme')).toBe('light')
  })
  it('una preferencia ya forzada manda sobre el sistema', () => {
    setup(true); document.documentElement.dataset.theme = 'light'
    expect(render(React.createElement(ThemeToggle, { lang: 'en' })).container.querySelector('button').getAttribute('aria-pressed')).toBe('false')
  })
  it('con el almacenamiento bloqueado el clic igualmente cambia el tema de la visita', () => {
    setup(false)
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('SecurityError') }
    try {
      const b = render(React.createElement(ThemeToggle, { lang: 'en' })).container.querySelector('button')
      expect(() => fireEvent.click(b)).not.toThrow()
      expect(document.documentElement.dataset.theme).toBe('dark')
    } finally { Storage.prototype.setItem = orig }
  })
})
