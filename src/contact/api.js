// Cliente de /api/contact (correcciones 2, D4). Mismo origen, JSON, sin cookies. Nunca expone el cuerpo del servidor: solo un estado.
const kindFor = (status, code) => {
  if (status === 200) return 'sent'
  if (status === 429) return 'rate'
  if (status === 403) return 'bot'
  if (status === 400 || status === 413 || status === 415) return 'input'
  if (status === 503 && code === 'E_DISABLED') return 'disabled'
  return 'unavailable'
}

export function createContactClient({ fetch: fetchFn = globalThis.fetch?.bind(globalThis) } = {}) {
  return {
    // ¿Está activo el formulario? Cualquier fallo cuenta como "no".
    async status() {
      try {
        const res = await fetchFn('/api/contact', { credentials: 'omit' })
        const body = res.ok ? await res.json() : null
        return body?.enabled === true
      } catch {
        return false
      }
    },
    async send(payload) {
      try {
        const res = await fetchFn('/api/contact', { method: 'POST', credentials: 'omit', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
        let body = null
        try { body = await res.json() } catch { /* cuerpo vacío */ }
        const kind = kindFor(res.status, body?.code)
        return { ok: kind === 'sent', kind }
      } catch {
        return { ok: false, kind: 'unavailable' }
      }
    },
  }
}
