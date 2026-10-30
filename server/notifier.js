// Adaptador de Telegram (puerto Notifier). Destino fijo; "Delivered" solo con ok:true y message_id (AC-06, AC-21).
// Nunca devuelve cuerpos del proveedor, mensajes de error ni el token. Sin parse_mode (S15).
import { timedFetch, readJson } from './http.js'

export const maskChat = (chatId) => `••••${String(chatId ?? '').replace(/\D/g, '').slice(-2)}`

const codeFor = (status, bodyCode) => {
  const c = bodyCode ?? status
  if (c === 429) return 'rate_limited'
  if (c >= 500) return 'server_error'
  return 'rejected'
}

export function createTelegramNotifier({ token, chatId, fetch: fetchFn = globalThis.fetch, timeoutMs = 4000, dryRun = false }) {
  const configured = Boolean(token && chatId)
  const call = (method, payload) =>
    timedFetch(
      fetchFn,
      `https://api.telegram.org/bot${token}/${method}`,
      { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, ...payload, disable_web_page_preview: true }) },
      timeoutMs,
    )

  return {
    timeoutMs,

    async send(text) {
      if (dryRun || !configured) return { kind: 'NotSent', reason: dryRun ? 'modo prueba' : 'sin configurar' }
      const out = await call('sendMessage', { text })
      if (out.timedOut) return { kind: 'Unconfirmed' }
      if (!out.res) return { kind: 'Failed', code: 'network' }
      const data = await readJson(out.res)
      if (!out.res.ok || data?.ok !== true) return { kind: 'Failed', code: codeFor(out.res.status, data?.error_code) }
      const id = data.result?.message_id
      if (!Number.isInteger(id)) return { kind: 'Failed', code: 'bad_response' }
      return { kind: 'Delivered', messageId: id }
    },

    async edit(messageId, text) {
      if (dryRun || !configured) return { kind: 'Failed', code: 'not_sent' }
      if (!Number.isInteger(messageId) || messageId <= 0) return { kind: 'Failed', code: 'bad_message_id' }
      const out = await call('editMessageText', { message_id: messageId, text })
      if (out.timedOut) return { kind: 'Failed', code: 'timeout' }
      if (!out.res) return { kind: 'Failed', code: 'network' }
      const data = await readJson(out.res)
      if (!out.res.ok || data?.ok !== true) return { kind: 'Failed', code: codeFor(out.res.status, data?.error_code) }
      return { kind: 'Edited' }
    },
  }
}
