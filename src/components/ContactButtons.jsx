import React from 'react'
import { links } from '../content/site.js'

// «Escríbeme» (correo) y «WhatsApp». El número solo está en el enlace de wa.me: el texto visible nunca lo muestra.
// WhatsApp abre en otra pestaña (rel noopener noreferrer) y lo dice en su nombre accesible.
// `withEmail={false}` en Contacto: ahí el correo ya es el único botón mailto del cuerpo (C-01) cuando el formulario no está disponible.
export default function ContactButtons({ ui, withEmail = true }) {
  return (
    <p className="contact-buttons">
      {withEmail && <a className="btn btn-primary" href={links.email}>{ui.email}</a>}
      <a className="btn btn-secondary" href={links.whatsapp} target="_blank" rel="noopener noreferrer" aria-label={ui.whatsappLabel}>{ui.whatsapp}<span aria-hidden="true"> ↗</span></a>
    </p>
  )
}
