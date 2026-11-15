import React, { useEffect, useRef } from 'react'

// Navegación de las páginas interiores. En móvil es una sola fila desplazable: al cargar centra la sección actual y marca con
// data-more qué lado tiene más enlaces (el CSS los difumina). El HTML del servidor ya sale marcado «right» (en móvil no caben las seis).
export default function TopNav({ label, children }) {
  const nav = useRef(null)
  useEffect(() => {
    const el = nav.current
    const ul = el?.querySelector('ul')
    if (!ul) return undefined
    const sync = () => {
      const more = []
      if (ul.scrollLeft > 2) more.push('left')
      if (ul.scrollLeft + ul.clientWidth < ul.scrollWidth - 2) more.push('right')
      el.setAttribute('data-more', more.join(' '))
    }
    const cur = ul.querySelector('[aria-current="page"]')
    if (cur && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = Math.max(0, cur.offsetLeft - (ul.clientWidth - cur.offsetWidth) / 2 - ul.offsetLeft)
    sync()
    ul.addEventListener('scroll', sync, { passive: true })
    addEventListener('resize', sync)
    return () => { ul.removeEventListener('scroll', sync); removeEventListener('resize', sync) }
  }, [])
  return <nav ref={nav} aria-label={label} data-more="right">{children}</nav>
}
