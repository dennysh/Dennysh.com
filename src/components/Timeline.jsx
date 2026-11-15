import React, { useEffect, useRef, useState } from 'react'

// Línea de tiempo de Trayectoria (al estilo de la sección "Experience" de brittanychiang.com): fechas a la izquierda, a la derecha el cargo · empresa,
// lo más destacado, los retos superados (opcionales, debajo de las viñetas) y etiquetas. Las fotos son opcionales: una miniatura por entrada (la primera) que se amplía en un diálogo modal con todas las de la entrada.
// Sin fotos declaradas no hay miniaturas, ni diálogo, ni huecos. Las miniaturas son enlaces a la foto (sin JavaScript abren el archivo).
const fmt = (t, vars) => t.replace(/\{(\w+)\}/g, (_m, k) => String(vars[k]))
const real = (p) => Boolean(p && typeof p.src === 'string' && p.src)
// Tope en los extremos (sin dar la vuelta).
export const stepIndex = (k, d, n) => (n > 0 ? Math.max(0, Math.min(n - 1, k + d)) : 0)

function Thumb({ e, ui, js, onOpen }) {
  const first = e.photos[0]
  const n = e.photos.length
  const label = `${ui.enlarge}: ${first.alt}${n > 1 ? ` (${fmt(ui.photoOf, { k: 1, n })})` : ''}`
  return (
    <a
      className="tl-thumb"
      href={first.src}
      role={js ? 'button' : undefined}
      aria-haspopup={js ? 'dialog' : undefined}
      aria-label={label}
      onClick={(ev) => { if (js) { ev.preventDefault(); onOpen(ev.currentTarget) } }}
      onKeyDown={(ev) => { if (js && ev.key === ' ') { ev.preventDefault(); onOpen(ev.currentTarget) } }}
    >
      <img src={first.thumb ?? first.src} alt="" loading="lazy" decoding="async" width={first.thumb ? undefined : first.width} height={first.thumb ? undefined : first.height} />
      {n > 1 && <span className="tl-more" aria-hidden="true">{`+${n - 1}`}</span>}
    </a>
  )
}

function Lightbox({ entry, k, ui, dialogRef, onClose, onStep }) {
  const n = entry?.photos.length ?? 0
  const photo = entry?.photos[k]
  return (
    <dialog
      ref={dialogRef}
      className="tl-dialog"
      aria-label={entry ? fmt(ui.dialog, { title: entry.title }) : undefined}
      onClose={onClose}
      onClick={(ev) => { if (ev.target === ev.currentTarget) onClose() }}
      onKeyDown={(ev) => {
        if (ev.key === 'ArrowRight') { ev.preventDefault(); onStep(1) }
        if (ev.key === 'ArrowLeft') { ev.preventDefault(); onStep(-1) }
      }}
    >
      {photo && (
        <div className="tl-dialog-in">
          <button type="button" className="tl-close" onClick={onClose}>{ui.close}</button>
          <figure className="tl-figure">
            <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} decoding="async" />
            {photo.alt && <figcaption>{photo.alt}</figcaption>}
          </figure>
          {n > 1 && (
            <div className="tl-ctrl">
              <button type="button" className="tl-step" aria-label={ui.prev} disabled={k === 0} onClick={() => onStep(-1)}>‹</button>
              <span className="tl-count" aria-live="polite">{fmt(ui.photoOf, { k: k + 1, n })}</span>
              <button type="button" className="tl-step" aria-label={ui.next} disabled={k === n - 1} onClick={() => onStep(1)}>›</button>
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}

export default function Timeline({ entries: all, ui }) {
  const entries = all.map((e) => ({ ...e, photos: (e.photos ?? []).filter(real), challenges: e.challenges ?? [] }))
  const any = entries.some((e) => e.photos.length > 0)
  const [js, setJs] = useState(false)
  const [open, setOpen] = useState(null) // { id, k }
  const dialogRef = useRef(null)
  useEffect(() => setJs(true), [])
  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) { if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '') }
    if (!open && d.open) d.close()
  }, [open])
  const cur = open ? entries.find((e) => e.id === open.id) : null
  const close = () => setOpen(null)
  const step = (d) => setOpen((o) => (o ? { ...o, k: stepIndex(o.k, d, cur?.photos.length ?? 0) } : o))

  return (
    <>
      <ol className="timeline" aria-label={ui.list}>
        {entries.map((e) => {
          const kind = ui.kinds[e.kind]
          return (
            <li key={e.id} className="tl-item" data-kind={e.kind} data-current={e.current ? 'true' : undefined} data-photo={e.photos.length ? 'true' : undefined}>
              <p className="tl-when">{e.when}</p>
              <div className="tl-body">
                <h2 className="tl-title">
                  {e.title}{e.org && <span className="tl-org"> · {e.org}</span>}
                  {kind && <span className="tl-kind">{kind}</span>}
                  {e.status && <span className="tl-kind tl-status">{e.status}</span>}
                </h2>
                <ul className="tl-points">{e.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                {e.challenges.length > 0 && (
                  <div className="tl-challenges">
                    {e.challenges.map((c) => (
                      <div key={c.title} className="tl-challenge">
                        <p className="tl-ch-label">{ui.challenge}</p>
                        <h3 className="tl-ch-title">{c.title}</h3>
                        <p className="tl-ch-text">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
                {e.tags.length > 0 && <ul className="tags tl-tags">{e.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
                {e.photos.length > 0 && <Thumb e={e} ui={ui} js={js} onOpen={() => setOpen({ id: e.id, k: 0 })} />}
              </div>
            </li>
          )
        })}
      </ol>
      {any && <Lightbox entry={cur} k={open?.k ?? 0} ui={ui} dialogRef={dialogRef} onClose={close} onStep={step} />}
    </>
  )
}
