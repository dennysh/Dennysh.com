// Red de fondo de la primera pantalla (escritorio con puntero fino). Port de la maqueta aprobada por Dennys (/tmp/red-referencia.html):
// mismas constantes, mismo algoritmo (encendido cerca del puntero, atracción de puntos, relleno tenue de triángulos, apagado suave).
// Cambios respecto a la maqueta, por requisito: la zona protegida sale de la geometría real (geometry.js), no de fracciones de la maqueta;
// los segmentos y triángulos también comprueban su tramo intermedio (no solo los extremos), para que nunca crucen la cara ni el cuerpo.
import { VIEW, HEAD, HEAD_RECT, PORTRAIT_PX } from './geometry.js'

// Intensidades de la maqueta. Está fija la nº 2 ("Sutil"); las otras quedan aquí solo como constantes.
export const PRESETS = [
  null,
  { n: 110, link: 125, line: .50, dot: .30, speed: .05, tri: 0,   reach: 200 },
  { n: 170, link: 140, line: .75, dot: .40, speed: .06, tri: .06, reach: 270 },
  { n: 240, link: 155, line: 1.0, dot: .55, speed: .07, tri: .10, reach: 350 },
]
export const LEVEL = 2
// Ancho de referencia de la maqueta: el número de puntos, el enlace y el alcance escalan con W / REF_W.
export const REF_W = 1180

const soft = (v) => Math.min(1, Math.max(0, v))

// Zona protegida, en el lienzo de 1100×720 de geometry.js. Cabeza: elipse que contiene entera la caja de la cabeza (HEAD_RECT, diagonal ≈ √2).
// Cuerpo: franja bajo la cabeza, estrecha en el cuello (0,20 del ancho del retrato) y ancha en los hombros (0,50).
const CHIN = HEAD_RECT.y1
const FIT = 1.42 // un pelo más que √2: las esquinas de la caja quedan dentro de la elipse, no justo en su borde
const HEAD_ELLIPSE = { rx: ((HEAD_RECT.x1 - HEAD_RECT.x0) / 2) * FIT, ry: ((HEAD_RECT.y1 - HEAD_RECT.y0) / 2) * FIT }
export const BODY = { neck: 0.20, shoulders: 0.30 }
const bodyHalf = (y) => PORTRAIT_PX.w * (BODY.neck + BODY.shoulders * soft(((y - CHIN) / (VIEW.h - CHIN)) * 1.4))

// 0 = zona protegida (nada se dibuja), 1 = libre. (x, y) en px del lienzo de ancho W y alto H (la proporción es la de VIEW).
export function quiet(x, y, W = VIEW.w, H = VIEW.h) {
  const vx = (x * VIEW.w) / W
  const vy = (y * VIEW.h) / H
  const hx = (vx - HEAD.x) / HEAD_ELLIPSE.rx
  const hy = (vy - HEAD.y) / HEAD_ELLIPSE.ry
  const head = Math.sqrt(hx * hx + hy * hy)
  const body = vy > HEAD.y ? Math.abs(vx - HEAD.x) / bodyHalf(vy) : 9
  return Math.min(soft((head - 1) / .35), soft((body - 1) / .25))
}

// Cuánto se enciende un punto según su cercanía al puntero: radio amplio y curva min(1, s·1,7). `active` es el apagado suave (0..1).
export function lit(x, y, mouse, R, active = 1) {
  if (!mouse) return 0
  const d = Math.hypot(x - mouse.x, y - mouse.y)
  return Math.min(1, soft(1 - d / R) * 1.7) * active
}

// Lo más restrictivo de la zona protegida a lo largo de un segmento (extremos y tres puntos intermedios).
function quietAlong(ax, ay, bx, by, qa, qb, W, H) {
  let k = Math.min(qa, qb)
  for (const t of [.25, .5, .75]) { if (k === 0) break; k = Math.min(k, quiet(ax + (bx - ax) * t, ay + (by - ay) * t, W, H)) }
  return k
}

// "#b3301d" / "#fa8" / "rgb(179, 48, 29)" → "179,48,29" (null si no se entiende). El acento sale de los tokens CSS del tema.
export function accentRgb(value) {
  const v = String(value ?? '').trim()
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v)
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')
  }
  m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(v)
  return m ? `${m[1]},${m[2]},${m[3]}` : null
}

export function createNetwork({ level = LEVEL, rand = Math.random } = {}) {
  const p = PRESETS[level]
  let W = 0, H = 0, pts = [], mouse = null, active = 0, last = 0

  function resize(w, h) {
    W = w; H = h; pts = []
    if (!p || !W || !H) return
    const n = Math.round(p.n * (W / REF_W))
    for (let i = 0; i < Math.max(n, 18); i++) {
      const a = rand() * Math.PI * 2, v = p.speed * (.4 + rand())
      pts.push({ x: rand() * W, y: rand() * H, vx: Math.cos(a) * v * 60, vy: Math.sin(a) * v * 60, r: .6 + rand() * 1.1, lit: 0, q: 1 })
    }
  }
  const pointer = (x, y) => { mouse = x == null ? null : { x, y } }
  const snap = () => { active = mouse ? 1 : 0 }

  // Un cuadro. `rgb` = "r,g,b"; `reduce` = sin movimiento (los puntos no se mueven ni se acercan al puntero).
  function frame(ctx, t, rgb, reduce = false) {
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t
    ctx.clearRect(0, 0, W, H)
    if (!p || !W) return
    const L = p.link * (W / REF_W), R = p.reach * (W / REF_W)
    active += ((mouse ? 1 : 0) - active) * Math.min(1, dt * 6)
    const L2 = L * L, T2 = L2 * .64 // distancias al cuadrado: el mismo criterio que hypot sin la raíz
    const on = []
    for (const q of pts) {
      if (!reduce) { q.x += q.vx * dt; q.y += q.vy * dt }
      // los puntos cercanos se acercan un poco al puntero y se agrupan en figuras
      if (mouse && !reduce) { const dx = mouse.x - q.x, dy = mouse.y - q.y, d = Math.hypot(dx, dy); if (d < R && d > 50) { const g = (1 - d / R) * 90 * dt * active; q.x += dx / d * g; q.y += dy / d * g } }
      if (q.x < -20) q.x = W + 20; if (q.x > W + 20) q.x = -20; if (q.y < -20) q.y = H + 20; if (q.y > H + 20) q.y = -20
      q.lit = lit(q.x, q.y, mouse, R, active); q.q = quiet(q.x, q.y, W, H)
      if (q.lit >= .01) on.push(q)
    }
    // Solo los puntos encendidos entran en los bucles de segmentos y triángulos.
    for (let i = 0; i < on.length; i++) {
      const a = on[i]
      for (let j = i + 1; j < on.length; j++) {
        const b = on[j]
        const dx = a.x - b.x, dy = a.y - b.y
        if (dx * dx + dy * dy > L2) continue
        const d = Math.hypot(dx, dy)
        const k0 = (1 - d / L) * Math.min(a.lit, b.lit) * p.line
        if (k0 < .012) continue
        const k = k0 * quietAlong(a.x, a.y, b.x, b.y, a.q, b.q, W, H)
        if (k < .012) continue
        ctx.strokeStyle = `rgba(${rgb},${k})`; ctx.lineWidth = .8
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        if (p.tri) for (let m = j + 1; m < on.length; m++) {
          const e = on[m]
          const ax = a.x - e.x, ay = a.y - e.y, bx = b.x - e.x, by = b.y - e.y
          if (ax * ax + ay * ay < T2 && bx * bx + by * by < T2) {
            const kt = k * p.tri * Math.min(e.q, quiet((a.x + b.x + e.x) / 3, (a.y + b.y + e.y) / 3, W, H), quietAlong(a.x, a.y, e.x, e.y, a.q, e.q, W, H), quietAlong(b.x, b.y, e.x, e.y, b.q, e.q, W, H))
            if (kt < .001) continue
            ctx.fillStyle = `rgba(${rgb},${kt})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.fill()
          }
        }
      }
    }
    // Puntos tenues en reposo; más visibles cuanto más encendidos.
    for (const q of pts) { const k = q.q * (.10 + .90 * q.lit) * p.dot; if (k < .02) continue; ctx.fillStyle = `rgba(${rgb},${k})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill() }
  }
  return { resize, pointer, snap, frame, get points() { return pts }, get active() { return active } }
}
