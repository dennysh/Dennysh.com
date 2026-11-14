// Piezas comunes de la red de fondo (escritorio y móvil). Salen de las maquetas aprobadas (/tmp/red-referencia-v2.html y /tmp/movil-referencia.html):
//  - cada punto tiene una posición base y un desplazamiento (ox, oy) hacia la luz que nunca pasa de `pull` px y vuelve solo: no hay atracción acumulativa;
//  - cada punto encendido se une como máximo a sus `maxLinks` vecinos más cercanos (enlaces deduplicados);
//  - los triángulos solo salen de tríos ya conectados.

export const soft = (v) => Math.min(1, Math.max(0, v))

// Lo más restrictivo de la zona protegida a lo largo de un segmento: extremos y tres puntos intermedios. `quiet(x, y)` → 0..1.
export function quietAlong(quiet, ax, ay, bx, by, qa, qb) {
  let k = Math.min(qa, qb)
  for (const t of [.25, .5, .75]) { if (k === 0) break; k = Math.min(k, quiet(ax + (bx - ax) * t, ay + (by - ay) * t)) }
  return k
}

// Vector objetivo del desplazamiento: nunca mide más de `pull` aunque haya varias luces a la vez.
export function clampLen(tx, ty, max) {
  const m = Math.hypot(tx, ty)
  return m > max ? [(tx / m) * max, (ty / m) * max] : [tx, ty]
}

// Un paso del desplazamiento hacia su objetivo (tx, ty): una media móvil, así que si el objetivo cabe en `pull` el desplazamiento también.
export function approach(q, tx, ty, e) {
  q.ox += (tx - q.ox) * e
  q.oy += (ty - q.oy) * e
}

// Enlaces: cada punto de `on` (con índice `i`) se une a lo sumo a sus `maxLinks` vecinos más cercanos a menos de L px, y ningún punto acaba con
// más de `maxLinks` enlaces en total (un punto central al que otros elegirían no pasa de ese tope: revisión de seguridad, hallazgo 2). Devuelve el
// mapa de enlaces [a, b, distancia] (una sola vez por pareja), la adyacencia y cuántos vecinos eligió cada punto (`chosen`).
export function nearestLinks(on, L, maxLinks) {
  const edges = new Map(), adj = new Map(), chosen = new Map()
  const L2 = L * L
  for (const a of on) {
    const near = []
    for (const b of on) {
      if (a === b) continue
      const dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy
      if (d2 < L2) near.push([Math.sqrt(d2), b])
    }
    near.sort((m, n) => m[0] - n[0])
    const picks = near.slice(0, maxLinks)
    chosen.set(a, picks.length)
    for (const [d, b] of picks) {
      const key = a.i < b.i ? `${a.i}-${b.i}` : `${b.i}-${a.i}`
      if (edges.has(key)) continue
      if ((adj.get(a)?.size ?? 0) >= maxLinks || (adj.get(b)?.size ?? 0) >= maxLinks) continue
      edges.set(key, [a, b, d])
      if (!adj.has(a)) adj.set(a, new Set())
      if (!adj.has(b)) adj.set(b, new Set())
      adj.get(a).add(b); adj.get(b).add(a)
    }
  }
  return { edges, adj, chosen }
}

// Triángulos: solo tríos (a, b, e) cuyos tres lados son enlaces ya existentes, a lo sumo `max` por cuadro. `weight(a, b, e)` da la opacidad (0 = no se dibuja y no cuenta).
export function triangles({ edges, adj }, max, weight, minK = .01) {
  const out = []
  for (const [a, b] of edges.values()) {
    if (out.length >= max) break
    for (const e of adj.get(a)) {
      if (e === b || !adj.get(b).has(e) || e.i < Math.max(a.i, b.i)) continue
      const k = weight(a, b, e)
      if (k < minK) continue
      out.push([a, b, e, k])
      if (out.length >= max) break
    }
  }
  return out
}

// Lo más restrictivo de la zona protegida dentro de un triángulo relleno: sus vértices, su centroide, los puntos a medio camino entre el centroide y
// cada vértice, y sus tres lados. 0 = no se puede rellenar. `q(x, y)` → 0..1; a, b, e llevan su `q` ya calculado.
export function triQuiet(q, a, b, e) {
  const cx = (a.x + b.x + e.x) / 3, cy = (a.y + b.y + e.y) / 3
  let k = Math.min(a.q, b.q, e.q, q(cx, cy), q((cx + a.x) / 2, (cy + a.y) / 2), q((cx + b.x) / 2, (cy + b.y) / 2), q((cx + e.x) / 2, (cy + e.y) / 2))
  if (k > 0) k = Math.min(k, quietAlong(q, a.x, a.y, b.x, b.y, a.q, b.q), quietAlong(q, a.x, a.y, e.x, e.y, a.q, e.q), quietAlong(q, b.x, b.y, e.x, e.y, b.q, e.q))
  return k
}

// Recorte geométrico de la zona protegida: todo lo que se dibuja después de llamar a esto (trazos con su grosor, rellenos y puntos) queda
// fuera de la elipse de la cara y de la franja del cuerpo, con independencia de dónde caigan los extremos o las muestras de un segmento.
// Dos recortes seguidos se intersectan, así que lo visible es «fuera de la elipse» ∩ «fuera del cuerpo». Hay que llamar a ctx.save() antes y a
// ctx.restore() después. `ellipse` = { cx, cy, rx, ry }; `body` = polígono cerrado [[x, y], …].
export function clipOutsideProtected(ctx, W, H, ellipse, body) {
  const m = 2 // margen fuera del lienzo: el recorte cubre todo el rectángulo
  const outside = (shape) => { ctx.beginPath(); ctx.rect(-m, -m, W + 2 * m, H + 2 * m); shape(); ctx.clip('evenodd') }
  outside(() => { ctx.moveTo(ellipse.cx + ellipse.rx, ellipse.cy); ctx.ellipse(ellipse.cx, ellipse.cy, ellipse.rx, ellipse.ry, 0, 0, Math.PI * 2) })
  outside(() => { body.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath() })
}
