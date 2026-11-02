import { describe, it, expect } from 'vitest'
import { INTENTS, FIELDS, QUESTIONS, stepsFor, contactFields, fieldsFor, validateContact, validateStep, checkField, renderContact, SUBJECT } from '../../core/contact.js'

const base = { lang: 'es', turnstileToken: 'tok', consent: true, name: 'Ana', email: 'ana@example.com' }
const VALID = {
  web: { ...base, intent: 'web', siteType: 'shop', budget: '300-1000', deadline: '1m', assets: 'partial', message: 'Hola' },
  bots: { ...base, intent: 'bots', automate: 'Responder preguntas frecuentes', where: 'telegram', budget: 'unknown', deadline: 'flexible' },
  talk: { ...base, intent: 'talk', reason: 'job', company: 'Acme', reply: 'video' },
  other: { ...base, intent: 'other', message: 'Una pregunta' },
}
const bad = (over) => validateContact({ ...VALID.web, ...over })
const fieldsOf = (r) => (r.ok ? null : r.fields)

describe('validateContact: rutas válidas', () => {
  for (const [intent, data] of Object.entries(VALID)) {
    it(`${intent}: acepta y devuelve solo lo validado`, () => {
      const r = validateContact(data)
      expect(r.ok).toBe(true)
      expect(Object.keys(r.value).sort()).toEqual(Object.keys(data).filter((k) => k !== 'consent').sort())
    })
  }
  it('el correo se normaliza a minúsculas y se recortan los espacios; company vacío se omite', () => {
    const r = validateContact({ ...VALID.talk, email: 'Ana@Example.COM', name: '  Ana  ', company: '' })
    expect(r.value.email).toBe('ana@example.com'); expect(r.value.name).toBe('Ana'); expect(r.value.company).toBeUndefined()
  })
  it('el mensaje es opcional salvo en "Otra cosa"', () => {
    const { message: _m, ...noMsg } = VALID.web
    expect(validateContact(noMsg).ok).toBe(true)
    expect(fieldsOf(validateContact({ ...VALID.other, message: undefined }))).toEqual(['message'])
    expect(fieldsOf(validateContact({ ...VALID.other, message: '' }))).toEqual(['message']) // vacío tampoco vale
    expect(fieldsOf(validateContact({ ...VALID.other, message: '   ' }))).toEqual(['message'])
    const { message: _o, ...other } = VALID.other
    expect(fieldsOf(validateContact(other))).toEqual(['message'])
  })
})

describe('validateContact: rechaza lo inesperado (S14)', () => {
  it.each([[null], [[]], ['x'], [3], [undefined]])('cuerpo no objeto: %j', (b) => expect(validateContact(b).ok).toBe(false))
  it.each([[undefined], ['hack'], [''], [3], [null], ['WEB']])('opción desconocida: %j', (intent) => expect(validateContact({ ...VALID.web, intent }).ok).toBe(false))
  it('campos de más, incluidos los de otra opción y las claves peligrosas', () => {
    expect(fieldsOf(bad({ extra: 1 }))).toEqual(['extra'])
    expect(fieldsOf(bad({ automate: 'x' }))).toEqual(['automate']) // pregunta de "bots" en la ruta "web"
    expect(fieldsOf(validateContact({ ...VALID.other, budget: 'unknown' }))).toEqual(['budget'])
    expect(validateContact(JSON.parse('{"intent":"other","lang":"es","turnstileToken":"t","consent":true,"name":"a","email":"a@b.co","message":"m","__proto__":{"x":1}}')).ok).toBe(false)
    expect(validateContact({ ...VALID.web, constructor: 'x' }).ok).toBe(false)
  })
  it('falta cualquier campo obligatorio de cada ruta', () => {
    for (const [intent, data] of Object.entries(VALID)) {
      for (const k of ['lang', 'turnstileToken', 'consent', 'name', 'email', ...QUESTIONS[intent].filter((q) => !FIELDS[q].optional)]) {
        const { [k]: _gone, ...rest } = data
        expect(validateContact(rest).ok, `${intent} sin ${k}`).toBe(false)
      }
    }
  })
  it('cada lista cerrada rechaza un valor fuera de la lista (y tipos que no son texto)', () => {
    for (const [f, def] of Object.entries(FIELDS)) {
      if (def.kind !== 'enum') continue
      for (const v of ['otro', '', def.values[0].toUpperCase(), 1, null, true, [def.values[0]], { x: 1 }]) expect(checkField(f, v), `${f}=${JSON.stringify(v)}`).toBeNull()
      for (const v of def.values) expect(checkField(f, v)).toBe(v)
    }
  })
  it('las listas cerradas del spec, literales y completas', () => {
    expect(FIELDS.siteType.values).toEqual(['info', 'shop', 'portfolio', 'other'])
    expect(FIELDS.deadline.values).toEqual(['urgent', '1m', '2-3m', 'flexible'])
    expect(FIELDS.assets.values).toEqual(['yes', 'no', 'partial'])
    expect(FIELDS.where.values).toEqual(['telegram', 'web', 'other'])
    expect(FIELDS.reason.values).toEqual(['job', 'collab', 'consult', 'other'])
    expect(FIELDS.reply.values).toEqual(['email', 'video'])
    expect(INTENTS).toEqual(['web', 'bots', 'talk', 'other'])
    expect(fieldsOf(validateContact({ ...VALID.talk, reply: 'phone' }))).toEqual(['reply'])
  })
  it('correo: tope de 254 caracteres exacto', () => {
    const mk = (total) => { const local = 'a'; const rest = total - local.length - 1; const labels = []; let left = rest; while (left > 63 + 1) { labels.push('b'.repeat(63)); left -= 64 } labels.push('b'.repeat(left - 0)); return `${local}@${labels.join('.')}` }
    const e254 = mk(254), e255 = mk(255)
    expect(e254.length).toBe(254); expect(e255.length).toBe(255)
    expect(checkField('email', e254)).not.toBeNull()
    expect(checkField('email', e255)).toBeNull()
  })
  it('consentimiento: solo true booleano', () => {
    for (const c of [false, 'true', 1, null, undefined]) expect(fieldsOf(bad({ consent: c }))).toEqual(['consent'])
  })
  it('idioma y token de Turnstile', () => {
    expect(fieldsOf(bad({ lang: 'fr' }))).toEqual(['lang'])
    expect(fieldsOf(bad({ turnstileToken: '' }))).toEqual(['turnstileToken'])
    expect(fieldsOf(bad({ turnstileToken: 't'.repeat(2049) }))).toEqual(['turnstileToken'])
    expect(bad({ turnstileToken: 't'.repeat(2048) }).ok).toBe(true)
    expect(fieldsOf(bad({ turnstileToken: 5 }))).toEqual(['turnstileToken'])
  })
  it('longitudes en los límites (puntos de código, no unidades UTF-16)', () => {
    const lim = (f, n, ch = 'a') => checkField(f, ch.repeat(n))
    expect(lim('name', 80)).not.toBeNull(); expect(lim('name', 81)).toBeNull(); expect(checkField('name', '')).toBeNull(); expect(checkField('name', '   ')).toBeNull()
    expect(lim('company', 120)).not.toBeNull(); expect(lim('company', 121)).toBeNull()
    expect(lim('automate', 300)).not.toBeNull(); expect(lim('automate', 301)).toBeNull(); expect(checkField('automate', '')).toBeNull()
    expect(lim('message', 1500)).not.toBeNull(); expect(lim('message', 1501)).toBeNull()
    expect(lim('name', 80, '😀')).not.toBeNull() // 80 emojis = 80 puntos de código (160 unidades)
    expect(lim('name', 81, '😀')).toBeNull()
  })
  it('correo: formas válidas e inválidas', () => {
    for (const ok of ['a@b.co', 'ana.perez+x@sub.example.org', 'a_b-c@ex-ample.io']) expect(checkField('email', ok), ok).not.toBeNull()
    for (const no of ['', 'a', 'a@b', 'a@@b.co', 'a b@c.co', 'a@b..co', 'a@-b.co', 'a@b.co ,x@y.co', '<a>@b.co', '"a"@b.co', 'a@b.co\nBcc: x@y.co', `${'a'.repeat(65)}@b.co`, `a@${'b'.repeat(250)}.co`, 'a@b.c o']) expect(checkField('email', no), JSON.stringify(no)).toBeNull()
  })
  it('inyección de saltos de línea y controles: se RECHAZA en todo campo de una sola línea', () => {
    for (const f of ['name', 'company', 'automate']) {
      for (const ch of ['\n', '\r', '\r\n', ' ', ' ', '\u0085', '\u0000', '\u0008', '\u001b', '\u007f', '\t']) {
        expect(checkField(f, `a${ch}Bcc: x@y.co`), `${f} ${JSON.stringify(ch)}`).toBeNull()
      }
    }
    expect(fieldsOf(bad({ name: 'Ana\r\nBcc: evil@x.co' }))).toEqual(['name'])
  })
  it('caracteres invisibles y bidireccionales (spoofing visual en el correo) se rechazan en todos los campos de texto', () => {
    for (const ch of ['\u202e', '\u202a', '\u2066', '\u2069', '\u200b', '\u200d', '\u200f', '\u2060', '\ufeff']) {
      for (const f of ['name', 'company', 'automate', 'message']) expect(checkField(f, `a${ch}b`), `${f} ${ch.codePointAt(0).toString(16)}`).toBeNull()
    }
    expect(checkField('name', 'José Ñandú 山田')).not.toBeNull() // acentos y otros alfabetos siguen valiendo
  })
  it('el mensaje admite saltos de línea (normalizados) pero ningún otro carácter de control', () => {
    expect(checkField('message', 'a\r\nb\rc\nd')).toBe('a\nb\nc\nd')
    for (const ch of ['\u0000', '\u0008', '\u001b', '\u007f', ' ', '\u0085']) expect(checkField('message', `a${ch}b`), JSON.stringify(ch)).toBeNull()
  })
  it('el HTML llega como texto y no se interpreta ni se altera (solo se escapa al mostrarlo)', () => {
    expect(checkField('message', '<img src=x onerror=alert(1)>')).toBe('<img src=x onerror=alert(1)>')
    expect(renderContact(validateContact({ ...VALID.other, message: '<b>hola</b>' }).value).text).toContain('<b>hola</b>')
  })
})

describe('lógica de pasos: cada ruta llega al final y las preguntas dependen de la opción', () => {
  it('rutas exactas del spec', () => {
    expect(stepsFor('web')).toEqual(['intent', 'siteType', 'budget', 'deadline', 'assets', 'contact', 'send'])
    expect(stepsFor('bots')).toEqual(['intent', 'automate', 'where', 'budget', 'deadline', 'contact', 'send'])
    expect(stepsFor('talk')).toEqual(['intent', 'reason', 'company', 'reply', 'contact', 'send'])
    expect(stepsFor('other')).toEqual(['intent', 'message', 'contact', 'send'])
  })
  it('sin opción solo existe el primer paso; opciones raras tampoco abren pasos', () => {
    for (const x of [null, undefined, '', 'hack', 3]) expect(stepsFor(x)).toEqual(['intent'])
  })
  it('las preguntas propias difieren entre opciones y todas terminan en contacto y envío', () => {
    const sets = INTENTS.map((i) => QUESTIONS[i].join(','))
    expect(new Set(sets).size).toBe(4)
    for (const i of INTENTS) { const s = stepsFor(i); expect(s.slice(-2)).toEqual(['contact', 'send']); expect(s[0]).toBe('intent') }
  })
  it('presupuesto y plazo aparecen en web y en bots; el dominio solo en web; la empresa solo al hablar conmigo', () => {
    expect(stepsFor('web')).toEqual(expect.arrayContaining(['budget', 'deadline', 'assets']))
    expect(stepsFor('bots')).toEqual(expect.arrayContaining(['budget', 'deadline', 'where', 'automate']))
    expect(stepsFor('bots')).not.toContain('assets')
    for (const i of ['web', 'bots', 'other']) expect(stepsFor(i)).not.toContain('company')
    expect(stepsFor('talk')).toContain('company')
  })
  it('el paso de contacto pide mensaje opcional, salvo en "Otra cosa" donde el mensaje ya fue la pregunta', () => {
    expect(contactFields('web')).toEqual(['name', 'email', 'message']); expect(contactFields('other')).toEqual(['name', 'email'])
  })
  it('fieldsFor(ruta) coincide con lo que el servidor acepta: nada más y nada menos', () => {
    for (const i of INTENTS) {
      const r = validateContact(VALID[i])
      expect(r.ok).toBe(true)
      for (const k of Object.keys(VALID[i])) if (!['lang', 'turnstileToken', 'consent', 'intent'].includes(k)) expect(fieldsFor(i)).toContain(k)
    }
  })
  it('rangos de presupuesto neutros en USD, sin tarifas de Dennys', () => {
    expect(FIELDS.budget.values).toEqual(['lt300', '300-1000', '1000-3000', 'gt3000', 'unknown'])
  })
  it('validateStep: cada paso valida solo lo suyo', () => {
    expect(validateStep(null, 'intent', {})).toEqual(['intent'])
    expect(validateStep('web', 'intent', { intent: 'web' })).toEqual([])
    expect(validateStep('web', 'budget', {})).toEqual(['budget'])
    expect(validateStep('web', 'budget', { budget: 'unknown' })).toEqual([])
    expect(validateStep('talk', 'company', {})).toEqual([]) // opcional
    expect(validateStep('talk', 'company', { company: 'a\nb' })).toEqual(['company'])
    expect(validateStep('bots', 'automate', { automate: '  ' })).toEqual(['automate'])
    expect(validateStep('web', 'contact', { name: 'Ana' })).toEqual(['email'])
    expect(validateStep('web', 'contact', { name: 'Ana', email: 'ana@example.com', message: '' })).toEqual([])
    expect(validateStep('other', 'message', { message: '' })).toEqual(['message'])
    expect(validateStep('web', 'send', { consent: false })).toEqual(['consent'])
    expect(validateStep('web', 'send', { consent: true })).toEqual([])
  })
  it('recorrer cada ruta paso a paso con respuestas válidas termina en un cuerpo que el servidor acepta', () => {
    for (const i of INTENTS) {
      const values = { ...VALID[i], consent: true }
      for (const step of stepsFor(i)) expect(validateStep(i, step, values), `${i}:${step}`).toEqual([])
      expect(validateContact(values).ok).toBe(true)
    }
  })
})

describe('renderContact: texto llano, asunto fijo', () => {
  it('el asunto es siempre el mismo y nunca lleva datos del usuario', () => {
    for (const i of INTENTS) {
      const out = renderContact(validateContact(VALID[i]).value)
      expect(out.subject).toBe(SUBJECT)
      expect(out.subject).not.toMatch(/Ana|ana@|\n/)
      expect(out.replyTo).toBe('ana@example.com')
    }
  })
  it('ninguna línea de campo contiene saltos extra: las líneas son exactamente las esperadas', () => {
    const out = renderContact(validateContact(VALID.talk).value)
    expect(out.text.split('\n')).toEqual(['Opción: talk', 'Idioma: es', 'reason: job', 'company: Acme', 'reply: video', 'name: Ana', 'email: ana@example.com', ''])
  })
  it('el mensaje va al final, tras una línea en blanco', () => {
    const out = renderContact(validateContact({ ...VALID.web, message: 'a\nb' }).value)
    expect(out.text.endsWith('\n\nMensaje:\na\nb\n')).toBe(true)
  })
})
