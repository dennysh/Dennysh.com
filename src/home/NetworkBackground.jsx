import React, { useEffect, useRef, useState } from 'react'
import { createNetwork, accentRgb } from './network.js'

// Solo escritorio con puntero fino (la maqueta aprobada es de ratón). En táctil o móvil no se monta ni un canvas.
export const FINE_POINTER = '(hover: hover) and (pointer: fine) and (min-width: 761px)'
const FALLBACK_RGB = '179,48,29'
const mq = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : null)

// Red de fondo: canvas decorativo detrás del retrato y de los nodos. Solo cliente (en el servidor y en la primera pintura no devuelve nada,
// así que no hay diferencia de hidratación). Los eventos de puntero se escuchan en el contenedor de la primera pantalla; el canvas no los recibe.
export default function NetworkBackground() {
  const [on, setOn] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const fine = mq(FINE_POINTER)
    if (!fine) return undefined
    const sync = () => setOn(fine.matches)
    sync()
    fine.addEventListener('change', sync)
    return () => fine.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const cv = ref.current
    const host = cv?.parentElement
    const ctx = cv?.getContext('2d')
    if (!on || !host || !ctx) return undefined
    const reduceMq = mq('(prefers-reduced-motion: reduce)')
    const reduced = () => !!reduceMq?.matches
    const net = createNetwork()
    let rgb = FALLBACK_RGB, raf = 0, visible = true, dpr = 1

    const readColor = () => { rgb = accentRgb(getComputedStyle(document.documentElement).getPropertyValue('--accent')) ?? FALLBACK_RGB }
    const draw = () => net.frame(ctx, performance.now(), rgb, reduced())
    const stop = () => { cancelAnimationFrame(raf); raf = 0 }
    const loop = (t) => { net.frame(ctx, t, rgb, false); raf = requestAnimationFrame(loop) }
    // Con movimiento reducido no hay animación continua: se dibuja un cuadro al mover el puntero, al cambiar de tema o de tamaño.
    const start = () => {
      stop()
      if (!visible || document.hidden) return
      if (reduced()) draw()
      else raf = requestAnimationFrame(loop)
    }
    const resize = () => {
      const r = host.getBoundingClientRect()
      if (!r.width || !r.height) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      net.resize(r.width, r.height)
      if (reduced()) draw()
    }
    const move = (e) => {
      if (e.pointerType === 'touch') return
      const r = host.getBoundingClientRect()
      net.pointer(e.clientX - r.left, e.clientY - r.top)
      if (reduced()) { net.snap(); draw() }
    }
    const leave = () => { net.pointer(null); if (reduced()) { net.snap(); draw() } }
    const retheme = () => { readColor(); if (reduced()) draw() }

    readColor()
    resize()
    start()
    host.addEventListener('pointermove', move, { passive: true })
    host.addEventListener('pointerleave', leave, { passive: true })
    document.addEventListener('visibilitychange', start)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null
    ro?.observe(host)
    if (!ro) window.addEventListener('resize', resize)
    const io = typeof IntersectionObserver === 'function' ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; start() }) : null
    io?.observe(host)
    // El tema cambia con el interruptor (data-theme en <html>); el sistema operativo ya no decide.
    const mo = new MutationObserver(retheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    reduceMq?.addEventListener('change', start)
    return () => {
      stop()
      host.removeEventListener('pointermove', move)
      host.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', start)
      ro?.disconnect(); io?.disconnect(); mo.disconnect()
      window.removeEventListener('resize', resize)
      reduceMq?.removeEventListener('change', start)
    }
  }, [on])

  return on ? <canvas ref={ref} className="net" aria-hidden="true" data-net /> : null
}
