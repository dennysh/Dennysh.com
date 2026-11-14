// Red de fondo de la primera pantalla en móvil (≤ 760 px). Port de la maqueta aprobada por Dennys (/tmp/movil-referencia.html):
// mismas constantes (P), misma zona protegida (quiet) sobre la caja real del retrato, luz errante + dedo (sources), vecinos limitados y
// desplazamiento acotado. Cambios respecto a la maqueta, por requisito:
//  - la zona protegida también se comprueba a lo largo de cada segmento y de cada lado de un triángulo (no solo en los extremos), para que
//    ningún trazo cruce la cara ni el cuerpo aunque sus extremos queden fuera (medido por píxeles en e2e);
//  - el objetivo del desplazamiento se recorta a `pull` px aunque la luz errante y el dedo empujen a la vez (en la maqueta podían sumar 1,35 × pull).
import { soft, quietAlong, clampLen, approach, nearestLinks, triangles, triQuiet, clipOutsideProtected } from './net-core.js'

export const P = { n: 110, link: 100, line: .8, dot: .40, speed: .05, tri: .05, reach: 150, wander: .35, fps: 30, pull: 16, maxLinks: 3, maxTris: 10 }
export const FADE_MS = 1600 // la luz que deja el dedo se apaga en ~1,6 s al soltar

// Zona protegida derivada de la caja real del retrato `pz` = { x, y, w, h } (en px del hero): cara (elipse) y cuerpo (franja que se
// ensancha en los hombros). 0 = nada se dibuja, 1 = libre.
export function quiet(x, y, pz) {
  const u = (x - (pz.x + pz.w / 2)) / pz.w, v = (y - pz.y) / pz.h
  const hx = u / .20, hy = (v - .22) / .19
  const kHead = soft((Math.sqrt(hx * hx + hy * hy) - 1) / .35)
  let kBody = 1
  if (v > .38) { const half = .30 + .18 * soft((v - .38) / .14); kBody = soft((Math.abs(u) / half - 1) / .25) }
  return Math.min(kHead, kBody)
}

// La misma zona como figuras (elipse de la cara y polígono del cuerpo) para recortar el dibujo: ver clipOutsideProtected. `H` = alto del hero.
export function protectedShapes(pz, H) {
  const cx = pz.x + pz.w / 2, y = (v) => pz.y + v * pz.h
  return {
    ellipse: { cx, cy: y(.22), rx: .20 * pz.w, ry: .19 * pz.h },
    body: [[cx - .30 * pz.w, y(.38)], [cx - .48 * pz.w, y(.52)], [cx - .48 * pz.w, H + 2], [cx + .48 * pz.w, H + 2], [cx + .48 * pz.w, y(.52)], [cx + .30 * pz.w, y(.38)]],
  }
}

// Fuentes de luz: la luz errante (siempre, salvo con movimiento reducido) y el dedo (al tocar o arrastrar; se apaga al soltar).
export function lightSources(t, { W, H, reduce, touch }) {
  const s = []
  if (!reduce) s.push({ x: W * (.5 + .40 * Math.sin(t * .00034 + 1)), y: H * (.46 + .30 * Math.sin(t * .00023)), k: P.wander })
  if (touch) {
    const age = touch.down ? 0 : (t - touch.t) / FADE_MS
    if (age < 1) s.push({ x: touch.x, y: touch.y, k: 1 - age * age })
  }
  return s
}

export function createMobileNetwork({ rand = Math.random } = {}) {
  let W = 0, H = 0, pz = { x: 0, y: 0, w: 1, h: 1 }, pts = [], touch = null

  function seed() {
    pts = []
    if (!W || !H) return
    for (let i = 0; i < P.n; i++) {
      const a = rand() * Math.PI * 2, v = P.speed * (.4 + rand()) * 60
      const x = rand() * W, y = rand() * H
      pts.push({ i, bx: x, by: y, ox: 0, oy: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: .6 + rand() * 1.1, lit: 0, q: 1 })
    }
  }
  // Mide de nuevo (tamaño del hero y caja del retrato) y vuelve a sembrar solo si cambió el tamaño.
  function resize(w, h, box) {
    const changed = w !== W || h !== H
    W = w; H = h; pz = box
    if (changed || !pts.length) seed()
  }
  const touchAt = (x, y, down, t) => { touch = { x, y, down, t } }
  const release = (t) => { if (touch) { touch.down = false; touch.t = t } }
  const drop = () => { touch = null } // con movimiento reducido no hay cuadros que apaguen la luz poco a poco: al soltar desaparece

  // Un cuadro. `dt` en segundos desde el último cuadro dibujado; `rgb` = "r,g,b"; `reduce` = sin movimiento ni luz errante.
  function frame(ctx, t, dt, rgb, reduce = false) {
    ctx.clearRect(0, 0, W, H)
    if (!W || !H) return
    const L = P.link, R = P.reach
    if (touch && !touch.down && (t - touch.t) / FADE_MS >= 1) touch = null
    const src = lightSources(t, { W, H, reduce, touch })
    const q = (x, y) => quiet(x, y, pz)
    const zone = protectedShapes(pz, H)
    for (const p of pts) {
      if (!reduce) { p.bx += p.vx * dt; p.by += p.vy * dt }
      if (p.bx < -20) p.bx = W + 20; if (p.bx > W + 20) p.bx = -20; if (p.by < -20) p.by = H + 20; if (p.by > H + 20) p.by = -20
      // La luz solo empuja un poco cada punto (máx. P.pull px) y el punto vuelve a su sitio: la densidad nunca se acumula en un lugar.
      let lit = 0, tx = 0, ty = 0
      for (const s of src) {
        const dx = s.x - p.bx, dy = s.y - p.by, d = Math.hypot(dx, dy), k = soft(1 - d / R)
        lit = Math.max(lit, Math.min(1, k * 1.7) * s.k)
        if (d > 1 && d < R) { const g = k * P.pull * s.k; tx += dx / d * g; ty += dy / d * g }
      }
      ;[tx, ty] = clampLen(tx, ty, P.pull)
      approach(p, tx, ty, Math.min(1, reduce ? 1 : dt * 6))
      p.x = p.bx + p.ox; p.y = p.by + p.oy; p.lit = lit; p.q = q(p.x, p.y)
    }
    ctx.save()
    clipOutsideProtected(ctx, W, H, zone.ellipse, zone.body)
    const on = pts.filter((p) => p.lit > .01)
    const graph = nearestLinks(on, L, P.maxLinks)
    for (const [a, b, d] of graph.edges.values()) {
      const k = (1 - d / L) * Math.min(a.lit, b.lit) * P.line * quietAlong(q, a.x, a.y, b.x, b.y, a.q, b.q)
      if (k < .012) continue
      ctx.strokeStyle = `rgba(${rgb},${k})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
    }
    for (const [a, b, e, k] of triangles(graph, P.maxTris, (a, b, e) => Math.min(a.lit, b.lit, e.lit) * P.tri * triQuiet(q, a, b, e))) {
      ctx.fillStyle = `rgba(${rgb},${k})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.fill()
    }
    for (const p of pts) { const k = p.q * (.10 + .90 * p.lit) * P.dot; if (k < .02) continue; ctx.fillStyle = `rgba(${rgb},${k})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill() }
    ctx.restore()
  }
  return { resize, touchAt, release, drop, frame, get points() { return pts }, get touching() { return touch } }
}
