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
    save() {}, restore() {}, clip() {}, rect() {}, ellipse() {}, closePath() {}, clearRect() {}, beginPath() { path = [] }, moveTo(x, y) { path.push([x, y]) }, lineTo(x, y) { path.push([x, y]) }, arc(x, y) { path.push([x, y]) },
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
    const ctx = { save() {}, restore() {}, clip() {}, rect() {}, ellipse() {}, closePath() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {} } // solo mide la lógica, sin registrar trazos
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

// ---------------------------------------------------------------------------------------------------------------------------------------
// Corrección de la red de escritorio (maqueta v2 /tmp/red-referencia-v2.html): con el puntero quieto los puntos se acumulaban en una mancha.
// Ahora cada punto tiene una posición base y un desplazamiento hacia el puntero que nunca pasa de PULL px y vuelve solo.
// ---------------------------------------------------------------------------------------------------------------------------------------
import { PULL, MAX_LINKS, MAX_TRIS } from '../../src/home/network.js'
import { nearestLinks } from '../../src/home/net-core.js'

const lcg = (seed = 7) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296)
// Un contexto 2D de mentira que cuenta cuántos triángulos se rellenan por cuadro (un relleno con dos lineTo; los puntos usan arc).
const counting = () => {
  let ops = [], tris = 0, perFrame = []
  return {
    perFrame: () => perFrame,
    clearRect() { perFrame.push(tris); tris = 0 }, beginPath() { ops = [] }, moveTo() {}, lineTo() { ops.push('l') }, arc() { ops.push('a') }, save() {}, restore() {}, clip() {}, rect() {}, ellipse() {}, closePath() {},
    stroke() {}, fill() { if (ops.filter((o) => o === 'l').length === 2) tris++ },
    set strokeStyle(v) {}, set fillStyle(v) {}, set lineWidth(v) {},
  }
}
const W = 1180, H = 773
const run = ({ frames = 300, dt = 1000 / 60, mouse = { x: 880, y: 330 }, reduce = false, seed = 21 } = {}) => {
  const net = createNetwork({ rand: lcg(seed) })
  net.resize(W, H)
  net.pointer(mouse.x, mouse.y); if (reduce) net.snap()
  const ctx = counting()
  const start = net.points.map((p) => ({ bx: p.bx, by: p.by }))
  let worst = 0, t = 0, baseDrift = 0
  for (let f = 0; f < frames; f++) {
    t += dt
    net.frame(ctx, t, '179,48,29', reduce)
    for (const p of net.points) worst = Math.max(worst, Math.hypot(p.ox, p.oy), Math.hypot(p.x - p.bx, p.y - p.by))
  }
  // La posición base solo avanza por su deriva constante: el puntero no la mueve (los puntos que dieron la vuelta al lienzo no cuentan).
  net.points.forEach((p, i) => {
    const ex = start[i].bx + p.vx * (frames * dt / 1000), ey = start[i].by + p.vy * (frames * dt / 1000)
    if (ex > -20 && ex < W + 20 && ey > -20 && ey < H + 20) baseDrift = Math.max(baseDrift, Math.hypot(p.bx - ex, p.by - ey))
  })
  return { net, ctx, worst, baseDrift }
}

describe('red de escritorio: desplazamiento acotado (no hay atracción acumulativa)', () => {
  it('constantes de la maqueta v2: pull 22 px a 1180 px, máx. 3 vecinos, máx. 12 triángulos', () => {
    expect([PULL, MAX_LINKS, MAX_TRIS]).toEqual([22, 3, 12])
  })
  it('con el puntero fijo 300 cuadros, ningún punto se aleja más de «pull» de su base (y sí se mueve)', () => {
    for (const seed of [21, 22, 23]) {
      const { worst, baseDrift } = run({ seed })
      expect(worst, `semilla ${seed}`).toBeLessThanOrEqual(PULL + 1e-6)
      expect(baseDrift, `semilla ${seed}: la base solo deriva`).toBeLessThan(.5)
      expect(worst).toBeGreaterThan(1)
    }
  })
  it('el tope escala con el ancho del lienzo: a 590 px el desplazamiento máximo es la mitad', () => {
    const net = createNetwork({ rand: lcg(4) }); net.resize(590, 386); net.pointer(440, 165)
    const ctx = counting(); let worst = 0
    for (let f = 0; f < 300; f++) { net.frame(ctx, f * 16.7, '1,1,1'); for (const p of net.points) worst = Math.max(worst, Math.hypot(p.ox, p.oy)) }
    expect(worst).toBeLessThanOrEqual(PULL / 2 + 1e-6)
  })
  it('cada punto encendido se une como máximo a sus 3 vecinos más cercanos y nunca hay más de 12 triángulos por cuadro', () => {
    const { net, ctx } = run()
    const on = net.points.filter((p) => p.lit >= .01)
    expect(on.length).toBeGreaterThan(10) // la prueba mide algo
    const { chosen, adj } = nearestLinks(on, PRESETS[LEVEL].link * (W / REF_W), MAX_LINKS)
    for (const [, n] of chosen) expect(n).toBeLessThanOrEqual(3)
    for (const [, s] of adj) expect(s.size).toBeLessThanOrEqual(3) // y nadie acaba con más de 3 enlaces en total
    expect(Math.max(...ctx.perFrame())).toBeLessThanOrEqual(MAX_TRIS)
  })
  it('la densidad no cambia con el puntero quieto: ninguna celda de la rejilla retiene una fracción grande de los puntos', () => {
    const { net } = run()
    const cells = new Map()
    for (const p of net.points) { const k = `${Math.floor(p.x / (W / 4))},${Math.floor(p.y / (H / 3))}`; cells.set(k, (cells.get(k) ?? 0) + 1) }
    expect(Math.max(...cells.values())).toBeLessThan(net.points.length * .25)
    // y la nube junta cerca del puntero no supera el doble de lo que habría por azar en ese radio
    const R = PRESETS[LEVEL].reach, near = net.points.filter((p) => Math.hypot(p.x - 880, p.y - 330) < R / 2).length
    const expected = net.points.length * (Math.PI * (R / 2) ** 2) / (W * H)
    expect(near).toBeLessThan(expected * 2.2 + 3)
  })
  it('al quitar el puntero los puntos vuelven a su base (el desplazamiento se agota solo)', () => {
    const { net } = run({ frames: 120 })
    net.pointer(null)
    const ctx = counting()
    for (let f = 0; f < 240; f++) net.frame(ctx, 10000 + f * 16.7, '1,1,1')
    for (const p of net.points) expect(Math.hypot(p.ox, p.oy)).toBeLessThan(.05)
  })
  it('movimiento reducido: los puntos no derivan ni se desplazan hacia el puntero', () => {
    const { net, worst } = run({ reduce: true, frames: 60 })
    expect(worst).toBe(0)
    for (const p of net.points) { expect(p.x).toBe(p.bx); expect(p.y).toBe(p.by) }
  })
  it('sensibilidad (mutante): la atracción acumulativa de la versión anterior sí rompe la cota, así que esta prueba la detectaría', () => {
    const r = lcg(3)
    const base = Array.from({ length: 170 }, () => ({ x: r() * W, y: r() * H }))
    const pts = base.map((p) => ({ ...p }))
    const R = PRESETS[LEVEL].reach
    for (let f = 0; f < 300; f++) for (const q of pts) { const dx = 880 - q.x, dy = 330 - q.y, d = Math.hypot(dx, dy); if (d < R && d > 50) { const g = (1 - d / R) * 90 / 60; q.x += dx / d * g; q.y += dy / d * g } }
    const worst = Math.max(...pts.map((q, i) => Math.hypot(q.x - base[i].x, q.y - base[i].y)))
    expect(worst).toBeGreaterThan(PULL * 3)
  })
})

describe('recorte geométrico de la zona protegida en escritorio (protectedShapes)', () => {
  it('las figuras (elipse de la cabeza ∪ polígono del cuerpo) coinciden con la zona donde quiet() vale 0', async () => {
    const { protectedShapes } = await import('../../src/home/network.js')
    for (const [W, H] of [[1180, 773], [800, 524]]) {
      const { ellipse, body } = protectedShapes(W, H)
      const inEllipse = (x, y) => ((x - ellipse.cx) / ellipse.rx) ** 2 + ((y - ellipse.cy) / ellipse.ry) ** 2 <= 1
      const inPoly = (x, y) => { let c = false; for (let i = 0, j = body.length - 1; i < body.length; j = i++) { const [xi, yi] = body[i], [xj, yj] = body[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c } return c }
      let mismatch = 0, zero = 0
      for (let y = 0; y <= H; y += 3) for (let x = 0; x <= W; x += 3) {
        const z = quiet(x, y, W, H) === 0
        if (z) zero++
        if ((inEllipse(x, y) || inPoly(x, y)) !== z) mismatch++
      }
      expect(zero, `${W}`).toBeGreaterThan(3000)
      expect(mismatch / zero, `${W}`).toBeLessThan(.01)
    }
  })
})
