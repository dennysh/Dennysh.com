import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { VIEW, HEAD, HEAD_RECT, PORTRAIT_PX } from '../../src/home/geometry.js'
import { PRESETS, LEVEL, REF_W, quiet, lit, accentRgb, createNetwork } from '../../src/home/network.js'

// Red de fondo (trabajo A): la zona protegida sale de la geometría real, no de fracciones de la maqueta.
const axis = HEAD.x
const bottom = VIEW.h - 4

describe('red de fondo: constantes de la maqueta aprobada', () => {
  it('intensidad fija nº 2 (Sutil) con los valores de la maqueta', () => {
    expect(LEVEL).toBe(2)
    expect(PRESETS[2]).toEqual({ n: 170, link: 140, line: .75, dot: .40, speed: .06, tri: .06, reach: 270 })
    expect(PRESETS[1]).toEqual({ n: 110, link: 125, line: .50, dot: .30, speed: .05, tri: 0, reach: 200 })
    expect(PRESETS[3]).toEqual({ n: 240, link: 155, line: 1.0, dot: .55, speed: .07, tri: .10, reach: 350 })
    expect(REF_W).toBe(1180)
  })
})

describe('quiet(): zona protegida derivada de geometry.js', () => {
  it('cara: toda la caja de la cabeza vale 0', () => {
    for (const fx of [0, .25, .5, .75, 1]) for (const fy of [0, .25, .5, .75, 1]) {
      const x = HEAD_RECT.x0 + (HEAD_RECT.x1 - HEAD_RECT.x0) * fx
      const y = HEAD_RECT.y0 + (HEAD_RECT.y1 - HEAD_RECT.y0) * fy
      expect(quiet(x, y), `(${x.toFixed(0)}, ${y.toFixed(0)})`).toBe(0)
    }
  })
  it('cuerpo: cuello, torso y hombros valen 0 en el eje y a ±0,2 del ancho del retrato', () => {
    for (const y of [HEAD_RECT.y1 + 5, 450, 520, 600, bottom]) {
      expect(quiet(axis, y), `eje y=${y}`).toBe(0)
      expect(quiet(axis - PORTRAIT_PX.w * .19, y), `izq y=${y}`).toBe(0)
      expect(quiet(axis + PORTRAIT_PX.w * .19, y), `der y=${y}`).toBe(0)
    }
    // los hombros son más anchos que el cuello
    expect(quiet(axis + PORTRAIT_PX.w * .42, 600)).toBe(0)
  })
  it('borde: justo fuera de la zona hay valores entre 0 y 1; el exterior vale 1', () => {
    const edge = quiet(HEAD_RECT.x1 + 25, HEAD.y)
    expect(edge).toBeGreaterThan(0)
    expect(edge).toBeLessThan(1)
    const shoulder = quiet(axis + PORTRAIT_PX.w * .5 + 10, 600)
    expect(shoulder).toBeGreaterThan(0)
    for (const [x, y] of [[40, 40], [VIEW.w - 40, 100], [150, 400], [VIEW.w - 150, 600], [axis, 30], [90, 650]]) expect(quiet(x, y), `(${x}, ${y})`).toBe(1)
  })
  it('simetría respecto al eje del retrato', () => {
    for (const d of [20, 60, 90, 120, 160, 200, 260]) for (const y of [150, 250, 320, 400, 500, 650]) {
      expect(quiet(axis + d, y)).toBeCloseTo(quiet(axis - d, y), 10)
    }
  })
  it('es independiente de la escala del lienzo (mismos puntos en proporción)', () => {
    for (const [x, y] of [[550, 300], [700, 330], [300, 500], [550, 150]]) expect(quiet(x * .5, y * .5, VIEW.w * .5, VIEW.h * .5)).toBeCloseTo(quiet(x, y), 10)
  })
})

describe('lit(): la red se enciende cerca del puntero', () => {
  const R = 270
  it('sin puntero vale 0; sobre el puntero vale 1 (curva min(1, s·1,7))', () => {
    expect(lit(10, 10, null, R)).toBe(0)
    expect(lit(100, 100, { x: 100, y: 100 }, R)).toBe(1)
  })
  it('decrece con la distancia y se anula en el radio de alcance', () => {
    const m = { x: 0, y: 0 }
    expect(lit(R, 0, m, R)).toBe(0)
    expect(lit(R * 2, 0, m, R)).toBe(0)
    expect(lit(R * .5, 0, m, R)).toBe(Math.min(1, .5 * 1.7))
    expect(lit(R * .9, 0, m, R)).toBeCloseTo(.1 * 1.7, 10)
    expect(lit(R * .2, 0, m, R)).toBeGreaterThan(lit(R * .6, 0, m, R))
  })
  it('el apagado suave escala el resultado', () => {
    expect(lit(0, 0, { x: 0, y: 0 }, R, .25)).toBe(.25)
  })
})

describe('accentRgb(): el acento sale de los tokens CSS del tema', () => {
  it('lee hex de 6 y de 3 cifras y rgb()', () => {
    expect(accentRgb('#b3301d')).toBe('179,48,29')
    expect(accentRgb(' #ff8268 ')).toBe('255,130,104')
    expect(accentRgb('#fa8')).toBe('255,170,136')
    expect(accentRgb('rgb(10, 20, 30)')).toBe('10,20,30')
    expect(accentRgb('')).toBeNull()
    expect(accentRgb('rojo')).toBeNull()
  })
  it('coincide con --accent de cada tema en tokens.css', () => {
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const accents = [...css.matchAll(/--accent:\s*(#[0-9a-f]{6})/gi)].map((m) => m[1])
    expect(accents.length).toBeGreaterThanOrEqual(2)
    for (const a of accents) expect(accentRgb(a)).toMatch(/^\d+,\d+,\d+$/)
  })
})

// Doble de contexto 2D que registra dónde se dibuja.
function spyCtx() {
  const ops = []
  let path = []
  return {
    ops,
    clearRect() {}, beginPath() { path = [] }, moveTo(x, y) { path.push([x, y]) }, lineTo(x, y) { path.push([x, y]) }, arc(x, y) { path.push([x, y]) },
    stroke() { ops.push({ kind: 'line', path: [...path], style: this.strokeStyle }) }, fill() { ops.push({ kind: 'fill', path: [...path], style: this.fillStyle }) },
  }
}
const seeded = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)

describe('createNetwork(): nada se dibuja sobre la cara ni el cuerpo', () => {
  it('con el puntero por todo el lienzo, ningún trazo ni relleno toca la zona protegida', () => {
    const W = 1180, H = W * VIEW.h / VIEW.w
    const net = createNetwork({ rand: seeded(7) })
    net.resize(W, H)
    const ctx = spyCtx()
    let t = 0, drawn = 0
    for (let gy = 0; gy <= 4; gy++) for (let gx = 0; gx <= 8; gx++) {
      net.pointer((W * gx) / 8, (H * gy) / 4)
      for (let i = 0; i < 6; i++) { net.frame(ctx, (t += 16), '1,2,3', false); }
    }
    for (const op of ctx.ops) {
      drawn++
      const pts = op.path
      // se muestrea cada tramo del trazo (la red dibuja segmentos y triángulos)
      const samples = []
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; for (const s of [0, .1, .2, .3, .4, .5, .6, .7, .8, .9]) samples.push([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s]) }
      const alpha = Number(/,([\d.e-]+)\)$/.exec(op.style)[1])
      for (const [x, y] of samples) {
        if (op.kind === 'fill' && pts.length === 3) continue
        const q = quiet(x, y, W, H)
        // donde la zona vale 0 no puede haber nada visible
        if (q === 0) expect(alpha, `${op.kind} en (${x.toFixed(0)}, ${y.toFixed(0)})`).toBeLessThan(.012)
      }
    }
    expect(drawn).toBeGreaterThan(200)
  })
  it('apagado suave: sin puntero la actividad baja a 0 y solo quedan puntos tenues', () => {
    const net = createNetwork({ rand: seeded(3) })
    net.resize(1180, 773)
    const ctx = spyCtx()
    net.pointer(300, 200); for (let i = 0; i < 30; i++) net.frame(ctx, i * 16, '1,2,3', false)
    expect(net.active).toBeGreaterThan(.9)
    net.pointer(null); ctx.ops.length = 0
    for (let i = 30; i < 150; i++) net.frame(ctx, i * 16, '1,2,3', false)
    expect(net.active).toBeLessThan(.01)
    ctx.ops.length = 0; net.frame(ctx, 151 * 16, '1,2,3', false)
    expect(ctx.ops.filter((o) => o.path.length > 2 || o.kind === 'line')).toHaveLength(0)
  })
  it('movimiento reducido: los puntos no se mueven', () => {
    const net = createNetwork({ rand: seeded(5) })
    net.resize(1180, 773)
    const before = net.points.map((p) => [p.x, p.y])
    net.pointer(500, 300); net.snap()
    const ctx = spyCtx()
    for (let i = 0; i < 20; i++) net.frame(ctx, i * 16, '1,2,3', true)
    expect(net.points.map((p) => [p.x, p.y])).toEqual(before)
    expect(ctx.ops.length).toBeGreaterThan(0)
  })
  it('el número de puntos escala con el ancho (170 a 1180 px, mínimo 18)', () => {
    const net = createNetwork(); net.resize(1180, 773); expect(net.points).toHaveLength(170)
    net.resize(590, 386); expect(net.points).toHaveLength(85)
    net.resize(40, 26); expect(net.points).toHaveLength(18)
  })
})

describe('coste por cuadro (medida, no umbral estricto)', () => {
  it('~170 puntos con el puntero en el centro de la red: bien por debajo de un cuadro de 16 ms', () => {
    const net = createNetwork({ rand: seeded(11) })
    net.resize(1180, 773)
    const ctx = { clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {} } // solo mide la lógica, sin registrar trazos
    net.pointer(250, 250)
    for (let i = 0; i < 30; i++) net.frame(ctx, i * 16, '1,2,3', false)
    // El mejor de cinco lotes: la prueba corre en paralelo con otras y un lote suelto puede coincidir con una pausa del proceso.
    let ms = Infinity
    for (let b = 0; b < 5; b++) {
      const N = 60, t0 = performance.now()
      for (let i = 0; i < N; i++) { net.frame(ctx, (30 + b * N + i) * 16, '1,2,3', false) }
      ms = Math.min(ms, (performance.now() - t0) / N)
    }
    console.log(`red: ${ms.toFixed(3)} ms por cuadro (170 puntos, solo lógica y registro de trazos)`)
    expect(ms).toBeLessThan(6)
  }, 20000)
})
