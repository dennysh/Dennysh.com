import React from 'react'
import { isPending } from '../content/site.js'

// Texto o marcador pending: lo no confirmado se ve como tal (spec §9), nunca como dato.
export default function Txt({ v }) {
  if (isPending(v)) return <span className="pending" data-pending={v.id}>[{v.hint} · {v.id}]</span>
  return <>{v}</>
}
