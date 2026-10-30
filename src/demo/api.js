// Cliente de la API de la demo (AC-25, AC-28). Mismo origen, JSON, sin cookies; solo el eventId en sessionStorage.
export const STORAGE_KEY = 'demo-event-id'

function safeStorage() {
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

const kindFor = (status) => (status === 403 ? 'bot' : status === 400 || status === 413 || status === 415 ? 'input' : 'unavailable')

export function createClient({ fetch: fetchFn = globalThis.fetch.bind(globalThis), getToken, storage = safeStorage() }) {
  const store = {
    get: () => { try { return storage?.getItem(STORAGE_KEY) ?? null } catch { return null } },
    set: (v) => { try { storage?.setItem(STORAGE_KEY, v) } catch { /* sin almacenamiento: la demo sigue */ } },
    clear: () => { try { storage?.removeItem(STORAGE_KEY) } catch { /* idem */ } },
  }
  const json = async (url, init) => {
    try {
      const res = await fetchFn(url, { credentials: 'omit', ...init })
      let body = null
      try { body = await res.json() } catch { /* cuerpo vacío */ }
      return { status: res.status, body }
    } catch {
      return { status: 0, body: null }
    }
  }
  const post = (url, payload) => json(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })

  return {
    async simulate({ lang, scenario }) {
      let token
      try { token = await getToken() } catch { return { ok: false, kind: 'turnstile' } }
      const payload = { lang, ...(scenario ? { scenario } : {}), turnstileToken: token }
      const r = await post('/api/simulate', payload)
      if (r.status !== 200 || !r.body?.audit) return { ok: false, kind: kindFor(r.status) }
      store.set(r.body.eventId)
      return { ok: true, audit: r.body.audit }
    },

    async restore() {
      const id = store.get()
      if (!id) return null
      const r = await json(`/api/event/${encodeURIComponent(id)}`, { method: 'GET' })
      if (r.status === 200 && r.body?.audit) return { ok: true, audit: r.body.audit }
      if (r.status === 404) { store.clear(); return { ok: false, kind: 'expired' } }
      return { ok: false, kind: 'unavailable' }
    },

    async intervene(eventId, action) {
      const r = await post('/api/intervene', { eventId, action })
      if (r.status === 200 && r.body?.audit) return { ok: true, audit: r.body.audit }
      if (r.status === 409) return { ok: false, kind: 'limit' }
      if (r.status === 404) { store.clear(); return { ok: false, kind: 'expired' } }
      return { ok: false, kind: r.status === 400 ? 'input' : 'unavailable' }
    },
  }
}
