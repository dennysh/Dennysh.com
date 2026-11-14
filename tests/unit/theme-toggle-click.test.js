// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import React from 'react'
import { render, fireEvent, cleanup } from '@testing-library/react'
import ThemeToggle from '../../src/components/ThemeToggle.jsx'

// El sistema operativo ya no decide el tema (decisión 2026-11-14): se prueba con el sistema en claro y en oscuro y el resultado es el mismo.
const system = (dark) => {
  window.matchMedia = (q) => ({ matches: dark && q.includes('dark'), media: q, addEventListener() {}, removeEventListener() {} })
}
const meta = () => document.querySelector('meta[name="theme-color"]')
beforeEach(() => {
  delete document.documentElement.dataset.theme; localStorage.clear()
  document.head.innerHTML = '<meta name="theme-color" content="#15130f">'
})
afterEach(cleanup)

describe('interruptor de tema: el clic', () => {
  for (const dark of [false, true]) {
    it(`con el sistema ${dark ? 'oscuro' : 'claro'} y sin preferencia: parte oscuro (pulsado); el clic pasa a claro y lo guarda; otro clic vuelve a oscuro`, () => {
      system(dark)
      const b = render(React.createElement(ThemeToggle, { lang: 'es' })).container.querySelector('button')
      expect(b.getAttribute('aria-pressed')).toBe('true')
      fireEvent.click(b)
      expect(document.documentElement.dataset.theme).toBe('light'); expect(localStorage.getItem('theme')).toBe('light'); expect(b.getAttribute('aria-pressed')).toBe('false')
      expect(meta().getAttribute('content')).toBe('#f6f3ee')
      fireEvent.click(b)
      expect(document.documentElement.dataset.theme).toBe('dark'); expect(localStorage.getItem('theme')).toBe('dark'); expect(b.getAttribute('aria-pressed')).toBe('true')
      expect(meta().getAttribute('content')).toBe('#15130f')
    })
  }
  it('quien ya eligió claro (data-theme="light" puesto por theme-init) abre sin pulsar, aunque el sistema sea oscuro', () => {
    system(true); document.documentElement.dataset.theme = 'light'
    expect(render(React.createElement(ThemeToggle, { lang: 'en' })).container.querySelector('button').getAttribute('aria-pressed')).toBe('false')
  })
  it('con el almacenamiento bloqueado el clic igualmente cambia el tema de la visita', () => {
    system(false)
    const orig = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('SecurityError') }
    try {
      const b = render(React.createElement(ThemeToggle, { lang: 'en' })).container.querySelector('button')
      expect(() => fireEvent.click(b)).not.toThrow()
      expect(document.documentElement.dataset.theme).toBe('light')
    } finally { Storage.prototype.setItem = orig }
  })
})
