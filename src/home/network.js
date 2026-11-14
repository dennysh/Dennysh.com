// Red de fondo de la primera pantalla (escritorio con puntero fino). Port de la maqueta aprobada por Dennys (/tmp/red-referencia.html):
// mismas constantes, mismo algoritmo (encendido cerca del puntero, atracción de puntos, relleno tenue de triángulos, apagado suave).
// Cambios respecto a la maqueta, por requisito: la zona protegida sale de la geometría real (geometry.js), no de fracciones de la maqueta;
// los segmentos y triángulos también comprueban su tramo intermedio (no solo los extremos), para que nunca crucen la cara ni el cuerpo.
import { VIEW, HEAD, HEAD_RECT, PORTRAIT_PX } from './geometry.js'
import { soft, quietAlong as quietAlongWith, clampLen, approach, nearestLinks, triangles, triQuiet, clipOutsideProtected } from './net-core.js'

// Desplazamiento máximo de un punto hacia el puntero, en px a 1180 px de ancho (se escala con W / REF_W), y vecinos y triángulos por cuadro.
// Maqueta v2 (/tmp/red-referencia-v2.html): cada punto tiene una posición base y un desplazamiento acotado que vuelve solo; ya no hay atracción
// acumulativa (con el puntero quieto los puntos se juntaban en una mancha densa y el resto de la pantalla se quedaba sin red).
export const PULL = 22
export const MAX_LINKS = 3
export const MAX_TRIS = 12

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

// Zona protegida, en el lienzo de 1100×720 de geometry.js. Cabeza: elipse que contiene entera la caja de la cabeza (HEAD_RECT, diagonal ≈ √2).
// Cuerpo: franja bajo la cabeza, estrecha en el cuello (0,20 del ancho del retrato) y ancha en los hombros (0,50).
const CHIN = HEAD_RECT.y1
const FIT = 1.42 // un pelo más que √2: las esquinas de la caja quedan dentro de la elipse, no justo en su borde
const HEAD_ELLIPSE = { rx: ((HEAD_RECT.x1 - HEAD_RECT.x0) / 2) * FIT, ry: ((HEAD_RECT.y1 - HEAD_RECT.y0) / 2) * FIT }
export const BODY = { neck: 0.20, shoulders: 0.30 }
const bodyHalf = (y) => PORTRAIT_PX.w * (BODY.neck + BODY.shoulders * soft(((y - CHIN) / (VIEW.h - CHIN)) * 1.4))

// La misma zona como figuras en px del lienzo (elipse de la cabeza y polígono del cuerpo) para recortar el dibujo: ver clipOutsideProtected.
export function protectedShapes(W, H) {
  const sx = W / VIEW.w, sy = H / VIEW.h
  const half = (vy) => bodyHalf(vy) * sx
  const knee = CHIN + (VIEW.h - CHIN) / 1.4 // desde aquí la franja ya no se ensancha
  const ys = [HEAD.y, CHIN, knee, VIEW.h + 2]
  return {
    ellipse: { cx: HEAD.x * sx, cy: HEAD.y * sy, rx: HEAD_ELLIPSE.rx * sx, ry: HEAD_ELLIPSE.ry * sy },
    body: [...ys.map((vy) => [HEAD.x * sx - half(Math.min(vy, VIEW.h)), vy * sy]), ...[...ys].reverse().map((vy) => [HEAD.x * sx + half(Math.min(vy, VIEW.h)), vy * sy])],
  }
}

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
const quietAlong = (ax, ay, bx, by, qa, qb, W, H) => quietAlongWith((x, y) => quiet(x, y, W, H), ax, ay, bx, by, qa, qb)

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
      const x = rand() * W, y = rand() * H
      pts.push({ i, bx: x, by: y, ox: 0, oy: 0, x, y, vx: Math.cos(a) * v * 60, vy: Math.sin(a) * v * 60, r: .6 + rand() * 1.1, lit: 0, q: 1 })
    }
  }
  const pointer = (x, y) => { mouse = x == null ? null : { x, y } }
  const snap = () => { active = mouse ? 1 : 0 }

  // Un cuadro. `rgb` = "r,g,b"; `reduce` = sin movimiento (los puntos no derivan ni se acercan al puntero; la luz sí sigue al puntero).
  function frame(ctx, t, rgb, reduce = false) {
    const dt = Math.min(.05, (t - last) / 1000 || .016); last = t
    ctx.clearRect(0, 0, W, H)
    if (!p || !W) return
    const L = p.link * (W / REF_W), R = p.reach * (W / REF_W), pull = PULL * (W / REF_W)
    active += ((mouse ? 1 : 0) - active) * Math.min(1, dt * 6)
    const q = (x, y) => quiet(x, y, W, H)
    const zone = protectedShapes(W, H)
    for (const pt of pts) {
      if (!reduce) { pt.bx += pt.vx * dt; pt.by += pt.vy * dt }
      if (pt.bx < -20) pt.bx = W + 20; if (pt.bx > W + 20) pt.bx = -20; if (pt.by < -20) pt.by = H + 20; if (pt.by > H + 20) pt.by = -20
      // El puntero solo empuja un poco cada punto (máx. `pull` px) y el punto vuelve a su sitio: la densidad no se acumula en un lugar.
      let tx = 0, ty = 0
      pt.lit = lit(pt.bx, pt.by, mouse, R, active)
      if (mouse && !reduce) {
        const dx = mouse.x - pt.bx, dy = mouse.y - pt.by, d = Math.hypot(dx, dy)
        if (d > 1 && d < R) { const g = soft(1 - d / R) * pull * active; tx = dx / d * g; ty = dy / d * g }
      }
      ;[tx, ty] = clampLen(tx, ty, pull)
      approach(pt, tx, ty, Math.min(1, dt * 6))
      pt.x = pt.bx + pt.ox; pt.y = pt.by + pt.oy; pt.q = q(pt.x, pt.y)
    }
    ctx.save()
    clipOutsideProtected(ctx, W, H, zone.ellipse, zone.body)
    // Solo los puntos encendidos entran en los enlaces: cada uno se une como máximo a sus MAX_LINKS vecinos más cercanos (figuras ligeras, no una mancha).
    const graph = nearestLinks(pts.filter((pt) => pt.lit >= .01), L, MAX_LINKS)
    for (const [a, b, d] of graph.edges.values()) {
      const k0 = (1 - d / L) * Math.min(a.lit, b.lit) * p.line
      if (k0 < .012) continue
      const k = k0 * quietAlong(a.x, a.y, b.x, b.y, a.q, b.q, W, H)
      if (k < .012) continue
      ctx.strokeStyle = `rgba(${rgb},${k})`; ctx.lineWidth = .8
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
    // Los triángulos solo salen de tríos ya conectados, como máximo MAX_TRIS por cuadro.
    if (p.tri) for (const [a, b, e, k] of triangles(graph, MAX_TRIS, (a, b, e) => Math.min(a.lit, b.lit, e.lit) * p.tri * triQuiet(q, a, b, e))) {
      ctx.fillStyle = `rgba(${rgb},${k})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.fill()
    }
    // Puntos tenues en reposo; más visibles cuanto más encendidos.
    for (const pt of pts) { const k = pt.q * (.10 + .90 * pt.lit) * p.dot; if (k < .02) continue; ctx.fillStyle = `rgba(${rgb},${k})`; ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, 7); ctx.fill() }
    ctx.restore()
  }
  return { resize, pointer, snap, frame, get points() { return pts }, get active() { return active } }
}
