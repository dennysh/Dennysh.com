// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, fireEvent, act, cleanup } from '@testing-library/react'
import FirstScreen, { HOVER_DELAY_MS, LEAVE_GRACE_MS } from '../../src/home/FirstScreen.jsx'
import { pagePaths } from '../../src/routes.js'

// Vista previa al pasar el puntero (C3): retraso de intención, margen de salida, teclado, táctil y Esc.
const mouse = { pointerType: 'mouse' }
const node = (c, id) => c.container.querySelector(`[data-node="${id}"]`)
const active = (c) => [...c.container.querySelectorAll('.panel[data-active="true"]')].map((p) => p.id)
const ring = (c) => c.container.querySelector('.ring').hasAttribute('data-on')
const lineOn = (c) => [...c.container.querySelectorAll('.line[data-on]')].map((l) => l.getAttribute('data-line'))
const tick = (ms) => act(() => { vi.advanceTimersByTime(ms) })
const clickAs = (el, pointerType) => {
  const ev = new MouseEvent('click', { bubbles: true, cancelable: true })
  Object.defineProperty(ev, 'pointerType', { value: pointerType })
  let proceeded
  act(() => { proceeded = el.dispatchEvent(ev) })
  return proceeded // false = se canceló la navegación
}

beforeEach(() => {
  vi.useFakeTimers()
  window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
})
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('vista previa al pasar el mouse', () => {
  it('en reposo se ve Demo y no hay línea ni anillo', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(active(c)).toEqual(['p-demo'])
    expect(ring(c)).toBe(false)
    expect(lineOn(c)).toEqual([])
  })
  it('pasar el mouse abre el panel del nodo tras el retraso de intención (~120 ms), no antes', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'code'), mouse)
    tick(HOVER_DELAY_MS - 1)
    expect(active(c)).toEqual(['p-demo'])
    tick(1)
    expect(active(c)).toEqual(['p-code'])
    expect(HOVER_DELAY_MS).toBeGreaterThanOrEqual(100); expect(HOVER_DELAY_MS).toBeLessThanOrEqual(150)
  })
  it('al abrirse aparecen a la vez el anillo y la línea de ESE nodo (opción C)', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'journey'), mouse)
    tick(HOVER_DELAY_MS)
    expect(ring(c)).toBe(true)
    expect(lineOn(c)).toEqual(['journey'])
  })
  it('un paso rápido por encima de un nodo (menos que el retraso) no abre nada', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'how'), mouse)
    tick(HOVER_DELAY_MS - 20)
    fireEvent.pointerOut(node(c, 'how'), mouse)
    tick(1000)
    expect(active(c)).toEqual(['p-demo'])
    expect(lineOn(c)).toEqual([])
  })
  it('el panel se queda abierto al salir del nodo; ir al panel dentro del margen conserva anillo y línea; salir del todo los quita', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'how'), mouse)
    tick(HOVER_DELAY_MS)
    fireEvent.pointerOut(node(c, 'how'), mouse)
    tick(LEAVE_GRACE_MS - 50)
    fireEvent.pointerOver(c.container.querySelector('#p-how'), mouse) // el puntero llega al panel a tiempo
    tick(5000)
    expect(active(c)).toEqual(['p-how'])
    expect(lineOn(c)).toEqual(['how'])
    fireEvent.pointerOut(c.container.querySelector('#p-how'), mouse)
    tick(LEAVE_GRACE_MS)
    expect(lineOn(c)).toEqual([])
    expect(ring(c)).toBe(false)
    expect(active(c)).toEqual(['p-how']) // el panel no desaparece solo
  })
  it('pasar de un nodo a otro cambia el panel y la línea', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'en' }))
    fireEvent.pointerOver(node(c, 'code'), mouse); tick(HOVER_DELAY_MS)
    fireEvent.pointerOut(node(c, 'code'), mouse)
    fireEvent.pointerOver(node(c, 'interest'), mouse); tick(HOVER_DELAY_MS)
    expect(active(c)).toEqual(['p-interest'])
    expect(lineOn(c)).toEqual(['interest'])
  })
  it('el toque no abre por "hover" emulado: solo los punteros mouse y pen', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'code'), { pointerType: 'touch' })
    tick(1000)
    expect(active(c)).toEqual(['p-demo'])
  })
  it('un clic con el mouse (o Enter) navega: la vista previa no intercepta el enlace', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(node(c, 'code').getAttribute('href')).toBe(pagePaths.es.code)
    expect(clickAs(node(c, 'code'), 'mouse')).toBe(true)
    expect(clickAs(node(c, 'code'), '')).toBe(true) // Enter con teclado: pointerType vacío
  })
  it('táctil: el primer toque abre la vista previa sin navegar; el segundo, sobre el mismo nodo, navega', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(clickAs(node(c, 'journey'), 'touch')).toBe(false)
    expect(active(c)).toEqual(['p-journey'])
    expect(c.container.querySelector('.canvas').getAttribute('data-sheet')).toBe('open')
    expect(c.container.querySelector('#p-journey a.btn').getAttribute('href')).toBe(pagePaths.es.journey) // botón "Abrir página"
    expect(clickAs(node(c, 'journey'), 'touch')).toBe(true)
  })
  it('táctil: tocar otro nodo abre el suyo sin navegar', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'en' }))
    clickAs(node(c, 'journey'), 'touch')
    expect(clickAs(node(c, 'how'), 'touch')).toBe(false)
    expect(active(c)).toEqual(['p-how'])
  })
  it('Esc cierra la vista previa (hoja y línea)', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'how'), mouse); tick(HOVER_DELAY_MS)
    expect(c.container.querySelector('.canvas').getAttribute('data-sheet')).toBe('open')
    tick(2000) // la escritura (si la hubiera) ya terminó: Esc cierra
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(c.container.querySelector('.canvas').hasAttribute('data-sheet')).toBe(false)
    expect(lineOn(c)).toEqual([])
  })
  it('el foco de teclado (focus-visible) abre la vista previa al instante; el foco con ratón no', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    const a = node(c, 'projects')
    const orig = a.matches.bind(a)
    a.matches = (sel) => (sel === ':focus-visible' ? false : orig(sel))
    fireEvent.focus(a)
    expect(active(c)).toEqual(['p-demo'])
    a.matches = (sel) => (sel === ':focus-visible' ? true : orig(sel))
    fireEvent.focus(a)
    expect(active(c)).toEqual(['p-projects'])
    expect(a.getAttribute('aria-expanded')).toBe('true')
  })
  it('no hay aria-live en la portada (regla 30)', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(c.container.innerHTML).not.toContain('aria-live')
  })
  it('los seis nodos son enlaces reales a sus páginas, también tras montar', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'en' }))
    for (const id of ['code', 'projects', 'demo', 'journey', 'how', 'interest']) { expect(node(c, id).tagName).toBe('A'); expect(node(c, id).getAttribute('href')).toBe(pagePaths.en[id]) }
  })
  it('hoja abierta por el ratón (móvil bajo con puntero): se cierra al apartarlo, pero no si el puntero llega al panel', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    const sheet = () => c.container.querySelector('.canvas').getAttribute('data-sheet')
    fireEvent.pointerOver(node(c, 'code'), mouse); tick(HOVER_DELAY_MS)
    expect(sheet()).toBe('open')
    fireEvent.pointerOut(node(c, 'code'), mouse); tick(LEAVE_GRACE_MS - 50)
    fireEvent.pointerOver(c.container.querySelector('#p-code'), mouse); tick(5000)
    expect(sheet()).toBe('open')
    fireEvent.pointerOut(c.container.querySelector('#p-code'), mouse); tick(LEAVE_GRACE_MS)
    expect(sheet()).toBeNull()
  })
  it('la hoja abierta con un toque no se cierra sola', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    clickAs(node(c, 'how'), 'touch')
    fireEvent.pointerOut(c.container.querySelector('#p-how'), { pointerType: 'touch' }); tick(5000)
    expect(c.container.querySelector('.canvas').getAttribute('data-sheet')).toBe('open')
  })
  it('sin pointerType en el clic, un dispositivo sin hover cuenta como táctil; con hover, navega', () => {
    const base = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('hover: none'), media: q, addEventListener() {}, removeEventListener() {} })
    let c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(clickAs(node(c, 'journey'), undefined)).toBe(false)
    cleanup()
    window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })
    c = render(React.createElement(FirstScreen, { lang: 'es' }))
    expect(clickAs(node(c, 'journey'), undefined)).toBe(true)
    window.matchMedia = base
  })
  it('un navegador sin :focus-visible (matches lanza) no rompe el foco', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    const a = node(c, 'projects')
    a.matches = () => { throw new SyntaxError('not a valid selector') }
    expect(() => fireEvent.focus(a)).not.toThrow()
    expect(active(c)).toEqual(['p-demo'])
  })
  it('el margen de salida es corto (el panel no se queda pegado): ≤ 600 ms, y el intento de intención está acotado', () => {
    expect(LEAVE_GRACE_MS).toBeGreaterThanOrEqual(200); expect(LEAVE_GRACE_MS).toBeLessThanOrEqual(600)
  })
  it('un toque que levanta el dedo (pointerleave táctil) no apaga la línea y el anillo', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    clickAs(node(c, 'journey'), 'touch')
    fireEvent.pointerOut(node(c, 'journey'), { pointerType: 'touch' }); tick(5000)
    expect(lineOn(c)).toEqual(['journey'])
  })
  it('al salir del grupo con el teclado (blur) se apagan la línea y el anillo', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    const a = node(c, 'how')
    a.matches = (sel) => sel === ':focus-visible'
    fireEvent.focus(a)
    expect(lineOn(c)).toEqual(['how'])
    fireEvent.blur(a); tick(LEAVE_GRACE_MS)
    expect(lineOn(c)).toEqual([])
  })
  it('dos nodos en menos que el retraso: solo se abre el último (sin parpadeo del primero)', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'es' }))
    fireEvent.pointerOver(node(c, 'code'), mouse); tick(50)
    fireEvent.pointerOver(node(c, 'interest'), mouse); tick(HOVER_DELAY_MS - 1)
    expect(active(c)).toEqual(['p-demo']) // el primero no llegó a abrirse
    tick(1)
    expect(active(c)).toEqual(['p-interest'])
  })
  it('cada nodo declara el panel que controla (aria-controls apunta a un id que existe)', () => {
    const c = render(React.createElement(FirstScreen, { lang: 'en' }))
    for (const id of ['code', 'projects', 'demo', 'journey', 'how', 'interest']) {
      expect(node(c, id).getAttribute('aria-controls')).toBe(`p-${id}`)
      expect(c.container.querySelector(`#p-${id}`)).not.toBeNull()
    }
  })
})
