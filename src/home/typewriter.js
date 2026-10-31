// Escritura de los paneles (spec primera pantalla §7): guiada por tiempo, no por fotogramas, para que acabe aunque la pestaña
// esté en segundo plano. Reduced-motion: texto completo al instante. Nunca navega.
export const DURATION_MS = 1800

export const typedCount = (length, elapsedMs, durationMs = DURATION_MS) =>
  elapsedMs >= durationMs ? length : Math.max(0, Math.min(length, Math.floor((elapsedMs / durationMs) * length)))

export const prefersReducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// Devuelve { skip, stop }. `skip` completa el texto al instante; `stop` cancela sin completar.
export function startTyping({ length, onProgress, durationMs = DURATION_MS, reduced = prefersReducedMotion(), now = () => performance.now(), raf = (f) => requestAnimationFrame(f), caf = (h) => cancelAnimationFrame(h), setTimer = setTimeout, clearTimer = clearTimeout }) {
  if (reduced) {
    onProgress(length)
    return { skip() {}, stop() {} }
  }
  const start = now()
  let handle
  let done = false
  const finish = () => {
    if (done) return
    done = true
    caf(handle)
    clearTimer(guard)
    onProgress(length)
  }
  const tick = () => {
    if (done) return
    const n = typedCount(length, now() - start, durationMs)
    onProgress(n)
    if (n >= length) { done = true; clearTimer(guard) } else handle = raf(tick)
  }
  const guard = setTimer(finish, durationMs + 50) // respaldo si el navegador no dibuja fotogramas
  onProgress(0)
  handle = raf(tick)
  return { skip: finish, stop() { done = true; caf(handle); clearTimer(guard) } }
}
