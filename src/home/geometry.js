// Geometría de la primera pantalla en el lienzo de 1100×720 (correcciones 1, C1 opción C).
// Una sola fuente: el SVG de líneas la usa tal cual y home.css repite las posiciones de los nodos en porcentaje
// (una prueba compara ambas). Nada de esto se mide en el navegador.
export const VIEW = { w: 1100, h: 720 }
export const PORTRAIT = { left: 0.335, width: 0.33, ratio: 1210 / 900 }
// Caja de la cabeza como fracción del retrato (pelo arriba, barbilla abajo, orejas a los lados), medida sobre dennys-portrait-360.webp.
export const HEAD_BOX = { x0: 0.34, x1: 0.66, y0: 0.004, y1: 0.31 }

const pw = VIEW.w * PORTRAIT.width
const ph = pw * PORTRAIT.ratio
const px = VIEW.w * PORTRAIT.left
const py = VIEW.h - ph
export const PORTRAIT_PX = { x: px, y: py, w: pw, h: ph }
export const HEAD_RECT = { x0: px + HEAD_BOX.x0 * pw, x1: px + HEAD_BOX.x1 * pw, y0: py + HEAD_BOX.y0 * ph, y1: py + HEAD_BOX.y1 * ph }
const r1 = (n) => Math.round(n * 10) / 10
export const HEAD = { x: r1((HEAD_RECT.x0 + HEAD_RECT.x1) / 2), y: r1((HEAD_RECT.y0 + HEAD_RECT.y1) / 2) }

// El anillo es concéntrico con la cabeza y la rodea entera (su radio supera la diagonal de la caja de la cabeza).
export const RING_R = 112
export const ICON_R = 28
// Los cinco centros de los círculos están sobre un arco elíptico por encima de la cabeza, simétrico respecto al eje del retrato:
// dos a cada lado y Trayectoria en el eje, con el mismo paso angular (≈ 36°) entre vecinos.
export const ARC = { rx: 454, ry: 235 }
const onArc = (dx) => r1(HEAD.y - ARC.ry * Math.sqrt(1 - (dx / ARC.rx) ** 2))
const OFFSETS = { code: -430, projects: -264, journey: 0, how: 264, interest: 430 }
export const POINTS = Object.fromEntries(Object.entries(OFFSETS).map(([id, dx]) => [id, [HEAD.x + dx, onArc(dx)]]))

const unit = ([x, y], [cx, cy]) => { const d = Math.hypot(cx - x, cy - y); return [(cx - x) / d, (cy - y) / d] }
// La línea parte del borde del círculo del nodo, en dirección al centro del anillo, y llega al anillo; nunca entra en él.
// El nodo del eje (Trayectoria) tiene la etiqueta justo debajo del círculo, en la trayectoria de su línea: esa línea arranca bajo la etiqueta.
export const LABEL_DROP = 52
export function linePoints(id) {
  const p = POINTS[id]
  const [ux, uy] = unit(p, [HEAD.x, HEAD.y])
  if (p[0] === HEAD.x) return { x1: p[0], y1: r1(p[1] + LABEL_DROP), x2: HEAD.x, y2: r1(HEAD.y - RING_R) }
  return { x1: r1(p[0] + ICON_R * ux), y1: r1(p[1] + ICON_R * uy), x2: r1(HEAD.x - RING_R * ux), y2: r1(HEAD.y - RING_R * uy) }
}
const [first, last] = [POINTS.code, POINTS.interest]
export const arcPath = () => `M${first[0]} ${first[1]} A${ARC.rx} ${ARC.ry} 0 0 1 ${last[0]} ${last[1]}`

export const pct = ([x, y]) => ({ left: Math.round((x / VIEW.w) * 100000) / 1000, top: Math.round((y / VIEW.h) * 100000) / 1000 })
