// Formulario de contacto adaptativo (correcciones 2, D4). Lógica pura y compartida: el cliente la usa para armar los pasos y avisar
// (comodidad); el servidor la usa como ÚNICA validación que cuenta (S14). Sin E/S, sin HTML: todo es texto llano.

export const INTENTS = ['web', 'bots', 'talk', 'other']
export const LANGS = ['es', 'en']

// Cada campo: tipo, valores cerrados o tope de longitud (en puntos de código) y si admite varias líneas.
export const FIELDS = {
  siteType: { kind: 'enum', values: ['info', 'shop', 'portfolio', 'other'] },
  budget: { kind: 'enum', values: ['lt300', '300-1000', '1000-3000', 'gt3000', 'unknown'] }, // USD, rangos neutros: no son tarifas de Dennys
  deadline: { kind: 'enum', values: ['urgent', '1m', '2-3m', 'flexible'] },
  assets: { kind: 'enum', values: ['yes', 'no', 'partial'] },
  automate: { kind: 'text', min: 1, max: 300 },
  where: { kind: 'enum', values: ['telegram', 'web', 'other'] },
  reason: { kind: 'enum', values: ['job', 'collab', 'consult', 'other'] },
  company: { kind: 'text', min: 0, max: 120, optional: true },
  reply: { kind: 'enum', values: ['email', 'video'] },
  name: { kind: 'text', min: 1, max: 80 },
  email: { kind: 'email', max: 254 },
  message: { kind: 'text', min: 0, max: 1500, multiline: true },
}

// Preguntas propias de cada opción, en orden: una pregunta por paso.
export const QUESTIONS = {
  web: ['siteType', 'budget', 'deadline', 'assets'],
  bots: ['automate', 'where', 'budget', 'deadline'],
  talk: ['reason', 'company', 'reply'],
  other: ['message'],
}

// Pasos de una ruta: opción → preguntas propias → datos de contacto → resumen y envío.
export const stepsFor = (intent) => (INTENTS.includes(intent) ? ['intent', ...QUESTIONS[intent], 'contact', 'send'] : ['intent'])
// Campos que pide el paso de contacto: en "Otra cosa" el mensaje ya fue la pregunta.
export const contactFields = (intent) => (intent === 'other' ? ['name', 'email'] : ['name', 'email', 'message'])
// Todos los campos que acepta (y exige o no) una ruta.
export const fieldsFor = (intent) => [...QUESTIONS[intent].filter((f) => f !== 'message'), ...contactFields(intent).filter((f) => f !== 'message'), 'message']
const requiredIn = (intent, f) => (f === 'message' ? intent === 'other' : !FIELDS[f].optional)

// Controles, separadores de línea y caracteres invisibles o bidireccionales (spoofing visual en el correo de quien lee).
const INVISIBLE = '\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u2064\\u2066-\\u2069\\ufeff'
const CONTROL = new RegExp(`[\\u0000-\\u001f\\u007f\\u0085\\u2028\\u2029${INVISIBLE}]`)
const CONTROL_ML = new RegExp(`[\\u0000-\\u0009\\u000b-\\u001f\\u007f\\u0085\\u2028\\u2029${INVISIBLE}]`)
const EMAIL = /^[^\s@<>"',;:()[\]\\]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/
const len = (s) => [...s].length

// Devuelve el valor normalizado o null si no vale. Los campos de una sola línea rechazan saltos y caracteres de control
// (nada de inyección de cabeceras: se rechaza, no se "limpia"); el mensaje admite saltos de línea pero ningún otro control.
export function checkField(name, raw) {
  const f = FIELDS[name]
  if (!f || typeof raw !== 'string') return null
  if (f.kind === 'enum') return f.values.includes(raw) ? raw : null
  const v = f.multiline ? raw.replace(/\r\n?/g, '\n').trim() : raw.trim()
  if ((f.multiline ? CONTROL_ML : CONTROL).test(v)) return null
  if (f.kind === 'email') return v.length <= f.max && EMAIL.test(v) ? v.toLowerCase() : null
  return len(v) >= f.min && len(v) <= f.max ? v : null
}

const fail = (fields) => ({ ok: false, fields })

// Cuerpo completo ya parseado: { intent, lang, turnstileToken, consent, …campos de la ruta }. Estricto: lo inesperado se rechaza.
export function validateContact(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return fail(['body'])
  const { intent } = data
  if (!INTENTS.includes(intent)) return fail(['intent'])
  const allowed = new Set(['intent', 'lang', 'turnstileToken', 'consent', ...fieldsFor(intent)])
  const extra = Object.keys(data).filter((k) => !allowed.has(k))
  if (extra.length) return fail(extra)
  const bad = []
  if (!LANGS.includes(data.lang)) bad.push('lang')
  if (typeof data.turnstileToken !== 'string' || data.turnstileToken.length < 1 || data.turnstileToken.length > 2048) bad.push('turnstileToken')
  if (data.consent !== true) bad.push('consent')
  const value = { intent, lang: data.lang, turnstileToken: data.turnstileToken }
  for (const f of fieldsFor(intent)) {
    if (!Object.hasOwn(data, f) || (data[f] === '' && !requiredIn(intent, f))) {
      if (requiredIn(intent, f)) bad.push(f)
      continue
    }
    const v = checkField(f, data[f])
    if (v === null || (v === '' && requiredIn(intent, f))) bad.push(f) // obligatorio y vacío (p. ej. el mensaje de "Otra cosa") no vale
    else if (v !== '') value[f] = v
  }
  return bad.length ? fail(bad) : { ok: true, value }
}

// Valida solo los campos de un paso (para avisar en el cliente antes de avanzar). Devuelve la lista de campos con problema.
export function validateStep(intent, step, values) {
  if (step === 'intent') return INTENTS.includes(values.intent) ? [] : ['intent']
  const fields = step === 'contact' ? contactFields(intent) : step === 'send' ? ['consent'] : [step]
  return fields.filter((f) => {
    if (f === 'consent') return values.consent !== true
    const raw = values[f] ?? ''
    if (raw === '' && !requiredIn(intent, f)) return false
    const v = checkField(f, raw)
    return v === null || (v === '' && requiredIn(intent, f))
  })
}

// Texto llano para entregar (correo o almacén). El asunto es fijo: jamás lleva texto del usuario (sin inyección de cabeceras).
export const SUBJECT = 'Contacto desde dennysh.com'
export function renderContact(value) {
  const lines = [`Opción: ${value.intent}`, `Idioma: ${value.lang}`]
  for (const f of fieldsFor(value.intent)) if (f !== 'message' && value[f] !== undefined) lines.push(`${f}: ${value[f]}`)
  const text = value.message ? `${lines.join('\n')}\n\nMensaje:\n${value.message}\n` : `${lines.join('\n')}\n`
  return { subject: SUBJECT, text, replyTo: value.email }
}
