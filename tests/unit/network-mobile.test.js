import { describe, it, expect } from 'vitest'
import { quiet, lightSources, createMobileNetwork, protectedShapes, P, FADE_MS } from '../../src/home/network-mobile.js'
import { nearestLinks, triangles, clampLen, quietAlong } from '../../src/home/net-core.js'

// Red de fondo del móvil (trabajo A): zona protegida sobre la caja real del retrato, luz errante + dedo, vecinos máx. 3 y desplazamiento acotado.
const lcg = (seed = 7) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
const BOX = { x: 47, y: 322, w: 296, h: 398 } // el retrato a 390×844: alto 62 % del hero, centrado
const fakeCtx = () => { const c = { fills: 0, strokes: 0 }; for (const k of ['clearRect', 'beginPath', 'moveTo', 'lineTo', 'arc', 'save', 'restore', 'clip', 'rect', 'ellipse', 'closePath']) c[k] = () => {}; c.fill = () => { c.fills++ }; c.stroke = () => { c.strokes++ }; return c }

describe('quiet() móvil: zona protegida derivada de la caja real del retrato', () => {
  const cx = BOX.x + BOX.w / 2
  it('es 0 sobre la cara y sobre el cuerpo, y 1 lejos de ambos', () => {
    expect(quiet(cx, BOX.y + BOX.h * .22, BOX)).toBe(0) // centro de la cara
    expect(quiet(cx - BOX.w * .15, BOX.y + BOX.h * .22, BOX)).toBe(0) // lateral de la cara
    expect(quiet(cx, BOX.y + BOX.h * .70, BOX)).toBe(0) // pecho
    expect(quiet(cx + BOX.w * .40, BOX.y + BOX.h * .80, BOX)).toBe(0) // hombro (la franja se ensancha)
    expect(quiet(5, 5, BOX)).toBe(1)
    expect(quiet(390 - 5, 100, BOX)).toBe(1)
  })
  it('crece de 0 a 1 al alejarse de la cara (borde suave) y es simétrica respecto al eje', () => {
    const ys = BOX.y + BOX.h * .22
    let prev = 0
    for (let dx = 0; dx <= BOX.w * .5; dx += 4) { const k = quiet(cx + dx, ys, BOX); expect(k).toBeGreaterThanOrEqual(prev - 1e-9); prev = k }
    expect(quiet(cx + 70, ys, BOX)).toBeCloseTo(quiet(cx - 70, ys, BOX), 9)
  })
  it('la zona sigue a la caja: la misma geometría desplazada da la misma respuesta', () => {
    const moved = { ...BOX, x: BOX.x + 30, y: BOX.y - 20 }
    for (const [dx, dy] of [[0, 0], [40, 10], [-60, 120], [90, 200]]) expect(quiet(cx + dx + 30, BOX.y + dy - 20, moved)).toBeCloseTo(quiet(cx + dx, BOX.y + dy, BOX), 9)
  })
  it('un segmento con los dos extremos fuera que cruza la cara no pasa: quietAlong lo detecta', () => {
    const q = (x, y) => quiet(x, y, BOX), y = BOX.y + BOX.h * .22
    const a = [cx - 80, y], b = [cx + 80, y]
    expect(q(...a) > 0 && q(...b) > 0).toBe(true)
    expect(quietAlong(q, ...a, ...b, q(...a), q(...b))).toBe(0)
  })
})

describe('luz errante y dedo (lightSources)', () => {
  const base = { W: 390, H: 844, reduce: false, touch: null }
  it('sin dedo hay una sola luz, la errante, dentro del hero y con k = wander', () => {
    for (const t of [0, 1500, 9000, 40000]) {
      const s = lightSources(t, base)
      expect(s).toHaveLength(1)
      expect(s[0].k).toBe(P.wander)
      expect(s[0].x).toBeGreaterThanOrEqual(0); expect(s[0].x).toBeLessThanOrEqual(390)
      expect(s[0].y).toBeGreaterThanOrEqual(0); expect(s[0].y).toBeLessThanOrEqual(844)
    }
  })
  it('con movimiento reducido no hay luz errante; el dedo sí ilumina', () => {
    expect(lightSources(100, { ...base, reduce: true })).toEqual([])
    expect(lightSources(100, { ...base, reduce: true, touch: { x: 50, y: 60, down: true, t: 0 } })).toEqual([{ x: 50, y: 60, k: 1 }])
  })
  it('al soltar, la luz del dedo se apaga en FADE_MS (curva 1 − age²) y desaparece', () => {
    const touch = { x: 10, y: 20, down: false, t: 1000 }
    expect(lightSources(1000, { ...base, reduce: true, touch })[0].k).toBeCloseTo(1, 9)
    expect(lightSources(1000 + FADE_MS / 2, { ...base, reduce: true, touch })[0].k).toBeCloseTo(.75, 9)
    expect(lightSources(1000 + FADE_MS, { ...base, reduce: true, touch })).toEqual([])
  })
})

describe('vecinos: cada punto encendido se une como máximo a sus 3 más cercanos', () => {
  const dense = (n, size, seed) => { const r = lcg(seed); return Array.from({ length: n }, (_, i) => ({ i, x: r() * size, y: r() * size })) }
  it('ningún punto elige más de 3 vecinos, ninguno acaba con más de 3 enlaces en total y los enlaces no se repiten', () => {
    for (const seed of [1, 2, 3]) {
      const pts = dense(80, 160, seed) // muy denso: cada punto tiene muchísimos candidatos a < L
      const { edges, chosen, adj } = nearestLinks(pts, P.link, P.maxLinks)
      for (const [, n] of chosen) expect(n).toBeLessThanOrEqual(3)
      for (const [, s] of adj) expect(s.size).toBeLessThanOrEqual(3)
      expect(edges.size).toBeLessThanOrEqual(3 * pts.length)
      const keys = [...edges.keys()]
      expect(new Set(keys).size).toBe(keys.length)
    }
  })
  it('elige los más cercanos, no los primeros que encuentra', () => {
    const o = { i: 0, x: 0, y: 0 }
    const near = [1, 2, 3].map((k) => ({ i: k, x: k * 5, y: 0 }))
    const far = [4, 5].map((k) => ({ i: k, x: k * 15, y: 0 }))
    const { chosen, adj } = nearestLinks([o, ...far, ...near], P.link, 3)
    expect(chosen.get(o)).toBe(3)
    expect([...adj.get(o)].map((p) => p.i).sort()).toEqual([1, 2, 3])
  })
  it('los triángulos salen de tríos ya conectados y nunca pasan del máximo', () => {
    const pts = dense(60, 140, 5)
    const g = nearestLinks(pts, P.link, 3)
    const tris = triangles(g, P.maxTris, () => 1)
    expect(tris.length).toBeLessThanOrEqual(P.maxTris)
    for (const [a, b, e] of tris) for (const [u, v] of [[a, b], [a, e], [b, e]]) expect(g.adj.get(u).has(v), `${u.i}-${v.i}`).toBe(true)
  })
})

describe('revisión de seguridad: un punto central no acumula más de 3 enlaces aunque otros lo elijan', () => {
  it('un punto con cuatro vecinos que lo eligen termina con 3 enlaces', () => {
    const c = { i: 0, x: 0, y: 0 }
    const ring = [[10, 0], [-10, 0], [0, 10], [0, -10]].map(([x, y], k) => ({ i: k + 1, x, y }))
    const { adj } = nearestLinks([c, ...ring], 100, 3)
    expect(adj.get(c).size).toBeLessThanOrEqual(3)
    for (const [, s] of adj) expect(s.size).toBeLessThanOrEqual(3)
  })
})

describe('recorte geométrico de la zona protegida (protectedShapes + clipOutsideProtected)', () => {
  const H = 844
  const { ellipse, body } = protectedShapes(BOX, H)
  const inEllipse = (x, y) => ((x - ellipse.cx) / ellipse.rx) ** 2 + ((y - ellipse.cy) / ellipse.ry) ** 2 <= 1
  const inPoly = (x, y) => { let c = false; for (let i = 0, j = body.length - 1; i < body.length; j = i++) { const [xi, yi] = body[i], [xj, yj] = body[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c } return c }
  it('las figuras recortan exactamente la zona donde quiet() vale 0 (cara ∪ cuerpo), hasta el borde del hero', () => {
    let mismatch = 0, zero = 0
    for (let y = 0; y <= H; y += 3) for (let x = 0; x <= 390; x += 3) {
      const inside = inEllipse(x, y) || inPoly(x, y), z = quiet(x, y, BOX) === 0
      if (z) zero++
      if (inside !== z) mismatch++
    }
    expect(zero).toBeGreaterThan(5000)
    expect(mismatch / zero).toBeLessThan(.01) // solo los píxeles justo en el borde de una figura poligonal
  })
  it('el cuadro aplica el recorte antes de dibujar y lo deshace después (save → 2 recortes evenodd → trazos → restore)', () => {
    const log = []
    const ctx = new Proxy({}, { get: (_, k) => (...a) => { log.push([k, ...a]) } })
    const net = createMobileNetwork({ rand: lcg(11) })
    net.resize(390, H, BOX); net.touchAt(60, 200, true, 0)
    net.frame(ctx, 100, .033, '1,1,1', false)
    const names = log.map((l) => l[0])
    const save = names.indexOf('save'), restore = names.lastIndexOf('restore')
    const clips = log.filter((l) => l[0] === 'clip')
    expect(clips).toHaveLength(2); for (const c of clips) expect(c[1]).toBe('evenodd')
    expect(save).toBeGreaterThan(-1); expect(names.indexOf('clip')).toBeGreaterThan(save)
    const firstDraw = names.findIndex((n, i) => i > names.lastIndexOf('clip') && ['stroke', 'fill'].includes(n))
    expect(firstDraw).toBeGreaterThan(names.lastIndexOf('clip'))
    expect(restore).toBeGreaterThan(firstDraw)
    expect(names.slice(names.lastIndexOf('clip')).filter((n) => ['stroke', 'fill'].includes(n)).length).toBeGreaterThan(0) // se dibujó algo tras el recorte
  })
})

describe('desplazamiento acotado: la luz empuja un poco y el punto vuelve, nunca se acumula', () => {
  const run = (setup, frames = 300, dt = 1 / 30) => {
    const net = createMobileNetwork({ rand: lcg(11) })
    net.resize(390, 844, BOX)
    setup(net)
    const ctx = fakeCtx()
    let worst = 0, t = 0
    for (let f = 0; f < frames; f++) {
      t += dt * 1000
      net.frame(ctx, t, dt, '255,130,104', false)
      for (const p of net.points) worst = Math.max(worst, Math.hypot(p.ox, p.oy), Math.hypot(p.x - p.bx, p.y - p.by))
    }
    return { worst, net }
  }
  it('con el dedo quieto 300 cuadros, ningún punto se aleja más de P.pull de su base (con la luz errante a la vez)', () => {
    const { worst } = run((n) => n.touchAt(195, 420, true, 0))
    expect(worst).toBeLessThanOrEqual(P.pull + 1e-6)
    expect(worst).toBeGreaterThan(0) // la prueba mide algo: sí hay desplazamiento
  })
  it('clampLen recorta a pull aunque dos luces sumen más', () => {
    const [x, y] = clampLen(P.pull * 1.35, 0, P.pull)
    expect(Math.hypot(x, y)).toBeCloseTo(P.pull, 9)
    expect(clampLen(3, 4, 10)).toEqual([3, 4])
  })
  it('la densidad no cambia: tras 300 cuadros con el dedo quieto los puntos siguen repartidos (ninguna mancha)', () => {
    const { net } = run((n) => n.touchAt(195, 420, true, 0))
    // cuadrícula de 3×4: ningún cuadro retiene más de la mitad de los puntos (la atracción acumulativa los juntaba en uno)
    const cells = new Map()
    for (const p of net.points) { const k = `${Math.floor(p.x / 130)},${Math.floor(p.y / 211)}`; cells.set(k, (cells.get(k) ?? 0) + 1) }
    expect(Math.max(...cells.values())).toBeLessThan(net.points.length / 2)
  })
  it('sensibilidad: la atracción acumulativa de la versión anterior sí rompe la cota (la prueba sabría detectarla)', () => {
    const r = lcg(3)
    const pts = Array.from({ length: 110 }, () => ({ x: r() * 390, y: r() * 844 }))
    const base = pts.map((p) => ({ ...p }))
    for (let f = 0; f < 300; f++) for (const q of pts) { const dx = 195 - q.x, dy = 420 - q.y, d = Math.hypot(dx, dy); if (d < P.reach && d > 50) { const g = (1 - d / P.reach) * 90 / 30; q.x += dx / d * g; q.y += dy / d * g } }
    const worst = Math.max(...pts.map((q, i) => Math.hypot(q.x - base[i].x, q.y - base[i].y)))
    expect(worst).toBeGreaterThan(P.pull * 2)
  })
  it('con movimiento reducido, soltar quita la luz del dedo de inmediato (drop): no queda fija hasta otro evento', () => {
    const net = createMobileNetwork({ rand: lcg(11) })
    net.resize(390, 844, BOX); net.touchAt(195, 420, true, 0)
    net.drop()
    expect(net.touching).toBeNull()
  })
  it('el dedo apagado se suelta solo: tras FADE_MS no queda dedo y los puntos vuelven a su base', () => {
    const net = createMobileNetwork({ rand: lcg(11) })
    net.resize(390, 844, BOX)
    net.touchAt(195, 420, true, 0)
    const ctx = fakeCtx()
    let t = 0
    for (let f = 0; f < 30; f++) { t += 33; net.frame(ctx, t, .033, '1,1,1', true) }
    net.release(t)
    for (let f = 0; f < 80; f++) { t += 33; net.frame(ctx, t, .033, '1,1,1', true) }
    expect(net.touching).toBeNull()
    for (const p of net.points) expect(Math.hypot(p.ox, p.oy)).toBeLessThan(1e-6)
  })
})

describe('rendimiento', () => {
  it('~110 puntos y un cuadro cuesta poco (lógica, sin pintar): menos de 4 ms de media con el dedo puesto', () => {
    const net = createMobileNetwork({ rand: lcg(5) })
    net.resize(390, 844, BOX); net.touchAt(195, 420, true, 0)
    expect(net.points).toHaveLength(P.n)
    const ctx = fakeCtx()
    for (let f = 0; f < 30; f++) net.frame(ctx, f * 33, .033, '1,1,1', false) // calentamiento
    const t0 = performance.now(); const N = 200
    for (let f = 0; f < N; f++) net.frame(ctx, 1000 + f * 33, .033, '1,1,1', false)
    expect((performance.now() - t0) / N).toBeLessThan(4)
  })
})
