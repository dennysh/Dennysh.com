import React from 'react'
import { Header, Footer } from './Site.jsx'
import { links } from './content/site.js'

// Tratamiento real de datos de la demo (spec §8, §10; AC-31). Cada afirmación corresponde a algo que el código hace.
const TEXT = {
  en: {
    privacy: {
      title: 'Privacy',
      intro: 'This site has no accounts, no cookies and no analytics. The only processing happens when you run the live demo.',
      items: [
        ['What I store', 'When you run the demo I store the synthetic event the system generated (fictional account, a documentation-range IP address, the decision and the audit record) and a visitor hash. The hash is an HMAC of your IP address with a secret key; your IP address itself is never stored.'],
        ['Retention', 'Events and your interventions are kept 24 hours and then deleted automatically. The alert-slot records that enforce the rate limits are kept 25 hours and then deleted.'],
        ['Cloudflare Turnstile', 'To tell people from bots, the demo uses Cloudflare Turnstile. It runs only when you press the button, and Cloudflare processes the check under its own terms.'],
        ['Telegram', 'Each run can send a short alert to the site owner through Telegram. The message contains only fixed text: scenario, decision, rule, time and a read-only link to the event. It never contains anything you typed, because you type nothing.'],
        ['Browser storage', 'The event identifier is kept in your browser session storage so a page reload restores the result. It is not a cookie, is not sent anywhere except to this site, and disappears when you close the tab.'],
        ['Your data', 'The demo asks you for no personal data. If you write to me by email, I use your message only to reply.'],
      ],
    },
    terms: {
      title: 'Terms',
      intro: 'Short terms of use for this site and its demo.',
      items: [
        ['The demo is a simulation', 'Everything in the live demo is simulated with fictional data. Nothing real is attacked, blocked or investigated.'],
        ['Limits', 'The demo limits how many real alerts it sends (one every 10 minutes per visitor and a daily cap overall). Past the limit the simulation still runs and says so.'],
        ['Availability', 'The site and the demo are provided as they are, without guarantee of availability. The demo can stop working without notice.'],
        ['Content', 'The text on this page describes the work of Dennys Heras. Items marked "in development" or "exploration" are not finished products.'],
        ['Contact', `Questions: ${links.emailAddress}.`],
      ],
    },
    back: 'Back to the site',
  },
  es: {
    privacy: {
      title: 'Privacidad',
      intro: 'Este sitio no tiene cuentas, ni cookies, ni analítica. El único tratamiento ocurre cuando ejecutas la demo en vivo.',
      items: [
        ['Qué guardo', 'Al ejecutar la demo guardo el evento sintético que generó el sistema (cuenta ficticia, una IP de rango de documentación, la decisión y el registro de auditoría) y un hash de visitante. El hash es un HMAC de tu dirección IP con una clave secreta; tu dirección IP nunca se guarda.'],
        ['Retención', 'Los eventos y tus intervenciones se conservan 24 horas y luego se borran de forma automática. Los registros de cupo de alerta que aplican los límites se conservan 25 horas y luego se borran.'],
        ['Cloudflare Turnstile', 'Para distinguir personas de bots, la demo usa Cloudflare Turnstile. Solo se ejecuta cuando pulsas el botón, y Cloudflare procesa la comprobación bajo sus propios términos.'],
        ['Telegram', 'Cada ejecución puede enviar una alerta corta al dueño del sitio por Telegram. El mensaje solo contiene texto fijo: escenario, decisión, regla, hora y un enlace de solo lectura al evento. Nunca contiene nada que hayas escrito, porque no escribes nada.'],
        ['Almacenamiento del navegador', 'El identificador del evento se guarda en el almacenamiento de sesión del navegador para que una recarga restaure el resultado. No es una cookie, no se envía a ningún sitio salvo a este y desaparece al cerrar la pestaña.'],
        ['Tus datos', 'La demo no te pide ningún dato personal. Si me escribes por correo, uso tu mensaje solo para responderte.'],
      ],
    },
    terms: {
      title: 'Términos',
      intro: 'Términos de uso breves de este sitio y su demo.',
      items: [
        ['La demo es una simulación', 'Todo lo de la demo en vivo está simulado con datos ficticios. No se ataca, bloquea ni investiga nada real.'],
        ['Límites', 'La demo limita cuántas alertas reales envía (una cada 10 minutos por visitante y un tope diario en total). Pasado el límite la simulación sigue y lo dice.'],
        ['Disponibilidad', 'El sitio y la demo se ofrecen tal cual, sin garantía de disponibilidad. La demo puede dejar de funcionar sin aviso.'],
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
      <Header lang={lang} />
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
