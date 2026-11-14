import React, { useEffect, useRef, useState } from 'react'
import { createMobileNetwork, P } from './network-mobile.js'
import { accentRgb } from './network.js'

// Red de fondo del móvil (≤ 760 px). Solo cliente: en el servidor y en la primera pintura no devuelve nada (sin diferencia de hidratación).
// Se enciende sola (luz errante suave) y donde toca o arrastra el dedo. Con movimiento reducido no se monta hasta el primer toque y solo
// se dibuja al tocar (sin animación continua). El canvas es decorativo y no recibe eventos: se escuchan en el contenedor (`hostRef`).
export const PHONE = '(max-width: 760px)'
const FALLBACK_RGB = '179,48,29'
const mq = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : null)

export default function MobileNetwork({ hostRef }) {
  const [phone, setPhone] = useState(false)
  const [touched, setTouched] = useState(false) // con movimiento reducido, la red aparece con el primer toque
  const [reduced, setReduced] = useState(false)
  const [cv, setCv] = useState(null)
  const firstTouch = useRef(null) // posición del toque que montó la red (movimiento reducido): ya cuenta como el primer toque

  useEffect(() => {
    const m = mq(PHONE), r = mq('(prefers-reduced-motion: reduce)')
    const sync = () => { setPhone(!!m?.matches); setReduced(!!r?.matches) }
    sync()
    m?.addEventListener('change', sync); r?.addEventListener('change', sync)
    return () => { m?.removeEventListener('change', sync); r?.removeEventListener('change', sync) }
  }, [])

  const mounted = phone && (!reduced || touched)

  // Primer toque con movimiento reducido: monta la red.
  useEffect(() => {
    const host = hostRef.current
    if (!host || !phone || !reduced || touched) return undefined
    const first = (e) => { const r = host.getBoundingClientRect(); firstTouch.current = [e.clientX - r.left, e.clientY - r.top]; setTouched(true) }
    host.addEventListener('pointerdown', first, { once: true, passive: true })
    return () => host.removeEventListener('pointerdown', first)
  }, [phone, reduced, touched, hostRef])

  useEffect(() => {
    const host = hostRef.current
    const ctx = cv?.getContext('2d')
    if (!mounted || !host || !cv || !ctx) return undefined
    const img = host.querySelector('.portrait')
    const reduceMq = mq('(prefers-reduced-motion: reduce)')
    const reduce = () => !!reduceMq?.matches
    const net = createMobileNetwork()
    let rgb = FALLBACK_RGB, raf = 0, last = 0, acc = 0, visible = true, dpr = 1

    const readColor = () => { rgb = accentRgb(getComputedStyle(document.documentElement).getPropertyValue('--accent')) ?? FALLBACK_RGB }
    const draw = () => net.frame(ctx, performance.now(), .016, rgb, reduce())
    const stop = () => { cancelAnimationFrame(raf); raf = 0 }
    const loop = (t) => {
      raf = requestAnimationFrame(loop)
      const dt = Math.min(.05, (t - last) / 1000 || .016); last = t; acc += dt
      if (acc < 1 / P.fps - .002) return // tope de cuadros por segundo para cuidar la batería
      net.frame(ctx, t, acc, rgb, false); acc = 0
    }
    const start = () => {
      stop()
      if (reduce() || !visible || document.hidden) return
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const measure = () => {
      const r = host.getBoundingClientRect()
      if (!r.width || !r.height) return
      const p = img?.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      net.resize(r.width, r.height, p ? { x: p.left - r.left, y: p.top - r.top, w: p.width || 1, h: p.height || 1 } : { x: 0, y: 0, w: 1, h: 1 })
      if (reduce()) draw()
    }
    // Luz del dedo: sigue al dedo y se apaga sola al soltar. `touch-action: pan-y` (CSS) deja el scroll vertical al navegador.
    const pos = (e) => { const r = host.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const down = (e) => { net.touchAt(...pos(e), true, performance.now()); if (reduce()) draw(); else start() }
    const move = (e) => {
      if (e.pointerType !== 'mouse' && !net.touching) return
      net.touchAt(...pos(e), e.pointerType !== 'mouse', performance.now())
      if (reduce()) draw()
    }
    const up = () => { net.release(performance.now()); if (reduce()) draw() }
    const retheme = () => { readColor(); if (reduce()) draw() }

    readColor()
    const ready = () => { measure(); start() }
    if (img && !img.complete) img.addEventListener('load', ready, { once: true })
    ready()
    if (firstTouch.current) { net.touchAt(...firstTouch.current, true, performance.now()); firstTouch.current = null; if (reduce()) draw() }
    host.addEventListener('pointerdown', down, { passive: true })
    host.addEventListener('pointermove', move, { passive: true })
    host.addEventListener('pointerup', up, { passive: true })
    host.addEventListener('pointercancel', up, { passive: true })
    const leave = (e) => { if (e.pointerType === 'mouse') up() }
    host.addEventListener('pointerleave', leave, { passive: true })
    document.addEventListener('visibilitychange', start)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null
    ro?.observe(host)
    if (!ro) window.addEventListener('resize', measure)
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; start() }, { threshold: 0 }) : null
    io?.observe(host)
    const mo = new MutationObserver(retheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    reduceMq?.addEventListener('change', start)
    return () => {
      stop()
      img?.removeEventListener('load', ready)
      host.removeEventListener('pointerdown', down)
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerup', up)
      host.removeEventListener('pointercancel', up)
      host.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', start)
      ro?.disconnect(); io?.disconnect(); mo.disconnect()
      window.removeEventListener('resize', measure)
      reduceMq?.removeEventListener('change', start)
    }
  }, [mounted, cv, hostRef])

  return mounted ? <canvas ref={setCv} className="net-m" aria-hidden="true" data-net-m /> : null
}
