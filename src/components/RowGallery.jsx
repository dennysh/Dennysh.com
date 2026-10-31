import React, { useEffect, useRef, useState } from 'react'
import Txt from './Txt.jsx'
import { isPending } from '../content/site.js'
import { segmentIndex, isRealMove, swipeStep, wrap } from './gallery-logic.js'

// Galería por fila (spec §5.1): componente aparte. El texto de cada fila es siempre visible; las fotos son opcionales.
// Escritorio con puntero fino: la posición horizontal dentro de la fila decide la foto. Táctil: toque + ‹ › + deslizar.
// Posiciones por CSSOM (element.style), nunca con atributos style (CSP sin unsafe-inline).
const fmt = (t, vars) => t.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k]))
const pad = (n) => String(n).padStart(2, '0')

function Photo({ photo, ui, lang }) {
  if (isPending(photo)) return <span className="g-ph"><Txt lang={lang} v={photo} /></span>
  return <img src={photo.src} srcSet={photo.srcSet} alt={photo.alt ?? ''} loading="lazy" decoding="async" width={photo.width} height={photo.height} />
}

export default function RowGallery({ rows, ui, lang }) {
  const [mode, setMode] = useState('none') // 'none' (sin JS aún) | 'fine' | 'touch'
  const [open, setOpen] = useState(null) // fila abierta (táctil)
  const [show, setShow] = useState(null) // { row, k } con la foto flotante visible
  const [inline, setInline] = useState({}) // foto activa por fila en modo táctil
  const floatRef = useRef(null)
  const last = useRef(null)
  const lastScroll = useRef(-1e9)
  const reduced = useRef(false)
  const touchX = useRef(null)

  useEffect(() => {
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches
    setMode(fine ? 'fine' : 'touch')
    const onScroll = () => { lastScroll.current = performance.now(); setShow(null) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const place = (el, x, y, rowEl) => {
    if (!el) return
    if (reduced.current || x == null) {
      const r = rowEl.getBoundingClientRect()
      el.style.transform = `translate(${Math.max(8, r.right - 270)}px, ${r.top + 8}px)`
    } else {
      el.style.transform = `translate(${x + 18}px, ${y + 18}px)`
    }
  }

  const onMove = (e, ri, n) => {
    if (mode !== 'fine' || e.pointerType === 'touch') return
    const next = { x: e.clientX, y: e.clientY }
    const real = isRealMove(last.current, next, performance.now(), lastScroll.current)
    last.current = next
    if (!real) return
    const r = e.currentTarget.getBoundingClientRect()
    setShow({ row: ri, k: segmentIndex(e.clientX, r.left, r.width, n) })
    place(floatRef.current, e.clientX, e.clientY, e.currentTarget)
  }
  const onLeave = () => { last.current = null; setShow(null) }

  const onKeyFocus = (e, ri) => {
    if (mode !== 'fine') return
    setShow({ row: ri, k: 0, kb: true })
    place(floatRef.current, null, null, e.currentTarget)
  }
  const onKey = (e, ri, n) => {
    if (mode === 'fine' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault()
      setShow((s) => ({ row: ri, k: wrap((s?.k ?? 0) + (e.key === 'ArrowRight' ? 1 : -1), n), kb: true }))
    }
  }
  const step = (ri, n, d) => setInline((m) => ({ ...m, [ri]: wrap((m[ri] ?? 0) + d, n) }))

  const cur = show ? rows[show.row] : null
  return (
    <div className="gallery" data-mode={mode}>
      <p className="g-hint">{ui.hint}</p>
      <ol className="g-rows" aria-label={ui.list}>
        {rows.map((r, ri) => {
          const n = r.photos.length
          const isOpen = open === ri
          const k = inline[ri] ?? 0
          return (
            <li key={r.id} className="g-row" data-dim={show && !show.kb && show.row !== ri ? 'true' : undefined}>
              <button
                type="button"
                className="g-btn"
                aria-expanded={mode === 'touch' ? isOpen : undefined}
                aria-controls={mode === 'touch' ? `g-${r.id}` : undefined}
                onPointerMove={(e) => onMove(e, ri, n)}
                onPointerLeave={onLeave}
                onFocus={(e) => onKeyFocus(e, ri)}
                onBlur={onLeave}
                onKeyDown={(e) => onKey(e, ri, n)}
                onClick={() => { if (mode === 'touch') setOpen(isOpen ? null : ri) }}
              >
                <span className="g-num">{pad(ri + 1)}</span>
                <span className="g-title">{r.title}</span>
                <span className="g-meta">{r.meta.map((m, i) => <React.Fragment key={i}>{i > 0 && ' · '}<Txt lang={lang} v={m} /></React.Fragment>)}</span>
                <span className="g-desc">{r.text}</span>
              </button>
              <div className="g-strip" aria-hidden="true">
                {r.photos.map((_p, i) => <span key={i} className={show && show.row === ri && show.k === i ? 'on' : undefined} />)}
              </div>
              {mode === 'touch' && isOpen && (
                <div className="g-inline" id={`g-${r.id}`} onTouchStart={(e) => { touchX.current = e.touches[0].clientX }} onTouchEnd={(e) => {
                  if (touchX.current == null) return
                  step(ri, n, swipeStep(e.changedTouches[0].clientX - touchX.current)); touchX.current = null
                }}>
                  <div className="g-frame"><Photo photo={r.photos[k]} ui={ui} lang={lang} /></div>
                  <div className="g-ctrl">
                    <button type="button" className="g-step" aria-label={ui.prev} disabled={k === 0} onClick={() => step(ri, n, -1)}>‹</button>
                    <span className="g-count">{fmt(ui.photoOf, { k: k + 1, n })}</span>
                    <button type="button" className="g-step" aria-label={ui.next} disabled={k === n - 1} onClick={() => step(ri, n, 1)}>›</button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div ref={floatRef} className="g-float" data-on={show ? 'true' : undefined} aria-hidden="true">
        {cur && <><div className="g-frame"><Photo photo={cur.photos[show.k]} ui={ui} lang={lang} /></div><span className="g-count">{show.k + 1}/{cur.photos.length}</span></>}
      </div>
    </div>
  )
}
