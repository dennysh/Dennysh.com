import React from 'react'
import { site } from '../content/site.js'

// "Bots para Telegram" (correcciones 2, D2): un solo elemento que encapsula los bots. <details> funciona sin JavaScript, con teclado y con lector
// de pantalla. Lista en el orden del spec; una línea por bot y solo el estado que consta (los que no lo tienen no muestran ninguno).
// `open`: en la tarjeta de Proyectos los bots se ven abiertos desde el principio (críticos 2); en la vista previa de la portada siguen cerrados.
// Vista previa (cerrada): un renglón por bot, la primera frase de su texto. En la página Proyectos (`open`) se muestra el texto completo
// (así se ve «Hoy lo usan más de 10 técnicos de la empresa.») (solo texto que ya existe; el que no tiene texto muestra solo el nombre).
const oneLine = (t) => (t ? (t.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? t) : '')
export default function TelegramBots({ lang, group, heading = false, open = false }) {
  const w = site[lang].work
  const title = heading ? <h2>{group.title}</h2> : group.title
  return (
    <details className="bots" data-bots={group.id} open={open || undefined}>
      <summary>{title}<span className="bots-hint">{w.seeBots.replace('{n}', group.bots.length)}</span></summary>
      <ol className="bots-list">
        {group.bots.map((b) => (
          <li key={b.id} data-bot={b.id}>
            <span className="bot-head"><strong>{b.title}</strong>{b.status && <span className={`badge badge-${b.status}`}>{w.status[b.status]}</span>}</span>
            {b.text && <span className="bot-text">{open ? b.text : oneLine(b.text)}</span>}
            {open && b.shot && (
              <figure className="bot-shot">
                <img src={b.shot.src} width={b.shot.width} height={b.shot.height} alt={b.shot.alt} loading="lazy" decoding="async" />
                <figcaption>{b.shot.caption}</figcaption>
              </figure>
            )}
          </li>
        ))}
      </ol>
    </details>
  )
}
