import { describe, it, expect } from 'vitest'
import { typedCount, startTyping, DURATION_MS } from '../../src/home/typewriter.js'

// TH17 (AC-H5): escritura por tiempo, ≤ 1,8 s, completable, sin animación con reduced-motion, sin navegar.
function clock() {
  let t = 0
  const frames = []
  const timers = []
  return {
    now: () => t,
    raf: (f) => { frames.push(f); return frames.length },
    caf: () => {},
    setTimer: (f, ms) => { timers.push({ f, at: t + ms }); return timers.length },
    clearTimer: () => {},
    jump(ms) { t += ms },
    advance(ms) { t += ms; const fs = frames.splice(0); fs.forEach((f) => f()) },
    fireTimers() { timers.forEach((x) => { if (x.at <= t) x.f() }) },
  }
}

describe('typedCount', () => {
  it('es proporcional al tiempo y nunca pasa del largo', () => {
    expect(typedCount(100, 0)).toBe(0)
    expect(typedCount(100, DURATION_MS / 2)).toBe(50)
    expect(typedCount(100, DURATION_MS)).toBe(100)
    expect(typedCount(100, DURATION_MS * 5)).toBe(100)
  })
  it('la duración total no pasa de 1,8 s', () => expect(DURATION_MS).toBeLessThanOrEqual(1800))
})

describe('startTyping', () => {
  it('avanza con el tiempo y completa en la duración aunque lleguen pocos fotogramas', () => {
    const c = clock(); const seen = []
    startTyping({ length: 200, onProgress: (n) => seen.push(n), reduced: false, ...c })
    c.advance(100); c.advance(1000) // solo dos fotogramas
    expect(seen.at(-1)).toBeLessThan(200)
    c.advance(1000)
    expect(seen.at(-1)).toBe(200)
  })
  it('si no hay fotogramas (pestaña en segundo plano), el temporizador de respaldo la completa', () => {
    const c = clock(); const seen = []
    startTyping({ length: 50, onProgress: (n) => seen.push(n), reduced: false, ...c })
    c.jump(DURATION_MS + 60) // ningún fotograma llegó
    c.fireTimers()
    expect(seen.at(-1)).toBe(50)
  })
  it('skip (clic o Esc) completa al instante', () => {
    const c = clock(); const seen = []
    const t = startTyping({ length: 80, onProgress: (n) => seen.push(n), reduced: false, ...c })
    c.advance(50)
    t.skip()
    expect(seen.at(-1)).toBe(80)
    c.advance(2000)
    expect(seen.at(-1)).toBe(80)
  })
  it('con prefers-reduced-motion aparece completo al instante, sin fotogramas', () => {
    const c = clock(); const seen = []
    startTyping({ length: 30, onProgress: (n) => seen.push(n), reduced: true, ...c })
    expect(seen).toEqual([30])
  })
  it('nunca navega: el módulo no toca location ni window.open', async () => {
    const { readFileSync } = await import('node:fs')
    const src = readFileSync('src/home/typewriter.js', 'utf8')
    expect(src).not.toMatch(/location|window\.open|href/)
  })
})
