import React from 'react'
import { site } from '../content/site.js'

// "Bots para Telegram" (correcciones 2, D2): un solo elemento que encapsula los bots. <details> funciona sin JavaScript, con teclado y con lector
// de pantalla. Lista en el orden del spec; una línea por bot y solo el estado que consta (los que no lo tienen no muestran ninguno).
export default function TelegramBots({ lang, group, heading = false }) {
  const w = site[lang].work
  const title = heading ? <h2>{group.title}</h2> : group.title
  return (
    <details className="bots" data-bots={group.id}>
      <summary>{title}<span className="bots-hint">{w.seeBots.replace('{n}', group.bots.length)}</span></summary>
      <ol className="bots-list">
        {group.bots.map((b) => (
          <li key={b.id} data-bot={b.id}>
            <strong>{b.title}</strong>
            {b.status && <span className={`badge badge-${b.status}`}>{w.status[b.status]}</span>}
            {b.text && <span className="bot-text">{b.text}</span>}
          </li>
        ))}
      </ol>
    </details>
  )
}
