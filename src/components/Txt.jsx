import React from 'react'
import { isPending, AUTHORIZED_PENDING } from '../content/site.js'

const DEFAULT = { es: 'por confirmar', en: 'to be confirmed' }

// Texto o marcador pending. Autorizado a publicarse → etiqueta pública corta ("por confirmar"); sin autorizar → se ve la pista interna
// (así un marcador nuevo no pasa desapercibido en desarrollo; el build de producción lo rechaza).
export default function Txt({ v, lang = 'es' }) {
  if (!isPending(v)) return <>{v}</>
  if (AUTHORIZED_PENDING.includes(v.id)) return <span className="pending" data-pending={v.id}>{typeof v.label === 'string' ? v.label : DEFAULT[lang]}</span>
  return <span className="pending" data-pending={v.id}>[{v.hint} · {v.id}]</span>
}
