import React from 'react'
import { Header, Footer } from './Site.jsx'
import { links } from './content/site.js'

// Tratamiento real de datos (spec §8, §10; AC-31). Cada afirmación corresponde a algo que el código hace. La demo salió del sitio: ya no hay tratamiento por ella.
const TEXT = {
  en: {
    privacy: {
      title: 'Privacy',
      intro: 'This site has no accounts, no cookies and no analytics. The only processing happens when you send the contact form.',
      items: [
        ['Cloudflare Turnstile', 'To tell people from bots, the contact form uses Cloudflare Turnstile. It runs only when you press Send, and Cloudflare processes the check under its own terms.'],
        ['Contact form', 'The contact form (on the Contact page, when it is enabled) asks for the option you choose, your answers to a few short questions, your name, your email address, an optional message and your consent. It is used only to reply to you. The message is sent by email to dennys@dennysh.com and is not stored on this site. To enforce limits on sending, I keep for 25 hours only an HMAC of your IP address and an HMAC of your email address (with a secret key), plus the time; never the text, the name or the address itself. The Cloudflare Turnstile check described above runs when you press Send. Only the recipient of the email, the site owner, sees what you wrote.'],
        ['Your data', 'If you write to me by email or through the contact form, I use your message only to reply.'],
      ],
    },
    terms: {
      title: 'Terms',
      intro: 'Short terms of use for this site.',
      items: [
        ['Availability', 'The site is provided as it is, without guarantee of availability. Parts of it, such as the contact form, can stop working without notice.'],
        ['Content', 'The text on this page describes the work of Dennys Heras. Items marked "in development" or "exploration" are not finished products.'],
        ['Contact', `Questions: ${links.emailAddress}.`],
      ],
    },
    back: 'Back to the site',
  },
  es: {
    privacy: {
      title: 'Privacidad',
      intro: 'Este sitio no tiene cuentas, ni cookies, ni analítica. El único tratamiento ocurre cuando envías el formulario de contacto.',
      items: [
        ['Cloudflare Turnstile', 'Para distinguir personas de bots, el formulario de contacto usa Cloudflare Turnstile. Solo se ejecuta cuando pulsas Enviar, y Cloudflare procesa la comprobación bajo sus propios términos.'],
        ['Formulario de contacto', 'El formulario de contacto (en la página Contacto, cuando está activo) pide la opción que eliges, tus respuestas a unas pocas preguntas cortas, tu nombre, tu correo, un mensaje opcional y tu consentimiento. Se usa solo para responderte. El mensaje se envía por correo a dennys@dennysh.com y no se guarda en este sitio. Para aplicar los límites de envío guardo durante 25 horas solo un HMAC de tu dirección IP y un HMAC de tu correo (con una clave secreta), más la hora; nunca el texto, el nombre ni la dirección. Al pulsar Enviar se ejecuta la comprobación de Cloudflare Turnstile descrita arriba. Solo quien recibe el correo, el dueño del sitio, ve lo que escribiste.'],
        ['Tus datos', 'Si me escribes por correo o por el formulario de contacto, uso tu mensaje solo para responderte.'],
      ],
    },
    terms: {
      title: 'Términos',
      intro: 'Términos de uso breves de este sitio.',
      items: [
        ['Disponibilidad', 'El sitio se ofrece tal cual, sin garantía de disponibilidad. Partes del sitio, como el formulario de contacto, pueden dejar de funcionar sin aviso.'],
        ['Contenido', 'El texto de esta página describe el trabajo de Dennys Heras. Lo marcado como "en desarrollo" o "exploración" no son productos terminados.'],
        ['Contacto', `Consultas: ${links.emailAddress}.`],
      ],
    },
    back: 'Volver al sitio',
  },
}

export function LegalPage({ lang, kind }) {
  const t = TEXT[lang][kind]
  return (
    <>
      <Header lang={lang} view={kind} />
      <main id="main">
        <section className="block" aria-labelledby="legal-h">
          <div className="wrap">
            <h1 id="legal-h">{t.title}</h1>
            <p className="lead">{t.intro}</p>
            {t.items.map(([h, p]) => (<div key={h}><h2>{h}</h2><p>{p}</p></div>))}
            <p><a href={`/${lang}/`}>{TEXT[lang].back}</a></p>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
    </>
  )
}

export const NotFound = ({ lang }) => (
  <>
    <Header lang={lang} />
    <main id="main"><section className="block"><div className="wrap">
      <h1>404</h1>
      <p className="lead">{lang === 'es' ? 'No encontré esta página.' : 'I could not find this page.'}</p>
      <p><a href={`/${lang}/`}>{TEXT[lang].back}</a></p>
    </div></section></main>
    <Footer lang={lang} />
  </>
)
