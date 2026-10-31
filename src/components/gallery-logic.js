// Decisiones de la galería por fila, sin DOM (spec §5.1).
export const SCROLL_QUIET_MS = 200
export const SWIPE_PX = 30

// La fila se divide en n tramos iguales; la posición horizontal decide la foto (0-based).
export function segmentIndex(clientX, left, width, n) {
  if (!(n > 0) || !(width > 0)) return 0
  const k = Math.floor(((clientX - left) / width) * n)
  return Math.max(0, Math.min(n - 1, k))
}

// Solo cuenta el movimiento real: coordenadas distintas y fuera de la ventana de silencio posterior a un scroll.
export function isRealMove(prev, next, nowMs, lastScrollMs) {
  if (nowMs - lastScrollMs < SCROLL_QUIET_MS) return false
  if (!prev) return true
  return prev.x !== next.x || prev.y !== next.y
}

// dx = final - inicio. Deslizar a la izquierda (dx negativo) avanza.
export const swipeStep = (dx) => (dx <= -SWIPE_PX ? 1 : dx >= SWIPE_PX ? -1 : 0)

// Tope en los extremos (sin dar la vuelta).
export const wrap = (k, n) => (n > 0 ? Math.max(0, Math.min(n - 1, k)) : 0)

// Posición de la foto flotante: a la derecha y debajo del cursor; si no cabe, a la izquierda o más arriba. Nunca fuera del viewport.
export function floatPosition({ x, y, vw, vh, w, h, gap = 18, margin = 8 }) {
  let px = x + gap
  if (px + w > vw - margin) px = x - gap - w
  let py = y + gap
  if (py + h > vh - margin) py = vh - margin - h
  return { x: Math.max(0, Math.min(px, vw - margin - w, vw)), y: Math.max(0, py) }
}
