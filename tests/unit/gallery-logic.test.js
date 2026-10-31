import { describe, it, expect } from 'vitest'
import { segmentIndex, isRealMove, swipeStep, wrap, SCROLL_QUIET_MS, SWIPE_PX } from '../../src/components/gallery-logic.js'

// Galería por fila (spec §5.1, AC-H11, AC-H12): la lógica de decisión vive aparte y se prueba sin navegador.
describe('segmentIndex: la posición horizontal decide la foto', () => {
  it.each([[0, 0], [24, 0], [25, 1], [49, 1], [50, 2], [99, 3], [100, 3], [-5, 0], [400, 3]])('x=%i de 100 con 4 fotos → %i', (x, k) => {
    expect(segmentIndex(x, 0, 100, 4)).toBe(k)
  })
  it('respeta el borde izquierdo de la fila', () => expect(segmentIndex(150, 100, 100, 4)).toBe(2))
  it('N distinto por fila: 6 tramos y 3 tramos', () => {
    expect(segmentIndex(99, 0, 100, 6)).toBe(5)
    expect(segmentIndex(99, 0, 100, 3)).toBe(2)
  })
  it('una fila sin fotos o sin ancho no rompe', () => {
    expect(segmentIndex(10, 0, 100, 0)).toBe(0)
    expect(segmentIndex(10, 0, 0, 4)).toBe(0)
  })
})

describe('isRealMove: solo el movimiento real cambia la foto', () => {
  const t0 = 10_000
  it('coordenadas distintas y sin scroll reciente → real', () => expect(isRealMove({ x: 1, y: 1 }, { x: 2, y: 1 }, t0, t0 - 1000)).toBe(true))
  it('mismas coordenadas (evento sintético) → no', () => expect(isRealMove({ x: 5, y: 5 }, { x: 5, y: 5 }, t0, 0)).toBe(false))
  it('dentro de la ventana de 200 ms tras un scroll → no, aunque las coordenadas cambien', () => {
    expect(isRealMove({ x: 1, y: 1 }, { x: 9, y: 9 }, t0, t0 - 100)).toBe(false)
    expect(isRealMove({ x: 1, y: 1 }, { x: 9, y: 9 }, t0, t0 - SCROLL_QUIET_MS - 1)).toBe(true)
  })
  it('sin movimiento previo, el primero cuenta', () => expect(isRealMove(null, { x: 1, y: 1 }, t0, 0)).toBe(true))
  it('la ventana es de 200 ms', () => expect(SCROLL_QUIET_MS).toBe(200))
})

describe('swipeStep y wrap (táctil)', () => {
  it('umbral de 30 px', () => {
    expect(SWIPE_PX).toBe(30)
    expect(swipeStep(-31)).toBe(1)
    expect(swipeStep(31)).toBe(-1)
    expect(swipeStep(29)).toBe(0)
    expect(swipeStep(-30)).toBe(1)
  })
  it('las flechas no se pasan de los extremos (no dan la vuelta)', () => {
    expect(wrap(-1, 4)).toBe(0)
    expect(wrap(4, 4)).toBe(3)
    expect(wrap(2, 4)).toBe(2)
    expect(wrap(3, 0)).toBe(0)
  })
})
