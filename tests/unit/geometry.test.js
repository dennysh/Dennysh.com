import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { VIEW, PORTRAIT_PX, HEAD_RECT, HEAD, RING_R, ICON_R, ARC, POINTS, linePoints, arcPath, pct } from '../../src/home/geometry.js'

const IDS = ['code', 'projects', 'demo', 'journey', 'how', 'interest']
const MIRROR = [['code', 'interest'], ['projects', 'how'], ['demo', 'journey']]
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const inside = ([x, y], r = HEAD_RECT) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1
// ¿el segmento corta el rectángulo? (muestreo fino: más que suficiente para trazos de cientos de unidades)
const segmentEntersRect = ({ x1, y1, x2, y2 }, r = HEAD_RECT) => Array.from({ length: 2001 }, (_, i) => i / 2000).some((t) => inside([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t], r))

describe('líneas, anillo y cabeza (correcciones 1, C1 opción C; F4)', () => {
  it('el anillo es concéntrico con la cabeza del retrato (±2 % del ancho del retrato) y la rodea entera', () => {
    const tol = 0.02 * PORTRAIT_PX.w
    const headCenter = [(HEAD_RECT.x0 + HEAD_RECT.x1) / 2, (HEAD_RECT.y0 + HEAD_RECT.y1) / 2]
    expect(Math.abs(HEAD.x - headCenter[0])).toBeLessThanOrEqual(tol)
    expect(Math.abs(HEAD.y - headCenter[1])).toBeLessThanOrEqual(tol)
    for (const corner of [[HEAD_RECT.x0, HEAD_RECT.y0], [HEAD_RECT.x1, HEAD_RECT.y0], [HEAD_RECT.x0, HEAD_RECT.y1], [HEAD_RECT.x1, HEAD_RECT.y1]]) expect(dist(corner, [HEAD.x, HEAD.y])).toBeLessThan(RING_R)
  })
  it('la cabeza está sobre el eje del retrato, que es el centro del lienzo', () => {
    expect(HEAD.x).toBe(VIEW.w / 2)
    expect(PORTRAIT_PX.x + PORTRAIT_PX.w / 2).toBeCloseTo(VIEW.w / 2, 5)
    expect(PORTRAIT_PX.y + PORTRAIT_PX.h).toBeCloseTo(VIEW.h, 5)
  })
  it('los seis puntos de llegada al anillo están sobre el anillo y son simétricos respecto al eje', () => {
    for (const id of IDS) expect(dist([linePoints(id).x2, linePoints(id).y2], [HEAD.x, HEAD.y])).toBeCloseTo(RING_R, 0)
    for (const [l, r] of MIRROR) {
      const [a, b] = [linePoints(l), linePoints(r)]
      expect(a.x2 + b.x2).toBeCloseTo(2 * HEAD.x, 0)
      expect(a.y2).toBeCloseTo(b.y2, 0)
      expect(a.x1 + b.x1).toBeCloseTo(2 * HEAD.x, 0)
      expect(a.y1).toBeCloseTo(b.y1, 0)
    }
  })
  it('cada línea parte del borde del círculo del nodo (no de su centro ni de la etiqueta), hacia el centro del anillo', () => {
    for (const id of IDS) {
      const p = linePoints(id)
      expect(dist([p.x1, p.y1], POINTS[id]), id).toBeCloseTo(ICON_R, 0)
      // el inicio, el final y el centro del anillo están alineados
      const cross = (p.x2 - p.x1) * (HEAD.y - p.y1) - (p.y2 - p.y1) * (HEAD.x - p.x1)
      expect(Math.abs(cross) / dist([p.x1, p.y1], [HEAD.x, HEAD.y]), id).toBeLessThan(0.5)
    }
  })
  it('ningún trazo entra en el rectángulo de la cabeza: ni las líneas, ni el anillo, ni el arco', () => {
    for (const id of IDS) expect(segmentEntersRect(linePoints(id)), id).toBe(false)
    for (let a = 0; a < 360; a += 1) expect(inside([HEAD.x + RING_R * Math.cos((a * Math.PI) / 180), HEAD.y + RING_R * Math.sin((a * Math.PI) / 180)]), `anillo ${a}°`).toBe(false)
    for (let t = 0; t <= 1; t += 0.001) {
      const th = Math.PI * (1 - t) // semielipse superior
      expect(inside([HEAD.x + ARC.rx * Math.cos(th), HEAD.y - ARC.ry * Math.sin(th)])).toBe(false)
    }
  })
  it('la prueba detecta el defecto original: curvas que convergen en la coronilla sí entran en la caja de la cabeza', () => {
    const coronilla = { x1: POINTS.demo[0], y1: POINTS.demo[1], x2: HEAD.x, y2: HEAD_RECT.y0 + 4 }
    expect(segmentEntersRect(coronilla)).toBe(true)
  })
  it('los seis círculos están sobre el arco elíptico y el arco pasa por el primero y el último', () => {
    for (const id of IDS) {
      const [x, y] = POINTS[id]
      expect(((x - HEAD.x) / ARC.rx) ** 2 + ((y - HEAD.y) / ARC.ry) ** 2, id).toBeCloseTo(1, 1)
      expect(y).toBeLessThan(HEAD_RECT.y0) // por encima de la cabeza
    }
    expect(arcPath()).toBe(`M${POINTS.code[0]} ${POINTS.code[1]} A${ARC.rx} ${ARC.ry} 0 0 1 ${POINTS.interest[0]} ${POINTS.interest[1]}`)
  })
  it('los nodos son simétricos respecto al eje y están ordenados de izquierda a derecha', () => {
    for (const [l, r] of MIRROR) { expect(POINTS[l][0] + POINTS[r][0]).toBeCloseTo(2 * HEAD.x, 5); expect(POINTS[l][1]).toBe(POINTS[r][1]) }
    const xs = IDS.map((id) => POINTS[id][0])
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
  })
  it('los círculos no se pisan entre sí ni salen del lienzo (con su etiqueta debajo)', () => {
    for (let i = 0; i < IDS.length; i++) {
      const [x, y] = POINTS[IDS[i]]
      expect(x - ICON_R).toBeGreaterThan(0); expect(x + ICON_R).toBeLessThan(VIEW.w)
      expect(y - ICON_R).toBeGreaterThan(40) // por debajo de la barra superior
      for (let j = i + 1; j < IDS.length; j++) expect(dist(POINTS[IDS[i]], POINTS[IDS[j]])).toBeGreaterThan(2 * ICON_R + 8)
    }
  })
})

describe('home.css repite las posiciones de los nodos (una sola fuente: geometry.js)', () => {
  const css = readFileSync('src/styles/home.css', 'utf8')
  for (const id of IDS) {
    it(`.n-${id}`, () => {
      const m = new RegExp(`\\.n-${id} \\{ left: ([\\d.]+)%; top: ([\\d.]+)%; \\}`).exec(css)
      expect(m, `no hay regla .n-${id}`).not.toBeNull()
      const want = pct(POINTS[id])
      expect(Number(m[1])).toBeCloseTo(want.left, 2)
      expect(Number(m[2])).toBeCloseTo(want.top, 2)
    })
  }
  it('el centro del círculo cae en el punto del arco: el nodo se desplaza media altura del icono (28 px) para que el punto sea el centro del círculo y no el del conjunto círculo + etiqueta', () => {
    expect(css).toMatch(/\.node \{[^}]*transform: translate\(-50%, -28px\)/)
    expect(ICON_R).toBe(28)
  })
})
