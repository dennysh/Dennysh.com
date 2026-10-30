// Formato de horas y textos de la demo. Puro (AC-19): toda hora llega en UTC desde el servidor.
import explanations from '../../content/explanations/v1.json'

const valid = (iso) => typeof iso === 'string' && !Number.isNaN(Date.parse(iso))
const hms = (iso, timeZone) =>
  new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(iso))

export const utcLabel = (iso) => (valid(iso) ? `${new Date(iso).toISOString().slice(11, 23)} UTC` : '—')

export function offsetLabel(iso, timeZone) {
  if (!valid(iso)) return 'UTC'
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(new Date(iso)).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part)
  if (!m) return 'UTC+0'
  const h = String(Number(m[2]))
  return `UTC${m[1]}${h}${m[3] === '00' ? '' : `:${m[3]}`}`
}

export const localLabel = (iso, _lang, timeZone) => (valid(iso) ? `${hms(iso, timeZone)} (${offsetLabel(iso, timeZone)})` : '—')
export const hhmmLocal = (iso, timeZone) => (valid(iso) ? hms(iso, timeZone).slice(0, 5) : '—')

// Los marcadores {thresholds.x} / {observed.x} solo aceptan números (nunca texto libre ni HTML).
export function fillTemplate(text, params) {
  return text.replace(/\{(thresholds|observed)\.(\w+)\}/g, (_m, group, key) => {
    const v = params?.[group]?.[key]
    return typeof v === 'number' && Number.isFinite(v) ? String(v) : '—'
  })
}

export function explanationText(ref, lang) {
  const t = explanations.templates.find((x) => x.id === ref?.templateId)
  return t?.text?.[lang] ? fillTemplate(t.text[lang], ref.params) : ''
}
