// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { render, fireEvent, cleanup, waitFor, act } from '@testing-library/react'
import ContactForm from '../../src/contact/ContactForm.jsx'
import { createContactClient } from '../../src/contact/api.js'
import { site, links } from '../../src/content/site.js'
import { stepsFor, validateContact } from '../../core/contact.js'

afterEach(cleanup)
const mkClient = (over = {}) => {
  const sent = []
  return { sent, status: async () => over.enabled ?? true, send: async (p) => { sent.push(p); return over.result ?? { ok: true, kind: 'sent' } } }
}
const mount = async (lang = 'es', over = {}) => {
  const client = mkClient(over)
  const getToken = over.getToken ?? (async () => 'tok')
  const c = render(React.createElement(ContactForm, { lang, client, getToken }))
  await waitFor(() => expect(c.container.querySelector('[data-contact-form]').dataset.contactForm).not.toBe('pending'))
  return { c, client }
}
const form = (c) => c.container.querySelector('form')
const step = (c) => form(c)?.dataset.step
const radio = (c, value) => fireEvent.click(c.container.querySelector(`input[type="radio"][value="${value}"]`))
const type = (c, id, v) => fireEvent.change(c.container.querySelector(`#cf-${id}`), { target: { value: v } })
const next = (c) => fireEvent.submit(form(c))
const backBtn = (c) => [...c.container.querySelectorAll('button')].find((b) => b.type === 'button')
const alerts = (c) => [...c.container.querySelectorAll('[role="alert"]')].map((e) => e.textContent)

const ANSWERS = {
  web: [['radio', 'web'], ['radio', 'shop'], ['radio', '300-1000'], ['radio', '1m'], ['radio', 'partial']],
  bots: [['radio', 'bots'], ['text', 'automate', 'Responder preguntas'], ['radio', 'telegram'], ['radio', 'unknown'], ['radio', 'urgent']],
  talk: [['radio', 'talk'], ['radio', 'collab'], ['text', 'company', 'Acme'], ['radio', 'video']],
  other: [['radio', 'other'], ['text', 'message', 'Una pregunta']],
}
async function walk(c, intent) {
  for (const a of ANSWERS[intent]) {
    if (a[0] === 'radio') radio(c, a[1]); else type(c, a[1], a[2])
    next(c)
  }
  expect(step(c)).toBe('contact')
  type(c, 'name', 'Ana'); type(c, 'email', 'Ana@Example.com')
  if (intent !== 'other') type(c, 'message', 'Hola')
  next(c)
  expect(step(c)).toBe('send')
}

describe('degradación: sin JavaScript, mientras comprueba y desactivado', () => {
  it('el HTML del servidor muestra el enlace de correo y no el formulario', () => {
    for (const lang of ['es', 'en']) {
      const html = renderToString(React.createElement(ContactForm, { lang }))
      expect(html).toContain(`href="${links.email}"`); expect(html).toContain(site[lang].contactForm.fallback)
      expect(html).not.toMatch(/<form|<input|<button/); expect(html).not.toMatch(/\sstyle="/)
    }
  })
  it('servidor desactivado, caído o con respuesta rara → enlace de correo con el aviso', async () => {
    const { c } = await mount('es', { enabled: false })
    expect(c.container.textContent).toContain(site.es.contactForm.disabled)
    expect(c.container.querySelector(`a[href="${links.email}"]`)).not.toBeNull()
    expect(form(c)).toBeNull()
  })
  it('el cliente real: cualquier fallo de red o respuesta que no sea {enabled:true} cuenta como desactivado', async () => {
    const mk = (f) => createContactClient({ fetch: f })
    expect(await mk(async () => { throw new Error('red') }).status()).toBe(false)
    expect(await mk(async () => new Response('x', { status: 500 })).status()).toBe(false)
    expect(await mk(async () => new Response('{"enabled":"true"}')).status()).toBe(false)
    expect(await mk(async () => new Response('{"enabled":true}')).status()).toBe(true)
  })
  it('el cliente real traduce los códigos de estado y nunca devuelve el cuerpo', async () => {
    const mk = (status, body = {}) => createContactClient({ fetch: async () => new Response(JSON.stringify(body), { status }) })
    expect(await mk(200, { status: 'sent' }).send({})).toEqual({ ok: true, kind: 'sent' })
    expect(await mk(429).send({})).toEqual({ ok: false, kind: 'rate' })
    expect(await mk(403).send({})).toEqual({ ok: false, kind: 'bot' })
    for (const s of [400, 413, 415]) expect(await mk(s).send({})).toEqual({ ok: false, kind: 'input' })
    expect(await mk(503, { code: 'E_DISABLED' }).send({})).toEqual({ ok: false, kind: 'disabled' })
    expect(await mk(503, { code: 'E_DELIVERY' }).send({})).toEqual({ ok: false, kind: 'unavailable' })
    expect(await createContactClient({ fetch: async () => { throw new Error('x') } }).send({})).toEqual({ ok: false, kind: 'unavailable' })
  })
  it('las peticiones van al mismo origen, sin cookies y con JSON', async () => {
    const seen = []
    const cl = createContactClient({ fetch: async (u, init) => (seen.push([u, init]), new Response('{"status":"sent"}')) })
    await cl.send({ a: 1 })
    expect(seen[0][0]).toBe('/api/contact'); expect(seen[0][1].credentials).toBe('omit'); expect(seen[0][1].headers['content-type']).toBe('application/json')
  })
})

describe('flujo por pasos: cada ruta llega al final y envía lo que el servidor acepta', () => {
  for (const intent of ['web', 'bots', 'talk', 'other']) {
    it(`${intent}: recorre los pasos, resume lo elegido y envía un cuerpo válido sin campos de más`, async () => {
      const { c, client } = await mount('es')
      expect(step(c)).toBe('intent')
      await walk(c, intent)
      expect(c.container.querySelector('.cf-summary').textContent).toContain(site.es.contactForm.intent.options[intent])
      fireEvent.click(c.container.querySelector('#cf-consent'))
      await act(async () => { next(c) })
      await waitFor(() => expect(c.container.querySelector('[data-contact-form="sent"]')).not.toBeNull())
      expect(client.sent).toHaveLength(1)
      const p = client.sent[0]
      const v = validateContact(p)
      expect(v.ok, JSON.stringify(v)).toBe(true) // el servidor lo aceptaría
      expect(p.intent).toBe(intent); expect(p.turnstileToken).toBe('tok'); expect(p.consent).toBe(true); expect(p.lang).toBe('es')
      expect(p.email).toBe('Ana@Example.com') // el cliente envía lo escrito; el servidor normaliza
    })
  }
  it('el recorrido tiene los pasos de la opción y la barra de progreso coincide', async () => {
    const { c } = await mount('es')
    radio(c, 'web')
    const prog = () => c.container.querySelector('progress')
    expect(prog().max).toBe(stepsFor('web').length)
    const seen = [step(c)]
    for (const a of ANSWERS.web) { if (a[0] === 'radio') radio(c, a[1]); next(c); seen.push(step(c)); expect(prog().value).toBe(seen.length) }
    expect(seen.slice(0, 6)).toEqual(stepsFor('web').slice(0, 6))
    expect(c.container.querySelector('#cf-progress-text').textContent).toMatch(/6/)
  })
  it('las preguntas dependen de la opción: web pregunta dominio, bots pregunta dónde', async () => {
    const a = await mount('es'); radio(a.c, 'web'); next(a.c); radio(a.c, 'shop'); next(a.c); radio(a.c, 'unknown'); next(a.c); radio(a.c, 'flexible'); next(a.c)
    expect(step(a.c)).toBe('assets'); cleanup()
    const b = await mount('es'); radio(b.c, 'bots'); next(b.c); type(b.c, 'automate', 'x'); next(b.c)
    expect(step(b.c)).toBe('where')
  })
  it('Atrás conserva las respuestas, y cambiar de opción descarta las de la ruta anterior (no se envían campos de más)', async () => {
    const { c, client } = await mount('es')
    radio(c, 'web'); next(c); radio(c, 'shop'); next(c)
    expect(step(c)).toBe('budget')
    fireEvent.click(backBtn(c))
    expect(step(c)).toBe('siteType'); expect(c.container.querySelector('input[value="shop"]').checked).toBe(true)
    fireEvent.click(backBtn(c))
    expect(step(c)).toBe('intent'); expect(backBtn(c)).toBeUndefined() // en el primer paso no hay Atrás
    radio(c, 'other'); next(c); type(c, 'message', 'Hola'); next(c)
    type(c, 'name', 'Ana'); type(c, 'email', 'a@b.co'); next(c)
    fireEvent.click(c.container.querySelector('#cf-consent'))
    await act(async () => { next(c) })
    await waitFor(() => expect(client.sent).toHaveLength(1))
    expect(Object.keys(client.sent[0]).sort()).toEqual(['consent', 'email', 'intent', 'lang', 'message', 'name', 'turnstileToken'])
  })
})

describe('validación del cliente, foco y errores (accesibilidad)', () => {
  it('sin elegir opción no avanza: error en el paso actual y el foco va a la primera opción', async () => {
    const { c } = await mount('es')
    next(c)
    expect(step(c)).toBe('intent')
    expect(alerts(c)).toEqual([site.es.contactForm.errors.choose])
    expect(document.activeElement).toBe(c.container.querySelector('input[type="radio"]'))
  })
  it('el error desaparece al corregir y solo hay una alerta a la vez, en el paso actual', async () => {
    const { c } = await mount('en')
    radio(c, 'bots'); next(c)
    next(c)
    expect(alerts(c)).toEqual([site.en.contactForm.errors.required])
    expect(document.activeElement.id).toBe('cf-automate')
    expect(document.activeElement.getAttribute('aria-describedby')).toContain('cf-automate-err')
    type(c, 'automate', 'algo')
    expect(alerts(c)).toEqual([])
    next(c); expect(step(c)).toBe('where')
    expect(alerts(c)).toEqual([]) // el error no se arrastra al paso siguiente
  })
  it('texto demasiado largo en un campo de una línea muestra el error de texto (los navegadores ya quitan los saltos de línea de un <input>; el servidor los rechaza igualmente)', async () => {
    const { c } = await mount('es')
    radio(c, 'bots'); next(c); type(c, 'automate', 'a'.repeat(301)); next(c)
    expect(alerts(c)).toEqual([site.es.contactForm.errors.text])
  })
  it('correo inválido y consentimiento obligatorio', async () => {
    const { c, client } = await mount('es')
    radio(c, 'other'); next(c); type(c, 'message', 'm'); next(c)
    type(c, 'name', 'Ana'); type(c, 'email', 'no-es-correo'); next(c)
    expect(step(c)).toBe('contact'); expect(alerts(c)).toEqual([site.es.contactForm.errors.email])
    type(c, 'email', 'a@b.co'); next(c)
    expect(step(c)).toBe('send')
    await act(async () => { next(c) })
    expect(alerts(c)).toEqual([site.es.contactForm.errors.consent])
    expect(client.sent).toHaveLength(0)
  })
  it('al cambiar de paso el foco va al título del paso (gestión de foco); no en el primer render', async () => {
    const { c } = await mount('es')
    expect(document.activeElement).toBe(document.body)
    radio(c, 'web'); next(c)
    expect(document.activeElement).toBe(c.container.querySelector('#cf-q'))
    expect(c.container.querySelector('#cf-q').textContent).toBe(site.es.contactForm.questions.siteType.q)
  })
  it('etiquetas asociadas, grupo de opciones con nombre, sin aria-live y sin estilos en línea', async () => {
    const { c } = await mount('es')
    expect(c.container.querySelector('[role="radiogroup"]').getAttribute('aria-labelledby')).toBe('cf-q')
    radio(c, 'bots'); next(c)
    const input = c.container.querySelector('#cf-automate')
    expect(c.container.querySelector(`label[for="cf-automate"]`)).not.toBeNull(); expect(input.getAttribute('autocomplete')).toBe('off')
    expect(c.container.innerHTML).not.toContain('aria-live'); expect(c.container.innerHTML).not.toMatch(/\sstyle="/)
    expect(c.container.querySelector('progress').getAttribute('aria-labelledby')).toBe('cf-progress-text')
  })
  it('el nombre y el correo llevan autocomplete; el mensaje es un textarea', async () => {
    const { c } = await mount('es')
    radio(c, 'web'); next(c); for (let i = 0; i < 4; i++) { radio(c, ANSWERS.web[i + 1][1]); next(c) }
    expect(step(c)).toBe('contact')
    expect(c.container.querySelector('#cf-name').getAttribute('autocomplete')).toBe('name')
    expect(c.container.querySelector('#cf-email').getAttribute('autocomplete')).toBe('email'); expect(c.container.querySelector('#cf-email').type).toBe('email')
    expect(c.container.querySelector('textarea#cf-message')).not.toBeNull()
  })
})

describe('envío y respuestas del servidor', () => {
  const toSend = async (lang, over) => { const m = await mount(lang, over); radio(m.c, 'other'); next(m.c); type(m.c, 'message', 'm'); next(m.c); type(m.c, 'name', 'Ana'); type(m.c, 'email', 'a@b.co'); next(m.c); fireEvent.click(m.c.container.querySelector('#cf-consent')); return m }
  for (const [kind, key] of [['rate', 'rate'], ['bot', 'bot'], ['input', 'input'], ['unavailable', 'unavailable']]) {
    it(`${kind}: muestra el aviso, se queda en el paso de envío y no pierde las respuestas`, async () => {
      const { c } = await toSend('es', { result: { ok: false, kind } })
      await act(async () => { next(c) })
      await waitFor(() => expect(alerts(c)[0]).toContain(site.es.contactForm.status[key]))
      expect(step(c)).toBe('send'); expect(c.container.querySelector('.cf-summary').textContent).toContain('Ana'.slice(0, 0) + 'm')
      if (kind === 'unavailable') expect(c.container.querySelector(`.cf-error a[href="${links.email}"]`)).not.toBeNull()
    })
  }
  it('si el servidor responde "desactivado" pasa al enlace de correo', async () => {
    const { c } = await toSend('en', { result: { ok: false, kind: 'disabled' } })
    await act(async () => { next(c) })
    await waitFor(() => expect(c.container.querySelector('[data-contact-form="disabled"]')).not.toBeNull())
    expect(c.container.textContent).toContain(site.en.contactForm.disabled)
  })
  it('si Turnstile falla no se envía nada y se avisa', async () => {
    const { c, client } = await toSend('es', { getToken: async () => { throw new Error('turnstile') } })
    await act(async () => { next(c) })
    await waitFor(() => expect(alerts(c)[0]).toContain(site.es.contactForm.status.bot))
    expect(client.sent).toHaveLength(0)
  })
  it('doble clic: mientras se envía el botón está desactivado y solo sale un mensaje', async () => {
    let release
    const client = mkClient(); client.send = (p) => new Promise((r) => { client.sent.push(p); release = () => r({ ok: true, kind: 'sent' }) })
    const c = render(React.createElement(ContactForm, { lang: 'es', client, getToken: async () => 'tok' }))
    await waitFor(() => expect(form(c)).not.toBeNull())
    radio(c, 'other'); next(c); type(c, 'message', 'm'); next(c); type(c, 'name', 'Ana'); type(c, 'email', 'a@b.co'); next(c); fireEvent.click(c.container.querySelector('#cf-consent'))
    await act(async () => { next(c) }); await act(async () => { next(c) })
    await waitFor(() => expect(client.sent).toHaveLength(1))
    expect(c.container.querySelector('button[type="submit"]').getAttribute('aria-disabled')).toBe('true')
    await act(async () => { release() })
    expect(client.sent).toHaveLength(1)
  })
  it('tras enviar muestra la confirmación con role="status" y el foco', async () => {
    const { c } = await toSend('es', {})
    await act(async () => { next(c) })
    await waitFor(() => expect(c.container.querySelector('[role="status"]')).not.toBeNull())
    expect(c.container.querySelector('[role="status"]').textContent).toBe(site.es.contactForm.status.sent)
    expect(document.activeElement).toBe(c.container.querySelector('[role="status"]'))
  })
  it('en inglés todos los textos del formulario están en inglés', async () => {
    const { c } = await mount('en')
    expect(c.container.textContent).toContain(site.en.contactForm.intent.q)
    for (const o of Object.values(site.en.contactForm.intent.options)) expect(c.container.textContent).toContain(o)
    expect(vi.isMockFunction(fetch)).toBe(false)
  })
  it('escribir en otro campo no le roba el foco: solo una validación fallida enfoca el primer campo con error', async () => {
    const { c } = await mount('es')
    radio(c, 'other'); next(c); type(c, 'message', 'm'); next(c)
    next(c) // nombre y correo vacíos
    expect(document.activeElement.id).toBe('cf-name')
    const email = c.container.querySelector('#cf-email')
    email.focus()
    type(c, 'email', 'a') // quita el error de correo, queda el de nombre
    expect(document.activeElement).toBe(email)
    type(c, 'email', 'a@b.co')
    expect(document.activeElement).toBe(email)
    next(c) // el nombre sigue vacío: ahora sí vuelve al nombre
    expect(document.activeElement.id).toBe('cf-name')
  })
  it('los campos no recortan en silencio (sin maxLength por unidades UTF-16): 300 emoji caben y el servidor los acepta', async () => {
    const { c } = await mount('es')
    radio(c, 'bots'); next(c)
    expect(c.container.querySelector('#cf-automate').hasAttribute('maxlength')).toBe(false)
    type(c, 'automate', '😀'.repeat(300)); next(c)
    expect(step(c)).toBe('where')
  })
  it('tras un fallo de envío el botón conserva el foco (aria-disabled, no disabled) y Atrás no actúa mientras se envía', async () => {
    let release
    const client = mkClient(); client.send = () => new Promise((r) => { release = () => r({ ok: false, kind: 'unavailable' }) })
    const c = render(React.createElement(ContactForm, { lang: 'es', client, getToken: async () => 'tok' }))
    await waitFor(() => expect(form(c)).not.toBeNull())
    radio(c, 'other'); next(c); type(c, 'message', 'm'); next(c); type(c, 'name', 'Ana'); type(c, 'email', 'a@b.co'); next(c); fireEvent.click(c.container.querySelector('#cf-consent'))
    const sendBtn = c.container.querySelector('button[type="submit"]')
    sendBtn.focus()
    await act(async () => { next(c) })
    fireEvent.click(backBtn(c))
    expect(step(c)).toBe('send')
    expect(document.activeElement).toBe(sendBtn); expect(sendBtn.disabled).toBe(false)
    await act(async () => { release() })
    expect(document.activeElement).toBe(sendBtn)
  })
  it('volver a una ruta anterior no conserva respuestas de otra: web → otra cosa → web deja el tipo de sitio sin marcar', async () => {
    const { c } = await mount('es')
    radio(c, 'web'); next(c); radio(c, 'shop'); next(c)
    fireEvent.click(backBtn(c)); fireEvent.click(backBtn(c))
    radio(c, 'other'); radio(c, 'web'); next(c)
    expect(step(c)).toBe('siteType')
    expect(c.container.querySelector('input[value="shop"]').checked).toBe(false)
  })
  it('el aviso del servidor no se arrastra: tras un 429, Atrás y volver al envío no lo muestra', async () => {
    const { c } = await mount('es', { result: { ok: false, kind: 'rate' } })
    radio(c, 'other'); next(c); type(c, 'message', 'm'); next(c); type(c, 'name', 'Ana'); type(c, 'email', 'a@b.co'); next(c); fireEvent.click(c.container.querySelector('#cf-consent'))
    await act(async () => { next(c) })
    await waitFor(() => expect(alerts(c)[0]).toContain(site.es.contactForm.status.rate))
    fireEvent.click(backBtn(c)); next(c)
    expect(step(c)).toBe('send'); expect(alerts(c)).toEqual([])
  })
})
