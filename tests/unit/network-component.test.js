// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, cleanup } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import NetworkBackground from '../../src/home/NetworkBackground.jsx'

// Doble de matchMedia: `fine` decide si hay puntero fino; `reduce` el movimiento reducido.
const media = ({ fine = true, reduce = false } = {}) => {
  window.matchMedia = (q) => ({ matches: q.includes('hover: hover') ? fine : q.includes('reduced-motion') ? reduce : false, media: q, addEventListener() {}, removeEventListener() {} })
}
const ctx2d = { clearRect() {}, setTransform() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {} }
let raf, caf
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = () => ctx2d
  raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 7)
  caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  Element.prototype.getBoundingClientRect = () => ({ left: 0, top: 0, width: 1000, height: 655, right: 1000, bottom: 655 })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('NetworkBackground', () => {
  it('en el servidor (SSR) no devuelve nada: sin canvas ni diferencia de hidratación', () => {
    expect(renderToString(React.createElement(NetworkBackground))).toBe('')
  })
  it('con puntero fino monta un canvas decorativo (aria-hidden)', () => {
    media({ fine: true })
    const { container } = render(React.createElement('div', null, React.createElement(NetworkBackground)))
    const cv = container.querySelector('canvas.net')
    expect(cv).not.toBeNull()
    expect(cv.getAttribute('aria-hidden')).toBe('true')
  })
  it('sin puntero fino (táctil) no monta canvas ni pide cuadros', () => {
    media({ fine: false })
    const { container } = render(React.createElement('div', null, React.createElement(NetworkBackground)))
    expect(container.querySelector('canvas')).toBeNull()
    expect(raf).not.toHaveBeenCalled()
  })
  it('escucha el puntero en el contenedor y, al desmontar, quita los listeners y cancela el cuadro pendiente', () => {
    media({ fine: true })
    const added = [], removed = []
    const host = document.createElement('div')
    host.addEventListener = (t, f) => added.push(t); host.removeEventListener = (t) => removed.push(t)
    document.body.append(host)
    const { unmount } = render(React.createElement(NetworkBackground), { container: host })
    expect(added).toEqual(expect.arrayContaining(['pointermove', 'pointerleave']))
    expect(raf).toHaveBeenCalled()
    unmount()
    expect(removed).toEqual(expect.arrayContaining(['pointermove', 'pointerleave']))
    expect(caf).toHaveBeenCalledWith(7)
  })
  it('con movimiento reducido no inicia ningún bucle de animación', () => {
    media({ fine: true, reduce: true })
    render(React.createElement('div', null, React.createElement(NetworkBackground)))
    expect(raf).not.toHaveBeenCalled()
  })
})
